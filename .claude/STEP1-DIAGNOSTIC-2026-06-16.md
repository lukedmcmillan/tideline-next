# Step 1 Source Classification — Corpus Diagnostic
*Run: 2026-06-16 | Session: pre-allowlist design*

---

## Corpus Stats

- **Total approved docs**: 7,707
- **URL coverage**: 119 has_url (1.5%), 7,588 no_url (98.5%)
- **Top 50 orgs cover**: 38.1% of corpus (long tail is substantial)

---

## Top 50 Source Organisations

| Rank | Organisation | Docs | % | Cumulative% |
|------|---|---:|---:|---:|
| 1 | European Commission | 569 | 7.4% | 7.4% |
| 2 | Council of the European Union | 301 | 3.9% | 11.3% |
| 3 | General Fisheries Commission for the Mediterranean | 139 | 1.8% | 13.1% |
| 4 | International Whaling Commission | 113 | 1.5% | 14.6% |
| 5 | Scottish Ministers | 110 | 1.4% | 16.0% |
| 6 | Commission for the Conservation of Antarctic Marine… (CCAMLR v1) | 110 | 1.4% | 17.4% |
| 7 | Indian Ocean Tuna Commission (IOTC) | 108 | 1.4% | 18.8% |
| 8 | Conference of the Parties to the Convention on Biological Diversity | 107 | 1.4% | 20.2% |
| 9 | International Commission for the Conservation of Atlantic Tunas (ICCAT) | 94 | 1.2% | 21.4% |
| 10 | Inter-American Tropical Tuna Commission (IATTC) | 77 | 1.0% | 22.4% |
| 11 | International Seabed Authority | 70 | 0.9% | 23.3% |
| 12 | United States Congress | 66 | 0.9% | 24.2% |
| 13 | Commission of the European Communities | 53 | 0.7% | 24.9% |
| 14 | Department of Communications, Marine and Natural Resources (Ireland) | 46 | 0.6% | 25.5% |
| 15 | Parliament of New Zealand | 40 | 0.5% | 26.0% |
| 16 | European Parliament and Council of the European Union | 38 | 0.5% | 26.5% |
| 17 | Western Central Atlantic Fishery Commission (WECAFC) | 38 | 0.5% | 27.0% |
| 18 | North East Atlantic Fisheries Commission (NEAFC) | 38 | 0.5% | 27.5% |
| 19 | OceanCare | 37 | 0.5% | 27.9% |
| 20 | Gulf of Mexico Fishery Management Council | 35 | 0.5% | 28.4% |
| 21 | Government of New Zealand | 34 | 0.4% | 28.8% |
| 22 | States of Jersey | 34 | 0.4% | 29.3% |
| 23 | South Pacific Regional Fisheries Management Organisation (SPRFMO) | 34 | 0.4% | 29.7% |
| 24 | Government of Mauritius | 30 | 0.4% | 30.1% |
| 25 | New Zealand Government | 29 | 0.4% | 30.5% |
| 26 | Western and Central Pacific Fisheries Commission (WCPFC) | 28 | 0.4% | 30.9% |
| 27 | Oireachtas (Irish Parliament) | 28 | 0.4% | 31.2% |
| 28 | North Pacific Fisheries Commission | 28 | 0.4% | 31.6% |
| 29 | CCAMLR (Commission for the Conservation of Antarctic…) (CCAMLR v2) | 28 | 0.4% | 31.9% |
| 30 | Government of Canada, Minister of Justice | 27 | 0.4% | 32.3% |
| 31 | Department of Environmental Affairs, South Africa | 27 | 0.4% | 32.6% |
| 32 | ASCOBANS | 26 | 0.3% | 33.0% |
| 33 | Secretary of State for Environment, Food and Rural Affairs (UK) | 26 | 0.3% | 33.3% |
| 34 | Department of Agriculture, Forestry and Fisheries, South Africa | 26 | 0.3% | 33.7% |
| 35 | Ministry of Fisheries and Aquatic Resources Development | 25 | 0.3% | 34.0% |
| 36 | Government of Fiji | 23 | 0.3% | 34.3% |
| 37 | Government of Belize | 23 | 0.3% | 34.6% |
| 38 | Southern Indian Ocean Fisheries Agreement (SIOFA) | 22 | 0.3% | 34.9% |
| 39 | Government of Ireland | 22 | 0.3% | 35.1% |
| 40 | State of California Legislature | 22 | 0.3% | 35.4% |
| 41 | Foyle, Carlingford and Irish Lights Commission | 21 | 0.3% | 35.7% |
| 42 | New Zealand Governor-General in Council | 21 | 0.3% | 36.0% |
| 43 | Parliament of Australia | 21 | 0.3% | 36.3% |
| 44 | European Union | 21 | 0.3% | 36.5% |
| 45 | Prime Minister of Vietnam | 20 | 0.3% | 36.8% |
| 46 | Indian Ocean Tuna Commission (alt name, no acronym) | 20 | 0.3% | 37.0% |
| 47 | Government of Bermuda | 20 | 0.3% | 37.3% |
| 48 | Department of Agriculture, Food and the Marine (Ireland) | 20 | 0.3% | 37.6% |
| 49 | National Oceanic and Atmospheric Administration (NOAA) | 20 | 0.3% | 37.8% |
| 50 | State of California | 19 | 0.2% | 38.1% |

