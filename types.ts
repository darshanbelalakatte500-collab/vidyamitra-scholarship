export type UserRole = 'student' | 'admin';

export type ApplicationStatus = 
  | 'Pending'
  | 'Under Review'
  | 'Documents Required'
  | 'Eligible'
  | 'Not Eligible'
  | 'Approved'
  | 'Rejected';

export type EligibilityStatus = 'Pending Verification' | 'Eligible' | 'Not Eligible';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  mobile: string;
  role: UserRole;
  created_at?: string;
}

export interface Scholarship {
  id: string;
  name: string;
  description: string;
  amount: string;
  eligibility_criteria: string;
  min_percentage: string;
  max_family_income: string;
  required_documents: string[];
  start_date: string;
  last_date: string;
  status: 'Open' | 'Closed';
  created_at?: string;
}

export interface AppDocument {
  id: string;
  doc_type: string; // e.g. 'Identity Proof', 'Marks Card', 'College ID', etc.
  file_name: string;
  file_url: string;
  is_verified: boolean;
  uploaded_at: string;
}

export interface Application {
  id: string; // e.g. VMS-2026-XXXX
  student_id: string;
  scholarship_id: string;
  scholarship_name: string;
  
  // Personal Details
  full_name: string;
  date_of_birth: string;
  gender: string;
  mobile: string;
  email: string;
  aadhaar_number: string;
  address: string;
  state: string;
  district: string;

  // Education Details
  college_name: string;
  course: string;
  current_year_semester: string;
  previous_year_percentage: string;
  cgpa_marks: string;

  // Eligibility Details
  category: string;
  annual_family_income: string;
  student_status: string; // Regular, Distance, Part-time
  previous_scholarship: string; // 'No' or details
  disability_status: string; // 'None' or details

  // Bank Details
  bank_account_holder: string;
  bank_name: string;
  bank_account_number: string;
  bank_ifsc: string;

  // Documents
  documents: AppDocument[];

  // Verification & Status
  eligibility_status: EligibilityStatus;
  eligibility_verified: boolean;
  document_verification_status: string; // e.g., "5/6 Verified"
  status: ApplicationStatus;
  admin_remarks: string;

  applied_at: string;
  updated_at: string;

  // Joined
  student?: Profile;
}
