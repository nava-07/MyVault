import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { BUCKET_NAME } from '@/lib/storage';

export const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  signUp: async () => ({}),
  signInWithIdentifierAndPassword: async () => ({}),
  verifyOTP: async () => ({}),
  signOut: async () => ({}),
  resetPassword: async () => ({}),
  updatePassword: async () => ({}),
  updateProfile: async () => ({}),
  deleteAccount: async () => ({}),
  refreshProfile: async () => null,
  resolveIdentifierToEmail: async () => null,
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to seed default categories for a new user if none exist
  const seedDefaultCategories = async (userId) => {
    if (!userId) return;
    try {
      const { count, error } = await supabase
        .from('categories')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error || (count !== null && count > 0)) {
        return;
      }

      const defaultCats = [
        { user_id: userId, name: 'Certificates', is_default: true, icon: 'Award' },
        { user_id: userId, name: 'Published Papers', is_default: true, icon: 'BookOpen' },
        { user_id: userId, name: 'Reports', is_default: true, icon: 'FileText' },
        { user_id: userId, name: 'Achievement Photos', is_default: true, icon: 'Image' },
        { user_id: userId, name: 'Other', is_default: true, icon: 'FolderOpen' },
      ];

      await supabase.from('categories').insert(defaultCats);
    } catch (e) {
      console.warn('Error seeding default categories:', e);
    }
  };

  // Helper to fetch profile for user
  const fetchProfile = useCallback(async (userId) => {
    if (!userId) return null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          if (currentUser && currentUser.id === userId) {
            const fallbackProfile = {
              id: currentUser.id,
              email: currentUser.email || '',
              full_name: currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || 'User',
              phone: currentUser.user_metadata?.phone || currentUser.phone || '',
              avatar_url: currentUser.user_metadata?.avatar_url || null,
            };

            const { data: created, error: createError } = await supabase
              .from('profiles')
              .upsert(fallbackProfile)
              .select()
              .single();

            if (!createError && created) {
              await seedDefaultCategories(userId);
              return created;
            }
          }
        }
        console.warn('Could not fetch profile:', error.message);
        return null;
      }

      seedDefaultCategories(userId);
      return data;
    } catch (err) {
      console.error('Error fetching profile:', err);
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      const prof = await fetchProfile(user.id);
      setProfile(prof);
      return prof;
    }
    return null;
  }, [user, fetchProfile]);

  // Listen to auth state changes
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (mounted) {
          const currentUser = session?.user ?? null;
          setUser(currentUser);
          if (currentUser) {
            const prof = await fetchProfile(currentUser.id);
            if (mounted) setProfile(prof);
          } else {
            setProfile(null);
          }
        }
      } catch (err) {
        console.error('Error getting initial session:', err);
        if (mounted) {
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          const prof = await fetchProfile(currentUser.id);
          if (mounted) setProfile(prof);
        } else {
          if (mounted) setProfile(null);
        }

        if (mounted) setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [fetchProfile]);

  /**
   * Helper: Resolves an Email OR Mobile Number to its matching email address.
   * If identifier has '@', returns it directly.
   * If it is a phone number, attempts multiple normalized formats with the secure server function `get_email_by_phone`.
   */
  const resolveIdentifierToEmail = async (identifier) => {
    const trimmed = (identifier || '').trim();
    if (!trimmed) return null;

    if (trimmed.includes('@')) {
      return trimmed.toLowerCase();
    }

    const cleanWithPlus = trimmed.replace(/[\s\-\(\)]/g, '');
    const cleanDigits = trimmed.replace(/\D/g, '');

    // Candidates to test against the server RPC
    const candidates = [
      cleanWithPlus,
      cleanDigits,
      cleanDigits.length >= 10 ? cleanDigits.slice(-10) : null,
      cleanDigits.length >= 10 ? `+91${cleanDigits.slice(-10)}` : null,
    ].filter(Boolean);

    const uniqueCandidates = [...new Set(candidates)];

    for (const phoneCandidate of uniqueCandidates) {
      try {
        // Try with phone_input
        let { data: resolvedEmail, error } = await supabase.rpc('get_email_by_phone', {
          phone_input: phoneCandidate,
        });

        // Fallback: try with p_phone if database expects p_phone
        if (error || !resolvedEmail) {
          const res = await supabase.rpc('get_email_by_phone', {
            p_phone: phoneCandidate,
          });
          if (!res.error && res.data) {
            resolvedEmail = res.data;
            error = null;
          }
        }

        if (!error && resolvedEmail && typeof resolvedEmail === 'string' && resolvedEmail.includes('@')) {
          return resolvedEmail.trim().toLowerCase();
        }
      } catch (err) {
        // Continue to next candidate
      }
    }

    return null;
  };

  /**
   * SIGN UP (Email verification required ONLY here):
   * Form fields: full name, email, mobile number, password, confirm password.
   * Sends 6-digit code to email via Brevo SMTP.
   * Account activates only after code verification.
   */
  const signUp = async ({ email, password, phone, fullName }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: phone ? phone.trim() : '',
          },
        },
      });

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  /**
   * LOGIN (NO email code, NO OTP):
   * One field: "Email or Mobile number" + password.
   * Supports:
   * 1. Direct Email + Password
   * 2. Mobile Number + Password (resolves phone -> email via RPC, then signs in)
   * 3. Native Phone + Password (as fallback if direct phone auth is active in Supabase)
   * Uses generic error ("Invalid credentials") so account existence is not revealed.
   */
  const signInWithIdentifierAndPassword = async ({ identifier, password, rememberMe = true }) => {
    try {
      const trimmed = (identifier || '').trim();
      const isEmail = trimmed.includes('@');

      // 1. Direct Email login
      if (isEmail) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: trimmed.toLowerCase(),
          password,
        });

        if (error) {
          return { data: null, error: new Error('Invalid credentials') };
        }

        if (data?.user) {
          const prof = await fetchProfile(data.user.id);
          setProfile(prof);
        }

        return { data, error: null };
      }

      // 2. Mobile Number Login: Resolve phone to email first
      const targetEmail = await resolveIdentifierToEmail(trimmed);

      if (targetEmail) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: targetEmail,
          password,
        });

        if (!error && data?.user) {
          const prof = await fetchProfile(data.user.id);
          setProfile(prof);
          return { data, error: null };
        }
      }

      // 3. Fallback: Try Supabase native phone login if phone auth is enabled on project
      const cleanDigits = trimmed.replace(/\D/g, '');
      const cleanWithPlus = trimmed.replace(/[\s\-\(\)]/g, '');
      const phoneCandidates = [
        cleanWithPlus,
        cleanDigits.length >= 10 ? `+91${cleanDigits.slice(-10)}` : null,
        cleanDigits,
      ].filter(Boolean);

      for (const phoneCandidate of [...new Set(phoneCandidates)]) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            phone: phoneCandidate,
            password,
          });

          if (!error && data?.user) {
            const prof = await fetchProfile(data.user.id);
            setProfile(prof);
            return { data, error: null };
          }
        } catch {
          // Continue loop
        }
      }

      return { data: null, error: new Error('Invalid credentials') };
    } catch (error) {
      return { data: null, error: new Error('Invalid credentials') };
    }
  };

  /**
   * Verifies 6-digit OTP code (used for Sign Up confirmation or Password Recovery).
   */
  const verifyOTP = async ({ email, token, type = 'signup' }) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: token.trim(),
        type, // 'signup' or 'recovery'
      });

      if (error) {
        return { data: null, error };
      }

      if (data?.user) {
        setUser(data.user);
        const prof = await fetchProfile(data.user.id);
        setProfile(prof);
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  /**
   * FORGOT PASSWORD:
   * Sends 6-digit recovery code to email.
   * Supports email or phone number as identifier.
   */
  const resetPassword = async (identifier) => {
    try {
      const targetEmail = await resolveIdentifierToEmail(identifier);
      if (!targetEmail) {
        // Return success message even if not found to prevent user enumeration
        return { data: { message: 'If an account exists, a recovery code was sent.' }, error: null, resolvedEmail: null };
      }

      const { data, error } = await supabase.auth.resetPasswordForEmail(targetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      return { data, error, resolvedEmail: targetEmail };
    } catch (error) {
      return { data: null, error };
    }
  };

  /**
   * Sets new password for user after recovery OTP verification.
   */
  const updatePassword = async (newPassword) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  };

  /**
   * Signs out user.
   */
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      return { error: error || null };
    } catch (error) {
      setUser(null);
      setProfile(null);
      return { error };
    }
  };

  /**
   * Updates profile metadata in profiles table.
   */
  const updateProfile = async (updates) => {
    try {
      if (!user) {
        return { data: null, error: new Error('User is not authenticated') };
      }

      const { full_name, phone, avatar_url } = updates;
      const profileUpdates = {
        id: user.id,
        ...(full_name !== undefined && { full_name }),
        ...(phone !== undefined && { phone }),
        ...(avatar_url !== undefined && { avatar_url }),
      };

      const { data, error } = await supabase
        .from('profiles')
        .upsert(profileUpdates)
        .select()
        .single();

      if (error) {
        return { data: null, error };
      }

      setProfile(data);

      if (full_name !== undefined || phone !== undefined) {
        await supabase.auth.updateUser({
          data: {
            ...(full_name !== undefined && { full_name }),
            ...(phone !== undefined && { phone }),
          },
        });
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  /**
   * Deletes account:
   * 1. Deletes all files in Supabase Storage belonging to this user
   * 2. Deletes user row from profiles (cascades database rows)
   * 3. Signs out
   */
  const deleteAccount = async () => {
    try {
      if (!user) {
        return { error: new Error('User is not authenticated') };
      }

      // Step 1: Delete all files from Supabase Storage 'myvault-files'
      try {
        const { data: userFiles } = await supabase.storage.from(BUCKET_NAME).list(user.id);
        if (userFiles && userFiles.length > 0) {
          const filePaths = userFiles.map((f) => `${user.id}/${f.name}`);
          await supabase.storage.from(BUCKET_NAME).remove(filePaths);
        }
      } catch (storageErr) {
        console.warn('Storage cleanup warning during account deletion:', storageErr);
      }

      // Step 2: Delete profile row (cascades documents and categories in PostgreSQL)
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (profileError) {
        console.error('Error deleting profile:', profileError);
        return { error: profileError };
      }

      // Step 3: Sign out
      await signOut();
      return { error: null };
    } catch (error) {
      console.error('Error deleting account:', error);
      return { error };
    }
  };

  const value = {
    user,
    profile,
    loading,
    signUp,
    signInWithIdentifierAndPassword,
    signIn: signInWithIdentifierAndPassword, // alias for convenience
    verifyOTP,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    deleteAccount,
    refreshProfile,
    resolveIdentifierToEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider;
