import './Navbar.css';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar({ currentPath, openCart, cartCount, user, onLoginClick, onSignupClick, onLogout }) {
  const location = useLocation();
  const currentPage = location.pathname;
  
  return (
    <div className="nav">
      <div className="container nav-inner">
        <Link to="/" className="brand">
          <img src="/banners/logo.png" alt="CinemaX Logo" className="logo" />
          CinemaX
        </Link>
        <nav className="menu">
          {(user?.isAdmin
            ? [ { path: "/admin", label: "Admin" } ]
            : [
                {path: "/", label: "Trang chủ"},
                {path: "/movies", label: "Phim"},
                {path: "/foods", label: "Đồ ăn & uống"}
              ]
            ).map(({path, label}) => (
            <Link 
              key={path} 
              to={path} 
              className={`btn btn-outline ${currentPage === path ? "active" : ""}`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="right">
          {user ? (
            <>
              <Link to="/user" className="btn btn-outline user-btn">👤 {user.name}</Link>
              <button onClick={onLogout} className="btn btn-outline">ĐĂNG XUẤT</button>
            </>
          ) : (
            <button onClick={onLoginClick} className="btn btn-outline">ĐĂNG NHẬP / ĐĂNG KÝ</button>
          )}
          {!user?.isAdmin && (
            <button onClick={openCart} className="btn btn-outline cart" aria-label="Giỏ hàng">
              🛒
              {cartCount>0 && <span className="badge-count">{cartCount}</span>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
