import './Foods.css';
import { Button } from './UI';
import { comboService } from '../services/comboService';
import { useState, useEffect } from 'react';

// Utility function for money formatting (thousand separators, no trailing ,00)
const money = (v) => {
  const n = Number(v || 0);
  return n.toLocaleString('vi-VN', { maximumFractionDigits: 0 }) + 'đ';
};

export default function Foods({ addItem, user, onAuthRequired }) {
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

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
        { id: 'f1', name: 'Bắp caramel', price: 49000, type: 'food', items: 'Bắp caramel thơm ngon' },
        { id: 'f2', name: 'Bắp phô mai', price: 59000, type: 'food', items: 'Bắp phô mai đậm đà' },
        { id: 'f3', name: 'Coca 500ml', price: 29000, type: 'drink', items: 'Coca-Cola 500ml' },
      ];
      setCombos(fallbackCombos);
    } finally {
      setLoading(false);
    }
  };

  // Filter combos theo search và type
  const filteredCombos = combos.filter(combo => {
    const matchesSearch = combo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         combo.items.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || combo.type === filterType;
    return matchesSearch && matchesType;
  });

  const getFoodIcon = (name) => {
    if (name.toLowerCase().includes('bắp')) return '🍿';
    if (name.toLowerCase().includes('coca') || name.toLowerCase().includes('nước')) return '🥤';
    return '🍿';
  };

  const handleAddItem = (item) => {
    if (!user) {
      onAuthRequired();
      return;
    }
    addItem(item);
  };

  if (loading) {
    return (
      <div className="foods-page">
        <div className="foods-header">
          <h2 className="foods-title">🍿 Đồ ăn & Đồ uống</h2>
          <p className="foods-subtitle">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="foods-page">
      <div className="foods-header">
        <h2 className="foods-title">🍿 Đồ ăn & Đồ uống</h2>
        <p className="foods-subtitle">Làm phong phú trải nghiệm xem phim của bạn</p>
      </div>

      {/* Search và Filter */}
      <div className="foods-filters">
        <div className="search-wrapper">
          <div className="search-icon">🔍</div>
          <input 
            type="text"
            placeholder="Tìm đồ ăn, đồ uống..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button 
              className="clear-search" 
              onClick={() => setSearchTerm('')}
            >
              ×
            </button>
          )}
        </div>

        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            📋 Tất cả
          </button>
          <button 
            className={`filter-btn ${filterType === 'combo' ? 'active' : ''}`}
            onClick={() => setFilterType('combo')}
          >
            🍿 Combo
          </button>
          <button 
            className={`filter-btn ${filterType === 'food' ? 'active' : ''}`}
            onClick={() => setFilterType('food')}
          >
            🍿 Đồ ăn
          </button>
          <button 
            className={`filter-btn ${filterType === 'drink' ? 'active' : ''}`}
            onClick={() => setFilterType('drink')}
          >
            🥤 Đồ uống
          </button>
        </div>
      </div>

      <div className="foods-grid">
        {filteredCombos.length > 0 ? filteredCombos.map(f => (
          <div key={f.id} className="food-card">
            <div className="food-icon">{getFoodIcon(f.name)}</div>
            
            <div className="food-content">
              <h4 className="food-name">{f.name}</h4>
              <p className="food-description">{f.items}</p>
              
              <div className="food-price">{money(f.price)}</div>
              
              <Button 
                onClick={() => handleAddItem(f)}
                className="add-food-btn"
              >
                <span className="btn-icon">➕</span>
                Thêm vào giỏ
              </Button>
            </div>
            
            <div className="food-badge">{f.type === 'combo' ? 'Combo' : f.type === 'food' ? 'Đồ ăn' : 'Đồ uống'}</div>
          </div>
        )) : (
          <div className="no-results">
            <div className="no-results-icon">🍿</div>
            <h3>Không tìm thấy món nào</h3>
            <p>Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
            <button 
              className="btn btn-primary" 
              onClick={() => {
                setSearchTerm('');
                setFilterType('all');
              }}
            >
              Xóa bộ lọc
            </button>
          </div>
        )}
      </div>

      <div className="foods-tips">
        <div className="tip-icon">💡</div>
        <div className="tip-content">
          <strong>Mẹo nhỏ:</strong> Mua combo sẽ tiết kiệm hơn khi mua riêng lẻ!
        </div>
      </div>
    </div>
  );
}
