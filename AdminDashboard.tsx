import React, { useState, useEffect } from 'react';
import { 
  Users, 
  FileText, 
  Award, 
  Plus, 
  Check, 
  X, 
  LogOut, 
  Edit2, 
  Trash2, 
  Eye, 
  ExternalLink,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FileCheck,
  FileWarning,
  MessageSquare,
  Search,
  Filter
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Profile, Scholarship, Application, ApplicationStatus, EligibilityStatus, AppDocument } from '../types';
import { DataService } from '../lib/supabaseClient';

interface AdminDashboardProps {
  onNavigate: (route: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { currentUser, logout } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'applications' | 'scholarships' | 'students'>('applications');
  
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [students, setStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [appSearch, setAppSearch] = useState('');
  const [appFilter, setAppFilter] = useState('All');
  const [studentSearch, setStudentSearch] = useState('');

  // Selected Application for Review & Verification Modal
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [remarksInput, setRemarksInput] = useState('');
  const [savingAction, setSavingAction] = useState(false);

  // Add / Edit Scholarship Modal
  const [isSchModalOpen, setIsSchModalOpen] = useState(false);
  const [editingSch, setEditingSch] = useState<Scholarship | null>(null);
  const [schName, setSchName] = useState('');
  const [schDescription, setSchDescription] = useState('');
  const [schAmount, setSchAmount] = useState('');
  const [schCriteria, setSchCriteria] = useState('');
  const [schMinPercentage, setSchMinPercentage] = useState('60%');
  const [schMaxIncome, setSchMaxIncome] = useState('₹3,00,000 / year');
  const [schDocs, setSchDocs] = useState('Identity Proof, Marks Card, College ID, Bonafide Certificate, Income Certificate, Bank Passbook');
  const [schStartDate, setSchStartDate] = useState('2026-10-01');
  const [schLastDate, setSchLastDate] = useState('2026-12-31');
  const [schStatus, setSchStatus] = useState<'Open' | 'Closed'>('Open');

  // Delete Scholarship confirmation modal
  const [deletingSchId, setDeletingSchId] = useState<string | null>(null);

  // Selected student for Profile View Modal
  const [viewingStudent, setViewingStudent] = useState<Profile | null>(null);

  const loadData = async () => {
    setLoading(true);
    const [schList, appList, studList] = await Promise.all([
      DataService.fetchScholarships(),
      DataService.fetchApplications(),
      DataService.fetchRegisteredStudents()
    ]);
    setScholarships(schList);
    setApplications(appList);
    setStudents(studList);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Admin Login Required</h2>
        <button
          onClick={() => onNavigate('admin-login')}
          className="px-5 py-2.5 bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
        >
          Admin Login
        </button>
      </div>
    );
  }

  // --- STATS COUNTERS ---
  const countTotalStudents = students.length;
  const countTotalApps = applications.length;
  const countPending = applications.filter(a => a.status === 'Pending').length;
  const countUnderReview = applications.filter(a => a.status === 'Under Review' || a.status === 'Documents Required').length;
  const countApproved = applications.filter(a => a.status === 'Approved').length;
  const countRejected = applications.filter(a => a.status === 'Rejected').length;

  // --- APPLICATION VERIFICATION ACTIONS ---

  const handleOpenAppReview = (app: Application) => {
    setSelectedApp(app);
    setRemarksInput(app.admin_remarks || '');
  };

  // Toggle single document verification
  const handleToggleDocVerification = async (docId: string, currentVerified: boolean) => {
    if (!selectedApp) return;
    const updated = await DataService.toggleDocumentVerification(selectedApp.id, docId, !currentVerified);
    if (updated) {
      setSelectedApp(updated);
      await loadData();
    }
  };

  // Toggle eligibility verification
  const handleSetEligibility = async (status: EligibilityStatus) => {
    if (!selectedApp) return;
    setSavingAction(true);
    const updated = await DataService.updateApplication(selectedApp.id, {
      eligibility_status: status,
      eligibility_verified: status === 'Eligible'
    });
    if (updated) setSelectedApp(updated);
    await loadData();
    setSavingAction(false);
  };

  // Save remarks
  const handleSaveRemarks = async (remarkPreset?: string) => {
    if (!selectedApp) return;
    const textToSave = remarkPreset !== undefined ? remarkPreset : remarksInput;
    setSavingAction(true);
    const updated = await DataService.updateApplication(selectedApp.id, {
      admin_remarks: textToSave
    });
    if (updated) setSelectedApp(updated);
    setRemarksInput(textToSave);
    await loadData();
    setSavingAction(false);
  };

  // Set Application Status
  const handleSetStatus = async (newStatus: ApplicationStatus) => {
    if (!selectedApp) return;

    // RULE 11: Application should NOT be approved until all required documents and eligibility criteria are verified
    if (newStatus === 'Approved') {
      const unverifiedDocs = selectedApp.documents.filter(d => !d.is_verified);
      const isEligible = selectedApp.eligibility_status === 'Eligible';

      if (unverifiedDocs.length > 0 || !isEligible) {
        const confirmApprove = window.confirm(
          `Notice: ${unverifiedDocs.length} document(s) are unverified, and eligibility is "${selectedApp.eligibility_status}".\n\nRule: All documents and eligibility should be verified before approval.\n\nDo you still wish to approve this application?`
        );
        if (!confirmApprove) return;
      }
    }

    setSavingAction(true);
    const updated = await DataService.updateApplication(selectedApp.id, {
      status: newStatus,
      admin_remarks: remarksInput || selectedApp.admin_remarks
    });
    if (updated) setSelectedApp(updated);
    await loadData();
    setSavingAction(false);
  };

  // --- SCHOLARSHIP MANAGEMENT ACTIONS ---

  const openAddScholarship = () => {
    setEditingSch(null);
    setSchName('');
    setSchDescription('');
    setSchAmount('₹50,000');
    setSchCriteria('Enrolled in accredited degree / diploma institution.');
    setSchMinPercentage('60%');
    setSchMaxIncome('₹3,00,000 / year');
    setSchDocs('Identity Proof, Marks Card, College ID, Bonafide Certificate, Income Certificate, Bank Passbook');
    setSchStartDate('2026-10-01');
    setSchLastDate('2026-12-31');
    setSchStatus('Open');
    setIsSchModalOpen(true);
  };

  const openEditScholarship = (sch: Scholarship) => {
    setEditingSch(sch);
    setSchName(sch.name);
    setSchDescription(sch.description);
    setSchAmount(sch.amount);
    setSchCriteria(sch.eligibility_criteria);
    setSchMinPercentage(sch.min_percentage);
    setSchMaxIncome(sch.max_family_income);
    setSchDocs(sch.required_documents.join(', '));
    setSchStartDate(sch.start_date);
    setSchLastDate(sch.last_date);
    setSchStatus(sch.status);
    setIsSchModalOpen(true);
  };

  const handleSaveScholarship = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schName || !schAmount || !schLastDate) return;

