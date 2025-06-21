import { useState, useEffect } from 'react';
import { Link, Analytics, CreateLinkRequest, GetLinksResponse } from '../types';

const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:3001/api';

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiCall = async <T>(url: string, options?: RequestInit): Promise<T> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE}${url}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createLink = async (data: CreateLinkRequest): Promise<Link> => {
    return apiCall('/links', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  };

  const getLinks = async (page = 1, limit = 10): Promise<GetLinksResponse> => {
    return apiCall(`/links?page=${page}&limit=${limit}`);
  };

  const getLink = async (id: string): Promise<Link> => {
    return apiCall(`/links/${id}`);
  };

  const getQRCode = async (id: string): Promise<{ qrCode: string }> => {
    return apiCall(`/links/${id}/qr`);
  };

  const getAnalytics = async (): Promise<Analytics> => {
    return apiCall('/analytics/overview');
  };

  return {
    loading,
    error,
    createLink,
    getLinks,
    getLink,
    getQRCode,
    getAnalytics,
  };
}

export function useLinks() {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getLinks } = useApi();

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const response = await getLinks();
        setLinks(response.links);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch links');
      } finally {
        setLoading(false);
      }
    };

    fetchLinks();
  }, []);

  const refreshLinks = async () => {
    try {
      const response = await getLinks();
      setLinks(response.links);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh links');
    }
  };

  return { links, loading, error, refreshLinks };
}

export function useAnalytics() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getAnalytics } = useApi();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await getAnalytics();
        setAnalytics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  return { analytics, loading, error };
}