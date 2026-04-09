<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Tideline — Mockup</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --navy: #0A1628;
  --teal: #1D9E75;
  --teal-dark: #157A5A;
  --teal-light: rgba(29,158,117,0.08);
  --white: #fff;
  --off: #F8F9FA;
  --ink: #111827;
  --muted: #6B7280;
  --light: #9CA3AF;
  --border: #E5E7EB;
  --font: 'Plus Jakarta Sans', sans-serif;
}
html { font-family: var(--font); background: var(--white); color: var(--ink); -webkit-font-smoothing: antialiased; }

/* TOPBAR */
.topbar {
  background: var(--navy);
  padding: 9px 32px;
  display: flex; align-items: center; justify-content: center;
  gap: 12px;
  font-size: 11px; font-weight: 500;
  color: rgba(255,255,255,0.65);
  letter-spacing: 0.04em;
}
.topbar a { color: var(--teal); text-decoration: none; font-weight: 700; }

/* NAV */
nav {
  position: sticky; top: 0; z-index: 100;
  background: rgba(255,255,255,0.97);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
  padding: 0 40px; height: 62px;
  display: flex; align-items: center; justify-content: space-between;
}
.nav-brand { display: flex; align-items: center; gap: 10px; }
.nav-logo { width: 36px; height: 36px; background: var(--teal); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 17px; font-weight: 800; color: white; }
.nav-name { font-size: 17px; font-weight: 700; color: var(--navy); letter-spacing: -0.02em; }
.nav-sub { font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: var(--light); }
.nav-links { display: flex; align-items: center; gap: 28px; }
.nav-link { font-size: 14px; color: var(--muted); text-decoration: none; font-weight: 500; }
.nav-right { display: flex; align-items: center; gap: 16px; }
.nav-login { font-size: 14px; color: var(--muted); text-decoration: none; font-weight: 500; }
.nav-cta { background: var(--teal); color: white; padding: 9px 20px; border-radius: 7px; font-size: 14px; font-weight: 700; text-decoration: none; }

/* HERO */
.hero {
  display: grid;
  grid-template-columns: 1fr 440px;
  gap: 64px;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 72px 40px 64px;
  min-height: calc(100vh - 100px);
}
.hero-left {}
.hero-tag {
  display: inline-flex; align-items: center; gap: 6px;
  background: var(--teal-light); border: 1px solid rgba(29,158,117,0.2);
  border-radius: 20px; padding: 5px 12px;
  font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;
  color: var(--teal); margin-bottom: 20px;
}
.hero-tag-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--teal); animation: pulse 2s ease-in-out infinite; }
@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }

.hero h1 {
  font-size: clamp(38px, 5vw, 58px);
  font-weight: 800;
  line-height: 1.06;
  letter-spacing: -0.03em;
  color: var(--navy);
  margin-bottom: 8px;
}
.hero-deck {
  font-size: 16px; color: var(--navy); font-weight: 600;
  margin-bottom: 16px; opacity: 0.6;
  font-style: italic;
}
.hero-sub {
  font-size: 17px; color: var(--muted);
  line-height: 1.65; margin-bottom: 32px;
  font-weight: 400; max-width: 520px;
}
.hero-ctas { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 14px; }
.btn-primary {
  background: var(--teal); color: white;
  padding: 14px 28px; border-radius: 8px;
  font-size: 15px; font-weight: 700;
  text-decoration: none; display: inline-block;
  transition: background 0.15s, transform 0.1s;
}
.btn-primary:hover { background: var(--teal-dark); transform: translateY(-1px); }
.btn-outline {
  background: white; color: var(--navy);
  padding: 14px 28px; border-radius: 8px;
  font-size: 15px; font-weight: 600;
  text-decoration: none; display: inline-block;
  border: 1.5px solid var(--border);
  transition: border-color 0.15s, transform 0.1s;
}
.btn-outline:hover { border-color: var(--navy); transform: translateY(-1px); }
.hero-meta {
  display: flex; gap: 20px; flex-wrap: wrap;
  font-size: 13px; color: var(--light);
  margin-bottom: 8px;
}
.hero-meta span::before { content: '✓ '; color: var(--teal); font-weight: 700; }
.hero-free { font-size: 13px; color: var(--muted); }
.hero-free a { color: var(--teal); font-weight: 600; text-decoration: none; }

/* HERO RIGHT CARD */
.hero-card {
  background: white;
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0,0,0,0.07);
}
.hero-card-label {
  padding: 14px 20px;
  border-bottom: 1px solid var(--border);
  font-size: 10px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.1em;
  color: var(--teal);
  background: var(--teal-light);
}
.hero-card-quote {
  padding: 24px 20px;
  border-left: 4px solid var(--teal);
  margin: 20px;
  background: var(--off);
  border-radius: 0 8px 8px 0;
}
.hero-card-quote p {
  font-size: 18px; font-weight: 600;
  font-style: italic; color: var(--navy);
  line-height: 1.5; margin-bottom: 0;
}
.hero-card-resolve {
  padding: 0 20px 8px;
  font-size: 15px; font-weight: 700;
  color: var(--teal);
}
.hero-card-tagline {
  padding: 0 20px 24px;
  font-size: 14px; color: var(--muted);
  line-height: 1.5;
}
.hero-card-divider { height: 1px; background: var(--border); margin: 0 20px; }
.hero-card-pillars {
  padding: 16px 20px;
  display: grid; grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
}
.hero-card-pillar {
  text-align: center;
  padding: 10px 6px;
  border-radius: 6px;
  background: var(--off);
  border: 1px solid var(--border);
}
.hero-card-pillar-name {
  font-size: 11px; font-weight: 700;
  color: var(--teal); margin-bottom: 2px;
}
.hero-card-pillar-desc {
  font-size: 10px; color: var(--muted);
  line-height: 1.3;
}

