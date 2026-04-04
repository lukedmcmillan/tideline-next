// Day 3 onboarding email template
// Wire into a cron job to send 3 days after user signup

export const SUBJECT = "A shortcut worth knowing";

export function body(userName?: string): string {
  const greeting = userName ? `Hi ${userName},` : "Hi,";

  return `${greeting}

You've been on Tideline for a few days now. Here's one thing worth knowing that most subscribers don't discover on their own:

One shortcut worth knowing: press Ctrl+Shift+N (or Cmd+Shift+N on Mac) anywhere on Tideline to instantly save a thought to your active project. No clicking around. Just press and type.

It saves directly to whichever project you're working on. Useful when something catches your eye in the feed and you want to note it before moving on.

That's it. Short email. Back to work.

— Luke
Tideline`;
}
