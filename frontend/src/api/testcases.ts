import { getHeaders } from './projects';
import { ProjectModule } from './modules';

const API_URL = 'http://localhost:3000';

export interface TestCasePayload {
  title: string;
  moduleId: string;
  prerequisite?: string;
  steps: string;
  expectedResult?: string;
  hasAutomation: boolean;
  status?: 'DRAFT' | 'READY' | 'DEPRECATED';
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  notes?: string;
}

export interface TestCase {
  id: string;
  projectId: string;
  publicId: string;
  title: string;
  moduleId: string;
  module: ProjectModule;
  prerequisite: string | null;
  steps: string; // JSON string
  expectedResult: string | null;
  hasAutomation: boolean;
  status: 'DRAFT' | 'READY' | 'DEPRECATED';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  createdVia: 'FORM' | 'BULK_UPLOAD' | 'AI_GENERATED';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: { name: string; email: string } | null;
  updatedBy: { name: string; email: string } | null;
}

export const getTestCases = async (projectId: string): Promise<TestCase[]> => {
  const res = await fetch(`${API_URL}/testcase?projectId=${projectId}`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch test cases');
  return res.json();
};

export const createTestCase = async (projectId: string, data: TestCasePayload): Promise<TestCase> => {
  const res = await fetch(`${API_URL}/testcase?projectId=${projectId}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to create test case');
  }
  return res.json();
};

export const updateTestCase = async (id: string, data: TestCasePayload): Promise<TestCase> => {
  const res = await fetch(`${API_URL}/testcase/${id}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to update test case');
  }
  return res.json();
};

export const deleteTestCase = async (id: string): Promise<void> => {
  const res = await fetch(`${API_URL}/testcase/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to delete test case');
  }
};

export interface BulkTestCasePayload {
  moduleName: string;
  moduleCode: string;
  title: string;
  prerequisite?: string;
  steps: string;
  expectedResult?: string;
  hasAutomation: boolean;
  status: 'DRAFT' | 'READY' | 'DEPRECATED';
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  notes?: string;
}

export const importTestCases = async (projectId: string, fileName: string, items: BulkTestCasePayload[]): Promise<{ importedCount: number }> => {
  const res = await fetch(`${API_URL}/testcase/bulk?projectId=${projectId}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ fileName, items }),
  });
  if (!res.ok) throw new Error('Failed to import test cases');
  return res.json();
};

export interface ImportHistory {
  id: string;
  fileName: string;
  rowCount: number;
  uploadedBy: { name: string; email: string };
  status: string;
  createdAt: string;
}

export interface ImportHistoryResponse {
  data: ImportHistory[];
  total: number;
  page: number;
  totalPages: number;
}

export const getImportHistory = async (projectId: string, page: number = 1): Promise<ImportHistoryResponse> => {
  const res = await fetch(`${API_URL}/testcase/bulk/history?projectId=${projectId}&page=${page}`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch import history');
  return res.json();
};

export const getPrdImportHistory = async (projectId: string, page: number = 1): Promise<ImportHistoryResponse> => {
  const res = await fetch(`${API_URL}/testcase/prd/history?projectId=${projectId}&page=${page}`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch PRD import history');
  return res.json();
};

export const generateTestCasesFromPdf = async (projectId: string, file: File): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);

  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/testcase/sync-prd?projectId=${projectId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to generate test cases from PDF');
  }
  return res.json();
};
