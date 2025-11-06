import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MovieDetail from '../MovieDetail';

export default function MovieDetailRoute({ movies, user, onAuthRequired }) {
  const { movieId } = useParams();
  const navigate = useNavigate();
  
  // Nếu movies chưa load xong, hiển thị loading
  if (!movies || movies.length === 0) {
    return (
      <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Đang tải thông tin phim...</h2>
        <p>Vui lòng chờ trong giây lát</p>
      </div>
    );
  }
  
  // Tìm movie theo ID (chuyển đổi kiểu dữ liệu để so sánh)
  const movie = movies.find(m => String(m.id) === String(movieId));
  
  if (!movie) {
    return (
      <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Không tìm thấy phim</h2>
        <button 
          className="btn btn-primary" 
          onClick={() => navigate('/')}
        >
          Về trang chủ
        </button>
      </div>
    );
  }

  return (
    <MovieDetail
      movie={movie}
      onClose={() => navigate('/')}
      onBookDirect={(movie) => {
        if (!user) {
          onAuthRequired();
          return;
        }
        navigate(`/booking/${movie.id}`);
      }}
    />
  );
}
