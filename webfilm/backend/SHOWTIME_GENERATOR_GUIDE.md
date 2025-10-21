# 🎬 Hướng dẫn sử dụng Showtime Generator

## 📋 Tổng quan

Showtime Generator là hệ thống tự động tạo suất chiếu thông minh, tránh xung đột phòng chiếu và khung giờ.

## 🚀 Tính năng chính

### ✅ Tự động tránh xung đột
- Kiểm tra xung đột phòng chiếu
- Kiểm tra xung đột thời gian
- Tự động tính toán thời gian kết thúc phim

### ✅ Lập lịch thông minh
- Khung giờ khác nhau theo ngày trong tuần
- Cuối tuần: mở rộng giờ (8:00 - 23:00)
- Ngày thường: giờ chuẩn (9:00 - 22:00)
- Tự động tính giá theo phòng, giờ, ngày

### ✅ Validation đầy đủ
- Kiểm tra phim tồn tại
- Kiểm tra ngày hợp lệ
- Kiểm tra phòng chiếu có sẵn

## 🔧 API Endpoints

### 1. Tạo suất chiếu
```http
POST /api/showtimes/generate
Content-Type: application/json

{
  "movieId": 1,
  "startDate": "2024-01-01",
  "endDate": "2024-01-07",
  "roomIds": [1, 2, 3], // Optional: chỉ định phòng cụ thể
  "options": {
    "weekendExtended": true,
    "morningShows": true,
    "lateShows": true
  }
}
```

### 2. Xem trước suất chiếu
```http
POST /api/showtimes/preview
Content-Type: application/json

{
  "movieId": 1,
  "startDate": "2024-01-01",
  "endDate": "2024-01-07",
  "roomIds": [1, 2],
  "options": {
    "weekendExtended": false,
    "morningShows": false,
    "lateShows": true
  }
}
```

### 3. Dọn dẹp suất chiếu cũ
```http
DELETE /api/showtimes/cleanup
```

### 4. Thống kê suất chiếu
```http
GET /api/showtimes/stats
```

## 📊 Cách tính giá vé

### Giá cơ bản: 85,000đ

### Phụ thu phòng chiếu:
- Phòng > 100 ghế: +10,000đ
- Phòng ≤ 100 ghế: không phụ thu

### Phụ thu giờ chiếu:
- Suất tối (18:00+): +15,000đ
- Suất sáng/chiều: không phụ thu

### Phụ thu ngày:
- Cuối tuần (T7, CN): +10,000đ
- Ngày thường: không phụ thu

### Ví dụ:
- Phòng R3 (150 ghế) + Suất tối + Cuối tuần = 85,000 + 10,000 + 15,000 + 10,000 = **120,000đ**

## ⚙️ Tùy chọn (Options)

```javascript
{
  "weekendExtended": true,    // Mở rộng giờ cuối tuần (8:00-23:00)
  "morningShows": true,       // Có suất sáng sớm (8:00-10:00)
  "lateShows": true          // Có suất tối muộn (21:00-23:00)
}
```

## 🧪 Test hệ thống

```bash
cd webfilm/backend
node test_generator.js
```

## 📝 Ví dụ sử dụng

### 1. Tạo suất chiếu cho phim mới
```javascript
const generator = new ShowtimeGenerator();

// Tạo suất chiếu cho 1 tuần
const showtimes = await generator.generateAndSave(
  1, // movieId
  '2024-01-01', // startDate
  '2024-01-07', // endDate
  null, // Tất cả phòng
  {
    weekendExtended: true,
    morningShows: true,
    lateShows: true
  }
);
```

### 2. Tạo suất chiếu cho phòng cụ thể
```javascript
const showtimes = await generator.generateAndSave(
  1, // movieId
  '2024-01-01', // startDate
  '2024-01-03', // endDate
  [1, 2], // Chỉ phòng R1 và R2
  {
    weekendExtended: false,
    morningShows: false,
    lateShows: true
  }
);
```

### 3. Xem trước trước khi tạo
```javascript
const preview = await generator.generateShowtimes(
  1, '2024-01-01', '2024-01-07'
);

console.log(`Sẽ tạo ${preview.length} suất chiếu`);
preview.forEach(st => {
  console.log(`${st.show_date} ${st.show_time} - Phòng ${st.room_id} - ${st.price}đ`);
});
```

## 🔍 Khung giờ mặc định

### Ngày thường (T2-T6):
- 09:00, 10:00, 11:00, 12:00, 13:00, 14:00, 15:00, 16:00, 17:00, 18:00, 19:00, 20:00, 21:00, 22:00

### Cuối tuần (T7, CN):
- 08:00, 09:00, 10:00, 11:00, 12:00, 13:00, 14:00, 15:00, 16:00, 17:00, 18:00, 19:00, 20:00, 21:00, 22:00, 23:00

## ⚠️ Lưu ý quan trọng

1. **Thời gian dọn dẹp**: Tự động thêm 15 phút giữa các suất chiếu
2. **Xung đột**: Hệ thống tự động tránh xung đột phòng và thời gian
3. **Validation**: Kiểm tra phim tồn tại, ngày hợp lệ trước khi tạo
4. **Performance**: Sử dụng transaction để đảm bảo data integrity
5. **Cleanup**: Có thể dọn dẹp suất chiếu cũ tự động

## 🐛 Troubleshooting

### Lỗi "No available rooms found"
- Kiểm tra bảng `rooms` có dữ liệu không
- Kiểm tra `roomIds` có đúng không

### Lỗi "Movie not found"
- Kiểm tra `movieId` có tồn tại trong bảng `movies` không
- Kiểm tra phim có `status = "now"` không

### Lỗi "Date in the past"
- Kiểm tra `startDate` không được trong quá khứ
- Sử dụng format `YYYY-MM-DD`

### Không tạo được suất chiếu
- Kiểm tra xung đột thời gian
- Thử giảm số phòng hoặc thay đổi khung giờ
- Kiểm tra phim có `duration` hợp lệ không
