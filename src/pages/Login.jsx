import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Lock,
  Mail,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import NLoader from '@/components/ui/NLoader';

export default function Login() {
  const { user, loading: authLoading, signInWithIdentifierAndPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || location.state?.from || '/dashboard';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !authLoading) {
      navigate(from, { replace: true });
    }
  }, [user, authLoading, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier) {
      toast.error('Please enter your email or mobile number.');
      return;
    }
    if (!password) {
      toast.error('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await signInWithIdentifierAndPassword({
        identifier: cleanIdentifier,
        password,
        rememberMe,
      });

      if (error || !data?.user) {
        // Strict requirement: generic error so account existence is not revealed
        const genericMsg = 'Invalid credentials. Please check your login details and try again.';
        setErrorMessage(genericMsg);
        toast.error(genericMsg);
        return;
      }

      toast.success('Welcome back to MyVault!');
      navigate(from, { replace: true });
    } catch (err) {
      const genericMsg = 'Invalid credentials. Please check your login details and try again.';
      setErrorMessage(genericMsg);
      toast.error(genericMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEmailInput = identifier.includes('@');

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Icon & Heading */}
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/25">
            <Lock className="w-7 h-7" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-[var(--color-text)]">
          Sign in to MyVault
        </h2>
        <p className="mt-2 text-center text-sm text-[var(--color-text-secondary)]">
          Secure digital locker for your certificates, papers & achievements
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="card p-6 sm:p-8">
          {/* Security Notice */}
          <div className="mb-6 p-3 bg-primary-50/60 dark:bg-primary-950/30 border border-primary-200 dark:border-primary-800 rounded-lg flex items-center gap-3 text-xs text-[var(--color-text-secondary)]">
            <ShieldCheck className="w-5 h-5 text-primary-600 dark:text-primary-400 shrink-0" />
            <span>Bank-grade encryption & Supabase protected storage.</span>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-6 p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Unified Identifier Field: Email or Mobile number */}
            <div>
              <label className="label">
                Email or Mobile number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--color-text-muted)]">
                  {isEmailInput ? (
                    <Mail className="w-5 h-5" />
                  ) : (
                    <Phone className="w-5 h-5" />
                  )}
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="name@example.com or 9876543210"
                  className="input-field pl-10"
                  autoComplete="username"
                />
              </div>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                Enter your registered email address or mobile number
              </p>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-[var(--color-text-secondary)]">
                  Password
                </label>
                <Link
                  to="/reset-password"
                  className="text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--color-text-muted)]">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="••••••••"
                  className="input-field pl-10 pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-[var(--color-border)] rounded focus:ring-primary-500 bg-[var(--color-surface)]"
                />
                <span className="ml-2 text-xs text-[var(--color-text-secondary)]">
                  Remember this device
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <NLoader size="xs" color="currentColor" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="mt-6 pt-6 border-t border-[var(--color-border)] text-center">
            <p className="text-xs text-[var(--color-text-secondary)]">
              Don't have a vault yet?{' '}
              <Link
                to="/signup"
                className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 hover:underline"
              >
                Sign up free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
