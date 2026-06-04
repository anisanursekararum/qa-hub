import React from 'react';

interface PerformanceTableProps {
  performance: {
    id: string;
    runName: string;
    projectName: string;
    status: string;
    passed: number;
    failed: number;
    todo: number;
  }[];
}

export const PerformanceTable: React.FC<PerformanceTableProps> = ({ performance }) => {

  return (
    <div className="bg-white dark:bg-[#1C1C21] border border-[#E0E0E0] dark:border-[#2D2D39] rounded-[4px] overflow-hidden">
      <div className="px-4 py-3 border-b border-[#E0E0E0] dark:border-[#2D2D39] flex justify-between items-center bg-[#F7F7F7] dark:bg-[#161616]">
        <h2 className="font-mono font-bold text-[11px] text-[#161616] dark:text-white uppercase tracking-wider">Test Suite Performance</h2>
        <button className="text-[#757575] hover:text-[#161616] dark:hover:text-white">&#8942;</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E0E0E0] dark:border-[#2D2D39]">
              <th className="px-4 py-3 font-sans text-xs text-[#757575] dark:text-[#8D8D8D] uppercase font-bold">Run Name</th>
              <th className="px-4 py-3 font-sans text-xs text-[#757575] dark:text-[#8D8D8D] uppercase font-bold">Project</th>
              <th className="px-4 py-3 font-sans text-xs text-[#757575] dark:text-[#8D8D8D] uppercase font-bold">Passed / Failed</th>
              <th className="px-4 py-3 font-sans text-xs text-[#757575] dark:text-[#8D8D8D] uppercase font-bold text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {performance.map((run) => (
              <tr key={run.id} className="border-b border-[#E0E0E0] dark:border-[#2D2D39] last:border-0 hover:bg-[#F7F7F7] dark:hover:bg-[#161616]/50 transition-colors">
                <td className="px-4 py-3 font-sans text-sm text-[#161616] dark:text-[#E0E0E0]">{run.runName}</td>
                <td className="px-4 py-3 font-sans text-sm text-[#161616] dark:text-[#E0E0E0]">{run.projectName}</td>
                <td className="px-4 py-3 font-sans text-sm text-[#161616] dark:text-[#E0E0E0]">
                  <span className="text-[#24A148]">{run.passed}</span> / <span className="text-[#DA1E28]">{run.failed}</span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <span className={`inline-block font-mono text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-[2px] border ${run.status === 'DONE' ? 'border-[#24A148]/30 text-[#24A148] bg-[#24A148]/10' :
                      run.status === 'IN_PROGRESS' || run.status === 'AUTOMATION_RUNNING' ? 'border-[#0F62FE]/30 text-[#0F62FE] bg-[#0F62FE]/10' :
                        'border-[#8A3FFC]/30 text-[#8A3FFC] bg-[#8A3FFC]/10'
                    }`}>
                    {run.status.replace('_', ' ')}
                  </span>
                </td>
              </tr>
            ))}
            {performance.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center font-mono text-[10px] text-[#757575] dark:text-[#8D8D8D]">
                  No recent test runs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
