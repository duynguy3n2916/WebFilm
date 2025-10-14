import './BookingFlow.css'; 
import React, { useState } from 'react'; 
import SeatMap from './SeatMap'; 
import ComboPicker from './ComboPicker'; 
import ShowtimeInfo from './ShowtimeInfo';
import ShowtimeSelector from './ShowtimeSelector';
import { Button } from './UI'; 
import { money, DAYS, SHOWTIMES } from './sharedData';
export default function BookingFlow({ ctx, onClose, addToCart, openCart, onPaid, user, onAuthRequired }){
  const { movie } = ctx; 
  const [selected,setSelected]=useState(new Set()); 
  const [step,setStep]=useState(1);
  const [selectedDay,setSelectedDay]=useState(DAYS[0].key);
  const [selectedTime,setSelectedTime]=useState(null);
  const times=SHOWTIMES[selectedDay]||[];
  
  const toggle=(code)=>setSelected(prev=>{const n=new Set(prev); n.has(code)?n.delete(code):n.add(code); return n;});
  const seatPrice=85000; const seatsList=[...selected].sort(); const seatsTotal=seatsList.length*seatPrice;
  const [localCart,setLocalCart]=useState([]); const total=seatsTotal+localCart.reduce((s,i)=>s+i.price,0);
  const addCombo=(cb)=>setLocalCart(c=>[...c,{...cb}]); const removeCombo=(idx)=>setLocalCart(c=>c.filter((_,i)=>i!==idx));
  const bundle={ type:'ticket', movieId:movie.id, title:movie.title, day:selectedDay, time:selectedTime?.time, room:selectedTime?.room, seats:seatsList, combos:localCart, total };
  const addBundleToCart=()=>{ 
    if(!user) {
      onAuthRequired();
      return;
    }
    if(!seatsList.length || !selectedTime) return; 
    addToCart(bundle); 
    openCart(); 
  };
  const payNow=()=>{ 
    if(!user) {
      onAuthRequired();
      return;
    }
    if(!seatsList.length || !selectedTime) return; 
    alert('(Demo) Thanh toán thành công!'); 
    onPaid(bundle); 
  };
  return (
    <div className="booking">
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
              onSelectShowtime={(showtime) => {
                setSelectedDay(showtime.day);
                setSelectedTime(showtime.time);
                setStep(2);
              }}
            />
          )}
          
          {step === 2 && (
            <SeatMap selected={selected} onToggle={toggle}/>
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
            selectedSeats={seatsList}
            combos={localCart}
            total={total}
            step={step}
            onNextStep={() => setStep(step + 1)}
            onPrevStep={() => setStep(step - 1)}
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
