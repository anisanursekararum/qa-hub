// @ts-ignore
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

export const authApi = {
  changePassword: async (oldPassword: string, newPassword: string): Promise<{message: string}> => {
    const res = await fetch(`${API_URL}/auth/change-password`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ oldPassword, newPassword }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to change password');
    }
    return res.json();
  }
};
