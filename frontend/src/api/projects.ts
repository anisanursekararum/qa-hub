const API_URL = 'http://localhost:3000'; // Default NestJS port

export const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const fetchProjects = async () => {
  const res = await fetch(`${API_URL}/project`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch projects');
  return res.json();
};

export const createProject = async (name: string, description: string) => {
  const res = await fetch(`${API_URL}/project`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ name, description }),
  });
  if (!res.ok) throw new Error('Failed to create project');
  return res.json();
};

export const joinProject = async (joinCode: string) => {
  const res = await fetch(`${API_URL}/project/join`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ joinCode }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to join project');
  }
  return res.json();
};

export const getProjectMembers = async (projectId: string) => {
  const res = await fetch(`${API_URL}/project/${projectId}/members`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch project members');
  return res.json();
};

export const generateJoinCode = async (projectId: string, email: string) => {
  const res = await fetch(`${API_URL}/project/${projectId}/join-code`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to generate join code');
  }
  return res.json();
};
