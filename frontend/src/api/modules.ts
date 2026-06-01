import { getHeaders } from './projects';

const API_URL = 'http://localhost:3000';

export interface ProjectModule {
  id: string;
  name: string;
  code: string;
  currentSequence: number;
}

export const getProjectModules = async (projectId: string): Promise<ProjectModule[]> => {
  const res = await fetch(`${API_URL}/project/${projectId}/modules`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch modules');
  return res.json();
};

export const createProjectModule = async (projectId: string, name: string, code: string): Promise<ProjectModule> => {
  const res = await fetch(`${API_URL}/project/${projectId}/modules`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ name, code }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || 'Failed to create module');
  }
  return res.json();
};
