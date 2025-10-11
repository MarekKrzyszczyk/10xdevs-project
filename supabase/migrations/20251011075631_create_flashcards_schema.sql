-- =============================================================================
-- Migration: Create flashcards schema
-- =============================================================================
-- Purpose: Initialize database schema for 10x-cards flashcard application
-- Affected tables: flashcards, study_progress
-- Special considerations:
--   - Implements SM-2 spaced repetition algorithm fields
--   - Row-level security enabled for user data isolation
--   - Automatic updated_at timestamp handling via trigger
--   - GDPR-compliant cascade deletion
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Create custom ENUM type for flashcard source tracking
-- -----------------------------------------------------------------------------
-- This enum distinguishes between manually created and AI-generated flashcards
create type flashcard_source as enum ('manual', 'ai_generated');

-- -----------------------------------------------------------------------------
-- 2. Create flashcards table
-- -----------------------------------------------------------------------------
-- Stores flashcards created by users with front/back content
-- Each flashcard belongs to a single user and tracks its creation source
create table flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  front text not null check (length(front) > 0 and length(front) <= 1000),
  back text not null check (length(back) > 0 and length(back) <= 1000),
  source flashcard_source not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Enable row level security for flashcards table
-- This ensures users can only access their own flashcards
alter table flashcards enable row level security;

-- -----------------------------------------------------------------------------
-- 3. Create study_progress table
-- -----------------------------------------------------------------------------
-- Stores spaced repetition metadata for each flashcard (SM-2 algorithm)
-- One-to-one relationship with flashcards table
-- Fields implement SuperMemo-2 algorithm parameters:
--   - ease_factor: Difficulty multiplier (default 2.5)
--   - interval: Days until next review
--   - repetitions: Successful consecutive reviews count
--   - next_review_date: Scheduled review timestamp
create table study_progress (
  flashcard_id uuid primary key references flashcards(id) on delete cascade,
  ease_factor real not null default 2.5,
  interval integer not null default 0,
  repetitions integer not null default 0,
  next_review_date timestamp with time zone not null default now()
);

-- Enable row level security for study_progress table
-- This ensures users can only access progress data for their own flashcards
alter table study_progress enable row level security;

-- -----------------------------------------------------------------------------
-- 4. Create indexes for query optimization
-- -----------------------------------------------------------------------------
-- Index on user_id: Speeds up fetching all flashcards for a specific user
create index idx_flashcards_user_id on flashcards(user_id);

-- Index on next_review_date: Speeds up finding flashcards due for review
create index idx_study_progress_next_review_date on study_progress(next_review_date);

-- -----------------------------------------------------------------------------
-- 5. Create RLS policies for flashcards table
-- -----------------------------------------------------------------------------
-- Granular policies for each operation and role to ensure proper access control

-- Policy: Allow anonymous users to select flashcards (if applicable for public features)
-- Rationale: Typically flashcards are private, but this structure allows future public sharing
create policy "anon users cannot select flashcards"
  on flashcards for select
  to anon
  using (false);

-- Policy: Allow authenticated users to select only their own flashcards
-- Rationale: Users should only see their personal flashcards
create policy "authenticated users can select own flashcards"
  on flashcards for select
  to authenticated
  using (auth.uid() = user_id);

-- Policy: Anonymous users cannot insert flashcards
-- Rationale: Only authenticated users can create flashcards
create policy "anon users cannot insert flashcards"
  on flashcards for insert
  to anon
  with check (false);

-- Policy: Allow authenticated users to insert their own flashcards
-- Rationale: Users can create new flashcards for themselves
create policy "authenticated users can insert own flashcards"
  on flashcards for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Policy: Anonymous users cannot update flashcards
-- Rationale: Only authenticated users can modify flashcards
create policy "anon users cannot update flashcards"
  on flashcards for update
  to anon
  using (false);

-- Policy: Allow authenticated users to update only their own flashcards
-- Rationale: Users can modify their personal flashcards
create policy "authenticated users can update own flashcards"
  on flashcards for update
  to authenticated
  using (auth.uid() = user_id);

-- Policy: Anonymous users cannot delete flashcards
-- Rationale: Only authenticated users can delete flashcards
create policy "anon users cannot delete flashcards"
  on flashcards for delete
  to anon
  using (false);

-- Policy: Allow authenticated users to delete only their own flashcards
-- Rationale: Users can delete their personal flashcards
create policy "authenticated users can delete own flashcards"
  on flashcards for delete
  to authenticated
  using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 6. Create RLS policies for study_progress table
-- -----------------------------------------------------------------------------
-- Granular policies ensuring users can only access progress for their flashcards

-- Policy: Anonymous users cannot select study progress
-- Rationale: Study progress is private user data
create policy "anon users cannot select study progress"
  on study_progress for select
  to anon
  using (false);

-- Policy: Allow authenticated users to select progress for their flashcards
-- Rationale: Users need to view their learning progress
create policy "authenticated users can select own study progress"
  on study_progress for select
  to authenticated
  using (auth.uid() = (select user_id from flashcards where id = flashcard_id));

-- Policy: Anonymous users cannot insert study progress
-- Rationale: Only authenticated users can create progress records
create policy "anon users cannot insert study progress"
  on study_progress for insert
  to anon
  with check (false);

-- Policy: Allow authenticated users to insert progress for their flashcards
-- Rationale: Users need to create progress records for their flashcards
create policy "authenticated users can insert own study progress"
  on study_progress for insert
  to authenticated
  with check (auth.uid() = (select user_id from flashcards where id = flashcard_id));

-- Policy: Anonymous users cannot update study progress
-- Rationale: Only authenticated users can modify progress records
create policy "anon users cannot update study progress"
  on study_progress for update
  to anon
  using (false);

-- Policy: Allow authenticated users to update progress for their flashcards
-- Rationale: Users need to update their learning progress after reviews
create policy "authenticated users can update own study progress"
  on study_progress for update
  to authenticated
  using (auth.uid() = (select user_id from flashcards where id = flashcard_id));

-- Policy: Anonymous users cannot delete study progress
-- Rationale: Only authenticated users can delete progress records
create policy "anon users cannot delete study progress"
  on study_progress for delete
  to anon
  using (false);

-- Policy: Allow authenticated users to delete progress for their flashcards
-- Rationale: Users can delete progress records (though typically handled by cascade)
create policy "authenticated users can delete own study progress"
  on study_progress for delete
  to authenticated
  using (auth.uid() = (select user_id from flashcards where id = flashcard_id));

-- -----------------------------------------------------------------------------
-- 7. Create trigger for automatic updated_at timestamp
-- -----------------------------------------------------------------------------
-- Function to update the updated_at column to current timestamp
-- This ensures the updated_at field is always accurate without manual updates
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to automatically update updated_at before any update on flashcards
-- Rationale: Maintains accurate modification timestamps for audit and sync purposes
create trigger on_flashcards_update
  before update on flashcards
  for each row
  execute procedure handle_updated_at();

-- =============================================================================
-- Migration complete
-- =============================================================================
-- Summary:
--   - Created flashcard_source enum type
--   - Created flashcards table with user ownership and content validation
--   - Created study_progress table with SM-2 algorithm fields
--   - Enabled RLS on both tables
--   - Created 16 granular RLS policies (8 per table, 4 operations × 2 roles)
--   - Created 2 indexes for query optimization
--   - Created trigger for automatic updated_at handling
--   - GDPR-compliant with cascade deletion on user removal
-- =============================================================================
