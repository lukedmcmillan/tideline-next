-- Update seed divergence rows with plainer English why_it_matters text.
-- Run manually in Supabase SQL Editor.

UPDATE divergences SET
  why_it_matters = 'If the ISA vote was binding, deep sea mining companies can start applying for commercial licences now. If it was not, they cannot. Anyone reporting on the state of deep sea mining regulation for investors, compliance, or ESG disclosures needs to know which is true. Getting it wrong could mean saying something publicly that turns out to be inaccurate.'
WHERE tracker_tag = 'isa' AND headline LIKE 'ISA Council vote%';

UPDATE divergences SET
  why_it_matters = 'The BBNJ treaty entering into force without major fishing nations like Japan, South Korea, and Iceland would create a split regime. Some states would be legally bound, others would not. If you advise shipping operators, insure ocean assets, or report on high seas exposure, this changes what compliance actually looks like. Worth tracking over the next reporting cycle.'
WHERE tracker_tag = 'bbnj';

UPDATE divergences SET
  why_it_matters = 'Global IUU fishing numbers show improvement. Regional numbers in West Africa show the opposite. If you source seafood, finance ocean supply chains, or do due diligence on fishing exposure, the headline number is misleading for those specific regions. Check which figure applies to your actual exposure before using either in a report.'
WHERE tracker_tag = 'iuu';
