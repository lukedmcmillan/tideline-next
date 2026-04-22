"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

// ── Design tokens (dark, matches tracker dashboard) ────────────────────────
const BG      = "#0B1628";
const SURFACE = "#0D1E35";
const SURF_HI = "#122845";
const BORDER  = "#1A2A44";
const BORDER2 = "#24375A";
const TEXT0   = "#E8EDF4";
const TEXT1   = "#8BA0BC";
const TEXT2   = "#5B6F8C";
const TEAL    = "#1D9E75";
const TEAL_B  = "#27C893";
const AMBER   = "#EF9F27";
const F       = "'DM Sans', system-ui, sans-serif";
const M       = "'DM Mono', monospace";

// ── Types ─────────────────────────────────────────────────────────────────
interface EntityDashboardItem {
  id: string;
  name: string;
  entity_type: string;
  tracker_tag: string | null;
  activity_30d: number;
  material_7d: number;
  last_seen: string | null;
  daily_counts: number[];
  daily_material: boolean[];
}

type SignalState = "HIGH" | "WATCH" | "QUIET" | "DORMANT";
type SignalFilter = "all" | SignalState;

// ── Helpers ────────────────────────────────────────────────────────────────
function signalState(e: EntityDashboardItem): SignalState {
  if (e.material_7d >= 3) return "HIGH";
  if (e.material_7d >= 1) return "WATCH";
  if (e.activity_30d > 0) return "QUIET";
  return "DORMANT";
}

function signalMeta(s: SignalState): { label: string; color: string; border: string } {
  switch (s) {
    case "HIGH":    return { label: "HIGH",    color: TEAL_B,  border: `1px solid ${TEAL_B}` };
    case "WATCH":   return { label: "WATCH",   color: AMBER,   border: `1px solid ${AMBER}` };
    case "QUIET":   return { label: "QUIET",   color: TEXT2,   border: `1px solid ${BORDER2}` };
    case "DORMANT": return { label: "DORMANT", color: "#2A3F5F", border: "1px solid #1E3050" };
  }
}

function timeAgo(iso: string | null): string {
  if (!iso) return "never";
  const diff = Date.now() - new Date(iso).getTime();
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 1) return "< 1h";
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

const TRACKER_LABELS: Record<string, string> = {
  "isa": "ISA", "bbnj": "BBNJ", "iuu": "IUU", "30x30": "30x30",
  "blue-finance": "Blue Finance", "imo-shipping": "IMO",
  "offshore-wind": "Offshore Wind", "cites-marine": "CITES",
  "wto-fisheries": "WTO", "plastics": "Plastics",
  "governance": "Governance",
};

const TYPE_LABELS: Record<string, string> = {
  country: "Country", organization: "Org", company: "Company",
  treaty: "Treaty", person: "Person", body: "Body",
  fund: "Fund", vessel: "Vessel",
};

function typeLabel(t: string): string {
  return TYPE_LABELS[t] ?? t.charAt(0).toUpperCase() + t.slice(1);
}

// ── Signal Badge ───────────────────────────────────────────────────────────
function SignalBadge({ signal }: { signal: SignalState }) {
  const { label, color, border } = signalMeta(signal);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: 64, fontSize: 9, fontWeight: 700, letterSpacing: ".06em",
      textTransform: "uppercase", fontFamily: M,
      color, border, borderRadius: 3, padding: "3px 0",
    }}>
      {label}
    </span>
  );
}

// ── Sparkline ──────────────────────────────────────────────────────────────
// 7 dots: index 0 = 6 days ago (left), index 6 = today (right)
function EntitySparkline({ counts, material }: { counts: number[]; material: boolean[] }) {
  const xs = counts.map((_, i) => 3 + i * (54 / 6));
  return (
    <svg width="60" height="16" viewBox="0 0 60 16" style={{ display: "block", flexShrink: 0 }}>
      {xs.map((x, i) => {
        const fill = material[i] ? AMBER : counts[i] > 0 ? TEAL_B : "#1E3050";
        return <circle key={i} cx={x.toFixed(1)} cy="8" r="2.5" fill={fill} />;
      })}
    </svg>
  );
}

