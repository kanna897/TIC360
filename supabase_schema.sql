-- ==============================================================================
-- TIC360: Clean/Fresh Database Setup for Supabase PostgreSQL
-- Organization: Unicom TIC Training Centre & Blossom Trust Educational Foundation
-- Description: Resets ONLY the 16 TIC360 application tables and creates them
--              with VARCHAR(100) primary and foreign keys matching the frontend data model.
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- STEP 1: DROP EXISTING TIC360 TABLES (CHILDREN FIRST, THEN PARENTS)
-- Only drops the 16 application-specific tables. Does not touch any system tables.
-- ==============================================================================
DROP TABLE IF EXISTS attendance_marks CASCADE;
DROP TABLE IF EXISTS attendance_sessions CASCADE;
DROP TABLE IF EXISTS assessment_marks CASCADE;
DROP TABLE IF EXISTS assessments CASCADE;
DROP TABLE IF EXISTS student_outcomes CASCADE;
DROP TABLE IF EXISTS course_completions CASCADE;
DROP TABLE IF EXISTS dropouts CASCADE;
DROP TABLE IF EXISTS blossom_payments CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS blossom_applications CASCADE;
DROP TABLE IF EXISTS student_bank_details CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS batches CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- ==============================================================================
-- STEP 2: CREATE PARENT TABLES
-- ==============================================================================

