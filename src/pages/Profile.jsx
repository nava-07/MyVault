import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Lock,
  HardDrive,
  Calendar,
  AlertTriangle,
  Trash2,
  KeyRound,
  ShieldAlert,
  Save,
  CheckCircle2,
  FileText,
  Eye,
  EyeOff,
} from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useDocuments } from '@/hooks/useDocuments';
import { supabase } from '@/lib/supabase';
import Modal from '@/components/ui/Modal';
import Loading from '@/components/ui/Loading';

// Helper for formatted bytes
const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// Avatar initials generator
const getInitials = (name, fallbackEmail) => {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (fallbackEmail) {
    return fallbackEmail.slice(0, 2).toUpperCase();
  }
  return 'MV';
};

// Color for avatar circle
const getAvatarGradient = (str = '') => {
  const gradients = [
    'from-blue-600 to-indigo-600',
    'from-emerald-500 to-teal-600',
    'from-purple-600 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-cyan-500 to-blue-600',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
};

export default function Profile() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, updateProfile, updatePassword, deleteAccount } = useAuth();
  const { documents } = useDocuments();

  // Profile Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password Update state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Delete Account Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Populate profile fields
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setEmail(profile.email || user?.email || '');
      setPhone(profile.phone || '');
    } else if (user) {
      setFullName(user.user_metadata?.full_name || user.user_metadata?.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || user.user_metadata?.phone || '');
    }
  }, [profile, user]);

  // Compute storage statistics
  const storageStats = useMemo(() => {
    const totalFiles = documents.length;
    const totalSizeBytes = documents.reduce((acc, curr) => acc + (Number(curr.file_size) || 0), 0);
    // Storage quota reference (e.g. 10 GB limit)
    const quotaBytes = 10 * 1024 * 1024 * 1024;
    const usedPercentage = Math.min(Math.round((totalSizeBytes / quotaBytes) * 100), 100);

    return {
      totalFiles,
      totalSizeBytes,
      formattedTotalSize: formatBytes(totalSizeBytes),
      quotaBytes,
      formattedQuota: '10.00 GB',
      usedPercentage,
    };
  }, [documents]);

  // Display Name and Initials
  const displayName = fullName || profile?.full_name || user?.user_metadata?.full_name || 'MyVault Member';
  const displayEmail = email || user?.email || '';
  const initials = getInitials(displayName, displayEmail);
  const avatarGradient = getAvatarGradient(displayEmail || displayName);

  // Member Since date
  const memberSince = useMemo(() => {
    const rawDate = profile?.created_at || user?.created_at;
    if (!rawDate) return 'Recently';
    try {
      return format(new Date(rawDate), 'MMMM yyyy');
    } catch (e) {
      return 'Recently';
    }
  }, [profile, user]);

  // Handle Save Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error('Full name is required');
      return;
    }

    try {
      setIsSavingProfile(true);

      // If email has changed, trigger Supabase auth email update
      const currentEmail = user?.email || '';
      const trimmedEmail = email.trim();
      let emailChangeRequested = false;

      if (trimmedEmail && trimmedEmail.toLowerCase() !== currentEmail.toLowerCase()) {
        const { error: emailErr } = await supabase.auth.updateUser({ email: trimmedEmail });
        if (emailErr) {
          toast.error(`Email update failed: ${emailErr.message}`);
        } else {
          emailChangeRequested = true;
          toast.success('Verification link sent to new email address!');
        }
      }

      // Update database profile
      const { error: profileErr } = await updateProfile({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
      });

      if (profileErr) {
        throw profileErr;
      }

      toast.success(
        emailChangeRequested
          ? 'Profile updated! Please check your new email to verify change.'
          : 'Profile updated successfully'
      );
    } catch (err) {
      console.error('Error saving profile:', err);
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Update Password
  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    if (!newPassword) {
      toast.error('Please enter a new password');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setIsUpdatingPassword(true);
      const { error } = await updatePassword(newPassword);

      if (error) {
        throw error;
      }

      toast.success('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Error updating password:', err);
      toast.error(err.message || 'Failed to update password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Handle Delete Account
  const handleConfirmDeleteAccount = async () => {
    if (deleteConfirmationText !== 'DELETE') {
      toast.error('Please type "DELETE" exactly to confirm account deletion.');
      return;
    }

    try {
      setIsDeletingAccount(true);
      const { error } = await deleteAccount();

      if (error) {
        throw error;
      }

      toast.success('Your account and vault data have been deleted.');
      setIsDeleteModalOpen(false);
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Error deleting account:', err);
      toast.error(err.message || 'Failed to delete account');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center py-20">
        <Loading size="lg" text="Loading profile..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="border-b border-[var(--color-border)] pb-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text)] tracking-tight">
            Account & Profile
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Manage your personal credentials, security keys, and vault storage.
          </p>
        </div>

        {/* Profile Card Header */}
        <div className="card p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          <div
            className={clsx(
              'w-24 h-24 rounded-full bg-gradient-to-tr text-white font-extrabold text-2xl flex items-center justify-center shadow-lg ring-4 ring-white dark:ring-slate-800 shrink-0 select-none',
              avatarGradient
            )}
          >
            {initials}
          </div>

          {/* User Info */}
          <div className="text-center sm:text-left flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-text)] truncate">
              {displayName}
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] mt-0.5 truncate">
              {displayEmail} {phone ? `• ${phone}` : ''}
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-[var(--color-text-muted)]">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-primary-500" />
                <span>Member since {memberSince}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-primary-500" />
                <span>{storageStats.totalFiles} documents stored</span>
              </span>
            </div>
          </div>
        </div>

        {/* Storage Usage Section */}
        <div className="card p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[var(--color-text)]">
                  Vault Storage Usage
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Estimated size of uploaded certificates, papers, and files.
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-sm font-bold text-[var(--color-text)]">
                {storageStats.formattedTotalSize}
              </span>
              <span className="text-xs text-[var(--color-text-muted)]">
                {' '}
                / {storageStats.formattedQuota}
              </span>
            </div>
          </div>

          {/* Storage Progress Bar */}
          <div className="w-full h-3 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] overflow-hidden">
            <div
              className={clsx(
                'h-full rounded-full transition-all duration-500',
                storageStats.usedPercentage > 85
                  ? 'bg-red-500'
                  : storageStats.usedPercentage > 60
                  ? 'bg-amber-500'
                  : 'bg-primary-600'
              )}
              style={{ width: `${Math.max(storageStats.usedPercentage, 2)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
            <span>{storageStats.totalFiles} active files in vault</span>
            <span>{storageStats.usedPercentage}% of storage used</span>
          </div>
        </div>

        {/* Edit Profile Form */}
        <div className="card p-6 sm:p-8 space-y-6">
          <div className="border-b border-[var(--color-border)] pb-3">
            <h3 className="text-lg font-semibold text-[var(--color-text)]">
              Personal Information
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Update your name, contact phone number, and account email.
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="sm:col-span-2">
                <label className="label">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alexander Hamilton"
                    className="input-field pl-10"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="label">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-10"
                  />
                </div>
                <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                  Note: Changing your email will send a confirmation link to verify the new address.
                </p>
              </div>

              {/* Phone Number */}
              <div>
                <label className="label">Phone Number (Optional)</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +1 555-0199"
                    className="input-field pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="btn-primary inline-flex items-center gap-2 shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingProfile ? 'Saving Changes...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="card p-6 sm:p-8 space-y-6">
          <div className="border-b border-[var(--color-border)] pb-3">
            <h3 className="text-lg font-semibold text-[var(--color-text)]">
              Change Password
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Ensure your account is protected with a strong, unique password.
            </p>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* New Password */}
              <div>
                <label className="label">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="input-field pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="label">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="input-field pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                disabled={isUpdatingPassword || !newPassword}
                className="btn-primary inline-flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                <KeyRound className="w-4 h-4" />
                <span>{isUpdatingPassword ? 'Updating Password...' : 'Update Password'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="rounded-2xl border-2 border-red-300 dark:border-red-900/60 bg-red-50/40 dark:bg-red-950/20 p-6 sm:p-8 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-700 dark:text-red-400">
                Danger Zone
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1 leading-relaxed">
                Deleting your account will permanently delete your user profile, all uploaded documents,
                files, and shared links. This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-red-200 dark:border-red-900/60 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setDeleteConfirmationText('');
                setIsDeleteModalOpen(true);
              }}
              className="btn-danger inline-flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Account</span>
            </button>
          </div>
        </div>
      </div>

      {/* DELETE ACCOUNT CONFIRMATION MODAL */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Permanently Delete Account"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300 space-y-2">
            <p className="font-semibold flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" />
              <span>Warning: This action is permanent and irreversible</span>
            </p>
            <p className="text-xs">
              All of your saved certificates, publications, reports, photos, and links will be immediately destroyed.
            </p>
          </div>

          <div>
            <label className="label text-xs">
              To proceed, please type <strong className="text-red-600 font-bold">DELETE</strong> in
              the box below:
            </label>
            <input
              type="text"
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
              placeholder="DELETE"
              className="input-field border-red-300 dark:border-red-800 focus:ring-red-500"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--color-border)]">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="btn-ghost"
              disabled={isDeletingAccount}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDeleteAccount}
              disabled={deleteConfirmationText !== 'DELETE' || isDeletingAccount}
              className="btn-danger"
            >
              {isDeletingAccount ? 'Deleting Account...' : 'Permanently Delete Account'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
