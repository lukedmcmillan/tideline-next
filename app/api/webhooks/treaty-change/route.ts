import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    // Supabase webhook sends: { type, table, schema, record, old_record }
    const record = payload.record;
    if (!record || !record.country_name || !record.status) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { country_name, status, changed_from, treaty_name, status_date } =
      record;

    // Get current ratification counts
    const { count: ratifiedCount } = await supabase
      .from("treaty_ratifications")
      .select("id", { count: "exact", head: true })
      .eq("treaty_name", treaty_name)
      .eq("status", "ratified");

    const { count: signedCount } = await supabase
      .from("treaty_ratifications")
      .select("id", { count: "exact", head: true })
      .eq("treaty_name", treaty_name)
      .eq("status", "signed");

    // Ask Claude if this is significant
    const prompt = `You are a treaty monitoring analyst for Tideline, an ocean intelligence platform. Your readers are NGO policy teams, ocean investors, corporate ESG analysts, and journalists.

A change has been recorded in the ${treaty_name} ratification tracker:

Country: ${country_name}
New status: ${status}
Previous status: ${changed_from || "none (first record)"}
Date: ${status_date || "unknown"}

Current totals for ${treaty_name}:
- Ratified: ${ratifiedCount ?? 0} countries
- Signed: ${signedCount ?? 0} countries

Is this change significant enough to alert Tideline subscribers? Consider:
- Major economies or ocean states ratifying is significant
- Reaching milestone numbers (e.g. 60th ratification for entry into force, round numbers) is significant
- Small island developing states ratifying is relevant given ocean context
- A country moving from "signed" to "ratified" is more significant than a new signature
- Routine signatures from countries with no ocean policy influence are not significant

Respond in this exact JSON format:
{"significant": true/false, "alert": "Two sentence alert text if significant, null if not."}

If significant, the alert should state what happened and why it matters. No hedging. Declarative sentences only.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());

    if (parsed.significant && parsed.alert) {
      await supabase.from("stories").insert({
        title: `${treaty_name}: ${country_name} ${status}`,
        link: `https://treaties.un.org/pages/ViewDetails.aspx?src=TREATY&mtdsg_no=XXI-10&chapter=21&clang=_en`,
        source_name: "Tideline Treaty Monitor",
        topic: "governance",
        source_type: "reg",
        published_at: new Date().toISOString(),
        short_summary: parsed.alert,
        alert_type: "treaty_alert",
      });
    }

    return NextResponse.json({
      received: true,
      country: country_name,
      status,
      significant: parsed.significant,
    });
  } catch (err) {
    console.error("Treaty change webhook error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
