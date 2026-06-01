import React from 'react';

interface Member {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN_PROJECT' | 'MEMBER';
}

interface MemberDirectoryProps {
  members: Member[];
}

export const MemberDirectory: React.FC<MemberDirectoryProps> = ({ members }) => {
  return (
    <div className="bg-white dark:bg-[#1C1C21] border border-[#E0E0E0] dark:border-[#2D2D39] rounded-[4px] overflow-hidden">
      <div className="px-6 py-5 border-b border-[#E0E0E0] dark:border-[#2D2D39] bg-[#F7F7F7] dark:bg-[#161616]">
        <h3 className="font-sans font-bold text-[#161616] dark:text-white text-lg">Member Directory</h3>
        <p className="font-sans text-xs text-[#757575] dark:text-[#A8A8A8] mt-1">
          View-only access to team members in this workspace.
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E0E0E0] dark:border-[#2D2D39]">
              <th className="px-6 py-3 font-mono text-[10px] text-[#757575] dark:text-[#8D8D8D] uppercase font-semibold">User</th>
              <th className="px-6 py-3 font-mono text-[10px] text-[#757575] dark:text-[#8D8D8D] uppercase font-semibold">Email</th>
              <th className="px-6 py-3 font-mono text-[10px] text-[#757575] dark:text-[#8D8D8D] uppercase font-semibold text-right">Role</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id} className="border-b border-[#E0E0E0] dark:border-[#2D2D39] last:border-0 hover:bg-[#F4F4F4] dark:hover:bg-[#161616]/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-[#E0E0E0] dark:bg-[#393939] flex items-center justify-center font-sans font-bold text-xs text-[#161616] dark:text-white shadow-sm">
                      {member.name.charAt(0)}
                    </div>
                    <span className="font-sans text-sm font-semibold text-[#161616] dark:text-[#E0E0E0]">{member.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 font-mono text-xs text-[#525252] dark:text-[#A8A8A8]">{member.email}</td>
                <td className="px-6 py-4 text-right">
                  <span className={`inline-block font-mono text-[10px] font-bold px-2 py-1 rounded-[2px] ${
                    member.role === 'ADMIN_PROJECT' ? 'bg-[#8A3FFC]/10 text-[#8A3FFC]' : 'bg-[#E0E0E0] dark:bg-[#393939] text-[#525252] dark:text-[#A8A8A8]'
                  }`}>
                    {member.role}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