---

## Strategic Implications for the Allowlist

### URL-domain matching is the wrong primary lever
The build guide described a "domain allowlist" as a seed. That approach reaches **1.5% of corpus** (119 docs). The primary classification signal is `source_organisation`, not URL domain. Strategy must be inverted.

### Variant name problem is confirmed and significant
- **CCAMLR** appears at ranks 6 and 29 as two distinct strings: ~138 docs if merged
- **IOTC** appears at ranks 7 and 46 as two distinct strings: ~128 docs if merged
- **CCAMLR** also appears at rank 29 with a short-form `CCAMLR (...)` prefix
- There are likely more variants in the long tail (ranks 51+)
- An allowlist without variant handling will miss a meaningful fraction of obvious GOVERNMENT docs

### Pattern matching is the key to long-tail coverage
The corpus is heavily biased toward national governments and fisheries bodies, which follow predictable naming patterns:
- `Government of [Country]` — ranks 21, 24, 30, 36, 37, 39, 47
- `Parliament of [Country]` — ranks 15, 43
- `Ministry of [...]` — rank 35
- `Department of [...]` — ranks 14, 31, 34, 48
- `State of [...]` — ranks 40, 50
- `[Country] Government` — rank 25

Pattern matching on these prefixes will classify a large slice of the long tail as GOVERNMENT without requiring an explicit entry per country.

---

## Recommended Classification Priority (locked for Step 1 implementation)

Apply in order; stop at first match:

1. **`document_type` field gate** — if `document_type IN ('treaty', 'regulation', 'government_document', 'resolution')` → `GOVERNMENT`. Zero API cost, applies to all docs with a typed document_type.

2. **Exact-match allowlist** — curated list of top orgs with all known variant spellings (CCAMLR v1+v2, IOTC v1+v2, EU institutions, RFMOs, etc). Covers ~35–40% of corpus at zero API cost.

3. **Prefix pattern matching** — regex patterns on `source_organisation`:
   - `/^Government of /i` → GOVERNMENT
   - `/^Ministry of /i` → GOVERNMENT
   - `/^Department of /i` → GOVERNMENT
   - `/^Parliament of /i` → GOVERNMENT
   - `/^State of /i` → GOVERNMENT
   - `/^Congress of /i` → GOVERNMENT
   - `/\bCommission\b/i` (with exclusions for NGO commissions) → GOVERNMENT
   Covers national government long tail without per-country entries.

4. **URL domain allowlist** — 119 docs with `canonical_url`, matched against known gov/ngo domains. Minor contribution but zero cost.

5. **Haiku fallback** — remaining unclassified docs only. With steps 1–4 covering the bulk of the corpus, Haiku call volume should be materially reduced vs classifying all 7,707 docs.

---

## Open Questions for Next Session

- What is `document_type` field coverage? (Are values populated reliably, or is it sparse?)
- How many distinct `source_organisation` values exist in total? (Needed to size the allowlist effort)
- What fraction does step 3 (prefix patterns) cover vs step 2 (exact match)?
- CCAMLR and IOTC variants confirmed — run a broader variant scan on all top-100 orgs before finalising allowlist

*Next build step: Step 4 — `/api/research/ask` endpoint (per ASK-TIDELINE-BUILD-GUIDE.md)*
*Step 1 (source classification) is already marked complete in the SPEC — this diagnostic was for allowlist design only.*
