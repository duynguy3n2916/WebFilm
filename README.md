# WebFilm – Ứng dụng đặt vé phim (Frontend + Backend)

Dự án gồm 2 phần:
- `frontend/` – React (CRA) UI cho người dùng và khu vực Admin
- `backend/` – Express + MySQL API

## Tính năng chính
- Người dùng: đăng ký/đăng nhập, xem phim, xem suất chiếu, chọn ghế, thêm đồ ăn, giỏ hàng, thanh toán, xem vé đã đặt.
- Admin: đăng nhập admin, quản lý phim (thêm/sửa/xóa), xem thống kê doanh thu theo ngày/tháng, top phim theo doanh thu.
- Sinh suất chiếu tự động và đồng bộ ghế theo phòng.

## Yêu cầu hệ thống
- Node.js >= 14
- MySQL >= 8 (khuyến nghị 8.x)

## Cấu trúc thư mục
```
webfilm/
  backend/
    server.js
    db.js
    services/
    scripts/
  frontend/
    src/
    public/
```

## Cài đặt & chạy nhanh
1) Backend
```bash
cd backend
npm ci # hoặc npm install
# Tạo file cấu hình môi trường
# Windows: copy config.env.example config.env
# macOS/Linux: cp config.env.example config.env
npm run dev # chạy với nodemon (hoặc npm start)
```
Mặc định API chạy ở `http://localhost:5000` với base path `/api`.

2) Frontend
```bash
cd ../frontend
npm ci # hoặc npm install
npm start
```
Mặc định React dev server chạy ở `http://localhost:3000`. Frontend gọi API qua biến `REACT_APP_API_URL` (mặc định `http://localhost:5000/api`).

## Biến môi trường
- Backend `backend/config.env` (ví dụ):
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=webfilm_db
JWT_SECRET=your-secret-key
PORT=5000
```
- Frontend `frontend/config.env` (tùy chọn):
```
REACT_APP_API_URL=http://localhost:5000/api
```

## Cơ sở dữ liệu
- Dùng MySQL. Bạn có thể import file `.sql` (schema/data) nếu có.
- Bảng `users` nên có một trong hai cột để phân quyền admin:
  - `role VARCHAR(20) DEFAULT 'user'` – gán `admin` cho tài khoản admin
  - hoặc `is_admin TINYINT(1) DEFAULT 0` – gán `1` cho tài khoản admin

Ví dụ gán quyền theo email:
```sql
-- Phương án dùng role
ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'user';
UPDATE users SET role='admin' WHERE email='admin@example.com';

-- Hoặc phương án dùng is_admin
ALTER TABLE users ADD COLUMN is_admin TINYINT(1) NOT NULL DEFAULT 0;
UPDATE users SET is_admin=1 WHERE email='admin@example.com';
```

## Đăng nhập & phân quyền
- Backend tạo JWT có các trường: `userId, email, role, isAdmin`.
- Frontend lưu `token` và `user` vào localStorage.
- Khi `user.isAdmin === true`, giao diện chỉ hiển thị khu vực Admin và tự điều hướng về `/admin`.

## API chính
Base URL: `/api`

Auth
- `POST /auth/register` – đăng ký
- `POST /auth/login` – đăng nhập, trả `token` + `user`
- `GET /auth/profile` – lấy profile (yêu cầu JWT)
- `PUT /auth/profile` – cập nhật profile (yêu cầu JWT)

Movies (public)
- `GET /movies` – danh sách phim
- `GET /movies/:id` – chi tiết phim
- `GET /movies/hot`, `/movies/now-showing`, `/movies/coming-soon`

Admin (yêu cầu JWT + admin)
- `POST /admin/movies` – tạo phim mới (đủ trường: title, description, poster_url, trailer_url, rating, duration, tags, status, is_hot, release_date, director, cast). Trường `tags` được chuẩn hóa thành JSON array khi lưu.
- `PUT /admin/movies/:id` – cập nhật phim
- `DELETE /admin/movies/:id` – xóa phim
- `GET /admin/revenue?from=YYYY-MM-DD&to=YYYY-MM-DD&groupBy=day|month` – thống kê doanh thu từ bảng `bookings` (overview, series, topMovies)

Showtimes
- `GET /showtimes/:movieId/:date` – suất chiếu theo phim + ngày
- Generator:
  - `POST /showtimes/generate`
  - `POST /showtimes/generate-balanced`
  - `POST /showtimes/generate-full`
  - `POST /showtimes/preview`
  - `DELETE /showtimes/cleanup`

Seats
- `GET /seats/:showtimeId` – đồng bộ & lấy ghế cho suất chiếu
- `POST /seats/generate-all` – sinh ghế hàng loạt theo khoảng ngày (tùy chọn)

Cart & Bookings (yêu cầu JWT)
- `GET /cart/:userId`, `POST /cart/add`, `PUT /cart/update/:itemId`, `DELETE /cart/remove/:itemId`, `POST /cart/checkout`
- `GET /bookings/user/:userId`, `POST /bookings`

## Khu vực Admin (Frontend)
Đường dẫn: `/admin` (hiển thị khi user là admin).
- Quản lý phim: danh sách, thêm mới, sửa, xóa. Trường `Tags` hỗ trợ:
  - Gợi ý từ tags sẵn có
  - Nhập nhiều tag bằng dấu phẩy, tự lọc ký tự không hợp lệ
  - Lưu dưới dạng JSON array ở backend
- Thống kê doanh thu: lọc theo ngày, nhóm ngày/tháng, bảng chi tiết và top phim.

## Scripts hữu ích (backend/scripts)
- `auto-generate-showtimes.js` – tiện ích sinh suất chiếu tự động (xem hướng dẫn trong mã nguồn).

## Build & deploy
- Frontend build: `npm run build` trong `frontend/` → đầu ra `frontend/build/`
- Backend có thể chạy bằng `node server.js` hoặc qua process manager (PM2, Docker, v.v.).

## Góp ý & phát triển
- Theo chuẩn code hiện tại: đặt tên rõ nghĩa, tránh bắt ngoại lệ không xử lý, giữ kiểu dữ liệu an toàn.
- PR/Issue: mô tả rõ lỗi/tính năng, ảnh hưởng đến API/UI/DB nếu có.

---
Chúc bạn dùng vui vẻ! Nếu cần, có thể bổ sung script SQL tạo bảng mẫu và dữ liệu demo.
