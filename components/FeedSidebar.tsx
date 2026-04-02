"use client";

const F = "var(--font-sans), 'DM Sans', system-ui, sans-serif";
const M = "var(--font-mono), 'DM Mono', monospace";
const NAVY = "#0A1628";
const TEAL = "#1D9E75";
const T4 = "#9AA0A6";

const TRACKERS: { slug: string; label: string }[] = [
  { slug: "bbnj", label: "BBNJ Treaty" },
  { slug: "isa", label: "ISA Mining" },
  { slug: "iuu", label: "IUU Enforcement" },
  { slug: "30x30", label: "30x30 Protection" },
  { slug: "blue_finance", label: "Blue Finance" },
  { slug: "imo_shipping", label: "IMO Shipping" },
  { slug: "whaling", label: "Whaling" },
  { slug: "ocean_carbon", label: "Ocean Carbon" },
  { slug: "msp", label: "Marine Spatial Planning" },
  { slug: "arctic", label: "Arctic" },
];

export default function FeedSidebar({
  activeTracker,
  onSelect,
  unreadCounts,
  open,
  onClose,
}: {
  activeTracker: string | null;
  onSelect: (slug: string | null) => void;
  unreadCounts: Record<string, number>;
  open: boolean;
  onClose: () => void;
}) {
  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  return (
    <>
      {/* Mobile overlay backdrop */}
      {open && (
        <div
          onClick={onClose}
          className="sidebar-backdrop"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 39,
            display: "none",
          }}
        />
      )}

      <aside
        className={`feed-sidebar ${open ? "feed-sidebar-open" : ""}`}
        style={{
          width: 240,
          background: NAVY,
          minHeight: "100vh",
          padding: "24px 0",
          flexShrink: 0,
          position: "sticky",
          top: 0,
          alignSelf: "flex-start",
        }}
      >
        {/* Header */}
        <div style={{ padding: "0 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{
            fontFamily: M,
            fontSize: 10,
            fontWeight: 600,
            color: T4,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 4,
          }}>
            TRACKERS
          </div>
        </div>

        {/* All */}
        <button
          onClick={() => { onSelect(null); onClose(); }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            padding: "10px 20px",
            background: "none",
            border: "none",
            borderLeft: activeTracker === null ? `3px solid ${TEAL}` : "3px solid transparent",
            cursor: "pointer",
            fontFamily: F,
            fontSize: 13,
            fontWeight: activeTracker === null ? 500 : 400,
            color: activeTracker === null ? "#ffffff" : "rgba(255,255,255,0.6)",
            textAlign: "left",
          }}
        >
          All stories
          {totalUnread > 0 && (
            <span style={{
              fontFamily: M,
              fontSize: 10,
              fontWeight: 600,
              color: "#ffffff",
              background: TEAL,
              borderRadius: 10,
              padding: "1px 7px",
              minWidth: 18,
              textAlign: "center",
            }}>
              {totalUnread}
            </span>
          )}
        </button>

        {/* Tracker list */}
        {TRACKERS.map((t) => {
          const count = unreadCounts[t.slug] || 0;
          const isActive = activeTracker === t.slug;
          return (
            <button
              key={t.slug}
              onClick={() => { onSelect(t.slug); onClose(); }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                padding: "10px 20px",
                background: "none",
                border: "none",
                borderLeft: isActive ? `3px solid ${TEAL}` : "3px solid transparent",
                cursor: "pointer",
                fontFamily: F,
                fontSize: 13,
                fontWeight: isActive ? 500 : 400,
                color: isActive ? "#ffffff" : "rgba(255,255,255,0.6)",
                textAlign: "left",
              }}
            >
              {t.label}
              {count > 0 && (
                <span style={{
                  fontFamily: M,
                  fontSize: 10,
                  fontWeight: 600,
                  color: "#ffffff",
                  background: TEAL,
                  borderRadius: 10,
                  padding: "1px 7px",
                  minWidth: 18,
                  textAlign: "center",
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </aside>

      <style>{`
        .sidebar-backdrop { display: none !important; }
        .feed-sidebar {
          display: block;
        }
        @media (max-width: 1024px) {
          .feed-sidebar {
            position: fixed !important;
            left: -260px;
            top: 0;
            z-index: 40;
            transition: left 0.2s;
          }
          .feed-sidebar-open {
            left: 0 !important;
          }
          .sidebar-backdrop {
            display: block !important;
          }
        }
      `}</style>
    </>
  );
}
