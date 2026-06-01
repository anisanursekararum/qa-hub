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
}

export interface TestCase {
  id: string;
  publicId: string;
  title: string;
  moduleId: string;
  module: ProjectModule;
  prerequisite: string | null;
  steps: string; // JSON string
  expectedResult: string | null;
  hasAutomation: boolean;
  status: 'DRAFT' | 'READY' | 'DEPRECATED';
  createdBy: { name: string; email: string };
  createdAt: string;
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
  if (!res.ok) throw new Error('Failed to create test case');
  return res.json();
};

export const updateTestCase = async (id: string, data: TestCasePayload): Promise<TestCase> => {
  const res = await fetch(`${API_URL}/testcase/${id}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update test case');
  return res.json();
};

export const deleteTestCase = async (id: string): Promise<void> => {
  const res = await fetch(`${API_URL}/testcase/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete test case');
};
