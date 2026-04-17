import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  extractQuestion,
  queryRAG,
  buildReplyHtml,
} from "@/app/lib/brief-reply";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  // 1. Verify webhook secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.RESEND_WEBHOOK_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: {
    from?: string;
    to?: string;
    subject?: string;
    text?: string;
    html?: string;
  };

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const senderEmail =
    payload.from?.match(/<([^>]+)>/)?.[1] || payload.from || "";
  const replyBody = payload.text || "";

  if (!senderEmail || !replyBody.trim()) {
    return NextResponse.json(
      { error: "Missing sender or body" },
      { status: 400 }
    );
  }

  // 2. Look up subscriber
  const { data: user } = await supabase
    .from("users")
    .select("id, email, status")
    .eq("email", senderEmail.toLowerCase().trim())
    .single();

  if (!user || !["active", "trialing"].includes(user.status)) {
    return NextResponse.json(
      { error: "Unknown or inactive subscriber" },
      { status: 403 }
    );
  }

  try {
    // 3. Extract question via Haiku
    const question = await extractQuestion(replyBody);
    if (!question || question.length < 3) {
      return NextResponse.json(
        { error: "Could not extract a question" },
        { status: 422 }
      );
    }

    // 4. Run RAG pipeline
    const { answer, sources } = await queryRAG(question);

    // 5. Build reply email
    const firstName = senderEmail.split("@")[0].split(".")[0];
    const name =
      firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
    const html = buildReplyHtml(name, answer, sources);

    // 6. Send via Resend
    const sendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Tideline <luke@thetideline.co>",
        reply_to: "brief-replies@thetideline.co",
        to: senderEmail,
        subject: `Re: ${payload.subject || "Your Tideline brief"}`,
        html,
      }),
    });

    if (!sendRes.ok) {
      const errBody = await sendRes.text();
      console.error("[brief-reply] Resend send failed:", errBody);
    }

    // 7. Log to brief_reply_logs
    await supabase.from("brief_reply_logs").insert({
      user_email: senderEmail,
      question,
      answer,
      sources_count: sources.length,
    });

    return NextResponse.json({
      ok: true,
      question,
      sources_count: sources.length,
    });
  } catch (err) {
    console.error("[brief-reply] Error:", err);
    return NextResponse.json(
      { error: "Failed to process reply" },
      { status: 500 }
    );
  }
}
