import { useState, useCallback } from 'react';

interface ApiResponse<T> {
  data: T;
  error?: string;
}

export const useApi = () => {
  const [loading, setLoading] = useState(false);

  // Use useCallback to ensure function identity is preserved across renders
  const get = useCallback(async <T>(url: string): Promise<ApiResponse<T>> => {
    console.log(`[useApi] GET request to ${url}`);
    setLoading(true);
    try {
      const response = await fetch(url);
      const data = await response.json();
      console.log(`[useApi] GET response from ${url}:`, data);
      return { data };
    } catch (error) {
      console.error(`[useApi] GET error from ${url}:`, error);
      return { data: {} as T, error: (error as Error).message };
    } finally {
      setLoading(false);
    }
  }, []);

  const post = useCallback(async <T>(url: string, body: any): Promise<ApiResponse<T>> => {
    console.log(`[useApi] POST request to ${url}`, body);
    setLoading(true);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      console.log(`[useApi] POST response from ${url}:`, data);
      return { data };
    } catch (error) {
      console.error(`[useApi] POST error from ${url}:`, error);
      return { data: {} as T, error: (error as Error).message };
    } finally {
      setLoading(false);
    }
  }, []);

  const put = useCallback(async <T>(url: string, body: any): Promise<ApiResponse<T>> => {
    console.log(`[useApi] PUT request to ${url}`, body);
    setLoading(true);
    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      console.log(`[useApi] PUT response from ${url}:`, data);
      return { data };
    } catch (error) {
      console.error(`[useApi] PUT error from ${url}:`, error);
      return { data: {} as T, error: (error as Error).message };
    } finally {
      setLoading(false);
    }
  }, []);

  const delete_ = useCallback(async (url: string): Promise<void> => {
    console.log(`[useApi] DELETE request to ${url}`);
    setLoading(true);
    try {
      await fetch(url, { method: 'DELETE' });
      console.log(`[useApi] DELETE completed for ${url}`);
    } catch (error) {
      console.error(`[useApi] DELETE error from ${url}:`, error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { get, post, put, delete: delete_, loading };
};