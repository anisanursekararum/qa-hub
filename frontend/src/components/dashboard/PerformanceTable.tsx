import React from 'react';

export const PerformanceTable: React.FC = () => {
  const suites = [
    { name: 'AUTH_E2E_PROD', stability: '99.8%', duration: '1m 24s', status: 'PASSED' },
    { name: 'PAYMENT_GATEWAY', stability: '84.2%', duration: '3m 45s', status: 'FLAKY' },
    { name: 'WEB_UI_CORE', stability: '92.5%', duration: '12m 04s', status: 'HEALED' }
  ];

  return (
    <div className="bg-white dark:bg-[#1C1C21] border border-[#E0E0E0] dark:border-[#2D2D39] rounded-[4px] overflow-hidden">
      <div className="px-4 py-3 border-b border-[#E0E0E0] dark:border-[#2D2D39] flex justify-between items-center bg-[#F7F7F7] dark:bg-[#161616]">
        <h3 className="font-mono text-[9px] font-bold text-[#525252] dark:text-[#A8A8A8] uppercase tracking-wider">Test Suite Performance</h3>
        <button className="text-[#757575] hover:text-[#161616] dark:hover:text-white">&#8942;</button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E0E0E0] dark:border-[#2D2D39]">
              <th className="px-4 py-2 font-mono text-[8px] text-[#757575] dark:text-[#8D8D8D] uppercase font-semibold">Suite Name</th>
              <th className="px-4 py-2 font-mono text-[8px] text-[#757575] dark:text-[#8D8D8D] uppercase font-semibold">Stability</th>
              <th className="px-4 py-2 font-mono text-[8px] text-[#757575] dark:text-[#8D8D8D] uppercase font-semibold">Duration</th>
              <th className="px-4 py-2 font-mono text-[8px] text-[#757575] dark:text-[#8D8D8D] uppercase font-semibold text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {suites.map((suite, idx) => (
              <tr key={idx} className="border-b border-[#E0E0E0] dark:border-[#2D2D39] last:border-0 hover:bg-[#F7F7F7] dark:hover:bg-[#161616]/50 transition-colors">
                <td className="px-4 py-2.5 font-mono text-[10px] text-[#161616] dark:text-[#E0E0E0]">{suite.name}</td>
                <td className="px-4 py-2.5 font-mono text-[10px] text-[#161616] dark:text-[#E0E0E0]">{suite.stability}</td>
                <td className="px-4 py-2.5 font-mono text-[10px] text-[#161616] dark:text-[#E0E0E0]">{suite.duration}</td>
                <td className="px-4 py-2.5 text-right">
                  <span className={`inline-block font-mono text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-[2px] border ${
                    suite.status === 'PASSED' ? 'border-[#0F62FE]/30 text-[#0F62FE] bg-[#0F62FE]/10' :
                    suite.status === 'FLAKY' ? 'border-[#DA1E28]/30 text-[#DA1E28] bg-[#DA1E28]/10' :
                    'border-[#8A3FFC]/30 text-[#8A3FFC] bg-[#8A3FFC]/10'
                  }`}>
                    {suite.status}
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
