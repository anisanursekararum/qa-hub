import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import { useProject } from '../context/ProjectContext';
import {
  FilePlus, Upload, Sparkles, Filter, CheckCircle2, Clock,
  AlertCircle, X, FileText, UploadCloud, Edit3, Trash2, Search
} from 'lucide-react';

import { getProjectModules, createProjectModule, ProjectModule } from '../api/modules';
import { getTestCases, createTestCase, updateTestCase, deleteTestCase, importTestCases, getImportHistory, TestCase, BulkTestCasePayload, ImportHistory } from '../api/testcases';
import { testRunsApi, TestRun } from '../api/testruns';
import Papa from 'papaparse';

interface FilterCondition {
  id: string;
  property: 'Status' | 'Module' | 'Automation' | 'Priority';
  operator: '==' | '!=';
  value: string;
}

export const RepositoryPage: React.FC = () => {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const { activeProject } = useProject();
  const navigate = useNavigate();
  const location = useLocation();

  const [modules, setModules] = useState<ProjectModule[]>([]);
  const [cases, setCases] = useState<TestCase[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filter State
  const [filters, setFilters] = useState<FilterCondition[]>([]);
  const [filterProperty, setFilterProperty] = useState<'Status' | 'Module' | 'Automation' | 'Priority'>('Status');
  const [filterOperator, setFilterOperator] = useState<'==' | '!='>('==');
  const [filterValue, setFilterValue] = useState<string>('DRAFT');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('search');
    if (q) setSearchQuery(q);
  }, [location.search]);

  // Modals state
  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isNewModuleMode, setIsNewModuleMode] = useState(false);
  const [isViewOnlyMode, setIsViewOnlyMode] = useState(false);
  const [isAddToRunModalOpen, setIsAddToRunModalOpen] = useState(false);

  // Active Runs state
  const [activeRuns, setActiveRuns] = useState<TestRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string>('');

  // Bulk Import State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<BulkTestCasePayload[] | null>(null);
  const [importHistory, setImportHistory] = useState<ImportHistory[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const submitActionRef = React.useRef<'UPDATE' | 'READY'>('UPDATE');
  const [formData, setFormData] = useState({
    title: '',
    moduleId: '',
    newModuleName: '',
    newModuleCode: '',
    prerequisite: '',
    steps: '',
    expectedResult: '',
    hasAutomation: false,
    priority: 'MEDIUM' as 'HIGH' | 'MEDIUM' | 'LOW',
    notes: ''
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [navigate]);

  useEffect(() => {
    if (activeProject?.id) {
      loadRepositoryData();
    }
  }, [activeProject?.id]);

  useEffect(() => {
    if (activeProject?.id && isBulkImportOpen) {
      fetchHistory();
    }
  }, [activeProject?.id, isBulkImportOpen, historyPage]);

  const fetchHistory = async () => {
    if (!activeProject?.id) return;
    try {
      const res = await getImportHistory(activeProject.id, historyPage);
      setImportHistory(res.data);
      setHistoryTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error('Failed to fetch import history', err);
    }
  };

  const loadRepositoryData = async () => {
    if (!activeProject?.id) return;
    try {
      const [fetchedModules, fetchedCases] = await Promise.all([
        getProjectModules(activeProject.id),
        getTestCases(activeProject.id)
      ]);
      setModules(fetchedModules);
      setCases(fetchedCases);
    } catch (err) {
      console.error('Failed to fetch repository data', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsImporting(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      quoteChar: '"',
      escapeChar: '"',
      complete: (results) => {
        try {
          const items: BulkTestCasePayload[] = results.data.map((row: any) => ({
            moduleName: row['Module Name'] || 'Imported',
            moduleCode: row['Module Code'] || 'IMP',
            title: row['Title'] || 'Untitled Case',
            prerequisite: row['Prerequisite'] || undefined,
            steps: row['Steps'] || 'No steps provided',
            expectedResult: row['Expected Result'] || undefined,
            notes: row['Notes'] || undefined,
            hasAutomation: String(row['Has Automation']).toUpperCase() === 'TRUE',
            status: 'DRAFT',
            priority: ['HIGH', 'MEDIUM', 'LOW'].includes(String(row['Priority']).toUpperCase())
              ? String(row['Priority']).toUpperCase() as 'HIGH' | 'MEDIUM' | 'LOW'
              : 'MEDIUM'
          }));
          setPreviewData(items);
        } catch (err: any) {
          alert('Failed to parse CSV: ' + err.message);
          setSelectedFile(null);
        } finally {
          setIsImporting(false);
        }
      },
      error: (error) => {
        alert('Error reading CSV file: ' + error.message);
        setIsImporting(false);
        setSelectedFile(null);
      }
    });
  };

  const confirmBulkImport = async () => {
    if (!activeProject?.id || !previewData || !selectedFile) return;
    setIsImporting(true);
    try {
      const res = await importTestCases(activeProject.id, selectedFile.name, previewData);
      alert(`Successfully imported ${res.importedCount} test cases!`);
      setSelectedFile(null);
      setPreviewData(null);
      fetchHistory();
      await loadRepositoryData();
    } catch (err: any) {
      alert('Failed to import CSV: ' + (err.message || 'Unknown error'));
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const cancelBulkImport = () => {
    setSelectedFile(null);
    setPreviewData(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      title: '',
      moduleId: modules[0]?.id || '',
      newModuleName: '',
      newModuleCode: '',
      prerequisite: '',
      steps: '',
      expectedResult: '',
      hasAutomation: false,
      priority: 'MEDIUM',
      notes: ''
    });
    setIsNewModuleMode(false);
    setIsViewOnlyMode(false);
    setIsCaseModalOpen(true);
  };

  const openReviewModal = (tc: TestCase, isView: boolean = false) => {
    setEditingId(tc.id);
    let stepsStr = tc.steps;
    try {
      const parsed = JSON.parse(tc.steps);
      if (Array.isArray(parsed) && parsed.length > 0) {
        stepsStr = parsed[0].step || tc.steps;
      }
    } catch (e) { }

    setFormData({
      title: tc.title,
      moduleId: tc.moduleId,
      newModuleName: '',
      newModuleCode: '',
      prerequisite: tc.prerequisite || '',
      steps: stepsStr,
      expectedResult: tc.expectedResult || '',
      hasAutomation: tc.hasAutomation,
      priority: tc.priority || 'MEDIUM',
      notes: tc.notes || ''
    });
    setIsNewModuleMode(false);
    setIsViewOnlyMode(isView);
    setIsCaseModalOpen(true);
  };

  const handleCaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !activeProject?.id) return;

    let finalModuleId = formData.moduleId;
    let submitStatus: 'DRAFT' | 'READY' = submitActionRef.current === 'READY' ? 'READY' : 'DRAFT';

    try {
      // Handle Custom Module Creation
      if (isNewModuleMode) {
        if (!formData.newModuleName || !formData.newModuleCode) {
          alert('Please fill out the new module name and code.');
          return;
        }
        const newMod = await createProjectModule(activeProject.id, formData.newModuleName, formData.newModuleCode);
        finalModuleId = newMod.id;
      }

      const payload = {
        title: formData.title,
        moduleId: finalModuleId,
        prerequisite: formData.prerequisite || undefined,
        steps: formData.steps,
        expectedResult: formData.expectedResult || undefined,
        hasAutomation: formData.hasAutomation,
        priority: formData.priority,
        status: submitStatus,
        notes: formData.notes || undefined
      };

      if (editingId) {
        const targetStatus = submitActionRef.current === 'READY' ? 'READY' : cases.find(c => c.id === editingId)?.status || 'DRAFT';
        await updateTestCase(editingId, { ...payload, status: targetStatus });
      } else {
        await createTestCase(activeProject.id, payload);
      }

      await loadRepositoryData();
      setIsCaseModalOpen(false);
    } catch (err) {
      console.error('Failed to submit case', err);
      alert('Error submitting test case. Please check module code uniqueness or inputs.');
    }
  };

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };



  const toggleModuleSelection = (moduleCases: TestCase[]) => {
    const next = new Set(selectedIds);
    const allSelected = moduleCases.every(c => selectedIds.has(c.id));

    if (allSelected) {
      // Deselect all
      moduleCases.forEach(c => next.delete(c.id));
    } else {
      // Select all
      moduleCases.forEach(c => next.add(c.id));
    }

    setSelectedIds(next);
  };

  const handleBulkStatusUpdate = async (status: TestCase['status']) => {
    try {
      await Promise.all(
        Array.from(selectedIds).map(id => {
          const tc = cases.find(c => c.id === id);
          if (tc) {
            return updateTestCase(id, {
              title: tc.title,
              moduleId: tc.moduleId,
              prerequisite: tc.prerequisite || undefined,
              steps: tc.steps,
              expectedResult: tc.expectedResult || undefined,
              hasAutomation: tc.hasAutomation,
              priority: tc.priority,
              status,
              notes: tc.notes || undefined
            });
          }
        })
      );
      await loadRepositoryData();
      setSelectedIds(new Set());
    } catch (err) {
      console.error(err);
      alert('Error updating status');
    }
  };

  const handleAddFilter = () => {
    if (!filterValue) return;
    // prevent duplicates
    if (filters.some(f => f.property === filterProperty && f.operator === filterOperator && f.value === filterValue)) return;

    const newFilter: FilterCondition = {
      id: Math.random().toString(36).substr(2, 9),
      property: filterProperty,
      operator: filterOperator,
      value: filterValue
    };
    setFilters([...filters, newFilter]);
  };

  const removeFilter = (id: string) => {
    setFilters(filters.filter(f => f.id !== id));
  };

  if (!user) return null;

  // Filtering Logic
  const filteredCases = cases.filter(tc => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!tc.title.toLowerCase().includes(q) && !tc.publicId.toLowerCase().includes(q)) {
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

  // Pagination logic
  const totalPages = Math.ceil(filteredCases.length / itemsPerPage);
  const paginatedCases = filteredCases.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Group paginated cases
  const groupedCases = paginatedCases.reduce((acc, tc) => {
    const modName = modules.find(m => m.id === tc.moduleId)?.name || 'Unknown';
    if (!acc[modName]) acc[modName] = [];
    acc[modName].push(tc);
    return acc;
  }, {} as Record<string, TestCase[]>);

  const getFilterOptions = () => {
    if (filterProperty === 'Status') return [{ v: 'DRAFT', l: 'DRAFT' }, { v: 'READY', l: 'READY' }, { v: 'DEPRECATED', l: 'DEPRECATED' }];
    if (filterProperty === 'Module') return modules.map(m => ({ v: m.id, l: m.name }));
    if (filterProperty === 'Automation') return [{ v: 'MANUAL', l: 'MANUAL' }, { v: 'AUTOMATED', l: 'AUTOMATED' }, { v: 'FLAKY', l: 'FLAKY' }];
    if (filterProperty === 'Priority') return [{ v: 'HIGH', l: 'HIGH' }, { v: 'MEDIUM', l: 'MEDIUM' }, { v: 'LOW', l: 'LOW' }];
    return [];
  };

  const StatusPill = ({ status }: { status: TestCase['status'] }) => {
    switch (status) {
      case 'READY': return <span className="flex items-center space-x-1 font-mono text-xs text-[#24A148] bg-[#24A148]/10 px-2 py-0.5 rounded-[2px] font-bold"><CheckCircle2 size={12} /><span>READY</span></span>;
      case 'DRAFT': return <span className="flex items-center space-x-1 font-mono text-xs text-[#F1C21B] bg-[#F1C21B]/10 px-2 py-0.5 rounded-[2px] font-bold"><Clock size={12} /><span>DRAFT</span></span>;
      case 'DEPRECATED': return <span className="flex items-center space-x-1 font-mono text-xs text-[#8D8D8D] bg-[#393939] px-2 py-0.5 rounded-[2px] font-bold"><AlertCircle size={12} /><span>DEPRECATED</span></span>;
    }
  };

  const AutoPill = ({ hasAutomation }: { hasAutomation: boolean }) => {
    if (hasAutomation) return <span className="font-mono text-xs text-[#0F62FE] border border-[#0F62FE]/30 px-2 py-0.5 rounded-[2px] font-bold">AUTO</span>;
    return <span className="font-mono text-xs text-[#8D8D8D] border border-[#525252] px-2 py-0.5 rounded-[2px] font-bold">MANUAL</span>;
  };

  const PriorityPill = ({ priority }: { priority: 'HIGH' | 'MEDIUM' | 'LOW' }) => {
    switch (priority) {
      case 'HIGH': return <span className="font-mono text-xs text-[#DA1E28] border border-[#DA1E28]/30 px-2 py-0.5 rounded-[2px] font-bold">HIGH</span>;
      case 'MEDIUM': return <span className="font-mono text-xs text-[#F1C21B] border border-[#F1C21B]/30 px-2 py-0.5 rounded-[2px] font-bold">MED</span>;
      case 'LOW': return <span className="font-mono text-xs text-[#24A148] border border-[#24A148]/30 px-2 py-0.5 rounded-[2px] font-bold">LOW</span>;
      default: return <span className="font-mono text-xs text-[#F1C21B] border border-[#F1C21B]/30 px-2 py-0.5 rounded-[2px] font-bold">MED</span>;
    }
  };

  return (
    <DashboardLayout user={user} onLogout={handleLogout} currentPath="/repository">

      {/* Dynamic Case Form Modal (Create / Review) */}
      {isCaseModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-white dark:bg-[#1C1C21] border border-[#E0E0E0] dark:border-[#393939] rounded-[4px] shadow-xl w-full max-w-3xl my-8 animate-in zoom-in-95">
            <div className="flex justify-between items-center p-5 border-b border-[#E0E0E0] dark:border-[#2D2D39] bg-[#F7F7F7] dark:bg-[#161616] sticky top-0 z-10">
              <div className="flex items-center space-x-2">
                {editingId ? (isViewOnlyMode ? <FileText size={18} className="text-[#0F62FE]" /> : <Edit3 size={18} className="text-[#0F62FE]" />) : <FilePlus size={18} className="text-[#0F62FE]" />}
                <h3 className="font-sans font-bold text-lg text-[#161616] dark:text-white">
                  {editingId ? (isViewOnlyMode ? 'Test Case Details' : 'Test Case Details / Edit') : 'Manual Case Creation'}
                </h3>
              </div>
              <button onClick={() => setIsCaseModalOpen(false)} className="text-[#757575] hover:text-[#161616] dark:text-[#8D8D8D] dark:hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCaseSubmit}>
              <div className="p-6 space-y-6">

                {/* Header Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block font-sans text-sm font-semibold text-[#161616] dark:text-white mb-1.5">Project</label>
                    <input type="text" readOnly value={activeProject?.name || ''} className="w-full bg-[#E0E0E0] dark:bg-[#2D2D39] border border-[#CCCCCC] dark:border-[#393939] rounded-[4px] px-3 py-2 font-sans text-sm text-[#525252] dark:text-[#A8A8A8] cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block font-sans text-sm font-semibold text-[#161616] dark:text-white mb-1.5">Test Case ID</label>
                    <input type="text" readOnly value={editingId ? cases.find(c => c.id === editingId)?.publicId : 'Auto-generated by system'} className="w-full bg-[#E0E0E0] dark:bg-[#2D2D39] border border-[#CCCCCC] dark:border-[#393939] rounded-[4px] px-3 py-2 font-mono text-sm text-[#525252] dark:text-[#A8A8A8] cursor-not-allowed" />
                  </div>
                </div>

                {/* Module Section */}
                <div className="bg-[#F7F7F7] dark:bg-[#121212] p-4 rounded-[4px] border border-[#E0E0E0] dark:border-[#393939]">
                  <div className="flex justify-between items-center mb-3">
                    <label className="font-sans text-sm font-bold text-[#161616] dark:text-white uppercase tracking-wider">Module Assignment</label>
                    {!isViewOnlyMode && (
                      !isNewModuleMode ? (
                        <button type="button" onClick={() => setIsNewModuleMode(true)} className="text-[#0F62FE] text-sm font-semibold hover:underline">Customize / New Module</button>
                      ) : (
                        <button type="button" onClick={() => setIsNewModuleMode(false)} className="text-[#DA1E28] text-sm font-semibold hover:underline">Cancel Custom Module</button>
                      )
                    )}
                  </div>

                  {!isNewModuleMode ? (
                    <select required value={formData.moduleId} disabled={isViewOnlyMode} onChange={e => setFormData({ ...formData, moduleId: e.target.value })} className="w-full bg-white dark:bg-[#1C1C21] border border-[#CCCCCC] dark:border-[#393939] rounded-[4px] px-3 py-2 font-sans text-sm text-[#161616] dark:text-white focus:outline-none focus:border-[#0F62FE] disabled:bg-[#E0E0E0] dark:disabled:bg-[#2D2D39]">
                      <option value="" disabled>Select an existing module...</option>
                      {modules.map(m => <option key={m.id} value={m.id}>{m.name} ({m.code})</option>)}
                    </select>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <input type="text" required readOnly={isViewOnlyMode} placeholder="Module Name (e.g. Shopping Cart)" value={formData.newModuleName} onChange={e => setFormData({ ...formData, newModuleName: e.target.value })} className="w-full bg-white dark:bg-[#1C1C21] border border-[#0F62FE] rounded-[4px] px-3 py-2 font-sans text-sm text-[#161616] dark:text-white focus:outline-none read-only:bg-[#E0E0E0] dark:read-only:bg-[#2D2D39] read-only:border-[#CCCCCC] dark:read-only:border-[#393939]" />
                      </div>
                      <div>
                        <input type="text" required readOnly={isViewOnlyMode} placeholder="Module Code (e.g. CART)" value={formData.newModuleCode} onChange={e => setFormData({ ...formData, newModuleCode: e.target.value })} className="w-full bg-white dark:bg-[#1C1C21] border border-[#0F62FE] rounded-[4px] px-3 py-2 font-mono text-sm text-[#161616] dark:text-white focus:outline-none uppercase read-only:bg-[#E0E0E0] dark:read-only:bg-[#2D2D39] read-only:border-[#CCCCCC] dark:read-only:border-[#393939]" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Main Fields */}
                <div>
                  <label className="block font-sans text-sm font-semibold text-[#161616] dark:text-white mb-1.5">Case Title *</label>
                  <input type="text" required readOnly={isViewOnlyMode} value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Clear, concise description of the test" className="w-full bg-[#F4F4F4] dark:bg-[#121212] border border-[#CCCCCC] dark:border-[#393939] rounded-[4px] px-3 py-2 font-sans text-sm text-[#161616] dark:text-white focus:outline-none focus:border-[#0F62FE] read-only:cursor-default" />
                </div>

                <div>
                  <label className="block font-sans text-sm font-semibold text-[#161616] dark:text-white mb-1.5">Prerequisite *</label>
                  <textarea value={formData.prerequisite} required readOnly={isViewOnlyMode} onChange={e => setFormData({ ...formData, prerequisite: e.target.value })} placeholder="Any required state before executing (e.g., User must be logged in)" rows={2} className="w-full bg-[#F4F4F4] dark:bg-[#121212] border border-[#CCCCCC] dark:border-[#393939] rounded-[4px] px-3 py-2 font-sans text-sm text-[#161616] dark:text-white focus:outline-none focus:border-[#0F62FE] resize-none read-only:cursor-default" />
                </div>

                {/* Priority Selection */}
                <div>
                  <label className="block font-sans text-sm font-semibold text-[#161616] dark:text-white mb-1.5">Priority</label>
                  <select
                    value={formData.priority}
                    disabled={isViewOnlyMode}
                    onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full md:w-1/3 bg-[#F4F4F4] dark:bg-[#121212] border border-[#CCCCCC] dark:border-[#393939] rounded-[4px] px-3 py-2 font-sans text-sm text-[#161616] dark:text-white focus:outline-none focus:border-[#0F62FE] disabled:cursor-default"
                  >
                    <option value="HIGH">High Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="LOW">Low Priority</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block font-sans text-sm font-semibold text-[#161616] dark:text-white mb-1.5">Test Steps</label>
                    <textarea value={formData.steps} readOnly={isViewOnlyMode} onChange={e => setFormData({ ...formData, steps: e.target.value })} placeholder="1. Navigate to...\n2. Click on..." rows={4} className="w-full bg-[#F4F4F4] dark:bg-[#121212] border border-[#CCCCCC] dark:border-[#393939] rounded-[4px] px-3 py-2 font-mono text-sm text-[#161616] dark:text-white focus:outline-none focus:border-[#0F62FE] resize-none read-only:cursor-default" />
                  </div>
                  <div>
                    <label className="block font-sans text-sm font-semibold text-[#161616] dark:text-white mb-1.5">Expected Result</label>
                    <textarea value={formData.expectedResult} readOnly={isViewOnlyMode} onChange={e => setFormData({ ...formData, expectedResult: e.target.value })} placeholder="System should display success modal..." rows={4} className="w-full bg-[#F4F4F4] dark:bg-[#121212] border border-[#CCCCCC] dark:border-[#393939] rounded-[4px] px-3 py-2 font-sans text-sm text-[#161616] dark:text-white focus:outline-none focus:border-[#0F62FE] resize-none read-only:cursor-default" />
                  </div>
                </div>

                <div className="flex items-center space-x-3 pt-2">
                  <input type="checkbox" id="hasAutomation" disabled={isViewOnlyMode} checked={formData.hasAutomation} onChange={e => setFormData({ ...formData, hasAutomation: e.target.checked })} className="w-4 h-4 text-[#0F62FE] bg-[#F4F4F4] dark:bg-[#121212] border-gray-300 rounded disabled:opacity-50" />
                  <label htmlFor="hasAutomation" className="font-sans text-sm text-[#161616] dark:text-white font-semibold">Automated script available</label>
                </div>

                {/* Notes Section */}
                <div>
                  <label className="block font-sans text-sm font-semibold text-[#161616] dark:text-white mb-1.5">Notes</label>
                  <textarea value={formData.notes} readOnly={isViewOnlyMode} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Additional context..." rows={2} className="w-full bg-[#F4F4F4] dark:bg-[#121212] border border-[#CCCCCC] dark:border-[#393939] rounded-[4px] px-3 py-2 font-sans text-sm text-[#161616] dark:text-white focus:outline-none focus:border-[#0F62FE] resize-none read-only:cursor-default" />
                </div>

                {/* History Section */}
                {editingId && (
                  <div className="mt-8 pt-6 border-t border-[#E0E0E0] dark:border-[#393939] grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(() => {
                      const tc = cases.find(c => c.id === editingId);
                      if (!tc) return null;
                      return (
                        <>
                          <div className="text-sm text-[#525252] dark:text-[#A8A8A8]">
                            <span className="font-bold text-[#161616] dark:text-white">Created by: </span>
                            {tc.createdBy?.name || 'System'} ({new Date(tc.createdAt).toLocaleString()})
                          </div>
                          <div className="text-sm text-[#525252] dark:text-[#A8A8A8]">
                            <span className="font-bold text-[#161616] dark:text-white">Last updated by: </span>
                            {tc.updatedBy?.name || tc.createdBy?.name || 'System'} ({tc.updatedAt ? new Date(tc.updatedAt).toLocaleString() : new Date(tc.createdAt).toLocaleString()})
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>

              <div className="p-5 border-t border-[#E0E0E0] dark:border-[#2D2D39] bg-[#F7F7F7] dark:bg-[#161616] flex justify-end space-x-3 sticky bottom-0">
                {isViewOnlyMode ? (
                  <button type="button" onClick={() => setIsCaseModalOpen(false)} className="px-4 py-2 font-sans font-semibold text-sm text-white bg-[#0F62FE] hover:bg-[#0353E9] rounded-[4px] transition-colors shadow-sm">Close</button>
                ) : (
                  <>
                    <button type="button" onClick={() => setIsCaseModalOpen(false)} className="px-4 py-2 font-sans font-semibold text-sm text-[#525252] dark:text-[#A8A8A8] hover:text-[#161616] dark:hover:text-white transition-colors">Cancel</button>
                    {editingId ? (
                      <>
                        <button type="submit" onClick={() => submitActionRef.current = 'UPDATE'} className="px-4 py-2 font-sans font-semibold text-sm text-[#0F62FE] border border-[#0F62FE] hover:bg-[#0F62FE]/10 rounded-[4px] transition-colors shadow-sm">
                          Update
                        </button>
                        <button type="submit" onClick={() => submitActionRef.current = 'READY'} className="px-4 py-2 font-sans font-semibold text-sm text-white bg-[#24A148] hover:bg-[#198038] rounded-[4px] transition-colors shadow-sm">
                          Set Ready
                        </button>
                      </>
                    ) : (
                      <button type="submit" className="px-4 py-2 font-sans font-semibold text-sm text-white bg-[#0F62FE] hover:bg-[#0353E9] rounded-[4px] transition-colors shadow-sm">
                        Create Case
                      </button>
                    )}
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk CSV Import Modal */}
      {isBulkImportOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#1C1C21] border border-[#E0E0E0] dark:border-[#393939] rounded-[4px] shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex justify-between items-center p-5 border-b border-[#E0E0E0] dark:border-[#2D2D39] bg-[#F7F7F7] dark:bg-[#161616] sticky top-0 z-10">
              <div className="flex items-center space-x-2">
                <Upload size={18} className="text-[#161616] dark:text-white" />
                <h3 className="font-sans font-bold text-lg text-[#161616] dark:text-white">Bulk CSV Import</h3>
              </div>
              <button onClick={() => { setIsBulkImportOpen(false); cancelBulkImport(); }} disabled={isImporting} className="text-[#757575] hover:text-[#161616] dark:text-[#8D8D8D] dark:hover:text-white transition-colors disabled:opacity-50">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              {!previewData ? (
                <>
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                  />
                  <div
                    onClick={() => !isImporting && fileInputRef.current?.click()}
                    className={`border-2 border-dashed border-[#CCCCCC] dark:border-[#393939] rounded-[4px] p-10 flex flex-col items-center justify-center text-center mb-8 bg-[#F7F7F7] dark:bg-[#121212] ${isImporting ? 'opacity-50 cursor-wait' : 'hover:border-[#0F62FE] cursor-pointer'}`}
                  >
                    <UploadCloud size={32} className={`${isImporting ? 'text-[#0F62FE] animate-bounce' : 'text-[#525252] dark:text-[#A8A8A8]'} mb-4`} />
                    <h4 className="font-sans font-bold text-[#161616] dark:text-white mb-1">
                      {isImporting ? 'Parsing CSV...' : 'Click to select CSV file'}
                    </h4>
                    {!isImporting && <p className="text-sm text-[#757575] mt-2">Ensure headers exactly match the template</p>}
                  </div>
                </>
              ) : (
                <div className="mb-8 p-6 border border-[#0F62FE] bg-[#F7F7F7] dark:bg-[#121212] rounded-[4px] flex flex-col items-center justify-center">
                  <FileText size={48} className="text-[#0F62FE] mb-4" />
                  <h4 className="font-sans font-bold text-[#161616] dark:text-white mb-2">{selectedFile?.name}</h4>
                  <p className="text-sm text-[#525252] dark:text-[#A8A8A8] mb-6">
                    Ready to import <strong className="text-[#161616] dark:text-white">{previewData.length}</strong> test cases. Status will be initialized as <strong>DRAFT</strong>.
                  </p>
                  <div className="flex space-x-4">
                    <button onClick={cancelBulkImport} disabled={isImporting} className="px-6 py-2 font-sans font-semibold text-sm text-[#525252] dark:text-[#A8A8A8] hover:text-[#161616] dark:hover:text-white transition-colors disabled:opacity-50">
                      Cancel
                    </button>
                    <button onClick={confirmBulkImport} disabled={isImporting} className="px-6 py-2 font-sans font-semibold text-sm text-white bg-[#0F62FE] hover:bg-[#0353E9] rounded-[4px] transition-colors shadow-sm disabled:opacity-50">
                      {isImporting ? 'Importing...' : 'Submit Import'}
                    </button>
                  </div>
                </div>
              )}

              {/* History Table */}
              <div className="mt-8">
                <h4 className="font-sans font-bold text-sm text-[#161616] dark:text-white mb-4">Import History</h4>
                <div className="border border-[#E0E0E0] dark:border-[#393939] rounded-[4px] overflow-hidden bg-white dark:bg-[#1C1C21]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#F4F4F4] dark:bg-[#2D2D39] border-b border-[#E0E0E0] dark:border-[#393939]">
                        <th className="px-4 py-3 font-sans text-sm font-semibold text-[#161616] dark:text-white">File Name</th>
                        <th className="px-4 py-3 font-sans text-sm font-semibold text-[#161616] dark:text-white text-right">Row Count</th>
                        <th className="px-4 py-3 font-sans text-sm font-semibold text-[#161616] dark:text-white">Uploaded By</th>
                        <th className="px-4 py-3 font-sans text-sm font-semibold text-[#161616] dark:text-white">Timestamp</th>
                        <th className="px-4 py-3 font-sans text-sm font-semibold text-[#161616] dark:text-white">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importHistory.length === 0 ? (
                        <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-[#757575] dark:text-[#8D8D8D]">No history found.</td></tr>
                      ) : (
                        importHistory.map((h) => (
                          <tr key={h.id} className="border-b border-[#E0E0E0] dark:border-[#393939] hover:bg-[#F9F9F9] dark:hover:bg-[#121212] transition-colors">
                            <td className="px-4 py-3 text-sm text-[#161616] dark:text-white truncate max-w-[150px]">{h.fileName}</td>
                            <td className="px-4 py-3 text-sm text-[#161616] dark:text-white text-right">{h.rowCount}</td>
                            <td className="px-4 py-3 text-sm text-[#525252] dark:text-[#A8A8A8] truncate max-w-[150px]">{h.uploadedBy?.name || 'Unknown'}</td>
                            <td className="px-4 py-3 text-sm text-[#525252] dark:text-[#A8A8A8]">{new Date(h.createdAt).toLocaleString()}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-sm font-bold ${h.status === 'SUCCESS' ? 'bg-[#DEFBE6] text-[#198038] dark:bg-[#198038]/20 dark:text-[#24A148]' : 'bg-[#FFF1F1] text-[#DA1E28] dark:bg-[#DA1E28]/20 dark:text-[#FA4D56]'}`}>
                                {h.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  {/* Pagination Controls */}
                  {historyTotalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-[#E0E0E0] dark:border-[#393939] bg-[#F4F4F4] dark:bg-[#161616]">
                      <button
                        disabled={historyPage === 1}
                        onClick={() => setHistoryPage(p => p - 1)}
                        className="text-sm font-semibold text-[#0F62FE] disabled:text-[#A8A8A8] disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-[#525252] dark:text-[#8D8D8D]">Page {historyPage} of {historyTotalPages}</span>
                      <button
                        disabled={historyPage === historyTotalPages}
                        onClick={() => setHistoryPage(p => p + 1)}
                        className="text-sm font-semibold text-[#0F62FE] disabled:text-[#A8A8A8] disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      <div className="p-6 sm:p-8 max-w-7xl mx-auto min-h-full pb-32">
        {!activeProject ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 bg-[#F4F4F4] dark:bg-[#1C1C21] rounded-full flex items-center justify-center mb-4">
              <AlertCircle size={24} className="text-[#0F62FE]" />
            </div>
            <h2 className="font-sans font-bold text-2xl text-[#161616] dark:text-white mb-2">No Workspace Selected</h2>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="mb-8">
              <h1 className="font-sans font-black text-3xl text-[#161616] dark:text-white tracking-tight mb-2">Test Repository</h1>
              <p className="font-sans text-sm text-[#525252] dark:text-[#A8A8A8]">
                Manage cases for <span className="font-bold">{activeProject.name}</span>.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <button onClick={openCreateModal} className="flex items-start p-5 bg-white dark:bg-[#1C1C21] border border-[#E0E0E0] dark:border-[#2D2D39] rounded-[4px] hover:border-[#0F62FE] transition-colors group">
                <div className="w-10 h-10 bg-[#F4F4F4] dark:bg-[#121212] flex items-center justify-center rounded-[4px] mr-4"><FilePlus size={20} className="text-[#0F62FE]" /></div>
                <div className="text-left"><h3 className="font-bold text-sm mb-1 text-black dark:text-white">Manual Create</h3><p className="text-sm text-[#757575] dark:text-[#8D8D8D]">Write from scratch.</p></div>
              </button>
              <button onClick={() => setIsBulkImportOpen(true)} className="flex items-start p-5 bg-white dark:bg-[#1C1C21] border border-[#E0E0E0] dark:border-[#2D2D39] rounded-[4px] hover:border-[#0F62FE] transition-colors group">
                <div className="w-10 h-10 bg-[#F4F4F4] dark:bg-[#121212] flex items-center justify-center rounded-[4px] mr-4"><Upload size={20} className="text-black dark:text-white" /></div>
                <div className="text-left"><h3 className="font-bold text-sm mb-1 text-black dark:text-white">Bulk CSV Import</h3><p className="text-sm text-[#757575] dark:text-[#8D8D8D]">Import legacy cases.</p></div>
              </button>
              <button className="flex items-start p-5 bg-[#F6F2FF] dark:bg-[#121212] border-2 border-dashed border-[#8A3FFC]/50 rounded-[4px] group hover:border-[#8A3FFC] transition-colors">
                <div className="w-10 h-10 bg-[#8A3FFC]/10 flex items-center justify-center rounded-[4px] mr-4"><Sparkles size={20} className="text-[#8A3FFC]" /></div>
                <div className="text-left"><h3 className="font-bold text-sm text-[#8A3FFC] dark:text-white mb-1">AI PRD Ingestion</h3><p className="text-sm text-[#525252] dark:text-[#8D8D8D]">Upload your PRD in PDF format here.</p></div>
              </button>
            </div>

            {/* Flexible Filter & Search */}
            <div className="flex flex-col md:flex-row gap-4 items-center bg-white dark:bg-[#1C1C21] border border-[#E0E0E0] dark:border-[#2D2D39] p-3 rounded-[4px] mb-4 shadow-sm sticky top-0 z-10">

              {/* Search Bar */}
              <div className="flex-1 flex items-center bg-[#F4F4F4] dark:bg-[#121212] border border-[#CCCCCC] dark:border-[#393939] rounded-[4px] px-3 py-1.5 w-full md:w-auto">
                <Search size={16} className="text-[#757575] dark:text-[#8D8D8D] mr-2 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search by ID or Title..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm text-[#161616] dark:text-white w-full placeholder-[#A8A8A8]"
                />
              </div>

              {/* Vertical Divider */}
              <div className="hidden md:block w-px h-6 bg-[#E0E0E0] dark:bg-[#393939]"></div>

              <div className="flex items-center space-x-2 w-full md:w-auto">
                <Filter size={16} className="text-[#757575] dark:text-[#8D8D8D] ml-2" />
                <select value={filterProperty} onChange={e => {
                  const prop = e.target.value as any;
                  setFilterProperty(prop);
                  if (prop === 'Status') setFilterValue('DRAFT');
                  else if (prop === 'Module') setFilterValue(modules[0]?.id || '');
                  else if (prop === 'Automation') setFilterValue('MANUAL');
                  else if (prop === 'Priority') setFilterValue('HIGH');
                }} className="bg-[#F4F4F4] dark:bg-[#121212] border border-[#CCCCCC] dark:border-[#393939] text-sm px-2 py-1 rounded-[2px] focus:outline-none dark:text-white text-[#161616]">
                  <option value="Status">Status</option>
                  <option value="Module">Module</option>
                  <option value="Automation">Automation</option>
                  <option value="Priority">Priority</option>
                </select>
                <select value={filterOperator} onChange={e => setFilterOperator(e.target.value as any)} className="bg-transparent text-sm text-[#0F62FE] font-mono focus:outline-none">
                  <option value="==">IS</option>
                  <option value="!=">IS NOT</option>
                </select>
                <select value={filterValue} onChange={e => setFilterValue(e.target.value)} className="bg-[#F4F4F4] dark:bg-[#121212] border border-[#CCCCCC] dark:border-[#393939] text-sm px-2 py-1 rounded-[2px] focus:outline-none dark:text-white flex-1 min-w-[120px]">
                  {getFilterOptions().map(opt => <option key={opt.v} value={opt.v}>{opt.l}</option>)}
                </select>
                <button onClick={handleAddFilter} className="bg-[#0F62FE] hover:bg-[#0353E9] text-white px-3 py-1 rounded-[2px] text-sm font-semibold transition-colors">
                  Add
                </button>
              </div>
            </div>

            {/* Active Filters */}
            {filters.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6 animate-in slide-in-from-top-2">
                {filters.map(f => {
                  const valLabel = f.property === 'Module' ? (modules.find(m => m.id === f.value)?.name || f.value) : f.value;
                  return (
                    <div key={f.id} className="flex items-center space-x-1.5 bg-[#E8E8E8] dark:bg-[#2D2D39] text-[#161616] dark:text-white px-3 py-1 rounded-full text-sm font-semibold shadow-sm">
                      <span className="text-[#525252] dark:text-[#A8A8A8] font-normal">{f.property}</span>
                      <span className="text-[#0F62FE] font-mono mx-0.5">{f.operator}</span>
                      <span>{valLabel}</span>
                      <button onClick={() => removeFilter(f.id)} className="ml-1.5 text-[#757575] hover:text-[#DA1E28] transition-colors rounded-full p-0.5 hover:bg-[#DA1E28]/10">
                        <X size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* List with Checkboxes */}
            <div className="space-y-6">
              {Object.entries(groupedCases).map(([moduleName, moduleCases]) => (
                <div key={moduleName} className="bg-white dark:bg-[#1C1C21] border border-[#E0E0E0] dark:border-[#2D2D39] rounded-[4px] shadow-sm">
                  <div className="bg-[#F7F7F7] dark:bg-[#161616] px-5 py-3 border-b border-[#E0E0E0] dark:border-[#2D2D39] flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <input
                        type="checkbox"
                        onChange={() => toggleModuleSelection(moduleCases)}
                        checked={moduleCases.length > 0 && moduleCases.every(mc => selectedIds.has(mc.id))}
                        ref={input => {
                          if (input) {
                            const someSelected = moduleCases.some(mc => selectedIds.has(mc.id));
                            const allSelected = moduleCases.every(mc => selectedIds.has(mc.id));
                            input.indeterminate = someSelected && !allSelected;
                          }
                        }}
                        className="w-4 h-4 rounded text-[#0F62FE] border-gray-300 focus:ring-[#0F62FE] bg-[#F4F4F4] dark:bg-[#1C1C21]"
                      />
                      <h3 className="font-mono font-bold text-sm uppercase text-[#161616] dark:text-white">Module: {moduleName}</h3>
                    </div>
                  </div>
                  <div className="divide-y divide-[#E0E0E0] dark:divide-[#2D2D39]">
                    {moduleCases.map(tc => (
                      <div key={tc.id} className="p-4 hover:bg-[#F4F4F4] dark:hover:bg-[#161616]/50 flex flex-col sm:flex-row justify-between items-center">
                        <div className="flex items-center space-x-4">
                          <input type="checkbox" checked={selectedIds.has(tc.id)} onChange={() => toggleSelection(tc.id)} className="w-4 h-4 rounded text-[#0F62FE] border-gray-300 focus:ring-[#0F62FE] bg-[#F4F4F4] dark:bg-[#1C1C21]" />
                          <div className="font-mono text-sm font-bold text-[#0F62FE] w-24 cursor-pointer hover:underline" onClick={() => openReviewModal(tc, tc.status === 'DEPRECATED')}>{tc.publicId}</div>
                          <div>
                            <h4 className="font-sans text-sm font-semibold text-[#161616] dark:text-white cursor-pointer hover:underline" onClick={() => openReviewModal(tc, tc.status === 'DEPRECATED')}>{tc.title}</h4>
                            <div className="flex space-x-2 mt-1">
                              <PriorityPill priority={tc.priority || 'MEDIUM'} />
                              <StatusPill status={tc.status} />
                              <AutoPill hasAutomation={tc.hasAutomation} />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                          {tc.status === 'DRAFT' && (
                            <button onClick={() => openReviewModal(tc, false)} className="bg-[#0F62FE] hover:bg-[#0353E9] text-white text-sm px-3 py-1.5 rounded-[4px]">Review & Submit</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between px-4 py-3 border border-[#E0E0E0] dark:border-[#393939] bg-white dark:bg-[#1C1C21] rounded-[4px] shadow-sm">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="text-sm font-semibold text-[#0F62FE] disabled:text-[#A8A8A8] disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-[#525252] dark:text-[#8D8D8D] font-mono">
                  Page {currentPage} of {totalPages}
                </span>
                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="text-sm font-semibold text-[#0F62FE] disabled:text-[#A8A8A8] disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}

            {/* Sticky Bulk Action Bar */}
            {selectedIds.size > 0 && (
              <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-[#161616] border border-[#393939] shadow-2xl rounded-full px-6 py-3 flex items-center space-x-6 z-50 animate-in slide-in-from-bottom-10">
                <span className="font-sans font-bold text-sm text-white">{selectedIds.size} selected</span>
                <div className="h-4 w-px bg-[#393939]"></div>
                <div className="flex items-center space-x-3">
                  <select onChange={e => handleBulkStatusUpdate(e.target.value as any)} className="bg-[#1C1C21] text-sm font-bold text-white px-3 py-1.5 rounded-[4px] border border-[#393939] focus:outline-none">
                    <option value="">Update Status...</option>
                    <option value="READY">Mark READY</option>
                    <option value="DRAFT">Mark DRAFT</option>
                    <option value="DEPRECATED">Mark DEPRECATED</option>
                  </select>
                  <button onClick={async () => {
                    try {
                      const runs = await testRunsApi.findAll(activeProject!.id);
                      const openRuns = runs.filter((r: any) => r.status === 'DRAFT' || r.status === 'IN_PROGRESS');
                      setActiveRuns(openRuns);
                      if (openRuns.length > 0) {
                        setSelectedRunId(openRuns[0].id);
                      }
                      setIsAddToRunModalOpen(true);
                    } catch (err) {
                      console.error(err);
                    }
                  }} className="text-white hover:text-[#0F62FE] text-sm font-bold px-3 py-1.5 transition-colors">
                    Add to Test Run
                  </button>
                  <button onClick={async () => {
                    try {
                      await Promise.all(Array.from(selectedIds).map(id => deleteTestCase(id)));
                      await loadRepositoryData();
                      setSelectedIds(new Set());
                    } catch (err: any) {
                      alert('Error deleting test case: ' + (err.message || 'Unknown error. Make sure it is not part of a test run.'));
                    }
                  }} className="text-[#DA1E28] hover:text-[#BA1B23] p-1.5 rounded-full hover:bg-[#DA1E28]/10"><Trash2 size={16} /></button>
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {/* Add To Test Run Modal */}
      {isAddToRunModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#1C1C21] border border-[#E0E0E0] dark:border-[#393939] rounded-[4px] shadow-xl w-full max-w-md animate-in zoom-in-95">
            <div className="p-5 border-b border-[#E0E0E0] dark:border-[#2D2D39] bg-[#F7F7F7] dark:bg-[#161616] flex justify-between items-center">
              <h3 className="font-sans font-bold text-lg text-[#161616] dark:text-white">Add to Test Run</h3>
              <button onClick={() => setIsAddToRunModalOpen(false)} className="text-[#757575] hover:text-[#161616] dark:text-[#8D8D8D] dark:hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-5">
              <div className="mb-4">
                <label className="block font-sans text-sm font-semibold text-[#525252] dark:text-[#A8A8A8] uppercase tracking-wider mb-2">Select Active Run</label>
                {activeRuns.length > 0 ? (
                  <select
                    value={selectedRunId}
                    onChange={e => setSelectedRunId(e.target.value)}
                    className="w-full bg-[#F4F4F4] dark:bg-[#121212] border border-[#CCCCCC] dark:border-[#393939] rounded-[4px] px-3 py-2 text-sm text-[#161616] dark:text-white focus:outline-none focus:border-[#0F62FE]"
                  >
                    {activeRuns.map(run => (
                      <option key={run.id} value={run.id}>{run.name} ({run.status})</option>
                    ))}
                  </select>
                ) : (
                  <div className="text-sm text-[#DA1E28]">No active or draft test runs available. Create one first.</div>
                )}
              </div>
              <p className="text-sm text-[#525252] dark:text-[#A8A8A8] mb-6">You are adding <strong>{selectedIds.size}</strong> test cases.</p>

              <div className="flex justify-end space-x-3">
                <button onClick={() => setIsAddToRunModalOpen(false)} className="px-4 py-2 font-sans font-semibold text-sm text-[#161616] dark:text-white hover:bg-[#E0E0E0] dark:hover:bg-[#393939] rounded-[4px] transition-colors">Cancel</button>
                <button
                  onClick={async () => {
                    if (!selectedRunId) return;
                    try {
                      await testRunsApi.addItems(selectedRunId, Array.from(selectedIds));
                      alert('Successfully added test cases to run!');
                      setIsAddToRunModalOpen(false);
                      setSelectedIds(new Set());
                    } catch (err: any) {
                      alert('Failed to add to test run: ' + (err.message || 'Unknown error'));
                    }
                  }}
                  disabled={!selectedRunId}
                  className="px-4 py-2 font-sans font-semibold text-sm text-white bg-[#0F62FE] hover:bg-[#0353E9] disabled:opacity-50 disabled:cursor-not-allowed rounded-[4px] transition-colors shadow-sm"
                >
                  Add to Run
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
};

export default RepositoryPage;
