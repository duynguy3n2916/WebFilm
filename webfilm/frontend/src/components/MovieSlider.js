import React, { useRef, useState } from 'react';
import './MovieSlider.css';
import MovieCard from './MovieCard';
import { Button } from './UI';

export default function MovieSlider({ movies, onOpen, onBook, title, showViewMore = true, loading = false }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const sliderRef = useRef(null);
  const cardWidth = 280; // Width of each movie card + gap
  const visibleCards = 4; // Number of cards visible at once
  const maxIndex = Math.max(0, movies.length - visibleCards);

  const scrollLeft = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  const scrollRight = () => {
    setCurrentIndex(prev => Math.min(maxIndex, prev + 1));
  };

  const handleViewMore = () => {
    setIsExpanded(v => !v);
  };

  if (loading) {
    return (
      <div className="movie-slider">
        {title && (
          <div className="slider-header">
            <h2 className="slider-title">{title}</h2>
          </div>
        )}
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!movies || movies.length === 0) {
    return (
      <div className="movie-slider">
        {title && (
          <div className="slider-header">
            <h2 className="slider-title">{title}</h2>
          </div>
        )}
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>Chưa có phim nào</p>
        </div>
      </div>
    );
  }

  return (
    <div className="movie-slider">
      <div className="movie-slider-content">
        {title && (
          <div className="slider-header">
            <h2 className="slider-title">{title}</h2>
          </div>
        )}
      
      {!isExpanded && (
      <div className="slider-container">
        {currentIndex > 0 && (
          <button 
            className="slider-nav slider-nav-left"
            onClick={scrollLeft}
            aria-label="Previous movies"
          >
            ‹
          </button>
        )}
        
        <div className="slider-wrapper">
          <div 
            className="slider-content"
            ref={sliderRef}
            style={{
              transform: `translateX(-${currentIndex * cardWidth}px)`
            }}
          >
            {movies.map(movie => (
              <div key={movie.id} className="slider-item">
                <MovieCard m={movie} onOpen={() => onOpen(movie)} onBook={() => onBook(movie)} />
              </div>
            ))}
          </div>
        </div>
        
        {currentIndex < maxIndex && (
          <button 
            className="slider-nav slider-nav-right"
            onClick={scrollRight}
            aria-label="Next movies"
          >
            ›
          </button>
        )}
      </div>
      )}

      {isExpanded && (
        <div className="expanded-grid">
          {movies.map(movie => (
            <div key={movie.id} className="slider-item">
              <MovieCard m={movie} onOpen={() => onOpen(movie)} onBook={() => onBook(movie)} />
            </div>
          ))}
        </div>
      )}
      
      {!isExpanded && (
        <div className="slider-dots">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              className={`slider-dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Go to page ${index + 1}`}
            />
          ))}
        </div>
      )}

      {showViewMore && (
        <div className="view-all-wrap">
          <Button 
            variant="ghost" 
            onClick={handleViewMore}
            className="view-all-btn"
          >
            {isExpanded ? 'Thu gọn' : 'Xem tất cả'}
          </Button>
        </div>
      )}
      </div>
    </div>
  );
}