-- 1. COURSES TABLE
CREATE TABLE courses (
    id VARCHAR(100) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_months INT DEFAULT 6,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BATCHES TABLE
CREATE TABLE batches (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    course_id VARCHAR(100) REFERENCES courses(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. STUDENTS TABLE
CREATE TABLE students (
    id VARCHAR(100) PRIMARY KEY,
    ut_number VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    nic VARCHAR(50),
    dob DATE,
    gender VARCHAR(20),
    phone VARCHAR(30),
    whatsapp VARCHAR(30),
    email VARCHAR(255),
    address TEXT,
    district VARCHAR(100),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(30),
    emergency_contact_relationship VARCHAR(100),
    batch_id VARCHAR(100) REFERENCES batches(id) ON DELETE SET NULL,
    course_id VARCHAR(100) REFERENCES courses(id) ON DELETE SET NULL,
    photo_url TEXT,
    is_blossom_trust BOOLEAN DEFAULT FALSE,
    current_status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- STEP 3: CREATE CHILD TABLES (STUDENT & ACADEMIC MODULES)
-- ==============================================================================

-- 4. STUDENT BANK DETAILS TABLE (Blossom Trust Students)
CREATE TABLE student_bank_details (
    id VARCHAR(100) PRIMARY KEY DEFAULT ('BNK-' || substr(md5(random()::text), 1, 16)),
    student_id VARCHAR(100) UNIQUE REFERENCES students(id) ON DELETE CASCADE,
    bank_name VARCHAR(150) NOT NULL,
    branch_name VARCHAR(150) NOT NULL,
    branch_code VARCHAR(50),
    account_number VARCHAR(100) NOT NULL,
    beneficiary_name VARCHAR(255) NOT NULL,
    district VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. BLOSSOM APPLICATIONS TABLE
CREATE TABLE blossom_applications (
    id VARCHAR(100) PRIMARY KEY DEFAULT ('APP-' || substr(md5(random()::text), 1, 16)),
    student_id VARCHAR(100) UNIQUE REFERENCES students(id) ON DELETE CASCADE,
    parents_occupation TEXT,
    family_income NUMERIC(12, 2),
    family_members_count INT,
    siblings_count INT,
    financial_difficulties TEXT,
    accommodation_expense NUMERIC(12, 2) DEFAULT 0,
    food_expense NUMERIC(12, 2) DEFAULT 0,
    supporting_docs JSONB,
    declaration_signed BOOLEAN DEFAULT TRUE,
    verification_status VARCHAR(50) DEFAULT 'Pending',
    verified_by VARCHAR(100),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. MONTHLY ATTENDANCE TABLE (Preserved month-by-month historical summaries)
CREATE TABLE attendance (
    id VARCHAR(100) PRIMARY KEY,
    student_id VARCHAR(100) REFERENCES students(id) ON DELETE CASCADE,
    batch_id VARCHAR(100) REFERENCES batches(id) ON DELETE SET NULL,
    year INT NOT NULL,
    month VARCHAR(20) NOT NULL, -- Format: 'YYYY-MM' e.g. '2026-08'
    attendance_percentage NUMERIC(5, 2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    recorded_by VARCHAR(150),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_student_month_attendance UNIQUE (student_id, month)
);

-- 7. ATTENDANCE SESSIONS TABLE (Daily classroom sessions)
CREATE TABLE attendance_sessions (
    id VARCHAR(100) PRIMARY KEY,
    batch_id VARCHAR(100) REFERENCES batches(id) ON DELETE CASCADE,
    "group" VARCHAR(50),
    month VARCHAR(20) NOT NULL,
    date DATE NOT NULL,
    display_date VARCHAR(50),
    subject VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ATTENDANCE MARKS TABLE (Individual student marks per daily session)
CREATE TABLE attendance_marks (
    id VARCHAR(100) PRIMARY KEY,
    session_id VARCHAR(100) REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id VARCHAR(100) REFERENCES students(id) ON DELETE CASCADE,
    mark VARCHAR(10) NOT NULL CHECK (mark IN ('P', 'A', 'L')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_session_student_mark UNIQUE (session_id, student_id)
);

-- 9. BLOSSOM MONTHLY PAYMENTS TABLE
CREATE TABLE blossom_payments (
    id VARCHAR(100) PRIMARY KEY,
    student_id VARCHAR(100) REFERENCES students(id) ON DELETE CASCADE,
    year INT NOT NULL,
    month VARCHAR(20) NOT NULL, -- Format: 'YYYY-MM'
    attendance_percentage NUMERIC(5, 2),
    is_eligible BOOLEAN NOT NULL DEFAULT FALSE,
    ineligibility_reason TEXT,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Pending',
    payment_date DATE,
    reference_no VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_student_month_payment UNIQUE (student_id, month)
);

-- 10. DROPOUTS TABLE
CREATE TABLE dropouts (
    id VARCHAR(100) PRIMARY KEY,
    student_id VARCHAR(100) REFERENCES students(id) ON DELETE CASCADE,
    dropout_month VARCHAR(20) NOT NULL, -- Format: 'YYYY-MM'
    reason VARCHAR(100) NOT NULL,
    rejoin_possibility VARCHAR(50) DEFAULT 'Unknown',
    remarks TEXT,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. ASSESSMENTS TABLE (Assignments, Projects, Exams)
CREATE TABLE assessments (
    id VARCHAR(100) PRIMARY KEY,
    course_id VARCHAR(100) REFERENCES courses(id) ON DELETE CASCADE,
    batch_id VARCHAR(100) REFERENCES batches(id) ON DELETE SET NULL,
    title VARCHAR(150) NOT NULL,
    category VARCHAR(50) DEFAULT 'Assignment',
    max_marks NUMERIC(5, 2) NOT NULL DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. ASSESSMENT MARKS TABLE
CREATE TABLE assessment_marks (
    id VARCHAR(100) PRIMARY KEY,
    assessment_id VARCHAR(100) REFERENCES assessments(id) ON DELETE CASCADE,
    student_id VARCHAR(100) REFERENCES students(id) ON DELETE CASCADE,
    marks_obtained NUMERIC(5, 2) NOT NULL CHECK (marks_obtained >= 0),
    feedback TEXT,
    graded_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_assessment_student_mark UNIQUE (assessment_id, student_id)
);

-- 13. COURSE COMPLETIONS TABLE
CREATE TABLE course_completions (
    id VARCHAR(100) PRIMARY KEY,
    student_id VARCHAR(100) UNIQUE REFERENCES students(id) ON DELETE CASCADE,
    course_id VARCHAR(100) REFERENCES courses(id) ON DELETE SET NULL,
    batch_id VARCHAR(100) REFERENCES batches(id) ON DELETE SET NULL,
    completion_date DATE NOT NULL,
    final_result VARCHAR(50) DEFAULT 'Passed',
    final_project_name VARCHAR(255),
    github_link TEXT,
    overall_grade VARCHAR(10),
    certificate_issued BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. STUDENT OUTCOMES TABLE (Employment, Higher Education Tracking)
CREATE TABLE student_outcomes (
    id VARCHAR(100) PRIMARY KEY,
    student_id VARCHAR(100) UNIQUE REFERENCES students(id) ON DELETE CASCADE,
    outcome_status VARCHAR(50) NOT NULL,
    outcome_date DATE NOT NULL,
    company_or_institution VARCHAR(255),
    job_title VARCHAR(150),
    remarks TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- STEP 4: CREATE SYSTEM & AUDIT TABLES
-- ==============================================================================

-- 15. AUDIT LOGS TABLE
CREATE TABLE audit_logs (
    id VARCHAR(100) PRIMARY KEY,
    user_name VARCHAR(150) NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    record_id VARCHAR(100),
    details JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 16. SYSTEM SETTINGS TABLE
CREATE TABLE system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. USER PROFILES TABLE (Supabase Auth Profiles)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'Student',
    department VARCHAR(100),
    student_id VARCHAR(100) REFERENCES students(id) ON DELETE SET NULL,
    ut_number VARCHAR(50),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- STEP 5: PERFORMANCE INDEXES
-- ==============================================================================
CREATE INDEX idx_students_ut_number ON students(ut_number);
CREATE INDEX idx_students_course_id ON students(course_id);
CREATE INDEX idx_students_batch_id ON students(batch_id);
CREATE INDEX idx_students_is_blossom ON students(is_blossom_trust);
CREATE INDEX idx_students_current_status ON students(current_status);
CREATE INDEX idx_attendance_month ON attendance(month);
CREATE INDEX idx_attendance_sessions_date ON attendance_sessions(date);
CREATE INDEX idx_attendance_sessions_batch ON attendance_sessions(batch_id);
CREATE INDEX idx_attendance_marks_session ON attendance_marks(session_id);
CREATE INDEX idx_blossom_payments_month ON blossom_payments(month);
CREATE INDEX idx_outcomes_status ON student_outcomes(outcome_status);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_ut_number ON user_profiles(ut_number);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);

-- ==============================================================================
-- STEP 6: ROW LEVEL SECURITY (RLS) POLICIES
-- Enables RLS on all 17 tables and allows full read/write access for the app.
-- ==============================================================================
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_bank_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE blossom_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE blossom_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE dropouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE
    t text;
    tables text[] := ARRAY[
        'courses', 'batches', 'students', 'student_bank_details', 
        'blossom_applications', 'attendance', 'attendance_sessions', 'attendance_marks',
        'blossom_payments', 'dropouts', 'assessments', 'assessment_marks', 
        'course_completions', 'student_outcomes', 'audit_logs', 'system_settings', 'user_profiles'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Allow full access on %I" ON %I;', t, t);
        EXECUTE format('CREATE POLICY "Allow full access on %I" ON %I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);', t, t);
    END LOOP;
END $$;

-- ==============================================================================
-- STEP 7: AUTOMATIC PROFILE SYNC TRIGGER FOR SUPABASE AUTH
-- Automatically creates/updates public.user_profiles whenever an auth.users record is created.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role, department, ut_number, student_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'Student'),
    NEW.raw_user_meta_data->>'department',
    NEW.raw_user_meta_data->>'ut_number',
    NEW.raw_user_meta_data->>'student_id'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    department = COALESCE(EXCLUDED.department, user_profiles.department),
    ut_number = COALESCE(EXCLUDED.ut_number, user_profiles.ut_number),
    student_id = COALESCE(EXCLUDED.student_id, user_profiles.student_id),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- STEP 8: SEED SYSTEM ACCOUNTS IN SUPABASE AUTH & USER_PROFILES
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
DECLARE
    admin_id UUID := 'a0000000-0000-0000-0000-000000000001'::UUID;
    trustee_id UUID := 'a0000000-0000-0000-0000-000000000002'::UUID;
    trainer_id UUID := 'a0000000-0000-0000-0000-000000000003'::UUID;
    data_id UUID := 'a0000000-0000-0000-0000-000000000004'::UUID;
    demo_student_id UUID := 'a0000000-0000-0000-0000-000000000005'::UUID;
BEGIN
    -- 1. Admin
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@unicomtic.lk') THEN
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', admin_id, 'authenticated', 'authenticated',
            'admin@unicomtic.lk', crypt('Admin@TIC360#2026', gen_salt('bf')), NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{"full_name":"System Administrator","role":"Admin","department":"Executive Administration"}'::jsonb,
            NOW(), NOW()
        );
        INSERT INTO user_profiles (id, email, full_name, role, department)
        VALUES (admin_id, 'admin@unicomtic.lk', 'System Administrator', 'Admin', 'Executive Administration')
        ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role;
    END IF;

    -- 2. Blossom Trust Officer
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'trustee@blossom.org') THEN
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', trustee_id, 'authenticated', 'authenticated',
            'trustee@blossom.org', crypt('Trustee@TIC360#2026', gen_salt('bf')), NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{"full_name":"Blossom Trust Compliance Officer","role":"Blossom Trust Officer","department":"Blossom Trust Foundation"}'::jsonb,
            NOW(), NOW()
        );
        INSERT INTO user_profiles (id, email, full_name, role, department)
        VALUES (trustee_id, 'trustee@blossom.org', 'Blossom Trust Compliance Officer', 'Blossom Trust Officer', 'Blossom Trust Foundation')
        ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role;
    END IF;

    -- 3. Trainer
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'trainer@unicomtic.lk') THEN
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', trainer_id, 'authenticated', 'authenticated',
            'trainer@unicomtic.lk', crypt('Trainer@TIC360#2026', gen_salt('bf')), NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{"full_name":"Senior Lead Instructor","role":"Trainer","department":"Academic Faculty"}'::jsonb,
            NOW(), NOW()
        );
        INSERT INTO user_profiles (id, email, full_name, role, department)
        VALUES (trainer_id, 'trainer@unicomtic.lk', 'Senior Lead Instructor', 'Trainer', 'Academic Faculty')
        ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role;
    END IF;

    -- 4. Data Entry Officer
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'dataentry@unicomtic.lk') THEN
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', data_id, 'authenticated', 'authenticated',
            'dataentry@unicomtic.lk', crypt('Data@TIC360#2026', gen_salt('bf')), NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{"full_name":"Data Entry Officer","role":"Data Entry Officer","department":"Operations & Admissions"}'::jsonb,
            NOW(), NOW()
        );
        INSERT INTO user_profiles (id, email, full_name, role, department)
        VALUES (data_id, 'dataentry@unicomtic.lk', 'Data Entry Officer', 'Data Entry Officer', 'Operations & Admissions')
        ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role;
    END IF;

    -- 5. Student Demo
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'student@unicomtic.lk') THEN
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', demo_student_id, 'authenticated', 'authenticated',
            'student@unicomtic.lk', crypt('Student@TIC360#2026', gen_salt('bf')), NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{"full_name":"Priya Sundaramoorthy (Demo)","role":"Student","department":"Vocational Trainees","ut_number":"UT-2026-001"}'::jsonb,
            NOW(), NOW()
        );
        INSERT INTO user_profiles (id, email, full_name, role, department, ut_number)
        VALUES (demo_student_id, 'student@unicomtic.lk', 'Priya Sundaramoorthy (Demo)', 'Student', 'Vocational Trainees', 'UT-2026-001')
        ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role;
    END IF;
END $$;

COMMIT;
