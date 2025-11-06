# Hướng dẫn tạo lịch chiếu (Showtime Generator)

Tài liệu này hướng dẫn nhanh cách cấu hình và chạy công cụ tạo lịch chiếu tự động cho backend WebFilm.

## 1) Chuẩn bị môi trường

- Cài node modules (thư mục `backend`):

```bash
npm i
```

- Tạo file cấu hình `backend/config.env` (nếu chưa có):

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=webfilm_db
```

- Đảm bảo database có các bảng cơ bản: `movies`, `rooms`, `showtimes` (và dữ liệu phim/ phòng tối thiểu).

## 2) Script chạy nhanh

Đã có sẵn script runner tại `backend/scripts/auto-generate-showtimes.js`.

- Tạo lịch cân bằng cho 7 ngày (mặc định: từ hôm nay → +6):

```bash
npm run generate-showtimes
```

- Hoặc tự chỉ định tham số:

```bash
# Cân bằng theo dải ngày
node scripts/auto-generate-showtimes.js --mode balanced --start 2025-11-01 --end 2025-11-07

# Lấp kín cả ngày (full-day)
node scripts/auto-generate-showtimes.js --mode full --start 2025-11-01 --end 2025-11-07

# Tạo cho 1 phim cụ thể (theo id trong bảng movies)
node scripts/auto-generate-showtimes.js --mode movie --movie 1 --start 2025-11-01 --end 2025-11-07
```

Tham số hỗ trợ:
- `--mode`: `balanced` | `full` | `movie`
- `--start`, `--end`: định dạng `YYYY-MM-DD`
- `--movie`: id phim (khi `--mode movie`)

## 3) Cơ chế thuật toán (tóm tắt)

- `balanced`: đảm bảo mỗi phim đang chiếu có tối thiểu 1 suất/ ngày, chia đều giữa các phòng; các suất khác được lấp thêm nhưng vẫn giữ khoảng cách tối thiểu giữa các suất.
- `full`: tạo lịch dày hơn trong khung 08:00 → 23:30, round-robin các phim và phòng.
- Giá vé được tính theo kích cỡ phòng, khung giờ tối và cuối tuần.

## 4) Câu lệnh hữu ích

- Xóa suất quá hạn (thực hiện trong code nếu cần):

```js
const generator = new (require('./services/showtimeGenerator'))();
// Chưa expose trực tiếp; có thể thêm API/route riêng để gọi cleanup nếu muốn.
```

## 5) Lỗi thường gặp

- "Kết nối MySQL thất bại": kiểm tra `backend/config.env` và quyền truy cập DB.
- "ER_NO_SUCH_TABLE"/"Unknown table": chưa có bảng; cần import schema trước.
- "Cannot find module 'mysql2/promise'": chạy `npm i` trong `backend`.

## 6) Tích hợp quy trình

Bạn có thể lên cron (Windows Task Scheduler/ Linux cron) chạy theo ngày, ví dụ mỗi 0h tạo lịch 7 ngày kế tiếp với chế độ `balanced`:

```bash
node scripts/auto-generate-showtimes.js --mode balanced
```

> Lưu ý: chạy trên môi trường có quyền kết nối DB và đã seed dữ liệu `movies`, `rooms`.


