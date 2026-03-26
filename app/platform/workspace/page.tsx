"use client";

const BLACK = "#0D0D0D";
const WHITE = "#FFFFFF";
const SERIF = "var(--font-serif), 'Libre Baskerville', Georgia, serif";
const SANS  = "var(--font-sans), 'DM Sans', 'Helvetica Neue', Arial, sans-serif";

export default function WorkspacePage() {
  return (
    <div style={{ maxWidth: 480, margin: "80px auto", padding: "0 28px" }}>
      <h1 style={{ fontFamily: SERIF, fontSize: 22, fontStyle: "italic", fontWeight: 400, opacity: 0.5, margin: "0 0 8px" }}>No projects yet.</h1>
      <p style={{ fontFamily: SANS, fontSize: 14, lineHeight: 1.7, opacity: 0.45, margin: "0 0 20px" }}>
        Create a project to start organising your intelligence. Every morning, stories matching your project topics are automatically filed here.
      </p>
      <a href="#" style={{ display: "inline-block", padding: "12px 20px", background: BLACK, color: WHITE, fontFamily: SANS, fontSize: 14, fontWeight: 500, textDecoration: "none" }}>Create your first project</a>
    </div>
  );
}
