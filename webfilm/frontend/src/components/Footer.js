import './Footer.css';

export default function Footer() {
  return (
    <>
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-content">
            {/* Cột 1: Về CinemaX */}
            <div className="footer-column">
              <h3 className="footer-heading">VỀ CINEMAX</h3>
              <ul className="footer-list">
                <li><a href="#">Liên hệ</a></li>
                <li><a href="#">Về chúng tôi</a></li>
              </ul>
            </div>

            {/* Cột 2: Quy định & Điều khoản */}
            <div className="footer-column">
              <h3 className="footer-heading">QUY ĐỊNH & ĐIỀU KHOẢN</h3>
              <ul className="footer-list">
                <li><a href="#">Quy định thành viên</a></li>
                <li><a href="#">Điều khoản</a></li>
                <li><a href="#">Hướng dẫn đặt vé trực tuyến</a></li>
                <li><a href="#">Quy định và chính sách chung</a></li>
                <li><a href="#">Chính sách bảo vệ thông tin cá nhân</a></li>
              </ul>
            </div>

            {/* Cột 3: Chăm sóc khách hàng */}
            <div className="footer-column">
              <h3 className="footer-heading">CHĂM SÓC KHÁCH HÀNG</h3>
              <div className="footer-contact">
                <p><strong>Hotline:</strong> 19002099</p>
                <p><strong>Giờ làm việc:</strong> 9:00 - 22:00<br />(Tất cả các ngày bao gồm cả Lễ, Tết)</p>
                <p><strong>Email hỗ trợ:</strong><br />cskh@cinemax.vn</p>
              </div>
              
              <div className="footer-social">
                <h4 className="footer-social-title">MẠNG XÃ HỘI</h4>
                <div className="footer-social-icons">
                  <a href="#" className="social-icon facebook" aria-label="Facebook">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                  <a href="#" className="social-icon instagram" aria-label="Instagram">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                  <a href="#" className="social-icon tiktok" aria-label="TikTok">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                  </a>
                  <a href="#" className="social-icon youtube" aria-label="YouTube">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Action Buttons */}
      <div className="fab-container">
        <a href="tel:19002099" className="fab fab-phone" aria-label="Gọi hotline">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
          </svg>
        </a>
        <a href="#" className="fab fab-messenger" aria-label="Messenger">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.477 2 12c0 1.5.345 2.91.955 4.177L2 22l5.823-.955C9.09 21.655 10.5 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18c-1.2 0-2.36-.21-3.45-.6l-.36-.12-.36.12-3.36 1.55 1.55-3.36.12-.36-.12-.36C5.21 14.36 5 13.2 5 12c0-3.86 3.14-7 7-7s7 3.14 7 7-3.14 7-7 7zm3.5-9.5c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm-7 0c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm3.5 0c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z"/>
          </svg>
        </a>
      </div>
    </>
  );
}
