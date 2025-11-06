import './UserPanel.css'; 
import React, { useState } from 'react'; 
import { H2, Button } from './UI'; 
import UserEditModal from './UserEditModal';

// Utility function for money formatting (thousand separators, no trailing ,00)
const money = (v) => {
  const n = Number(v || 0);
  return n.toLocaleString('vi-VN', { maximumFractionDigits: 0 }) + 'đ';
};
export default function UserPanel({ user, tickets, onUserUpdate }){
  const [open,setOpen]=useState(new Set()); 
  const [editModalOpen, setEditModalOpen] = useState(false);
  
  const toggle=i=>setOpen(prev=>{const n=new Set(prev); n.has(i)?n.delete(i):n.add(i); return n;});
  
  const handleUserSave = (userData) => {
    if (onUserUpdate) {
      onUserUpdate(userData);
    }
  };

  const getMembershipLevel = () => {
    if (!user) return '—';
    const points = user.points || 0;
    if (points >= 1000) return '🏆 Hạng Diamond';
    if (points >= 500) return '🥇 Hạng Gold';
    if (points >= 200) return '🥈 Hạng Silver';
    return '🥉 Hạng Bronze';
  };

  return (
    <div className="upanel" style={{ '--upanel-bg': `url(${process.env.PUBLIC_URL}/images/black-smoky-art-abstract.jpg)` }}>
      <div className="user-info-section">
        <div className="section-header">
          <H2>👤 Thông tin người dùng</H2>
          {user && (
            <Button 
              variant="outline" 
              onClick={() => setEditModalOpen(true)}
              className="edit-btn"
            >
              ✏️ Chỉnh sửa
            </Button>
          )}
        </div>
        
        <div className="user-info-card">
          <div className="user-avatar">
            <div className="avatar-circle">
              {user?.name ? user.name.charAt(0).toUpperCase() : '👤'}
            </div>
            <div className="online-indicator"></div>
          </div>
          
          <div className="info-grid">
            <div className="info-item">
              <div className="info-icon">👤</div>
              <div className="info-content">
                <div className="info-label">Họ tên</div>
                <div className="info-value">{user?.name || 'Khách'}</div>
              </div>
            </div>
            
            <div className="info-item">
              <div className="info-icon">📧</div>
              <div className="info-content">
                <div className="info-label">Email</div>
                <div className="info-value">{user?.email || '—'}</div>
              </div>
            </div>
            
            <div className="info-item">
              <div className="info-icon">📱</div>
              <div className="info-content">
                <div className="info-label">Số điện thoại</div>
                <div className="info-value">{user?.phone || '—'}</div>
              </div>
            </div>
            
            <div className="info-item">
              <div className="info-icon">🏆</div>
              <div className="info-content">
                <div className="info-label">Thành viên</div>
                <div className="info-value">{getMembershipLevel()}</div>
              </div>
            </div>
            
            <div className="info-item">
              <div className="info-icon">⭐</div>
              <div className="info-content">
                <div className="info-label">Điểm tích lũy</div>
                <div className="info-value">{user ? (user.points || 0) : 0}</div>
              </div>
            </div>
            
            <div className="info-item">
              <div className="info-icon">🎫</div>
              <div className="info-content">
                <div className="info-label">Vé đã mua</div>
                <div className="info-value">{tickets.reduce((total, ticket) => total + (Array.isArray(ticket.seats) ? ticket.seats.length : 0), 0)} vé</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="tickets-section">
        <H2>🎫 Vé đã mua</H2>
        <div className="tickets-container">
          {tickets.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🎬</div>
              <h3>Chưa có vé nào</h3>
              <p>Hãy đặt vé để xem phim yêu thích của bạn!</p>
            </div>
          ) : (
            tickets.map((t, idx) => {
              const comboTotalCalc = (Array.isArray(t.combos) ? t.combos : []).reduce((s,c)=> s + Number(c?.price||0)*Number(c?.quantity||1), 0);
              const comboTotal = (typeof t.comboTotal === 'number') ? t.comboTotal : comboTotalCalc;
              const seatTotal = (typeof t.seatTotal === 'number') ? t.seatTotal : Math.max(0, Number(t.total||0) - Number(comboTotal));
              const headerTotal = (typeof t.total === 'number') ? t.total : (seatTotal + comboTotal);
              return (
              <div key={idx} className="ticket-card">
                <div className="ticket-header">
                  <div className="ticket-poster">
                    <img src={t.poster || "https://images.unsplash.com/photo-1529101091764-c3526daf38fe?q=80&w=1200&auto=format&fit=crop"} alt={t.title} />
                  </div>
                  <div className="ticket-info">
                    <h3 className="ticket-title">{t.title}</h3>
                    <div className="ticket-meta">
                      <span className="ticket-date">
                        📅 {new Date(t.day).toLocaleDateString('vi-VN')}
                      </span>
                      <span className="ticket-time">
                        ⏰ {t.time}
                      </span>
                      <span className="ticket-room">
                        🏢 Phòng {t.room}
                      </span>
                      <span className="ticket-seats">
                        💺 Ghế: {Array.isArray(t.seats) ? t.seats.join(', ') : (typeof t.seats === 'string' ? t.seats : '—')}
                      </span>
                    </div>
                  </div>
                  <div className="ticket-actions">
                    <div className="ticket-price">{money(headerTotal)}</div>
                    <Button 
                      variant="outline" 
                      onClick={()=>toggle(idx)}
                      className="details-btn"
                    >
                      {open.has(idx) ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                    </Button>
                  </div>
                </div>
                
                {open.has(idx) && (
                  <div className="ticket-details">
                    <div className="details-header">
                      <h4>📋 Chi tiết vé</h4>
                    </div>
                    <div className="details-content">
                      <div className="detail-row">
                        <span className="detail-label">Phim:</span>
                        <span className="detail-value">{t.title}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Thời gian:</span>
                        <span className="detail-value">
                          {new Date(t.day).toLocaleDateString('vi-VN')} • {t.time} • Phòng {t.room}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Ghế:</span>
                        <span className="detail-value">{Array.isArray(t.seats) ? t.seats.join(', ') : (typeof t.seats === 'string' ? t.seats : '—')}</span>
                      </div>
                      
                      <div className="combos-section">
                        <h5>🍿 Combo đã mua</h5>
                        {t.combos && t.combos.length ? (
                          <ul className="combos-list">
                            {t.combos.map((c,i)=>
                              <li key={i} className="combo-item">
                                <span>{c.name}{Number(c?.quantity||1) > 1 ? ` × ${Number(c.quantity)}` : ''}</span>
                                <span className="combo-price">{money(Number(c?.price||0) * Number(c?.quantity||1))}</span>
                              </li>
                            )}
                          </ul>
                        ) : (
                          <div className="no-combos">Không có combo.</div>
                        )}
                      </div>
                      
                      <div className="detail-row">
                        <span className="detail-label">Giá vé:</span>
                        <span className="detail-value" style={{display:'flex', justifyContent:'space-between', width:'100%'}}>
                          <span>{Array.isArray(t.seats) ? `${t.seats.length} ghế` : ''}</span>
                          <span className="combo-price">{money(seatTotal)}</span>
                        </span>
                      </div>
                      {comboTotal > 0 && (
                        <div className="detail-row">
                          <span className="detail-label">Giá combo:</span>
                          <span className="detail-value" style={{display:'flex', justifyContent:'space-between', width:'100%'}}>
                            <span></span>
                            <span className="combo-price">{money(comboTotal)}</span>
                          </span>
                        </div>
                      )}
                      
                      <div className="total-section">
                        <span className="total-label">Tổng đã trả:</span>
                        <span className="total-value">{money(headerTotal)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )})
          )}
        </div>
      </div>

      <UserEditModal
        user={user}
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleUserSave}
      />
    </div>
  );
}
