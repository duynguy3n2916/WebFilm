import './BookingFlow.css'; 
import React, { useState, useEffect } from 'react'; 
import SeatMap from './SeatMap'; 
import ComboPicker from './ComboPicker'; 
import ShowtimeInfo from './ShowtimeInfo';
import ShowtimeSelector from './ShowtimeSelector';
import { Button } from './UI'; 

// Utility function for money formatting (thousand separators, no trailing ,00)
const money = (v) => {
  const n = Number(v || 0);
  return n.toLocaleString('vi-VN', { maximumFractionDigits: 0 }) + 'đ';
};
export default function BookingFlow({ ctx, onClose, addToCart, openCart, onPaid, user, onAuthRequired }){
  const { movie } = ctx; 
  const [selected,setSelected]=useState(new Set()); 
  const [step,setStep]=useState(1);
  const [selectedDay,setSelectedDay]=useState('');
  const [selectedTime,setSelectedTime]=useState(null);

  // Scroll về đầu trang khi step thay đổi
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);
  
  const toggle=(code)=>setSelected(prev=>{const n=new Set(prev); n.has(code)?n.delete(code):n.add(code); return n;});
  const dynamicSeatPrice = Number(selectedTime?.price || 85000);
  const seatsList=[...selected].sort();
  const seatsTotal=seatsList.length*dynamicSeatPrice;
  const [localCart,setLocalCart]=useState([]);
  const combosTotal=localCart.reduce((s,i)=> s + Number(i.price||0)*(Number(i.quantity||1)), 0);
  const total=seatsTotal + combosTotal;
  const addCombo=(cb)=>setLocalCart(c=>[...c,{...cb, price: Number(cb.price||0), quantity: Number(cb.quantity||1)}]);
  const removeCombo=(idx)=>setLocalCart(c=>c.filter((_,i)=>i!==idx));
  const bundle={ 
    type:'ticket', 
    movieId:movie.id, 
    title:movie.title, 
    day:selectedDay, 
    time:selectedTime?.time, 
    room:selectedTime?.room, 
    seats:seatsList, 
    combos:localCart, 
    total,
    showtimeId: selectedTime?.showtimeId,
    price: dynamicSeatPrice
  };
  const addBundleToCart=()=>{ 
    if(!user) {
      onAuthRequired();
      return;
    }
    if(!seatsList.length || !selectedTime) return; 
    addToCart(bundle); 
    openCart(); 
  };
  const payNow=async ()=>{ 
    if(!user) {
      onAuthRequired();
      return;
    }
    if(!seatsList.length || !selectedTime) return; 
    
    try {
      // Tạo booking trực tiếp
      const { bookingService } = await import('../services/bookingService');
      await bookingService.createBooking({
        showtimeId: selectedTime.showtimeId,
        seats: seatsList,
        combos: localCart,
        totalAmount: total
      });
      
      // Cập nhật thông tin user (điểm, hạng) sau khi thanh toán thành công
      const { authService } = await import('../services/authService');
      const freshUser = await authService.getProfile();
      if (freshUser) {
        // Cập nhật user trong App.js thông qua callback
        if (window.updateUser) {
          window.updateUser(freshUser);
        }
      }
      
      alert('Thanh toán thành công! Điểm và hạng đã được cập nhật.'); 
      onPaid(bundle); 
    } catch (error) {
      console.error('Lỗi thanh toán:', error);
      alert('Thanh toán thất bại: ' + (error.response?.data?.error || error.message));
    }
  };
  return (
    <div className="booking" style={{ '--booking-bg': `url(${process.env.PUBLIC_URL}/images/black-smoky-art-abstract.jpg)` }}>
      <div className="bhead">
        <h1 className="ttl">🎬 Đặt vé – {movie.title}</h1>
        <Button variant="outline" onClick={onClose}>← Quay lại</Button>
      </div>
      
      <div className="steps">
        <span className={`badge ${step>=1?'on':''}`}>1. Chọn suất chiếu</span>
        <span className={`badge ${step>=2?'on':''}`}>2. Chọn ghế</span>
        <span className={`badge ${step>=3?'on':''}`}>3. Bắp & Nước</span>
      </div>

      <div className="booking-content">
        <div className="main-content">
          {step === 1 && (
            <ShowtimeSelector 
              movieId={movie.id}
              onSelectShowtime={(showtime) => {
                setSelectedDay(showtime.day);
                setSelectedTime(showtime.time);
                setStep(2);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}
          
          {step === 2 && (
            <SeatMap 
              showtimeId={selectedTime?.showtimeId}
              selected={selected} 
              onToggle={toggle}
            />
          )}
          
          {step === 3 && (
            <ComboPicker onAdd={addCombo}/>
          )}
        </div>

        <div className="sidebar">
          <ShowtimeInfo
            movie={movie}
            day={selectedDay}
            time={selectedTime?.time || ''}
            room={selectedTime?.room || ''}
            seatPrice={dynamicSeatPrice}
            selectedSeats={seatsList}
            combos={localCart}
            total={total}
            step={step}
            onNextStep={() => {
              setStep(step + 1);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onPrevStep={() => {
              setStep(step - 1);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onAddToCart={addBundleToCart}
            onPayNow={payNow}
            onClearSeats={() => setSelected(new Set())}
            onRemoveCombo={removeCombo}
            disabled={!seatsList.length || !selectedTime}
          />
        </div>
      </div>
    </div>
  );
}
