import './CartDrawer.css'; import { Button } from './UI'; import { money } from './sharedData';
export default function CartDrawer({ open, onClose, cart, onRemove, onCheckout }) {
  if (!open) return null;
  const total = cart.reduce((s, it) => s + (it.total || it.price || 0), 0);
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
                <div className="name">{it.type==='ticket'?`Vé ${it.title} – ${it.time}`:(it.name||'Mục')}</div>
                {it.type==='ticket' && <div className="sub">{new Date(it.day).toLocaleDateString('vi-VN')} • Phòng {it.room} • Ghế: {it.seats.join(', ')}</div>}
                {it.type==='ticket' && it.combos?.length>0 && <div className="sub">Combo: {it.combos.map(c=>c.name).join(', ')}</div>}
              </div>
              <div className="right"><div className="price">{money(it.total || it.price || 0)}</div><button className="rm" onClick={()=>onRemove(idx)}>Xóa</button></div>
            </div>
          ))}
        </div>
        <div className="total"><div>Tổng</div><div className="bold">{money(total)}</div></div>
        <Button onClick={onCheckout} disabled={!cart.length}>Thanh toán</Button>
      </div>
    </div>
  );
}
