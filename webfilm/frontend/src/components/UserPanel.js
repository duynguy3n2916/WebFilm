import './UserPanel.css'; 
import React, { useState } from 'react'; 
import { H2, Button } from './UI'; 
import { MOVIES, money } from './sharedData';
import UserEditModal from './UserEditModal';
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
    const points = user.points || 320;
    if (points >= 1000) return '🏆 Hạng Diamond';
    if (points >= 500) return '🥇 Hạng Gold';
    if (points >= 200) return '🥈 Hạng Silver';
    return '🥉 Hạng Bronze';
  };

  return (
    <div className="upanel">
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
                <div className="info-value">{user ? (user.points || 320) : 0}</div>
              </div>
            </div>
            
            <div className="info-item">
              <div className="info-icon">🎫</div>
              <div className="info-content">
                <div className="info-label">Vé đã mua</div>
                <div className="info-value">{tickets.length} vé</div>
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
            tickets.map((t, idx) => (
              <div key={idx} className="ticket-card">
                <div className="ticket-header">
                  <div className="ticket-poster">
                    <img src={MOVIES.find(m=>m.id===t.movieId)?.poster} alt={t.title} />
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
                        💺 Ghế: {t.seats.join(', ')}
                      </span>
                    </div>
                  </div>
                  <div className="ticket-actions">
                    <div className="ticket-price">{money(t.total || 0)}</div>
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
                        <span className="detail-value">{t.seats.join(', ')}</span>
                      </div>
                      
                      <div className="combos-section">
                        <h5>🍿 Combo đã mua</h5>
                        {t.combos && t.combos.length ? (
                          <ul className="combos-list">
                            {t.combos.map((c,i)=>
                              <li key={i} className="combo-item">
                                <span>{c.name}</span>
                                <span className="combo-price">{money(c.price)}</span>
                              </li>
                            )}
                          </ul>
                        ) : (
                          <div className="no-combos">Không có combo.</div>
                        )}
                      </div>
                      
                      <div className="total-section">
                        <span className="total-label">Tổng đã trả:</span>
                        <span className="total-value">{money(t.total || 0)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
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
