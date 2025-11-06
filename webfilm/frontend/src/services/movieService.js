import api from './api';

export const movieService = {
  // Lấy tất cả phim
  getAllMovies: async () => {
    const response = await api.get('/movies');
    return response.movies;
  },

  // Lấy phim theo ID
  getMovieById: async (id) => {
    const response = await api.get(`/movies/${id}`);
    return response.movie;
  },

  // Lấy phim hot
  getHotMovies: async () => {
    const response = await api.get('/movies/hot');
    return response.movies;
  },

  // Lấy phim đang chiếu
  getNowShowing: async () => {
    const response = await api.get('/movies/now-showing');
    return response.movies;
  },

  // Lấy phim sắp chiếu
  getComingSoon: async () => {
    const response = await api.get('/movies/coming-soon');
    return response.movies;
  }
};