/* TESTIMONIAL */
.testimonial-section {
  background: var(--off);
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  padding: 32px 40px;
}
.testimonial-inner {
  max-width: 1200px; margin: 0 auto;
  display: flex; align-items: center; gap: 48px;
  flex-wrap: wrap;
}
.testimonial-quote {
  flex: 1; font-size: 17px; font-style: italic;
  color: var(--ink); line-height: 1.65;
}
.testimonial-quote::before { content: '"'; color: var(--teal); font-size: 28px; font-style: normal; display: block; margin-bottom: 4px; }
.testimonial-person { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
.testimonial-avatar { width: 44px; height: 44px; border-radius: 50%; background: var(--navy); display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; color: white; flex-shrink: 0; }
.testimonial-name { font-size: 14px; font-weight: 700; color: var(--ink); }
.testimonial-role { font-size: 12px; color: var(--light); }

/* SIX PILLARS */
.pillars-section {
  background: var(--navy);
  padding: 80px 40px;
}
.pillars-inner { max-width: 1200px; margin: 0 auto; }
.pillars-label {
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.1em; color: var(--teal);
  margin-bottom: 12px;
}
.pillars-heading {
  font-size: clamp(24px, 3.5vw, 38px);
  font-weight: 800; color: white;
  letter-spacing: -0.025em; line-height: 1.15;
  margin-bottom: 12px;
}
.pillars-sub {
  font-size: 16px; color: rgba(255,255,255,0.5);
  max-width: 600px; line-height: 1.65; margin-bottom: 48px;
}
.pillars-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2px;
}
.pillar-card {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  padding: 28px;
  transition: background 0.15s;
}
.pillar-card:hover { background: rgba(255,255,255,0.07); }
.pillar-icon {
  width: 40px; height: 40px; border-radius: 10px;
  background: rgba(29,158,117,0.15);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 16px; font-size: 18px;
}
.pillar-name {
  font-size: 18px; font-weight: 700;
  color: white; margin-bottom: 6px;
  letter-spacing: -0.01em;
}
.pillar-tagline {
  font-size: 13px; color: var(--teal);
  font-weight: 600; margin-bottom: 8px;
}
.pillar-desc {
  font-size: 13px; color: rgba(255,255,255,0.45);
  line-height: 1.6;
}

/* POSSIBILITY SECTION */
.possibility-section {
  background: var(--white);
  padding: 80px 40px;
  border-top: 1px solid var(--border);
}
.possibility-inner { max-width: 1200px; margin: 0 auto; }
.possibility-label {
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.1em; color: var(--teal); margin-bottom: 12px;
}
.possibility-heading {
  font-size: clamp(24px, 3.5vw, 38px);
  font-weight: 800; color: var(--navy);
  letter-spacing: -0.025em; line-height: 1.15;
  margin-bottom: 40px; max-width: 700px;
}
.possibility-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 48px;
}
.possibility-card {
  border-left: 3px solid var(--teal);
  padding: 24px 28px;
  background: var(--off);
  border-radius: 0 8px 8px 0;
}
.possibility-card p {
  font-size: 16px; color: var(--ink);
  line-height: 1.7; font-weight: 400;
}
.possibility-close {
  font-size: 20px; font-weight: 700;
  color: var(--navy); text-align: center;
  max-width: 700px; margin: 0 auto;
  line-height: 1.4; padding-top: 16px;
}
@media (max-width: 768px) {
  .possibility-section { padding: 56px 24px; }
  .possibility-grid { grid-template-columns: 1fr; }
  .possibility-close { font-size: 17px; }
}

