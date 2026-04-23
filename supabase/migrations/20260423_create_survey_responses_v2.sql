CREATE TABLE IF NOT EXISTS survey_responses_v2 (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at                timestamptz DEFAULT now(),

  -- Q1: Role
  role                      text,
  role_other                text,

  -- Q2: Procurement context
  procurement               text,

  -- Q3: Time spent per week
  time_spent                text,

  -- Q4: Current sources (multi)
  current_sources           text[],

  -- Q5: Hardest to track (multi)
  hardest_to_track          text[],

  -- Q6: Biggest single pain point
  biggest_pain              text,

  -- Q7: Feature value ratings (1-5, nullable -- partial ratings permitted)
  val_daily_brief           int,
  val_live_feed             int,
  val_regulatory_tracker    int,
  val_workspace             int,
  val_meeting_prep          int,
  val_entity_alerts         int,
  val_contradiction         int,
  val_commitment_tracker    int,
  val_risk_reports          int,
  val_embed_widget          int,
  val_ai_drafting           int,

  -- Q8: Entity tracking
  entity_tracking_value     text,
  entity_tracking_open      text,

  -- Q9: Output format preference
  output_format             text,

  -- Q10: Existing tools (multi + other open text)
  existing_tools            text[],
  existing_tools_other      text,

  -- Q11: Contact directory value
  contact_directory_value   text,

  -- Q12: Team size
  team_size                 text,

  -- Q13: Willingness to pay
  willingness_to_pay        text,

  -- Q14: Missing coverage (open text)
  missing_coverage          text,

  -- Q15: Early access
  email_provided            text,
  wants_early_access        boolean DEFAULT false,
  wants_founding_member     boolean DEFAULT false,
  wants_updates             boolean DEFAULT false,

  -- Derived: true when email address was provided
  is_priority_lead          boolean GENERATED ALWAYS AS (
                              email_provided IS NOT NULL AND email_provided <> ''
                            ) STORED
);

ALTER TABLE survey_responses_v2 ENABLE ROW LEVEL SECURITY;
-- No public read/insert policies.
-- API inserts via SUPABASE_SERVICE_ROLE_KEY bypass RLS.

CREATE INDEX idx_survey_v2_created_at ON survey_responses_v2(created_at DESC);
CREATE INDEX idx_survey_v2_priority_leads ON survey_responses_v2(is_priority_lead) WHERE is_priority_lead = true;
