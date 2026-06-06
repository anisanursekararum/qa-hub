import React, { useState } from 'react';

interface RegisterFormProps {
  onSuccess: (data: any) => void;
  onSwitchToLogin: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onSwitchToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!name.trim()) {
      newErrors.name = 'Full name is required.';
    }

    if (!email) {
      newErrors.email = 'Email address is required.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters.';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
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
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(typeof data.message === 'string' ? data.message : (data.message?.[0] || 'Registration failed. Please try again.'));
      }

      onSuccess({ email: data.user.email, name: data.user.name, token: data.token });
    } catch (err: any) {
      setErrors({ general: err.message || 'Registration failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="text-center md:text-left mb-6">
        <h2 className="font-sans font-bold text-xl text-[#161616] dark:text-white tracking-tight">
          Create account
        </h2>
        <p className="font-sans text-xs text-[#757575] dark:text-[#A8A8A8] mt-1">
          Join your teammates in securing the release pipeline.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
        {errors.general && (
          <div className="p-3 bg-[#FFF1F1] dark:bg-[#2D161A] border border-[#DA1E28] rounded-[4px] text-xs font-sans text-[#DA1E28] animate-shake">
            {errors.general}
          </div>
        )}

        {/* Full Name */}
        <div>
          <label className="block font-sans text-xs font-semibold text-[#525252] dark:text-[#E0E0E0] mb-1">
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`w-full h-9 px-3 font-sans text-xs border rounded-[4px] bg-white dark:bg-[#1C1C21] text-[#161616] dark:text-white placeholder-[#A8A8A8] focus:outline-none transition-all duration-150 ${errors.name
              ? 'border-[#DA1E28] focus:border-[#DA1E28]'
              : 'border-[#CCCCCC] dark:border-[#393939] focus:border-[#0F62FE]'
              }`}
            placeholder="John Doe"
          />
          {errors.name && (
            <p className="font-sans text-[10px] text-[#DA1E28] mt-0.5">{errors.name}</p>
          )}
        </div>

        {/* Email Address */}
        <div>
          <label className="block font-sans text-xs font-semibold text-[#525252] dark:text-[#E0E0E0] mb-1">
            Email
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
            <p className="font-sans text-[10px] text-[#DA1E28] mt-0.5">{errors.email}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block font-sans text-xs font-semibold text-[#525252] dark:text-[#E0E0E0] mb-1">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full h-9 px-3 font-sans text-xs border rounded-[4px] bg-white dark:bg-[#1C1C21] text-[#161616] dark:text-white placeholder-[#A8A8A8] focus:outline-none transition-all duration-150 ${errors.password
              ? 'border-[#DA1E28] focus:border-[#DA1E28]'
              : 'border-[#CCCCCC] dark:border-[#393939] focus:border-[#0F62FE]'
              }`}
            placeholder="••••••••"
          />
          {errors.password ? (
            <p className="font-sans text-[10px] text-[#DA1E28] mt-0.5">{errors.password}</p>
          ) : (
            <p className="font-sans text-[9px] text-[#757575] dark:text-[#8D8D8D] mt-0.5">
              Must be at least 8 characters.
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block font-sans text-xs font-semibold text-[#525252] dark:text-[#E0E0E0] mb-1">
            Confirm Password
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
            <p className="font-sans text-[10px] text-[#DA1E28] mt-0.5">{errors.confirmPassword}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="relative flex items-center justify-center w-full h-9 font-sans font-bold text-xs bg-[#0F62FE] hover:bg-[#0353E9] text-white rounded-[4px] transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none mt-2"
        >
          {isLoading ? (
            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            'Initialize Operator Profile'
          )}
        </button>
      </form>

      <div className="text-center mt-6 pt-4 border-t border-[#E0E0E0] dark:border-[#2D2D39]">
        <p className="font-sans text-[11px] text-[#525252] dark:text-[#A8A8A8]">
          Already have an account?{' '}
          <button
            onClick={onSwitchToLogin}
            className="font-semibold text-[#0F62FE] hover:underline focus:outline-none"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
};
export default RegisterForm;
