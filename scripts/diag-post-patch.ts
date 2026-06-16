// Post-patch verification queries + mismatch investigation
import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function fetchAll(select: string, extra?: (q: any) => any) {
  let q = sb.from('documents').select(select).eq('status','approved').limit(10000);
  if (extra) q = extra(q);
  const { data, error } = await q;
  if (error) { console.error(error); return []; }
  return data ?? [];
}

async function run() {
  // Q1: source_tier distribution
  const tierDocs = await fetchAll('source_tier');
  const tier: Record<string,number> = {};
  for (const d of tierDocs) { const k = d.source_tier ?? '(null)'; tier[k] = (tier[k]??0)+1; }
  console.log('=== Q1: source_tier ===');
  for (const [k,v] of Object.entries(tier).sort((a,b)=>b[1]-a[1])) console.log(`  ${k}: ${v}`);

  // Q2: source_type distribution
  const typeDocs = await fetchAll('source_type');
  const typ: Record<string,number> = {};
  for (const d of typeDocs) { const k = d.source_type ?? '(null)'; typ[k] = (typ[k]??0)+1; }
  console.log('\n=== Q2: source_type ===');
  for (const [k,v] of Object.entries(typ).sort((a,b)=>b[1]-a[1])) console.log(`  ${k}: ${v}`);

  // Q3: needs_review count
  const nrDocs = await fetchAll('id', q => q.eq('needs_review', true));
  console.log(`\n=== Q3: needs_review = true: ${nrDocs.length} ===`);

  // Q4: TNFD check
  const tnfd = await fetchAll('source_organisation, source_type, source_tier, needs_review',
    q => q.ilike('source_organisation','%Taskforce on Nature-related%'));
  console.log('\n=== Q4: TNFD docs ===');
  for (const d of tnfd) {
    console.log(`  type:${d.source_type} tier:${d.source_tier} review:${d.needs_review} | "${d.source_organisation?.substring(0,60)}"`);
  }

  // Mismatch investigation: exact hex bytes of the 3 failing strings
  console.log('\n=== MISMATCH INVESTIGATION ===');
  // Fetch the 3 null docs that should have matched
  const nullDocs = await fetchAll('source_organisation, rule_applied',
    q => q.is('source_type', null).neq('source_organisation','The Metals Company').neq('source_organisation','The Metals Company Inc.').neq('source_organisation','Regenerative Ocean Week (ROW) 2025'));
  console.log(`Non-expected NULLs (${nullDocs.length}):`);
  for (const d of nullDocs) {
    const org = d.source_organisation ?? '';
    // Print codepoints for first 30 chars
    const codepoints = [...org].slice(0,40).map((c:string) => `\\u${c.codePointAt(0)!.toString(16).padStart(4,'0')}`).join('');
    console.log(`  org: "${org.substring(0,80)}"`);
    console.log(`  hex: ${codepoints}`);
    console.log('');
  }
}
run().catch(console.error);
