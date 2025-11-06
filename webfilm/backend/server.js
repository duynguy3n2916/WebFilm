const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool, testConnection } = require('./db');
const ShowtimeGenerator = require('./services/showtimeGenerator');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(cors());
app.use(express.json());

// Middleware xác thực JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Middleware kiểm tra quyền admin
const requireAdmin = (req, res, next) => {
  // Hỗ trợ cả token có role hoặc isAdmin
  const isAdmin = req.user?.role === 'admin' || req.user?.isAdmin === true;
  if (!isAdmin) {
    return res.status(403).json({ error: 'Chỉ admin mới có quyền truy cập' });
  }
  next();
};

// Chuẩn hoá tags: nhận string ("a,b") hoặc array(["a","b"]) => JSON string ["a","b"]
const normalizeTagsToJson = (input) => {
  try {
    let arr = [];
    if (Array.isArray(input)) {
      arr = input;
    } else if (typeof input === 'string') {
      let s = input.trim();
      // Nếu là JSON array
      if (s.startsWith('[') && s.endsWith(']')) {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) arr = parsed; else arr = [s];
      } else {
        arr = s.split(',');
      }
    }

    // Làm sạch: chỉ cho phép ký tự chữ và khoảng trắng, bỏ dấu ngoặc/nháy
    const cleaned = arr
      .map(x => String(x || ''))
      .map(x => x.replace(/[\[\]\"']/g, ''))
      .map(x => x.replace(/[^\p{L}\s]/gu, ''))
      .map(x => x.trim())
      .filter(Boolean);

    // Loại trùng và trả về JSON string
    const unique = Array.from(new Set(cleaned));
    return JSON.stringify(unique);
  } catch {
    return JSON.stringify([]);
  }
};

// ============ AUTH APIs ============
// Đăng ký
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Tất cả trường đều bắt buộc' });
    }

    // Kiểm tra email hoặc username đã tồn tại
    const [existingUsers] = await pool.execute(
      'SELECT id, email, name FROM users WHERE email = ? OR name = ?',
      [email, name]
    );

    if (existingUsers.length > 0) {
      const conflict = existingUsers[0];
      if (conflict.email === email) {
        return res.status(400).json({ error: 'Email đã được sử dụng' });
      }
      if (conflict.name === name) {
        return res.status(400).json({ error: 'Username đã được sử dụng' });
      }
      return res.status(400).json({ error: 'Thông tin tài khoản đã tồn tại' });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Tạo user mới
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, passwordHash]
    );

    // Tạo token
    const token = jwt.sign(
      { userId: result.insertId, email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Đăng ký thành công',
      token,
      user: { id: result.insertId, name, email }
    });

  } catch (error) {
    console.error('Lỗi đăng ký:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Đăng nhập
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email và mật khẩu là bắt buộc' });
    }

    // Tìm user
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(400).json({ error: 'Email hoặc mật khẩu không đúng' });
    }

    const user = users[0];

    // Kiểm tra password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Email hoặc mật khẩu không đúng' });
    }

    // Tạo token
    // Xác định role/isAdmin (tương thích nếu DB chưa có cột)
    const role = user.role || (user.is_admin === 1 ? 'admin' : 'user') || 'user';
    const isAdmin = role === 'admin';

    const token = jwt.sign(
      { userId: user.id, email: user.email, role, isAdmin },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Đăng nhập thành công',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        points: user.points,
        membership_level: user.membership_level,
        role,
        isAdmin
      }
    });

  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Lấy thông tin profile
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, name, email, phone, points, membership_level FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy user' });
    }

    res.json({ user: users[0] });
  } catch (error) {
    console.error('Lỗi lấy profile:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Cập nhật profile
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { name, phone } = req.body;
    
    await pool.execute(
      'UPDATE users SET name = ?, phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, phone, req.user.userId]
    );

    res.json({ message: 'Cập nhật profile thành công' });
  } catch (error) {
    console.error('Lỗi cập nhật profile:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// ============ MOVIES APIs ============
// Lấy tất cả phim
app.get('/api/movies', async (req, res) => {
  try {
    const [movies] = await pool.execute(
      'SELECT * FROM movies ORDER BY created_at DESC'
    );
    res.json({ movies });
  } catch (error) {
    console.error('Lỗi lấy danh sách phim:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Lấy phim theo ID
app.get('/api/movies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [movies] = await pool.execute(
      'SELECT * FROM movies WHERE id = ?',
      [id]
    );

    if (movies.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy phim' });
    }

    res.json({ movie: movies[0] });
  } catch (error) {
    console.error('Lỗi lấy phim:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Lấy phim hot
app.get('/api/movies/hot', async (req, res) => {
  try {
    const [movies] = await pool.execute(
      'SELECT * FROM movies WHERE is_hot = true ORDER BY rating DESC LIMIT 5'
    );
    res.json({ movies });
  } catch (error) {
    console.error('Lỗi lấy phim hot:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Lấy phim đang chiếu
app.get('/api/movies/now-showing', async (req, res) => {
  try {
    const [movies] = await pool.execute(
      'SELECT * FROM movies WHERE status = "now" ORDER BY rating DESC'
    );
    res.json({ movies });
  } catch (error) {
    console.error('Lỗi lấy phim đang chiếu:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Lấy phim sắp chiếu
app.get('/api/movies/coming-soon', async (req, res) => {
  try {
    const [movies] = await pool.execute(
      'SELECT * FROM movies WHERE status = "soon" ORDER BY release_date ASC'
    );
    res.json({ movies });
  } catch (error) {
    console.error('Lỗi lấy phim sắp chiếu:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// ============ ADMIN MOVIES CRUD ============
// Tạo phim mới
app.post('/api/admin/movies', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, description, duration, release_date, poster_url, trailer_url, status, is_hot, rating, tags, director, cast } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Tiêu đề phim là bắt buộc' });
    }

    const [result] = await pool.execute(
      `INSERT INTO movies (title, description, poster_url, trailer_url, rating, duration, tags, status, is_hot, release_date, director, cast, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [
        title,
        description || '',
        poster_url || '',
        trailer_url || '',
        Number(rating) || 0,
        Number(duration) || null,
        normalizeTagsToJson(tags),
        status || 'now',
        !!is_hot,
        release_date || null,
        director || '',
        cast || ''
      ]
    );

    const [rows] = await pool.execute('SELECT * FROM movies WHERE id = ?', [result.insertId]);
    res.status(201).json({ message: 'Đã tạo phim', movie: rows[0] });
  } catch (error) {
    console.error('Lỗi tạo phim:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Cập nhật phim
app.put('/api/admin/movies/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, duration, release_date, poster_url, trailer_url, status, is_hot, rating, tags, director, cast } = req.body;

    const [result] = await pool.execute(
      `UPDATE movies SET 
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        poster_url = COALESCE(?, poster_url),
        trailer_url = COALESCE(?, trailer_url),
        rating = COALESCE(?, rating),
        duration = COALESCE(?, duration),
        release_date = COALESCE(?, release_date),
        tags = COALESCE(?, tags),
        status = COALESCE(?, status),
        is_hot = COALESCE(?, is_hot),
        director = COALESCE(?, director),
        cast = COALESCE(?, cast),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        title,
        description,
        poster_url,
        trailer_url,
        rating,
        duration,
        release_date,
        normalizeTagsToJson(tags),
        status,
        typeof is_hot === 'boolean' ? is_hot : null,
        director,
        cast,
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Không tìm thấy phim' });
    }

    const [rows] = await pool.execute('SELECT * FROM movies WHERE id = ?', [id]);
    res.json({ message: 'Đã cập nhật phim', movie: rows[0] });
  } catch (error) {
    console.error('Lỗi cập nhật phim:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Xóa phim
app.delete('/api/admin/movies/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.execute('DELETE FROM movies WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Không tìm thấy phim' });
    }
    res.json({ message: 'Đã xóa phim' });
  } catch (error) {
    console.error('Lỗi xóa phim:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// ============ ADMIN REVENUE STATS ============
// Thống kê doanh thu theo khoảng thời gian
app.get('/api/admin/revenue', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { from, to, groupBy = 'day' } = req.query;

    const dateFilter = [];
    const params = [];
    if (from) { dateFilter.push('b.booking_date >= ?'); params.push(from); }
    if (to) { dateFilter.push('b.booking_date <= ?'); params.push(to); }
    const where = dateFilter.length ? 'WHERE ' + dateFilter.join(' AND ') : '';

    // Tổng quan
    const [overviewRows] = await pool.execute(
      `SELECT 
         COUNT(*) AS total_orders,
         SUM(b.total_amount) AS total_revenue,
         AVG(b.total_amount) AS avg_order_value
       FROM bookings b ${where}`,
      params
    );

    // Theo ngày/tháng
    const groupExpr = groupBy === 'month' ? 'DATE_FORMAT(b.booking_date, "%Y-%m")' : 'DATE(b.booking_date)';
    const [seriesRows] = await pool.execute(
      `SELECT ${groupExpr} AS period, SUM(b.total_amount) AS revenue, COUNT(*) AS orders
       FROM bookings b ${where}
       GROUP BY period
       ORDER BY period ASC`,
      params
    );

    // Top phim
    const [topMovies] = await pool.execute(
      `SELECT m.id, m.title, SUM(b.total_amount) AS revenue, COUNT(*) AS orders
       FROM bookings b
       JOIN showtimes s ON b.showtime_id = s.id
       JOIN movies m ON s.movie_id = m.id
       ${where ? where.replaceAll('b.booking_date', 'b.booking_date') : ''}
       GROUP BY m.id, m.title
       ORDER BY revenue DESC
       LIMIT 10`,
      params
    );

    res.json({
      overview: overviewRows[0] || { total_orders: 0, total_revenue: 0, avg_order_value: 0 },
      series: seriesRows,
      topMovies
    });
  } catch (error) {
    console.error('Lỗi thống kê doanh thu:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// ============ COMBOS APIs ============
// Lấy tất cả combos
app.get('/api/combos', async (req, res) => {
  try {
    const [combos] = await pool.execute(
      'SELECT * FROM combos WHERE is_available = true ORDER BY type, price'
    );
    res.json({ combos });
  } catch (error) {
    console.error('Lỗi lấy combos:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// ============ SHOWTIMES APIs ============
// Lấy suất chiếu theo phim và ngày
app.get('/api/showtimes/:movieId/:date', async (req, res) => {
  try {
    const { movieId, date } = req.params;
    
    const [showtimes] = await pool.execute(`
      SELECT 
        s.*, 
        r.room_number, 
        r.total_seats as room_total_seats,
        c.name as cinema_name,
        (
          CASE 
            WHEN (SELECT COUNT(*) FROM seats st0 WHERE st0.showtime_id = s.id) = 0 THEN r.total_seats
            ELSE (SELECT COUNT(*) FROM seats st1 WHERE st1.showtime_id = s.id AND st1.is_available = TRUE)
          END
        ) as available_seats_calculated
      FROM showtimes s
      JOIN rooms r ON s.room_id = r.id
      JOIN cinemas c ON r.cinema_id = c.id
      WHERE s.movie_id = ? AND s.show_date = ?
      ORDER BY s.show_time
    `, [movieId, date]);

    res.json({ showtimes });
  } catch (error) {
    console.error('Lỗi lấy suất chiếu:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// ============ SHOWTIME GENERATOR APIs ============
// Tự động tạo suất chiếu cho phim
app.post('/api/showtimes/generate', async (req, res) => {
  try {
    const { movieId, startDate, endDate, roomIds, options = {} } = req.body;
    
    if (!movieId || !startDate || !endDate) {
      return res.status(400).json({ 
        error: 'movieId, startDate, endDate là bắt buộc' 
      });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      return res.status(400).json({ 
        error: 'Ngày bắt đầu không được trong quá khứ' 
      });
    }

    if (end < start) {
      return res.status(400).json({ 
        error: 'Ngày kết thúc phải sau ngày bắt đầu' 
      });
    }

    // Kiểm tra phim có tồn tại không
    const [movies] = await pool.execute('SELECT * FROM movies WHERE id = ?', [movieId]);
    if (movies.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy phim' });
    }

    const generator = new ShowtimeGenerator();
    const showtimes = await generator.generateAndSave(movieId, startDate, endDate, roomIds, options);

    res.json({
      message: 'Tạo suất chiếu thành công',
      count: showtimes.length,
      showtimes: showtimes.map(st => ({
        id: st.id,
        movie_id: st.movie_id,
        room_id: st.room_id,
        show_date: st.show_date,
        show_time: st.show_time,
        price: st.price,
        available_seats: st.available_seats
      }))
    });

  } catch (error) {
    console.error('Lỗi tạo suất chiếu:', error);
    res.status(500).json({ error: error.message || 'Lỗi server' });
  }
});

// Tạo suất chiếu cân bằng (2h cách nhau, chia đều phim đang chiếu)
app.post('/api/showtimes/generate-balanced', async (req, res) => {
  try {
    const { startDate, endDate, roomIds, options = {} } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate, endDate là bắt buộc' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      return res.status(400).json({ error: 'endDate phải >= startDate' });
    }

    const generator = new ShowtimeGenerator();
    const saved = await generator.generateBalancedAndSave(startDate, endDate, roomIds, options);

    res.json({
      message: 'Tạo suất chiếu (balanced) thành công',
      count: saved.length,
      showtimes: saved
    });
  } catch (error) {
    console.error('Lỗi tạo balanced showtimes:', error);
    res.status(500).json({ error: error.message || 'Lỗi server' });
  }
});

// Tạo suất chiếu full-day (08:00-24:00) cho từng phòng
app.post('/api/showtimes/generate-full', async (req, res) => {
  try {
    const { startDate, endDate, roomIds, options = {} } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate, endDate là bắt buộc' });
    }

    const generator = new ShowtimeGenerator();
    const saved = await generator.generateFullDayAndSave(startDate, endDate, roomIds, options);

    res.json({
      message: 'Tạo suất chiếu full-day thành công',
      count: saved.length
    });
  } catch (error) {
    console.error('Lỗi tạo full-day showtimes:', error);
    res.status(500).json({ error: error.message || 'Lỗi server' });
  }
});

// Xem trước suất chiếu sẽ được tạo (không lưu vào DB)
app.post('/api/showtimes/preview', async (req, res) => {
  try {
    const { movieId, startDate, endDate, roomIds, options = {} } = req.body;
    
    if (!movieId || !startDate || !endDate) {
      return res.status(400).json({ 
        error: 'movieId, startDate, endDate là bắt buộc' 
      });
    }

    const generator = new ShowtimeGenerator();
    const showtimes = await generator.generateShowtimes(movieId, startDate, endDate, roomIds, options);

    // Lấy thông tin phòng và rạp
    const showtimesWithDetails = await Promise.all(
      showtimes.map(async (st) => {
        const [details] = await pool.execute(`
          SELECT r.room_number, c.name as cinema_name
          FROM rooms r
          JOIN cinemas c ON r.cinema_id = c.id
          WHERE r.id = ?
        `, [st.room_id]);
        
        return {
          ...st,
          room_number: details[0]?.room_number,
          cinema_name: details[0]?.cinema_name
        };
      })
    );

    res.json({
      message: 'Preview suất chiếu',
      count: showtimesWithDetails.length,
      showtimes: showtimesWithDetails
    });

  } catch (error) {
    console.error('Lỗi preview suất chiếu:', error);
    res.status(500).json({ error: error.message || 'Lỗi server' });
  }
});

// Dọn dẹp suất chiếu cũ
app.delete('/api/showtimes/cleanup', async (req, res) => {
  try {
    const generator = new ShowtimeGenerator();
    const deletedCount = await generator.cleanupOldShowtimes();
    
    res.json({
      message: 'Dọn dẹp suất chiếu cũ thành công',
      deletedCount
    });
  } catch (error) {
    console.error('Lỗi dọn dẹp:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Lấy thống kê suất chiếu
app.get('/api/showtimes/stats', async (req, res) => {
  try {
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_showtimes,
        COUNT(CASE WHEN show_date >= CURDATE() THEN 1 END) as upcoming_showtimes,
        COUNT(CASE WHEN show_date < CURDATE() THEN 1 END) as past_showtimes,
        COUNT(CASE WHEN show_date = CURDATE() AND show_time >= CURTIME() THEN 1 END) as today_showtimes,
        AVG(price) as avg_price,
        MIN(price) as min_price,
        MAX(price) as max_price
      FROM showtimes
    `);

    const [roomStats] = await pool.execute(`
      SELECT 
        r.room_number,
        c.name as cinema_name,
        COUNT(s.id) as showtime_count,
        AVG(s.price) as avg_price
      FROM rooms r
      LEFT JOIN showtimes s ON r.id = s.room_id AND s.show_date >= CURDATE()
      LEFT JOIN cinemas c ON r.cinema_id = c.id
      GROUP BY r.id, r.room_number, c.name
      ORDER BY showtime_count DESC
    `);

    res.json({
      overview: stats[0],
      roomStats
    });
  } catch (error) {
    console.error('Lỗi lấy thống kê:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Lấy tất cả suất chiếu theo phim
app.get('/api/showtimes/:movieId', async (req, res) => {
  try {
    const { movieId } = req.params;
    
    const [showtimes] = await pool.execute(`
      SELECT 
        s.*, 
        r.room_number, 
        r.total_seats as room_total_seats,
        c.name as cinema_name,
        (
          CASE 
            WHEN (SELECT COUNT(*) FROM seats st0 WHERE st0.showtime_id = s.id) = 0 THEN r.total_seats
            ELSE (SELECT COUNT(*) FROM seats st1 WHERE st1.showtime_id = s.id AND st1.is_available = TRUE)
          END
        ) as available_seats_calculated
      FROM showtimes s
      JOIN rooms r ON s.room_id = r.id
      JOIN cinemas c ON r.cinema_id = c.id
      WHERE s.movie_id = ?
      ORDER BY s.show_date, s.show_time
    `, [movieId]);

    res.json({ showtimes });
  } catch (error) {
    console.error('Lỗi lấy suất chiếu:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Lấy danh sách ngày có suất chiếu (7 ngày tiếp theo)
app.get('/api/days', async (req, res) => {
  try {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const name = d.toLocaleDateString("vi-VN", { weekday: "long" });
      const date = d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
      const label = d.toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit" });
      return { 
        key: d.toISOString().slice(0, 10), 
        name,
        date,
        label 
      };
    });
    
    res.json({ days });
  } catch (error) {
    console.error('Lỗi lấy danh sách ngày:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// (Đã bỏ mock showtimes-default)

// ============ SEATS APIs ============
// Lấy ghế theo showtime
app.get('/api/seats/:showtimeId', async (req, res) => {
  try {
    const { showtimeId } = req.params;
    
    let [seats] = await pool.execute(`
      SELECT * FROM seats WHERE showtime_id = ? ORDER BY seat_code
    `, [showtimeId]);

    // Lấy thông tin phòng để biết total_seats
    const [showtimeInfo] = await pool.execute(`
      SELECT r.total_seats, r.room_number 
      FROM showtimes s 
      JOIN rooms r ON s.room_id = r.id 
      WHERE s.id = ?
    `, [showtimeId]);

    if (showtimeInfo.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy showtime' });
    }

    const totalSeats = Number(showtimeInfo[0].total_seats) || 0;
    const roomNumber = showtimeInfo[0].room_number;

    // Nếu số ghế đã có khác với tổng ghế của phòng, đồng bộ lại cho đúng số lượng
    if (seats.length !== totalSeats) {
      await pool.execute('DELETE FROM seats WHERE showtime_id = ?', [showtimeId]);
      seats = [];
    }

    // Nếu chưa có seats (hoặc vừa đồng bộ), tạo seats đúng bằng total_seats của phòng
    if (seats.length === 0 && totalSeats > 0) {
      // Tính toán số hàng và cột dựa trên total_seats (không giới hạn, tạo đúng số ghế trong DB)
      const targetSeats = totalSeats;
      const colsPerRow = Math.ceil(Math.sqrt(targetSeats * 1.2)); // Tỷ lệ 1.2 để tạo hình chữ nhật
      const totalRows = Math.ceil(targetSeats / colsPerRow);
      
      // Tạo tên hàng (A, B, C, ..., Z, AA, AB, ...)
      const rows = [];
      for (let i = 0; i < totalRows; i++) {
        if (i < 26) {
          rows.push(String.fromCharCode(65 + i)); // A-Z
        } else {
          const firstChar = String.fromCharCode(65 + Math.floor(i / 26) - 1);
          const secondChar = String.fromCharCode(65 + (i % 26));
          rows.push(firstChar + secondChar); // AA, AB, AC, ...
        }
      }

      const cols = Array.from({ length: colsPerRow }, (_, i) => i + 1);
      const newSeats = [];
      let seatCount = 0;

      for (const row of rows) {
        for (const col of cols) {
          if (seatCount >= targetSeats) break;
          
          const seatCode = `${row}${col}`;
          
          await pool.execute(
            'INSERT INTO seats (showtime_id, seat_code, is_available, is_reserved) VALUES (?, ?, ?, ?)',
            [showtimeId, seatCode, true, false]
          );
          
          newSeats.push({
            seat_code: seatCode,
            is_available: true,
            is_reserved: false
          });
          seatCount++;
        }
        if (seatCount >= targetSeats) break;
      }

      console.log(`✅ Đã tạo ${newSeats.length} ghế cho phòng ${roomNumber} (${totalRows} hàng x ${colsPerRow} cột)`);
      return res.json({ 
        seats: newSeats,
        roomInfo: {
          roomNumber,
          totalSeats: targetSeats,
          rows: totalRows,
          cols: colsPerRow,
          layout: `${totalRows}x${colsPerRow}`
        }
      });
    }

    // Đã có seats trong DB: luôn trả kèm roomInfo để frontend dựng layout
    // Suy ra rows/cols từ seat_code hiện có
    const rowSet = new Set();
    let maxCol = 0;
    for (const s of seats) {
      const code = s.seat_code || '';
      const rowMatch = code.match(/^[A-Z]+/i);
      const colMatch = code.match(/(\d+)$/);
      if (rowMatch) rowSet.add(rowMatch[0].toUpperCase());
      if (colMatch) maxCol = Math.max(maxCol, parseInt(colMatch[1], 10));
    }
    const totalRows = rowSet.size || Math.ceil(totalSeats / (maxCol || 1));
    const colsPerRow = maxCol || Math.ceil(Math.sqrt(totalSeats * 1.2));

    res.json({ 
      seats,
      roomInfo: {
        roomNumber,
        totalSeats,
        rows: totalRows,
        cols: colsPerRow,
        layout: `${totalRows}x${colsPerRow}`
      }
    });
  } catch (error) {
    console.error('Lỗi lấy ghế:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Tự động gen seats cho tất cả showtimes (hoặc theo khoảng ngày tùy chọn)
app.post('/api/seats/generate-all', async (req, res) => {
  try {
    const { startDate, endDate } = req.body || {};

    let query = `
      SELECT s.id as showtime_id, r.total_seats, r.room_number
      FROM showtimes s
      JOIN rooms r ON s.room_id = r.id
    `;
    const params = [];
    if (startDate && endDate) {
      query += ` WHERE s.show_date BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }

    const [rows] = await pool.execute(query, params);
    let generatedFor = 0;

    for (const row of rows) {
      const showtimeId = row.showtime_id;
      const totalSeats = Number(row.total_seats) || 0;
      if (totalSeats <= 0) continue;

      const [existing] = await pool.execute(
        'SELECT COUNT(*) as cnt FROM seats WHERE showtime_id = ?',
        [showtimeId]
      );

      if (existing[0].cnt !== totalSeats) {
        // Xóa cũ và tạo mới đúng bằng totalSeats
        await pool.execute('DELETE FROM seats WHERE showtime_id = ?', [showtimeId]);

        // Tính layout
        const colsPerRow = Math.ceil(Math.sqrt(totalSeats * 1.2));
        const totalRows = Math.ceil(totalSeats / colsPerRow);

        const rowsLetters = [];
        for (let i = 0; i < totalRows; i++) {
          if (i < 26) rowsLetters.push(String.fromCharCode(65 + i));
          else {
            const firstChar = String.fromCharCode(65 + Math.floor(i / 26) - 1);
            const secondChar = String.fromCharCode(65 + (i % 26));
            rowsLetters.push(firstChar + secondChar);
          }
        }
        const cols = Array.from({ length: colsPerRow }, (_, i) => i + 1);

        let seatCount = 0;
        for (const r of rowsLetters) {
          for (const c of cols) {
            if (seatCount >= totalSeats) break;
            const seatCode = `${r}${c}`;
            await pool.execute(
              'INSERT INTO seats (showtime_id, seat_code, is_available, is_reserved) VALUES (?, ?, TRUE, FALSE)',
              [showtimeId, seatCode]
            );
            seatCount++;
          }
          if (seatCount >= totalSeats) break;
        }

        generatedFor++;
      }
    }

    res.json({
      message: 'Đã đồng bộ seats cho showtimes',
      processed: rows.length,
      generatedFor
    });
  } catch (error) {
    console.error('Lỗi generate-all seats:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});



// ============ CART APIs ============
// Lấy giỏ hàng của user
app.get('/api/cart/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    if (req.user.userId != userId) {
      return res.status(403).json({ error: 'Không có quyền truy cập' });
    }

    const [cartItems] = await pool.execute(
      'SELECT * FROM cart WHERE user_id = ? AND expires_at > NOW() ORDER BY created_at DESC',
      [userId]
    );

    res.json({ cart: cartItems });
  } catch (error) {
    console.error('Lỗi lấy giỏ hàng:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Thêm item vào giỏ hàng
app.post('/api/cart/add', authenticateToken, async (req, res) => {
  try {
    const { itemType, itemData, quantity = 1 } = req.body;
    const userId = req.user.userId;

    // Xóa giỏ hàng cũ hơn 1 ngày
    await pool.execute('DELETE FROM cart WHERE user_id = ? AND expires_at < NOW()', [userId]);

    // Thêm item mới
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1); // Hết hạn sau 1 ngày

    const [result] = await pool.execute(
      'INSERT INTO cart (user_id, item_type, item_data, quantity, expires_at) VALUES (?, ?, ?, ?, ?)',
      [userId, itemType, JSON.stringify(itemData), quantity, expiresAt]
    );

    res.json({ message: 'Đã thêm vào giỏ hàng', itemId: result.insertId });
  } catch (error) {
    console.error('Lỗi thêm vào giỏ hàng:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Cập nhật item trong giỏ hàng (item_data, quantity)
app.put('/api/cart/update/:itemId', authenticateToken, async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user.userId;
    const { itemData, quantity } = req.body;

    const [result] = await pool.execute(
      'UPDATE cart SET item_data = ?, quantity = ? WHERE id = ? AND user_id = ?',
      [JSON.stringify(itemData ?? {}), Number(quantity ?? 1), itemId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Không tìm thấy item' });
    }

    res.json({ message: 'Đã cập nhật giỏ hàng' });
  } catch (error) {
    console.error('Lỗi cập nhật giỏ hàng:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Xóa item khỏi giỏ hàng
app.delete('/api/cart/remove/:itemId', authenticateToken, async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user.userId;

    const [result] = await pool.execute(
      'DELETE FROM cart WHERE id = ? AND user_id = ?',
      [itemId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Không tìm thấy item' });
    }

    res.json({ message: 'Đã xóa khỏi giỏ hàng' });
  } catch (error) {
    console.error('Lỗi xóa khỏi giỏ hàng:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Checkout từ giỏ hàng
app.post('/api/cart/checkout', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log('Checkout for user:', userId);
    
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Lấy items từ giỏ hàng
      const [cartItems] = await connection.execute(
        'SELECT * FROM cart WHERE user_id = ? AND expires_at > NOW()',
        [userId]
      );
      console.log('Cart items found:', cartItems.length);
      console.log('Cart items:', cartItems.map(item => ({ id: item.id, type: item.item_type, data: JSON.parse(item.item_data || '{}') })));

      if (cartItems.length === 0) {
        console.log('Cart is empty, returning error');
        return res.status(400).json({ error: 'Giỏ hàng trống' });
      }

      // Xử lý từng item (vé + seats + combos)
      const tickets = cartItems.filter(item => item.item_type === 'ticket');
      console.log('Tickets to process:', tickets.length);
      let totalSeatsPurchased = 0;
      
      for (const ticket of tickets) {
        const itemData = JSON.parse(ticket.item_data || '{}');
        console.log('Processing ticket:', itemData);
        const showtimeId = itemData.showtimeId;
        const seats = Array.isArray(itemData.seats) ? itemData.seats : [];
        const combos = Array.isArray(itemData.combos) ? itemData.combos : [];
        console.log('ShowtimeId:', showtimeId, 'Seats:', seats, 'Combos:', combos);
        // Tính tiền vé và combo
        let seatPrice = Number(itemData.price) || 0;
        if (!seatPrice && showtimeId) {
          const [[st]] = await connection.query('SELECT price FROM showtimes WHERE id = ?', [showtimeId]);
          if (st) seatPrice = Number(st.price) || 85000;
        }
        const ticketTotal = seats.length * (seatPrice || 85000);
        const comboTotal = combos.reduce((s, c) => s + Number(c?.price || 0) * Number(c?.quantity || 1), 0);
        const totalAmount = ticketTotal + comboTotal;

        // Đảm bảo ghế đã được tạo đúng số lượng trước khi gán
        if (showtimeId) {
          const [[roomInfo]] = await connection.query(`
            SELECT r.total_seats, r.room_number
            FROM showtimes s JOIN rooms r ON s.room_id = r.id
            WHERE s.id = ?
          `, [showtimeId]);
          if (roomInfo && roomInfo.total_seats) {
            const [[existCnt]] = await connection.query(
              'SELECT COUNT(*) AS cnt FROM seats WHERE showtime_id = ?',
              [showtimeId]
            );
            if (existCnt.cnt !== roomInfo.total_seats) {
              await connection.query('DELETE FROM seats WHERE showtime_id = ?', [showtimeId]);
              const targetSeats = Number(roomInfo.total_seats);
              const colsPerRow = Math.ceil(Math.sqrt(targetSeats * 1.2));
              const totalRows = Math.ceil(targetSeats / colsPerRow);
              const rowsLetters = [];
              for (let i = 0; i < totalRows; i++) {
                if (i < 26) rowsLetters.push(String.fromCharCode(65 + i));
                else {
                  const firstChar = String.fromCharCode(65 + Math.floor(i / 26) - 1);
                  const secondChar = String.fromCharCode(65 + (i % 26));
                  rowsLetters.push(firstChar + secondChar);
                }
              }
              const colsArr = Array.from({ length: colsPerRow }, (_, i) => i + 1);
              let seatCount = 0;
              for (const r of rowsLetters) {
                for (const c of colsArr) {
                  if (seatCount >= targetSeats) break;
                  const seatCode = `${r}${c}`;
                  await connection.query(
                    'INSERT INTO seats (showtime_id, seat_code, is_available, is_reserved) VALUES (?, ?, TRUE, FALSE)',
                    [showtimeId, seatCode]
                  );
                  seatCount++;
                }
                if (seatCount >= targetSeats) break;
              }
            }
          }
        }

        // Tạo booking cho mỗi bundle vé trong giỏ
        const [bookingResult] = await connection.execute(
          'INSERT INTO bookings (user_id, showtime_id, total_amount, status, payment_status) VALUES (?, ?, ?, "confirmed", "paid")',
          [userId, showtimeId, totalAmount]
        );

        const bookingId = bookingResult.insertId;

        // Gắn ghế vào booking + đánh dấu ghế đã bán
        for (const seatCode of seats) {
          const [seatResult] = await connection.execute(
            'SELECT id FROM seats WHERE showtime_id = ? AND seat_code = ? FOR UPDATE',
            [showtimeId, seatCode]
          );
          if (seatResult.length > 0) {
            await connection.execute(
              'INSERT INTO booking_seats (booking_id, seat_id, price) VALUES (?, ?, 85000)',
              [bookingId, seatResult[0].id]
            );
            await connection.execute(
              'UPDATE seats SET is_available = FALSE, is_reserved = FALSE WHERE id = ?',
              [seatResult[0].id]
            );
          }
        }

        totalSeatsPurchased += seats.length;

        // Thêm combos (nếu có)
        for (const combo of combos) {
          if (combo && combo.id) {
            await connection.execute(
              'INSERT INTO booking_combos (booking_id, combo_id, quantity, price) VALUES (?, ?, ?, ?)',
              [bookingId, combo.id, combo.quantity || 1, combo.price || 0]
            );
          }
        }

        // Xóa item khỏi giỏ hàng
        await connection.execute('DELETE FROM cart WHERE id = ?', [ticket.id]);
      }

      // Cộng điểm sau khi xử lý xong tất cả tickets trong cart
      if (totalSeatsPurchased > 0) {
        const addPoints = totalSeatsPurchased * 10;
        await connection.execute(`
          UPDATE users
          SET 
            points = points + ?,
            membership_level = CASE
              WHEN FLOOR((points + ?)/10) >= 100 THEN 'diamond'
              WHEN FLOOR((points + ?)/10) >= 50 THEN 'gold'
              WHEN FLOOR((points + ?)/10) >= 20 THEN 'silver'
              ELSE 'bronze'
            END,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [addPoints, addPoints, addPoints, addPoints, userId]);
      }

      // Cộng điểm: 1 vé = 10 điểm; xác định số vé từ số ticket items (fallback)
      const numTickets = tickets.length;
      if (numTickets > 0) {
        const addPoints = numTickets * 10;
        // Tính membership theo tổng số vé = points/10
        await connection.execute(`
          UPDATE users
          SET 
            points = points + ?,
            membership_level = CASE
              WHEN FLOOR((points + ?)/10) >= 100 THEN 'diamond'
              WHEN FLOOR((points + ?)/10) >= 50 THEN 'gold'
              WHEN FLOOR((points + ?)/10) >= 20 THEN 'silver'
              ELSE 'bronze'
            END,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [addPoints, addPoints, addPoints, addPoints, userId]);
      }

      await connection.commit();

      res.json({ 
        message: 'Thanh toán thành công!',
        processedItems: tickets.length
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Lỗi checkout:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// ============ BOOKINGS APIs ============
// Lấy vé của user
app.get('/api/bookings/user/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.userId;
    if (req.user.userId != userId) {
      return res.status(403).json({ error: 'Không có quyền truy cập' });
    }

    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(`
        SELECT b.id AS booking_id, b.total_amount, b.booking_date,
               m.title, m.poster_url,
               s.show_date, s.show_time, r.room_number,
               b.showtime_id
        FROM bookings b
        JOIN showtimes s ON b.showtime_id = s.id
        JOIN movies m ON s.movie_id = m.id
        JOIN rooms r ON s.room_id = r.id
        WHERE b.user_id = ?
        ORDER BY b.booking_date DESC
      `, [userId]);

      const bookings = [];
      for (const row of rows) {
        // Lấy danh sách ghế
        const [seatRows] = await connection.execute(
          `SELECT s.seat_code, bs.price
           FROM booking_seats bs JOIN seats s ON bs.seat_id = s.id
           WHERE bs.booking_id = ?
           ORDER BY s.seat_code ASC`,
          [row.booking_id]
        );
        const seats = seatRows.map(x => x.seat_code);
        const seatTotal = seatRows.reduce((s,x)=> s + Number(x.price||0), 0);

        // Lấy combos (nếu có)
        const [comboRows] = await connection.execute(
          `SELECT bc.combo_id AS id, bc.quantity, bc.price, c.name
           FROM booking_combos bc LEFT JOIN combos c ON bc.combo_id = c.id
           WHERE bc.booking_id = ?`,
          [row.booking_id]
        );
        const combos = comboRows.map(c => ({ id: c.id, name: c.name || 'Combo', quantity: c.quantity || 1, price: Number(c.price || 0) }));
        const comboTotal = combos.reduce((s,c)=> s + Number(c.price||0) * Number(c.quantity||1), 0);

        bookings.push({
          id: row.booking_id,
          title: row.title,
          poster: row.poster_url,
          day: row.show_date,
          time: row.show_time,
          room: row.room_number,
          seats,
          combos,
          seatTotal,
          comboTotal,
          total: Number(row.total_amount || 0)
        });
      }

      res.json({ bookings });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Lỗi lấy vé:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Tạo booking mới
app.post('/api/bookings', authenticateToken, async (req, res) => {
  try {
    const { showtimeId, seats, combos, totalAmount } = req.body;
    const userId = req.user.userId;
    console.log('Create booking request:', { showtimeId, seats, combos, totalAmount, userId });

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Tạo booking
      const [bookingResult] = await connection.execute(
        'INSERT INTO bookings (user_id, showtime_id, total_amount, status, payment_status) VALUES (?, ?, ?, "confirmed", "paid")',
        [userId, showtimeId, totalAmount]
      );

      const bookingId = bookingResult.insertId;

      // Đảm bảo ghế cho suất chiếu đã tồn tại trước khi gán
      if (showtimeId) {
        const [[roomInfo]] = await connection.query(`
          SELECT r.total_seats, r.room_number
          FROM showtimes s JOIN rooms r ON s.room_id = r.id
          WHERE s.id = ?
        `, [showtimeId]);
        if (roomInfo && roomInfo.total_seats) {
          const [[existCnt]] = await connection.query(
            'SELECT COUNT(*) AS cnt FROM seats WHERE showtime_id = ?',
            [showtimeId]
          );
          if (existCnt.cnt !== roomInfo.total_seats) {
            await connection.query('DELETE FROM seats WHERE showtime_id = ?', [showtimeId]);
            const targetSeats = Number(roomInfo.total_seats);
            const colsPerRow = Math.ceil(Math.sqrt(targetSeats * 1.2));
            const totalRows = Math.ceil(targetSeats / colsPerRow);
            const rowsLetters = [];
            for (let i = 0; i < totalRows; i++) {
              if (i < 26) rowsLetters.push(String.fromCharCode(65 + i));
              else {
                const firstChar = String.fromCharCode(65 + Math.floor(i / 26) - 1);
                const secondChar = String.fromCharCode(65 + (i % 26));
                rowsLetters.push(firstChar + secondChar);
              }
            }
            const colsArr = Array.from({ length: colsPerRow }, (_, i) => i + 1);
            let seatCount = 0;
            for (const r of rowsLetters) {
              for (const c of colsArr) {
                if (seatCount >= targetSeats) break;
                const seatCode = `${r}${c}`;
                await connection.query(
                  'INSERT INTO seats (showtime_id, seat_code, is_available, is_reserved) VALUES (?, ?, TRUE, FALSE)',
                  [showtimeId, seatCode]
                );
                seatCount++;
              }
              if (seatCount >= targetSeats) break;
            }
          }
        }
      }

      // Thêm seats vào booking
      for (const seatCode of seats) {
        // Lấy seat_id (khóa để tránh race)
        const [seatResult] = await connection.execute(
          'SELECT id FROM seats WHERE showtime_id = ? AND seat_code = ? FOR UPDATE',
          [showtimeId, seatCode]
        );

        if (seatResult.length > 0) {
          await connection.execute(
            'INSERT INTO booking_seats (booking_id, seat_id, price) VALUES (?, ?, 85000)'
            , [bookingId, seatResult[0].id]
          );

          // Cập nhật seat status
          await connection.execute(
            'UPDATE seats SET is_available = FALSE, is_reserved = FALSE WHERE id = ?'
            , [seatResult[0].id]
          );
        }
      }

      // Thêm combos vào booking (nếu có)
      if (Array.isArray(combos) && combos.length > 0) {
        for (const combo of combos) {
          if (combo && combo.id) {
            await connection.execute(
              'INSERT INTO booking_combos (booking_id, combo_id, quantity, price) VALUES (?, ?, ?, ?)'
              , [bookingId, combo.id, combo.quantity || 1, combo.price || 0]
            );
          }
        }
      }

      // Cộng điểm theo số ghế: 1 ghế = 1 vé = 10 điểm
      const numTickets = Array.isArray(seats) ? seats.length : 0;
      if (numTickets > 0) {
        const addPoints = numTickets * 10;
        await connection.execute(`
          UPDATE users
          SET 
            points = points + ?,
            membership_level = CASE
              WHEN FLOOR((points + ?)/10) >= 100 THEN 'diamond'
              WHEN FLOOR((points + ?)/10) >= 50 THEN 'gold'
              WHEN FLOOR((points + ?)/10) >= 20 THEN 'silver'
              ELSE 'bronze'
            END,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [addPoints, addPoints, addPoints, addPoints, userId]);
      }

      await connection.commit();

      res.status(201).json({
        message: 'Đặt vé thành công',
        bookingId
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Lỗi đặt vé:', error);
    console.error('Error details:', error.message, error.stack);
    res.status(500).json({ error: 'Lỗi server: ' + error.message });
  }
});

// ============ HEALTH CHECK ============
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'WebFilm API đang hoạt động',
    timestamp: new Date().toISOString()
  });
});

// ============ ERROR HANDLING ============
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Có lỗi xảy ra!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'API endpoint không tồn tại' });
});

// ============ START SERVER ============
const startServer = async () => {
  try {
    // Test kết nối database
    const isConnected = await testConnection();
    if (!isConnected) {
      console.log('❌ Không thể kết nối database, server sẽ không khởi động');
      return;
    }


    // Khởi động server
    app.listen(PORT, () => {
      console.log(`🚀 Server đang chạy trên http://localhost:${PORT}`);
      console.log(`📋 API Documentation: http://localhost:${PORT}/api/health`);
      console.log(`🎬 WebFilm Backend sẵn sàng phục vụ!`);
    });

  } catch (error) {
    console.error('❌ Lỗi khởi động server:', error);
  }
};

startServer();
