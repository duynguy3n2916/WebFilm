import './MovieDetail.css';
import React from 'react';
import { Button } from './UI';

export default function MovieDetail({ movie, onClose, onBookDirect }){
  const tags = Array.isArray(movie.tags) ? movie.tags : JSON.parse(movie.tags || '[]');
  
  return (
    <div className="movie-detail-page" style={{ '--movie-detail-bg': `url(${process.env.PUBLIC_URL}/images/black-smoky-art-abstract.jpg)` }}>
      <div className="detail-main">
        {/* Poster bên trái */}
        <div className="poster-section">
          <img src={movie.poster_url || movie.poster} alt={movie.title} className="detail-poster" />
        </div>

        {/* Thông tin bên phải */}
        <div className="info-section">
          <h1 className="detail-title">{movie.title}</h1>
          
          <p className="detail-synopsis">{movie.description || movie.desc}</p>
          
          <div className="detail-list">
            <div className="detail-item">
              <span className="detail-label">Phân loại:</span>
              <span className="detail-value">
                <span className="rating-badge">P</span> Phim phổ biến với mọi độ tuổi
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Định dạng:</span>
              <span className="detail-value">2D</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Đạo diễn:</span>
              <span className="detail-value">{movie.director || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Diễn viên:</span>
              <span className="detail-value">{movie.cast || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Thể loại:</span>
              <span className="detail-value">{tags.join(', ')}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Khởi chiếu:</span>
              <span className="detail-value">{movie.release_date || movie.releaseDate || 'Sắp ra mắt'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Thời lượng:</span>
              <span className="detail-value">{movie.duration} phút</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Ngôn ngữ:</span>
              <span className="detail-value">Phụ đề</span>
            </div>
          </div>

          <button className="book-now-btn" onClick={() => onBookDirect(movie)}>
            ĐẶT VÉ NGAY
          </button>
        </div>
      </div>

      {/* Trailer */}
      <div className="trailer-section">
        <iframe 
          className="trailer-video" 
          src={movie.trailer_url || movie.trailer} 
          title="Trailer" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowFullScreen
        />
      </div>
    </div>
  );
}