/* COMPARISON TABLE */
.comparison-section {
  padding: 80px 40px;
  background: var(--white);
  border-top: 1px solid var(--border);
}
.comparison-inner { max-width: 900px; margin: 0 auto; }
.comparison-label {
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.1em; color: var(--teal); margin-bottom: 12px;
}
.comparison-heading {
  font-size: clamp(24px, 3.5vw, 36px);
  font-weight: 800; color: var(--navy);
  letter-spacing: -0.025em; line-height: 1.15;
  margin-bottom: 12px;
}
.comparison-sub {
  font-size: 16px; color: var(--muted);
  max-width: 560px; line-height: 1.65; margin-bottom: 40px;
}
.comparison-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
}
.comparison-table th {
  padding: 16px 20px;
  text-align: left;
  font-size: 13px; font-weight: 700;
  background: var(--off);
  border-bottom: 1px solid var(--border);
}
.comparison-table th.featured {
  background: var(--navy); color: white;
  text-align: center;
}
.comparison-table th.featured .featured-badge {
  display: inline-block;
  background: var(--teal); color: white;
  font-size: 9px; padding: 2px 7px; border-radius: 10px;
  margin-left: 6px; font-weight: 700; letter-spacing: 0.06em;
  text-transform: uppercase;
}
.comparison-table td {
  padding: 14px 20px;
  font-size: 14px; color: var(--ink);
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}
.comparison-table tr:last-child td { border-bottom: none; }
.comparison-table tr:hover td { background: var(--off); }
.comparison-table td.featured-col {
  background: rgba(29,158,117,0.04);
  text-align: center; font-weight: 600;
  color: var(--teal);
  border-left: 1px solid rgba(29,158,117,0.2);
  border-right: 1px solid rgba(29,158,117,0.2);
}
.comparison-table td.other { text-align: center; color: var(--light); }
.check { color: var(--teal); font-size: 16px; font-weight: 700; }
.cross { color: #E5E7EB; font-size: 16px; }
.partial { color: #D97706; font-size: 14px; }
.row-label { font-weight: 600; color: var(--navy); }

/* HERO SECTION DIVIDER */
.section-divider {
  height: 1px; background: var(--border);
}

@media (max-width: 900px) {
  .hero { grid-template-columns: 1fr; gap: 32px; padding: 48px 24px; min-height: auto; }
  .pillars-grid { grid-template-columns: 1fr 1fr; }
  .pillars-section, .comparison-section { padding: 56px 24px; }
  .testimonial-section { padding: 32px 24px; }
  .topbar { font-size: 10px; }
}
@media (max-width: 600px) {
  .pillars-grid { grid-template-columns: 1fr; }
  nav { padding: 0 20px; }
  .nav-links { display: none; }
}
</style>
</head>
<body>

<!-- TOPBAR -->
<div class="topbar">
  Limited founding member spots remaining. £39/month, locked for life.
  <a href="#pricing">Claim yours →</a>
</div>

<!-- NAV -->
<nav>
  <div class="nav-brand">
    <div class="nav-logo">T</div>
    <div>
      <div class="nav-name">Tideline</div>
      <div class="nav-sub">Ocean Intelligence</div>
    </div>
  </div>
  <div class="nav-links">
    <a href="#" class="nav-link">Platform</a>
    <a href="#" class="nav-link">Who it's for</a>
    <a href="#pricing" class="nav-link">Pricing</a>
  </div>
  <div class="nav-right">
    <a href="#" class="nav-login">Log in</a>
    <a href="#" class="nav-cta">Join early access</a>
  </div>
</nav>

<!-- HERO -->
<section class="hero">
  <div class="hero-left">
    <div class="hero-tag">
      <div class="hero-tag-dot"></div>
      Ocean intelligence · Live
    </div>
    <h1>Every day is you on a good day.</h1>
    <p class="hero-deck">The ocean sector finally has a room of its own.</p>
    <p class="hero-sub">Whether you're protecting it, investing in it, regulating it, navigating it, or reporting on it — Tideline is where you stay ahead. Workspace. Library. Live feed. Community. One place. All day.</p>
    <div class="hero-ctas">
      <a href="#" class="btn-primary">Start your free 7-day trial</a>
      <a href="#" class="btn-outline">See the platform in action</a>
    </div>
    <div class="hero-meta">
      <span>No card required</span>
      <span>Cancel any time</span>
      <span>Full access from day one</span>
    </div>
    <p class="hero-free">Or <a href="#pricing">start free</a>. No card required.</p>
  </div>

  <div class="hero-right">
    <div class="hero-card">
      <div class="hero-card-label">Before Tideline</div>
      <div class="hero-card-quote">
        <p>"Something moved last week. I found out in the meeting."</p>
      </div>
      <p class="hero-card-resolve">This does not happen on Tideline.</p>
      <p class="hero-card-tagline">Every day is you on a good day. The workspace, library, live feed and community you need — all in one place, updated in real time, filtered to your sector.</p>
      <div class="hero-card-divider"></div>
      <div class="hero-card-pillars">
        <div class="hero-card-pillar">
          <div class="hero-card-pillar-name">Freedom</div>
          <div class="hero-card-pillar-desc">Less searching</div>
        </div>
        <div class="hero-card-pillar">
          <div class="hero-card-pillar-name">Confidence</div>
          <div class="hero-card-pillar-desc">Always prepared</div>
        </div>
        <div class="hero-card-pillar">
          <div class="hero-card-pillar-name">Calm</div>
          <div class="hero-card-pillar-desc">Nothing missed</div>
        </div>
      </div>
    </div>
  </div>
</section>

<div class="section-divider"></div>

<!-- TESTIMONIAL -->
<div class="testimonial-section">
  <div class="testimonial-inner">
    <div class="testimonial-quote">
      I found a regulatory development my client needed in under a minute. That would have been three hours of searching before Tideline.
    </div>
    <div class="testimonial-person">
      <div class="testimonial-avatar">SR</div>
      <div>
        <div class="testimonial-name">S. Reyes</div>
        <div class="testimonial-role">Maritime Lawyer · London</div>
      </div>
    </div>
  </div>
</div>

<!-- SIX PILLARS -->
<section class="pillars-section">
  <div class="pillars-inner">
    <div class="pillars-label">What Tideline gives you back</div>
    <h2 class="pillars-heading">This is not about being informed.<br>It is about what that gives you.</h2>
    <p class="pillars-sub">Tideline is the workspace, library, live feed, and community for ocean professionals. One place. All day. Here is what it gives back.</p>
    <div class="pillars-grid">
      <div class="pillar-card">
        <div class="pillar-icon">🕊️</div>
        <div class="pillar-name">Freedom</div>
        <div class="pillar-tagline">Less time searching. More time doing.</div>
        <div class="pillar-desc">Stop chasing information across 40 tabs. Everything you need is already inside Tideline, updated in real time, filtered to your work.</div>
      </div>
      <div class="pillar-card">
        <div class="pillar-icon">🎯</div>
        <div class="pillar-name">Confidence</div>
        <div class="pillar-tagline">Walk into every meeting prepared.</div>
        <div class="pillar-desc">Know what moved before your first call. Walk in as the person who already knows — not the one catching up.</div>
      </div>
      <div class="pillar-card">
        <div class="pillar-icon">⚡</div>
        <div class="pillar-name">Performance</div>
        <div class="pillar-tagline">Produce better work, faster.</div>
        <div class="pillar-desc">The consultation response that takes three days takes three hours. The briefing that needed a morning arrives before your second coffee.</div>
      </div>
      <div class="pillar-card">
        <div class="pillar-icon">📋</div>
        <div class="pillar-name">Authority</div>
        <div class="pillar-tagline">Work that stands up to scrutiny.</div>
        <div class="pillar-desc">Every answer cited. Every source traceable. Primary documents, not summaries. The kind of sourcing that holds up in a board presentation or a legal brief.</div>
      </div>
      <div class="pillar-card">
        <div class="pillar-icon">🚀</div>
        <div class="pillar-name">Potential</div>
        <div class="pillar-tagline">The best version of you. Every day.</div>
        <div class="pillar-desc">Tideline does not replace your judgement. It removes the overhead that was stopping you from applying it. That is what you are paying for.</div>
      </div>
      <div class="pillar-card">
        <div class="pillar-icon">🌊</div>
        <div class="pillar-name">Calm</div>
        <div class="pillar-tagline">Nothing slips. Nothing surprises you.</div>
        <div class="pillar-desc">Every deadline tracked. Every development filed. That low-level anxiety that something important moved and you missed it — gone.</div>
      </div>
    </div>
  </div>
</section>

<!-- POSSIBILITY SECTION -->
<section class="possibility-section">
  <div class="possibility-inner">
    <div class="possibility-label">What your work looks like on Tideline</div>
    <h2 class="possibility-heading">Imagine starting every day already knowing what moved.</h2>
    <div class="possibility-grid">
      <div class="possibility-card">
        <p>You open your workspace at 8am. Everything that moved overnight is already filed, summarised, and filtered to your sector. You did not have to look for it.</p>
      </div>
      <div class="possibility-card">
        <p>A client asks about the latest ISA position before a call. You send them a cited brief in four minutes. It has your name on it. Not a link to a Google search.</p>
      </div>
      <div class="possibility-card">
        <p>A blue bond issuance crosses your desk. Crosscurrent has already flagged that two of the issuing states have declining CII compliance ratings. You saw the connection before anyone reported it.</p>
      </div>
      <div class="possibility-card">
        <p>The consultation window closes in eight days. You knew about it three weeks ago. Your response is already drafted.</p>
      </div>
    </div>
    <p class="possibility-close">This is what your work looks like when the intelligence infrastructure finally catches up with the importance of the sector.</p>
  </div>
</section>

<!-- COMPARISON TABLE -->
<section class="comparison-section">
  <div class="comparison-inner">
    <div class="comparison-label">Why Tideline</div>
    <h2 class="comparison-heading">What used to take days now takes minutes.</h2>
    <p class="comparison-sub">Every task in the table below exists in your current working week. This is how long it takes without Tideline, and how long it takes with it.</p>
    <table class="comparison-table">
      <thead>
        <tr>
          <th style="width:36%">The task</th>
          <th style="text-align:center;width:22%">Manually</th>
          <th style="text-align:center;width:22%">Search and generic tools</th>
          <th class="featured">With Tideline <span class="featured-badge">Purpose-built</span></th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="row-label">Finding out what moved in your sector overnight</td>
          <td class="other"><span class="cross">30–60 min</span><br><span style="font-size:11px;color:#D1D5DB">Scanning newsletters, LinkedIn, email</span></td>
          <td class="other"><span class="partial">Incomplete</span><br><span style="font-size:11px;color:#D1D5DB">Generic results, not sector-specific</span></td>
          <td class="featured-col"><span class="check">2 minutes</span><br><span style="font-size:11px">Live feed, filtered to your topics</span></td>
        </tr>
        <tr>
          <td class="row-label">Finding a citable primary source document</td>
          <td class="other"><span class="cross">45+ min</span><br><span style="font-size:11px;color:#D1D5DB">Searching ISA, IMO, UN sites manually</span></td>
          <td class="other"><span class="partial">Unreliable</span><br><span style="font-size:11px;color:#D1D5DB">Often summaries, not primary sources</span></td>
          <td class="featured-col"><span class="check">Seconds</span><br><span style="font-size:11px">2,400+ primary sources, searchable instantly</span></td>
        </tr>
        <tr>
          <td class="row-label">Producing a cited brief or report</td>
          <td class="other"><span class="cross">Half a day</span><br><span style="font-size:11px;color:#D1D5DB">Research, draft, cite, format, export</span></td>
          <td class="other"><span class="partial">Hours, uncited</span><br><span style="font-size:11px;color:#D1D5DB">No primary source trail</span></td>
          <td class="featured-col"><span class="check">Under an hour</span><br><span style="font-size:11px">Notes to Word report in one click. Your name on it.</span></td>
        </tr>
        <tr>
          <td class="row-label">Tracking a long-running story like DSM or 30x30</td>
          <td class="other"><span class="cross">No system</span><br><span style="font-size:11px;color:#D1D5DB">Saved tabs, email threads, memory</span></td>
          <td class="other"><span class="cross">Not possible</span><br><span style="font-size:11px;color:#D1D5DB">No persistent tracking across sources</span></td>
          <td class="featured-col"><span class="check">Automatic</span><br><span style="font-size:11px">Live trackers follow every development. Nothing missed.</span></td>
        </tr>
        <tr>
          <td class="row-label">Spotting connections across stories and sectors</td>
          <td class="other"><span class="cross">Rarely happens</span><br><span style="font-size:11px;color:#D1D5DB">Too much to read. Too many sources.</span></td>
          <td class="other"><span class="cross">Not possible</span><br><span style="font-size:11px;color:#D1D5DB">No cross-source pattern engine</span></td>
          <td class="featured-col"><span class="check">Automatic</span><br><span style="font-size:11px">Crosscurrent surfaces connections before anyone reports them</span></td>
        </tr>
        <tr>
          <td class="row-label">Tracking consultation deadlines and treaty meetings</td>
          <td class="other"><span class="cross">Missed constantly</span><br><span style="font-size:11px;color:#D1D5DB">Scattered across websites and emails</span></td>
          <td class="other"><span class="cross">Not possible</span><br><span style="font-size:11px;color:#D1D5DB">No sector-specific calendar tool exists</span></td>
          <td class="featured-col"><span class="check">Zero effort</span><br><span style="font-size:11px">Every deadline in one calendar. Syncs with Google and iOS.</span></td>
        </tr>
        <tr>
          <td class="row-label">Building a citable document library for your team</td>
          <td class="other"><span class="cross">Years of effort</span><br><span style="font-size:11px;color:#D1D5DB">Shared drives, no structure, no search</span></td>
          <td class="other"><span class="cross">Not possible</span><br><span style="font-size:11px;color:#D1D5DB">Generic tools, no ocean-specific curation</span></td>
          <td class="featured-col"><span class="check">Already built</span><br><span style="font-size:11px">2,400+ documents. Add your own. Grows with every subscriber.</span></td>
        </tr>
      </tbody>
    </table>
  </div>
</section>


<!-- PLATFORM FEATURES -->
<section style="padding: 80px 40px; background: var(--off); border-top: 1px solid var(--border);">
  <div style="max-width: 1200px; margin: 0 auto;">
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--teal);margin-bottom:12px;">The platform</div>
    <h2 style="font-size:clamp(24px,3.5vw,38px);font-weight:800;color:var(--navy);letter-spacing:-0.025em;line-height:1.15;margin-bottom:12px;">Everything you need. One place. All day.</h2>
    <p style="font-size:16px;color:var(--muted);max-width:600px;line-height:1.65;margin-bottom:48px;">The workspace is where the work happens. The research library finds the answer. The live feed keeps you across everything. The calendar keeps you on time. And Crosscurrent, only on Tideline, surfaces connections across 100+ sources before anyone else sees them.</p>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:2px;">
      <div style="background:white;border:1px solid var(--border);padding:28px;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--teal);margin-bottom:8px;">01 · Production</div>
        <div style="font-size:17px;font-weight:700;color:var(--navy);margin-bottom:8px;">Workspace</div>
        <p style="font-size:14px;color:var(--muted);line-height:1.6;margin-bottom:12px;">Save sources, annotate, draft. Notes convert to a structured report in one click. Export to Word or PDF. Your name on it. Tideline invisible.</p>
        <p style="font-size:13px;color:var(--teal);font-weight:600;">The consultation response that takes three days takes three hours.</p>
      </div>
      <div style="background:white;border:1px solid var(--border);padding:28px;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--teal);margin-bottom:8px;">02 · Research</div>
        <div style="font-size:17px;font-weight:700;color:var(--navy);margin-bottom:8px;">Research library</div>
        <p style="font-size:14px;color:var(--muted);line-height:1.6;margin-bottom:12px;">Every primary governing body document in one searchable library. Ask real questions in plain language. Direct answers with full source attribution.</p>
        <p style="font-size:13px;color:var(--teal);font-weight:600;">Not summaries of summaries. The actual documents.</p>
      </div>
      <div style="background:white;border:1px solid var(--border);padding:28px;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--teal);margin-bottom:8px;">03 · Intelligence</div>
        <div style="font-size:17px;font-weight:700;color:var(--navy);margin-bottom:8px;">Live feed</div>
        <p style="font-size:14px;color:var(--muted);line-height:1.6;margin-bottom:12px;">100+ sources monitored continuously. Summarised clearly enough to know in seconds whether it's relevant to your work. One click to the original source.</p>
        <p style="font-size:13px;color:var(--teal);font-weight:600;">Not a news feed. Intelligence, filtered to you.</p>
      </div>
      <div style="background:white;border:1px solid var(--border);padding:28px;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--teal);margin-bottom:8px;">04 · Calendar</div>
        <div style="font-size:17px;font-weight:700;color:var(--navy);margin-bottom:8px;">Regulatory calendar</div>
        <p style="font-size:14px;color:var(--muted);line-height:1.6;margin-bottom:12px;">Every consultation deadline, treaty meeting, and regulatory decision date in one calendar. Syncs with Google Calendar and iOS.</p>
        <p style="font-size:13px;color:var(--teal);font-weight:600;">Nothing slips. Ever.</p>
      </div>
      <div style="background:white;border:1px solid var(--border);padding:28px;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--teal);margin-bottom:8px;">05 · Monitoring</div>
        <div style="font-size:17px;font-weight:700;color:var(--navy);margin-bottom:8px;">Live trackers</div>
        <p style="font-size:14px;color:var(--muted);line-height:1.6;margin-bottom:12px;">10 trackers across ocean governance, blue finance, shipping, fisheries enforcement, and conservation. When something moves, you know immediately.</p>
        <p style="font-size:13px;color:var(--teal);font-weight:600;">Follow a story from beginning to wherever it ends up.</p>
      </div>
      <div style="background:white;border:1px solid var(--border);padding:28px;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--teal);margin-bottom:8px;">Only on Tideline</div>
        <div style="font-size:17px;font-weight:700;color:var(--navy);margin-bottom:8px;">Crosscurrent</div>
        <p style="font-size:14px;color:var(--muted);line-height:1.6;margin-bottom:12px;">Reads across 100+ sources simultaneously. Surfaces connections that no individual source would make. The pattern beneath the surface, visible the moment it forms.</p>
        <p style="font-size:13px;color:var(--teal);font-weight:600;">Only on Tideline.</p>
      </div>
    </div>
  </div>
</section>

<!-- WHO IT'S FOR -->
<section style="padding:80px 40px;background:white;border-top:1px solid var(--border);">
  <div style="max-width:1200px;margin:0 auto;">
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--teal);margin-bottom:12px;">Who it's for</div>
    <h2 style="font-size:clamp(24px,3.5vw,38px);font-weight:800;color:var(--navy);letter-spacing:-0.025em;line-height:1.15;margin-bottom:12px;">Same platform. Different problem. Different output.</h2>
    <p style="font-size:16px;color:var(--muted);max-width:600px;line-height:1.65;margin-bottom:48px;">Whether you are an NGO racing a consultation deadline, a lawyer finding a regulatory change in 40 seconds, or a finance team tracking blue bond credibility — the platform adapts to your work.</p>
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:2px;">
      <div style="background:var(--off);border:1px solid var(--border);padding:24px;">
        <div style="font-size:14px;font-weight:700;color:var(--navy);margin-bottom:8px;">NGO & Policy</div>
        <p style="font-size:13px;color:var(--muted);line-height:1.6;">Never miss a consultation window. Workspace, trackers, and deadline calendar built for the pace of governance.</p>
      </div>
      <div style="background:var(--off);border:1px solid var(--border);padding:24px;">
        <div style="font-size:14px;font-weight:700;color:var(--navy);margin-bottom:8px;">Investment & Finance</div>
        <p style="font-size:13px;color:var(--muted);line-height:1.6;">Track blue bonds, DSM contractor pipelines, and ESG disclosures. Know before it's in the news.</p>
      </div>
      <div style="background:var(--off);border:1px solid var(--border);padding:24px;">
        <div style="font-size:14px;font-weight:700;color:var(--navy);margin-bottom:8px;">Law & Compliance</div>
        <p style="font-size:13px;color:var(--muted);line-height:1.6;">Find regulatory changes in seconds. Cite primary sources. Bill for advice, not research.</p>
      </div>
      <div style="background:var(--off);border:1px solid var(--border);padding:24px;">
        <div style="font-size:14px;font-weight:700;color:var(--navy);margin-bottom:8px;">Science & Research</div>
        <p style="font-size:13px;color:var(--muted);line-height:1.6;">Search 2,400+ peer-reviewed papers and primary documents. Contribute your own to grow the library.</p>
      </div>
      <div style="background:var(--off);border:1px solid var(--border);padding:24px;">
        <div style="font-size:14px;font-weight:700;color:var(--navy);margin-bottom:8px;">Corporate & Industry</div>
        <p style="font-size:13px;color:var(--muted);line-height:1.6;">Track shipping emissions, supply chain risk, and ESG obligations before they become compliance issues.</p>
      </div>
    </div>
  </div>
