import './PromoSlider.css';
import { useState } from 'react';

export default function PromoSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const promos = [
    {
      id: 1,
      title: "HELLO SUMMER",
      price: "GIÁ VÉ U22 48K",
      subtitle: "CHỈ TỪ",
      description: "U22 – GIÁ SIÊU NHẸ, TRẢI NGHIỆM SIÊU ĐỈNH",
      theme: "summer",
      icon: "🌞"
    },
    {
      id: 2,
      title: "SUẤT CHIẾU KHUYA",
      price: "CHỈ TỪ 48K",
      subtitle: "SAU 22 GIỜ",
      description: "ƯU ĐÃI SUẤT CHIẾU ĐÊM, CHỈ TỪ 48K",
      theme: "night",
      icon: "🌙"
    },
    {
      id: 3,
      title: "BACK TO SCHOOL",
      price: "COMBO 79K",
      subtitle: "VÉ + BẮP NƯỚC",
      description: "BACK TO SCHOOL U22 - VÉ XEM PHIM VÀ COMBO BẮP NƯỚC CHỈ 79K",
      theme: "school",
      icon: "🎓"
    }
  ];

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % promos.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + promos.length) % promos.length);
  };

  return (
    <div className="promo-slider-section">
      <div className="promo-slider-header">
        <h2 className="promo-slider-title">ƯU ĐÃI ĐẶC BIỆT</h2>
      </div>
      
      <div className="promo-slider-container">
        <button className="promo-nav promo-nav-left" onClick={prevSlide}>
          ‹
        </button>
        
        <div className="promo-slider-wrapper">
          <div 
            className="promo-slider-content"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {promos.map((promo) => (
              <div key={promo.id} className="promo-card">
                <div className={`promo-card-bg promo-theme-${promo.theme}`}>
                  <div className="promo-logo">CinemaX</div>
                  <div className="promo-main-content">
                    <div className="promo-icon">{promo.icon}</div>
                    <h3 className="promo-card-title">{promo.title}</h3>
                    <div className="promo-price-circle">
                      <div className="promo-price">{promo.price}</div>
                      <div className="promo-subtitle">{promo.subtitle}</div>
                    </div>
                  </div>
                </div>
                <div className="promo-description">
                  <p>{promo.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <button className="promo-nav promo-nav-right" onClick={nextSlide}>
          ›
        </button>
      </div>

      <div className="promo-dots">
        {promos.map((_, index) => (
          <button
            key={index}
            className={`promo-dot ${index === currentIndex ? 'active' : ''}`}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>
    </div>
  );
}

