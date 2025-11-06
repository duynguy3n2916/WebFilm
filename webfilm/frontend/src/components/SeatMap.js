import './SeatMap.css'; 
import { useState, useEffect } from 'react';
import { bookingService } from '../services/bookingService';

export default function SeatMap({ showtimeId, selected, onToggle }) {
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [takenSeats, setTakenSeats] = useState(new Set());
  const [roomInfo, setRoomInfo] = useState(null);
  
  // Dynamic rows and cols sẽ được tính từ API response
  const [rows, setRows] = useState([]);
  const [cols, setCols] = useState([]);

  // Load seats từ API khi có showtimeId
  useEffect(() => {
    if (showtimeId) {
      loadSeats();
    }
  }, [showtimeId]);

  const loadSeats = async () => {
    try {
      setLoading(true);
      const response = await bookingService.getSeats(showtimeId);
      const seatsData = response.seats || response;
      
      setSeats(seatsData);
      
      // Lấy roomInfo nếu có từ API
      if (response.roomInfo) {
        setRoomInfo(response.roomInfo);
        // Tính toán rows và cols từ roomInfo
        generateSeatLayout(response.roomInfo);
      } else if (seatsData && seatsData.length > 0) {
        // Không có roomInfo: suy diễn rows/cols từ seat_code
        const inferred = inferLayoutFromSeats(seatsData);
        setRoomInfo({
          roomNumber: '',
          totalSeats: seatsData.length,
          rows: inferred.rows,
          cols: inferred.cols,
          layout: `${inferred.rows}x${inferred.cols}`
        });
        setRows(inferred.rowLabels);
        setCols(Array.from({ length: inferred.cols }, (_, i) => i + 1));
      }
      
      // Tạo set các ghế đã được đặt
      const takenSet = new Set();
      seatsData.forEach(seat => {
        if (!seat.is_available) {
          takenSet.add(seat.seat_code);
        }
      });
      setTakenSeats(takenSet);
    } catch (error) {
      console.error('Lỗi load seats:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSeatLayout = (roomInfo) => {
    const { rows: totalRows, cols: totalCols } = roomInfo;
    
    // Tạo rows (A, B, C, ..., Z, AA, AB, ...)
    const newRows = [];
    for (let i = 0; i < totalRows; i++) {
      if (i < 26) {
        newRows.push(String.fromCharCode(65 + i)); // A-Z
      } else {
        const firstChar = String.fromCharCode(65 + Math.floor(i / 26) - 1);
        const secondChar = String.fromCharCode(65 + (i % 26));
        newRows.push(firstChar + secondChar); // AA, AB, AC, ...
      }
    }
    
    // Tạo cols (1, 2, 3, ...)
    const newCols = Array.from({ length: totalCols }, (_, i) => i + 1);
    
    setRows(newRows);
    setCols(newCols);
  };

  // Không dùng fallback layout, layout sẽ được quyết định bởi roomInfo từ backend
  // hoặc suy diễn từ danh sách seats nếu thiếu roomInfo

  const inferLayoutFromSeats = (seatsData) => {
    const rowSet = new Set();
    let maxCol = 0;
    for (const s of seatsData) {
      const code = s.seat_code || '';
      const rowMatch = code.match(/^[A-Z]+/i);
      const colMatch = code.match(/(\d+)$/);
      if (rowMatch) rowSet.add(rowMatch[0].toUpperCase());
      if (colMatch) maxCol = Math.max(maxCol, parseInt(colMatch[1], 10));
    }
    const rowLabels = Array.from(rowSet);
    const rows = rowLabels.length || 1;
    const cols = maxCol || Math.ceil(Math.sqrt((seatsData?.length || 1) * 1.2));
    return { rows, cols, rowLabels: rowLabels.length ? rowLabels : ['A'] };
  };
  
  const getSeatState = (code) => {
    const isTaken = takenSeats.has(code);
    const isSelected = selected.has(code);
    if (isTaken) return 'taken';
    if (isSelected) return 'selected';
    return 'available';
  };

  if (loading) {
    return (
      <div className="seat-wrap">
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>Đang tải sơ đồ ghế...</p>
        </div>
      </div>
    );
  }

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
        {roomInfo && (
          <p className="room-details">
            📊 <strong>Thông tin phòng:</strong> {roomInfo.totalSeats} ghế • Layout {roomInfo.layout}
          </p>
        )}
      </div>
    </div>
  );
}