// ── Summary Bar ────────────────────────────────────────────────────────────
function SummaryBar({ entities, tierLimit }: {
  entities: EntityDashboardItem[];
  tierLimit: number | null;
}) {
  const material   = entities.filter(e => e.material_7d >= 1).length;
  const quiet      = entities.filter(e => e.material_7d === 0 && e.activity_30d > 0).length;
  const dormant    = entities.filter(e => e.activity_30d === 0).length;
  const total      = entities.length;
  const totalLabel = tierLimit !== null ? `${total} / ${tierLimit}` : String(total);

  const cells = [
    { label: "MATERIAL THIS WEEK", value: material,    accent: material > 0 ? TEAL_B : TEXT2 },
    { label: "QUIET THIS WEEK",    value: quiet,        accent: TEXT1 },
    { label: "DORMANT",            value: dormant,      accent: TEXT2 },
    { label: "TOTAL TRACKED",      value: totalLabel,   accent: TEXT0 },
  ];

  return (
    <div style={{ display: "flex", borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
      {cells.map((c, i) => (
        <div key={c.label} style={{
          flex: 1,
          padding: "14px 20px",
          borderRight: i < cells.length - 1 ? `1px solid ${BORDER}` : "none",
        }}>
          <div style={{ fontFamily: M, fontSize: 9, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", color: TEXT2, marginBottom: 6 }}>
            {c.label}
          </div>
          <div style={{ fontFamily: M, fontSize: 22, fontWeight: 700, color: c.accent, lineHeight: 1, letterSpacing: "-.01em" }}>
            {c.value}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Filter Row ─────────────────────────────────────────────────────────────
function FilterRow({ signal, onSignal, types, selected, onTypes, search, onSearch }: {
  signal: SignalFilter;
  onSignal: (s: SignalFilter) => void;
  types: string[];
  selected: string[];
  onTypes: (t: string[]) => void;
  search: string;
  onSearch: (s: string) => void;
}) {
  const segments: { key: SignalFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "HIGH", label: "Material" },
    { key: "QUIET", label: "Quiet" },
    { key: "DORMANT", label: "Dormant" },
  ];

  const toggleType = (t: string) => {
    onTypes(selected.includes(t) ? selected.filter(x => x !== t) : [...selected, t]);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 20px", borderBottom: `1px solid ${BORDER}`, flexShrink: 0, flexWrap: "wrap" }}>
      {/* Segmented control */}
      <div style={{ display: "flex", background: SURFACE, borderRadius: 5, border: `1px solid ${BORDER}`, overflow: "hidden", flexShrink: 0 }}>
        {segments.map(s => (
          <button key={s.key} onClick={() => onSignal(s.key)} style={{
            padding: "5px 14px", fontFamily: F, fontSize: 12, fontWeight: signal === s.key ? 600 : 400,
            color: signal === s.key ? TEXT0 : TEXT1,
            background: signal === s.key ? SURF_HI : "transparent",
            border: "none", borderRight: `1px solid ${BORDER}`, cursor: "pointer",
          }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Type pills */}
      {types.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {types.map(t => {
            const on = selected.includes(t);
            return (
              <button key={t} onClick={() => toggleType(t)} style={{
                padding: "4px 10px", fontSize: 10, fontFamily: M, fontWeight: 600,
                letterSpacing: ".05em", textTransform: "uppercase",
                color: on ? TEXT0 : TEXT2,
                background: "transparent",
                border: on ? `1px solid ${BORDER2}` : `1px solid #1A2A44`,
                borderRadius: 3, cursor: "pointer",
              }}>
                {typeLabel(t)}
              </button>
            );
          })}
        </div>
      )}

      {/* Search */}
      <div style={{ marginLeft: "auto", position: "relative", flexShrink: 0 }}>
        <svg style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} width="13" height="13" viewBox="0 0 13 13" fill="none">
          <circle cx="6" cy="6" r="4.5" stroke={TEXT2} strokeWidth="1.3" />
          <path d="M9.5 9.5l2.5 2.5" stroke={TEXT2} strokeWidth="1.3" strokeLinecap="round" />
        </svg>
        <input
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder="Search entities..."
          style={{
            background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 5,
            padding: "6px 10px 6px 28px", fontFamily: F, fontSize: 12, color: TEXT0,
            outline: "none", width: 180,
          }}
        />
      </div>
    </div>
  );
}

// ── Entity Table Row ───────────────────────────────────────────────────────
function EntityRow({ entity, onMenuClick }: {
  entity: EntityDashboardItem;
  onMenuClick: (id: string, name: string) => void;
}) {
  const [hov, setHov] = useState(false);
  const sig = signalState(entity);
  const tracker = entity.tracker_tag ? (TRACKER_LABELS[entity.tracker_tag] ?? entity.tracker_tag) : null;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center",
        padding: "0 20px",
        height: 48,
        borderBottom: `1px solid ${BORDER}`,
        background: hov ? "rgba(29,158,117,0.05)" : "transparent",
        transition: "background .1s",
      }}
      className="entity-row"
    >
      {/* Signal badge */}
      <div style={{ width: 72, flexShrink: 0 }}>
        <SignalBadge signal={sig} />
      </div>

      {/* Name */}
      <a
        href={`/platform/entities/${entity.id}`}
        style={{
          flex: 1, minWidth: 0, fontSize: 13, fontWeight: 500,
          color: hov ? TEXT0 : TEXT0,
          textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          paddingRight: 12,
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = TEAL_B; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = TEXT0; }}
      >
        {entity.name}
      </a>

      {/* Type pill */}
      <div style={{ width: 80, flexShrink: 0, paddingRight: 8 }}>
        <span style={{
          fontSize: 9, fontFamily: M, fontWeight: 600, letterSpacing: ".06em",
          textTransform: "uppercase", color: TEXT2,
          border: `1px solid ${BORDER}`, borderRadius: 3, padding: "2px 6px",
          whiteSpace: "nowrap",
        }}>
          {typeLabel(entity.entity_type)}
        </span>
      </div>

      {/* Tracker pill */}
      <div style={{ width: 80, flexShrink: 0, paddingRight: 16 }}>
        {tracker ? (
          <span style={{
            fontSize: 9, fontFamily: M, fontWeight: 600, letterSpacing: ".06em",
            textTransform: "uppercase", color: TEAL,
            border: `1px solid rgba(29,158,117,0.3)`, borderRadius: 3, padding: "2px 6px",
            whiteSpace: "nowrap",
          }}>
            {tracker}
          </span>
        ) : (
          <span style={{ fontSize: 9, fontFamily: M, color: TEXT2 }}>-</span>
        )}
      </div>

      {/* Sparkline */}
      <div style={{ width: 68, flexShrink: 0, paddingRight: 16 }}>
        <EntitySparkline counts={entity.daily_counts} material={entity.daily_material} />
      </div>

      {/* 30d count */}
      <div style={{ width: 44, flexShrink: 0, textAlign: "right", paddingRight: 20, fontFamily: M, fontSize: 12, color: entity.activity_30d > 0 ? TEXT1 : TEXT2 }}>
        {entity.activity_30d}
      </div>

      {/* Last seen */}
      <div style={{ width: 88, flexShrink: 0, textAlign: "right", paddingRight: 12, fontFamily: M, fontSize: 11, color: TEXT2 }}>
        {timeAgo(entity.last_seen)}
      </div>

      {/* Ellipsis menu */}
      <button
        onClick={e => { e.stopPropagation(); onMenuClick(entity.id, entity.name); }}
        style={{
          width: 28, height: 28, background: "none", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: hov ? TEXT1 : "transparent", borderRadius: 3, flexShrink: 0,
          transition: "color .1s",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <circle cx="7" cy="2.5" r="1.2" /><circle cx="7" cy="7" r="1.2" /><circle cx="7" cy="11.5" r="1.2" />
        </svg>
      </button>
    </div>
  );
}

// ── Mobile Entity Card ─────────────────────────────────────────────────────
function EntityCard({ entity }: { entity: EntityDashboardItem }) {
  const sig = signalState(entity);
  const tracker = entity.tracker_tag ? (TRACKER_LABELS[entity.tracker_tag] ?? entity.tracker_tag) : null;
  return (
    <a
      href={`/platform/entities/${entity.id}`}
      style={{
        display: "block", textDecoration: "none",
        margin: "0 12px 8px",
        background: SURFACE, border: `1px solid ${BORDER}`,
        borderRadius: 6, padding: "12px 14px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: TEXT0, flex: 1, marginRight: 8 }}>{entity.name}</span>
        <SignalBadge signal={sig} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 9, fontFamily: M, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: TEXT2, border: `1px solid ${BORDER}`, borderRadius: 3, padding: "2px 6px" }}>
          {typeLabel(entity.entity_type)}
        </span>
        {tracker && (
          <span style={{ fontSize: 9, fontFamily: M, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: TEAL, border: `1px solid rgba(29,158,117,0.3)`, borderRadius: 3, padding: "2px 6px" }}>
            {tracker}
          </span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <EntitySparkline counts={entity.daily_counts} material={entity.daily_material} />
        <span style={{ fontFamily: M, fontSize: 11, color: TEXT2 }}>{timeAgo(entity.last_seen)}</span>
      </div>
    </a>
  );
}

// ── Loading Skeleton ───────────────────────────────────────────────────────
function SkeletonRow({ i }: { i: number }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 16,
      padding: "0 20px", height: 48, borderBottom: `1px solid ${BORDER}`,
    }}>
      <div style={{ width: 64, height: 20, background: SURF_HI, borderRadius: 3, animation: `skpulse 1.4s ease-in-out ${i * 0.1}s infinite` }} />
      <div style={{ flex: 1, height: 14, background: SURF_HI, borderRadius: 3, maxWidth: 220, animation: `skpulse 1.4s ease-in-out ${i * 0.1}s infinite` }} />
      <div style={{ width: 60, height: 14, background: SURF_HI, borderRadius: 3, animation: `skpulse 1.4s ease-in-out ${i * 0.1}s infinite` }} />
      <div style={{ width: 60, height: 14, background: SURF_HI, borderRadius: 3, animation: `skpulse 1.4s ease-in-out ${i * 0.1}s infinite` }} />
      <div style={{ width: 60, height: 14, background: SURF_HI, borderRadius: 3, animation: `skpulse 1.4s ease-in-out ${i * 0.1}s infinite` }} />
    </div>
  );
}

// ── Toast ──────────────────────────────────────────────────────────────────
function Toast({ message }: { message: string }) {
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      background: SURFACE, border: `1px solid ${BORDER2}`,
      borderLeft: `3px solid ${TEAL}`, borderRadius: 4,
      padding: "12px 16px", maxWidth: 340,
      fontFamily: F, fontSize: 13, color: TEXT0,
      boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
    }}>
      {message}
    </div>
  );
}

// ── Ellipsis Menu Popover ─────────────────────────────────────────────────
function MenuPopover({ entityId, entityName, onClose }: {
  entityId: string; entityName: string; onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  return (
    <div ref={ref} style={{
      position: "fixed", zIndex: 200,
      background: SURFACE, border: `1px solid ${BORDER2}`, borderRadius: 6,
      padding: "4px 0", minWidth: 140,
      boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
      bottom: 64, right: 24,
    }}>
      <a href={`/platform/entities/${entityId}`} style={{ display: "block", padding: "8px 14px", fontFamily: F, fontSize: 13, color: TEXT0, textDecoration: "none" }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = SURF_HI; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
        View entity
      </a>
      <button onClick={onClose} style={{
        display: "block", width: "100%", textAlign: "left",
        padding: "8px 14px", fontFamily: F, fontSize: 13, color: "#E24B4A",
        background: "none", border: "none", cursor: "pointer",
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = SURF_HI; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
        Remove (coming soon)
      </button>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function EntitiesPage() {
  const router = useRouter();
  const [entities, setEntities] = useState<EntityDashboardItem[]>([]);
  const [tier, setTier] = useState("free");
  const [tierLimit, setTierLimit] = useState<number | null>(10);
  const [loading, setLoading] = useState(true);
  const [signalFilter, setSignalFilter] = useState<SignalFilter>("all");
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<{ id: string; name: string } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/entities/dashboard")
      .then(r => r.ok ? r.json() : { entities: [], tier: "free", tier_limit: 10 })
      .then(d => {
        setEntities(d.entities ?? []);
        setTier(d.tier ?? "free");
        setTierLimit(d.tier_limit ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Debounce search
  const handleSearch = useCallback((val: string) => {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearchDebounced(val), 300);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4500);
  };

  const uniqueTypes = [...new Set(entities.map(e => e.entity_type))].filter(Boolean).sort();

  const filtered = entities
    .filter(e => {
      if (signalFilter === "all") return true;
      if (signalFilter === "HIGH")    return e.material_7d >= 1;   // Material = any material move
      if (signalFilter === "QUIET")   return e.material_7d === 0 && e.activity_30d > 0;
      if (signalFilter === "DORMANT") return e.activity_30d === 0;
      return true;
    })
    .filter(e => typeFilter.length === 0 || typeFilter.includes(e.entity_type))
    .filter(e => !searchDebounced || e.name.toLowerCase().includes(searchDebounced.toLowerCase()));

  return (
    <>
      <style>{`
        @keyframes skpulse { 0%,100% { opacity:.4 } 50% { opacity:.15 } }
        @media(max-width:768px) {
          .ent-table { display: none !important; }
          .ent-cards { display: block !important; }
          .ent-header-title { font-size: 13px !important; }
          .ent-summarybar > div { padding: 10px 12px !important; }
          .ent-summarybar .ent-metric-val { font-size: 18px !important; }
          .ent-filterrow { padding: 8px 12px !important; }
        }
      `}</style>

      <div style={{ background: BG, height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: F }}>

        {/* Header bar */}
        <div style={{ height: 44, background: SURFACE, borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", padding: "0 20px", flexShrink: 0 }}>
          <span className="ent-header-title" style={{ fontSize: 14, fontWeight: 600, color: TEXT0 }}>My Entities</span>
          <span style={{ width: 1, height: 14, background: BORDER2, margin: "0 14px" }} />
          <span style={{ fontSize: 11, color: TEXT1 }}>Activity scored daily against significance threshold</span>
          <div style={{ marginLeft: "auto" }}>
            <button
              onClick={() => showToast("Entity picker coming soon. For now, ask support to add entities.")}
              style={{
                background: TEAL, color: "#0A1628", border: "none", borderRadius: 4,
                padding: "6px 14px", fontSize: 12, fontWeight: 600, fontFamily: F,
                cursor: "pointer", letterSpacing: ".01em",
              }}
            >
              + Add entity
            </button>
          </div>
        </div>

        {/* Summary bar */}
        {!loading && (
          <div className="ent-summarybar" style={{ display: "flex", borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
            {[
              { label: "MATERIAL THIS WEEK", value: entities.filter(e => e.material_7d >= 1).length, accent: entities.filter(e => e.material_7d >= 1).length > 0 ? TEAL_B : TEXT2 },
              { label: "QUIET THIS WEEK",    value: entities.filter(e => e.material_7d === 0 && e.activity_30d > 0).length, accent: TEXT1 },
              { label: "DORMANT",            value: entities.filter(e => e.activity_30d === 0).length, accent: TEXT2 },
              { label: "TOTAL TRACKED",      value: tierLimit !== null ? `${entities.length} / ${tierLimit}` : String(entities.length), accent: TEXT0 },
            ].map((c, i, arr) => (
              <div key={c.label} style={{ flex: 1, padding: "14px 20px", borderRight: i < arr.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                <div style={{ fontFamily: M, fontSize: 9, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", color: TEXT2, marginBottom: 6 }}>{c.label}</div>
                <div className="ent-metric-val" style={{ fontFamily: M, fontSize: 22, fontWeight: 700, color: c.accent, lineHeight: 1, letterSpacing: "-.01em" }}>{c.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filter row */}
        <FilterRow
          signal={signalFilter}
          onSignal={setSignalFilter}
          types={uniqueTypes}
          selected={typeFilter}
          onTypes={setTypeFilter}
          search={search}
          onSearch={handleSearch}
        />

        {/* Content area */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 0 }}>

          {loading ? (
            <div>
              {[0, 1, 2, 3, 4].map(i => <SkeletonRow key={i} i={i} />)}
            </div>
          ) : entities.length === 0 ? (
            /* Empty state — no entities tracked */
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: 40 }}>
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="18" stroke={BORDER2} strokeWidth="1.5" />
                <circle cx="15" cy="16" r="4.5" stroke={TEXT2} strokeWidth="1.3" />
                <path d="M7 30c0-4 3.5-7 8-7s8 3 8 7" stroke={TEXT2} strokeWidth="1.3" strokeLinecap="round" />
                <circle cx="26" cy="16" r="3.5" stroke={TEXT2} strokeWidth="1.3" />
                <path d="M22.5 30c0-3 2.5-5 5.5-5" stroke={TEXT2} strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              <div style={{ fontFamily: F, fontSize: 15, fontWeight: 500, color: TEXT1, textAlign: "center" }}>
                You are not tracking any entities yet.
              </div>
              <a href="/platform/directory" style={{
                display: "inline-block", fontFamily: F, fontSize: 12, fontWeight: 600,
                color: TEAL_B, border: `1px solid rgba(39,200,147,0.3)`,
                borderRadius: 4, padding: "7px 18px", textDecoration: "none",
              }}>
                Browse entities
              </a>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="ent-table" style={{ flex: 1, overflowY: "auto" }}>
                {/* Table header */}
                <div style={{
                  display: "flex", alignItems: "center", padding: "0 20px", height: 32,
                  borderBottom: `1px solid ${BORDER}`, background: SURFACE, position: "sticky", top: 0, zIndex: 10,
                }}>
                  <div style={{ width: 72, fontFamily: M, fontSize: 9, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: TEXT2 }}>SIGNAL</div>
                  <div style={{ flex: 1, fontFamily: M, fontSize: 9, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: TEXT2 }}>ENTITY</div>
                  <div style={{ width: 80, fontFamily: M, fontSize: 9, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: TEXT2 }}>TYPE</div>
                  <div style={{ width: 80, fontFamily: M, fontSize: 9, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: TEXT2 }}>TRACKER</div>
                  <div style={{ width: 68, fontFamily: M, fontSize: 9, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: TEXT2 }}>7 DAYS</div>
                  <div style={{ width: 44, fontFamily: M, fontSize: 9, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: TEXT2, textAlign: "right", paddingRight: 20 }}>30D</div>
                  <div style={{ width: 88, fontFamily: M, fontSize: 9, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: TEXT2, textAlign: "right", paddingRight: 12 }}>LAST SEEN</div>
                  <div style={{ width: 28 }} />
                </div>

                {/* Rows */}
                {filtered.length > 0 ? (
                  filtered.map(e => (
                    <EntityRow
                      key={e.id}
                      entity={e}
                      onMenuClick={(id, name) => setMenuOpen({ id, name })}
                    />
                  ))
                ) : (
                  <div style={{ padding: "40px 20px", textAlign: "center", fontFamily: F, fontSize: 13, color: TEXT2 }}>
                    No entities match this filter.
                  </div>
                )}
              </div>

              {/* Mobile cards */}
              <div className="ent-cards" style={{ display: "none", flex: 1, overflowY: "auto", paddingTop: 8 }}>
                {filtered.length > 0 ? (
                  filtered.map(e => <EntityCard key={e.id} entity={e} />)
                ) : (
                  <div style={{ padding: "40px 20px", textAlign: "center", fontFamily: F, fontSize: 13, color: TEXT2 }}>
                    No entities match this filter.
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Contextual menu popover */}
        {menuOpen && (
          <MenuPopover
            entityId={menuOpen.id}
            entityName={menuOpen.name}
            onClose={() => setMenuOpen(null)}
          />
        )}

        {/* Toast */}
        {toast && <Toast message={toast} />}
      </div>
    </>
  );
}
