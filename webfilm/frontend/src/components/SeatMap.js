import './SeatMap.css'; 
import { PRE_BOOKED } from './sharedData';

export default function SeatMap({ taken = PRE_BOOKED, selected, onToggle }) {
  const rows = "ABCDEFGH".split(""); 
  const cols = Array.from({ length: 10 }, (_, i) => i + 1);
  
  const getSeatState = (code) => {
    const isTaken = taken.has(code);
    const isSelected = selected.has(code);
    if (isTaken) return 'taken';
    if (isSelected) return 'selected';
    return 'available';
  };

  return (
    <div className="seat-wrap">
      <div className="screen">Màn hình</div>
      <div className="bar"/>
      
      <div className="rows">
        {rows.map(r => (
          <div key={r} className="row">
            <span className="row-label">{r}</span>
            {cols.map(c => {
              const code = `${r}${c}`;
              const state = getSeatState(code);
              const isTaken = state === 'taken';
              
              return (
                <button 
                  key={code} 
                  className={`seat-btn ${state}`}
                  disabled={isTaken} 
                  onClick={() => onToggle(code)}
                >
                  {c}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      
      <div className="legend">
        <div className="legend-item">
          <span className="box sel"></span>
          <span>Đang chọn</span>
        </div>
        <div className="legend-item">
          <span className="box taken"></span>
          <span>Đã đặt</span>
        </div>
      </div>
      
      <div className="seat-info">
        <h4>Hướng dẫn chọn ghế</h4>
        <p>
          • Ghế màu trắng: Có thể chọn<br/>
          • Ghế màu đen: Đang được chọn<br/>
          • Ghế màu xám: Đã được đặt<br/>
          • Chọn nhiều ghế liền kề để có trải nghiệm tốt nhất
        </p>
      </div>
    </div>
  );
}
