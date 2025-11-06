import './Movies.css'; 
import React, { useMemo, useState } from 'react'; 
import MovieSlider from './MovieSlider';
import MovieCard from './MovieCard';

export default function Movies({ movies, loading, onOpenMovie, onBookMovie }){
  const noFocusStyle = { outline: 'none', boxShadow: 'none' };
  const preventFocus = (e) => { e.preventDefault(); };
  const allGenres = useMemo(()=>{ 
    if (!movies || movies.length === 0) return ['Tất cả'];
    const set=new Set(); 
    movies.forEach(m=>{
      const tags = Array.isArray(m.tags) ? m.tags : JSON.parse(m.tags || '[]');
      tags.forEach(t=>set.add(t));
    }); 
    return ['Tất cả',...Array.from(set)]; 
  },[movies]);
  
  const [genre,setGenre]=useState('Tất cả'); 
  const [status,setStatus]=useState('Tất cả'); 
  const [q,setQ]=useState('');
  
  const filtered = useMemo(()=> {
    if (!movies || movies.length === 0) return [];
    return movies.filter(m=>{ 
      const tags = Array.isArray(m.tags) ? m.tags : JSON.parse(m.tags || '[]');
      const okG=genre==='Tất cả'||tags.includes(genre); 
      const okS=status==='Tất cả'||(status==='Đang chiếu'?m.status==='now':m.status==='soon'); 
      const text=(m.title+' '+tags.join(' ')).toLowerCase(); 
      const okQ= q.trim()==='' || text.includes(q.trim().toLowerCase()); 
      return okG && okS && okQ; 
    });
  },[movies, genre,status,q]);

  const getResultTitle = () => {
    if (filtered.length === 0) return "Không tìm thấy phim nào";
    if (genre !== 'Tất cả' && status !== 'Tất cả') {
      return `🎬 ${filtered.length} phim ${genre} ${status.toLowerCase()}`;
    }
    if (genre !== 'Tất cả') {
      return `🎭 ${filtered.length} phim thể loại ${genre}`;
    }
    if (status !== 'Tất cả') {
      return `📅 ${filtered.length} phim ${status.toLowerCase()}`;
    }
    if (q.trim()) {
      return `🔍 ${filtered.length} kết quả cho "${q}"`;
    }
    return `🎬 Tất cả ${filtered.length} phim`;
  };

  const clearFilters = () => {
    setGenre('Tất cả');
    setStatus('Tất cả');
    setQ('');
  };

  const hasActiveFilters = genre !== 'Tất cả' || status !== 'Tất cả' || q.trim() !== '';

  if (loading) {
    return (
      <div className="movies" style={{ '--movies-bg': `url(${process.env.PUBLIC_URL}/images/black-smoky-art-abstract.jpg)` }}>
        <div className="movies-content">
          <div className="movies-header">
            <h1 className="movies-title">Khám phá phim</h1>
            <p className="movies-subtitle">Đang tải dữ liệu...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="movies" style={{ '--movies-bg': `url(${process.env.PUBLIC_URL}/images/black-smoky-art-abstract.jpg)` }}>
      <div className="movies-content">
        <div className="movies-header">
          <h1 className="movies-title">Khám phá phim</h1>
          <p className="movies-subtitle">Tìm kiếm và lọc phim theo sở thích của bạn</p>
        </div>

        <div className="filters-container">
          <div className="search-section">
            <div className="search-wrapper">
              <div className="search-icon">🔍</div>
              <input 
                value={q} 
                onChange={e=>setQ(e.target.value)} 
                placeholder="Tìm phim theo tên hoặc thể loại..."
                className="search-input"
              />
              {q && (
                <button className="clear-search" onClick={()=>setQ('')}>
                  ×
                </button>
              )}
            </div>
          </div>

          <div className="filters-section">
            <div className="filter-group">
              <label className="filter-label">Trạng thái:</label>
              <div className="filter-buttons">
                {['Tất cả','Đang chiếu','Sắp chiếu'].map(s=> (
                  <button 
                    key={s} 
                    className={`filter-btn ${status===s?'active':''}`}
                    onClick={()=>setStatus(s)}
                    style={noFocusStyle}
                    onMouseDown={preventFocus}
                  >
                    {s === 'Đang chiếu' ? '🎬' : s === 'Sắp chiếu' ? '⏰' : '📋'} {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <label className="filter-label">Thể loại:</label>
              <div className="filter-buttons genres-filter">
                {allGenres.map(g=> (
                  <button 
                    key={g} 
                    className={`filter-btn ${genre===g?'active':''}`}
                    onClick={()=>setGenre(g)}
                    style={noFocusStyle}
                    onMouseDown={preventFocus}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="filter-actions">
              <button className="clear-filters-btn" onClick={clearFilters} style={noFocusStyle} onMouseDown={preventFocus}>
                Xóa bộ lọc
              </button>
            </div>
          )}
        </div>

        <div className="results-section">
          <div className="results-header">
            <h2 className="results-title">{getResultTitle()}</h2>
          </div>
          
          {filtered.length > 0 ? (
            <div className="movies-grid">
              {filtered.map(movie => (
                <div key={movie.id} className="movie-grid-item">
                  <MovieCard m={movie} onOpen={() => onOpenMovie(movie)} onBook={() => onBookMovie(movie)} />
                </div>
              ))}
            </div>
          ) : (
            <div className="no-results">
              <div className="no-results-icon">😔</div>
              <h3>Không tìm thấy phim nào</h3>
              <p>Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
              <button className="btn btn-primary" onClick={clearFilters}>
                Xóa bộ lọc
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
