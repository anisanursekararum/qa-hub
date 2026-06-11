import React, { useState } from 'react';

interface ForgotPasswordFormProps {
  onSwitchToLogin: () => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onSwitchToLogin }) => {
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; code?: string; newPassword?: string; confirmPassword?: string; general?: string }>({});
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateRequest = () => {
    const newErrors: typeof errors = {};
    if (!email) {
      newErrors.email = 'Email address is required.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateReset = () => {
    const newErrors: typeof errors = {};
    if (!code) {
      newErrors.code = 'Verification code is required.';
    } else if (code.trim().length !== 6) {
      newErrors.code = 'Verification code must be 6 digits.';
    }

    if (!newPassword) {
      newErrors.newPassword = 'New password is required.';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters long.';
    }

    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateRequest()) return;

    setIsLoading(true);
    setErrors({});
    setMessage('');

    try {
      const response = await fetch('/api/auth/forgot-password/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to request verification code.');
      }

      setMessage('Verification code has been sent to your email.');
      setStep('reset');
    } catch (err: any) {
      setErrors({ general: err.message || 'An error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateReset()) return;

    setIsLoading(true);
    setErrors({});
    setMessage('');

    try {
      const response = await fetch('/api/auth/forgot-password/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password.');
      }

      alert('Password reset successfully! Please log in with your new password.');
      onSwitchToLogin();
    } catch (err: any) {
      setErrors({ general: err.message || 'An error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="text-center md:text-left mb-6">
        <h2 className="font-sans font-bold text-xl text-[#161616] dark:text-white tracking-tight">
          {step === 'request' ? 'Reset Password' : 'Verify & Reset'}
        </h2>
        <p className="font-sans text-xs text-[#757575] dark:text-[#A8A8A8] mt-1">
          {step === 'request' 
            ? 'Enter your email address to receive a verification code.'
            : 'Enter the 6-digit code sent to your email along with your new password.'
          }
        </p>
      </div>

      {errors.general && (
        <div className="p-3 mb-4 bg-[#FFF1F1] dark:bg-[#2D161A] border border-[#DA1E28] rounded-[4px] text-xs font-sans text-[#DA1E28] animate-shake">
          {errors.general}
        </div>
      )}

      {message && (
        <div className="p-3 mb-4 bg-[#DEFBE6] dark:bg-[#1A3020] border border-[#24A148] rounded-[4px] text-xs font-sans text-[#24A148]">
          {message}
        </div>
      )}

      {step === 'request' ? (
        <form onSubmit={handleRequestOtp} className="space-y-4" noValidate>
          <div>
            <label className="block font-sans text-xs font-semibold text-[#525252] dark:text-[#E0E0E0] mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full h-9 px-3 font-sans text-xs border rounded-[4px] bg-white dark:bg-[#1C1C21] text-[#161616] dark:text-white placeholder-[#A8A8A8] focus:outline-none transition-all duration-150 ${errors.email
                ? 'border-[#DA1E28] focus:border-[#DA1E28]'
                : 'border-[#CCCCCC] dark:border-[#393939] focus:border-[#0F62FE]'
                }`}
              placeholder="name@domain.com"
            />
            {errors.email && (
              <p className="font-sans text-[10px] text-[#DA1E28] mt-1">{errors.email}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="relative flex items-center justify-center w-full h-9 font-sans font-bold text-xs bg-[#0F62FE] hover:bg-[#0353E9] text-white rounded-[4px] transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
          >
            {isLoading ? (
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              'Send Reset Code'
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-4" noValidate>
          <div>
            <label className="block font-sans text-xs font-semibold text-[#525252] dark:text-[#E0E0E0] mb-1.5">
              Verification Code (OTP)
            </label>
            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className={`w-full h-9 px-3 font-mono text-center tracking-widest text-sm border rounded-[4px] bg-white dark:bg-[#1C1C21] text-[#161616] dark:text-white placeholder-[#A8A8A8] focus:outline-none transition-all duration-150 ${errors.code
                ? 'border-[#DA1E28] focus:border-[#DA1E28]'
                : 'border-[#CCCCCC] dark:border-[#393939] focus:border-[#0F62FE]'
                }`}
              placeholder="000000"
            />
            {errors.code && (
              <p className="font-sans text-[10px] text-[#DA1E28] mt-1">{errors.code}</p>
            )}
          </div>

          <div>
            <label className="block font-sans text-xs font-semibold text-[#525252] dark:text-[#E0E0E0] mb-1.5">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={`w-full h-9 px-3 font-sans text-xs border rounded-[4px] bg-white dark:bg-[#1C1C21] text-[#161616] dark:text-white placeholder-[#A8A8A8] focus:outline-none transition-all duration-150 ${errors.newPassword
                ? 'border-[#DA1E28] focus:border-[#DA1E28]'
                : 'border-[#CCCCCC] dark:border-[#393939] focus:border-[#0F62FE]'
                }`}
              placeholder="••••••••"
            />
            {errors.newPassword && (
              <p className="font-sans text-[10px] text-[#DA1E28] mt-1">{errors.newPassword}</p>
            )}
          </div>

          <div>
            <label className="block font-sans text-xs font-semibold text-[#525252] dark:text-[#E0E0E0] mb-1.5">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full h-9 px-3 font-sans text-xs border rounded-[4px] bg-white dark:bg-[#1C1C21] text-[#161616] dark:text-white placeholder-[#A8A8A8] focus:outline-none transition-all duration-150 ${errors.confirmPassword
                ? 'border-[#DA1E28] focus:border-[#DA1E28]'
                : 'border-[#CCCCCC] dark:border-[#393939] focus:border-[#0F62FE]'
                }`}
              placeholder="••••••••"
            />
            {errors.confirmPassword && (
              <p className="font-sans text-[10px] text-[#DA1E28] mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="relative flex items-center justify-center w-full h-9 font-sans font-bold text-xs bg-[#24A148] hover:bg-[#198038] text-white rounded-[4px] transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
          >
            {isLoading ? (
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              'Reset Password'
            )}
          </button>
        </form>
      )}

      <div className="text-center mt-6 pt-4 border-t border-[#E0E0E0] dark:border-[#2D2D39]">
        <button
          onClick={onSwitchToLogin}
          className="font-sans font-semibold text-xs text-[#0F62FE] hover:underline focus:outline-none"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
};
export default ForgotPasswordForm;
