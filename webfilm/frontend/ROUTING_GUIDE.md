# Hướng dẫn Routing System

## Tổng quan
Dự án đã được cập nhật để sử dụng React Router DOM thay vì state-based routing. Điều này cung cấp URL routing thực sự và trải nghiệm người dùng tốt hơn.

## Cấu trúc Routing

### Routes chính:
- `/` - Trang chủ (Home)
- `/movies` - Danh sách phim (Movies)
- `/foods` - Đồ ăn & uống (Foods)
- `/user` - Trang người dùng (User Panel)
- `/movie/:movieId` - Chi tiết phim (Movie Detail)
- `/booking/:movieId` - Đặt vé (Booking Flow)

### Components được cập nhật:

#### 1. App.js
- Được chia thành `AppContent` (chứa logic) và `App` (chứa Router)
- Sử dụng `BrowserRouter`, `Routes`, `Route`
- Navigation logic được chuyển thành helper functions

#### 2. Navbar.js
- Sử dụng `Link` từ React Router thay vì buttons
- Sử dụng `useLocation` để xác định trang hiện tại
- Logo trở thành Link về trang chủ

#### 3. Route Components (trong `/components/routes/`)
- `HomeRoute.js` - Wrapper cho Home component
- `MoviesRoute.js` - Wrapper cho Movies component  
- `FoodsRoute.js` - Wrapper cho Foods component
- `UserRoute.js` - Wrapper cho UserPanel component
- `MovieDetailRoute.js` - Xử lý movie detail với URL params
- `BookingRoute.js` - Xử lý booking flow với URL params

## Lợi ích của hệ thống mới:

1. **URL thực sự**: Người dùng có thể bookmark và chia sẻ URL
2. **Browser navigation**: Nút back/forward của browser hoạt động
3. **SEO friendly**: Search engines có thể index các trang
4. **Better UX**: Trải nghiệm người dùng tự nhiên hơn
5. **Code organization**: Logic routing được tách biệt rõ ràng

## Cách sử dụng:

### Navigation trong components:
```javascript
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

// Chuyển đến trang khác
navigate('/movies');
navigate(`/movie/${movieId}`);
navigate(-1); // Quay lại trang trước
```

### Link trong JSX:
```javascript
import { Link } from 'react-router-dom';

<Link to="/movies">Phim</Link>
<Link to={`/movie/${movie.id}`}>Chi tiết phim</Link>
```

### Lấy thông tin route hiện tại:
```javascript
import { useLocation } from 'react-router-dom';

const location = useLocation();
console.log(location.pathname); // "/movies"
```

## Lưu ý:
- Footer component không được cập nhật vì yêu cầu chỉ cập nhật "tất cả trừ footer"
- Tất cả navigation logic cũ đã được thay thế bằng React Router
- State management vẫn hoạt động bình thường
- Authentication flow vẫn được giữ nguyên
