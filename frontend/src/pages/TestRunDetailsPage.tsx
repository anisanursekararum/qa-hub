import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, CircleDashed, Clock, ChevronLeft, Terminal, Bot, Settings2, FileText, XSquare, Loader2, Plus, Search, Filter, X } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { useProject } from '../context/ProjectContext';
import { testRunsApi, TestRun } from '../api/testruns';
import { getTestCases, TestCase } from '../api/testcases';
import { DashboardLayout } from '../components/DashboardLayout';

interface FilterCondition {
  id: string;
  property: 'Status' | 'Module' | 'Automation' | 'Priority';
  operator: '==' | '!=';
  value: string;
}

const TestRunDetailsPage = () => {
  const { runId } = useParams();
  const navigate = useNavigate();
  const { activeProject } = useProject();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  
  const [run, setRun] = useState<TestRun | null>(null);
  const [allCases, setAllCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  
  // Title editing state
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

  const [selectedToAdd, setSelectedToAdd] = useState<Set<string>>(new Set());
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [modalFilters, setModalFilters] = useState<FilterCondition[]>([]);
  const [modalFilterProperty, setModalFilterProperty] = useState<FilterCondition['property']>('Status');
  const [modalFilterOperator, setModalFilterOperator] = useState<FilterCondition['operator']>('==');
  const [modalFilterValue, setModalFilterValue] = useState('DRAFT');

  const [tableSearchQuery, setTableSearchQuery] = useState('');
  const [tableFilters, setTableFilters] = useState<FilterCondition[]>([]);
  const [tableFilterProperty, setTableFilterProperty] = useState<FilterCondition['property']>('Status');
  const [tableFilterOperator, setTableFilterOperator] = useState<FilterCondition['operator']>('==');
  const [tableFilterValue, setTableFilterValue] = useState('DRAFT');

  // Telemetry State
  const [logs, setLogs] = useState<{timestamp: string, log: string}[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

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
    navigate('/login');
  };

  useEffect(() => {
    if (activeProject && runId) {
      loadData();
    }
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [activeProject, runId]);

  // Auto-scroll logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // WebSocket Connection
  useEffect(() => {
    if (run?.status === 'AUTOMATION_RUNNING' && !socketRef.current) {
      const socket = io('http://localhost:3000');
      socketRef.current = socket;
      
      socket.on(`run_status_${run.id}`, (data: { status: TestRun['status'] }) => {
        setRun(prev => prev ? { ...prev, status: data.status } : null);
        if (data.status !== 'AUTOMATION_RUNNING') {
          socket.disconnect();
          socketRef.current = null;
        }
      });
      
      socket.on(`item_status_${run.id}`, (data: { testCaseId: string, executionStatus: any, notes?: string }) => {
        setRun(prev => {
          if (!prev || !prev.items) return prev;
          const newItems = prev.items.map(item => 
            item.testCaseId === data.testCaseId 
              ? { ...item, executionStatus: data.executionStatus, notes: data.notes }
              : item
          );
          return { ...prev, items: newItems };
        });
      });
      
      socket.on(`telemetry_${run.id}`, (data: { timestamp: string, log: string }) => {
        setLogs(prev => [...prev, data]);
      });
    }
  }, [run?.status, run?.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [runData, casesData] = await Promise.all([
        testRunsApi.findOne(runId!),
        getTestCases(activeProject!.id)
      ]);
      setRun(runData);
      setAllCases(casesData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: TestRun['status']) => {
    try {
      await testRunsApi.updateStatus(runId!, newStatus);
      setRun(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditNameSubmit = async () => {
    if (!run || !editedName.trim()) {
      setIsEditingName(false);
      return;
    }
    try {
      const prefix = run.name.split(' - ')[0];
      const newFullName = `${prefix} - ${editedName}`;
      await testRunsApi.updateName(run.id, newFullName);
      setRun(prev => prev ? { ...prev, name: newFullName } : null);
      setIsEditingName(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddItems = async () => {
    if (selectedToAdd.size === 0) return;
    try {
      await testRunsApi.addItems(runId!, Array.from(selectedToAdd));
      setIsAddModalOpen(false);
      setSelectedToAdd(new Set());
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveItem = async (testCaseId: string) => {
    try {
      await testRunsApi.removeItems(runId!, [testCaseId]);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleItemExecutionUpdate = async (testCaseId: string, executionStatus: string) => {
    try {
      const updated = await testRunsApi.updateItemStatus(runId!, testCaseId, executionStatus);
      setRun(prev => {
        if (!prev || !prev.items) return prev;
        const newItems = prev.items.map(item => 
          item.testCaseId === testCaseId ? { ...item, executionStatus: updated.executionStatus } : item
        );
        return { ...prev, items: newItems };
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleTriggerAutomation = async () => {
    try {
      setLogs([]); // clear old logs
      await testRunsApi.triggerAutomation(runId!);
      setRun(prev => prev ? { ...prev, status: 'AUTOMATION_RUNNING' } : null);
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) return null;

  if (loading || !run) {
    return (
      <DashboardLayout user={user} onLogout={handleLogout} currentPath="/runs">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-[#0F62FE]" size={32} />
        </div>
      </DashboardLayout>
    );
  }

  // Calculate Metrics
  const getFilterOptions = (prop: string) => {
    if (prop === 'Status') return [{v: 'DRAFT', l: 'DRAFT'}, {v: 'READY', l: 'READY'}, {v: 'DEPRECATED', l: 'DEPRECATED'}];
    if (prop === 'Module') {
      const allModules = Array.from(new Set(allCases.map(c => c.moduleId).filter(Boolean)));
      return allModules.map(id => {
        const tc = allCases.find(c => c.moduleId === id);
        return { v: id, l: tc?.module?.name || id };
      });
    }
    if (prop === 'Automation') return [{v: 'MANUAL', l: 'MANUAL'}, {v: 'AUTOMATED', l: 'AUTOMATED'}, {v: 'FLAKY', l: 'FLAKY'}];
    if (prop === 'Priority') return [{v: 'HIGH', l: 'HIGH'}, {v: 'MEDIUM', l: 'MEDIUM'}, {v: 'LOW', l: 'LOW'}];
    return [];
  };

  const executeFilters = (casesList: TestCase[], filters: FilterCondition[], query: string) => {
    return casesList.filter(tc => {
      if (query) {
        const q = query.toLowerCase();
        if (!tc.title.toLowerCase().includes(q) && !(tc.publicId && tc.publicId.toLowerCase().includes(q))) {
          return false;
        }
      }
      for (const f of filters) {
        let match = false;
        if (f.property === 'Status') match = tc.status === f.value;
        else if (f.property === 'Module') match = tc.moduleId === f.value;
        else if (f.property === 'Automation') match = (tc.hasAutomation ? 'AUTOMATED' : 'MANUAL') === f.value;
        else if (f.property === 'Priority') match = tc.priority === f.value;
        
        const conditionMet = f.operator === '==' ? match : !match;
        if (!conditionMet) return false;
      }
      return true;
    });
  };

  const totalItems = run.items?.length || 0;
  const passedItems = run.items?.filter(i => i.executionStatus === 'PASSED').length || 0;
  const failedItems = run.items?.filter(i => i.executionStatus === 'FAILED').length || 0;
  const todoItems = run.items?.filter(i => i.executionStatus === 'TO_DO').length || 0;
  const completedItems = passedItems + failedItems;
  const progressPercent = totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);
  
  const uniqueModules = new Set(run.items?.map(i => i.testCase?.moduleId).filter(Boolean));
  const modulesCount = uniqueModules.size;
  
  // Exclude cases already in run for the Add Modal
  const existingCaseIds = new Set(run.items?.map(i => i.testCaseId));
  const availableCases = allCases.filter(c => !existingCaseIds.has(c.id));
  
  const filteredAvailableCases = executeFilters(availableCases, modalFilters, modalSearchQuery);
  
  const casesByModule = filteredAvailableCases.reduce((acc, tc) => {
    const modName = tc.module?.name || 'Unassigned';
    if (!acc[modName]) acc[modName] = [];
    acc[modName].push(tc);
    return acc;
  }, {} as Record<string, TestCase[]>);

  const populatedRunItems = (run.items || []).map(item => ({ 
    ...item.testCase, 
    executionStatus: item.executionStatus, 
    notes: item.notes, 
    testCaseId: item.testCaseId 
  }));
  const filteredRunItems = executeFilters(populatedRunItems as TestCase[], tableFilters, tableSearchQuery);
  const runItemsByModule = filteredRunItems.reduce((acc, item) => {
    const modName = item.module?.name || 'Unassigned';
    if (!acc[modName]) acc[modName] = [];
    acc[modName].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <DashboardLayout user={user} onLogout={handleLogout} currentPath="/runs">
      <div className="p-6 sm:p-8 max-w-7xl mx-auto min-h-full pb-32">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Header & Breadcrumbs */}
          <div className="mb-6">
            <button onClick={() => navigate('/runs')} className="flex items-center text-[#0F62FE] hover:underline font-sans text-sm font-semibold mb-3">
              <ChevronLeft size={16} className="mr-1" /> Back to Runs
            </button>
            <div className="flex justify-between items-end">
              <div className="flex-1 mr-4">
                {isEditingName ? (
                  <div className="flex items-center mb-2">
                    <span className="text-3xl font-sans font-black tracking-tight text-[#757575] dark:text-[#A8A8A8] mr-2">
                      {run.name.split(' - ')[0]} -
                    </span>
                    <input 
                      autoFocus
                      type="text"
                      className="text-3xl font-sans font-black tracking-tight text-[#161616] dark:text-white bg-transparent border-b-2 border-[#0F62FE] outline-none flex-1 min-w-[300px]"
                      value={editedName}
                      onChange={e => setEditedName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleEditNameSubmit();
                        if (e.key === 'Escape') setIsEditingName(false);
                      }}
                      onBlur={handleEditNameSubmit}
                    />
                  </div>
                ) : (
                  <h1 
                    className={`text-3xl font-sans font-black tracking-tight text-[#161616] dark:text-white mb-2 w-fit ${run.status === 'DRAFT' ? 'cursor-pointer hover:text-[#0F62FE] transition-colors border-b-2 border-transparent hover:border-dashed hover:border-[#0F62FE]' : ''}`}
                    onClick={() => {
                      if (run.status === 'DRAFT') {
                        setEditedName(run.name.split(' - ').slice(1).join(' - '));
                        setIsEditingName(true);
                      }
                    }}
                    title={run.status === 'DRAFT' ? "Click to edit name" : ""}
                  >
                    {run.name}
                  </h1>
                )}
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-sm bg-[#E0E0E0] dark:bg-[#393939] text-[#161616] dark:text-white px-2 py-1 rounded-[2px]">{run.id.split('-').slice(0,3).join('-')}</span>
                  <span className="text-[#525252] dark:text-[#A8A8A8] text-sm">Created {new Date(run.createdAt).toLocaleString()}</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {run.status === 'DRAFT' && (
                  <button onClick={() => handleStatusChange('IN_PROGRESS')} className="bg-[#161616] dark:bg-white text-white dark:text-[#161616] px-4 py-2 rounded-[4px] font-sans text-sm font-semibold hover:bg-[#393939] dark:hover:bg-[#E0E0E0] transition-colors">
                    Lock Scope & Start Run
                  </button>
                )}
                {run.status === 'IN_PROGRESS' && (
                  <>
                    <button onClick={handleTriggerAutomation} className="flex items-center space-x-2 bg-[#8A3FFC] hover:bg-[#6929C4] text-white px-4 py-2 rounded-[4px] font-sans text-sm font-semibold transition-colors shadow-sm">
                      <Bot size={16} />
                      <span>Execute Automation</span>
                    </button>
                    <button onClick={() => handleStatusChange('DONE')} className="bg-[#24A148] hover:bg-[#198038] text-white px-4 py-2 rounded-[4px] font-sans text-sm font-semibold transition-colors shadow-sm">
                      Mark as Done
                    </button>
                  </>
                )}
                {run.status === 'AUTOMATION_RUNNING' && (
                  <button disabled className="flex items-center space-x-2 bg-[#8A3FFC]/50 text-white px-4 py-2 rounded-[4px] font-sans text-sm font-semibold cursor-not-allowed">
                    <Loader2 size={16} className="animate-spin" />
                    <span>Running...</span>
                  </button>
                )}
                {run.status === 'DONE' && (
                  <button onClick={() => handleStatusChange('IN_PROGRESS')} className="border border-[#0F62FE] text-[#0F62FE] px-4 py-2 rounded-[4px] font-sans text-sm font-semibold hover:bg-[#0F62FE]/10 transition-colors">
                    Reopen Run
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Run Insights */}
          <div className="bg-white dark:bg-[#1C1C21] border border-[#E0E0E0] dark:border-[#393939] rounded-[4px] p-4 mb-6 flex flex-wrap gap-8 items-center shadow-sm">
            <div>
              <div className="text-xs font-mono text-[#757575] dark:text-[#8D8D8D] uppercase tracking-wider mb-1">Started</div>
              <div className="font-sans text-sm font-semibold text-[#161616] dark:text-white">
                {run.startedAt ? new Date(run.startedAt).toLocaleString('en-GB') : '-'}
              </div>
            </div>
            <div className="w-px h-8 bg-[#E0E0E0] dark:bg-[#393939]"></div>
            <div>
              <div className="text-xs font-mono text-[#757575] dark:text-[#8D8D8D] uppercase tracking-wider mb-1">Duration</div>
              <div className="font-sans text-sm font-semibold text-[#161616] dark:text-white">
                {run.startedAt ? (run.endedAt ? 'Finished' : 'Ongoing') : '-'}
              </div>
            </div>
            <div className="w-px h-8 bg-[#E0E0E0] dark:bg-[#393939]"></div>
            <div>
              <div className="text-xs font-mono text-[#757575] dark:text-[#8D8D8D] uppercase tracking-wider mb-1">Environment</div>
              <div className="font-sans text-sm font-semibold text-[#161616] dark:text-white">
                {run.environment || '-'}
              </div>
            </div>
            <div className="w-px h-8 bg-[#E0E0E0] dark:bg-[#393939]"></div>
            <div>
              <div className="text-xs font-mono text-[#757575] dark:text-[#8D8D8D] uppercase tracking-wider mb-1">Initiated By</div>
              <div className="font-sans text-sm font-semibold text-[#161616] dark:text-white flex items-center space-x-2">
                <span>{run.initiatedBy?.name || 'System'}</span>
                <span className="font-mono text-xs text-[#757575] dark:text-[#8D8D8D] bg-[#F4F4F4] dark:bg-[#121212] px-1.5 py-0.5 rounded-[2px]">{run.initiatedBy?.email || 'auto'}</span>
              </div>
            </div>
          </div>

          {/* Performance Metrics Header */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white dark:bg-[#1C1C21] border border-[#E0E0E0] dark:border-[#393939] hover:border-[#0F62FE] dark:hover:border-[#0F62FE] transition-colors rounded-[4px] p-4 text-[#161616] dark:text-white shadow-sm">
              <div className="text-[#525252] dark:text-[#A8A8A8] text-sm font-semibold uppercase tracking-wider mb-1">Overall Progress</div>
              <div className="flex items-end justify-between">
                <div className="text-3xl font-mono font-bold">{progressPercent}%</div>
                <div className="text-[#0F62FE]"><CircleDashed size={24} /></div>
              </div>
              <div className="w-full bg-[#E0E0E0] dark:bg-[#393939] h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-[#0F62FE] h-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
              </div>
            </div>
            <div className="bg-white dark:bg-[#1C1C21] border border-[#E0E0E0] dark:border-[#393939] hover:border-[#24A148] dark:hover:border-[#24A148] transition-colors rounded-[4px] p-4 text-[#161616] dark:text-white shadow-sm">
              <div className="text-[#525252] dark:text-[#A8A8A8] text-sm font-semibold uppercase tracking-wider mb-1">Passed Cases</div>
              <div className="flex items-end justify-between">
                <div className="text-3xl font-mono font-bold text-[#24A148]">{passedItems}</div>
                <div className="text-[#24A148]"><CheckCircle2 size={24} /></div>
              </div>
              <div className="text-[#525252] dark:text-[#A8A8A8] text-sm mt-3 font-mono">Successfully executed</div>
            </div>
            <div className="bg-white dark:bg-[#1C1C21] border border-[#E0E0E0] dark:border-[#393939] hover:border-[#DA1E28] dark:hover:border-[#DA1E28] transition-colors rounded-[4px] p-4 text-[#161616] dark:text-white shadow-sm">
              <div className="text-[#525252] dark:text-[#A8A8A8] text-sm font-semibold uppercase tracking-wider mb-1">Failed Cases</div>
              <div className="flex items-end justify-between">
                <div className="text-3xl font-mono font-bold text-[#DA1E28]">{failedItems}</div>
                <div className="text-[#DA1E28]"><XSquare size={24} /></div>
              </div>
              <div className="text-[#525252] dark:text-[#A8A8A8] text-sm mt-3 font-mono">Execution failed</div>
            </div>
            <div className="bg-white dark:bg-[#1C1C21] border border-[#E0E0E0] dark:border-[#393939] hover:border-[#F1C21B] dark:hover:border-[#F1C21B] transition-colors rounded-[4px] p-4 text-[#161616] dark:text-white shadow-sm">
              <div className="text-[#525252] dark:text-[#A8A8A8] text-sm font-semibold uppercase tracking-wider mb-1">TODO Cases</div>
              <div className="flex items-end justify-between">
                <div className="text-3xl font-mono font-bold text-[#F1C21B]">{todoItems}</div>
                <div className="text-[#F1C21B]"><Clock size={24} /></div>
              </div>
              <div className="text-[#525252] dark:text-[#A8A8A8] text-sm mt-3 font-mono">Pending execution</div>
            </div>
            <div className="bg-white dark:bg-[#1C1C21] border border-[#E0E0E0] dark:border-[#393939] hover:border-[#0F62FE] dark:hover:border-[#0F62FE] transition-colors rounded-[4px] p-4 text-[#161616] dark:text-white shadow-sm">
              <div className="text-[#525252] dark:text-[#A8A8A8] text-sm font-semibold uppercase tracking-wider mb-1">Total Scopes</div>
              <div className="flex items-end justify-between">
                <div className="text-3xl font-mono font-bold">{totalItems}</div>
                <div className="text-[#0F62FE]"><FileText size={24} /></div>
              </div>
              <div className="text-[#525252] dark:text-[#A8A8A8] text-sm mt-3 font-mono">{totalItems} test cases from {modulesCount} modules</div>
            </div>
          </div>

          {/* Main Execution List */}
          <div className="bg-white dark:bg-[#1C1C21] border border-[#E0E0E0] dark:border-[#393939] rounded-[4px] shadow-sm mb-8">
            <div className="p-4 border-b border-[#E0E0E0] dark:border-[#393939] bg-[#F4F4F4] dark:bg-[#121212] flex justify-between items-center">
              <h2 className="font-sans font-bold text-sm text-[#161616] dark:text-white flex items-center">
                <Settings2 size={16} className="mr-2 text-[#0F62FE]" /> Execution Engine
              </h2>
              {run.status === 'DRAFT' && (
                <button onClick={() => setIsAddModalOpen(true)} className="text-sm font-semibold text-[#0F62FE] hover:underline flex items-center">
                  <Plus size={14} className="mr-1" /> Add Cases to Scope
                </button>
              )}
              {run.status === 'IN_PROGRESS' && (
                <span className="text-sm font-mono font-bold text-[#0F62FE] bg-[#0F62FE]/10 px-2 py-1 rounded-[2px] flex items-center">
                  <CircleDashed size={12} className="mr-1 animate-spin-slow" /> ACTIVE WORKSPACE
                </span>
              )}
              {run.status === 'AUTOMATION_RUNNING' && (
                <span className="text-sm font-mono font-bold text-[#8A3FFC] bg-[#8A3FFC]/10 px-2 py-1 rounded-[2px] flex items-center animate-pulse">
                  <Bot size={12} className="mr-1" /> LOCK: ROBOTS WORKING
                </span>
              )}
            </div>
            
            <div className="p-4 border-b border-[#E0E0E0] dark:border-[#393939] bg-white dark:bg-[#1C1C21]">
              <div className="flex flex-col md:flex-row gap-4 items-center bg-[#F4F4F4] dark:bg-[#121212] border border-[#CCCCCC] dark:border-[#393939] p-2 rounded-[4px]">
                <div className="flex-1 flex items-center bg-white dark:bg-[#1C1C21] border border-[#CCCCCC] dark:border-[#393939] rounded-[4px] px-3 py-1.5 w-full md:w-auto">
                  <Search size={16} className="text-[#757575] dark:text-[#8D8D8D] mr-2 flex-shrink-0" />
                  <input type="text" placeholder="Search by ID or Title..." value={tableSearchQuery} onChange={e => setTableSearchQuery(e.target.value)} className="bg-transparent border-none outline-none text-sm text-[#161616] dark:text-white w-full placeholder-[#A8A8A8]" />
                </div>
                <div className="hidden md:block w-px h-6 bg-[#E0E0E0] dark:bg-[#393939]"></div>
                <div className="flex items-center space-x-2 w-full md:w-auto">
                  <Filter size={16} className="text-[#757575] dark:text-[#8D8D8D] ml-2" />
                  <select value={tableFilterProperty} onChange={e => {
                    const prop = e.target.value as any;
                    setTableFilterProperty(prop);
                    if (prop === 'Status') setTableFilterValue('DRAFT');
                    else if (prop === 'Module') {
                      const opts = getFilterOptions('Module');
                      setTableFilterValue(opts.length > 0 ? opts[0].v : '');
                    }
                    else if (prop === 'Automation') setTableFilterValue('MANUAL');
                    else if (prop === 'Priority') setTableFilterValue('HIGH');
                  }} className="bg-white dark:bg-[#1C1C21] border border-[#CCCCCC] dark:border-[#393939] text-sm px-2 py-1 rounded-[2px] focus:outline-none dark:text-white text-[#161616]">
                    <option value="Status">Status</option>
                    <option value="Module">Module</option>
                    <option value="Automation">Automation</option>
                    <option value="Priority">Priority</option>
                  </select>
                  <select value={tableFilterOperator} onChange={e => setTableFilterOperator(e.target.value as any)} className="bg-transparent text-sm text-[#0F62FE] font-mono focus:outline-none">
                    <option value="==">IS</option><option value="!=">IS NOT</option>
                  </select>
                  <select value={tableFilterValue} onChange={e => setTableFilterValue(e.target.value)} className="bg-white dark:bg-[#1C1C21] border border-[#CCCCCC] dark:border-[#393939] text-sm px-2 py-1 rounded-[2px] focus:outline-none dark:text-white text-[#161616] w-32">
                    {getFilterOptions(tableFilterProperty).map((o: any) => <option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                  <button onClick={() => {
                    if (!tableFilterValue) return;
                    if (tableFilters.some(f => f.property === tableFilterProperty && f.operator === tableFilterOperator && f.value === tableFilterValue)) return;
                    setTableFilters([...tableFilters, { id: Math.random().toString(36).substr(2, 9), property: tableFilterProperty, operator: tableFilterOperator, value: tableFilterValue }]);
                  }} className="bg-[#0F62FE] hover:bg-[#0353E9] text-white p-1.5 rounded-[2px] transition-colors"><Plus size={16}/></button>
                </div>
              </div>
              {tableFilters.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {tableFilters.map(f => (
                    <div key={f.id} className="flex items-center bg-[#F4F4F4] dark:bg-[#121212] border border-[#CCCCCC] dark:border-[#393939] rounded-[4px] px-2 py-1">
                      <span className="text-sm text-[#161616] dark:text-[#E0E0E0] font-sans font-semibold mr-2">{f.property} <span className="font-mono text-[#0F62FE]">{f.operator}</span> {f.property === 'Module' ? getFilterOptions('Module').find((o: any)=>o.v===f.value)?.l || f.value : f.value}</span>
                      <button onClick={() => setTableFilters(tableFilters.filter(ff => ff.id !== f.id))} className="text-[#A8A8A8] hover:text-[#DA1E28]"><X size={14} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-[#F4F4F4] dark:bg-[#121212] z-10 shadow-sm">
                  <tr className="border-b border-[#E0E0E0] dark:border-[#393939]">
                    <th className="px-4 py-3 font-sans text-sm font-semibold text-[#525252] dark:text-[#A8A8A8] uppercase tracking-wider">ID / Title</th>
                    <th className="px-4 py-3 font-sans text-sm font-semibold text-[#525252] dark:text-[#A8A8A8] uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 font-sans text-sm font-semibold text-[#525252] dark:text-[#A8A8A8] uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 font-sans text-sm font-semibold text-[#525252] dark:text-[#A8A8A8] uppercase tracking-wider">Notes (Failure Logs)</th>
                    <th className="px-4 py-3 font-sans text-sm font-semibold text-[#525252] dark:text-[#A8A8A8] uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E0E0E0] dark:divide-[#393939]">
                  {Object.keys(runItemsByModule).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-[#525252] dark:text-[#A8A8A8] font-mono text-sm">
                        Scope is empty. Add test cases to begin.
                      </td>
                    </tr>
                  ) : (
                    Object.keys(runItemsByModule).map(moduleName => (
                      <React.Fragment key={moduleName}>
                        <tr className="bg-[#F7F7F7] dark:bg-[#161616]">
                          <td colSpan={5} className="px-4 py-2 border-b border-[#E0E0E0] dark:border-[#393939]">
                            <span className="font-sans font-bold text-sm text-[#525252] dark:text-[#A8A8A8] uppercase tracking-wider">
                              {moduleName} ({runItemsByModule[moduleName].length})
                            </span>
                          </td>
                        </tr>
                        {runItemsByModule[moduleName].map(item => (
                          <tr key={item.testCaseId} className={`hover:bg-[#F4F4F4] dark:hover:bg-[#2D2D39]/30 transition-colors ${item.executionStatus === 'FAILED' ? 'bg-[#DA1E28]/5 dark:bg-[#DA1E28]/10' : ''}`}>
                            <td className="px-4 py-3">
                              <div className="font-mono text-sm font-bold text-[#0F62FE] mb-0.5">{item.publicId}</div>
                              <div className="font-sans text-sm text-[#161616] dark:text-white line-clamp-1">{item.title}</div>
                            </td>
                            <td className="px-4 py-3">
                              {item.hasAutomation ? 
                                <span className="font-mono text-xs text-[#8A3FFC] border border-[#8A3FFC]/30 px-1.5 py-0.5 rounded-[2px] font-bold flex items-center w-max"><Bot size={10} className="mr-1"/>AUTO</span> : 
                                <span className="font-mono text-xs text-[#525252] border border-[#525252]/50 px-1.5 py-0.5 rounded-[2px] font-bold">MANUAL</span>}
                            </td>
                            <td className="px-4 py-3">
                              <select 
                                value={item.executionStatus}
                                disabled={run.status !== 'IN_PROGRESS'}
                                onChange={(e) => handleItemExecutionUpdate(item.testCaseId, e.target.value)}
                                className={`font-sans text-sm font-bold px-2 py-1 rounded-[2px] border focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed ${
                                  item.executionStatus === 'TO_DO' ? 'bg-[#F4F4F4] dark:bg-[#393939] border-[#CCCCCC] dark:border-[#525252] text-[#525252] dark:text-[#A8A8A8]' :
                                  item.executionStatus === 'PASSED' ? 'bg-[#24A148]/10 border-[#24A148]/30 text-[#24A148]' :
                                  'bg-[#DA1E28]/10 border-[#DA1E28]/30 text-[#DA1E28]'
                                }`}
                              >
                                <option value="TO_DO">TO DO</option>
                                <option value="PASSED">PASSED</option>
                                <option value="FAILED">FAILED</option>
                              </select>
                            </td>
                            <td className="px-4 py-3 font-mono text-sm text-[#525252] dark:text-[#A8A8A8]">
                              {item.notes ? (
                                <div className="max-w-xs truncate" title={item.notes}>{item.notes}</div>
                              ) : (
                                <span className="opacity-50">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {run.status === 'DRAFT' && (
                                <button onClick={() => handleRemoveItem(item.testCaseId)} className="text-[#DA1E28] hover:underline font-sans text-sm font-semibold">
                                  Remove
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Telemetry Stream */}
          {(run.status === 'AUTOMATION_RUNNING' || logs.length > 0) && (
            <div className="bg-[#161616] border border-[#393939] rounded-[4px] shadow-sm mb-6 flex flex-col">
              <div className="p-3 border-b border-[#393939] bg-[#000000] flex justify-between items-center">
                <h2 className="font-mono font-bold text-sm text-[#0F62FE] flex items-center">
                  <Terminal size={14} className="mr-2" /> 
                  TELEMETRY STREAM // {run.id}
                </h2>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 rounded-full bg-[#DA1E28]"></div>
                  <div className="w-2 h-2 rounded-full bg-[#F1C21B]"></div>
                  <div className="w-2 h-2 rounded-full bg-[#24A148]"></div>
                </div>
              </div>
              <div className="p-4 h-64 overflow-y-auto font-mono text-sm text-[#A8A8A8] space-y-1 bg-[#121212]">
                {logs.map((l, i) => (
                  <div key={i} className="flex space-x-3">
                    <span className="text-[#525252] shrink-0">[{new Date(l.timestamp).toLocaleTimeString()}]</span>
                    <span className={`${l.log.includes('FAILED') ? 'text-[#DA1E28]' : l.log.includes('PASSED') ? 'text-[#24A148]' : 'text-[#E0E0E0]'}`}>{l.log}</span>
                  </div>
                ))}
                {run.status === 'AUTOMATION_RUNNING' && (
                  <div className="flex space-x-3 animate-pulse">
                    <span className="text-[#0F62FE] shrink-0">[{new Date().toLocaleTimeString()}]</span>
                    <span className="text-[#0F62FE]">Listening for robot telemetry...</span>
                  </div>
                )}
                <div ref={logsEndRef} />
              </div>
            </div>
          )}

          {/* Add Cases Modal */}
          {isAddModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white dark:bg-[#1C1C21] border border-[#E0E0E0] dark:border-[#393939] rounded-[4px] shadow-xl w-full max-w-3xl my-8 h-[80vh] flex flex-col animate-in zoom-in-95">
                <div className="p-5 border-b border-[#E0E0E0] dark:border-[#2D2D39] bg-[#F7F7F7] dark:bg-[#161616] flex justify-between items-center">
                  <h3 className="font-sans font-bold text-lg text-[#161616] dark:text-white">Repository Scope</h3>
                  <div className="font-sans text-sm font-semibold text-[#0F62FE]">{selectedToAdd.size} selected</div>
                </div>
                
                <div className="p-4 border-b border-[#E0E0E0] dark:border-[#2D2D39] bg-white dark:bg-[#1C1C21]">
                  <div className="flex flex-col md:flex-row gap-4 items-center bg-[#F4F4F4] dark:bg-[#121212] border border-[#CCCCCC] dark:border-[#393939] p-2 rounded-[4px]">
                    <div className="flex-1 flex items-center bg-white dark:bg-[#1C1C21] border border-[#CCCCCC] dark:border-[#393939] rounded-[4px] px-3 py-1.5 w-full md:w-auto">
                      <Search size={16} className="text-[#757575] dark:text-[#8D8D8D] mr-2 flex-shrink-0" />
                      <input type="text" placeholder="Search by ID or Title..." value={modalSearchQuery} onChange={e => setModalSearchQuery(e.target.value)} className="bg-transparent border-none outline-none text-sm text-[#161616] dark:text-white w-full placeholder-[#A8A8A8]" />
                    </div>
                    <div className="hidden md:block w-px h-6 bg-[#E0E0E0] dark:bg-[#393939]"></div>
                    <div className="flex items-center space-x-2 w-full md:w-auto">
                      <Filter size={16} className="text-[#757575] dark:text-[#8D8D8D] ml-2" />
                      <select value={modalFilterProperty} onChange={e => {
                        const prop = e.target.value as any;
                        setModalFilterProperty(prop);
                        if (prop === 'Status') setModalFilterValue('DRAFT');
                        else if (prop === 'Module') {
                          const opts = getFilterOptions('Module');
                          setModalFilterValue(opts.length > 0 ? opts[0].v : '');
                        }
                        else if (prop === 'Automation') setModalFilterValue('MANUAL');
                        else if (prop === 'Priority') setModalFilterValue('HIGH');
                      }} className="bg-white dark:bg-[#1C1C21] border border-[#CCCCCC] dark:border-[#393939] text-sm px-2 py-1 rounded-[2px] focus:outline-none dark:text-white text-[#161616]">
                        <option value="Status">Status</option>
                        <option value="Module">Module</option>
                        <option value="Automation">Automation</option>
                        <option value="Priority">Priority</option>
                      </select>
                      <select value={modalFilterOperator} onChange={e => setModalFilterOperator(e.target.value as any)} className="bg-transparent text-sm text-[#0F62FE] font-mono focus:outline-none">
                        <option value="==">IS</option><option value="!=">IS NOT</option>
                      </select>
                      <select value={modalFilterValue} onChange={e => setModalFilterValue(e.target.value)} className="bg-white dark:bg-[#1C1C21] border border-[#CCCCCC] dark:border-[#393939] text-sm px-2 py-1 rounded-[2px] focus:outline-none dark:text-white text-[#161616] w-32">
                        {getFilterOptions(modalFilterProperty).map((o: any) => <option key={o.v} value={o.v}>{o.l}</option>)}
                      </select>
                      <button onClick={() => {
                        if (!modalFilterValue) return;
                        if (modalFilters.some(f => f.property === modalFilterProperty && f.operator === modalFilterOperator && f.value === modalFilterValue)) return;
                        setModalFilters([...modalFilters, { id: Math.random().toString(36).substr(2, 9), property: modalFilterProperty, operator: modalFilterOperator, value: modalFilterValue }]);
                      }} className="bg-[#0F62FE] hover:bg-[#0353E9] text-white p-1.5 rounded-[2px] transition-colors"><Plus size={16}/></button>
                    </div>
                  </div>
                  {modalFilters.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {modalFilters.map(f => (
                        <div key={f.id} className="flex items-center bg-[#F4F4F4] dark:bg-[#121212] border border-[#CCCCCC] dark:border-[#393939] rounded-[4px] px-2 py-1">
                          <span className="text-sm text-[#161616] dark:text-[#E0E0E0] font-sans font-semibold mr-2">{f.property} <span className="font-mono text-[#0F62FE]">{f.operator}</span> {f.property === 'Module' ? getFilterOptions('Module').find((o: any)=>o.v===f.value)?.l || f.value : f.value}</span>
                          <button onClick={() => setModalFilters(modalFilters.filter(ff => ff.id !== f.id))} className="text-[#A8A8A8] hover:text-[#DA1E28]"><X size={14} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 bg-[#F4F4F4] dark:bg-[#121212]">
                  <div className="space-y-6">
                    {Object.keys(casesByModule).length === 0 ? (
                      <div className="text-center py-10 font-mono text-sm text-[#525252] dark:text-[#A8A8A8]">
                        No test cases found.
                      </div>
                    ) : (
                      Object.keys(casesByModule).map(moduleName => (
                        <div key={moduleName} className="space-y-2">
                          <h4 className="font-sans font-bold text-sm text-[#525252] dark:text-[#A8A8A8] uppercase tracking-wider sticky top-0 bg-[#F4F4F4] dark:bg-[#121212] py-1 z-10">
                            {moduleName} ({casesByModule[moduleName].length})
                          </h4>
                          {casesByModule[moduleName].map(tc => (
                            <div key={tc.id} className="flex items-center space-x-3 p-3 bg-white dark:bg-[#1C1C21] border border-[#E0E0E0] dark:border-[#393939] rounded-[4px] hover:border-[#0F62FE] transition-colors cursor-pointer" onClick={() => {
                              const newSet = new Set(selectedToAdd);
                              if (newSet.has(tc.id)) newSet.delete(tc.id);
                              else newSet.add(tc.id);
                              setSelectedToAdd(newSet);
                            }}>
                              <input type="checkbox" checked={selectedToAdd.has(tc.id)} readOnly className="w-4 h-4 rounded text-[#0F62FE] bg-[#F4F4F4] dark:bg-[#1C1C21]" />
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-mono text-sm font-bold text-[#0F62FE]">{tc.publicId}</span>
                                  {tc.hasAutomation && <Bot size={12} className="text-[#8A3FFC]" />}
                                </div>
                                <div className="font-sans text-sm font-semibold text-[#161616] dark:text-white line-clamp-1">{tc.title}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ))
                    )}
                  </div>
                </div>
                
                <div className="p-4 border-t border-[#E0E0E0] dark:border-[#2D2D39] bg-[#F7F7F7] dark:bg-[#161616] flex justify-end space-x-3">
                  <button onClick={() => { setIsAddModalOpen(false); setSelectedToAdd(new Set()); }} className="px-4 py-2 font-sans font-semibold text-sm text-[#161616] dark:text-white hover:bg-[#E0E0E0] dark:hover:bg-[#393939] rounded-[4px] transition-colors">Cancel</button>
                  <button onClick={handleAddItems} disabled={selectedToAdd.size === 0} className="px-4 py-2 font-sans font-semibold text-sm text-white bg-[#0F62FE] hover:bg-[#0353E9] disabled:opacity-50 disabled:cursor-not-allowed rounded-[4px] transition-colors shadow-sm">
                    Add {selectedToAdd.size} Cases
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TestRunDetailsPage;
