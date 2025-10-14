import './Foods.css';
import { Button } from './UI';
import { money } from './sharedData';

export default function Foods({ addItem, user, onAuthRequired }) {
  const foods = [
    { id: 'f1', name: 'Bắp caramel', price: 49000, type: 'food', items: 'Bắp caramel thơm ngon', image: '' },
    { id: 'f2', name: 'Bắp phô mai', price: 59000, type: 'food', items: 'Bắp phô mai đậm đà', image: '' },
    { id: 'f3', name: 'Coca 500ml', price: 29000, type: 'drink', items: 'Coca-Cola 500ml', image: '' },
  ];

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

  return (
    <div className="foods-page">
      <div className="foods-header">
        <h2 className="foods-title">🍿 Đồ ăn & Đồ uống</h2>
        <p className="foods-subtitle">Làm phong phú trải nghiệm xem phim của bạn</p>
      </div>

      <div className="foods-grid">
        {foods.map(f => (
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
            
            <div className="food-badge">Phổ biến</div>
          </div>
        ))}
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
