-- ==============================================================================
-- VidyaMitraScholarship - Independent Platform Supabase Database Schema
-- Starts completely EMPTY (0 scholarships, 0 applications, 0 student users)
-- Run this in your Supabase Project -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Profiles Table (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    mobile TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Scholarships Table (Created and published solely by Admin)
-- Starts with 0 scholarships
CREATE TABLE IF NOT EXISTS public.scholarships (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    amount TEXT NOT NULL,
    eligibility_criteria TEXT,
    min_percentage TEXT,
    max_family_income TEXT,
    required_documents JSONB DEFAULT '[]'::jsonb,
    start_date DATE NOT NULL,
    last_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Closed')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Applications Table (Submitted by students for published scholarships)
-- Starts with 0 applications
CREATE TABLE IF NOT EXISTS public.applications (
    id TEXT PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    scholarship_id TEXT NOT NULL,
    scholarship_name TEXT NOT NULL,
    
    -- Personal Details
    full_name TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    gender TEXT NOT NULL,
    mobile TEXT NOT NULL,
    email TEXT NOT NULL,
    aadhaar_number TEXT NOT NULL,
    address TEXT NOT NULL,
    state TEXT NOT NULL,
    district TEXT NOT NULL,

    -- Education Details
    college_name TEXT NOT NULL,
    course TEXT NOT NULL,
    current_year_semester TEXT NOT NULL,
    previous_year_percentage TEXT NOT NULL,
    cgpa_marks TEXT NOT NULL,

    -- Eligibility Details
    category TEXT NOT NULL,
    annual_family_income TEXT NOT NULL,
    student_status TEXT NOT NULL,
    previous_scholarship TEXT NOT NULL DEFAULT 'No',
    disability_status TEXT NOT NULL DEFAULT 'None',

    -- Bank Details
    bank_account_holder TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    bank_account_number TEXT NOT NULL,
    bank_ifsc TEXT NOT NULL,

    -- Documents & Verification
    documents JSONB DEFAULT '[]'::jsonb,
    eligibility_status TEXT NOT NULL DEFAULT 'Pending Verification',
    eligibility_verified BOOLEAN NOT NULL DEFAULT false,
    document_verification_status TEXT DEFAULT 'Pending Verification',
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Under Review', 'Documents Required', 'Eligible', 'Not Eligible', 'Approved', 'Rejected')),
    admin_remarks TEXT DEFAULT '',

    applied_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scholarships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Helper admin check function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies
CREATE POLICY "Profiles read"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Profiles insert"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Scholarships Policies
CREATE POLICY "Anyone can view published scholarships"
    ON public.scholarships FOR SELECT
    USING (true);

CREATE POLICY "Only admin can manage scholarships"
    ON public.scholarships FOR ALL
    USING (public.is_admin());

-- Applications Policies
CREATE POLICY "Students see own applications, admin sees all"
    ON public.applications FOR SELECT
    USING (student_id = auth.uid() OR public.is_admin());

CREATE POLICY "Students can insert applications"
    ON public.applications FOR INSERT
    WITH CHECK (student_id = auth.uid());

CREATE POLICY "Admins can update application status"
    ON public.applications FOR UPDATE
    USING (public.is_admin());

-- 5. Storage Bucket Setup (scholarship-documents)
INSERT INTO storage.buckets (id, name, public)
VALUES ('scholarship-documents', 'scholarship-documents', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow authenticated document uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'scholarship-documents');

CREATE POLICY "Allow document reads"
ON storage.objects FOR SELECT
USING (bucket_id = 'scholarship-documents');

-- 6. Creating Admin User:
-- Create user in Supabase Authentication -> Users (e.g. admin@vidyamitra.com)
-- Then assign role:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@vidyamitra.com';
