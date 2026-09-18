-- ==============================================================================
-- TIC360 Migration: Separate Tables for Absentees and Career Survey
-- Run this script in your Supabase SQL Editor
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- 1. ABSENCE REQUESTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS absence_requests (
    id VARCHAR(100) PRIMARY KEY,
    student_id VARCHAR(100) REFERENCES students(id) ON DELETE CASCADE,
    ut_number VARCHAR(50) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'Submitted',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_absence_requests_ut_number ON absence_requests(ut_number);

-- ==============================================================================
-- 2. CAREER SURVEY RESPONSES TABLE (Append-Only)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS career_survey_responses (
    id VARCHAR(100) PRIMARY KEY,
    student_id VARCHAR(100) REFERENCES students(id) ON DELETE CASCADE,
    ut_number VARCHAR(50) NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    is_blossom_trust BOOLEAN DEFAULT FALSE,
    outcome_status VARCHAR(50) NOT NULL,
    outcome_date DATE NOT NULL,
    company_or_institution VARCHAR(255),
    working_company_name VARCHAR(255),
    job_title VARCHAR(150),
    salary NUMERIC(12, 2) DEFAULT 0,
    current_status VARCHAR(100),
    course_completion_status VARCHAR(150),
    course_specialization VARCHAR(150),
    employment_status VARCHAR(150),
    other_status VARCHAR(150),
    work_location VARCHAR(150),
    linkedin_url TEXT,
    contact_phone VARCHAR(30),
    contact_email VARCHAR(255),
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_career_survey_responses_ut_number ON career_survey_responses(ut_number);

-- ==============================================================================
-- 3. ENABLE RLS AND SET POLICIES
-- ==============================================================================

-- Enable RLS
ALTER TABLE absence_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_survey_responses ENABLE ROW LEVEL SECURITY;

-- Allow unrestricted insert/read/update for anon/authenticated (Public Forms)
DROP POLICY IF EXISTS "Allow full access on absence_requests" ON absence_requests;
CREATE POLICY "Allow full access on absence_requests" ON absence_requests FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access on career_survey_responses" ON career_survey_responses;
CREATE POLICY "Allow full access on career_survey_responses" ON career_survey_responses FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

COMMIT;
