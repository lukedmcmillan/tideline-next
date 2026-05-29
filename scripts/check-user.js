const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await sb.rpc('execute_sql', {
    query: 'SELECT MAX(calculated_at), MIN(calculated_at), COUNT(*) FROM velocity_scores'
  }).catch(() => ({ data: null, error: 'rpc not available' }));

  // Fall back to direct query
  const { data: rows, error: err2 } = await sb
    .from('velocity_scores')
    .select('tracker_slug, score, band, momentum_direction, calculated_at')
    .order('calculated_at', { ascending: false })
    .limit(5);

  console.log('Latest 5 rows:', JSON.stringify(rows, null, 2));
  console.log('Error:', err2);

  const { count, error: countErr } = await sb
    .from('velocity_scores')
    .select('*', { count: 'exact', head: true });

  console.log('Total count:', count, countErr);
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
