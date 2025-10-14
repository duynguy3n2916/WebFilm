import React, { useState } from "react";
import Navbar from "./components/Navbar";
import AuthModal from "./components/AuthModal";
import CartDrawer from "./components/CartDrawer";
import Home from "./components/Home";
import Movies from "./components/Movies";
import Foods from "./components/Foods";
import MovieDetail from "./components/MovieDetail";
import BookingFlow from "./components/BookingFlow";
import UserPanel from "./components/UserPanel";
import PromoSlider from "./components/PromoSlider";
import Footer from "./components/Footer";
import { MOVIES } from "./components/sharedData";
import "./components/GlobalPrice.css";

export default function App() {
  const [page, setPage] = useState("home");
  const [detail, setDetail] = useState(null);
  const [booking, setBooking] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");

  const addCart = (item) => {
    if (!user) {
      setAuthMode("login");
      setAuthOpen(true);
      return;
    }
    setCart((c) => [...c, item]);
  };
  const removeCart = (idx) => setCart((c) => c.filter((_, i) => i !== idx));

  const onPaid = (ticket) => {
    setTickets((t) => [ticket, ...t]);
    setBooking(null);
    setPage("user");
  };

  const checkout = () => {
    const bundles = cart.filter((it) => it.type === "ticket");
    if (bundles.length === 0) return alert("(Demo) Chưa có vé trong giỏ.");
    bundles.forEach((b) =>
      setTickets((prev) => [
        { movieId: b.movieId, title: b.title, day: b.day, time: b.time, room: b.room, seats: b.seats, combos: b.combos, total: b.total },
        ...prev,
      ])
    );
    setCart([]);
    setCartOpen(false);
    setPage("user");
    alert("(Demo) Thanh toán thành công! Xem vé trong trang User.");
  };

  const onLogin  = ({ email }) => { const name = email.split("@")[0]; setUser({ name, email }); setAuthOpen(false); };
  const onSignup = ({ name, email }) => { setUser({ name, email }); setAuthOpen(false); };
  const onLogout = () => { setUser(null); setPage("home"); };

  return (
    <div style={{minHeight:"100vh"}}>
      <Navbar
        page={page}
        go={setPage}
        openCart={() => setCartOpen(true)}
        cartCount={cart.length}
        user={user}
        onLoginClick={() => { setAuthMode("login"); setAuthOpen(true); }}
        onSignupClick={() => { setAuthMode("signup"); setAuthOpen(true); }}
        onLogout={onLogout}
      />

      <div className="container">
        {page === "home"   && <Home onOpenMovie={(m)=>{ setDetail(m); setPage("movie"); window.scrollTo(0, 0); }} onBookMovie={(m)=>{ 
          if (!user) {
            setAuthMode("login");
            setAuthOpen(true);
            return;
          }
          setBooking({ movie: m }); setPage("booking"); 
        }} />}
        {page === "movies" && <Movies onOpenMovie={(m)=>{ setDetail(m); setPage("movie"); window.scrollTo(0, 0); }} onBookMovie={(m)=>{ 
          if (!user) {
            setAuthMode("login");
            setAuthOpen(true);
            return;
          }
          setBooking({ movie: m }); setPage("booking"); 
        }} />}
        {page === "foods"  && <Foods addItem={addCart} user={user} onAuthRequired={() => {
          setAuthMode("login");
          setAuthOpen(true);
        }} />}
        {page === "user"   && <UserPanel user={user} tickets={tickets} onUserUpdate={(userData) => setUser(userData)} />}

        {page === "movie" && detail && (
          <MovieDetail
            movie={detail}
            onClose={() => { setDetail(null); setPage("home"); window.scrollTo(0, 0); }}
            onBookDirect={(movie) => { 
              if (!user) {
                setAuthMode("login");
                setAuthOpen(true);
                return;
              }
              setBooking({ movie }); setPage("booking"); window.scrollTo(0, 0);
            }}
          />
        )}

        {page === "booking" && booking && (
          <BookingFlow
            ctx={booking}
            onClose={() => { setPage("movie"); window.scrollTo(0, 0); }}
            addToCart={addCart}
            openCart={() => setCartOpen(true)}
            onPaid={onPaid}
            user={user}
            onAuthRequired={() => {
              setAuthMode("login");
              setAuthOpen(true);
            }}
          />
        )}

        <PromoSlider />
        <Footer />
      </div>

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
        onCheckout={checkout}
      />
    </div>
  );
}
