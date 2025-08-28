import axios from "axios";

export const API_BASE_URL = "https://leadforge-server.onrender.com";
// export const API_BASE_URL = "http://localhost:5000";

// Lead API functions
export const leadAPI = {
  getAll: (params = {}) => axios.get(`${API_BASE_URL}/api/leads`, { params }),
  getById: (id) => axios.get(`${API_BASE_URL}/api/leads/${id}`),
  create: (data) => axios.post(`${API_BASE_URL}/api/leads`, data),
  update: (id, data) => axios.put(`${API_BASE_URL}/api/leads/${id}`, data),
  delete: (id) => axios.delete(`${API_BASE_URL}/api/leads/${id}`),
  getStats: () => axios.get(`${API_BASE_URL}/api/leads/stats`),
  bulkCreate: (formData) =>
    axios.post(`${API_BASE_URL}/api/leads/bulk`, formData),
};

// Email Template API functions
export const templateAPI = {
  getAll: (params = {}) =>
    axios.get(`${API_BASE_URL}/api/email-templates`, { params }),
  getById: (id) => axios.get(`${API_BASE_URL}/api/email-templates/${id}`),
  create: (data) => axios.post(`${API_BASE_URL}/api/email-templates`, data),
  update: (id, data) =>
    axios.put(`${API_BASE_URL}/api/email-templates/${id}`, data),
  delete: (id) => axios.delete(`${API_BASE_URL}/api/email-templates/${id}`),
  clone: (id) => axios.post(`${API_BASE_URL}/api/email-templates/${id}/clone`),
  incrementUsage: (id) =>
    axios.post(`${API_BASE_URL}/api/email-templates/${id}/increment-usage`),
  getStats: () =>
    axios.get(`${API_BASE_URL}/
    api/email-templates/stats`),
};

// Email Campaign API functions
export const campaignAPI = {
  getAll: (params = {}) =>
    axios.get(`${API_BASE_URL}/api/email-campaigns`, { params }),
  getById: (id) => axios.get(`${API_BASE_URL}/api/email-campaigns/${id}`),
  create: (data) => axios.post(`${API_BASE_URL}/api/email-campaigns`, data),
  update: (id, data) =>
    axios.put(`${API_BASE_URL}/api/email-campaigns/${id}`, data),
  delete: (id) => axios.delete(`${API_BASE_URL}/api/email-campaigns/${id}`),
  getHistory: (id) =>
    axios.get(`${API_BASE_URL}/api/email-campaigns/${id}/history`),
  getStats: () => axios.get(`${API_BASE_URL}/api/email-campaigns/stats`),
};

// Email History API functions
export const emailHistoryAPI = {
  getAll: (params = {}) =>
    axios.get(`${API_BASE_URL}/api/email-campaigns/history`, { params }),
};

// Dashboard API functions
export const dashboardAPI = {
  getStats: () => axios.get(`${API_BASE_URL}/api/dashboard`),
  getFunnel: () => axios.get(`${API_BASE_URL}/api/dashboard/funnel`),
  getEmailPerformance: () =>
    axios.get(`${API_BASE_URL}/api/dashboard/email-performance`),
  getTemplateUsage: () =>
    axios.get(`${API_BASE_URL}/api/dashboard/template-usage`),
};