</section>

<!-- WATCHING THREADS -->
<section style="padding:80px 40px;background:rgba(29,158,117,0.05);border-top:1px solid var(--border);">
  <div style="max-width:1200px;margin:0 auto;">
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--teal);margin-bottom:12px;">What Tideline is watching</div>
    <h2 style="font-size:clamp(24px,3.5vw,38px);font-weight:800;color:var(--navy);letter-spacing:-0.025em;line-height:1.15;margin-bottom:12px;">Some stories take months to resolve.</h2>
    <p style="font-size:16px;color:var(--muted);max-width:600px;line-height:1.65;margin-bottom:40px;">Tideline tracks long-running threads across governance, finance, science, and enforcement. When one thread moves another, it flags the connection.</p>
    <div style="display:flex;flex-direction:column;gap:2px;">
      <div style="background:white;border:1px solid var(--border);padding:24px 28px;display:grid;grid-template-columns:1fr 160px;gap:24px;align-items:start;">
        <div>
          <div style="font-size:15px;font-weight:700;color:var(--navy);margin-bottom:6px;">Seabed mining code: contractor pipeline vs moratorium coalition</div>
          <div style="font-size:13px;color:var(--muted);line-height:1.6;">Whether the ISA finalises a mining code before the next Council session, or whether the Pacific states coalition stalls it again. Three sponsored contractors in the queue.</div>
        </div>
        <div style="font-size:11px;font-weight:600;color:var(--teal);text-align:right;">Governance · Finance</div>
      </div>
      <div style="background:white;border:1px solid var(--border);padding:24px 28px;display:grid;grid-template-columns:1fr 160px;gap:24px;align-items:start;">
        <div>
          <div style="font-size:15px;font-weight:700;color:var(--navy);margin-bottom:6px;">Blue bond credibility: which issuers are declining independent audits</div>
          <div style="font-size:13px;color:var(--muted);line-height:1.6;">Whether blue bonds issued by sovereigns and corporations are financing activities that can be independently verified as ocean-positive.</div>
        </div>
        <div style="font-size:11px;font-weight:600;color:var(--teal);text-align:right;">Finance · ESG</div>
      </div>
      <div style="background:white;border:1px solid var(--border);padding:24px 28px;display:grid;grid-template-columns:1fr 160px;gap:24px;align-items:start;">
        <div>
          <div style="font-size:15px;font-weight:700;color:var(--navy);margin-bottom:6px;">Shipping ESG disclosures vs what vessel tracking data actually shows</div>
          <div style="font-size:13px;color:var(--muted);line-height:1.6;">Whether the emissions disclosures of major shipping companies match what independent vessel tracking shows on route planning, speed, and actual fuel burn.</div>
        </div>
        <div style="font-size:11px;font-weight:600;color:var(--teal);text-align:right;">Shipping · ESG</div>
      </div>
    </div>
    <p style="font-size:13px;color:var(--muted);margin-top:20px;">30 threads tracked live. Crosscurrent flags when they intersect.</p>
  </div>
