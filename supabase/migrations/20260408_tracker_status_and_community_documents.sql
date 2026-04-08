-- Migration: tracker_status_and_community_documents
-- Adds tracker_status table and extends project_documents for community submissions.
-- Safe to re-run (all statements are idempotent).

-- 1a. Create tracker_status table
CREATE TABLE IF NOT EXISTS public.tracker_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tracker_slug text NOT NULL UNIQUE,
  stage_name text,
  stage_number int,
  stage_description text,
  stage_source_url text,
  stage_source_label text,
  stage_verified_at timestamptz DEFAULT now(),
  trajectory text CHECK (trajectory IN ('advancing','stalling','blocked')),
  trajectory_reason text,
  trajectory_source_url text,
  trajectory_source_label text,
  trajectory_verified_at timestamptz DEFAULT now(),
  next_event_name text,
  next_event_date date,
  next_event_location text,
  next_event_source_url text,
  updated_at timestamptz DEFAULT now(),
  updated_by text
);

-- 1b. Extend existing project_documents table for community submissions
ALTER TABLE public.project_documents
  ADD COLUMN IF NOT EXISTS community_submitted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS submitted_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS submitted_by_display text,
  ADD COLUMN IF NOT EXISTS submitted_by_role text,
  ADD COLUMN IF NOT EXISTS tracker_tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS submission_type text,
  ADD COLUMN IF NOT EXISTS submission_relevance text[],
  ADD COLUMN IF NOT EXISTS submission_relevance_free text,
  ADD COLUMN IF NOT EXISTS source_domain text,
  ADD COLUMN IF NOT EXISTS source_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS community_status text DEFAULT 'pending_review',
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS publisher text,
  ADD COLUMN IF NOT EXISTS summary text,
  ADD COLUMN IF NOT EXISTS page_count int,
  ADD COLUMN IF NOT EXISTS file_url text;

-- Allow community docs to exist without a workspace project
ALTER TABLE public.project_documents
  ALTER COLUMN project_name DROP NOT NULL;

-- 1c. Indexes
CREATE INDEX IF NOT EXISTS idx_project_documents_community
  ON public.project_documents (community_submitted, community_status);

CREATE INDEX IF NOT EXISTS idx_project_documents_tracker_tags
  ON public.project_documents USING gin (tracker_tags);

CREATE INDEX IF NOT EXISTS idx_tracker_status_slug
  ON public.tracker_status (tracker_slug);
