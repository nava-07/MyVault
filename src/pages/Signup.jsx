import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Lock,
  Mail,
  Phone,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  Check,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import OTPInput from '@/components/auth/OTPInput';
import NLoader from '@/components/ui/NLoader';

export default function Signup() {
  const { user, loading: authLoading, signUp, verifyOTP } = useAuth();
  const navigate = useNavigate();

  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Verification step state
  const [isVerifying, setIsVerifying] = useState(false);
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !authLoading) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Resend OTP countdown timer (60s cooldown)
  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  // Password requirement checks (min 8 chars)
  const reqMinLength = password.length >= 8;
  const reqUpper = /[A-Z]/.test(password);
  const reqLower = /[a-z]/.test(password);
  const reqNumber = /[0-9]/.test(password);
  const reqSpecial = /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\]/.test(password);

  const calculateStrength = () => {
    if (!password) return { label: '', color: '', barPercent: 0 };
    let score = 0;
    if (reqMinLength) score += 1;
    if (reqUpper) score += 1;
    if (reqLower) score += 1;
    if (reqNumber) score += 1;
    if (reqSpecial) score += 1;

    if (score <= 2) {
      return { label: 'Weak', color: 'bg-red-500', barPercent: 25 };
    }
    if (score === 3) {
      return { label: 'Fair', color: 'bg-orange-500', barPercent: 50 };
    }
    if (score === 4) {
      return { label: 'Good', color: 'bg-amber-500', barPercent: 75 };
    }
    return { label: 'Strong', color: 'bg-green-500', barPercent: 100 };
  };

  const strength = calculateStrength();

  // Helper validations
  const isValidEmail = (str) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str.trim());
  const isValidPhone = (str) => str.replace(/\D/g, '').length === 10;

  // Handle Signup Submission
  const handleSignupSubmit = async (e) => {
    e.preventDefault();

    if (!fullName.trim() || fullName.trim().length < 2) {
      toast.error('Please enter your full name (at least 2 characters)');
      return;
    }
    if (!email.trim() || !isValidEmail(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (!phone.trim() || !isValidPhone(phone)) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (!agreeTerms) {
      toast.error('Please accept the Terms of Service to continue');
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedPhone = phone.startsWith('+') ? phone.trim() : `+91${phone.replace(/\D/g, '')}`;

      const { data, error } = await signUp({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: formattedPhone,
        password,
      });

      if (error) {
        if (error.message.includes('unique') || error.message.includes('already registered')) {
          toast.error('An account with this email or mobile number already exists');
        } else {
          toast.error(error.message || 'Failed to create account');
        }
        return;
      }

      // Switch to verification screen
      setIsVerifying(true);
      setResendTimer(60);
      toast.success('Verification code sent to your email!');
    } catch (err) {
      toast.error(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle OTP Verification
  const handleVerifyOTP = async (tokenToVerify) => {
    const code = tokenToVerify || otp;
    if (!code || (code.length !== 8 && code.length !== 6)) {
      toast.error('Please enter the complete verification code');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await verifyOTP({
        email: email.trim().toLowerCase(),
        token: code,
        type: 'signup',
      });

      if (error) {
        toast.error(error.message || 'Invalid or expired verification code');
        return;
      }

      toast.success('Account verified! Welcome to MyVault');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Verification failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend OTP Code
  const handleResendCode = async () => {
    if (resendTimer > 0 || isResending) return;

    setIsResending(true);
    try {
      const formattedPhone = phone.startsWith('+') ? phone.trim() : `+91${phone.replace(/\D/g, '')}`;
      const { error } = await signUp({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: formattedPhone,
        password,
      });

      if (error) {
        toast.error(error.message || 'Failed to resend code');
      } else {
        setResendTimer(60);
        setOtp('');
        toast.success('A new verification code has been sent to your email');
      }
    } catch (err) {
      toast.error('Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/25">
            <Lock className="w-7 h-7" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-[var(--color-text)]">
          {isVerifying ? 'Verify Your Email' : 'Create Your Vault'}
        </h2>
        <p className="mt-2 text-center text-sm text-[var(--color-text-secondary)]">
          {isVerifying
            ? `Enter the verification code sent to ${email}`
            : 'Securely store certificates, papers, reports & achievement photos'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="card p-6 sm:p-8">
          {isVerifying ? (
            /* ================================================================ */
            /* VERIFICATION SCREEN (Verification OTP code)                      */
            /* ================================================================ */
            <div className="space-y-6">
              <div className="p-4 bg-primary-50/70 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-800 rounded-xl text-center">
                <Mail className="w-8 h-8 text-primary-600 dark:text-primary-400 mx-auto mb-2" />
                <p className="text-xs font-medium text-[var(--color-text-secondary)]">
                  We've sent a verification code to:
                </p>
                <p className="text-sm font-bold text-[var(--color-text)] mt-1">{email}</p>
                <div className="flex items-center justify-center gap-1.5 mt-2 text-xs text-amber-600 dark:text-amber-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Code expires in 10 minutes</span>
                </div>
              </div>

              {/* OTP Input Component */}
              <div>
                <label className="label text-center mb-3">
                  Enter Verification Code
                </label>
                <OTPInput
                  length={8}
                  value={otp}
                  onChange={setOtp}
                  onComplete={handleVerifyOTP}
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>

              {/* Verify Button */}
              <button
                type="button"
                onClick={() => handleVerifyOTP(otp)}
                disabled={isSubmitting || (otp.length !== 8 && otp.length !== 6)}
                className="btn-primary w-full py-2.5 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <NLoader size="xs" color="currentColor" />
                    <span>Activating vault...</span>
                  </>
                ) : (
                  <>
                    <span>Verify & Activate Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Resend Code Section */}
              <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border)] text-xs text-[var(--color-text-secondary)]">
                <button
                  type="button"
                  onClick={() => setIsVerifying(false)}
                  className="inline-flex items-center gap-1 hover:text-[var(--color-text)] transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Edit details
                </button>

                {resendTimer > 0 ? (
                  <span className="text-[var(--color-text-muted)] font-mono">
                    Resend code in {resendTimer}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={isResending}
                    className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 hover:underline inline-flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${isResending ? 'animate-spin' : ''}`} />
                    Resend code
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* ================================================================ */
            /* SIGNUP FORM (Full Name, Email, Mobile, Password, Confirm)         */
            /* ================================================================ */
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="label">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--color-text-muted)]">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                    className="input-field pl-10"
                    autoComplete="name"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="label">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--color-text-muted)]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@example.com"
                    className="input-field pl-10"
                    autoComplete="email"
                  />
                </div>
                <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
                  A verification code will be sent to this email
                </p>
              </div>

              {/* Mobile Number */}
              <div>
                <label className="label">Mobile Number</label>
                <div className="relative flex rounded-lg">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] text-sm font-medium">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="9876543210"
                    className="input-field rounded-l-none"
                    autoComplete="tel"
                  />
                </div>
                <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
                  Used for mobile login with your password
                </p>
              </div>

              {/* Password */}
              <div>
                <label className="label">Password (Min. 8 characters)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--color-text-muted)]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-field pl-10 pr-10"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Meter */}
                {password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-[var(--color-text-secondary)]">Strength:</span>
                      <span className="font-semibold text-[var(--color-text)]">{strength.label}</span>
                    </div>
                    <div className="w-full bg-[var(--color-border)] h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${strength.color} transition-all duration-300`}
                        style={{ width: `${strength.barPercent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="label">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--color-text-muted)]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-field pl-10 pr-10"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="pt-1">
                <label className="flex items-start cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-primary-600 border-[var(--color-border)] rounded focus:ring-primary-500 bg-[var(--color-surface)]"
                  />
                  <span className="ml-2 text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    I agree to the{' '}
                    <span className="text-primary-600 hover:underline">Terms of Service</span> and{' '}
                    <span className="text-primary-600 hover:underline">Privacy Policy</span>.
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 mt-2"
              >
                {isSubmitting ? (
                  <>
                    <NLoader size="xs" color="currentColor" />
                    <span>Sending verification code...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account & Verify</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer Navigation */}
          {!isVerifying && (
            <div className="mt-6 pt-6 border-t border-[var(--color-border)] text-center">
              <p className="text-xs text-[var(--color-text-secondary)]">
                Already have a vault?{' '}
                <Link
                  to="/login"
                  className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
