# Strategic Decisions — Accepted Structural Gaps

Decisions to accept known failure modes rather than build permanent infrastructure
for marginal coverage gains. Each entry documents what was tried, why it was
declined, and the conditions under which it should be revisited.

---

## CITES — Cloudflare bot protection
**Status:** Accepted gap
CITES treaty pages on cites.org are protected by Cloudflare's bot challenge.
Jina cannot resolve these; direct fetch returns a challenge page. 128 CITES
decisions failed with Download HTTP 403. The 403s are Cloudflare interception,
not server-side access control. Revisit only if CITES publishes an open API or
InforMEA provides full-text content for CITES decisions via OData.

---

## Barcelona Convention / MAP — HTTP 403
**Status:** Accepted gap
Barcelona Convention (Mediterranean Action Plan) documents on the UNEP/MAP
domain return 403. Infrastructure for a credentialed or mirror-based fetch would
add ongoing maintenance burden for a small MEA. Accepted as gap.

---

## WTO Fisheries Subsidies — Blind spot
**Status:** Accepted gap
WTO fisheries subsidies negotiations and dispute settlement content is not
covered by any current scraper source. The WTO document portal requires
authentication for full-text access. Accepted as out-of-scope until a public
API or RSS feed becomes available.

---

## IWC pre-2001 decisions (16 items) — crm.iwc.int blocks Jina
**Status:** Accepted gap
crm.iwc.int blocks Jina (r.jina.ai/robots.txt disallow). Older subsystem of
the IWC CRM. 111 post-2001 IWC decisions are in the library; these 16 oldest
(1993-2001) accepted as gap. Not pursued — a direct-fetch fallback would add
permanent infrastructure for 16 docs, and using the OData description field as
a text source is hack-shaped. Revisit only if a subscriber specifically requests
pre-2001 IWC content.
