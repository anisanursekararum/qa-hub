// @ts-ignore
const API_URL = import.meta.env.VITE_API_URL || '/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

export interface DashboardSummary {
  stats: {
    activeRuns: number;
    openDefects: number;
    testCoverage: number;
    aiEfficiency: number;
  };
  projects: {
    id: string;
    name: string;
    description: string;
    membersCount: number;
    runsCount: number;
  }[];
  activities: {
    id: string;
    title: string;
    description: string;
    time: string;
    user: string;
    type?: string;
    linkId?: string;
  }[];
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

export const dashboardApi = {
  getSummary: async (): Promise<DashboardSummary> => {
    const res = await fetch(`${API_URL}/dashboard/summary`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!res.ok) {
      throw new Error('Failed to fetch dashboard summary');
    }
    return res.json();
  }
};
