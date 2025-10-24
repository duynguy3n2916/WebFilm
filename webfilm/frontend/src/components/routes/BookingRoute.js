import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BookingFlow from '../BookingFlow';

export default function BookingRoute({ movies, user, addToCart, openCart, onPaid, onAuthRequired }) {
  const { movieId } = useParams();
  const navigate = useNavigate();
  
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

  const booking = { movie };

  return (
    <BookingFlow
      ctx={booking}
      onClose={() => navigate(`/movie/${movieId}`)}
      addToCart={addToCart}
      openCart={openCart}
      onPaid={onPaid}
      user={user}
      onAuthRequired={onAuthRequired}
    />
  );
}
