import React, { useState } from 'react';
import { useLeave } from '../../context/LeaveContext';
import { APP_ASSETS, APP_META } from '../../data/mockData';

export const LoginView: React.FC = () => {
  const { login } = useLeave();
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const res = login(username, password);
    if (!res.ok) {
      setError(res.error || 'Sign-in failed. Please try again.');
      return;
    }
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-lg border border-[#e1e2ed] space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <img src={APP_ASSETS.logo} alt="Maxcare HR Logo" className="h-12 w-auto object-contain mb-1" />
          <h1 className="text-2xl font-bold text-[#004ac6] tracking-tight">{APP_META.name}</h1>
          <p className="text-xs text-[#434655] max-w-xs">
            {APP_META.company} — proactive leave management, team calendars, and approval workflows.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-[#434655] uppercase tracking-wider block mb-1.5">
              Username
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#737686] text-[18px]">
                person
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your username"
                className="w-full bg-[#faf8ff] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#191b23] font-medium border border-[#c3c6d7] focus:outline-none focus:border-[#004ac6]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#434655] uppercase tracking-wider block mb-1.5">
              Password
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#737686] text-[18px]">
                lock
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#faf8ff] rounded-xl pl-10 pr-10 py-2.5 text-xs text-[#191b23] font-medium border border-[#c3c6d7] focus:outline-none focus:border-[#004ac6]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737686] hover:text-[#191b23]"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-[#434655] select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded text-[#004ac6] focus:ring-0"
              />
              <span>Remember me</span>
            </label>
            <a
              href="#forgot"
              onClick={(e) => {
                e.preventDefault();
                alert('Password reset is managed by the Pharmacy Manager.');
              }}
              className="text-[#004ac6] hover:underline font-semibold"
            >
              Forgot password?
            </a>
          </div>

          {error && (
            <p className="text-xs font-semibold text-[#ba1a1a] flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">error</span>
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-[#004ac6] hover:bg-[#003ea8] text-white font-bold text-sm py-3 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <span>Sign In</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </form>
      </div>
    </div>
  );
};
