import { createClient } from "@supabase/supabase-js";
import LandingClient, { SocialProof } from "./LandingClient";

export const revalidate = 86400;

// Hardcoded fallback values — update when content grows significantly.
// FALLBACK_VERIFIED_DATE must match today's date when these were last confirmed.
const FALLBACK_VERIFIED_DATE = "2026-04-24";
const FALLBACK: SocialProof = {
  entities: 928,
  documents: 2800,
  trackers: 11,
  sources: 38,
  verifiedDate: FALLBACK_VERIFIED_DATE,
  isFallback: true,
};

async function fetchSocialProof(): Promise<SocialProof> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const [entitiesRes, documentsRes, trackersRes, sourcesRes] = await Promise.all([
      supabase.from("entities").select("id", { count: "exact", head: true }),
      supabase.from("documents").select("id", { count: "exact", head: true }),
      supabase.from("velocity_scores").select("tracker_slug"),
      supabase.from("stories").select("source_name"),
    ]);

    if (entitiesRes.error || documentsRes.error || trackersRes.error || sourcesRes.error) {
      return FALLBACK;
    }

    const trackers = new Set((trackersRes.data ?? []).map((r) => r.tracker_slug)).size;
    const sources = new Set((sourcesRes.data ?? []).map((r) => r.source_name).filter(Boolean)).size;

    return {
      entities: entitiesRes.count ?? FALLBACK.entities,
      documents: documentsRes.count ?? FALLBACK.documents,
      trackers: trackers || FALLBACK.trackers,
      sources: sources || FALLBACK.sources,
      verifiedDate: new Date().toISOString().slice(0, 10),
      isFallback: false,
    };
  } catch {
    return FALLBACK;
  }
}

export default async function LandingPage() {
  const socialProof = await fetchSocialProof();
  return <LandingClient socialProof={socialProof} />;
}
