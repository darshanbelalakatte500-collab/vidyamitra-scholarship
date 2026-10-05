import React from 'react';
import { GraduationCap, UserPlus, LogIn, ShieldCheck, Award } from 'lucide-react';

interface HomePageProps {
  onNavigate: (route: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
      
      {/* Icon */}
      <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
        <GraduationCap className="w-9 h-9" />
      </div>

      {/* Main Title */}
      <div className="space-y-3">
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          VidyaMitraScholarship
        </h1>

        {/* Required Independent Platform Disclosure */}
        <div className="inline-block px-4 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-800 text-xs font-semibold">
          VidyaMitraScholarship is an independent scholarship platform.
        </div>

        <p className="text-sm sm:text-base text-slate-600 max-w-lg mx-auto leading-relaxed pt-1">
          Apply directly for the official scholarships published by the administrator, upload your credentials, and track your application status.
        </p>
      </div>

      {/* Action Buttons: Student Register, Student Login, Admin Login */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-6">
        <button
          onClick={() => onNavigate('register')}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Student Register</span>
        </button>

        <button
          onClick={() => onNavigate('login')}
          className="px-6 py-3 bg-white hover:bg-slate-50 text-emerald-700 border border-emerald-600 rounded-xl font-bold text-sm shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
        >
          <LogIn className="w-4 h-4" />
          <span>Student Login</span>
        </button>

        <button
          onClick={() => onNavigate('admin-login')}
          className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-sm transition-colors flex items-center gap-2 cursor-pointer"
        >
          <ShieldCheck className="w-4 h-4 text-slate-500" />
          <span>Admin Login</span>
        </button>
      </div>

    </div>
  );
};
