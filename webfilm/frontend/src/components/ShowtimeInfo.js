import React from 'react';
import './ShowtimeInfo.css';

// Utility function for money formatting (thousand separators, no trailing ,00)
const money = (v) => {
  const n = Number(v || 0);
  return n.toLocaleString('vi-VN', { maximumFractionDigits: 0 }) + 'đ';
};

export default function ShowtimeInfo({ 
  movie, 
  day, 
  time, 
  room, 
  seatPrice = 85000,
  selectedSeats = [], 
  combos = [], 
  total = 0,
  step = 1,
  onNextStep,
  onPrevStep,
  onAddToCart,
  onPayNow,
  onClearSeats,
  onRemoveCombo,
  disabled = false 
}) {
  const seatsTotal = selectedSeats.length * Number(seatPrice || 85000);
  const combosTotal = combos.reduce((sum, combo) => sum + (Number(combo.price)||0), 0);
  const finalTotal = seatsTotal + combosTotal;

  // Group combos by name to show quantity
  const groupedCombos = combos.reduce((acc, combo) => {
    const key = combo.name;
    if (acc[key]) {
      acc[key].quantity += 1;
      acc[key].totalPrice += combo.price;
    } else {
      acc[key] = {
        ...combo,
        quantity: 1,
        totalPrice: combo.price
      };
    }
    return acc;
  }, {});

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStepTitle = () => {
    switch(step) {
      case 1: return 'Chọn suất chiếu';
      case 2: return 'Chọn ghế';
      case 3: return 'Chọn combo';
      default: return 'Thông tin đặt vé';
    }
  };

  return (
    <div className="showtime-info">
      <div className="info-header">
        <h3 className="info-title">{getStepTitle()}</h3>
        <div className="step-indicator">
          <span className="step-number">{step}</span>
          <span className="step-total">/ 3</span>
        </div>
      </div>

      <div className="movie-details">
        <div className="movie-poster">
          <img src={movie.poster_url || movie.poster || "https://images.unsplash.com/photo-1529101091764-c3526daf38fe?q=80&w=1200&auto=format&fit=crop"} alt={movie.title} />
        </div>
        <div className="movie-info">
          <h4 className="movie-title">{movie.title}</h4>
          <div className="movie-meta">
            <span className="rating">⭐ {movie.rating}</span>
            <span className="duration">⏱️ {movie.duration} phút</span>
          </div>
        </div>
      </div>

      <div className="showtime-details">
        <div className="detail-section">
          <div className="detail-label">
            <span className="detail-icon">📅</span>
            <span>Ngày chiếu</span>
          </div>
          <div className="detail-value">{formatDate(day)}</div>
        </div>

        <div className="detail-section">
          <div className="detail-label">
            <span className="detail-icon">⏰</span>
            <span>Giờ chiếu</span>
          </div>
          <div className="detail-value">{time}</div>
        </div>

        <div className="detail-section">
          <div className="detail-label">
            <span className="detail-icon">🏢</span>
            <span>Phòng chiếu</span>
          </div>
          <div className="detail-value">Phòng {room}</div>
        </div>
      </div>

      {selectedSeats.length > 0 && (
        <div className="seats-section">
          <div className="section-header">
            <div className="detail-label">
              <span className="detail-icon">💺</span>
              <span>Ghế đã chọn</span>
            </div>
            <button 
              className="clear-btn"
              onClick={onClearSeats}
              title="Hủy tất cả ghế"
            >
              🗑️
            </button>
          </div>
          <div className="seats-list">
            {selectedSeats.map((seat, index) => (
              <span key={index} className="seat-tag">{seat}</span>
            ))}
          </div>
          <div className="seats-price">
            {selectedSeats.length} ghế × {money(seatPrice)} = {money(seatsTotal)}
          </div>
        </div>
      )}

      {combos.length > 0 && (
        <div className="combos-section">
          <div className="section-header">
            <div className="detail-label">
              <span className="detail-icon">🍿</span>
              <span>Combo đã chọn</span>
            </div>
            <button 
              className="clear-btn"
              onClick={() => {
                // Remove all combos
                combos.forEach((_, index) => onRemoveCombo(index));
              }}
              title="Hủy tất cả combo"
            >
              🗑️
            </button>
          </div>
          <div className="combos-list">
            {Object.values(groupedCombos).map((combo, index) => (
              <div key={index} className="combo-item">
                <div className="combo-info">
                  <span className="combo-name">{combo.name}</span>
                  {combo.quantity > 1 && (
                    <span className="combo-quantity">× {combo.quantity}</span>
                  )}
                </div>
                <div className="combo-actions">
                  <span className="combo-price">{money(combo.totalPrice)}</span>
                  <div className="combo-controls">
                    <button 
                      className="remove-combo-btn"
                      onClick={() => {
                        // Find the first occurrence of this combo and remove it
                        const comboIndex = combos.findIndex(c => c.name === combo.name);
                        if (comboIndex !== -1) {
                          onRemoveCombo(comboIndex);
                        }
                      }}
                      title="Xóa 1 combo này"
                    >
                      −
                    </button>
                    {combo.quantity > 1 && (
                      <button 
                        className="remove-all-combo-btn"
                        onClick={() => {
                          // Remove all instances of this combo
                          const indices = combos
                            .map((c, i) => c.name === combo.name ? i : -1)
                            .filter(i => i !== -1)
                            .reverse(); // Remove from end to avoid index shifting
                          indices.forEach(index => onRemoveCombo(index));
                        }}
                        title="Xóa tất cả combo này"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="total-section">
        <div className="total-breakdown">
          {selectedSeats.length > 0 && (
            <div className="total-line">
              <span>Vé xem phim:</span>
              <span>{money(seatsTotal)}</span>
            </div>
          )}
          {combos.length > 0 && (
            <div className="total-line">
              <span>Combo:</span>
              <span>{money(combosTotal)}</span>
            </div>
          )}
          <div className="total-line final">
            <span>Tổng cộng:</span>
            <span>{money(finalTotal)}</span>
          </div>
        </div>
      </div>

      <div className="action-buttons">
        {step === 1 ? (
          <button 
            className="btn btn-primary"
            onClick={onNextStep}
            disabled={disabled}
          >
            Tiếp tục →
          </button>
        ) : step === 2 ? (
          <>
            <button 
              className="btn btn-outline"
              onClick={onPrevStep}
            >
              ← Quay lại
            </button>
            <button 
              className="btn btn-primary"
              onClick={onNextStep}
              disabled={disabled || selectedSeats.length === 0}
            >
              Tiếp tục →
            </button>
          </>
        ) : (
          <>
            <button 
              className="btn btn-outline"
              onClick={onPrevStep}
            >
              ← Quay lại
            </button>
            <button 
              className="btn btn-outline"
              onClick={onAddToCart}
              disabled={disabled}
            >
              🛒 Thêm vào giỏ
            </button>
            <button 
              className="btn btn-primary"
              onClick={onPayNow}
              disabled={disabled}
            >
              💳 Thanh toán ngay
            </button>
          </>
        )}
      </div>
    </div>
  );
}
