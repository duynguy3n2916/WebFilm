import api from './api';

export const cartService = {
  // Lấy giỏ hàng của user
  getCart: async (userId) => {
    const response = await api.get(`/cart/${userId}`);
    return response.cart;
  },

  // Thêm item vào giỏ hàng
  addToCart: async (itemData) => {
    const response = await api.post('/cart/add', itemData);
    return response;
  },

  // Xóa item khỏi giỏ hàng
  removeFromCart: async (itemId) => {
    const response = await api.delete(`/cart/remove/${itemId}`);
    return response;
  },

  // Cập nhật item trong giỏ hàng
  updateCartItem: async (itemId, data) => {
    const response = await api.put(`/cart/update/${itemId}`, data);
    return response;
  },

  // Checkout giỏ hàng
  checkout: async () => {
    const response = await api.post('/cart/checkout');
    return response;
  }
};
