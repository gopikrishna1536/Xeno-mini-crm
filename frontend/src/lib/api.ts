import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  headers: { 'Content-Type': 'application/json' },
});

export default api;

// Customers
export const getCustomers = (params?: any) => api.get('/api/customers', { params });
export const getCustomerStats = () => api.get('/api/customers/stats');
export const getCustomer = (id: string) => api.get(`/api/customers/${id}`);
export const importCustomers = (data: any) => api.post('/api/customers/import', data);

// Segments
export const previewSegment = (rules: any) => api.post('/api/segments/preview', { rules });
export const parseAISegment = (prompt: string) => api.post('/api/segments/ai-parse', { prompt });
export const fetchSegmentCustomers = (rules: any) => api.post('/api/segments/fetch-customers', { rules });

// Campaigns
export const getCampaigns = () => api.get('/api/campaigns');
export const getCampaign = (id: string) => api.get(`/api/campaigns/${id}`);
export const createCampaign = (data: any) => api.post('/api/campaigns', data);
export const launchCampaign = (id: string) => api.post(`/api/campaigns/${id}/launch`);

// Analytics
export const getOverviewAnalytics = () => api.get('/api/analytics/overview');
export const getCampaignAnalytics = (id: string) => api.get(`/api/analytics/campaign/${id}`);

// AI
export const generateMessage = (data: any) => api.post('/api/ai/generate-message', data);
export const suggestCampaigns = (stats: any) => api.post('/api/ai/suggest-campaigns', { stats });