</section>

<!-- LIBRARY -->
<section style="padding:80px 40px;background:white;border-top:1px solid var(--border);">
  <div style="max-width:1200px;margin:0 auto;">
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--teal);margin-bottom:12px;">The Tideline Library</div>
    <h2 style="font-size:clamp(24px,3.5vw,38px);font-weight:800;color:var(--navy);letter-spacing:-0.025em;line-height:1.15;margin-bottom:12px;">Citable sources. Fast.</h2>
    <p style="font-size:16px;color:var(--muted);max-width:680px;line-height:1.65;margin-bottom:20px;">The most common problem professionals in this sector describe: difficult to find citable sources quickly. Tideline solves it. Treaty text. ISA publications. IMO circulars. Peer-reviewed science. FAO reports. Search across all of it in plain language. Cite directly. Not summaries of summaries — the actual documents, the moment you need them.</p>
    <p style="font-size:16px;color:var(--muted);max-width:680px;line-height:1.65;margin-bottom:36px;">The library grows every time a subscriber contributes a document. Every NGO policy brief, every regulatory filing, every scientific paper added by the community makes every other subscriber's research faster. Upload to your private library or contribute to the public one. This is the world's biggest ocean library. It is being built right now, by the people who use it.</p>
    <div style="display:flex;gap:48px;flex-wrap:wrap;margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid var(--border);">
      <div>
        <div style="font-size:32px;font-weight:800;color:var(--navy);letter-spacing:-0.03em;">2,400+</div>
        <div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:var(--light);margin-top:4px;">Documents</div>
      </div>
      <div style="width:1px;background:var(--border);"></div>
      <div>
        <div style="font-size:32px;font-weight:800;color:var(--navy);letter-spacing:-0.03em;">Growing</div>
        <div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:var(--light);margin-top:4px;">Every day</div>
      </div>
      <div style="width:1px;background:var(--border);"></div>
      <div>
        <div style="font-size:32px;font-weight:800;color:var(--navy);letter-spacing:-0.03em;">Primary</div>
        <div style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:var(--light);margin-top:4px;">Sources only</div>
      </div>
    </div>
    <p style="font-size:14px;color:var(--muted);">Have a document to contribute? <a href="#" style="color:var(--teal);font-weight:600;text-decoration:none;">Upload it to the library</a> and help build the resource the sector has always needed.</p>
  </div>
