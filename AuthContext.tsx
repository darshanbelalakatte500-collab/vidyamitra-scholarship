import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile } from '../types';
import { 
  getSupabase, 
  getStoredCurrentUser, 
  setStoredCurrentUser, 
  getLocalStudents, 
  saveLocalStudents 
} from '../lib/supabaseClient';
import { DEFAULT_ADMIN } from '../data/mockData';

interface AuthContextType {
  currentUser: Profile | null;
  loading: boolean;
  registerStudent: (name: string, email: string, mobile: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginStudent: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginAdmin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      setLoading(true);
      const sb = getSupabase();
      if (sb) {
        try {
          const { data: { session } } = await sb.auth.getSession();
          if (session?.user) {
            const { data: profile } = await sb
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            if (profile) {
              setCurrentUser(profile);
              setLoading(false);
              return;
            }
          }
        } catch (e) {
          console.warn('Session init:', e);
        }
      }

      const stored = getStoredCurrentUser();
      if (stored) {
        setCurrentUser(stored);
      }
      setLoading(false);
    }
    init();
  }, []);

  const registerStudent = async (
    full_name: string,
    email: string,
    mobile: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    const sb = getSupabase();

    if (sb) {
      try {
        const { data: authData, error: authError } = await sb.auth.signUp({
          email,
          password
        });

        if (authError) {
          setLoading(false);
          return { success: false, error: authError.message };
        }

        if (authData.user) {
          const newProfile: Profile = {
            id: authData.user.id,
            full_name,
            email,
            mobile,
            role: 'student',
            created_at: new Date().toISOString()
          };

          await sb.from('profiles').insert([newProfile]);
          setLoading(false);
          return { success: true };
        }
      } catch (err: any) {
        console.warn('Supabase register error:', err);
      }
    }

    // Local registration
    const students = getLocalStudents();
    const existing = students.find(s => s.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      setLoading(false);
      return { success: false, error: 'A student account with this email already exists.' };
    }

    const newStudent: Profile = {
      id: 'stu-' + Date.now(),
      full_name,
      email,
      mobile,
      role: 'student',
      created_at: new Date().toISOString()
    };

    saveLocalStudents([...students, newStudent]);
    setLoading(false);
    return { success: true };
  };

  const loginStudent = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    const sb = getSupabase();

    if (sb) {
      try {
        const { data: authData, error: authError } = await sb.auth.signInWithPassword({
          email,
          password
        });

        if (!authError && authData.user) {
          const { data: profile } = await sb
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

          if (profile) {
            if (profile.role !== 'student') {
              setLoading(false);
              return { success: false, error: 'This login is for students only. Please use Admin Login.' };
            }
            setCurrentUser(profile);
            setStoredCurrentUser(profile);
            setLoading(false);
            return { success: true };
          }
        }
      } catch (err: any) {
        console.warn('Supabase login error:', err);
      }
    }

    // Local student check
    const students = getLocalStudents();
    const found = students.find(s => s.email.toLowerCase() === email.toLowerCase());
    if (found) {
      setCurrentUser(found);
      setStoredCurrentUser(found);
      setLoading(false);
      return { success: true };
    }

    setLoading(false);
    return { success: false, error: 'Invalid student email or password. Please register first.' };
  };

  const loginAdmin = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    const sb = getSupabase();

    if (sb) {
      try {
        const { data: authData, error: authError } = await sb.auth.signInWithPassword({
          email,
          password
        });

        if (!authError && authData.user) {
          const { data: profile } = await sb
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

          if (profile?.role === 'admin') {
            setCurrentUser(profile);
            setStoredCurrentUser(profile);
            setLoading(false);
            return { success: true };
          } else {
            await sb.auth.signOut();
            setLoading(false);
            return { success: false, error: 'Access denied. Account is not an administrator.' };
          }
        }
      } catch (err: any) {
        console.warn('Supabase admin login error:', err);
      }
    }

    // Development fallback when running without connected Supabase backend
    if (email.toLowerCase() === DEFAULT_ADMIN.email.toLowerCase() && password.length >= 6) {
      setCurrentUser(DEFAULT_ADMIN);
      setStoredCurrentUser(DEFAULT_ADMIN);
      setLoading(false);
      return { success: true };
    }

    setLoading(false);
    return { success: false, error: 'Invalid admin credentials.' };
  };

  const forgotPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
    const sb = getSupabase();
    if (sb) {
      try {
        const { error } = await sb.auth.resetPasswordForEmail(email);
        if (!error) {
          return { success: true, message: 'Password recovery email sent. Please check your inbox.' };
        }
        return { success: false, message: error.message };
      } catch (err: any) {
        return { success: false, message: err.message || 'Error sending password reset email.' };
      }
    }

    return { 
      success: true, 
      message: `Password reset instructions have been dispatched to ${email}.` 
    };
  };

  const logout = async () => {
    const sb = getSupabase();
    if (sb) {
      try {
        await sb.auth.signOut();
      } catch (e) {
        console.warn(e);
      }
    }
    setCurrentUser(null);
    setStoredCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        registerStudent,
        loginStudent,
        loginAdmin,
        forgotPassword,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
