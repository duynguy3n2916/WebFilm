import api from './api';

export const adminService = {
  // Movies CRUD
  createMovie: async (movie) => {
    return await api.post('/admin/movies', movie);
  },
  updateMovie: async (id, movie) => {
    return await api.put(`/admin/movies/${id}`, movie);
  },
  deleteMovie: async (id) => {
    return await api.delete(`/admin/movies/${id}`);
  },

  // Revenue stats
  getRevenue: async ({ from, to, groupBy }) => {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    if (groupBy) params.append('groupBy', groupBy);
    return await api.get(`/admin/revenue?${params.toString()}`);
  }
};


