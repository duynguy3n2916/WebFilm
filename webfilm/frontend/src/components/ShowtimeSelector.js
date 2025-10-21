import React, { useState, useEffect } from 'react';
import './ShowtimeSelector.css';
import { showtimeService } from '../services/showtimeService';

export default function ShowtimeSelector({ movieId, onSelectShowtime }) {
  const [days, setDays] = useState([]);
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedTime, setSelectedTime] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load days từ API
  useEffect(() => {
    loadDays();
  }, []);

  // Load showtimes khi chọn ngày
  useEffect(() => {
    if (selectedDay && movieId) {
      loadShowtimes(movieId, selectedDay);
    }
  }, [selectedDay, movieId]);

  const loadDays = async () => {
    const daysData = await showtimeService.getDays();
    setDays(daysData);
    if (daysData.length > 0) {
      setSelectedDay(daysData[0].key);
    }
  };

  const loadShowtimes = async (movieId, date) => {
    setLoading(true);
    const showtimesData = await showtimeService.getShowtimesByMovieAndDate(movieId, date);
    setShowtimes(showtimesData);
    setLoading(false);
  };

  const handleTimeSelect = (showtime) => {
    setSelectedTime(showtime);
    onSelectShowtime({ 
      day: selectedDay, 
      time: {
        time: showtime.show_time,
        room: showtime.room_number,
        code: showtime.id,
        showtimeId: showtime.id,
        price: showtime.price
      }
    });
    // Scroll về đầu trang khi chọn suất chiếu
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading && showtimes.length === 0) {
    return (
      <div className="showtime-selector">
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>Đang tải suất chiếu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="showtime-selector">
      <div className="selector-section">
        <h3>📅 Chọn ngày</h3>
        <div className="day-selector">
          {days.map(day => (
            <button
              key={day.key}
              className={`day-btn ${selectedDay === day.key ? 'selected' : ''}`}
              onClick={() => {
                setSelectedDay(day.key);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <div className="day-name">{day.name}</div>
              <div className="day-date">{day.date}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="selector-section">
        <h3>⏰ Chọn suất chiếu</h3>
        <div className="time-selector">
          {showtimes.length > 0 ? (
            showtimes.map((showtime, index) => {
              const total = Number(showtime.room_total_seats) || 0;
              const availableCalc = Number(showtime.available_seats_calculated);
              // Nếu chưa seed seats, available = total
              const available = Number.isFinite(availableCalc) ? availableCalc : total;
              return (
                <button
                  key={showtime.id}
                  className={`time-btn ${selectedTime?.id === showtime.id ? 'selected' : ''} ${available === 0 ? 'sold-out' : ''}`}
                  onClick={() => handleTimeSelect(showtime)}
                  disabled={available === 0}
                >
                  <div className="time-info">
                    <div className="time">{showtime.show_time}</div>
                    <div className="room">Phòng {showtime.room_number}</div>
                    <div className="cinema">{showtime.cinema_name}</div>
                  </div>
                  <div className="seat-info">
                    <div className="seats-available">{available}/{total}</div>
                    <div className="seat-label">ghế trống</div>
                    <div className="price">{Number(showtime.price || 0).toLocaleString('vi-VN', { maximumFractionDigits: 0 })}đ</div>
                  </div>
                </button>
              );
            })
          ) : (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p>Không có suất chiếu nào cho ngày này</p>
            </div>
          )}
        </div>
      </div>

      {selectedTime && (
        <div className="selected-info">
          <div className="selected-time">
            ✅ Đã chọn: {selectedTime.show_time} - Phòng {selectedTime.room_number}
          </div>
        </div>
      )}
    </div>
  );
}
