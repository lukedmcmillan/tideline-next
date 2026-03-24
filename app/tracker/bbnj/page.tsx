"use client";

import { useState, useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";
import * as d3 from "d3";
import * as topojson from "topojson-client";

Chart.register(...registerables);

const NAVY = "#0a1628";
const BLUE = "#1d6fa4";
const TEAL = "#1D9E75";
const WHITE = "#ffffff";
const OFF_WHITE = "#f8f9fa";
const BORDER = "#e2e8f0";
const MUTED = "#64748b";
const SANS = "'DM Sans', 'Helvetica Neue', Arial, sans-serif";
const SERIF = "Georgia, 'Times New Roman', serif";

// ─── Country name → ISO 3166-1 numeric code mapping (for world-atlas topology) ─
const COUNTRY_CODES: Record<string, string> = {
  "Afghanistan": "004", "Albania": "008", "Algeria": "012", "Angola": "024",
  "Antigua and Barbuda": "028", "Argentina": "032", "Armenia": "051",
  "Australia": "036", "Austria": "040", "Azerbaijan": "031",
  "Bahamas (The)": "044", "Bahamas": "044", "Bahrain": "048",
  "Bangladesh": "050", "Barbados": "052", "Belarus": "112", "Belgium": "056",
  "Belize": "084", "Benin": "204", "Bhutan": "064", "Bolivia (Plurinational State of)": "068",
  "Bolivia": "068", "Botswana": "072", "Brazil": "076", "Brunei Darussalam": "096",
  "Bulgaria": "100", "Burkina Faso": "854", "Burundi": "108",
  "Cabo Verde": "132", "Cambodia": "116", "Cameroon": "120", "Canada": "124",
  "Central African Republic": "140", "Chad": "148", "Chile": "152",
  "China": "156", "Colombia": "170", "Comoros": "174", "Congo": "178",
  "Costa Rica": "188", "Croatia": "191", "Cuba": "192", "Cyprus": "196",
  "Czech Republic": "203", "Czechia": "203",
  "C\u00f4te d'Ivoire": "384", "Cote d'Ivoire": "384",
  "Democratic Republic of the Congo": "180",
  "Denmark": "208", "Djibouti": "262", "Dominica": "212",
  "Dominican Republic": "214", "Ecuador": "218", "Egypt": "818",
  "El Salvador": "222", "Equatorial Guinea": "226", "Eritrea": "232",
  "Estonia": "233", "Eswatini": "748", "Ethiopia": "231",
  "European Union": "000",
  "Fiji": "242", "Finland": "246", "France": "250",
  "Gabon": "266", "Gambia (The)": "270", "Gambia": "270",
  "Georgia": "268", "Germany": "276", "Ghana": "288", "Greece": "300",
  "Grenada": "308", "Guatemala": "320", "Guinea": "324",
  "Guinea-Bissau": "624", "Guyana": "328",
  "Haiti": "332", "Honduras": "340", "Hungary": "348",
  "Iceland": "352", "India": "356", "Indonesia": "360",
  "Iran (Islamic Republic of)": "364", "Iran": "364",
  "Iraq": "368", "Ireland": "372", "Israel": "376", "Italy": "380",
  "Jamaica": "388", "Japan": "392", "Jordan": "400",
  "Kazakhstan": "398", "Kenya": "404", "Kiribati": "296",
  "Kuwait": "414", "Kyrgyzstan": "417",
  "Lao People's Democratic Republic": "418", "Laos": "418",
  "Latvia": "428", "Lebanon": "422", "Lesotho": "426", "Liberia": "430",
  "Libya": "434", "Liechtenstein": "438", "Lithuania": "440", "Luxembourg": "442",
  "Madagascar": "450", "Malawi": "454", "Malaysia": "458", "Maldives": "462",
  "Mali": "466", "Malta": "470", "Marshall Islands": "584",
  "Mauritania": "478", "Mauritius": "480", "Mexico": "484",
  "Micronesia (Federated States of)": "583", "Micronesia": "583",
  "Moldova": "498", "Republic of Moldova": "498", "Monaco": "492",
  "Mongolia": "496", "Montenegro": "499", "Morocco": "504", "Mozambique": "508",
  "Myanmar": "104", "Namibia": "516", "Nauru": "520", "Nepal": "524",
  "Netherlands": "528", "Netherlands (Kingdom of the)": "528",
  "New Zealand": "554", "Nicaragua": "558",
  "Niger": "562", "Nigeria": "566", "North Macedonia": "807", "Norway": "578",
  "Oman": "512", "Pakistan": "586", "Palau": "585", "Panama": "591",
  "Papua New Guinea": "598", "Paraguay": "600", "Peru": "604",
  "Philippines": "608", "Poland": "616", "Portugal": "620", "Qatar": "634",
  "Republic of Korea": "410", "Korea (Republic of)": "410", "South Korea": "410",
  "Romania": "642", "Russian Federation": "643", "Russia": "643", "Rwanda": "646",
  "Saint Kitts and Nevis": "659", "Saint Lucia": "662",
  "Saint Vincent and the Grenadines": "670", "Samoa": "882",
  "Sao Tome and Principe": "678", "Saudi Arabia": "682", "Senegal": "686",
  "Serbia": "688", "Seychelles": "690", "Sierra Leone": "694",
  "Singapore": "702", "Slovakia": "703", "Slovenia": "705",
  "Solomon Islands": "090", "Somalia": "706", "South Africa": "710",
  "South Sudan": "728", "Spain": "724", "Sri Lanka": "144", "Sudan": "736",
  "Suriname": "740", "Sweden": "752", "Switzerland": "756",
  "Syrian Arab Republic": "760", "Syria": "760",
  "Tajikistan": "762", "Tanzania": "834", "United Republic of Tanzania": "834",
  "Thailand": "764", "Timor-Leste": "626", "Togo": "768", "Tonga": "776",
  "Trinidad and Tobago": "780", "Tunisia": "788", "Turkey": "792", "T\u00fcrkiye": "792",
  "Turkmenistan": "795", "Tuvalu": "798", "Uganda": "800",
  "Ukraine": "804", "United Arab Emirates": "784",
  "United Kingdom": "826", "United Kingdom of Great Britain and Northern Ireland": "826",
  "United States of America": "840", "United States": "840",
  "Uruguay": "858", "Uzbekistan": "860", "Vanuatu": "548",
  "Venezuela (Bolivarian Republic of)": "862", "Venezuela": "862",
  "Viet Nam": "704", "Vietnam": "704", "Yemen": "887",
  "Zambia": "894", "Zimbabwe": "716",
};

// ─── Country → UN region mapping ──────────────────────────────────────────────
const REGIONS: Record<string, string> = {
  "Albania": "Europe", "Armenia": "Europe", "Austria": "Europe", "Belgium": "Europe",
  "Bulgaria": "Europe", "Croatia": "Europe", "Cyprus": "Europe", "Czech Republic": "Europe",
  "Czechia": "Europe", "Denmark": "Europe", "Estonia": "Europe", "Finland": "Europe",
  "France": "Europe", "Georgia": "Europe", "Germany": "Europe", "Greece": "Europe",
  "Hungary": "Europe", "Iceland": "Europe", "Ireland": "Europe", "Italy": "Europe",
  "Latvia": "Europe", "Liechtenstein": "Europe", "Lithuania": "Europe", "Luxembourg": "Europe",
  "Malta": "Europe", "Moldova": "Europe", "Republic of Moldova": "Europe", "Monaco": "Europe",
  "Montenegro": "Europe", "Netherlands": "Europe", "Netherlands (Kingdom of the)": "Europe",
  "North Macedonia": "Europe", "Norway": "Europe", "Poland": "Europe", "Portugal": "Europe",
  "Romania": "Europe", "Serbia": "Europe", "Slovakia": "Europe", "Slovenia": "Europe",
  "Spain": "Europe", "Sweden": "Europe", "Switzerland": "Europe", "Ukraine": "Europe",
  "United Kingdom": "Europe", "United Kingdom of Great Britain and Northern Ireland": "Europe",
  "Belarus": "Europe",

  "United States of America": "North America", "United States": "North America",
  "Canada": "North America",

  "Antigua and Barbuda": "Latin America", "Bahamas": "Latin America", "Bahamas (The)": "Latin America",
  "Barbados": "Latin America", "Belize": "Latin America", "Bolivia": "Latin America",
  "Bolivia (Plurinational State of)": "Latin America",
  "Brazil": "Latin America", "Chile": "Latin America", "Colombia": "Latin America",
  "Costa Rica": "Latin America", "Cuba": "Latin America", "Dominica": "Latin America",
  "Dominican Republic": "Latin America", "Ecuador": "Latin America",
  "El Salvador": "Latin America", "Grenada": "Latin America", "Guatemala": "Latin America",
  "Guyana": "Latin America", "Haiti": "Latin America", "Honduras": "Latin America",
  "Jamaica": "Latin America", "Mexico": "Latin America", "Nicaragua": "Latin America",
  "Panama": "Latin America", "Paraguay": "Latin America", "Peru": "Latin America",
  "Saint Kitts and Nevis": "Latin America", "Saint Lucia": "Latin America",
  "Saint Vincent and the Grenadines": "Latin America", "Suriname": "Latin America",
  "Trinidad and Tobago": "Latin America", "Uruguay": "Latin America",
  "Venezuela": "Latin America", "Venezuela (Bolivarian Republic of)": "Latin America",
  "Argentina": "Latin America",

  "Algeria": "Africa", "Angola": "Africa", "Benin": "Africa", "Botswana": "Africa",
  "Burkina Faso": "Africa", "Burundi": "Africa", "Cabo Verde": "Africa",
  "Cameroon": "Africa", "Central African Republic": "Africa", "Chad": "Africa",
  "Comoros": "Africa", "Congo": "Africa", "Democratic Republic of the Congo": "Africa",
  "C\u00f4te d'Ivoire": "Africa", "Cote d'Ivoire": "Africa", "Djibouti": "Africa",
  "Equatorial Guinea": "Africa", "Eritrea": "Africa", "Eswatini": "Africa",
  "Ethiopia": "Africa", "Gabon": "Africa", "Gambia": "Africa", "Gambia (The)": "Africa",
  "Ghana": "Africa", "Guinea": "Africa", "Guinea-Bissau": "Africa",
  "Kenya": "Africa", "Lesotho": "Africa", "Liberia": "Africa",
  "Madagascar": "Africa", "Malawi": "Africa", "Mali": "Africa", "Mauritania": "Africa",
  "Mauritius": "Africa", "Morocco": "Africa", "Mozambique": "Africa", "Namibia": "Africa",
  "Niger": "Africa", "Nigeria": "Africa", "Rwanda": "Africa",
  "Sao Tome and Principe": "Africa", "Senegal": "Africa", "Seychelles": "Africa",
  "Sierra Leone": "Africa", "Somalia": "Africa", "South Africa": "Africa",
  "South Sudan": "Africa", "Sudan": "Africa", "Tanzania": "Africa",
  "United Republic of Tanzania": "Africa",
  "Togo": "Africa", "Tunisia": "Africa", "Uganda": "Africa", "Zambia": "Africa", "Zimbabwe": "Africa",

  "Bahrain": "MENA", "Egypt": "MENA", "Iran": "MENA", "Iran (Islamic Republic of)": "MENA",
  "Iraq": "MENA", "Israel": "MENA", "Jordan": "MENA", "Kuwait": "MENA",
  "Lebanon": "MENA", "Libya": "MENA", "Oman": "MENA", "Qatar": "MENA",
  "Saudi Arabia": "MENA", "Syrian Arab Republic": "MENA", "Syria": "MENA",
  "T\u00fcrkiye": "MENA", "Turkey": "MENA",
  "United Arab Emirates": "MENA", "Yemen": "MENA",

  "Australia": "Pacific", "Fiji": "Pacific", "Kiribati": "Pacific",
  "Marshall Islands": "Pacific", "Micronesia": "Pacific",
  "Micronesia (Federated States of)": "Pacific",
  "Nauru": "Pacific", "New Zealand": "Pacific", "Palau": "Pacific",
  "Papua New Guinea": "Pacific", "Samoa": "Pacific", "Solomon Islands": "Pacific",
  "Tonga": "Pacific", "Tuvalu": "Pacific", "Vanuatu": "Pacific",

  "Afghanistan": "Asia-Pacific", "Azerbaijan": "Asia-Pacific", "Bangladesh": "Asia-Pacific",
  "Bhutan": "Asia-Pacific", "Brunei Darussalam": "Asia-Pacific", "Cambodia": "Asia-Pacific",
  "China": "Asia-Pacific", "India": "Asia-Pacific", "Indonesia": "Asia-Pacific",
  "Japan": "Asia-Pacific", "Kazakhstan": "Asia-Pacific", "Kyrgyzstan": "Asia-Pacific",
  "Lao People's Democratic Republic": "Asia-Pacific", "Laos": "Asia-Pacific",
  "Malaysia": "Asia-Pacific", "Maldives": "Asia-Pacific", "Mongolia": "Asia-Pacific",
  "Myanmar": "Asia-Pacific", "Nepal": "Asia-Pacific", "Pakistan": "Asia-Pacific",
  "Philippines": "Asia-Pacific", "Republic of Korea": "Asia-Pacific",
  "Korea (Republic of)": "Asia-Pacific", "South Korea": "Asia-Pacific",
  "Russian Federation": "Asia-Pacific", "Russia": "Asia-Pacific",
  "Singapore": "Asia-Pacific", "Sri Lanka": "Asia-Pacific",
  "Tajikistan": "Asia-Pacific", "Thailand": "Asia-Pacific",
  "Timor-Leste": "Asia-Pacific", "Turkmenistan": "Asia-Pacific",
  "Uzbekistan": "Asia-Pacific", "Viet Nam": "Asia-Pacific", "Vietnam": "Asia-Pacific",
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface Country {
  country_name: string;
  status: string;
  status_date: string | null;
  recorded_at: string;
  changed_from: string | null;
}

interface TimelineEntry {
  country_name: string;
  status: string;
  status_date: string | null;
  recorded_at: string;
}

interface Stats {
  ratified: number;
  signed: number;
  threshold: number;
  treaty_status: string;
  entry_into_force: string | null;
}

// ─── Stat Cards ───────────────────────────────────────────────────────────────

function StatCards({ stats }: { stats: Stats }) {
  const cards = [
    { label: "Ratified", value: String(stats.ratified), color: TEAL },
    { label: "Signed", value: String(stats.signed), color: BLUE },
    { label: "Threshold", value: String(stats.threshold), color: MUTED },
    { label: "Treaty Status", value: stats.treaty_status, color: stats.entry_into_force ? TEAL : "#d97706" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 40 }} className="stat-grid">
      {cards.map((c) => (
        <div key={c.label} style={{ background: WHITE, border: `1px solid ${BORDER}`, borderTop: `3px solid ${c.color}`, padding: "20px" }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: MUTED, marginBottom: 8, fontFamily: SANS }}>{c.label}</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: c.color, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "-0.04em" }}>{c.value}</div>
        </div>
      ))}
    </div>
  );
}

