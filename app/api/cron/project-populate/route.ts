import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const errors: string[] = [];
  let projectsProcessed = 0;
  let entriesCreated = 0;

  try {
    // Fetch all projects with topic_tags
    const { data: projects, error: projError } = await supabase
      .from("projects")
      .select("id, name, project_type, topic_tags")
      .not("topic_tags", "eq", "{}");

    if (projError) {
      errors.push(`Projects fetch error: ${projError.message}`);
      await logRun(0, 0, errors.join("; "));
      return NextResponse.json({ error: projError.message }, { status: 500 });
    }

    if (!projects || projects.length === 0) {
      console.log("[Project Populate] No projects with topic_tags found");
      await logRun(0, 0, null);
      return NextResponse.json({ projects_processed: 0, entries_created: 0 });
    }

    const h48 = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    for (const project of projects) {
      projectsProcessed++;

      try {
        // Find recent stories matching any of the project's topic tags
        const { data: stories } = await supabase
          .from("stories")
          .select("id, title, short_summary, source_name, link, topic, significance_score")
          .not("short_summary", "is", null)
          .gte("published_at", h48)
          .order("significance_score", { ascending: false })
          .limit(10);

        if (!stories || stories.length === 0) continue;

        // Filter stories that match project topic_tags
        const tags = project.topic_tags || [];
        const relevant = stories.filter(s => tags.includes(s.topic));
        if (relevant.length === 0) continue;

        // Check which stories already have entries for this project
        const storyIds = relevant.map(s => s.id);
        const { data: existing } = await supabase
          .from("project_auto_entries")
          .select("story_id")
          .eq("project_id", project.id)
          .in("story_id", storyIds);

        const existingIds = new Set((existing || []).map(e => e.story_id));
        const newStories = relevant.filter(s => !existingIds.has(s.id));
        if (newStories.length === 0) continue;

        // Ask Claude to generate entry content for each new story
        for (const story of newStories.slice(0, 5)) {
          try {
            const message = await anthropic.messages.create({
              model: "claude-sonnet-4-20250514",
              max_tokens: 300,
              system: "You are a research assistant for an ocean intelligence platform. Generate a brief project entry summarising why this story matters to the project. Return JSON only. No markdown.",
              messages: [{
                role: "user",
                content: `Project: "${project.name}" (type: ${project.project_type || "general"})\nStory: "${story.title}"\nSummary: ${story.short_summary}\nSource: ${story.source_name}\n\nReturn this exact JSON: { "entry_type": "development" or "evidence" or "deadline" or "context", "content": "1-2 sentence explanation of why this matters to the project" }`,
              }],
            });

            const text = message.content[0].type === "text" ? message.content[0].text : "";
            const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());

            const validTypes = new Set(["development", "evidence", "deadline", "context"]);
            const entryType = validTypes.has(parsed.entry_type) ? parsed.entry_type : "context";
            const content = (parsed.content || "").slice(0, 500);

            if (!content) continue;

            const { error: insertError } = await supabase
              .from("project_auto_entries")
              .upsert({
                project_id: project.id,
                story_id: story.id,
                entry_type: entryType,
                content,
              }, { onConflict: "project_id,story_id" });

            if (insertError) {
              errors.push(`Insert error for project ${project.name}: ${insertError.message}`);
              continue;
            }

            entriesCreated++;
            console.log(`[Project Populate] ${project.name}: added ${entryType} from "${story.title}"`);
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            errors.push(`Story "${story.title}" for ${project.name}: ${msg}`);
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Project "${project.name}": ${msg}`);
        console.error(`[Project Populate] Error for "${project.name}":`, msg);
      }
    }

    console.log(`[Project Populate] Done. Projects: ${projectsProcessed}, Entries: ${entriesCreated}`);
    await logRun(projectsProcessed, entriesCreated, errors.length > 0 ? errors.join("; ") : null);

    return NextResponse.json({
      projects_processed: projectsProcessed,
      entries_created: entriesCreated,
      errors: errors.length,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(msg);
    console.error("[Project Populate] Fatal error:", msg);
    await logRun(projectsProcessed, entriesCreated, errors.join("; "));
    return NextResponse.json({ error: "Project populate failed" }, { status: 500 });
  }
}

async function logRun(projectsProcessed: number, entriesCreated: number, errorText: string | null) {
  await supabase.from("cron_log").insert({
    agent_name: "project-populate",
    stories_processed: projectsProcessed,
    events_created: entriesCreated,
    errors: errorText,
  });
}
