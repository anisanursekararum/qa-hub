import React, { useState } from 'react';
import { Key, Shield, Trash2, UserPlus, Plus } from 'lucide-react';
import { ConfirmDialog } from '../shared/ConfirmDialog';

import { generateJoinCode } from '../../api/projects';

interface Member {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN_PROJECT' | 'MEMBER';
}

interface ProjectAdminPanelProps {
  members: Member[];
  projectId: string;
}

interface JoinCode {
  code: string;
  status: 'ACTIVE' | 'USED' | 'EXPIRED';
  expiresIn: string;
}

export const ProjectAdminPanel: React.FC<ProjectAdminPanelProps> = ({ members, projectId }) => {
  const [targetEmail, setTargetEmail] = useState('');
  const [joinCodes, setJoinCodes] = useState<JoinCode[]>([]);
  
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isDestructive: boolean;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', isDestructive: false, onConfirm: () => {} });

  const handleGenerateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmail) return;
    try {
      const res = await generateJoinCode(projectId, targetEmail);
      setJoinCodes(prev => [{ code: res.joinCode, status: 'ACTIVE', expiresIn: '03:00:00' }, ...prev]);
      setTargetEmail('');
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

  const StatusPill = ({ status }: { status: JoinCode['status'] }) => {
    switch(status) {
      case 'ACTIVE': return <span className="font-mono text-[10px] bg-[#0F62FE]/10 text-[#0F62FE] px-2 py-0.5 rounded-[2px] font-bold">ACTIVE</span>;
      case 'USED': return <span className="font-mono text-[10px] bg-[#24A148]/10 text-[#24A148] px-2 py-0.5 rounded-[2px] font-bold">USED</span>;
      case 'EXPIRED': return <span className="font-mono text-[10px] bg-[#DA1E28]/10 text-[#DA1E28] px-2 py-0.5 rounded-[2px] font-bold">EXPIRED</span>;
    }
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

      {/* Code Generation Section */}
      <div className="bg-[#1C1C21] dark:bg-[#121212] border border-[#0F62FE]/30 rounded-[4px] p-6 lg:p-8 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#0F62FE] rounded-full filter blur-[100px] opacity-10"></div>
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
            <div>
              <h3 className="font-sans font-bold text-xl text-white mb-2 flex items-center space-x-2">
                <Key size={20} className="text-[#0F62FE]" />
                <span>Workspace Access Control</span>
              </h3>
              <p className="font-sans text-sm text-[#A8A8A8] max-w-md">
                Manage and generate secure, time-limited join codes to invite new members to this workspace.
              </p>
            </div>
            
            <form onSubmit={handleGenerateCode} className="flex items-center space-x-2 w-full md:w-auto mt-4 md:mt-0">
              <input type="email" required value={targetEmail} onChange={e => setTargetEmail(e.target.value)} placeholder="Target Email..." className="bg-[#121212] border border-[#393939] rounded-[4px] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#0F62FE]" />
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
          <div className="bg-[#161616] border border-[#393939] rounded-[4px] overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#393939] bg-[#121212]">
                  <th className="px-5 py-3 font-mono text-[10px] text-[#8D8D8D] uppercase font-semibold">Join Code</th>
                  <th className="px-5 py-3 font-mono text-[10px] text-[#8D8D8D] uppercase font-semibold">Status</th>
                  <th className="px-5 py-3 font-mono text-[10px] text-[#8D8D8D] uppercase font-semibold text-right">Expires In</th>
                </tr>
              </thead>
              <tbody>
                {joinCodes.map((code, idx) => (
                  <tr key={idx} className="border-b border-[#393939] last:border-0 hover:bg-[#1C1C21] transition-colors">
                    <td className="px-5 py-3 font-mono text-sm font-bold text-white tracking-widest">{code.code}</td>
                    <td className="px-5 py-3"><StatusPill status={code.status} /></td>
                    <td className="px-5 py-3 text-right font-mono text-[11px] font-bold text-[#F1C21B]">{code.expiresIn}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                    <span className={`inline-block font-mono text-[10px] font-bold px-2 py-1 rounded-[2px] ${
                      member.role === 'ADMIN_PROJECT' ? 'bg-[#8A3FFC]/10 text-[#8A3FFC]' : 'bg-[#E0E0E0] dark:bg-[#393939] text-[#525252] dark:text-[#A8A8A8]'
                    }`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-3">
                      {member.role === 'MEMBER' && (
                        <button 
                          onClick={() => confirmAction('Promote to Admin', `Are you sure you want to promote ${member.name} to Admin? They will have full access.`, false, () => console.log('Promoted'))}
                          className="p-2 text-[#0F62FE] hover:bg-[#0F62FE]/10 rounded-[4px] transition-colors" title="Promote to Admin"
                        >
                          <UserPlus size={16} />
                        </button>
                      )}
                      <button 
                        onClick={() => confirmAction('Revoke Access', `Are you sure you want to remove ${member.name} from this project?`, true, () => console.log('Revoked'))}
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
