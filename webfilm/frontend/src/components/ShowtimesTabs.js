import './ShowtimesTabs.css'; 
import { Button } from './UI'; 

export default function ShowtimesTabs({ selectedDay, onSelectDay, times, onPick, days = [] }) {
  // Sử dụng days từ props hoặc tạo fallback
  const displayDays = days.length > 0 ? days : Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const label = d.toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit" });
    return { 
      key: d.toISOString().slice(0, 10), 
      label 
    };
  });

  return (
    <div className="st-wrap">
      <div className="days">{displayDays.map(d=>(
        <button key={d.key} onClick={()=>onSelectDay(d.key)} className="btn btn-outline" style={d.key===selectedDay?{background:'#111',color:'#fff'}:null}>
          {d.label}
        </button>
      ))}</div>
      <div className="times">{times.map(t=>(<Button key={t.code} variant="outline" onClick={()=>onPick(t)}>{t.time} – {t.room}</Button>))}</div>
    </div>
  );
}
