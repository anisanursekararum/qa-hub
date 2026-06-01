import React, { useState } from 'react';

interface LoginFormProps {
  onSuccess: (data: any) => void;
  onSwitchToRegister: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!email) {
      newErrors.email = 'Email address is required.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(typeof data.message === 'string' ? data.message : (data.message?.[0] || 'Login failed. Please check your credentials.'));
      }

      onSuccess({ email: data.user.email, name: data.user.name, token: data.token });
    } catch (err: any) {
      setErrors({ general: err.message || 'Login failed. Please check your credentials.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="text-center md:text-left mb-6">
        <h2 className="font-sans font-bold text-xl text-[#161616] dark:text-white tracking-tight">
          Welcome back
        </h2>
        <p className="font-sans text-xs text-[#757575] dark:text-[#A8A8A8] mt-1">
          Access your centralized QA mission control panel.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {errors.general && (
          <div className="p-3 bg-[#FFF1F1] dark:bg-[#2D161A] border border-[#DA1E28] rounded-[4px] text-xs font-sans text-[#DA1E28] animate-shake">
            {errors.general}
          </div>
        )}

        {/* Email Field */}
        <div>
          <label className="block font-sans text-xs font-semibold text-[#525252] dark:text-[#E0E0E0] mb-1.5">
            Work Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full h-9 px-3 font-sans text-xs border rounded-[4px] bg-white dark:bg-[#1C1C21] text-[#161616] dark:text-white placeholder-[#A8A8A8] focus:outline-none transition-all duration-150 ${
              errors.email
                ? 'border-[#DA1E28] focus:border-[#DA1E28]'
                : 'border-[#CCCCCC] dark:border-[#393939] focus:border-[#0F62FE]'
            }`}
            placeholder="name@company.com"
          />
          {errors.email && (
            <p className="font-sans text-[10px] text-[#DA1E28] mt-1">{errors.email}</p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="font-sans text-xs font-semibold text-[#525252] dark:text-[#E0E0E0]">
              Password
            </label>
            <a
              href="/forgot-password"
              className="font-sans text-[10px] text-[#0F62FE] hover:underline"
            >
              Forgot?
            </a>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full h-9 pl-3 pr-10 font-sans text-xs border rounded-[4px] bg-white dark:bg-[#1C1C21] text-[#161616] dark:text-white placeholder-[#A8A8A8] focus:outline-none transition-all duration-150 ${
                errors.password
                  ? 'border-[#DA1E28] focus:border-[#DA1E28]'
                  : 'border-[#CCCCCC] dark:border-[#393939] focus:border-[#0F62FE]'
              }`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-[#757575] dark:text-[#A8A8A8] hover:text-[#161616] dark:hover:text-white focus:outline-none"
            >
              {showPassword ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          {errors.password && (
            <p className="font-sans text-[10px] text-[#DA1E28] mt-1">{errors.password}</p>
          )}
        </div>

        {/* Remember Me Checkbox */}
        <div className="flex items-center">
          <input
            id="remember-me"
            type="checkbox"
            className="w-3.5 h-3.5 border border-[#CCCCCC] dark:border-[#393939] rounded-[2px] bg-white dark:bg-[#1C1C21] text-[#0F62FE] focus:ring-offset-0 focus:ring-[#0F62FE]"
          />
          <label htmlFor="remember-me" className="ml-2 font-sans text-[11px] text-[#525252] dark:text-[#A8A8A8]">
            Stay signed in on this device
          </label>
        </div>

        {/* Action Button */}
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
            'Access Control Center'
          )}
        </button>
      </form>

      <div className="text-center mt-6 pt-4 border-t border-[#E0E0E0] dark:border-[#2D2D39]">
        <p className="font-sans text-[11px] text-[#525252] dark:text-[#A8A8A8]">
          New to QA-Hub?{' '}
          <button
            onClick={onSwitchToRegister}
            className="font-semibold text-[#0F62FE] hover:underline focus:outline-none"
          >
            Create an Account
          </button>
        </p>
      </div>
    </div>
  );
};
export default LoginForm;