// ─── World Map ────────────────────────────────────────────────────────────────

function WorldMap({ countries }: { countries: Country[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const statusMap = new Map<string, string>();
    for (const c of countries) {
      const code = COUNTRY_CODES[c.country_name];
      if (code) statusMap.set(code, c.status);
    }

    const width = 800;
    const height = 420;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const projection = d3.geoNaturalEarth1().fitSize([width, height], { type: "Sphere" } as any);
    const path = d3.geoPath().projection(projection);

    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then((r) => r.json())
      .then((world) => {
        const land = topojson.feature(world, world.objects.countries) as any;

        svg.append("g")
          .selectAll("path")
          .data(land.features)
          .join("path")
          .attr("d", path as any)
          .attr("fill", (d: any) => {
            const id = String(d.id).padStart(3, "0");
            const status = statusMap.get(id);
            if (status === "ratified") return TEAL;
            if (status === "signed") return BLUE;
            return "#d1d5db";
          })
          .attr("stroke", WHITE)
          .attr("stroke-width", 0.5)
          .style("cursor", "pointer")
          .on("mouseenter", function (event: MouseEvent, d: any) {
            const id = String(d.id).padStart(3, "0");
            const status = statusMap.get(id);
            const name = d.properties?.name || "Unknown";
            d3.select(this).attr("stroke", NAVY).attr("stroke-width", 1.5);
            setTooltip({
              x: event.offsetX,
              y: event.offsetY,
              text: `${name}: ${status || "Not a party"}`,
            });
          })
          .on("mouseleave", function () {
            d3.select(this).attr("stroke", WHITE).attr("stroke-width", 0.5);
            setTooltip(null);
          });
      });
  }, [countries]);

  return (
    <div style={{ position: "relative", background: WHITE, border: `1px solid ${BORDER}`, padding: "20px", marginBottom: 40 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: MUTED, marginBottom: 16, fontFamily: SANS }}>Global Ratification Status</div>
      <svg ref={svgRef} style={{ width: "100%", height: "auto" }} />
      {tooltip && (
        <div style={{ position: "absolute", left: tooltip.x + 10, top: tooltip.y - 10, background: NAVY, color: WHITE, padding: "6px 10px", fontSize: 12, fontFamily: SANS, borderRadius: 3, pointerEvents: "none", zIndex: 10 }}>
          {tooltip.text}
        </div>
      )}
      <div style={{ display: "flex", gap: 20, marginTop: 12 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontFamily: SANS, color: MUTED }}>
          <span style={{ width: 12, height: 12, background: TEAL, borderRadius: 2, display: "inline-block" }} /> Ratified
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontFamily: SANS, color: MUTED }}>
          <span style={{ width: 12, height: 12, background: BLUE, borderRadius: 2, display: "inline-block" }} /> Signed
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontFamily: SANS, color: MUTED }}>
          <span style={{ width: 12, height: 12, background: "#d1d5db", borderRadius: 2, display: "inline-block" }} /> Not a party
        </span>
      </div>
    </div>
  );
}

