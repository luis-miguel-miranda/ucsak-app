import { useState } from 'react';

interface ApiResponse<T> {
  data: T;
  error?: string;
}

export const useApi = () => {
  const [loading, setLoading] = useState(false);

  const get = async <T>(url: string): Promise<ApiResponse<T>> => {
    setLoading(true);
    try {
      const response = await fetch(url);
      const data = await response.json();
      return { data };
    } catch (error) {
      return { data: {} as T, error: (error as Error).message };
    } finally {
      setLoading(false);
    }
  };

  const delete_ = async (url: string): Promise<void> => {
    await fetch(url, { method: 'DELETE' });
  };

  return { get, delete: delete_, loading };
}; 