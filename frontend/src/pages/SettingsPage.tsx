import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Bell, Palette, Globe, Save, Monitor } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { authApi } from '../api/auth';
import { useProject } from '../context/ProjectContext';

const SettingsPage = () => {
  const { activeProject } = useProject();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'security' | 'admin' | 'notifications' | 'preferences'>('security');

  // Security Form State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [isInvalidating, setIsInvalidating] = useState(false);

  // Admin Controls State (Local/Mock for now)
  const [joinCodeLimit, setJoinCodeLimit] = useState('3');
  const [lockoutPeriod, setLockoutPeriod] = useState('1'); // hours
  const [isAdminSaved, setIsAdminSaved] = useState(false);

  // Preferences State
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'system');
  const [landingPage, setLandingPage] = useState(localStorage.getItem('landingPage') || '/projects');
  const [isPrefSaved, setIsPrefSaved] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    setIsSubmittingPassword(true);
    try {
      await authApi.changePassword(oldPassword, newPassword);
      setPasswordSuccess('Password successfully updated. Logging out from all sessions...');
      setTimeout(() => {
        handleLogout();
      }, 1500);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password.');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const handleInvalidateSessions = async () => {
    if (!window.confirm('Are you sure you want to log out of all devices? You will be logged out immediately.')) return;
    setIsInvalidating(true);
    try {
      await authApi.invalidateSessions();
      alert('All sessions invalidated. You will now be logged out.');
      handleLogout();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsInvalidating(false);
    }
  };

  const handlePreferencesSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('theme', theme);
    localStorage.setItem('landingPage', landingPage);

    // Apply theme (if system theme logic exists in index.html/App.tsx, it would pick this up)
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // system logic
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }

    setIsPrefSaved(true);
    setTimeout(() => setIsPrefSaved(false), 3000);
  };

  if (!user) return null;

  return (
    <DashboardLayout user={user} onLogout={handleLogout} currentPath="/settings" hideProjectSwitcher={true}>
      <div className="p-6 sm:p-8 max-w-5xl mx-auto min-h-full pb-32">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="mb-8">
            <h1 className="font-sans font-black text-3xl text-[#161616] dark:text-white tracking-tight mb-2">Settings</h1>
            <p className="font-sans text-sm text-[#525252] dark:text-[#A8A8A8]">
              Manage your profile, security, and workspace preferences.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar Navigation */}
            <div className="w-full md:w-64 flex-shrink-0 space-y-1">
              <button
                onClick={() => setActiveTab('security')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-[4px] font-sans text-sm font-semibold transition-colors ${activeTab === 'security' ? 'bg-[#E0E0E0] dark:bg-[#393939] text-[#161616] dark:text-white' : 'text-[#525252] dark:text-[#A8A8A8] hover:bg-[#F4F4F4] dark:hover:bg-[#2D2D39]'}`}
              >
                <Shield size={18} />
                <span>Security & Profile</span>
              </button>



              <button
                onClick={() => setActiveTab('notifications')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-[4px] font-sans text-sm font-semibold transition-colors ${activeTab === 'notifications' ? 'bg-[#E0E0E0] dark:bg-[#393939] text-[#161616] dark:text-white' : 'text-[#525252] dark:text-[#A8A8A8] hover:bg-[#F4F4F4] dark:hover:bg-[#2D2D39]'}`}
              >
                <Bell size={18} />
                <span>Notifications</span>
              </button>

              <button
                onClick={() => setActiveTab('preferences')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-[4px] font-sans text-sm font-semibold transition-colors ${activeTab === 'preferences' ? 'bg-[#E0E0E0] dark:bg-[#393939] text-[#161616] dark:text-white' : 'text-[#525252] dark:text-[#A8A8A8] hover:bg-[#F4F4F4] dark:hover:bg-[#2D2D39]'}`}
              >
                <Monitor size={18} />
                <span>Preferences</span>
              </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 bg-white dark:bg-[#1C1C21] border border-[#E0E0E0] dark:border-[#393939] rounded-[4px] shadow-sm overflow-hidden">

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
                  <h2 className="font-sans font-bold text-xl text-[#161616] dark:text-white mb-6 flex items-center border-b border-[#E0E0E0] dark:border-[#393939] pb-4">
                    <Shield className="mr-3 text-[#0F62FE]" size={20} /> Security & Profile Management
                  </h2>

                  <div className="mb-8">
                    <h3 className="font-sans font-bold text-sm text-[#525252] dark:text-[#A8A8A8] uppercase tracking-wider mb-4">Change Password</h3>
                    <form onSubmit={handlePasswordChange} className="max-w-md space-y-4">
                      {passwordError && (
                        <div className="bg-[#DA1E28]/10 text-[#DA1E28] p-3 rounded-[4px] font-sans text-sm font-semibold border border-[#DA1E28]/20">
                          {passwordError}
                        </div>
                      )}
                      {passwordSuccess && (
                        <div className="bg-[#24A148]/10 text-[#24A148] p-3 rounded-[4px] font-sans text-sm font-semibold border border-[#24A148]/20">
                          {passwordSuccess}
                        </div>
                      )}

                      <div>
                        <label className="block font-sans text-sm font-semibold text-[#161616] dark:text-white mb-1.5">Current Password</label>
                        <input
                          type="password"
                          required
                          value={oldPassword}
                          onChange={e => setOldPassword(e.target.value)}
                          className="w-full bg-[#F4F4F4] dark:bg-[#121212] border border-[#CCCCCC] dark:border-[#393939] rounded-[4px] px-3 py-2 font-sans text-sm text-[#161616] dark:text-white focus:outline-none focus:border-[#0F62FE]"
                        />
                      </div>

                      <div>
                        <label className="block font-sans text-sm font-semibold text-[#161616] dark:text-white mb-1.5">New Password</label>
                        <input
                          type="password"
                          required
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          className="w-full bg-[#F4F4F4] dark:bg-[#121212] border border-[#CCCCCC] dark:border-[#393939] rounded-[4px] px-3 py-2 font-sans text-sm text-[#161616] dark:text-white focus:outline-none focus:border-[#0F62FE]"
                        />
                      </div>

                      <div>
                        <label className="block font-sans text-sm font-semibold text-[#161616] dark:text-white mb-1.5">Confirm New Password</label>
                        <input
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          className="w-full bg-[#F4F4F4] dark:bg-[#121212] border border-[#CCCCCC] dark:border-[#393939] rounded-[4px] px-3 py-2 font-sans text-sm text-[#161616] dark:text-white focus:outline-none focus:border-[#0F62FE]"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingPassword}
                        className="mt-2 bg-[#0F62FE] hover:bg-[#0353E9] text-white font-sans font-semibold text-sm px-6 py-2.5 rounded-[4px] transition-colors shadow-sm flex items-center space-x-2 disabled:opacity-50"
                      >
                        <Save size={16} />
                        <span>{isSubmittingPassword ? 'Saving...' : 'Update Password'}</span>
                      </button>
                    </form>
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-[#E0E0E0] dark:border-[#393939]">
                    <h3 className="font-sans font-bold text-sm text-[#525252] dark:text-[#A8A8A8] uppercase tracking-wider mb-4">Session Management</h3>
                    <p className="font-sans text-sm text-[#525252] dark:text-[#A8A8A8] mb-4">
                      Log out of all active sessions across all devices. This will invalidate all your current access tokens.
                    </p>
                    <button
                      type="button"
                      onClick={handleInvalidateSessions}
                      disabled={isInvalidating}
                      className="bg-[#DA1E28] hover:bg-[#b0171e] text-white font-sans font-semibold text-sm px-6 py-2.5 rounded-[4px] transition-colors shadow-sm disabled:opacity-50"
                    >
                      {isInvalidating ? 'Invalidating...' : 'Log out of all devices'}
                    </button>
                  </div>
                </div>
              )}



              {/* Notifications Tab Placeholder */}
              {activeTab === 'notifications' && (
                <div className="p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
                  <h2 className="font-sans font-bold text-xl text-[#161616] dark:text-white mb-6 flex items-center border-b border-[#E0E0E0] dark:border-[#393939] pb-4">
                    <Bell className="mr-3 text-[#F1C21B]" size={20} /> Notifications
                  </h2>

                  <div className="flex flex-col items-center justify-center text-center py-16 px-4 border-2 border-dashed border-[#E0E0E0] dark:border-[#393939] rounded-[8px] bg-[#F4F4F4]/50 dark:bg-[#121212]/50">
                    <div className="w-16 h-16 bg-white dark:bg-[#1C1C21] rounded-full flex items-center justify-center mb-6 shadow-sm border border-[#E0E0E0] dark:border-[#2D2D39]">
                      <Globe size={32} className="text-[#A8A8A8]" />
                    </div>
                    <h3 className="font-sans font-black text-2xl text-[#161616] dark:text-white mb-3">Coming Soon</h3>
                    <p className="font-sans text-sm text-[#525252] dark:text-[#A8A8A8] max-w-md mx-auto mb-6">
                      Phase 2 will introduce comprehensive notification routing. You will be able to configure alerts for Google Chat, Slack, and Email based on specific execution triggers.
                    </p>
                    <div className="flex space-x-3">
                      <span className="px-3 py-1 bg-[#E0E0E0] dark:bg-[#2D2D39] rounded-full font-mono text-xs text-[#525252] dark:text-[#A8A8A8]">Google Chat</span>
                      <span className="px-3 py-1 bg-[#E0E0E0] dark:bg-[#2D2D39] rounded-full font-mono text-xs text-[#525252] dark:text-[#A8A8A8]">Email</span>
                      <span className="px-3 py-1 bg-[#E0E0E0] dark:bg-[#2D2D39] rounded-full font-mono text-xs text-[#525252] dark:text-[#A8A8A8]">Webhooks</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Preferences Tab */}
              {activeTab === 'preferences' && (
                <div className="p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
                  <h2 className="font-sans font-bold text-xl text-[#161616] dark:text-white mb-6 flex items-center border-b border-[#E0E0E0] dark:border-[#393939] pb-4">
                    <Monitor className="mr-3 text-[#0F62FE]" size={20} /> Workspace Preferences
                  </h2>

                  <form onSubmit={handlePreferencesSave} className="max-w-xl space-y-6">
                    <div>
                      <label className="block font-sans text-sm font-semibold text-[#161616] dark:text-white mb-1.5 flex items-center">
                        <Palette size={16} className="mr-2 text-[#525252] dark:text-[#A8A8A8]" /> Interface Theme
                      </label>
                      <select
                        value={theme}
                        onChange={e => setTheme(e.target.value)}
                        className="w-full bg-[#F4F4F4] dark:bg-[#121212] border border-[#CCCCCC] dark:border-[#393939] rounded-[4px] px-3 py-2 font-sans text-sm text-[#161616] dark:text-white focus:outline-none focus:border-[#0F62FE]"
                      >
                        <option value="system">System Default</option>
                        <option value="light">Light Mode</option>
                        <option value="dark">Dark Mode (Obsidian Control)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-sans text-sm font-semibold text-[#161616] dark:text-white mb-1.5 flex items-center">
                        <Monitor size={16} className="mr-2 text-[#525252] dark:text-[#A8A8A8]" /> Default Landing Page
                      </label>
                      <select
                        value={landingPage}
                        onChange={e => setLandingPage(e.target.value)}
                        className="w-full bg-[#F4F4F4] dark:bg-[#121212] border border-[#CCCCCC] dark:border-[#393939] rounded-[4px] px-3 py-2 font-sans text-sm text-[#161616] dark:text-white focus:outline-none focus:border-[#0F62FE]"
                      >
                        <option value="/projects">Workspace Selection</option>
                        <option value="/repository">Test Repository</option>
                        <option value="/runs">Test Runs (Active Cycles)</option>
                      </select>
                    </div>

                    <div className="flex items-center space-x-4 border-t border-[#E0E0E0] dark:border-[#393939] pt-6">
                      <button
                        type="submit"
                        className="bg-[#0F62FE] hover:bg-[#0353E9] text-white font-sans font-semibold text-sm px-6 py-2.5 rounded-[4px] transition-colors shadow-sm flex items-center space-x-2"
                      >
                        <Save size={16} />
                        <span>Save Preferences</span>
                      </button>
                      {isPrefSaved && <span className="font-mono text-sm text-[#24A148] flex items-center animate-in fade-in"><CheckCircle2 size={16} className="mr-1" /> Preferences Applied</span>}
                    </div>
                  </form>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

// Quick import for CheckCircle2 missing from lucide-react import
import { CheckCircle2 } from 'lucide-react';
export default SettingsPage;
