import api from './api';

export const comboService = {
  // Lấy tất cả combos
  getAllCombos: async () => {
    const response = await api.get('/combos');
    return response.combos;
  }
};
