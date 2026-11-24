import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Lock,
  Mail,
  Phone,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff,
  RefreshCw,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import OTPInput from '@/components/auth/OTPInput';
import NLoader from '@/components/ui/NLoader';

export default function ResetPassword() {
  const { resetPassword, verifyOTP, updatePassword } = useAuth();
  const navigate = useNavigate();

  // Steps: 'request' | 'verify' | 'new-password' | 'success'
  const [step, setStep] = useState('request');

  const [identifier, setIdentifier] = useState('');
  const [resolvedEmail, setResolvedEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [resendTimer, setResendTimer] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  // Step 1: Send recovery code
  const handleRequestCode = async (e) => {
    e.preventDefault();
    const cleanIdentifier = identifier.trim();

    if (!cleanIdentifier) {
      toast.error('Please enter your registered email or mobile number');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error, resolvedEmail: targetEmail } = await resetPassword(cleanIdentifier);

      if (error) {
        toast.error(error.message || 'Failed to send recovery code');
        return;
      }

      setResolvedEmail(targetEmail || (cleanIdentifier.includes('@') ? cleanIdentifier : ''));
      setStep('verify');
      setResendTimer(60);
      toast.success('Recovery code sent to your email');
    } catch (err) {
      toast.error('Failed to request recovery code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Verify recovery OTP
  const handleVerifyRecoveryOTP = async (tokenToVerify) => {
    const code = tokenToVerify || otp;
    if (!code || (code.length !== 8 && code.length !== 6)) {
      toast.error('Please enter the complete recovery code');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await verifyOTP({
        email: resolvedEmail,
        token: code,
        type: 'recovery',
      });

      if (error) {
        toast.error(error.message || 'Invalid or expired recovery code');
        return;
      }

      setStep('new-password');
      toast.success('Code verified! Please set your new password');
    } catch (err) {
      toast.error('Verification failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3: Set new password
  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await updatePassword(newPassword);

      if (error) {
        toast.error(error.message || 'Failed to update password');
        return;
      }

      setStep('success');
      toast.success('Password updated successfully!');
    } catch (err) {
      toast.error('Failed to update password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend recovery code
  const handleResendCode = async () => {
    if (resendTimer > 0 || isResending) return;

    setIsResending(true);
    try {
      const { error } = await resetPassword(identifier.trim());
      if (error) {
        toast.error(error.message || 'Failed to resend code');
      } else {
        setResendTimer(60);
        setOtp('');
        toast.success('New recovery code sent');
      }
    } catch (err) {
      toast.error('Failed to resend recovery code');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/25">
            <KeyRound className="w-7 h-7" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-[var(--color-text)]">
          {step === 'request' && 'Reset Vault Password'}
          {step === 'verify' && 'Enter Recovery Code'}
          {step === 'new-password' && 'Set New Password'}
          {step === 'success' && 'Password Updated!'}
        </h2>
        <p className="mt-2 text-center text-sm text-[var(--color-text-secondary)]">
          {step === 'request' && 'Enter your registered email or mobile to receive a recovery code'}
          {step === 'verify' && `We sent a recovery code to ${resolvedEmail || 'your email'}`}
          {step === 'new-password' && 'Choose a strong password with at least 8 characters'}
          {step === 'success' && 'Your account security has been updated successfully'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="card p-6 sm:p-8">
          {/* STEP 1: Request Code */}
          {step === 'request' && (
            <form onSubmit={handleRequestCode} className="space-y-5">
              <div>
                <label className="label">Registered Email or Mobile Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--color-text-muted)]">
                    {identifier.includes('@') ? <Mail className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
                  </div>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="name@example.com or 9876543210"
                    className="input-field pl-10"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full py-2.5 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <NLoader size="xs" color="currentColor" />
                    <span>Sending code...</span>
                  </>
                ) : (
                  <>
                    <span>Send Recovery Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-4 text-center border-t border-[var(--color-border)]">
                <Link
                  to="/login"
                  className="text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 inline-flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}

          {/* STEP 2: Verify Recovery Code */}
          {step === 'verify' && (
            <div className="space-y-6">
              <div className="p-4 bg-primary-50/70 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-800 rounded-xl text-center">
                <Mail className="w-8 h-8 text-primary-600 dark:text-primary-400 mx-auto mb-2" />
                <p className="text-xs font-medium text-[var(--color-text-secondary)]">
                  Enter the recovery code sent to:
                </p>
                <p className="text-sm font-bold text-[var(--color-text)] mt-1">
                  {resolvedEmail || identifier}
                </p>
                <div className="flex items-center justify-center gap-1.5 mt-2 text-xs text-amber-600 dark:text-amber-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Code expires in 10 minutes</span>
                </div>
              </div>

              <div>
                <label className="label text-center mb-3">Verification Code</label>
                <OTPInput
                  length={8}
                  value={otp}
                  onChange={setOtp}
                  onComplete={handleVerifyRecoveryOTP}
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>

              <button
                type="button"
                onClick={() => handleVerifyRecoveryOTP(otp)}
                disabled={isSubmitting || (otp.length !== 8 && otp.length !== 6)}
                className="btn-primary w-full py-2.5 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <NLoader size="xs" color="currentColor" />
                    <span>Verifying code...</span>
                  </>
                ) : (
                  <>
                    <span>Verify Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border)] text-xs text-[var(--color-text-secondary)]">
                <button
                  type="button"
                  onClick={() => setStep('request')}
                  className="inline-flex items-center gap-1 hover:text-[var(--color-text)]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Change address
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
          )}

          {/* STEP 3: Set New Password */}
          {step === 'new-password' && (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="label">New Password (Min. 8 characters)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--color-text-muted)]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-field pl-10 pr-10"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="label">Confirm New Password</label>
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

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 mt-2"
              >
                {isSubmitting ? (
                  <>
                    <NLoader size="xs" color="currentColor" />
                    <span>Saving new password...</span>
                  </>
                ) : (
                  <>
                    <span>Save New Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 4: Success Message */}
          {step === 'success' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h3 className="text-lg font-bold text-[var(--color-text)]">
                Password Successfully Reset
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)]">
                You can now log in to your vault using your new password.
              </p>
              <Link
                to="/login"
                className="btn-primary w-full py-2.5 inline-flex items-center justify-center gap-2"
              >
                <span>Continue to Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
