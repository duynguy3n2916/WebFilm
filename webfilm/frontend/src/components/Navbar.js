import './Navbar.css';
export default function Navbar({ page, go, openCart, cartCount, user, onLoginClick, onSignupClick, onLogout }) {
  const handleNavigate = (pageName) => {
    go(pageName);
    window.scrollTo(0, 0);
  };
  
  return (
    <div className="nav">
      <div className="container nav-inner">
        <div className="brand">
          <div className="logo">🎬</div>
          CinemaX
        </div>
        <nav className="menu">
          {[["home","Trang chủ"],["movies","Phim"],["foods","Đồ ăn & uống"]].map(([k,label])=> (
            <button key={k} onClick={()=>handleNavigate(k)} className={`btn btn-outline ${page===k?"active":""}`}>{label}</button>
          ))}
        </nav>
        <div className="right">
          {user ? (
            <>
              <button onClick={()=>handleNavigate("user")} className="btn btn-outline user-btn">👤 {user.name}</button>
              <button onClick={onLogout} className="btn btn-outline">ĐĂNG XUẤT</button>
            </>
          ) : (
            <button onClick={onLoginClick} className="btn btn-outline">ĐĂNG NHẬP / ĐĂNG KÝ</button>
          )}
          <button onClick={openCart} className="btn btn-outline cart" aria-label="Giỏ hàng">
            🛒
            {cartCount>0 && <span className="badge-count">{cartCount}</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
