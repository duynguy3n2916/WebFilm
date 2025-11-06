import './Home.css'; 
import React, { useMemo, useRef, useEffect, useState } from 'react'; 
import MovieSlider from './MovieSlider'; 
import { H2 } from './UI';
import { movieService } from '../services/movieService';
function useInterval(callback, delay){ const saved=useRef(callback); useEffect(()=>{saved.current=callback;}); useEffect(()=>{ if(delay==null) return; const id=setInterval(()=>saved.current(),delay); return ()=>clearInterval(id); },[delay]); }
function HeroSlider({ slides }){
  const [index,setIndex]=useState(0); 
  const ref=useRef(null); 
  useInterval(()=>setIndex(i=>(i+1)%slides.length),4000); // Tăng thời gian hiển thị lên 4 giây
  
  useEffect(()=>{ 
    const el=ref.current;
    if(!el) return; 
    let startX=0,cur=0,drag=false; 
    const down=e=>{drag=true;startX=("touches"in e?e.touches[0].clientX:e.clientX);cur=startX}; 
    const move=e=>{if(!drag) return;cur=("touches"in e?e.touches[0].clientX:e.clientX); const dx=cur-startX; el.style.transform=`translateX(calc(${-index*100}% + ${dx}px))`;}; 
    const up=()=>{if(!drag) return; const dx=cur-startX; drag=false; el.style.transform=""; if(dx>80) setIndex(i=>(i-1+slides.length)%slides.length); else if(dx<-80) setIndex(i=>(i+1)%slides.length)}; 
    el.addEventListener("mousedown",down); 
    el.addEventListener("mousemove",move); 
    window.addEventListener("mouseup",up); 
    el.addEventListener("touchstart",down,{passive:true}); 
    el.addEventListener("touchmove",move,{passive:true}); 
    el.addEventListener("touchend",up); 
    return ()=>{ 
      el.removeEventListener("mousedown",down); 
      el.removeEventListener("mousemove",move); 
      window.removeEventListener("mouseup",up); 
      el.removeEventListener("touchstart",down); 
      el.removeEventListener("touchmove",move); 
      el.removeEventListener("touchend",up); 
    }; 
  },[index,slides.length]);
  
  return (
    <div className="hero">
      <div ref={ref} className="hero-row" style={{transform:`translateX(${-index*100}%)`}}>
        {slides.map((s,i)=>(
          <div key={i} className="hero-cell">
            <img src={s} alt={`Banner ${i+1}`} />
          </div>
        ))}
      </div>
      <div className="dots">
        {slides.map((_,i)=>(
          <button key={i} className={`dot ${i===index?'on':''}`} onClick={()=>setIndex(i)}/>
        ))}
      </div>
    </div>
  );
}
export default function Home({ movies, loading, onOpenMovie, onBookMovie }){
  const [hotMovies, setHotMovies] = useState([]);
  const [nowShowingMovies, setNowShowingMovies] = useState([]);
  const [comingSoonMovies, setComingSoonMovies] = useState([]);
  const [moviesLoading, setMoviesLoading] = useState(true);

  // Danh sách ảnh banner tự chọn
  const bannerSlides = [
    process.env.PUBLIC_URL + '/banners/banner1.jpg',
    process.env.PUBLIC_URL + '/banners/banner2.jpg',
    process.env.PUBLIC_URL + '/banners/banner3.jpg'
  ];

  const slides=useMemo(()=>bannerSlides,[bannerSlides]);

  // Load các loại phim từ API
  useEffect(() => {
    loadMovieCategories();
  }, []);

  // Reload movie categories khi component mount hoặc movies thay đổi
  useEffect(() => {
    if (movies.length > 0) {
      loadMovieCategories();
    }
  }, [movies]);

  const loadMovieCategories = async () => {
    try {
      setMoviesLoading(true);
      const [hot, nowShowing, comingSoon] = await Promise.all([
        movieService.getHotMovies(),
        movieService.getNowShowing(),
        movieService.getComingSoon()
      ]);
      
      setHotMovies(hot);
      setNowShowingMovies(nowShowing);
      setComingSoonMovies(comingSoon);
    } catch (error) {
      console.error('Lỗi load movie categories:', error);
      // Fallback về filter từ movies tổng
      const hot = movies.filter(m=>m.is_hot).slice(0,5); 
      const now = movies.filter(m=>m.status==='now'); 
      const soon = movies.filter(m=>m.status==='soon');
      
      setHotMovies(hot);
      setNowShowingMovies(now);
      setComingSoonMovies(soon);
    } finally {
      setMoviesLoading(false);
    }
  };
  
  const handleViewMore = () => {};
  
  if (loading) {
    return (
      <div className="home">
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <h2>Đang tải dữ liệu...</h2>
        </div>
      </div>
    );
  }
  
  return (
    <div className="home">
      <HeroSlider slides={slides}/>
      
      <div className="hot-five" style={{ '--home-hotfive-bg': `url(${process.env.PUBLIC_URL}/banners/topphim.jpg)` }}>
        <div className="hot-five-content">
          <h2 className="section-title"> TOP PHIM ĐANG HOT</h2>
          <div className="hot-grid">
          {hotMovies.map((m, index)=> (
            <div key={m.id} className="hot-card" onClick={()=>onOpenMovie(m)}>
              <div className="hot-rank">{index + 1}</div>
              <div className="hot-thumb">
                <img src={m.poster_url || m.poster} alt={m.title} />
                <div className="hot-overlay">
                  <div className="hot-details">
                    <h3 className="hot-title">{m.title}</h3>
                    <div className="hot-rating">{m.rating}★</div>
                    <div className="hot-tags">{(Array.isArray(m.tags) ? m.tags : JSON.parse(m.tags || '[]')).slice(0, 2).join(' • ')}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          </div>
        </div>
      </div>
      
      <div className="seamless-background-wrapper" style={{ '--home-seamless-bg': `url(${process.env.PUBLIC_URL}/images/black-smoky-art-abstract.jpg)` }}>
        <MovieSlider 
          movies={nowShowingMovies} 
          onOpen={onOpenMovie}
          onBook={onBookMovie}
          title="PHIM ĐANG CHIẾU"
          onViewMore={handleViewMore}
          loading={moviesLoading}
        />
        
        <MovieSlider 
          movies={comingSoonMovies} 
          onOpen={onOpenMovie}
          onBook={onBookMovie}
          title="PHIM SẮP CHIẾU"
          onViewMore={handleViewMore}
          loading={moviesLoading}
        />
      </div>
    </div>
  );
}
