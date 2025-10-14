import './Home.css'; 
import React, { useMemo, useRef, useEffect, useState } from 'react'; 
import { MOVIES } from './sharedData'; 
import MovieSlider from './MovieSlider'; 
import { H2 } from './UI';
function useInterval(callback, delay){ const saved=useRef(callback); useEffect(()=>{saved.current=callback;}); useEffect(()=>{ if(delay==null) return; const id=setInterval(()=>saved.current(),delay); return ()=>clearInterval(id); },[delay]); }
function HeroSlider({ slides }){
  const [index,setIndex]=useState(0); const ref=useRef(null); useInterval(()=>setIndex(i=>(i+1)%slides.length),3000);
  useEffect(()=>{ const el=ref.current;if(!el) return; let startX=0,cur=0,drag=false; const down=e=>{drag=true;startX=("touches"in e?e.touches[0].clientX:e.clientX);cur=startX}; const move=e=>{if(!drag) return;cur=("touches"in e?e.touches[0].clientX:e.clientX); const dx=cur-startX; el.style.transform=`translateX(calc(${-index*100}% + ${dx}px))`;}; const up=()=>{if(!drag) return; const dx=cur-startX; drag=false; el.style.transform=""; if(dx>80) setIndex(i=>(i-1+slides.length)%slides.length); else if(dx<-80) setIndex(i=>(i+1)%slides.length)}; el.addEventListener("mousedown",down); el.addEventListener("mousemove",move); window.addEventListener("mouseup",up); el.addEventListener("touchstart",down,{passive:true}); el.addEventListener("touchmove",move,{passive:true}); el.addEventListener("touchend",up); return ()=>{ el.removeEventListener("mousedown",down); el.removeEventListener("mousemove",move); window.removeEventListener("mouseup",up); el.removeEventListener("touchstart",down); el.removeEventListener("touchmove",move); el.removeEventListener("touchend",up); }; },[index,slides.length]);
  return (<div className="hero"><div ref={ref} className="hero-row" style={{transform:`translateX(${-index*100}%)`}}>{slides.map((s,i)=>(<div key={i} className="hero-cell"><img src={s} alt=""/></div>))}</div><div className="dots">{slides.map((_,i)=>(<button key={i} className={`dot ${i===index?'on':''}`} onClick={()=>setIndex(i)}/>))}</div></div>);
}
export default function Home({ onOpenMovie, onBookMovie }){
  const slides=useMemo(()=>MOVIES.map(m=>m.poster).slice(0,5),[]);
  const hot = MOVIES.filter(m=>m.hot).slice(0,5); 
  const now=MOVIES.filter(m=>m.status==='now'); 
  const soon=MOVIES.filter(m=>m.status==='soon');
  
  const handleViewMore = () => {};
  
  return (
    <div className="home">
      <HeroSlider slides={slides}/>
      
      <div className="hot-five">
        <h2 className="section-title"> TOP PHIM ĐANG HOT</h2>
        <div className="hot-grid">
          {hot.map((m, index)=> (
            <div key={m.id} className="hot-card" onClick={()=>onOpenMovie(m)}>
              <div className="hot-rank">{index + 1}</div>
              <div className="hot-thumb">
                <img src={m.poster} alt={m.title} />
                <div className="hot-overlay">
                  <div className="hot-details">
                    <h3 className="hot-title">{m.title}</h3>
                    <div className="hot-rating">{m.rating}★</div>
                    <div className="hot-tags">{m.tags.slice(0, 2).join(' • ')}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <MovieSlider 
        movies={now} 
        onOpen={onOpenMovie}
        onBook={onBookMovie}
        title="PHIM ĐANG CHIẾU"
        onViewMore={handleViewMore}
      />
      
      <MovieSlider 
        movies={soon} 
        onOpen={onOpenMovie}
        onBook={onBookMovie}
        title="PHIM SẮP CHIẾU"
        onViewMore={handleViewMore}
      />
    </div>
  );
}
