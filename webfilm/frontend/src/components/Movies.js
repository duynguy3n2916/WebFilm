import './Movies.css'; 
import React, { useMemo, useState } from 'react'; 
import { MOVIES } from './sharedData'; 
import MovieSlider from './MovieSlider';
export default function Movies({ onOpenMovie, onBookMovie }){
  const allGenres = useMemo(()=>{ 
    const set=new Set(); 
    MOVIES.forEach(m=>m.tags.forEach(t=>set.add(t))); 
    return ['Tất cả',...Array.from(set)]; 
  },[]);
  
  const [genre,setGenre]=useState('Tất cả'); 
  const [status,setStatus]=useState('Tất cả'); 
  const [q,setQ]=useState('');
  
  const filtered = useMemo(()=> MOVIES.filter(m=>{ 
    const okG=genre==='Tất cả'||m.tags.includes(genre); 
    const okS=status==='Tất cả'||(status==='Đang chiếu'?m.status==='now':m.status==='soon'); 
    const text=(m.title+' '+m.tags.join(' ')).toLowerCase(); 
    const okQ= q.trim()==='' || text.includes(q.trim().toLowerCase()); 
    return okG && okS && okQ; 
  }),[genre,status,q]);

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

  return (
    <div className="movies">
      <div className="movies-header">
        <h1 className="movies-title">🎬 Khám phá phim</h1>
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
              {['Tất cả','Đang chiếu','Sắp chiếu'].map(s=>(
                <button 
                  key={s} 
                  className={`filter-btn ${status===s?'active':''}`}
                  onClick={()=>setStatus(s)}
                >
                  {s === 'Đang chiếu' ? '🎬' : s === 'Sắp chiếu' ? '⏰' : '📋'} {s}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">Thể loại:</label>
            <div className="filter-buttons genres-filter">
              {allGenres.map(g=>(
                <button 
                  key={g} 
                  className={`filter-btn ${genre===g?'active':''}`}
                  onClick={()=>setGenre(g)}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="filter-actions">
            <button className="clear-filters-btn" onClick={clearFilters}>
              🗑️ Xóa bộ lọc
            </button>
          </div>
        )}
      </div>

      <div className="results-section">
        <div className="results-header">
          <h2 className="results-title">{getResultTitle()}</h2>
        </div>
        
        {filtered.length > 0 ? (
          <MovieSlider 
            movies={filtered} 
            onOpen={onOpenMovie}
            onBook={onBookMovie}
            title=""
            showViewMore={false}
          />
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
  );
}
