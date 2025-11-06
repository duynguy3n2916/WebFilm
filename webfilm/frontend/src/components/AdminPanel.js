import React, { useEffect, useMemo, useState } from 'react';
import { movieService } from '../services/movieService';
import { adminService } from '../services/adminService';

export default function AdminPanel() {
  const [tab, setTab] = useState('movies');
  const [movies, setMovies] = useState([]);
  const [loadingMovies, setLoadingMovies] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', poster_url: '', trailer_url: '', rating: 0, duration: '', tags: '', status: 'now', is_hot: false, release_date: '', director: '', cast: '' });

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [groupBy, setGroupBy] = useState('day');
  const [rev, setRev] = useState(null);
  const [loadingRev, setLoadingRev] = useState(false);

  const resetForm = () => setForm({ title: '', description: '', poster_url: '', trailer_url: '', rating: 0, duration: '', tags: '', status: 'now', is_hot: false, release_date: '', director: '', cast: '' });

  const loadMovies = async () => {
    try {
      setLoadingMovies(true);
      const list = await movieService.getAllMovies();
      setMovies(list || []);
    } finally {
      setLoadingMovies(false);
    }
  };

  useEffect(() => { loadMovies(); }, []);

  // Helpers xử lý tags: hỗ trợ cả JSON array và string "a,b"
  const parseTags = (raw) => {
    const s = String(raw || '').trim();
    if (!s) return [];
    if (s.startsWith('[') && s.endsWith(']')) {
      try {
        const arr = JSON.parse(s);
        if (Array.isArray(arr)) return arr.map(x => String(x||'').trim()).filter(Boolean);
      } catch {}
    }
    return s.split(',').map(x => String(x||'').trim()).filter(Boolean);
  };
  const stringifyTags = (arr) => (Array.from(new Set(arr.map(s=>s.trim()).filter(Boolean))).join(','));
  const [tagInput, setTagInput] = useState('');
  const addTag = () => {
    // Chỉ cho phép chữ và khoảng trắng; loại bỏ dấu ngoặc và nháy
    let candidate = String(tagInput||'')
      .replace(/[\[\]\"']/g, '')
      .replace(/[^\p{L}\s,]/gu, '')
      .trim();
    // Nếu người dùng dán nhiều tag có dấu phẩy -> lấy từng cái
    const parts = candidate.split(',').map(s => s.trim()).filter(Boolean);
    if (!candidate) return;
    const current = parseTags(form.tags);
    const merged = stringifyTags([...current, ...parts]);
    setForm({ ...form, tags: merged });
    setTagInput('');
  };
  const removeTag = (tag) => {
    const current = parseTags(form.tags).filter(t => t !== tag);
    setForm({ ...form, tags: stringifyTags(current) });
  };

  // Gợi ý tags từ danh sách phim hiện có (đã làm sạch, bỏ " và [])
  const availableTags = useMemo(() => {
    const set = new Set();
    for (const m of movies || []) {
      const arr = parseTags(m?.tags);
      for (let t of arr) {
        const cleaned = String(t || '')
          .replace(/[\[\]\"']/g, '')
          .replace(/[^\p{L}\s]/gu, '')
          .trim();
        if (cleaned) set.add(cleaned);
      }
    }
    return Array.from(set).sort((a,b)=>a.localeCompare(b));
  }, [movies]);

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await adminService.updateMovie(editing.id, {
          ...form,
          duration: form.duration ? Number(form.duration) : null,
          rating: form.rating ? Number(form.rating) : 0,
          is_hot: !!form.is_hot
        });
        alert('Đã cập nhật phim');
      } else {
        await adminService.createMovie({
          ...form,
          duration: form.duration ? Number(form.duration) : null,
          rating: form.rating ? Number(form.rating) : 0,
          is_hot: !!form.is_hot
        });
        alert('Đã thêm phim');
      }
      resetForm();
      setEditing(null);
      await loadMovies();
    } catch (err) {
      alert('Lỗi lưu phim: ' + (err.response?.data?.error || err.message));
    }
  };

  const onEdit = (m) => {
    setEditing(m);
    setForm({
      title: m.title || '',
      description: m.description || '',
      poster_url: m.poster_url || '',
      trailer_url: m.trailer_url || '',
      rating: m.rating || 0,
      duration: m.duration || '',
      tags: m.tags || '',
      status: m.status || 'now',
      is_hot: !!m.is_hot,
      release_date: m.release_date ? String(m.release_date).slice(0,10) : '',
      director: m.director || '',
      cast: m.cast || ''
    });
  };

  const onDelete = async (m) => {
    if (!window.confirm(`Xóa phim "${m.title}"?`)) return;
    try {
      await adminService.deleteMovie(m.id);
      await loadMovies();
      alert('Đã xóa phim');
    } catch (err) {
      alert('Lỗi xóa phim: ' + (err.response?.data?.error || err.message));
    }
  };

  const fetchRevenue = async () => {
    try {
      setLoadingRev(true);
      const data = await adminService.getRevenue({ from, to, groupBy });
      setRev(data);
    } catch (err) {
      alert('Lỗi tải doanh thu: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoadingRev(false);
    }
  };

  const totalRevenue = useMemo(() => Number(rev?.overview?.total_revenue || 0), [rev]);

  const formatPeriod = (p) => {
    if (!p) return '';
    // Nếu là chuỗi YYYY-MM
    if (/^\d{4}-\d{2}$/.test(p)) return p;
    // Nếu là YYYY-MM-DD hoặc ISO -> cắt lấy YYYY-MM-DD theo múi giờ UTC
    try {
      // Nếu đã là dạng YYYY-MM-DD, trả lại luôn
      if (/^\d{4}-\d{2}-\d{2}$/.test(p)) return p;
      const d = new Date(p);
      if (Number.isNaN(d.getTime())) return String(p);
      const yyyy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(d.getUTCDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    } catch {
      return String(p);
    }
  };

  // Kiểu dáng control đồng bộ với nút (bo tròn + viền)
  const controlStyle = { border: '1px solid #333', borderRadius: 8, padding: '8px' };

  return (
    <div style={{ padding: '24px 0' }}>
      <h2>Admin Panel</h2>
      <div style={{ margin: '12px 0' }}>
        <button className={`btn btn-outline ${tab==='movies'?'active':''}`} onClick={() => setTab('movies')}>Quản lý phim</button>
        <button className={`btn btn-outline ${tab==='revenue'?'active':''}`} style={{ marginLeft: 8 }} onClick={() => setTab('revenue')}>Thống kê doanh thu</button>
      </div>

      {tab === 'movies' && (
        <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div>
            <h3>{editing ? 'Sửa phim' : 'Thêm phim mới'}</h3>
            <form onSubmit={onSubmit} className="form">
              <div className="form-group">
                <label>Tiêu đề</label>
                <input value={form.title} onChange={e=>setForm({...form, title:e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Mô tả</label>
                <textarea rows={4} value={form.description} onChange={e=>setForm({...form, description:e.target.value})} />
              </div>
              <div className="form-group">
                <label>Thời lượng (phút)</label>
                <input type="number" value={form.duration} onChange={e=>setForm({...form, duration:e.target.value})} style={controlStyle} />
              </div>
              <div className="form-group">
                <label>Tags</label>
                {/* Chips hiện tag đã chọn */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                  {parseTags(form.tags).map((t) => (
                    <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '2px 8px', border: '1px solid #444', borderRadius: 12 }}>
                      {t}
                      <button type="button" className="btn btn-outline" style={{ padding: '0 6px', lineHeight: 1 }} onClick={() => removeTag(t)}>×</button>
                    </span>
                  ))}
                </div>
                {/* Input có gợi ý + nút thêm */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    list="tagOptions"
                    value={tagInput}
                    onChange={(e)=>{
                      // Chỉ nhận chữ, khoảng trắng, dấu phẩy; loại " và []
                      const cleaned = e.target.value
                        .replace(/[\[\]\"']/g, '')
                        .replace(/[^\p{L}\s,]/gu, '');
                      setTagInput(cleaned);
                    }}
                    onKeyDown={(e)=>{ if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                    placeholder="Nhập tag rồi Enter hoặc chọn gợi ý"
                  style={controlStyle}
                  />
                  <button type="button" className="btn btn-outline" onClick={addTag}>Thêm</button>
                </div>
                <datalist id="tagOptions">
                  {availableTags.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </div>
              <div className="form-group">
                <label>Ngày phát hành</label>
                <input type="date" value={form.release_date} onChange={e=>setForm({...form, release_date:e.target.value})} style={controlStyle} />
              </div>
              <div className="form-group">
                <label>Poster URL</label>
                <input value={form.poster_url} onChange={e=>setForm({...form, poster_url:e.target.value})} style={controlStyle} />
              </div>
              <div className="form-group">
                <label>Trailer URL</label>
                <input value={form.trailer_url} onChange={e=>setForm({...form, trailer_url:e.target.value})} style={controlStyle} />
              </div>
              <div className="form-group">
                <label>Đạo diễn</label>
                <input value={form.director} onChange={e=>setForm({...form, director:e.target.value})} style={controlStyle} />
              </div>
              <div className="form-group">
                <label>Diễn viên</label>
                <input value={form.cast} onChange={e=>setForm({...form, cast:e.target.value})} style={controlStyle} />
              </div>
              <div className="form-group">
                <label>Trạng thái</label>
                <select value={form.status} onChange={e=>setForm({...form, status:e.target.value})} style={controlStyle}>
                  <option value="now">Đang chiếu</option>
                  <option value="soon">Sắp chiếu</option>
                </select>
              </div>
              <div className="form-group">
                <label>
                  <input type="checkbox" checked={form.is_hot} onChange={e=>setForm({...form, is_hot:e.target.checked})} />
                  {' '}Phim Hot
                </label>
              </div>
              <div className="form-group">
                <label>Rating</label>
                <input type="number" step="0.1" value={form.rating} onChange={e=>setForm({...form, rating:e.target.value})} style={controlStyle} />
              </div>
              <div>
                <button className="btn btn-outline" type="submit">{editing ? 'Lưu' : 'Thêm mới'}</button>
                {editing && (
                  <button className="btn btn-outline" type="button" style={{ marginLeft: 8 }} onClick={()=>{ setEditing(null); resetForm(); }}>Hủy</button>
                )}
              </div>
            </form>
          </div>
          <div>
            <h3>Danh sách phim</h3>
            {loadingMovies ? (
              <p>Đang tải...</p>
            ) : (
              <div style={{ maxHeight: 500, overflow: 'auto', border: '1px solid #333', borderRadius: 8, padding: 12 }}>
                {movies.map(m => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #444', padding: '8px 0' }}>
                    <img src={m.poster_url} alt={m.title} style={{ width: 48, height: 64, objectFit: 'cover', borderRadius: 4 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{m.title}</div>
                      <div style={{ fontSize: 12, opacity: .8 }}>Trạng thái: {m.status} • Rating: {m.rating}</div>
                    </div>
                    <button className="btn btn-outline" onClick={()=>onEdit(m)}>Sửa</button>
                    <button className="btn btn-outline" onClick={()=>onDelete(m)}>Xóa</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'revenue' && (
        <div>
          <h3>Bộ lọc</h3>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="form-group">
              <label>Từ ngày</label>
                  <input type="date" value={from} onChange={e=>setFrom(e.target.value)} style={controlStyle} />
            </div>
            <div className="form-group">
              <label>Đến ngày</label>
                  <input type="date" value={to} onChange={e=>setTo(e.target.value)} style={controlStyle} />
            </div>
            <div className="form-group">
              <label>Nhóm theo</label>
                  <select value={groupBy} onChange={e=>setGroupBy(e.target.value)} style={controlStyle}>
                <option value="day">Ngày</option>
                <option value="month">Tháng</option>
              </select>
            </div>
            <button className="btn btn-outline" onClick={fetchRevenue} disabled={loadingRev}>{loadingRev ? 'Đang tải...' : 'Xem thống kê'}</button>
          </div>

          {rev && (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <div className="card" style={{ padding: 12, border: '1px solid #333', borderRadius: 8 }}>
                  <div style={{ fontSize: 12, opacity: .8 }}>Tổng đơn</div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{rev.overview?.total_orders || 0}</div>
                </div>
                <div className="card" style={{ padding: 12, border: '1px solid #333', borderRadius: 8 }}>
                  <div style={{ fontSize: 12, opacity: .8 }}>Tổng doanh thu</div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{totalRevenue.toLocaleString('vi-VN')} ₫</div>
                </div>
                <div className="card" style={{ padding: 12, border: '1px solid #333', borderRadius: 8 }}>
                  <div style={{ fontSize: 12, opacity: .8 }}>Giá trị TB/đơn</div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{Number(rev.overview?.avg_order_value||0).toLocaleString('vi-VN')} ₫</div>
                </div>
              </div>

              <h4 style={{ marginTop: 16 }}>Doanh thu theo {groupBy==='month'?'tháng':'ngày'}</h4>
              <div style={{ border: '1px solid #333', borderRadius: 8, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #444' }}>Kỳ</th>
                      <th style={{ textAlign: 'right', padding: 8, borderBottom: '1px solid #444' }}>Đơn</th>
                      <th style={{ textAlign: 'right', padding: 8, borderBottom: '1px solid #444' }}>Doanh thu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(rev.series||[]).map((row) => (
                      <tr key={row.period}>
                        <td style={{ padding: 8, borderBottom: '1px solid #222' }}>{formatPeriod(row.period)}</td>
                        <td style={{ padding: 8, borderBottom: '1px solid #222', textAlign: 'right' }}>{row.orders}</td>
                        <td style={{ padding: 8, borderBottom: '1px solid #222', textAlign: 'right' }}>{Number(row.revenue||0).toLocaleString('vi-VN')} ₫</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h4 style={{ marginTop: 16 }}>Top phim theo doanh thu</h4>
              <div style={{ border: '1px solid #333', borderRadius: 8, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #444' }}>Phim</th>
                      <th style={{ textAlign: 'right', padding: 8, borderBottom: '1px solid #444' }}>Đơn</th>
                      <th style={{ textAlign: 'right', padding: 8, borderBottom: '1px solid #444' }}>Doanh thu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(rev.topMovies||[]).map((row) => (
                      <tr key={row.id}>
                        <td style={{ padding: 8, borderBottom: '1px solid #222' }}>{row.title}</td>
                        <td style={{ padding: 8, borderBottom: '1px solid #222', textAlign: 'right' }}>{row.orders}</td>
                        <td style={{ padding: 8, borderBottom: '1px solid #222', textAlign: 'right' }}>{Number(row.revenue||0).toLocaleString('vi-VN')} ₫</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


