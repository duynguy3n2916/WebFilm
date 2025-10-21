import api from './api';

export const showtimeService = {
  // Lấy suất chiếu theo phim và ngày
  getShowtimesByMovieAndDate: async (movieId, date) => {
    const response = await api.get(`/showtimes/${movieId}/${date}`);
    return response.showtimes;
  },

  // Lấy tất cả suất chiếu của phim
  getShowtimesByMovie: async (movieId) => {
    const response = await api.get(`/showtimes/${movieId}`);
    return response.showtimes;
  },

  // Lấy danh sách ngày (7 ngày tiếp theo)
  getDays: async () => {
    const response = await api.get('/days');
    return response.days;
  },

  // Lấy suất chiếu mặc định (mock data)
  getDefaultShowtimes: async () => {
    const response = await api.get('/showtimes-default');
    return response.showtimes;
  }
};
