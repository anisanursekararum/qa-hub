import React, { useState, useMemo, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

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
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const itemsPerPage = 5;

  const uniqueProjects = useMemo(() => Array.from(new Set(performance.map(r => r.projectName))), [performance]);
  const uniqueStatuses = useMemo(() => Array.from(new Set(performance.map(r => r.status))), [performance]);

  const filteredPerformance = useMemo(() => {
    return performance.filter(run => {
      const matchesSearch = run.runName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesProject = projectFilter === 'ALL' || run.projectName === projectFilter;
      const matchesStatus = statusFilter === 'ALL' || run.status === statusFilter;
      return matchesSearch && matchesProject && matchesStatus;
    });
  }, [performance, searchQuery, projectFilter, statusFilter]);

  const totalPages = Math.ceil(filteredPerformance.length / itemsPerPage) || 1;
  const currentData = filteredPerformance.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, projectFilter, statusFilter]);

  return (
    <div className="bg-white dark:bg-[#1C1C21] border border-[#E0E0E0] dark:border-[#2D2D39] rounded-[4px] overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b border-[#E0E0E0] dark:border-[#2D2D39] flex justify-between items-center bg-[#F7F7F7] dark:bg-[#161616]">
        <h2 className="font-mono font-bold text-[11px] text-[#161616] dark:text-white uppercase tracking-wider">Test Suite Performance</h2>
      </div>

      <div className="p-3 border-b border-[#E0E0E0] dark:border-[#2D2D39] flex flex-col sm:flex-row gap-3 items-center bg-white dark:bg-[#1C1C21]">
        <div className="relative w-full sm:w-auto flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#757575] dark:text-[#8D8D8D]" />
          <input
            type="text"
            placeholder="Search run name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#F4F4F4] dark:bg-[#121212] border border-[#E0E0E0] dark:border-[#393939] rounded text-sm focus:outline-none focus:border-[#0F62FE] dark:text-white placeholder-[#A8A8A8]"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-1.5 bg-[#F4F4F4] dark:bg-[#121212] border border-[#E0E0E0] dark:border-[#393939] rounded text-sm focus:outline-none focus:border-[#0F62FE] dark:text-white"
          >
            <option value="ALL">All Projects</option>
            {uniqueProjects.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-1.5 bg-[#F4F4F4] dark:bg-[#121212] border border-[#E0E0E0] dark:border-[#393939] rounded text-sm focus:outline-none focus:border-[#0F62FE] dark:text-white"
          >
            <option value="ALL">All Statuses</option>
            {uniqueStatuses.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto flex-1">
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
            {currentData.map((run) => (
              <tr key={run.id} className="border-b border-[#E0E0E0] dark:border-[#2D2D39] last:border-0 hover:bg-[#F7F7F7] dark:hover:bg-[#161616]/50 transition-colors">
                <td className="px-4 py-3 font-sans text-sm text-[#161616] dark:text-[#E0E0E0]">{run.runName}</td>
                <td className="px-4 py-3 font-sans text-sm text-[#161616] dark:text-[#E0E0E0]">{run.projectName}</td>
                <td className="px-4 py-3 font-sans text-sm text-[#161616] dark:text-[#E0E0E0]">
                  <span className="text-[#24A148] text-sm">{run.passed}</span> / <span className="text-[#DA1E28]">{run.failed}</span>
                </td>
                <td className="px-4 py-2.5 text-right text-sm">
                  <span className={`inline-block font-mono text-[8px] font-bold text-sm uppercase px-1.5 py-0.5 rounded-[2px] border ${run.status === 'DONE' ? 'border-[#24A148]/30 text-[#24A148] bg-[#24A148]/10' :
                    run.status === 'IN_PROGRESS' || run.status === 'AUTOMATION_RUNNING' ? 'border-[#0F62FE]/30 text-[#0F62FE] bg-[#0F62FE]/10' :
                      run.status === 'ARCHIVED' ? 'border-[#393939]/30 text-[#393939] bg-[#E0E0E0]/50' :
                        'border-[#8A3FFC]/30 text-[#8A3FFC] bg-[#8A3FFC]/10'
                    }`}>
                    {run.status.replace('_', ' ')}
                  </span>
                </td>
              </tr>
            ))}
            {currentData.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center font-mono text-[10px] text-[#757575] dark:text-[#8D8D8D]">
                  No test runs found matching filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filteredPerformance.length > 0 && (
        <div className="px-4 py-3 border-t border-[#E0E0E0] dark:border-[#2D2D39] flex justify-between items-center bg-white dark:bg-[#1C1C21]">
          <span className="text-xs text-[#757575] dark:text-[#8D8D8D] font-mono">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredPerformance.length)} of {filteredPerformance.length}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded hover:bg-[#F4F4F4] dark:hover:bg-[#2D2D39] disabled:opacity-50 disabled:cursor-not-allowed dark:text-[#A8A8A8] dark:hover:text-white transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded hover:bg-[#F4F4F4] dark:hover:bg-[#2D2D39] disabled:opacity-50 disabled:cursor-not-allowed dark:text-[#A8A8A8] dark:hover:text-white transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