    const docsList = schDocs.split(',').map(d => d.trim()).filter(Boolean);

    if (editingSch) {
      await DataService.updateScholarship(editingSch.id, {
        name: schName.trim(),
        description: schDescription.trim(),
        amount: schAmount.trim(),
        eligibility_criteria: schCriteria.trim(),
        min_percentage: schMinPercentage.trim(),
        max_family_income: schMaxIncome.trim(),
        required_documents: docsList,
        start_date: schStartDate,
        last_date: schLastDate,
        status: schStatus
      });
    } else {
      await DataService.addScholarship({
        name: schName.trim(),
        description: schDescription.trim(),
        amount: schAmount.trim(),
        eligibility_criteria: schCriteria.trim(),
        min_percentage: schMinPercentage.trim(),
        max_family_income: schMaxIncome.trim(),
        required_documents: docsList,
        start_date: schStartDate,
        last_date: schLastDate,
        status: schStatus
      });
    }

    setIsSchModalOpen(false);
    setEditingSch(null);
    await loadData();
  };

  const confirmDeleteScholarship = async () => {
    if (!deletingSchId) return;
    await DataService.deleteScholarship(deletingSchId);
    setDeletingSchId(null);
    await loadData();
  };

  // Status Badge Helper
  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Approved
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
            <XCircle className="w-3.5 h-3.5 text-rose-600" /> Rejected
          </span>
        );
      case 'Eligible':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800">
            <Check className="w-3.5 h-3.5 text-teal-600" /> Eligible
          </span>
        );
      case 'Not Eligible':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Not Eligible
          </span>
        );
      case 'Documents Required':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
            <FileWarning className="w-3.5 h-3.5 text-purple-600" /> Documents Required
          </span>
        );
      case 'Under Review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
            <Clock className="w-3.5 h-3.5 text-blue-600" /> Under Review
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> Pending
          </span>
        );
    }
  };

  // Filtered Applications
  const filteredApps = applications.filter(app => {
    const matchesSearch = 
      app.full_name.toLowerCase().includes(appSearch.toLowerCase()) ||
      app.id.toLowerCase().includes(appSearch.toLowerCase()) ||
      app.college_name.toLowerCase().includes(appSearch.toLowerCase());
    
    const matchesFilter = appFilter === 'All' || app.status === appFilter;
    return matchesSearch && matchesFilter;
  });

  const filteredStudents = students.filter(st => 
    st.full_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    st.email.toLowerCase().includes(studentSearch.toLowerCase()) ||
    st.mobile.includes(studentSearch)
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      
      {/* Top Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
        <div>
          <span className="text-xs text-indigo-700 font-bold uppercase tracking-wider">
            VidyaMitraScholarship &bull; Verification Authority
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">
            Admin Verification Console
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Logged in as {currentUser.email}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openAddScholarship}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Scholarship</span>
          </button>

          <button
            onClick={async () => {
              await logout();
              onNavigate('home');
            }}
            className="px-3.5 py-2 border border-slate-200 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Stats Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Students</span>
          <span className="text-xl font-extrabold text-slate-900 mt-0.5 block">{countTotalStudents}</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Applications</span>
          <span className="text-xl font-extrabold text-slate-900 mt-0.5 block">{countTotalApps}</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <span className="text-[10px] uppercase font-bold text-amber-500 block">Pending</span>
          <span className="text-xl font-extrabold text-amber-600 mt-0.5 block">{countPending}</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <span className="text-[10px] uppercase font-bold text-blue-500 block">Under Review</span>
          <span className="text-xl font-extrabold text-blue-600 mt-0.5 block">{countUnderReview}</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <span className="text-[10px] uppercase font-bold text-emerald-500 block">Approved</span>
          <span className="text-xl font-extrabold text-emerald-700 mt-0.5 block">{countApproved}</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <span className="text-[10px] uppercase font-bold text-rose-500 block">Rejected</span>
          <span className="text-xl font-extrabold text-rose-600 mt-0.5 block">{countRejected}</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 gap-2 bg-white rounded-xl p-1 border">
        <button
          onClick={() => setActiveTab('applications')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'applications' ? 'bg-indigo-700 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Applications & Verification ({applications.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('scholarships')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'scholarships' ? 'bg-indigo-700 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Manage Scholarships ({scholarships.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'students' ? 'bg-indigo-700 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Registered Students ({students.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: APPLICATIONS & VERIFICATION */}
      {/* ========================================================================= */}
      {activeTab === 'applications' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full max-w-sm">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={appSearch}
                onChange={(e) => setAppSearch(e.target.value)}
                placeholder="Search by student name, college or App ID..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto text-xs">
              <span className="text-slate-400 text-[11px] font-semibold">Filter:</span>
              {['All', 'Pending', 'Under Review', 'Documents Required', 'Approved', 'Rejected'].map((statusOption) => (
                <button
                  key={statusOption}
                  onClick={() => setAppFilter(statusOption)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    appFilter === statusOption ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {statusOption}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          {filteredApps.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              No applications match the criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="py-3 px-3">App ID</th>
                    <th className="py-3 px-3">Student Name</th>
                    <th className="py-3 px-3">College & Course</th>
                    <th className="py-3 px-3">Marks</th>
                    <th className="py-3 px-3">Eligibility</th>
                    <th className="py-3 px-3">Docs Verified</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredApps.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-600 text-[11px]">
                        {app.id}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{app.full_name}</div>
                        <div className="text-[10px] text-slate-400">{app.email}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        <div className="font-medium text-slate-800">{app.course} ({app.current_year_semester})</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-xs">{app.college_name}</div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        {app.previous_year_percentage}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                          app.eligibility_status === 'Eligible' ? 'bg-teal-100 text-teal-800' :
                          app.eligibility_status === 'Not Eligible' ? 'bg-rose-100 text-rose-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {app.eligibility_status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-700 font-medium">
                        {app.document_verification_status}
                      </td>
                      <td className="py-3 px-3">
                        {getStatusBadge(app.status)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleOpenAppReview(app)}
                          className="px-3 py-1 bg-indigo-700 hover:bg-indigo-800 text-white rounded text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                        >
                          Verify & Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SCHOLARSHIP MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'scholarships' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Admin Scholarship Management</h2>
              <p className="text-xs text-slate-500">Only scholarships published here appear to students</p>
            </div>
            <button
              onClick={openAddScholarship}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Scholarship</span>
            </button>
          </div>

          {scholarships.length === 0 ? (
            <div className="p-10 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-3">
              <Award className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-sm">No scholarships published yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Click below to add a scholarship with amount, eligibility criteria, and required documents.
              </p>
              <button
                onClick={openAddScholarship}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                + Add First Scholarship
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scholarships.map((sch) => (
                <div key={sch.id} className="p-4 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3 bg-white">
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-sm text-slate-900">{sch.name}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        sch.status === 'Open' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {sch.status}
                      </span>
                    </div>

                    <div className="font-bold text-emerald-700 text-sm">{sch.amount}</div>

                    <div className="text-slate-500 text-[11px]">
                      <strong>Application Window:</strong> {sch.start_date} to {sch.last_date}
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded border border-slate-100 space-y-1 text-[11px] text-slate-700">
                      <div><strong>Min Percentage:</strong> {sch.min_percentage} &bull; <strong>Max Income:</strong> {sch.max_family_income}</div>
                      <div><strong>Criteria:</strong> {sch.eligibility_criteria}</div>
                    </div>

                    {sch.description && (
                      <p className="text-slate-600 line-clamp-2">{sch.description}</p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
                    <button
                      onClick={() => openEditScholarship(sch)}
                      className="px-2.5 py-1 border border-slate-300 hover:bg-slate-50 rounded font-semibold text-slate-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3 text-slate-500" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => setDeletingSchId(sch.id)}
                      className="px-2.5 py-1 border border-rose-200 hover:bg-rose-50 rounded font-semibold text-rose-600 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3 text-rose-500" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: REGISTERED STUDENTS */}
      {/* ========================================================================= */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Registered Students Directory</h2>
            <div className="relative w-64">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search students..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              No registered students found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Student ID</th>
                    <th className="py-3 px-4">Full Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Mobile</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredStudents.map((st) => (
                    <tr key={st.id}>
                      <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                        #{st.id.substring(0, 8)}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {st.full_name}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {st.email}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        +91 {st.mobile}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          {st.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setViewingStudent(st)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold cursor-pointer"
                        >
                          View Profile
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* COMPREHENSIVE VERIFICATION MODAL (DOCUMENT CHECK, ELIGIBILITY, REMARKS, APPROVAL) */}
      {/* ========================================================================= */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 text-xs">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[11px] text-slate-600">
                    APP ID: {selectedApp.id}
                  </span>
                  {getStatusBadge(selectedApp.status)}
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Verification & Scrutiny &bull; {selectedApp.full_name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-slate-700">
              
              {/* 1. DOCUMENT VERIFICATION PANEL (RULE 11) */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-xs uppercase tracking-wider">
                    <FileCheck className="w-4 h-4 text-indigo-700" />
                    <span>Individual Document Verification</span>
                  </div>
                  <span className="font-bold text-indigo-700 text-xs">
                    {selectedApp.document_verification_status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Inspect each submitted document via the link and click [Mark Verified]. Application should not be approved until all documents are verified.
                </p>

                <div className="space-y-2">
                  {selectedApp.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900 text-xs">{doc.doc_type}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span>File: {doc.file_name}</span>
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-600 hover:underline flex items-center gap-0.5 font-bold"
                          >
                            <ExternalLink className="w-3 h-3" /> View / Inspect
                          </a>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {doc.is_verified ? (
                          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                            Verified ✓
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                            Not Verified
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleToggleDocVerification(doc.id, doc.is_verified)}
                          className={`px-3 py-1 rounded text-xs font-bold cursor-pointer transition-colors ${
                            doc.is_verified
                              ? 'border border-slate-300 text-slate-700 hover:bg-slate-100'
                              : 'bg-indigo-700 text-white hover:bg-indigo-800'
                          }`}
                        >
                          {doc.is_verified ? 'Unverify' : 'Mark Verified'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. ELIGIBILITY CRITERIA VERIFICATION */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-xs uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4 text-indigo-700" />
                    <span>Eligibility Assessment</span>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded ${
                    selectedApp.eligibility_status === 'Eligible' ? 'bg-teal-100 text-teal-800' :
                    selectedApp.eligibility_status === 'Not Eligible' ? 'bg-rose-100 text-rose-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {selectedApp.eligibility_status}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-white p-3 rounded-lg border border-slate-200 text-xs">
                  <div><span className="text-slate-400 block text-[10px]">Previous %:</span><strong>{selectedApp.previous_year_percentage}</strong></div>
                  <div><span className="text-slate-400 block text-[10px]">Family Income:</span><strong>{selectedApp.annual_family_income}</strong></div>
                  <div><span className="text-slate-400 block text-[10px]">Category:</span><strong>{selectedApp.category}</strong></div>
                  <div><span className="text-slate-400 block text-[10px]">Student Status:</span><strong>{selectedApp.student_status}</strong></div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleSetEligibility('Eligible')}
                    className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded text-xs font-bold cursor-pointer transition-colors"
                  >
                    Mark as Eligible ✓
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetEligibility('Not Eligible')}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold cursor-pointer transition-colors"
                  >
                    Mark as Not Eligible ✗
                  </button>
                </div>
              </div>

              {/* 3. APPLICANT DETAILS (PERSONAL, ACADEMIC, BANK) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-900 uppercase text-[10px]">Personal & Domicile</h4>
                  <div className="space-y-1 text-xs">
                    <div><span className="text-slate-400">Full Name:</span> <strong>{selectedApp.full_name}</strong></div>
                    <div><span className="text-slate-400">Email:</span> <strong>{selectedApp.email}</strong></div>
                    <div><span className="text-slate-400">Mobile:</span> <strong>+91 {selectedApp.mobile}</strong></div>
                    <div><span className="text-slate-400">DOB & Gender:</span> <strong>{selectedApp.date_of_birth} ({selectedApp.gender})</strong></div>
                    <div><span className="text-slate-400">Aadhaar / ID:</span> <strong>{selectedApp.aadhaar_number}</strong></div>
                    <div><span className="text-slate-400">Address:</span> <strong>{selectedApp.address}, {selectedApp.district}, {selectedApp.state}</strong></div>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-900 uppercase text-[10px]">College & Bank Info</h4>
                  <div className="space-y-1 text-xs">
                    <div><span className="text-slate-400">College:</span> <strong>{selectedApp.college_name}</strong></div>
                    <div><span className="text-slate-400">Course & Year:</span> <strong>{selectedApp.course} ({selectedApp.current_year_semester})</strong></div>
                    <div><span className="text-slate-400">CGPA / Marks:</span> <strong>{selectedApp.cgpa_marks}</strong></div>
                    <div><span className="text-slate-400">Bank Name:</span> <strong>{selectedApp.bank_name}</strong></div>
                    <div><span className="text-slate-400">Account Holder:</span> <strong>{selectedApp.bank_account_holder}</strong></div>
                    <div><span className="text-slate-400">Account No:</span> <strong className="font-mono">{selectedApp.bank_account_number}</strong> ({selectedApp.bank_ifsc})</div>
                  </div>
                </div>
              </div>

              {/* 4. ADMIN REMARKS (RULE 12) */}
              <div className="space-y-2 bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                  <MessageSquare className="w-4 h-4 text-indigo-700" />
                  <span>Admin Remarks (Visible on Student Dashboard)</span>
                </div>

                {/* Preset quick remarks */}
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  {[
                    'Income certificate required',
                    'Marks card verified',
                    'Document is unclear - please re-upload',
                    'Eligibility verified',
                    'Application approved'
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setRemarksInput(preset);
                        handleSaveRemarks(preset);
                      }}
                      className="px-2 py-0.5 bg-white border border-slate-300 hover:border-indigo-500 rounded text-slate-700 cursor-pointer"
                    >
                      + "{preset}"
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={remarksInput}
                    onChange={(e) => setRemarksInput(e.target.value)}
                    placeholder="Enter custom remarks for student..."
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveRemarks()}
                    disabled={savingAction}
                    className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Save Remarks
                  </button>
                </div>
              </div>

            </div>

            {/* Footer Decision Bar */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-slate-700 text-xs">Change Status:</span>

                <button
                  type="button"
                  onClick={() => handleSetStatus('Under Review')}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs cursor-pointer shadow-2xs"
                >
                  Under Review
                </button>

                <button
                  type="button"
                  onClick={() => handleSetStatus('Documents Required')}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-xs cursor-pointer shadow-2xs"
                >
                  Request Missing Docs
                </button>

                <button
                  type="button"
                  onClick={() => handleSetStatus('Approved')}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs cursor-pointer shadow-2xs"
                >
                  Approve Application
                </button>

                <button
                  type="button"
                  onClick={() => handleSetStatus('Rejected')}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs cursor-pointer shadow-2xs"
                >
                  Reject Application
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD / EDIT SCHOLARSHIP MODAL (RULE 13) */}
      {/* ========================================================================= */}
      {isSchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4 border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">
                {editingSch ? 'Edit Scholarship Scheme' : 'Add New Scholarship'}
              </h3>
              <button
                onClick={() => setIsSchModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveScholarship} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Scholarship Name *</label>
                <input
                  type="text"
                  required
                  value={schName}
                  onChange={(e) => setSchName(e.target.value)}
                  placeholder="e.g. VidyaMitra Higher Education Grant"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Scholarship Description</label>
                <textarea
                  rows={2}
                  value={schDescription}
                  onChange={(e) => setSchDescription(e.target.value)}
                  placeholder="Describe the objective and target students"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Scholarship Amount *</label>
                  <input
                    type="text"
                    required
                    value={schAmount}
                    onChange={(e) => setSchAmount(e.target.value)}
                    placeholder="e.g. ₹50,000 / year"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status *</label>
                  <select
                    value={schStatus}
                    onChange={(e) => setSchStatus(e.target.value as 'Open' | 'Closed')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="Open">Open for Application</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Eligibility Criteria</label>
                <input
                  type="text"
                  value={schCriteria}
                  onChange={(e) => setSchCriteria(e.target.value)}
                  placeholder="e.g. Currently enrolled in an accredited institution"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Minimum Percentage</label>
                  <input
                    type="text"
                    value={schMinPercentage}
                    onChange={(e) => setSchMinPercentage(e.target.value)}
                    placeholder="e.g. 60%"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Maximum Family Income</label>
                  <input
                    type="text"
                    value={schMaxIncome}
                    onChange={(e) => setSchMaxIncome(e.target.value)}
                    placeholder="e.g. ₹3,00,000 / year"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Application Start Date</label>
                  <input
                    type="date"
                    required
                    value={schStartDate}
                    onChange={(e) => setSchStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Application Last Date *</label>
                  <input
                    type="date"
                    required
                    value={schLastDate}
                    onChange={(e) => setSchLastDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Required Documents (Comma separated)</label>
                <input
                  type="text"
                  value={schDocs}
                  onChange={(e) => setSchDocs(e.target.value)}
                  placeholder="Identity Proof, Marks Card, College ID, Bonafide"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSchModalOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold cursor-pointer transition-colors shadow-2xs"
                >
                  {editingSch ? 'Save Changes' : 'Publish Scholarship'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL (RULE 14) */}
      {deletingSchId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4 border border-slate-200 text-xs">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
              <Trash2 className="w-5 h-5" />
              <span>Confirm Scholarship Deletion</span>
            </div>
            <p className="text-slate-700 font-medium">
              Are you sure you want to delete this scholarship?
            </p>
            <p className="text-slate-500 text-[11px]">
              This action cannot be undone. Only administrators are authorized to remove scholarships.
            </p>
            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingSchId(null)}
                className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-slate-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteScholarship}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow-2xs"
              >
                Delete Scholarship
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW STUDENT PROFILE MODAL */}
      {viewingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4 border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Student Profile</h3>
              <button
                onClick={() => setViewingStudent(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div><span className="text-slate-400 block text-[10px]">Student ID:</span><strong className="font-mono">{viewingStudent.id}</strong></div>
              <div><span className="text-slate-400 block text-[10px]">Full Name:</span><strong className="text-sm text-slate-900">{viewingStudent.full_name}</strong></div>
              <div><span className="text-slate-400 block text-[10px]">Email:</span><strong>{viewingStudent.email}</strong></div>
              <div><span className="text-slate-400 block text-[10px]">Mobile:</span><strong>+91 {viewingStudent.mobile}</strong></div>
              <div><span className="text-slate-400 block text-[10px]">Role:</span><strong className="text-emerald-700 capitalize">{viewingStudent.role}</strong></div>
            </div>

            <div className="text-right">
              <button
                onClick={() => setViewingStudent(null)}
                className="px-4 py-1.5 bg-slate-800 text-white rounded-lg font-semibold"
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
