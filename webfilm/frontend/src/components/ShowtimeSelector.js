import React, { useState } from 'react';
import './ShowtimeSelector.css';
import { DAYS, SHOWTIMES } from './sharedData';

export default function ShowtimeSelector({ onSelectShowtime }) {
  const [selectedDay, setSelectedDay] = useState(DAYS[0].key);
  const [selectedTime, setSelectedTime] = useState(null);
  const times = SHOWTIMES[selectedDay] || [];

  // Mock data for seat availability (in real app, this would come from API)
  const getSeatAvailability = (time) => {
    // Random availability between 10-100 seats
    const available = Math.floor(Math.random() * 91) + 10;
    const total = 100;
    return { available, total };
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    onSelectShowtime({ day: selectedDay, time });
  };

  return (
    <div className="showtime-selector">
      <div className="selector-section">
        <h3>📅 Chọn ngày</h3>
        <div className="day-selector">
          {DAYS.map(day => (
            <button
              key={day.key}
              className={`day-btn ${selectedDay === day.key ? 'selected' : ''}`}
              onClick={() => setSelectedDay(day.key)}
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
          {times.map((time, index) => {
            const { available, total } = getSeatAvailability(time);
            return (
              <button
                key={index}
                className={`time-btn ${selectedTime?.time === time.time ? 'selected' : ''} ${available === 0 ? 'sold-out' : ''}`}
                onClick={() => handleTimeSelect(time)}
                disabled={available === 0}
              >
                <div className="time-info">
                  <div className="time">{time.time}</div>
                  <div className="room">Phòng {time.room}</div>
                </div>
                <div className="seat-info">
                  <div className="seats-available">{available}/{total}</div>
                  <div className="seat-label">ghế trống</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selectedTime && (
        <div className="selected-info">
          <div className="selected-time">
            ✅ Đã chọn: {selectedTime.time} - Phòng {selectedTime.room}
          </div>
        </div>
      )}
    </div>
  );
}
