import './CartDrawer.css'; 
import { Button } from './UI'; 

// Utility function for money formatting (thousand separators, no trailing ,00)
const money = (v) => {
  const n = Number(v || 0);
  return n.toLocaleString('vi-VN', { maximumFractionDigits: 0 }) + 'đ';
};
export default function CartDrawer({ open, onClose, cart, onRemove, onUpdate, onCheckout }) {
  if (!open) return null;
  const total = cart.reduce((s, it) => s + Number(it.total ?? it.price ?? 0), 0);
  return (
    <div className="drawer-wrap">
      <div className="backdrop" onClick={onClose}/>
      <div className="drawer card shadow">
        <div className="head"><div className="t">Giỏ hàng</div><button className="x" onClick={onClose}>×</button></div>
        <div className="list">
          {cart.length===0 && <div className="empty">Chưa có sản phẩm.</div>}
          {cart.map((it, idx)=>(
            <div key={idx} className="item card">
              <div className="left">
                <div className="name">{it.type==='ticket'?`Vé ${it.title} – ${new Date(it.day).toLocaleDateString('vi-VN')} ${it.time}`:(it.name||'Mục')}</div>
                {it.type==='ticket' && <div className="sub">Phòng {it.room} • Ghế: {it.seats.join(', ')}</div>}
                {it.type==='ticket' && it.combos?.length>0 && (
                  <div className="sub">
                    Combo:
                    <ul className="combo-mini">
                      {it.combos.map((c, i) => (
                        <li key={i}>
                          <span>{c.name}</span>
                          <span className="price-mini">{money(Number(c.price||0) * Number(c.quantity||1))}</span>
                          <button className="rm-mini" onClick={()=>{
                            // Xóa 1 combo khỏi bundle trong giỏ (không xóa cả item)
                            const newItem = { ...it, combos: it.combos.filter((_, k) => k !== i) };
                            const comboTotal = newItem.combos.reduce((s, cb)=> s + Number(cb.price||0)*Number(cb.quantity||1), 0);
                            const seatsTotal = (it.seats?.length||0) * Number(it.price||0);
                            newItem.total = seatsTotal + comboTotal;
                            onUpdate?.(idx, newItem);
                          }}>×</button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {it.type==='ticket' && (
                  <div className="break">
                    <div className="line"><span>Vé:</span><span>{(it.seats?.length||0)} × {money(Number(it.price||0))} = {money((it.seats?.length||0)*Number(it.price||0))}</span></div>
                    {it.combos?.length>0 && (
                      <div className="line"><span>Combo:</span><span>{money(it.combos.reduce((s,cb)=> s+Number(cb.price||0)*Number(cb.quantity||1),0))}</span></div>
                    )}
                  </div>
                )}
                <div className="price under">{money(Number(it.total ?? it.price ?? 0))}</div>
              </div>
              <div className="right"><button className="rm" onClick={()=>onRemove(idx)}>Xóa</button></div>
            </div>
          ))}
        </div>
        <div className="total"><div>Tổng</div><div className="bold">{money(total)}</div></div>
        <Button onClick={onCheckout} disabled={!cart.length}>Thanh toán</Button>
      </div>
    </div>
  );
}
