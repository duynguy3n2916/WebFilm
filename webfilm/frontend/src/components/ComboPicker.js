import './ComboPicker.css'; 
import { Button } from './UI'; 
import { comboService } from '../services/comboService';
import { useState, useEffect } from 'react';

// Utility function for money formatting (thousand separators, no trailing ,00)
const money = (v) => {
  const n = Number(v || 0);
  return n.toLocaleString('vi-VN', { maximumFractionDigits: 0 }) + 'đ';
};

export default function ComboPicker({ onAdd }) {
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load combos từ API
  useEffect(() => {
    loadCombos();
  }, []);

  const loadCombos = async () => {
    try {
      setLoading(true);
      const combosData = await comboService.getAllCombos();
      setCombos(combosData);
    } catch (error) {
      console.error('Lỗi load combos:', error);
      // Fallback về mock data
      const fallbackCombos = [
        { id: "c1", name: "Combo Solo", items: "Popcorn + Soda", price: 69000, image: "", type: "combo" },
        { id: "c2", name: "Couple Treat", items: "2 Popcorn + 2 Soda", price: 129000, image: "", type: "combo" },
        { id: "c3", name: "Family Pack", items: "2 Large + 3 Soda", price: 189000, image: "", type: "combo" },
        { id: "c4", name: "Bắp lẻ", items: "1 Bắp lớn", price: 45000, image: "", type: "food" },
        { id: "c5", name: "Nước lẻ", items: "1 Nước lớn", price: 35000, image: "", type: "drink" },
      ];
      setCombos(fallbackCombos);
    } finally {
      setLoading(false);
    }
  };
  const getComboIcon = (name) => {
    if (name.toLowerCase().includes('bắp')) return '🍿';
    if (name.toLowerCase().includes('nước')) return '🥤';
    if (name.toLowerCase().includes('combo')) return '🍽️';
    return '🍿';
  };

  if (loading) {
    return (
      <div className="combo-picker">
        <div className="combo-header">
          <h3 className="combo-title">🍿 Chọn combo bắp nước</h3>
          <p className="combo-subtitle">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="combo-picker">
      <div className="combo-header">
        <h3 className="combo-title">🍿 Chọn combo bắp nước</h3>
        <p className="combo-subtitle">Thêm combo để có trải nghiệm xem phim hoàn hảo</p>
      </div>
      
      <div className="combo-grid">
        {combos.map(cb => (
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
            
            <div className="combo-badge">{cb.type === 'combo' ? 'Combo' : cb.type === 'food' ? 'Đồ ăn' : 'Đồ uống'}</div>
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
