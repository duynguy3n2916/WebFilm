import './ShowtimesTabs.css'; import { Button } from './UI'; import { DAYS } from './sharedData';
export default function ShowtimesTabs({ selectedDay, onSelectDay, times, onPick }) {
  return (
    <div className="st-wrap">
      <div className="days">{DAYS.map(d=>(
        <button key={d.key} onClick={()=>onSelectDay(d.key)} className="btn btn-outline" style={d.key===selectedDay?{background:'#111',color:'#fff'}:null}>
          {d.label}
        </button>
      ))}</div>
      <div className="times">{times.map(t=>(<Button key={t.code} variant="outline" onClick={()=>onPick(t)}>{t.time} – {t.room}</Button>))}</div>
    </div>
  );
}
