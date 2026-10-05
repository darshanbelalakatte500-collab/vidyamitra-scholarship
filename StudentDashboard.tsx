import React, { useState, useEffect } from 'react';
import { 
  User, 
  FileText, 
  Award, 
  CheckCircle, 
  XCircle, 
  Clock, 
  LogOut, 
  Upload, 
  Check, 
  Eye, 
  X, 
  ExternalLink,
  GraduationCap,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  FileCheck,
  FileWarning
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Scholarship, Application, ApplicationStatus, AppDocument } from '../types';
import { DataService } from '../lib/supabaseClient';
import { STANDARD_REQUIRED_DOCUMENTS, ELIGIBILITY_RULES } from '../data/mockData';

interface StudentDashboardProps {
  onNavigate: (route: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onNavigate }) => {
  const { currentUser, logout } = useAuth();
  
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [activeTab, setActiveTab] = useState<'available-scholarships' | 'apply' | 'my-applications' | 'profile'>('available-scholarships');
  const [loading, setLoading] = useState(true);

  // Application Form State
  const [selectedSchId, setSelectedSchId] = useState('');
  
  // Personal Details
  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [mobile, setMobile] = useState(currentUser?.mobile || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [aadhaar, setAadhaar] = useState('');
  const [address, setAddress] = useState('');
  const [stateName, setStateName] = useState('Karnataka');
  const [district, setDistrict] = useState('');

  // Education Details
  const [collegeName, setCollegeName] = useState('');
  const [course, setCourse] = useState('');
  const [yearSemester, setYearSemester] = useState('1st Year');
  const [prevPercentage, setPrevPercentage] = useState('');
  const [cgpaMarks, setCgpaMarks] = useState('');

  // Eligibility Details
  const [category, setCategory] = useState('General');
  const [annualIncome, setAnnualIncome] = useState('');
  const [studentStatus, setStudentStatus] = useState('Regular (Full-time)');
  const [prevScholarship, setPrevScholarship] = useState('No');
  const [disabilityStatus, setDisabilityStatus] = useState('None');

  // Bank Details
  const [bankHolder, setBankHolder] = useState(currentUser?.full_name || '');
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');

  // Uploaded Documents state: key -> AppDocument
  const [uploadedDocs, setUploadedDocs] = useState<{ [key: string]: AppDocument }>({});
  const [uploadingDocKey, setUploadingDocKey] = useState<string | null>(null);

  // Declarations
  const [decl1, setDecl1] = useState(false);
  const [decl2, setDecl2] = useState(false);
  const [decl3, setDecl3] = useState(false);
  const [decl4, setDecl4] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Viewing application modal
  const [viewingApp, setViewingApp] = useState<Application | null>(null);

  const loadData = async () => {
    if (!currentUser) return;
    setLoading(true);
    const [schs, apps] = await Promise.all([
      DataService.fetchScholarships(),
      DataService.fetchApplications(currentUser.id)
    ]);
    setScholarships(schs);
    setApplications(apps);
    if (schs.length > 0 && !selectedSchId) {
      setSelectedSchId(schs[0].id);
    }
    if (apps.length > 0) {
      setActiveTab('my-applications');
    } else {
      setActiveTab('available-scholarships');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.full_name);
      setEmail(currentUser.email);
      setMobile(currentUser.mobile);
      setBankHolder(currentUser.full_name);
    }
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Please sign in to view dashboard</h2>
        <button
          onClick={() => onNavigate('login')}
          className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold cursor-pointer"
        >
          Go to Student Login
        </button>
      </div>
    );
  }

  const existingApp = applications[0]; // Exactly one application per student allowed

  // Handle Document upload for a specific type
  const handleDocUpload = async (docKey: string, docLabel: string, file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg(`File size for ${docLabel} must be under 5MB.`);
      return;
    }

    setUploadingDocKey(docKey);
    setErrorMsg('');

    try {
      const url = await DataService.uploadDocument(file);
      const newDoc: AppDocument = {
        id: `doc-${docKey}-${Date.now()}`,
        doc_type: docLabel,
        file_name: file.name,
        file_url: url,
        is_verified: false,
        uploaded_at: new Date().toISOString()
      };

      setUploadedDocs(prev => ({ ...prev, [docKey]: newDoc }));
    } catch (err) {
      console.warn('Upload error:', err);
      setErrorMsg(`Failed to upload ${docLabel}.`);
    } finally {
      setUploadingDocKey(null);
    }
  };

  // Check if mandatory documents are uploaded
  const mandatoryKeys = STANDARD_REQUIRED_DOCUMENTS.filter(d => d.required).map(d => d.key);
  const mandatoryDocsUploaded = mandatoryKeys.every(k => !!uploadedDocs[k]);

  // Check if all fields are filled
  const allPersonalFilled = fullName && dob && gender && mobile && email && aadhaar && address && stateName && district;
  const allEducationFilled = collegeName && course && yearSemester && prevPercentage && cgpaMarks;
  const allEligibilityFilled = category && annualIncome && studentStatus;
  const allBankFilled = bankHolder && bankName && bankAccount && bankIfsc;
  const allDeclarationsAccepted = decl1 && decl2 && decl3 && decl4;

  const isFormComplete = 
    allPersonalFilled && 
    allEducationFilled && 
    allEligibilityFilled && 
    allBankFilled && 
    mandatoryDocsUploaded && 
    allDeclarationsAccepted;

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (existingApp) {
      setErrorMsg('Only one application per student is allowed under VidyaMitraScholarship rules.');
      return;
    }

    if (!isFormComplete) {
      setErrorMsg('Please complete all required fields, upload all mandatory documents, and check all eligibility declarations.');
      return;
    }

    setSubmitting(true);

    try {
      const selectedSch = scholarships.find(s => s.id === selectedSchId);
      const schTitle = selectedSch ? selectedSch.name : 'VidyaMitraScholarship Program';

      const docList = Object.values(uploadedDocs);

      const submitted = await DataService.submitApplication({
        student_id: currentUser.id,
        scholarship_id: selectedSchId || 'vms-main',
        scholarship_name: schTitle,
        full_name: fullName.trim(),
        date_of_birth: dob,
        gender,
        mobile: mobile.trim(),
        email: email.trim(),
        aadhaar_number: aadhaar.trim(),
        address: address.trim(),
        state: stateName.trim(),
        district: district.trim(),
        college_name: collegeName.trim(),
        course: course.trim(),
        current_year_semester: yearSemester,
        previous_year_percentage: prevPercentage.trim(),
        cgpa_marks: cgpaMarks.trim(),
        category,
        annual_family_income: annualIncome.trim(),
        student_status: studentStatus,
        previous_scholarship: prevScholarship.trim(),
        disability_status: disabilityStatus.trim(),
        bank_account_holder: bankHolder.trim(),
        bank_name: bankName.trim(),
        bank_account_number: bankAccount.trim(),
        bank_ifsc: bankIfsc.trim().toUpperCase(),
        documents: docList
      });

      setSuccessMsg(`Application submitted successfully! Your Application ID is ${submitted.id}.`);
      await loadData();
      setActiveTab('my-applications');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Approved
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
            <XCircle className="w-3.5 h-3.5 text-rose-600" /> Rejected
          </span>
        );
      case 'Eligible':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800">
            <Check className="w-3.5 h-3.5 text-teal-600" /> Eligible
          </span>
        );
      case 'Not Eligible':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Not Eligible
          </span>
        );
      case 'Documents Required':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
            <FileWarning className="w-3.5 h-3.5 text-purple-600" /> Documents Required
          </span>
        );
      case 'Under Review':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
            <Clock className="w-3.5 h-3.5 text-blue-600" /> Under Review
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> Pending
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      
      {/* Top Welcome Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
        <div>
          <span className="text-xs text-emerald-700 font-bold uppercase tracking-wider">Student Verification Portal</span>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">
            Welcome, {currentUser.full_name}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {currentUser.email} &bull; +91 {currentUser.mobile}
          </p>
        </div>

        <button
          onClick={async () => {
            await logout();
            onNavigate('home');
          }}
          className="px-3.5 py-1.5 border border-slate-200 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-1.5 sm:gap-2 bg-white rounded-xl p-1 border overflow-x-auto">
        <button
          onClick={() => setActiveTab('available-scholarships')}
          className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'available-scholarships' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Available Scholarships ({scholarships.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('apply')}
          className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'apply' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Apply for Scholarship</span>
        </button>

        <button
          onClick={() => setActiveTab('my-applications')}
          className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'my-applications' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>My Applications {applications.length > 0 && `(${applications.length})`}</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'profile' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>My Profile</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 0: AVAILABLE SCHOLARSHIPS (PUBLISHED BY ADMIN) */}
      {/* ========================================================================= */}
      {activeTab === 'available-scholarships' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Available Scholarships</h2>
              <p className="text-xs text-slate-500">Official independent scholarships published directly by the administrator</p>
            </div>
            <div className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded text-slate-700">
              Total Published: {scholarships.length}
            </div>
          </div>

          {scholarships.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-3">
              <Award className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-sm">0 Scholarships Currently Published</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                The administrator has not published any scholarships yet. As an independent platform, scholarships will appear here as soon as the administrator publishes them.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scholarships.map((sch) => (
                <div
                  key={sch.id}
                  className="border border-slate-200 rounded-xl p-5 bg-white space-y-4 shadow-2xs hover:border-emerald-300 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Official Program</span>
                        <h3 className="font-bold text-slate-900 text-base">{sch.name}</h3>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        sch.status === 'Open' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {sch.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2">
                      {sch.description || 'Independent scholarship grant for qualifying deserving students.'}
                    </p>

                    <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-lg flex items-center justify-between">
                      <span className="text-xs text-emerald-900 font-semibold">Scholarship Grant:</span>
                      <span className="text-base font-extrabold text-emerald-700">{sch.amount}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[11px] pt-1 border-t border-slate-100">
                      <div className="bg-slate-50 p-2 rounded border border-slate-100">
                        <span className="text-slate-400 block text-[9px] uppercase font-semibold">Min Academic %</span>
                        <span className="font-bold text-slate-800">{sch.min_percentage}</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded border border-slate-100">
                        <span className="text-slate-400 block text-[9px] uppercase font-semibold">Income Limit</span>
                        <span className="font-bold text-slate-800 truncate block">{sch.max_family_income}</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded border border-slate-100">
                        <span className="text-slate-400 block text-[9px] uppercase font-semibold">Last Date</span>
                        <span className="font-bold text-slate-800 truncate block">{sch.last_date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    {existingApp ? (
                      <button
                        onClick={() => setActiveTab('my-applications')}
                        className="w-full py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-200 transition-colors cursor-pointer"
                      >
                        Application Submitted (Track Status)
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedSchId(sch.id);
                          setActiveTab('apply');
                        }}
                        disabled={sch.status === 'Closed'}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                      >
                        <GraduationCap className="w-4 h-4" />
                        <span>Apply for this Scholarship</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: MY APPLICATION & STATUS */}
      {/* ========================================================================= */}
      {activeTab === 'my-applications' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Application Status & Verification Record</h2>
              <p className="text-xs text-slate-500">Track eligibility verification, document check and committee remarks</p>
            </div>
            {existingApp && (
              <span className="font-mono text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-800 rounded">
                Application ID: {existingApp.id}
              </span>
            )}
          </div>

          {applications.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-3">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-sm">No application submitted yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Review the eligibility criteria and submit your official application for VidyaMitraScholarship.
              </p>
              <button
                onClick={() => setActiveTab('apply')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-xs"
              >
                Start Scholarship Application
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {applications.map((app) => (
                <div key={app.id} className="border border-slate-200 rounded-xl p-5 space-y-5 bg-white">
                  
                  {/* Status Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Overall Status</span>
                      <div className="mt-1">{getStatusBadge(app.status)}</div>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Eligibility Verification</span>
                      <div className="mt-1">
                        <span className={`inline-block px-2 py-0.5 rounded font-bold ${
                          app.eligibility_status === 'Eligible' ? 'bg-teal-100 text-teal-800' :
                          app.eligibility_status === 'Not Eligible' ? 'bg-rose-100 text-rose-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {app.eligibility_status}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Documents Verified</span>
                      <div className="mt-1 font-bold text-slate-800 flex items-center gap-1.5">
                        <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{app.document_verification_status || 'Under verification'}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Submission Date</span>
                      <div className="mt-1 font-semibold text-slate-800">
                        {new Date(app.applied_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Admin Remarks Notice if any */}
                  {app.admin_remarks && (
                    <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-lg text-xs space-y-1">
                      <div className="font-bold text-blue-900 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-blue-700" />
                        <span>Official Administrator Remarks:</span>
                      </div>
                      <p className="text-blue-800 italic pl-5">"{app.admin_remarks}"</p>
                    </div>
                  )}

                  {/* Document Verification Table */}
                  <div className="space-y-2">
                    <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                      Uploaded Documents & Verification Status
                    </h3>
                    <div className="overflow-x-auto border border-slate-200 rounded-lg">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[10px] uppercase">
                          <tr>
                            <th className="py-2.5 px-3">Document Name</th>
                            <th className="py-2.5 px-3">File</th>
                            <th className="py-2.5 px-3">Admin Verification</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {app.documents.map((doc) => (
                            <tr key={doc.id}>
                              <td className="py-2.5 px-3 font-semibold text-slate-800">
                                {doc.doc_type}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600">
                                <a
                                  href={doc.file_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-emerald-700 hover:underline flex items-center gap-1 font-medium"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>{doc.file_name}</span>
                                </a>
                              </td>
                              <td className="py-2.5 px-3">
                                {doc.is_verified ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                    <Check className="w-3 h-3" /> Verified
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                                    <Clock className="w-3 h-3" /> Not Verified Yet
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Action row */}
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => setViewingApp(app)}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>View Full Application Details</span>
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: APPLY FOR VIDYAMITRASCHOLARSHIP */}
      {/* ========================================================================= */}
      {activeTab === 'apply' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900">
              VidyaMitraScholarship Application Form
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Complete all details carefully. The administrator will manually inspect all data and documents.
            </p>
          </div>

          {existingApp ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3 text-xs">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span>Application Already Submitted</span>
              </div>
              <p className="text-emerald-800 leading-relaxed">
                You have already submitted an application with ID <strong className="font-mono">{existingApp.id}</strong>. Under platform guidelines, only one application per student is permitted.
              </p>
              <div className="pt-2 flex items-center gap-3">
                <span className="font-semibold text-slate-700">Current Status:</span>
                {getStatusBadge(existingApp.status)}
                <button
                  onClick={() => setActiveTab('my-applications')}
                  className="px-3 py-1 bg-emerald-700 text-white rounded font-bold text-xs ml-auto cursor-pointer"
                >
                  Go to My Application Status
                </button>
              </div>
            </div>
          ) : scholarships.length === 0 ? (
            <div className="p-10 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-3">
              <AlertCircle className="w-9 h-9 text-slate-400 mx-auto" />
              <h3 className="font-bold text-slate-800 text-sm">No Active Scholarship Published</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                The administrator has not yet published an active scholarship scheme. Applications will open as soon as the administrator publishes a scholarship.
              </p>
              <button
                onClick={() => setActiveTab('available-scholarships')}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                View Available Scholarships
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitApplication} className="space-y-8 text-xs">
              
              {/* SCHOLARSHIP SCHEME SELECTOR */}
              <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 space-y-2.5">
                <label className="block font-bold text-slate-900 text-xs">
                  Select Scholarship Program to Apply For *
                </label>
                <select
                  value={selectedSchId}
                  onChange={(e) => setSelectedSchId(e.target.value)}
                  className="w-full px-3 py-2 border border-emerald-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white font-semibold text-slate-800 text-xs"
                >
                  {scholarships.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} - Grant: {s.amount} (Deadline: {s.last_date}) {s.status === 'Closed' ? '[Closed]' : ''}
                    </option>
                  ))}
                </select>

                {(() => {
                  const currSch = scholarships.find(s => s.id === selectedSchId) || scholarships[0];
                  if (!currSch) return null;
                  return (
                    <div className="pt-2 flex flex-wrap items-center gap-3 text-[11px] text-emerald-950 font-medium border-t border-emerald-200/60">
                      <span><strong>Grant Amount:</strong> {currSch.amount}</span>
                      <span>&bull;</span>
                      <span><strong>Academic Cutoff:</strong> {currSch.min_percentage}</span>
                      <span>&bull;</span>
                      <span><strong>Family Income:</strong> {currSch.max_family_income}</span>
                      <span>&bull;</span>
                      <span><strong>Deadline:</strong> {currSch.last_date}</span>
                    </div>
                  );
                })()}
              </div>

              {/* SECTION 0: ELIGIBILITY CRITERIA DISCLOSURE */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>VidyaMitraScholarship Eligibility Criteria</span>
                </div>
                <p className="text-slate-500 text-[11px]">
                  Please review the mandatory platform requirements before proceeding:
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-700 list-disc list-inside">
                  {ELIGIBILITY_RULES.map((rule, idx) => (
                    <li key={idx} className="leading-relaxed">{rule}</li>
                  ))}
                </ul>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* 1. PERSONAL DETAILS */}
              <div className="space-y-3">
                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs flex items-center gap-2 pb-1 border-b border-slate-100">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  1. Personal Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Student full name"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Date of Birth *</label>
                    <input
                      type="date"
                      required
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Gender *</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="10-digit mobile"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@example.com"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Aadhaar / National ID *</label>
                    <input
                      type="text"
                      required
                      value={aadhaar}
                      onChange={(e) => setAadhaar(e.target.value)}
                      placeholder="12-digit Aadhaar / ID"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Residential Address *</label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Door no, Street, Locality"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">State & District *</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        type="text"
                        required
                        value={stateName}
                        onChange={(e) => setStateName(e.target.value)}
                        placeholder="State"
                        className="w-full px-2 py-2 border border-slate-300 rounded-lg text-xs"
                      />
                      <input
                        type="text"
                        required
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        placeholder="District"
                        className="w-full px-2 py-2 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. EDUCATION DETAILS */}
              <div className="space-y-3">
                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs flex items-center gap-2 pb-1 border-b border-slate-100">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  2. Education Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">College / School Name *</label>
                    <input
                      type="text"
                      required
                      value={collegeName}
                      onChange={(e) => setCollegeName(e.target.value)}
                      placeholder="Institution full name"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Course / Degree *</label>
                    <input
                      type="text"
                      required
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      placeholder="e.g. B.Tech Computer Science, B.Sc"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Current Year / Semester *</label>
                    <select
                      value={yearSemester}
                      onChange={(e) => setYearSemester(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                      <option value="Final Semester">Final Semester</option>
                      <option value="Postgraduate">Postgraduate</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Previous Year Percentage *</label>
                    <input
                      type="text"
                      required
                      value={prevPercentage}
                      onChange={(e) => setPrevPercentage(e.target.value)}
                      placeholder="e.g. 84.5%"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">CGPA / Marks Secured *</label>
                    <input
                      type="text"
                      required
                      value={cgpaMarks}
                      onChange={(e) => setCgpaMarks(e.target.value)}
                      placeholder="e.g. 8.5 CGPA or 850/1000"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* 3. ELIGIBILITY DETAILS */}
              <div className="space-y-3">
                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs flex items-center gap-2 pb-1 border-b border-slate-100">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  3. Eligibility & Income Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Social Category *</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      <option value="General">General / Open</option>
                      <option value="OBC">OBC (Other Backward Classes)</option>
                      <option value="SC">SC (Scheduled Caste)</option>
                      <option value="ST">ST (Scheduled Tribe)</option>
                      <option value="EWS">EWS (Economically Weaker Section)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Annual Family Income *</label>
                    <input
                      type="text"
                      required
                      value={annualIncome}
                      onChange={(e) => setAnnualIncome(e.target.value)}
                      placeholder="e.g. ₹1,80,000"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Student Status *</label>
                    <select
                      value={studentStatus}
                      onChange={(e) => setStudentStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      <option value="Regular (Full-time)">Regular (Full-time)</option>
                      <option value="Distance Education">Distance Education</option>
                      <option value="Part-time">Part-time</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Previous Scholarship Received? *</label>
                    <input
                      type="text"
                      required
                      value={prevScholarship}
                      onChange={(e) => setPrevScholarship(e.target.value)}
                      placeholder="e.g. No or scholarship details"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Disability / PwD Status *</label>
                    <input
                      type="text"
                      required
                      value={disabilityStatus}
                      onChange={(e) => setDisabilityStatus(e.target.value)}
                      placeholder="e.g. None or details if applicable"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* 4. BANK DETAILS */}
              <div className="space-y-3">
                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs flex items-center gap-2 pb-1 border-b border-slate-100">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  4. Bank Account Details (For Grant Disbursement)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Account Holder Name *</label>
                    <input
                      type="text"
                      required
                      value={bankHolder}
                      onChange={(e) => setBankHolder(e.target.value)}
                      placeholder="Name as per bank passbook"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Bank Name *</label>
                    <input
                      type="text"
                      required
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. State Bank of India, Canara Bank"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Bank Account Number *</label>
                    <input
                      type="text"
                      required
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                      placeholder="Enter account number"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Bank IFSC Code *</label>
                    <input
                      type="text"
                      required
                      value={bankIfsc}
                      onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                      placeholder="e.g. SBIN0004055"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* 5. DOCUMENT UPLOAD (8 SPECIFIED DOCUMENTS) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    5. Document Upload
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-500">
                    Mandatory items required: 6
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {STANDARD_REQUIRED_DOCUMENTS.map((doc) => {
                    const uploaded = uploadedDocs[doc.key];
                    const isUploading = uploadingDocKey === doc.key;

                    return (
                      <div
                        key={doc.key}
                        className={`p-3.5 rounded-xl border transition-colors ${
                          uploaded ? 'bg-emerald-50/50 border-emerald-300' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="font-semibold text-slate-800 text-[11px] leading-tight">
                            {doc.label} {doc.required && <span className="text-rose-500">*</span>}
                          </span>
                          {uploaded ? (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded whitespace-nowrap">
                              ✓ Uploaded
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                              {doc.required ? 'Required' : 'Optional'}
                            </span>
                          )}
                        </div>

                        {uploaded ? (
                          <div className="flex items-center justify-between gap-2 text-[11px] pt-1 border-t border-emerald-100">
                            <span className="truncate text-slate-700 font-mono">{uploaded.file_name}</span>
                            <label className="text-emerald-700 font-bold hover:underline cursor-pointer shrink-0">
                              <span>Replace</span>
                              <input
                                type="file"
                                accept=".pdf,.png,.jpg,.jpeg"
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) handleDocUpload(doc.key, doc.label, f);
                                }}
                                className="hidden"
                              />
                            </label>
                          </div>
                        ) : (
                          <label className="block text-center py-2 px-3 bg-white border border-dashed border-slate-300 hover:border-emerald-500 rounded-lg cursor-pointer text-emerald-700 font-semibold transition-colors">
                            <span>{isUploading ? 'Uploading to Supabase...' : 'Click to upload'}</span>
                            <input
                              type="file"
                              accept=".pdf,.png,.jpg,.jpeg"
                              disabled={isUploading}
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleDocUpload(doc.key, doc.label, f);
                              }}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 6. ELIGIBILITY DECLARATION (4 CHECKBOXES) */}
              <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-xl p-5">
                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
                  6. Eligibility Declaration
                </h3>

                <div className="space-y-2.5 text-xs text-slate-700">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={decl1}
                      onChange={(e) => setDecl1(e.target.checked)}
                      className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>I confirm that I meet the eligibility criteria.</span>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={decl2}
                      onChange={(e) => setDecl2(e.target.checked)}
                      className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>I confirm that all information provided is correct.</span>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={decl3}
                      onChange={(e) => setDecl3(e.target.checked)}
                      className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>I confirm that the uploaded documents are genuine.</span>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={decl4}
                      onChange={(e) => setDecl4(e.target.checked)}
                      className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>I agree that VidyaMitraScholarship Admin may verify my application and documents.</span>
                  </label>
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!isFormComplete || submitting}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-colors cursor-pointer shadow-xs"
                >
                  {submitting ? 'Submitting Application...' : 'Submit Application for VidyaMitraScholarship'}
                </button>
                {!isFormComplete && (
                  <p className="text-center text-[11px] text-slate-500 mt-2">
                    Submit button will activate once all required fields, 6 mandatory documents, and 4 declaration checkboxes are complete.
                  </p>
                )}
              </div>

            </form>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MY PROFILE */}
      {/* ========================================================================= */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-4">
          <h2 className="text-base font-bold text-slate-900">My Profile</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">Full Name</span>
              <span className="font-bold text-slate-900 text-sm">{currentUser.full_name}</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">Email Address</span>
              <span className="font-semibold text-slate-800">{currentUser.email}</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">Mobile Number</span>
              <span className="font-semibold text-slate-800">+91 {currentUser.mobile}</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">Account Role</span>
              <span className="font-bold text-emerald-700 capitalize">{currentUser.role}</span>
            </div>
          </div>
        </div>
      )}

      {/* FULL APPLICATION VIEWER MODAL */}
      {viewingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 text-xs">
            
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <span className="font-mono text-[11px] font-bold text-slate-500">APPLICATION RECORD</span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  {viewingApp.id} &bull; {viewingApp.scholarship_name}
                </h3>
              </div>
              <button
                onClick={() => setViewingApp(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-slate-700">
              
              {/* Status Header */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Status</span>
                  <div className="mt-0.5">{getStatusBadge(viewingApp.status)}</div>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Eligibility</span>
                  <span className="font-bold text-slate-800">{viewingApp.eligibility_status}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Documents Verified</span>
                  <span className="font-bold text-slate-800">{viewingApp.document_verification_status}</span>
                </div>
              </div>

              {viewingApp.admin_remarks && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <span className="font-bold text-blue-900 block mb-0.5">Admin Remarks:</span>
                  <p className="text-blue-800 italic">"{viewingApp.admin_remarks}"</p>
                </div>
              )}

              {/* Personal Details */}
              <div>
                <h4 className="font-bold text-slate-900 uppercase text-[11px] mb-1.5">Personal Information</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div><span className="text-slate-400 block text-[10px]">Name:</span><strong>{viewingApp.full_name}</strong></div>
                  <div><span className="text-slate-400 block text-[10px]">DOB & Gender:</span><strong>{viewingApp.date_of_birth} ({viewingApp.gender})</strong></div>
                  <div><span className="text-slate-400 block text-[10px]">Aadhaar / ID:</span><strong>{viewingApp.aadhaar_number}</strong></div>
                  <div><span className="text-slate-400 block text-[10px]">Email:</span><strong>{viewingApp.email}</strong></div>
                  <div><span className="text-slate-400 block text-[10px]">Mobile:</span><strong>+91 {viewingApp.mobile}</strong></div>
                  <div><span className="text-slate-400 block text-[10px]">Domicile:</span><strong>{viewingApp.district}, {viewingApp.state}</strong></div>
                </div>
              </div>

              {/* Academic Details */}
              <div>
                <h4 className="font-bold text-slate-900 uppercase text-[11px] mb-1.5">Educational Details</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="sm:col-span-2"><span className="text-slate-400 block text-[10px]">College:</span><strong>{viewingApp.college_name}</strong></div>
                  <div><span className="text-slate-400 block text-[10px]">Course:</span><strong>{viewingApp.course}</strong></div>
                  <div><span className="text-slate-400 block text-[10px]">Year/Semester:</span><strong>{viewingApp.current_year_semester}</strong></div>
                  <div><span className="text-slate-400 block text-[10px]">Previous %:</span><strong>{viewingApp.previous_year_percentage}</strong></div>
                  <div><span className="text-slate-400 block text-[10px]">CGPA/Marks:</span><strong>{viewingApp.cgpa_marks}</strong></div>
                </div>
              </div>

              {/* Eligibility & Bank */}
              <div>
                <h4 className="font-bold text-slate-900 uppercase text-[11px] mb-1.5">Eligibility & Bank Account</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div><span className="text-slate-400 block text-[10px]">Category:</span><strong>{viewingApp.category}</strong></div>
                  <div><span className="text-slate-400 block text-[10px]">Family Income:</span><strong>{viewingApp.annual_family_income}</strong></div>
                  <div><span className="text-slate-400 block text-[10px]">Bank:</span><strong>{viewingApp.bank_name}</strong></div>
                  <div><span className="text-slate-400 block text-[10px]">Account No:</span><strong className="font-mono">{viewingApp.bank_account_number}</strong></div>
                </div>
              </div>

              {/* Documents List */}
              <div>
                <h4 className="font-bold text-slate-900 uppercase text-[11px] mb-1.5">Submitted Documents ({viewingApp.documents.length})</h4>
                <div className="space-y-1.5">
                  {viewingApp.documents.map((d) => (
                    <div key={d.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800">{d.doc_type}</span>
                        {d.is_verified ? (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                            Verified
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                            Pending
                          </span>
                        )}
                      </div>
                      <a
                        href={d.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 bg-emerald-600 text-white rounded text-[11px] font-bold flex items-center gap-1 hover:bg-emerald-700"
                      >
                        <ExternalLink className="w-3 h-3" /> View
                      </a>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 text-right">
              <button
                onClick={() => setViewingApp(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
