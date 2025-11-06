import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import AuthModal from "./components/AuthModal";
import CartDrawer from "./components/CartDrawer";
import HomeRoute from "./components/routes/HomeRoute";
import MoviesRoute from "./components/routes/MoviesRoute";
import FoodsRoute from "./components/routes/FoodsRoute";
import UserRoute from "./components/routes/UserRoute";
import MovieDetailRoute from "./components/routes/MovieDetailRoute";
import AdminRoute from "./components/routes/AdminRoute";
import BookingRoute from "./components/routes/BookingRoute";
import PromoSlider from "./components/PromoSlider";
import Footer from "./components/Footer";
import { movieService } from "./services/movieService";
import { cartService } from "./services/cartService";
import { bookingService } from "./services/bookingService";
import { authService } from "./services/authService";
import "./components/GlobalPrice.css";

// Component chính chứa logic state
function AppContent() {
  const [tickets, setTickets] = useState([]);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  // Khởi tạo với fallback movies để tránh lỗi khi chưa load xong
  const [movies, setMovies] = useState([
    { id: "m1", title: "Shadow City", poster_url: "https://images.unsplash.com/photo-1529101091764-c3526daf38fe?q=80&w=1200&auto=format&fit=crop", rating: 8.4, duration: 128, tags: ["Action", "Thriller"], is_hot: true, status: "now", trailer_url: "https://www.youtube.com/embed/dQw4w9WgXcQ", description: "A rogue detective chases a masked syndicate across a neon-soaked metropolis." },
    { id: "m2", title: "Starlit Garden", poster_url: "https://images.unsplash.com/photo-1517602302552-471fe67acf66?q=80&w=1200&auto=format&fit=crop", rating: 7.6, duration: 104, tags: ["Romance", "Drama"], is_hot: true, status: "now", trailer_url: "https://www.youtube.com/embed/dQw4w9WgXcQ", description: "Two strangers meet nightly under meteor showers and rewrite their fates." },
    { id: "m3", title: "Bitwise Horizon", poster_url: "https://images.unsplash.com/photo-1508780709619-79562169bc64?q=80&w=1200&auto=format&fit=crop", rating: 8.9, duration: 142, tags: ["Sci-Fi", "Adventure"], is_hot: false, status: "soon", trailer_url: "https://www.youtube.com/embed/dQw4w9WgXcQ", description: "An engineer discovers a portal compiler that renders new realities." },
    { id: "m4", title: "Crimson Noodles", poster_url: "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?q=80&w=1200&auto=format&fit=crop", rating: 7.9, duration: 96, tags: ["Comedy"], is_hot: true, status: "now", trailer_url: "https://www.youtube.com/embed/dQw4w9WgXcQ", description: "A food-truck rivalry spirals into a citywide culinary prank war." },
    { id: "m5", title: "Paper Planets", poster_url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop", rating: 8.2, duration: 118, tags: ["Family", "Fantasy"], is_hot: false, status: "soon", trailer_url: "https://www.youtube.com/embed/dQw4w9WgXcQ", description: "Siblings fold origami worlds that unexpectedly come alive." },
  ]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Expose updateUser function globally for BookingFlow
  useEffect(() => {
    window.updateUser = (userData) => {
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    };
    return () => {
      delete window.updateUser;
    };
  }, []);

  // Load movies từ API khi component mount
  useEffect(() => {
    loadMovies();
    // Kiểm tra user đã đăng nhập chưa
    const savedUser = authService.getCurrentUser();
    if (savedUser && authService.isAuthenticated()) {
      setUser(savedUser);
    }
  }, []);

  // Reload movies khi chuyển về trang home để đảm bảo dữ liệu luôn mới
  useEffect(() => {
    if (location.pathname === "/") {
      loadMovies();
    }
  }, [location.pathname]);

  // Tự động tải vé từ DB khi vào trang user hoặc khi user thay đổi
  useEffect(() => {
    const loadUserBookings = async () => {
      if (user && location.pathname === '/user') {
        try {
          const userBookings = await bookingService.getUserBookings(user.id);
          setTickets(userBookings || []);
        } catch (error) {
          console.error('Lỗi tải vé người dùng:', error);
        }
      }
    };
    loadUserBookings();
  }, [location.pathname, user]);

  // Scroll về đầu trang khi chuyển trang
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  const loadMovies = async () => {
    try {
      setLoading(true);
      const moviesData = await movieService.getAllMovies();
      if (moviesData && moviesData.length > 0) {
        setMovies(moviesData);
      }
      // Nếu API lỗi hoặc không có dữ liệu, giữ nguyên fallback movies đã có
    } catch (error) {
      console.error('Lỗi load movies:', error);
      // Giữ nguyên fallback movies đã có sẵn
    } finally {
      setLoading(false);
    }
  };

  const addCart = async (item) => {
    if (!user) {
      setAuthMode("login");
      setAuthOpen(true);
      return;
    }
    setCart((c) => {
      // Không cho phép thêm trùng vé
      if (item?.type === 'ticket') {
        const showtimeId = item.showtimeId;
        const newSeats = new Set(item.seats || []);
        const hasDup = c.some((it) => {
          if (it.type !== 'ticket') return false;
          if (it.showtimeId !== showtimeId) return false;
          // Trùng nếu có giao nhau ghế
          const seats = new Set(it.seats || []);
          for (const s of newSeats) { if (seats.has(s)) return true; }
          return false;
        });
        if (hasDup) {
          alert('Vé này (suất/ghế) đã có trong giỏ hàng.');
          return c;
        }
      }
      return [...c, item];
    });

    // Đồng bộ giỏ hàng lên server để checkout không báo trống
    try {
      const res = await cartService.addToCart({
        itemType: item?.type || 'custom',
        itemData: item,
        quantity: 1,
      });
      if (res?.itemId) {
        setCart((c) => {
          const copy = [...c];
          copy[copy.length - 1] = { ...copy[copy.length - 1], _serverId: res.itemId };
          return copy;
        });
      }
    } catch (error) {
      console.error('Lỗi đồng bộ giỏ hàng:', error);
    }
  };
  const removeCart = async (idx) => {
    const serverId = cart[idx]?._serverId;
    setCart((c) => c.filter((_, i) => i !== idx));
    if (serverId) {
      try { await cartService.removeFromCart(serverId); } catch (e) { console.error('Lỗi xóa giỏ hàng server:', e); }
    }
  };
  const updateCartItem = async (index, updatedItem) => {
    setCart((c) => c.map((it, i) => (i === index ? updatedItem : it)));
    const serverId = updatedItem._serverId || cart[index]?._serverId;
    if (serverId) {
      try { await cartService.updateCartItem(serverId, { itemData: updatedItem, quantity: 1 }); } catch (e) { console.error('Lỗi cập nhật giỏ hàng server:', e); }
    }
  };

  // Lắng nghe sự kiện cập nhật item trong giỏ (xóa combo con)
  useEffect(() => {
    const handler = (e) => {
      const { updatedItem, index } = e;
      setCart((c) => c.map((it, i) => (i === index ? updatedItem : it)));
    };
    window.addEventListener('update-cart', handler);
    return () => window.removeEventListener('update-cart', handler);
  }, []);

  const onPaid = (ticket) => {
    setTickets((t) => [ticket, ...t]);
    navigate("/user");
  };

  const checkout = async () => {
    try {
      if (!user) {
        setAuthMode("login");
        setAuthOpen(true);
        return;
      }
      // Gọi API checkout thực
      await cartService.checkout();

      // Sau khi checkout thành công: refresh user (điểm/hạng mới)
      const freshUser = await authService.getProfile();
      if (freshUser) {
        // Bảo toàn cờ admin nếu profile không trả về
        const prev = JSON.parse(localStorage.getItem('user') || '{}');
        const merged = { ...freshUser, role: freshUser.role || prev.role, isAdmin: typeof freshUser.isAdmin === 'boolean' ? freshUser.isAdmin : prev.isAdmin };
        setUser(merged);
        localStorage.setItem('user', JSON.stringify(merged));
      }

      // Lấy danh sách vé từ DB
      const userBookings = await bookingService.getUserBookings(user.id);
      setTickets(userBookings || []);

      // Xóa giỏ hàng local và điều hướng
      setCart([]);
      setCartOpen(false);
      navigate("/user");
      alert("Thanh toán thành công! Điểm và hạng đã được cập nhật.");
    } catch (error) {
      console.error('Lỗi checkout:', error);
      alert('Checkout thất bại: ' + (error.response?.data?.error || error.message));
    }
  };

  const onLogin = async ({ email, password }) => {
    try {
      const response = await authService.login({ email, password });
      setUser(response.user);
      setAuthOpen(false);
      alert('Đăng nhập thành công!');
    } catch (error) {
      console.error('Lỗi đăng nhập:', error);
      alert('Đăng nhập thất bại: ' + (error.response?.data?.error || error.message));
    }
  };

  const onSignup = async ({ name, email, password }) => {
    try {
      const response = await authService.register({ name, email, password });
      setUser(response.user);
      setAuthOpen(false);
      alert('Đăng ký thành công!');
    } catch (error) {
      console.error('Lỗi đăng ký:', error);
      alert('Đăng ký thất bại: ' + (error.response?.data?.error || error.message));
    }
  };

  const onLogout = () => {
    authService.logout();
    setUser(null);
    setTickets([]);
    setCart([]);
    navigate("/");
    alert('Đã đăng xuất!');
  };

  // Helper functions cho navigation
  const handleOpenMovie = (movie) => {
    navigate(`/movie/${movie.id}`);
  };

  const handleBookMovie = (movie) => {
    if (!user) {
      setAuthMode("login");
      setAuthOpen(true);
      return;
    }
    navigate(`/booking/${movie.id}`);
  };

  const handleAuthRequired = () => {
    setAuthMode("login");
    setAuthOpen(true);
  };

  return (
    <div style={{minHeight:"100vh"}}>
      <Navbar
        currentPath={location.pathname}
        openCart={() => setCartOpen(true)}
        cartCount={cart.length}
        user={user}
        onLoginClick={() => { setAuthMode("login"); setAuthOpen(true); }}
        onSignupClick={() => { setAuthMode("signup"); setAuthOpen(true); }}
        onLogout={onLogout}
      />
      <div className="container">
        {/* Nếu là admin: chỉ hiển thị khu vực admin */}
        {user?.isAdmin ? (
          <Routes>
            <Route path="/admin" element={<AdminRoute user={user} />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        ) : (
        <Routes>
          <Route 
            path="/" 
            element={
              <HomeRoute 
                movies={movies} 
                loading={loading} 
                onOpenMovie={handleOpenMovie} 
                onBookMovie={handleBookMovie} 
              />
            } 
          />
          <Route 
            path="/movies" 
            element={
              <MoviesRoute 
                movies={movies} 
                loading={loading} 
                onOpenMovie={handleOpenMovie} 
                onBookMovie={handleBookMovie} 
              />
            } 
          />
          <Route 
            path="/foods" 
            element={
              <FoodsRoute 
                addItem={addCart} 
                user={user} 
                onAuthRequired={handleAuthRequired} 
              />
            } 
          />
          <Route 
            path="/user" 
            element={
              <UserRoute 
                user={user} 
                tickets={tickets} 
                onUserUpdate={(userData) => setUser(userData)} 
              />
            } 
          />
          <Route 
            path="/movie/:movieId" 
            element={
              <MovieDetailRoute 
                movies={movies} 
                user={user} 
                onAuthRequired={handleAuthRequired} 
              />
            } 
          />
          <Route 
            path="/booking/:movieId" 
            element={
              <BookingRoute 
                movies={movies} 
                user={user} 
                addToCart={addCart} 
                openCart={() => setCartOpen(true)} 
                onPaid={onPaid} 
                onAuthRequired={handleAuthRequired} 
              />
            } 
          />
        </Routes>
        )}

        <div className="seamless-background-wrapper">
          {!user?.isAdmin && (
            <>
              <PromoSlider />
              <Footer />
            </>
          )}
        </div>
      </div>

      {!user?.isAdmin && (
        <>
          <AuthModal
            open={authOpen}
            onClose={() => setAuthOpen(false)}
            mode={authMode}
            setMode={setAuthMode}
            onLogin={onLogin}
            onSignup={onSignup}
          />
          <CartDrawer
            open={cartOpen}
            onClose={() => setCartOpen(false)}
            cart={cart}
            onRemove={removeCart}
            onUpdate={updateCartItem}
            onCheckout={checkout}
          />
        </>
      )}
    </div>
  );
}

// Component chính với Router
export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
