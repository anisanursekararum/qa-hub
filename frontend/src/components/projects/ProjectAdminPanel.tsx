import React, { useState } from 'react';
import { Key, Shield, Trash2, UserPlus, Plus } from 'lucide-react';
import { ConfirmDialog } from '../shared/ConfirmDialog';

import { generateJoinCode, getProjectInvitations, ProjectInvitation, updateProjectMemberRole, removeProjectMember } from '../../api/projects';

interface Member {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN_PROJECT' | 'MEMBER';
}

interface ProjectAdminPanelProps {
  members: Member[];
  projectId: string;
  onMembersChange?: () => void;
}

export const ProjectAdminPanel: React.FC<ProjectAdminPanelProps> = ({ members, projectId, onMembersChange }) => {
  const [targetEmail, setTargetEmail] = useState('');
  const [joinCodes, setJoinCodes] = useState<ProjectInvitation[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingCodes, setIsLoadingCodes] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());

  const [joinCodeLimit, setJoinCodeLimit] = useState('5');
  const [lockoutPeriod, setLockoutPeriod] = useState('24');
  const [isAdminSaved, setIsAdminSaved] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isDestructive: boolean;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', isDestructive: false, onConfirm: () => { } });

  const fetchCodes = async (currentPage: number) => {
    try {
      setIsLoadingCodes(true);
      const res = await getProjectInvitations(projectId, currentPage, 5);
      setJoinCodes(res.data);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingCodes(false);
    }
  };

  React.useEffect(() => {
    fetchCodes(page);
  }, [projectId, page]);

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleGenerateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmail) return;
    try {
      await generateJoinCode(projectId, targetEmail);
      setTargetEmail('');
      if (page === 1) {
        await fetchCodes(1);
      } else {
        setPage(1); // will trigger fetch in useEffect
      }
    } catch (err) {
      console.error(err);
      alert('Failed to generate code.');
    }
  };

  const confirmAction = (title: string, message: string, isDestructive: boolean, onConfirm: () => void) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      isDestructive,
      onConfirm: () => {
        onConfirm();
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleAdminSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdminSaved(true);
    setTimeout(() => setIsAdminSaved(false), 3000);
  };

  const handlePromote = async (member: Member) => {
    try {
      console.log('Promoting member:', member.id, 'in project:', projectId);
      await updateProjectMemberRole(projectId, member.id, 'ADMIN_PROJECT');
      if (onMembersChange) onMembersChange();
    } catch (err: any) {
      console.error('Promote error:', err);
      alert(`Failed to promote member: ${err?.message || 'Unknown error'}`);
    }
  };

  const handleRemove = async (member: Member) => {
    try {
      console.log('Removing member:', member.id, 'from project:', projectId);
      await removeProjectMember(projectId, member.id);
      if (onMembersChange) onMembersChange();
    } catch (err: any) {
      console.error('Remove error:', err);
      alert(`Failed to remove member: ${err?.message || 'Unknown error'}`);
    }
  };

  const StatusPill = ({ invitation }: { invitation: ProjectInvitation }) => {
    const isExpired = new Date(invitation.expiredAt) < new Date();
    if (invitation.isUsed) {
      return <span className="font-mono text-[10px] bg-[#24A148]/10 text-[#24A148] px-2 py-0.5 rounded-[2px] font-bold">USED</span>;
    }
    if (isExpired) {
      return <span className="font-mono text-[10px] bg-[#DA1E28]/10 text-[#DA1E28] px-2 py-0.5 rounded-[2px] font-bold">EXPIRED</span>;
    }
    return <span className="font-mono text-[10px] bg-[#0F62FE]/10 text-[#0F62FE] px-2 py-0.5 rounded-[2px] font-bold">ACTIVE</span>;
  };

  const getExpiresIn = (expiredAt: string) => {
    const expires = new Date(expiredAt).getTime();
    if (expires < currentTime) return 'EXPIRED';

    const diff = expires - currentTime;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    const hh = hours.toString().padStart(2, '0');
    const mm = mins.toString().padStart(2, '0');
    const ss = secs.toString().padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  };

  return (
    <div className="space-y-6">
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        isDestructive={confirmDialog.isDestructive}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Top Sections Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Code Generation Section */}
        <div className="bg-[#F4F7FF] dark:bg-[#121212] border border-[#0F62FE]/30 rounded-[4px] p-6 lg:p-8 relative overflow-hidden shadow-sm flex flex-col">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#0F62FE] rounded-full filter blur-[100px] opacity-10"></div>
          <div className="relative z-10">
            <h2 className="font-sans font-bold text-xl text-[#161616] dark:text-white mb-6 flex items-center border-b border-[#E0E0E0] dark:border-[#393939] pb-4">
              <Key className="mr-3 text-[#0F62FE]" size={20} /> Workspace Access Control
            </h2>
            <p className="font-sans text-sm text-[#525252] dark:text-[#A8A8A8] mb-8">
              Manage and generate secure, time-limited join codes to invite new members to this workspace.
            </p>

            <div className="w-full mb-6 mt-4">
              <form onSubmit={handleGenerateCode} className="flex items-center space-x-2 w-full">
                <input type="email" required value={targetEmail} onChange={e => setTargetEmail(e.target.value)} placeholder="Target Email..." className="flex-1 w-full bg-white dark:bg-[#121212] border border-[#CCCCCC] dark:border-[#393939] rounded-[4px] px-3 py-2 text-sm text-[#161616] dark:text-white focus:outline-none focus:border-[#0F62FE]" />
                <button
                  type="submit"
                  className="bg-[#0F62FE] hover:bg-[#0353E9] text-white font-sans font-semibold text-sm px-6 py-2 rounded-[4px] transition-colors shadow-sm flex items-center space-x-2 flex-shrink-0 h-[38px]"
                >
                  <Plus size={16} />
                  <span>Generate</span>
                </button>
              </form>
            </div>

            {/* Join Codes Table */}
            <div className="bg-white dark:bg-[#161616] border border-[#E0E0E0] dark:border-[#393939] rounded-[4px] overflow-hidden flex-1 flex flex-col">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E0E0E0] dark:border-[#393939] bg-[#F4F4F4] dark:bg-[#121212]">
                      <th className="px-5 py-3 font-mono text-[10px] text-[#525252] dark:text-[#8D8D8D] uppercase font-semibold">Join Code</th>
                      <th className="px-5 py-3 font-mono text-[10px] text-[#525252] dark:text-[#8D8D8D] uppercase font-semibold">Target Email</th>
                      <th className="px-5 py-3 font-mono text-[10px] text-[#525252] dark:text-[#8D8D8D] uppercase font-semibold">Status</th>
                      <th className="px-5 py-3 font-mono text-[10px] text-[#525252] dark:text-[#8D8D8D] uppercase font-semibold text-right">Expires In</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingCodes ? (
                      <tr><td colSpan={4} className="px-5 py-6 text-center text-sm text-[#757575] dark:text-[#8D8D8D]">Loading...</td></tr>
                    ) : joinCodes.length === 0 ? (
                      <tr><td colSpan={4} className="px-5 py-6 text-center text-sm text-[#757575] dark:text-[#8D8D8D]">No active join codes.</td></tr>
                    ) : (
                      joinCodes.map((code) => (
                        <tr key={code.id} className="border-b border-[#E0E0E0] dark:border-[#393939] last:border-0 hover:bg-[#F9F9F9] dark:hover:bg-[#1C1C21] transition-colors">
                          <td className="px-5 py-3 font-mono text-sm font-bold text-[#161616] dark:text-white tracking-widest">{code.joinCode}</td>
                          <td className="px-5 py-3 font-mono text-xs text-[#525252] dark:text-[#A8A8A8]">{code.email}</td>
                          <td className="px-5 py-3"><StatusPill invitation={code} /></td>
                          <td className="px-5 py-3 text-right font-mono text-[11px] font-bold text-[#F1C21B]">{getExpiresIn(code.expiredAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="mt-auto">
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-5 py-3 border-t border-[#E0E0E0] dark:border-[#393939] bg-[#F4F4F4] dark:bg-[#121212]">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage(p => p - 1)}
                      className="text-xs font-semibold text-[#0F62FE] disabled:text-[#A8A8A8] disabled:dark:text-[#8D8D8D] disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-xs text-[#525252] dark:text-[#A8A8A8]">Page {page} of {totalPages}</span>
                    <button
                      disabled={page === totalPages}
                      onClick={() => setPage(p => p + 1)}
                      className="text-xs font-semibold text-[#0F62FE] disabled:text-[#A8A8A8] disabled:dark:text-[#8D8D8D] disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Admin Control Center (Project Level) */}
        <div className="bg-white dark:bg-[#1C1C21] border border-[#E0E0E0] dark:border-[#2D2D39] rounded-[4px] p-6 lg:p-8 shadow-sm flex flex-col">
          <h2 className="font-sans font-bold text-xl text-[#161616] dark:text-white mb-6 flex items-center border-b border-[#E0E0E0] dark:border-[#393939] pb-4">
            <Shield className="mr-3 text-[#0F62FE]" size={20} /> Administrative Control Center
          </h2>
          <p className="font-sans text-sm text-[#525252] dark:text-[#A8A8A8] mb-8">
            High-precision controls for workspace security and access limits. Values represent critical configuration states for this project.
          </p>

          <form onSubmit={handleAdminSave} className="space-y-8 max-w-2xl">
            <div className="bg-[#F4F4F4] dark:bg-[#121212] p-5 rounded-[4px] border border-[#E0E0E0] dark:border-[#2D2D39]">
              <h3 className="font-sans font-bold text-sm text-[#161616] dark:text-white mb-4 flex items-center">
                <Shield size={16} className="mr-2 text-[#0F62FE]" /> Brute-Force Protection
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-sans text-xs font-semibold text-[#525252] dark:text-[#A8A8A8] uppercase tracking-wider mb-2">Max Failed Attempts</label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="number"
                      min="1" max="10"
                      value={joinCodeLimit}
                      onChange={e => setJoinCodeLimit(e.target.value)}
                      className="w-24 bg-white dark:bg-[#1C1C21] border border-[#CCCCCC] dark:border-[#393939] rounded-[4px] px-3 py-2 font-mono text-sm text-[#0F62FE] font-bold focus:outline-none focus:border-[#0F62FE]"
                    />
                    <span className="font-sans text-sm text-[#525252] dark:text-[#8D8D8D]">attempts</span>
                  </div>
                  <p className="mt-2 text-xs text-[#757575] dark:text-[#8D8D8D] font-mono leading-tight">Threshold before automated lockout engages to prevent brute-force attacks on Join Codes.</p>
                </div>

                <div>
                  <label className="block font-sans text-xs font-semibold text-[#525252] dark:text-[#A8A8A8] uppercase tracking-wider mb-2">Lockout Duration</label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="number"
                      min="1" max="72"
                      value={lockoutPeriod}
                      onChange={e => setLockoutPeriod(e.target.value)}
                      className="w-24 bg-white dark:bg-[#1C1C21] border border-[#CCCCCC] dark:border-[#393939] rounded-[4px] px-3 py-2 font-mono text-sm text-[#DA1E28] font-bold focus:outline-none focus:border-[#DA1E28]"
                    />
                    <span className="font-sans text-sm text-[#525252] dark:text-[#8D8D8D]">hour(s)</span>
                  </div>
                  <p className="mt-2 text-xs text-[#757575] dark:text-[#8D8D8D] font-mono leading-tight">Duration of the temporary ban imposed on the offending IP/User account.</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4 border-t border-[#E0E0E0] dark:border-[#393939] pt-6 mt-auto">
              <button
                type="submit"
                className="bg-[#161616] dark:bg-white text-white dark:text-[#161616] font-sans font-semibold text-sm px-6 py-2.5 rounded-[4px] transition-colors shadow-sm flex items-center space-x-2"
              >
                <span>Save Configurations</span>
              </button>
              {isAdminSaved && <span className="font-mono text-sm text-[#24A148] flex items-center animate-in fade-in">Config Saved</span>}
            </div>
          </form>
        </div>
      </div>

      {/* Member Management */}
      <div className="bg-white dark:bg-[#1C1C21] border border-[#E0E0E0] dark:border-[#2D2D39] rounded-[4px] overflow-hidden">
        <div className="px-6 py-5 border-b border-[#E0E0E0] dark:border-[#2D2D39] flex justify-between items-center bg-[#F7F7F7] dark:bg-[#161616]">
          <div>
            <h3 className="font-sans font-bold text-[#161616] dark:text-white flex items-center space-x-2 text-lg">
              <Shield size={18} className="text-[#8A3FFC]" />
              <span>Governance Panel</span>
            </h3>
            <p className="font-sans text-xs text-[#757575] dark:text-[#A8A8A8] mt-1">
              Manage member roles and workspace access.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E0E0E0] dark:border-[#2D2D39]">
                <th className="px-6 py-3 font-mono text-[10px] text-[#757575] dark:text-[#8D8D8D] uppercase font-semibold">Username</th>
                <th className="px-6 py-3 font-mono text-[10px] text-[#757575] dark:text-[#8D8D8D] uppercase font-semibold">Email</th>
                <th className="px-6 py-3 font-mono text-[10px] text-[#757575] dark:text-[#8D8D8D] uppercase font-semibold text-center">Role</th>
                <th className="px-6 py-3 font-mono text-[10px] text-[#757575] dark:text-[#8D8D8D] uppercase font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id} className="border-b border-[#E0E0E0] dark:border-[#2D2D39] last:border-0 hover:bg-[#F4F4F4] dark:hover:bg-[#161616]/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 rounded-full bg-[#E0E0E0] dark:bg-[#393939] flex items-center justify-center font-sans font-bold text-xs text-[#161616] dark:text-white shadow-sm flex-shrink-0">
                        {member.name.charAt(0)}
                      </div>
                      <span className="font-sans text-sm font-semibold text-[#161616] dark:text-[#E0E0E0]">{member.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-[#525252] dark:text-[#A8A8A8]">{member.email}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-block font-mono text-[10px] font-bold px-2 py-1 rounded-[2px] ${member.role === 'ADMIN_PROJECT' ? 'bg-[#8A3FFC]/10 text-[#8A3FFC]' : 'bg-[#E0E0E0] dark:bg-[#393939] text-[#525252] dark:text-[#A8A8A8]'
                      }`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-3">
                      {member.role === 'MEMBER' && (
                        <button
                          onClick={() => confirmAction('Promote to Admin', `Are you sure you want to promote ${member.name} to Admin? They will have full access.`, false, () => handlePromote(member))}
                          className="p-2 text-[#0F62FE] hover:bg-[#0F62FE]/10 rounded-[4px] transition-colors" title="Promote to Admin"
                        >
                          <UserPlus size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => confirmAction('Revoke Access', `Are you sure you want to remove ${member.name} from this project?`, true, () => handleRemove(member))}
                        className="p-2 text-[#DA1E28] hover:bg-[#FFF1F1] dark:hover:bg-[#DA1E28]/10 rounded-[4px] transition-colors" title="Revoke Access"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
