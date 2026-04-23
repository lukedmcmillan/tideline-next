import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const answers = await request.json();

    // Q1: role may be { value, other } from single_with_other
    const roleObj = answers.role;
    const role = roleObj?.value === "Other" ? "Other" : roleObj?.value || roleObj || null;
    const role_other = roleObj?.value === "Other" ? roleObj?.other || null : null;

    const row = {
      // Q1
      role,
      role_other,
      // Q2
      procurement: answers.procurement || null,
      // Q3
      time_spent: answers.time_spent || null,
      // Q4
      current_sources: Array.isArray(answers.current_sources) ? answers.current_sources : null,
      // Q5
      hardest_to_track: Array.isArray(answers.hardest_to_track) ? answers.hardest_to_track : null,
      // Q6
      biggest_pain: answers.biggest_pain || null,
      // Q7 — all nullable, partial ratings permitted
      val_daily_brief:        typeof answers.val_daily_brief === "number" ? answers.val_daily_brief : null,
      val_live_feed:          typeof answers.val_live_feed === "number" ? answers.val_live_feed : null,
      val_regulatory_tracker: typeof answers.val_regulatory_tracker === "number" ? answers.val_regulatory_tracker : null,
      val_workspace:          typeof answers.val_workspace === "number" ? answers.val_workspace : null,
      val_meeting_prep:       typeof answers.val_meeting_prep === "number" ? answers.val_meeting_prep : null,
      val_entity_alerts:      typeof answers.val_entity_alerts === "number" ? answers.val_entity_alerts : null,
      val_contradiction:      typeof answers.val_contradiction === "number" ? answers.val_contradiction : null,
      val_commitment_tracker: typeof answers.val_commitment_tracker === "number" ? answers.val_commitment_tracker : null,
      val_risk_reports:       typeof answers.val_risk_reports === "number" ? answers.val_risk_reports : null,
      val_embed_widget:       typeof answers.val_embed_widget === "number" ? answers.val_embed_widget : null,
      val_ai_drafting:        typeof answers.val_ai_drafting === "number" ? answers.val_ai_drafting : null,
      // Q8
      entity_tracking_value: answers.entity_tracking_value || null,
      entity_tracking_open:  answers.entity_tracking_open?.trim() || null,
      // Q9
      output_format: answers.output_format || null,
      // Q10
      existing_tools:       Array.isArray(answers.existing_tools) ? answers.existing_tools : null,
      existing_tools_other: answers.existing_tools_other?.trim() || null,
      // Q11
      contact_directory_value: answers.contact_directory_value || null,
      // Q12
      team_size: answers.team_size || null,
      // Q13
      willingness_to_pay: answers.willingness_to_pay || null,
      // Q14
      missing_coverage: answers.missing_coverage?.trim() || null,
      // Q15
      email_provided:        answers.email_provided?.trim() || null,
      wants_early_access:    answers.wants_early_access === true,
      wants_founding_member: answers.wants_founding_member === true,
      wants_updates:         answers.wants_updates === true,
      // is_priority_lead is a generated column — not inserted
    };

    const { error } = await supabase.from("survey_responses_v2").insert(row);

    if (error) {
      console.error("[Survey v2] Insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Email notification (fire-and-forget)
    const timestamp = new Date().toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short" });
    const isPriorityLead = !!row.email_provided;
    const lines = [
      `New Tideline survey v2 response${isPriorityLead ? " [PRIORITY LEAD]" : ""} -- ${timestamp}`,
      "",
      `Role: ${role}${role_other ? ` (${role_other})` : ""}`,
      `Procurement: ${row.procurement || "--"}`,
      `Time spent: ${row.time_spent || "--"}`,
      `Current sources: ${row.current_sources?.join(", ") || "--"}`,
      `Hardest to track: ${row.hardest_to_track?.join(", ") || "--"}`,
      `Biggest pain: ${row.biggest_pain || "--"}`,
      "",
      "-- Feature ratings (1-5) --",
      `Daily brief: ${row.val_daily_brief ?? "--"}`,
      `Live feed: ${row.val_live_feed ?? "--"}`,
      `Regulatory tracker: ${row.val_regulatory_tracker ?? "--"}`,
      `Workspace: ${row.val_workspace ?? "--"}`,
      `Meeting prep: ${row.val_meeting_prep ?? "--"}`,
      `Entity alerts: ${row.val_entity_alerts ?? "--"}`,
      `Contradiction detection: ${row.val_contradiction ?? "--"}`,
      `Commitment tracker: ${row.val_commitment_tracker ?? "--"}`,
      `Risk reports: ${row.val_risk_reports ?? "--"}`,
      `Embed widget: ${row.val_embed_widget ?? "--"}`,
      `AI drafting: ${row.val_ai_drafting ?? "--"}`,
      "",
      "-- Entity & output --",
      `Entity tracking value: ${row.entity_tracking_value || "--"}`,
      `Entities to track: ${row.entity_tracking_open || "--"}`,
      `Output format: ${row.output_format || "--"}`,
      "",
      "-- Tools & context --",
      `Existing tools: ${row.existing_tools?.join(", ") || "--"}${row.existing_tools_other ? ` + ${row.existing_tools_other}` : ""}`,
      `Contact directory value: ${row.contact_directory_value || "--"}`,
      `Team size: ${row.team_size || "--"}`,
      `Willingness to pay: ${row.willingness_to_pay || "--"}`,
      `Missing coverage: ${row.missing_coverage || "--"}`,
      "",
      "-- Early access --",
      `Email: ${row.email_provided || "--"}`,
      `Wants early access: ${row.wants_early_access}`,
      `Wants founding member rate: ${row.wants_founding_member}`,
      `Wants updates: ${row.wants_updates}`,
    ];

    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Tideline <brief@thetideline.co>",
        to: "lukedmcmillan@gmail.com",
        subject: isPriorityLead
          ? `[LEAD] New Tideline survey response -- ${role || "unknown role"}`
          : `New Tideline survey response -- ${role || "unknown role"}`,
        text: lines.join("\n"),
      }),
    }).catch((err) => console.error("[Survey v2] Email error:", err));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Survey v2] Error:", err);
    return NextResponse.json({ error: "Failed to save response" }, { status: 500 });
  }
}