</section>

<!-- WHAT IT REPLACES -->
<section style="padding:80px 40px;background:var(--off);border-top:1px solid var(--border);">
  <div style="max-width:1200px;margin:0 auto;">
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--teal);margin-bottom:12px;">What it replaces</div>
    <h2 style="font-size:clamp(24px,3.5vw,38px);font-weight:800;color:var(--navy);letter-spacing:-0.025em;line-height:1.15;margin-bottom:12px;">No more 40 tabs. One destination. Log on. Do the work.</h2>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:2px;margin-top:40px;">
      <div style="background:white;border:1px solid var(--border);padding:36px;">
        <div style="font-size:13px;font-weight:700;color:var(--light);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:20px;">Before</div>
        <div style="display:flex;flex-direction:column;gap:14px;">
          <div style="display:flex;gap:12px;align-items:flex-start;"><span style="color:#E5E7EB;font-size:16px;flex-shrink:0;">✗</span><span style="font-size:14px;color:var(--muted);line-height:1.5;">Overlapping newsletters, none telling you what it means</span></div>
          <div style="display:flex;gap:12px;align-items:flex-start;"><span style="color:#E5E7EB;font-size:16px;flex-shrink:0;">✗</span><span style="font-size:14px;color:var(--muted);line-height:1.5;">Manual searches through primary documents — 45 minutes per query</span></div>
          <div style="display:flex;gap:12px;align-items:flex-start;"><span style="color:#E5E7EB;font-size:16px;flex-shrink:0;">✗</span><span style="font-size:14px;color:var(--muted);line-height:1.5;">Reports and responses drafted from scratch every time</span></div>
          <div style="display:flex;gap:12px;align-items:flex-start;"><span style="color:#E5E7EB;font-size:16px;flex-shrink:0;">✗</span><span style="font-size:14px;color:var(--muted);line-height:1.5;">Deadlines missed. Connections between developments missed.</span></div>
          <div style="display:flex;gap:12px;align-items:flex-start;"><span style="color:#E5E7EB;font-size:16px;flex-shrink:0;">✗</span><span style="font-size:14px;color:var(--muted);line-height:1.5;">Work scattered across platforms that don't talk to each other</span></div>
        </div>
      </div>
      <div style="background:var(--navy);border:1px solid var(--navy);padding:36px;">
        <div style="font-size:13px;font-weight:700;color:var(--teal);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:20px;">With Tideline</div>
        <div style="display:flex;flex-direction:column;gap:14px;">
          <div style="display:flex;gap:12px;align-items:flex-start;"><span style="color:var(--teal);font-size:16px;flex-shrink:0;">✓</span><span style="font-size:14px;color:rgba(255,255,255,0.7);line-height:1.5;">Workspace, trackers, library, feed and calendar in one place. No switching.</span></div>
          <div style="display:flex;gap:12px;align-items:flex-start;"><span style="color:var(--teal);font-size:16px;flex-shrink:0;">✓</span><span style="font-size:14px;color:rgba(255,255,255,0.7);line-height:1.5;">/ask finds the primary source answer in seconds. Cited. Traceable.</span></div>
          <div style="display:flex;gap:12px;align-items:flex-start;"><span style="color:var(--teal);font-size:16px;flex-shrink:0;">✓</span><span style="font-size:14px;color:rgba(255,255,255,0.7);line-height:1.5;">Reports generated from your notes in one click. Hours, not days.</span></div>
          <div style="display:flex;gap:12px;align-items:flex-start;"><span style="color:var(--teal);font-size:16px;flex-shrink:0;">✓</span><span style="font-size:14px;color:rgba(255,255,255,0.7);line-height:1.5;">Every deadline in your calendar. Nothing slips.</span></div>
          <div style="display:flex;gap:12px;align-items:flex-start;"><span style="color:var(--teal);font-size:16px;flex-shrink:0;">✓</span><span style="font-size:14px;color:rgba(255,255,255,0.7);line-height:1.5;">One brief. 100+ sources. What happened and what it means.</span></div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- FOUNDER -->
