import { getHeaders } from './projects';
import { TestCase } from './testcases';

const API_URL = 'http://localhost:3000';

export interface TestRunItem {
  id: string;
  testRunId: string;
  testCaseId: string;
  testCase?: TestCase;
  executionStatus: 'TO_DO' | 'PASSED' | 'FAILED';
  retryCount: number;
  notes?: string;
  updatedAt: string;
}

export interface TestRun {
  id: string;
  projectId: string;
  name: string;
  status: 'DRAFT' | 'IN_PROGRESS' | 'AUTOMATION_RUNNING' | 'DONE';
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  environment?: string;
  initiatedBy?: { name: string; email: string };
  items?: TestRunItem[];
  _count?: { items: number };
}

export const testRunsApi = {
  findAll: async (projectId: string) => {
    const res = await fetch(`${API_URL}/testrun?projectId=${projectId}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch test runs');
    return res.json();
  },
  findOne: async (id: string) => {
    const res = await fetch(`${API_URL}/testrun/${id}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch test run');
    return res.json();
  },
  create: async (projectId: string, name: string, environment?: string) => {
    const res = await fetch(`${API_URL}/testrun?projectId=${projectId}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, environment })
    });
    if (!res.ok) throw new Error('Failed to create test run');
    return res.json();
  },
  duplicate: async (projectId: string, sourceRunId: string) => {
    const res = await fetch(`${API_URL}/testrun/duplicate?projectId=${projectId}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ sourceRunId })
    });
    if (!res.ok) throw new Error('Failed to duplicate test run');
    return res.json();
  },
  updateStatus: async (id: string, status: TestRun['status']) => {
    const res = await fetch(`${API_URL}/testrun/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Failed to update status');
    return res.json();
  },
  addItems: async (id: string, testCaseIds: string[]) => {
    const res = await fetch(`${API_URL}/testrun/${id}/items`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ testCaseIds })
    });
    if (!res.ok) throw new Error('Failed to add items');
    return res.json();
  },
  removeItems: async (id: string, testCaseIds: string[]) => {
    const res = await fetch(`${API_URL}/testrun/${id}/items`, {
      method: 'DELETE',
      headers: getHeaders(),
      body: JSON.stringify({ testCaseIds })
    });
    if (!res.ok) throw new Error('Failed to remove items');
    return res.json();
  },
  updateItemStatus: async (id: string, testCaseId: string, executionStatus: string, notes?: string) => {
    const res = await fetch(`${API_URL}/testrun/${id}/items/${testCaseId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ executionStatus, notes })
    });
    if (!res.ok) throw new Error('Failed to update item status');
    return res.json();
  },
  triggerAutomation: async (id: string) => {
    const res = await fetch(`${API_URL}/testrun/${id}/trigger`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to trigger automation');
    return res.json();
  }
};