// ─── Regional Breakdown ───────────────────────────────────────────────────────

function RegionalBreakdown({ countries }: { countries: Country[] }) {
  const regionData: Record<string, { ratified: number; total: number }> = {};
  const regionOrder = ["Europe", "Pacific", "Latin America", "Africa", "Asia-Pacific", "MENA", "North America"];

  for (const r of regionOrder) regionData[r] = { ratified: 0, total: 0 };

  for (const c of countries) {
    const region = REGIONS[c.country_name] || "Other";
    if (!regionData[region]) regionData[region] = { ratified: 0, total: 0 };
    regionData[region].total++;
    if (c.status === "ratified") regionData[region].ratified++;
  }

  return (
    <div style={{ background: WHITE, border: `1px solid ${BORDER}`, padding: "20px", marginBottom: 40 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: MUTED, marginBottom: 20, fontFamily: SANS }}>Ratification by Region</div>
      {regionOrder.map((region) => {
        const d = regionData[region];
        if (!d || d.total === 0) return null;
        const pct = Math.round((d.ratified / d.total) * 100);
        return (
          <div key={region} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontFamily: SANS, color: NAVY, fontWeight: 500 }}>{region}</span>
              <span style={{ fontSize: 12, fontFamily: SANS, color: MUTED }}>{d.ratified}/{d.total} ({pct}%)</span>
            </div>
            <div style={{ height: 8, background: "#e5e7eb", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: TEAL, borderRadius: 4, transition: "width 0.5s" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Timeline Chart ───────────────────────────────────────────────────────────

function TimelineChart({ timeline }: { timeline: TimelineEntry[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current || timeline.length === 0) return;

    // Build cumulative count by date
    const sorted = [...timeline]
      .filter((t) => t.status_date)
      .sort((a, b) => new Date(a.status_date!).getTime() - new Date(b.status_date!).getTime());

    const dateMap = new Map<string, number>();
    let cumulative = 0;
    for (const entry of sorted) {
      const date = new Date(entry.status_date!).toISOString().split("T")[0];
      cumulative++;
      dateMap.set(date, cumulative);
    }

    const labels = Array.from(dateMap.keys());
    const data = Array.from(dateMap.values());

    if (chartRef.current) chartRef.current.destroy();

    chartRef.current = new Chart(canvasRef.current, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Cumulative Ratifications",
            data,
            borderColor: TEAL,
            backgroundColor: `${TEAL}20`,
            fill: true,
            tension: 0.3,
            pointRadius: 2,
          },
          {
            label: "Entry into Force Threshold",
            data: labels.map(() => 60),
            borderColor: "#ef4444",
            borderDash: [6, 4],
            pointRadius: 0,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true, position: "bottom", labels: { font: { family: SANS, size: 12 } } },
        },
        scales: {
          x: {
            ticks: { font: { family: SANS, size: 11 }, maxTicksLimit: 8 },
            grid: { display: false },
          },
          y: {
            beginAtZero: true,
            ticks: { font: { family: SANS, size: 11 } },
            grid: { color: "#f3f4f6" },
          },
        },
      },
    });

    return () => {
      if (chartRef.current) chartRef.current.destroy();
    };
  }, [timeline]);

  return (
    <div style={{ background: WHITE, border: `1px solid ${BORDER}`, padding: "20px", marginBottom: 40 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: MUTED, marginBottom: 16, fontFamily: SANS }}>Ratification Timeline</div>
      <canvas ref={canvasRef} />
    </div>
  );
}

// ─── Country Table ────────────────────────────────────────────────────────────

function CountryTable({ countries }: { countries: Country[] }) {
  const [filter, setFilter] = useState<"all" | "ratified" | "signed">("all");

  const filtered = countries
    .filter((c) => filter === "all" || c.status === filter)
    .sort((a, b) => a.country_name.localeCompare(b.country_name));

  return (
    <div style={{ background: WHITE, border: `1px solid ${BORDER}`, padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: MUTED, fontFamily: SANS }}>
          All Countries ({filtered.length})
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {(["all", "ratified", "signed"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: "5px 14px", border: `1px solid ${filter === f ? NAVY : BORDER}`, background: filter === f ? NAVY : WHITE, color: filter === f ? WHITE : NAVY, fontSize: 12, fontFamily: SANS, borderRadius: 3, cursor: "pointer", fontWeight: filter === f ? 600 : 400 }}>
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: SANS, fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${BORDER}` }}>
              <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: MUTED }}>Country</th>
              <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: MUTED }}>Status</th>
              <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: MUTED }}>Date</th>
              <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: MUTED }}>Region</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.country_name} style={{ borderBottom: `1px solid ${BORDER}` }}>
                <td style={{ padding: "10px 12px", fontWeight: 500, color: NAVY }}>{c.country_name}</td>
                <td style={{ padding: "10px 12px" }}>
                  <span style={{
                    display: "inline-block",
                    padding: "2px 10px",
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 600,
                    background: c.status === "ratified" ? `${TEAL}18` : c.status === "signed" ? `${BLUE}18` : "#f3f4f6",
                    color: c.status === "ratified" ? TEAL : c.status === "signed" ? BLUE : MUTED,
                  }}>
                    {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                  </span>
                </td>
                <td style={{ padding: "10px 12px", color: MUTED }}>
                  {c.status_date ? new Date(c.status_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                </td>
                <td style={{ padding: "10px 12px", color: MUTED }}>{REGIONS[c.country_name] || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BBNJTracker() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/treaty-status")
      .then((r) => r.json())
      .then((data) => {
        setCountries(data.countries || []);
        setTimeline(data.timeline || []);
        setStats(data.stats || null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ fontFamily: SANS, color: NAVY, background: OFF_WHITE, minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @media (max-width: 768px) {
          .stat-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ background: NAVY, borderBottom: `3px solid ${BLUE}`, padding: "0 20px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <a href="/" style={{ fontSize: 20, fontWeight: 700, color: WHITE, fontFamily: SERIF, letterSpacing: "-0.02em", textDecoration: "none" }}>TIDELINE</a>
            <span style={{ width: 1, height: 14, background: "rgba(255,255,255,0.2)", display: "inline-block" }} />
            <span style={{ fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", fontFamily: SANS }}>Treaty Tracker</span>
          </div>
          <a href="/platform/feed" style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, fontFamily: SANS, textDecoration: "none" }}>← Back to feed</a>
        </div>
      </div>

      {/* Hero */}
      <div style={{ background: NAVY, padding: "48px 20px 52px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: TEAL, marginBottom: 14, fontFamily: SANS }}>Live Intelligence Tracker</div>
          <h1 style={{ fontSize: "clamp(28px,5vw,42px)", fontWeight: 700, color: WHITE, fontFamily: SERIF, letterSpacing: "-0.02em", lineHeight: 1.15, margin: "0 0 12px" }}>
            BBNJ High Seas Treaty
          </h1>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", fontFamily: SANS, maxWidth: 600, lineHeight: 1.7 }}>
            Agreement under UNCLOS on the Conservation and Sustainable Use of Marine Biological Diversity of Areas beyond National Jurisdiction. Adopted 19 June 2023. Entered into force 17 January 2026.
          </p>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 20px 80px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: 14, color: MUTED, fontFamily: SANS }}>Loading treaty data...</div>
          </div>
        ) : (
          <>
            {stats && <StatCards stats={stats} />}
            <WorldMap countries={countries} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="stat-grid">
              <RegionalBreakdown countries={countries} />
              <TimelineChart timeline={timeline} />
            </div>
            <CountryTable countries={countries} />
          </>
        )}
      </div>
    </div>
  );
}
