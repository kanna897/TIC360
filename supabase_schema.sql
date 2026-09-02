-- ==============================================================================
-- TIC360: Student Management & Outcome Reporting Platform Schema for Supabase PostgreSQL
-- Organization: Unicom TIC Training Centre & Blossom Trust Educational Foundation
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. COURSES TABLE
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_months INT DEFAULT 6,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BATCHES TABLE
CREATE TABLE IF NOT EXISTS batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'Upcoming')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. STUDENTS TABLE
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ut_number VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    nic VARCHAR(50) UNIQUE NOT NULL,
    dob DATE NOT NULL,
    gender VARCHAR(20) CHECK (gender IN ('Male', 'Female', 'Other')),
    phone VARCHAR(30) NOT NULL,
    whatsapp VARCHAR(30),
    email VARCHAR(255) UNIQUE NOT NULL,
    address TEXT NOT NULL,
    district VARCHAR(100) NOT NULL,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(30),
    emergency_contact_relationship VARCHAR(100),
    batch_id UUID REFERENCES batches(id),
    course_id UUID REFERENCES courses(id),
    photo_url TEXT,
    is_blossom_trust BOOLEAN DEFAULT FALSE,
    current_status VARCHAR(50) DEFAULT 'Active' CHECK (current_status IN ('Active', 'Completed', 'Dropout', 'Other')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. STUDENT BANK DETAILS TABLE (Blossom Trust Students only)
CREATE TABLE IF NOT EXISTS student_bank_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID UNIQUE REFERENCES students(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS blossom_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID UNIQUE REFERENCES students(id) ON DELETE CASCADE,
    parents_occupation TEXT,
    family_income NUMERIC(12, 2),
    family_members_count INT,
    siblings_count INT,
    financial_difficulties TEXT,
    accommodation_expense NUMERIC(12, 2) DEFAULT 0,
    food_expense NUMERIC(12, 2) DEFAULT 0,
    supporting_docs JSONB,
    declaration_signed BOOLEAN DEFAULT TRUE,
    verification_status VARCHAR(50) DEFAULT 'Pending' CHECK (verification_status IN ('Pending', 'Verified', 'Rejected')),
    verified_by UUID,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. MONTHLY ATTENDANCE TABLE (Preserved month-by-month historically)
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES batches(id),
    year INT NOT NULL,
    month VARCHAR(20) NOT NULL, -- Format: 'YYYY-MM' e.g. '2026-08'
    attendance_percentage NUMERIC(5, 2) NOT NULL CHECK (attendance_percentage >= 0 AND attendance_percentage <= 100),
    status VARCHAR(50) NOT NULL CHECK (status IN ('Good Attendance', 'Low Attendance', 'Critical Attendance')),
    recorded_by VARCHAR(150),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_student_month_attendance UNIQUE (student_id, month)
);

-- 7. BLOSSOM MONTHLY PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS blossom_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    year INT NOT NULL,
    month VARCHAR(20) NOT NULL, -- 'YYYY-MM'
    attendance_percentage NUMERIC(5, 2),
    is_eligible BOOLEAN NOT NULL DEFAULT FALSE,
    ineligibility_reason TEXT,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Eligible', 'Not Eligible', 'Paid', 'Pending')),
    payment_date DATE,
    reference_no VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_student_month_payment UNIQUE (student_id, month)
);

-- 8. DROPOUTS TABLE
CREATE TABLE IF NOT EXISTS dropouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID UNIQUE REFERENCES students(id) ON DELETE CASCADE,
    dropout_month VARCHAR(20) NOT NULL, -- 'YYYY-MM'
    reason VARCHAR(100) NOT NULL CHECK (reason IN (
        'Financial Problem',
        'Employment',
        'Higher Studies',
        'Family Problem',
        'Health/Personal',
        'Migration',
        'Lack of Interest',
        'Unknown'
    )),
    rejoin_possibility VARCHAR(50) DEFAULT 'Unknown' CHECK (rejoin_possibility IN ('High', 'Medium', 'Low', 'No', 'Unknown')),
    remarks TEXT,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. ASSESSMENTS TABLE (Custom columns with max marks)
CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES batches(id),
    title VARCHAR(150) NOT NULL,
    category VARCHAR(50) DEFAULT 'Assignment' CHECK (category IN ('Assignment', 'Project', 'Presentation', 'Practical', 'Final Project', 'Custom')),
    max_marks NUMERIC(5, 2) NOT NULL DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. ASSESSMENT MARKS TABLE
CREATE TABLE IF NOT EXISTS assessment_marks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    marks_obtained NUMERIC(5, 2) NOT NULL CHECK (marks_obtained >= 0),
    feedback TEXT,
    graded_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_assessment_student_mark UNIQUE (assessment_id, student_id)
);

-- 11. COURSE COMPLETIONS TABLE
CREATE TABLE IF NOT EXISTS course_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID UNIQUE REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id),
    batch_id UUID REFERENCES batches(id),
    completion_date DATE NOT NULL,
    final_result VARCHAR(50) DEFAULT 'Passed',
    final_project_name VARCHAR(255),
    github_link TEXT,
    overall_grade VARCHAR(10) CHECK (overall_grade IN ('A', 'B', 'C', 'D', 'E')),
    certificate_issued BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. STUDENT OUTCOMES TABLE (Post-completion tracking)
CREATE TABLE IF NOT EXISTS student_outcomes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    outcome_status VARCHAR(50) NOT NULL CHECK (outcome_status IN (
        'Employed',
        'Self Employed',
        'Higher Studies',
        'Internship',
        'Looking for Job',
        'Unemployed',
        'Foreign Employment',
        'Other'
    )),
    outcome_date DATE NOT NULL,
    company_or_institution VARCHAR(255),
    job_title VARCHAR(150),
    remarks TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_name VARCHAR(150) NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    record_id VARCHAR(100),
    details JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 14. SYSTEM SETTINGS TABLE
CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_students_course_id ON students(course_id);
CREATE INDEX IF NOT EXISTS idx_students_batch_id ON students(batch_id);
CREATE INDEX IF NOT EXISTS idx_students_is_blossom ON students(is_blossom_trust);
CREATE INDEX IF NOT EXISTS idx_students_current_status ON students(current_status);
CREATE INDEX IF NOT EXISTS idx_attendance_month ON attendance(month);
CREATE INDEX IF NOT EXISTS idx_blossom_payments_month ON blossom_payments(month);
CREATE INDEX IF NOT EXISTS idx_outcomes_status ON student_outcomes(outcome_status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_bank_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE blossom_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE blossom_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE dropouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Default authenticated read/write access policies
CREATE POLICY "Allow authenticated users to view students" ON students FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow staff to insert/update students" ON students FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow blossom officers & admins to view bank details" ON student_bank_details FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow blossom officers & admins to view payments" ON blossom_payments FOR SELECT USING (auth.role() = 'authenticated');
