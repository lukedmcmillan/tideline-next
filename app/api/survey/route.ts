import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const answers = await request.json();

    // Map role field
    const roleObj = answers.role;
    const role = roleObj?.value === "Other" ? "Other" : roleObj?.value || roleObj || null;
    const role_other = roleObj?.value === "Other" ? roleObj?.other || null : null;

    const row = {
      role,
      role_other,
      procurement: answers.procurement || null,
      time_spent: answers.time_spent || null,
      current_sources: Array.isArray(answers.current_sources) ? answers.current_sources : null,
      hardest_to_track: Array.isArray(answers.hardest_to_track) ? answers.hardest_to_track : null,
      biggest_pain: answers.biggest_pain || null,
      feed_value: typeof answers.feed_value === "number" ? answers.feed_value : null,
      brief_value: typeof answers.brief_value === "number" ? answers.brief_value : null,
      tracker_value: typeof answers.tracker_value === "number" ? answers.tracker_value : null,
      workspace_value: typeof answers.workspace_value === "number" ? answers.workspace_value : null,
      meeting_prep_value: typeof answers.meeting_prep_value === "number" ? answers.meeting_prep_value : null,
      entity_alerts_value: typeof answers.entity_alerts_value === "number" ? answers.entity_alerts_value : null,
      contradiction_value: answers.contradiction_value || null,
      report_value: answers.report_value || null,
      linkedin_value: answers.linkedin_value || null,
      calendar_value: answers.calendar_value || null,
      alerts_value: answers.alerts_value || null,
      price: answers.price || null,
      missing: answers.missing || null,
    };

    const { error } = await supabase.from("survey_responses").insert(row);

    if (error) {
      console.error("[Survey] Insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Send email notification (fire-and-forget)
    const timestamp = new Date().toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short" });
    const lines = [
      `New Tideline survey response — ${timestamp}`,
      "",
      `Role: ${role}${role_other ? ` (${role_other})` : ""}`,
      `Procurement: ${row.procurement || "—"}`,
      `Time spent: ${row.time_spent || "—"}`,
      `Current sources: ${row.current_sources?.join(", ") || "—"}`,
      `Hardest to track: ${row.hardest_to_track?.join(", ") || "—"}`,
      `Biggest pain: ${row.biggest_pain || "—"}`,
      "",
      "— Core platform —",
      `Feed value: ${row.feed_value ?? "—"}/5`,
      `Brief value: ${row.brief_value ?? "—"}/5`,
      `Tracker value: ${row.tracker_value ?? "—"}/5`,
      "",
      "— Intelligence tools —",
      `Workspace value: ${row.workspace_value ?? "—"}/5`,
      `Meeting prep value: ${row.meeting_prep_value ?? "—"}/5`,
      `Entity alerts value: ${row.entity_alerts_value ?? "—"}/5`,
      `Contradiction flagging: ${row.contradiction_value || "—"}`,
      "",
      "— Workflow & output —",
      `Report generation: ${row.report_value || "—"}`,
      `LinkedIn drafting: ${row.linkedin_value || "—"}`,
      `Governance calendar: ${row.calendar_value || "—"}`,
      `Keyword alerts: ${row.alerts_value || "—"}`,
      "",
      "— Pricing —",
      `Price: ${row.price || "—"}`,
      `Missing / indispensable: ${row.missing || "—"}`,
    ];

    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Tideline <brief@thetideline.co>",
        to: "luke@oceanrising.co",
        subject: "New Tideline survey response",
        text: lines.join("\n"),
      }),
    }).catch((err) => console.error("[Survey] Email error:", err));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Survey] Error:", err);
    return NextResponse.json({ error: "Failed to save response" }, { status: 500 });
  }
}
