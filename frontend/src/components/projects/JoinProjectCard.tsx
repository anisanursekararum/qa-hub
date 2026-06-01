import React, { useState } from 'react';
import { ShieldAlert, LogIn } from 'lucide-react';
import { joinProject } from '../../api/projects';
import { useProject } from '../../context/ProjectContext';

export const JoinProjectCard: React.FC = () => {
  const [code, setCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const { refreshProjects } = useProject();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length === 6) {
      try {
        await joinProject(code);
        await refreshProjects();
        setCode('');
        setErrorMsg('');
      } catch (err: any) {
        setErrorMsg(err.message);
        if (err.message.includes('locked')) {
          setIsLocked(true);
        }
      }
    }
  };

  return (
    <div className="bg-white dark:bg-[#1C1C21] border border-[#E0E0E0] dark:border-[#2D2D39] rounded-[4px] p-6 shadow-sm">
      <h3 className="font-sans font-bold text-lg text-[#161616] dark:text-white mb-2">Join Project</h3>
      <p className="font-sans text-xs text-[#525252] dark:text-[#A8A8A8] mb-6 leading-relaxed">
        Enter the 6-character access code provided by your Project Admin.
      </p>

      <form onSubmit={handleJoin} className="space-y-4">
        <div>
          <input
            type="text"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="XXXXXX"
            className="w-full bg-[#F7F7F7] dark:bg-[#121212] border border-[#CCCCCC] dark:border-[#393939] rounded-[4px] px-4 py-3 font-mono text-center text-2xl tracking-[0.5em] text-[#161616] dark:text-white focus:outline-none focus:border-[#0F62FE] focus:ring-1 focus:ring-[#0F62FE] transition-colors uppercase placeholder:opacity-50"
          />
        </div>

        {errorMsg && (
          <div className="flex items-start space-x-3 p-3 bg-[#FFF1F1] dark:bg-[#2D161A] border border-[#DA1E28]/30 rounded-[4px] animate-in fade-in slide-in-from-top-2">
            <ShieldAlert size={16} className="text-[#DA1E28] mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-sans text-xs font-semibold text-[#DA1E28]">Invalid Access Code</p>
              <p className="font-mono text-[9px] text-[#DA1E28]/80 mt-1 uppercase tracking-wider leading-snug">
                {errorMsg}
              </p>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={code.length !== 6 || isLocked}
          className="w-full flex items-center justify-center space-x-2 bg-[#0F62FE] hover:bg-[#0353E9] disabled:bg-[#A8A8A8] dark:disabled:bg-[#393939] disabled:cursor-not-allowed text-white font-sans font-semibold text-sm py-2.5 rounded-[4px] transition-colors"
        >
          <LogIn size={16} />
          <span>Secure Join</span>
        </button>
      </form>
    </div>
  );
};
