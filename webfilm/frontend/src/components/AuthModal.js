import './AuthModal.css'; import { useState } from 'react'; import { Button } from './UI';
export default function AuthModal({ open, onClose, mode, setMode, onLogin, onSignup }) {
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  if (!open) return null;
  const submit = () => {
    if (mode === "signup") { if (!name || !email || !password) return alert("Vui lòng điền đầy đủ."); onSignup({ name, email, password }); }
    else { if (!email || !password) return alert("Nhập email và mật khẩu."); onLogin({ email, password }); }
    setName(""); setEmail(""); setPassword("");
  };
  return (
    <div className="auth-wrap">
      <div className="overlay" onClick={onClose}/>
      <div className="auth card shadow">
        <div className="auth-head">
          <div className="title">{mode==="signup"?"Đăng ký":"Đăng nhập"}</div>
          <button className="x" onClick={onClose}>×</button>
        </div>
        <div className="tabs">
          <button className={`btn btn-outline ${mode==='login'?'on':''}`} onClick={()=>setMode('login')}>Đăng nhập</button>
          <button className={`btn btn-outline ${mode==='signup'?'on':''}`} onClick={()=>setMode('signup')}>Đăng ký</button>
        </div>
        {mode==='signup' && (
          <div className="form">
            <label>Họ tên</label><input value={name} onChange={e=>setName(e.target.value)} />
            <label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} />
            <label>Mật khẩu</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} />
            <div className="row"><Button variant="outline" onClick={onClose}>Hủy</Button><Button variant="login" onClick={submit}>Tạo tài khoản</Button></div>
          </div>
        )}
        {mode==='login' && (
          <div className="form">
            <label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} />
            <label>Mật khẩu</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} />
            <div className="row"><Button variant="outline" onClick={onClose}>Hủy</Button><Button variant="login" onClick={submit}>Đăng nhập</Button></div>
          </div>
        )}
      </div>
    </div>
  );
}