<section style="padding:80px 40px;background:var(--navy);border-top:1px solid rgba(255,255,255,0.08);">
  <div style="max-width:680px;margin:0 auto;">
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--teal);margin-bottom:24px;">From the founder</div>
    <div style="font-size:18px;line-height:1.75;color:rgba(255,255,255,0.8);margin-bottom:28px;">
      <p style="margin-bottom:16px;">I built Tideline because I needed it.</p>
      <p style="margin-bottom:16px;">Sometimes you just need support to be the best version of yourself at work. You do not have time to scour every source. You need to be up to date. You need to be the person in the room who knows what is happening.</p>
      <p style="font-weight:700;color:white;">Tideline is exactly what I was missing from my daily life. So I built it.</p>
    </div>
    <div style="display:flex;align-items:center;gap:14px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.1);">
      <div style="width:44px;height:44px;border-radius:50%;background:rgba(29,158,117,0.2);display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;color:white;flex-shrink:0;">LM</div>
      <div>
        <div style="font-size:14px;font-weight:700;color:white;">Luke McMillan</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.4);">Founder, Tideline</div>
      </div>
    </div>
  </div>
</section>

<!-- PRICING -->
<section id="pricing" style="padding:80px 40px;background:var(--navy);border-top:1px solid rgba(255,255,255,0.08);">
  <div style="max-width:1100px;margin:0 auto;">
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--teal);margin-bottom:12px;">Pricing</div>
    <h2 style="font-size:clamp(24px,3.5vw,38px);font-weight:800;color:white;letter-spacing:-0.025em;line-height:1.15;margin-bottom:12px;">Join as a founding member. Your price is locked for life.</h2>
    <p style="font-size:16px;color:rgba(255,255,255,0.45);max-width:600px;line-height:1.65;margin-bottom:16px;">The platform is live and growing. Founding members join now at £39/month, locked for life. The price increases when Tideline leaves beta. It never increases for you.</p>
    <div style="background:rgba(29,158,117,0.1);border:1px solid rgba(29,158,117,0.2);border-radius:10px;padding:24px 28px;margin-bottom:40px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;">
      <div>
        <div style="font-size:20px;font-weight:700;color:white;margin-bottom:4px;">£39/month. Full platform. Locked for life.</div>
        <div style="font-size:14px;color:rgba(255,255,255,0.4);">Not a discount. An identity. Founding members get the price, the access, and the ear of the person building it.</div>
      </div>
      <a href="#" style="background:var(--teal);color:white;padding:12px 24px;border-radius:7px;font-size:14px;font-weight:700;text-decoration:none;white-space:nowrap;">Claim a founding spot →</a>
    </div>
    <p style="font-size:14px;color:rgba(255,255,255,0.35);margin-bottom:32px;text-align:center;">Not ready to commit? <a href="#" style="color:var(--teal);font-weight:600;text-decoration:none;">Start free</a>. No card required. Full access to the brief and three trackers.</p>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:2px;">
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);padding:28px;border-radius:2px;">
        <div style="font-size:14px;font-weight:700;color:white;margin-bottom:4px;">Free</div>
        <div style="font-size:28px;font-weight:800;color:white;letter-spacing:-0.03em;margin-bottom:16px;">£0<span style="font-size:14px;font-weight:400;color:rgba(255,255,255,0.35)">/mo</span></div>
        <div style="font-size:13px;color:rgba(255,255,255,0.4);margin-bottom:20px;line-height:1.5;">Explore the platform.</div>
        <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:24px;">
          <div style="font-size:12px;color:rgba(255,255,255,0.5);">✓ Daily morning brief</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.5);">✓ Live feed (10 stories/day)</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.5);">✓ 3 trackers</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.2);">✗ No workspace</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.2);">✗ No library</div>
        </div>
        <a href="#" style="display:block;text-align:center;border:1px solid rgba(255,255,255,0.2);color:rgba(255,255,255,0.6);padding:10px;border-radius:6px;font-size:13px;font-weight:600;text-decoration:none;">Start free</a>
      </div>
      <div style="background:rgba(29,158,117,0.08);border:1px solid rgba(29,158,117,0.3);padding:28px;border-radius:2px;position:relative;">
        <div style="position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:var(--teal);color:white;font-size:9px;font-weight:700;padding:3px 10px;border-radius:10px;white-space:nowrap;letter-spacing:0.08em;text-transform:uppercase;">Price locks on joining</div>
        <div style="font-size:14px;font-weight:700;color:white;margin-bottom:4px;">Founding Member</div>
        <div style="font-size:28px;font-weight:800;color:var(--teal);letter-spacing:-0.03em;margin-bottom:16px;">£39<span style="font-size:14px;font-weight:400;color:rgba(255,255,255,0.35)">/mo</span></div>
        <div style="font-size:13px;color:rgba(255,255,255,0.4);margin-bottom:20px;line-height:1.5;">Locked for life. Never increases.</div>
        <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:24px;">
          <div style="font-size:12px;color:rgba(255,255,255,0.7);">✓ Full platform access</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.7);">✓ Live feed: 100+ sources</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.7);">✓ 10 live trackers</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.7);">✓ Workspace with library</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.7);">✓ Generate Report to Word</div>
        </div>
        <a href="#" style="display:block;text-align:center;background:var(--teal);color:white;padding:10px;border-radius:6px;font-size:13px;font-weight:700;text-decoration:none;">Claim founding member spot</a>
      </div>
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);padding:28px;border-radius:2px;">
        <div style="font-size:14px;font-weight:700;color:white;margin-bottom:4px;">Individual</div>
        <div style="font-size:28px;font-weight:800;color:white;letter-spacing:-0.03em;margin-bottom:4px;">£99<span style="font-size:14px;font-weight:400;color:rgba(255,255,255,0.35)">/mo</span></div>
        <div style="font-size:11px;color:rgba(255,255,255,0.3);margin-bottom:16px;">or £990/year — two months free</div>
        <div style="font-size:13px;color:rgba(255,255,255,0.4);margin-bottom:20px;line-height:1.5;">The full platform for the professional who needs to stay ahead.</div>
        <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:24px;">
          <div style="font-size:12px;color:rgba(255,255,255,0.5);">✓ Everything in Founding Member</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.5);">✓ Crosscurrent connection engine</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.5);">✓ Unlimited /ask queries</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.5);">✓ Priority support</div>
        </div>
        <a href="#" style="display:block;text-align:center;border:1px solid rgba(255,255,255,0.2);color:rgba(255,255,255,0.6);padding:10px;border-radius:6px;font-size:13px;font-weight:600;text-decoration:none;">Join early access</a>
      </div>
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);padding:28px;border-radius:2px;">
        <div style="font-size:14px;font-weight:700;color:white;margin-bottom:4px;">Team</div>
        <div style="font-size:28px;font-weight:800;color:white;letter-spacing:-0.03em;margin-bottom:16px;">£699<span style="font-size:14px;font-weight:400;color:rgba(255,255,255,0.35)">/mo</span></div>
        <div style="font-size:13px;color:rgba(255,255,255,0.4);margin-bottom:20px;line-height:1.5;">10 seats. Intelligence that outlasts anyone.</div>
        <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:24px;">
          <div style="font-size:12px;color:rgba(255,255,255,0.5);">✓ Everything in Individual</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.5);">✓ 10 seats with shared workspace</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.5);">✓ Institutional memory stays</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.5);">✓ Priority support</div>
        </div>
        <a href="#" style="display:block;text-align:center;border:1px solid rgba(255,255,255,0.2);color:rgba(255,255,255,0.6);padding:10px;border-radius:6px;font-size:13px;font-weight:600;text-decoration:none;">Talk to us</a>
      </div>
    </div>
    <p style="font-size:13px;color:rgba(255,255,255,0.25);text-align:center;margin-top:24px;">NGO or academic? 50% off — <a href="#" style="color:var(--teal);text-decoration:none;">apply here</a> &nbsp;·&nbsp; NGO or grant-funded? Email <a href="/cdn-cgi/l/email-protection#f199949d9d9eb1859994859895949d989f94df929e" style="color:var(--teal);text-decoration:none;"><span class="__cf_email__" data-cfemail="91f9f4fdfdfed1e5f9f4e5f8f5f4fdf8fff4bff2fe">[email&#160;protected]</span></a> for flexible annual pricing.</p>
  </div>
</section>

<!-- FOOTER -->
<footer style="padding:28px 40px;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;background:white;">
  <div style="display:flex;align-items:center;gap:8px;">
    <div style="width:24px;height:24px;background:var(--teal);border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:white;">T</div>
    <span style="font-size:14px;font-weight:700;color:var(--navy);">Tideline</span>
  </div>
  <div style="display:flex;gap:24px;flex-wrap:wrap;">
    <a href="#" style="font-size:13px;color:var(--muted);text-decoration:none;">Privacy</a>
    <a href="#" style="font-size:13px;color:var(--muted);text-decoration:none;">Terms</a>
    <a href="#" style="font-size:13px;color:var(--muted);text-decoration:none;">Source methodology</a>
    <a href="#" style="font-size:13px;color:var(--muted);text-d