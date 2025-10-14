import './ComboPicker.css'; 
import { Button } from './UI'; 
import { COMBOS } from './sharedData'; 
import { money } from './sharedData';

export default function ComboPicker({ onAdd }) {
  const getComboIcon = (name) => {
    if (name.toLowerCase().includes('bắp')) return '🍿';
    if (name.toLowerCase().includes('nước')) return '🥤';
    if (name.toLowerCase().includes('combo')) return '🍽️';
    return '🍿';
  };

  return (
    <div className="combo-picker">
      <div className="combo-header">
        <h3 className="combo-title">🍿 Chọn combo bắp nước</h3>
        <p className="combo-subtitle">Thêm combo để có trải nghiệm xem phim hoàn hảo</p>
      </div>
      
      <div className="combo-grid">
        {COMBOS.map(cb => (
          <div key={cb.id} className="combo-card">
            <div className="combo-icon">{getComboIcon(cb.name)}</div>
            
            <div className="combo-content">
              <h4 className="combo-name">{cb.name}</h4>
              <p className="combo-description">{cb.items}</p>
              
              <div className="combo-price">{money(cb.price)}</div>
              
              <Button 
                onClick={() => onAdd(cb)}
                className="add-combo-btn"
              >
                <span className="btn-icon">➕</span>
                Thêm vào giỏ
              </Button>
            </div>
            
            <div className="combo-badge">Phổ biến</div>
          </div>
        ))}
      </div>
      
      <div className="combo-tips">
        <div className="tip-icon">💡</div>
        <div className="tip-content">
          <strong>Mẹo nhỏ:</strong> Combo thường có giá tốt hơn khi mua riêng lẻ!
        </div>
      </div>
    </div>
  );
}
