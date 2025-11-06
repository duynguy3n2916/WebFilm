import api from './api';

export const bookingService = {
  // Lấy vé của user
  getUserBookings: async (userId) => {
    const response = await api.get(`/bookings/user/${userId}`);
    return response.bookings;
  },

  // Tạo booking mới
  createBooking: async (bookingData) => {
    const response = await api.post('/bookings', bookingData);
    return response;
  },

  // Lấy ghế theo showtime
  getSeats: async (showtimeId) => {
    // Trả về full payload để lấy cả roomInfo
    return await api.get(`/seats/${showtimeId}`);
  },

  // (Bỏ API mock lấy ghế đã được đặt)
};
