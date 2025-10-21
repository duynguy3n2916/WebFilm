const { pool } = require('../db');

class ShowtimeGenerator {
  constructor() {
    // Chỉ giờ đẹp: tròn giờ và 30 phút
    this.timeSlots = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
      '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
      '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30',
      '21:00', '21:30', '22:00', '22:30'
    ];
    this.minInterval = 30; // phút giữa các suất chiếu
    this.cleaningTime = 15; // phút dọn dẹp giữa các suất
  }

  /**
   * Lập lịch cân bằng: cách mỗi suất >= 2 giờ, chia đều phim đang chiếu,
   * đảm bảo mỗi phim có ít nhất 1 suất mỗi ngày (ở tối thiểu 1 phòng)
   */
  async generateBalancedShowtimes(startDate, endDate, roomIds = null, options = {}) {
    const movies = await this.getNowShowingMovies();
    if (movies.length === 0) return [];

    const rooms = await this.getAvailableRooms(roomIds);
    if (rooms.length === 0) return [];

    const minGapMinutes = 120; // cách nhau ít nhất 2h
    const start = new Date(startDate);
    const end = new Date(endDate);
    const allShowtimes = [];

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay();
      const timeSlots = this.getTimeSlotsForDay(dayOfWeek, options);

      // B1: đảm bảo mỗi phim có ít nhất 1 suất (ở bất kỳ phòng nào)
      // Ta xoay vòng qua phòng để tìm slot hợp lệ cho từng phim
      const roomIdToPlanned = new Map(); // roomId -> [{start,end}]
      rooms.forEach(r => roomIdToPlanned.set(r.id, []));

      // Helper: thử đặt một phim vào một phòng cho một slot
      const tryPlace = async (movie, room, slot) => {
        const startTime = slot;
        const endTime = this.addMinutes(startTime, movie.duration);
        // Kiểm tra vừa DB vừa kế hoạch tạm thời (roomIdToPlanned)
        const hasDbConflict = await this.checkTimeConflict(room.id, dateStr, startTime, endTime);
        if (hasDbConflict) return false;

        // Kiểm tra khoảng cách tối thiểu với kế hoạch đã lên cho room
        const planned = roomIdToPlanned.get(room.id);
        if (!this.canPlaceInRoom(planned, startTime, endTime, minGapMinutes)) return false;

        // OK → thêm vào kế hoạch
        planned.push({ start: startTime, end: endTime, movieId: movie.id, room });
        return true;
      };

      // Đảm bảo mỗi phim có 1 suất mỗi ngày
      for (const movie of movies) {
        let placed = false;
        for (const slot of timeSlots) {
          // quay vòng phòng để tìm chỗ
          for (const room of rooms) {
            const ok = await tryPlace(movie, room, slot);
            if (ok) { placed = true; break; }
          }
          if (placed) break;
        }
        // Nếu không đặt được, bỏ qua phim này cho ngày đó
      }

      // B2: lấp đầy thêm các slot còn trống bằng xoay vòng phim để chia đều
      // Tạo vòng lặp qua các slot còn trống; chỉ thêm nếu qua được các kiểm tra
      let movieIndex = 0;
      for (const slot of timeSlots) {
        for (const room of rooms) {
          // Nếu slot đã có suất trong phòng này theo planned, bỏ qua
          const planned = roomIdToPlanned.get(room.id);
          if (planned.some(p => p.start === slot)) continue;

          // thử lần lượt các phim (round-robin)
          let tried = 0;
          while (tried < movies.length) {
            const movie = movies[(movieIndex + tried) % movies.length];
            const startTime = slot;
            const endTime = this.addMinutes(startTime, movie.duration);
            const hasDbConflict = await this.checkTimeConflict(room.id, dateStr, startTime, endTime);
            if (!hasDbConflict && this.canPlaceInRoom(planned, startTime, endTime, minGapMinutes)) {
              planned.push({ start: startTime, end: endTime, movieId: movie.id, room });
              movieIndex = (movieIndex + tried + 1) % movies.length;
              break;
            }
            tried++;
          }
        }
      }

      // Convert planned -> showtimes và tính giá
      for (const [roomId, items] of roomIdToPlanned.entries()) {
        for (const it of items) {
          const room = it.room;
          const price = this.calculatePrice(room, it.start, dateStr);
          allShowtimes.push({
            movie_id: it.movieId,
            room_id: roomId,
            show_date: dateStr,
            show_time: it.start,
            price,
            available_seats: room.total_seats
          });
        }
      }
    }

    return allShowtimes;
  }

  /**
   * Lưu balanced
   */
  async generateBalancedAndSave(startDate, endDate, roomIds = null, options = {}) {
    const showtimes = await this.generateBalancedShowtimes(startDate, endDate, roomIds, options);
    return await this.saveShowtimes(showtimes);
  }

  /**
   * Lập lịch full-day cho từng phòng: lấp kín từ 08:00 đến 24:00
   * - Chỉ dùng giờ đẹp (:00, :30)
   * - Xoay vòng danh sách phim đang chiếu
   * - Tính theo duration + cleaningTime
   * - Tránh xung đột với các suất đã có trong DB
   */
  async generateFullDayShowtimes(startDate, endDate, roomIds = null, options = {}) {
    let movies = await this.getNowShowingMovies();
    if (movies.length === 0) return [];

    let rooms = await this.getAvailableRooms(roomIds);
    if (rooms.length === 0) return [];

    const start = new Date(startDate);
    const end = new Date(endDate);
    const results = [];

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay();
      // Lấy slots giờ đẹp trong ngày, nhưng full-day sẽ từ 08:00 đến 23:30 (slot cuối)
      let slots = this.getTimeSlotsForDay(dayOfWeek, { ...options, morningShows: true, lateShows: true, weekendExtended: true });
      slots = slots.filter(t => this.timeToMinutes(t) >= this.timeToMinutes('08:00') && this.timeToMinutes(t) <= this.timeToMinutes('23:30'));

      // Ngẫu nhiên hóa thứ tự phim và phòng theo ngày để dàn trải
      movies = this.shuffleArray([...movies]);
      rooms = this.shuffleArray([...rooms]);

      // Đảm bảo mỗi phim có ít nhất 1 suất ở mỗi khung giờ: sáng/chiều/tối
      const windows = [
        { name: 'morning',  start: '08:00', end: '11:59' },
        { name: 'afternoon',start: '12:00', end: '17:59' },
        { name: 'evening',  start: '18:00', end: '23:30' }
      ];

      for (const movie of movies) {
        for (const wnd of windows) {
          const placed = await this.placeMovieInWindow({
            dateStr,
            movie,
            rooms,
            slots: slots.filter(s => this.timeToMinutes(s) >= this.timeToMinutes(wnd.start) && this.timeToMinutes(s) <= this.timeToMinutes(wnd.end)),
            existingFetcher: (roomId) => this.getRoomShowtimesForDate(roomId, dateStr),
            results,
            movies
          });
          // Không bắt buộc cứng, nếu không đặt được do kín, sẽ bỏ qua
        }
      }

      // Với mỗi phòng, lấp kín timeline bằng round-robin movies
      for (const room of rooms) {
        // Lấy các suất đã có trong DB của phòng này trong ngày này
        const existing = await this.getRoomShowtimesForDate(room.id, dateStr);
        // tạo con trỏ thời gian chạy trong ngày
        let pointerIdx = 0; // index trong slots
        let movieIdx = Math.floor(Math.random() * movies.length);   // index round-robin phim (random start)

        while (pointerIdx < slots.length) {
          const startTime = slots[pointerIdx];
          const movie = movies[movieIdx % movies.length];
          const endTime = this.addMinutes(startTime, movie.duration);

          // Nếu vượt quá 24:00 thì dừng phòng này
          if (this.timeToMinutes(endTime) > this.timeToMinutes('24:00')) break;

          // Kiểm tra xung đột với DB (bao gồm cả suất đã có) + suất dự kiến vừa thêm (results)
          const hasDbConflict = await this.checkTimeConflict(room.id, dateStr, startTime, endTime);
          const hasPlanConflict = results.some(st => st.room_id === room.id && st.show_date === dateStr && !this.nonOverlap(startTime, endTime, st.show_time, this.addMinutes(st.show_time, movies.find(m=>m.id===st.movie_id)?.duration || 0)));

          // Kiểm tra conflict với existing list nhanh
          const hasExistingConflict = existing.some(st => !this.nonOverlap(startTime, endTime, st.show_time, this.addMinutes(st.show_time, st.movie_duration)));

          if (!hasDbConflict && !hasPlanConflict && !hasExistingConflict) {
            results.push({
              movie_id: movie.id,
              room_id: room.id,
              show_date: dateStr,
              show_time: startTime,
              price: this.calculatePrice(room, startTime, dateStr),
              available_seats: room.total_seats
            });

            // Tiến con trỏ: đến slot >= (endTime + cleaningTime), làm tròn tới :00 hoặc :30
            const nextStart = this.addMinutes(endTime, this.cleaningTime);
            pointerIdx = this.findNextSlotIndex(slots, nextStart);
            movieIdx++;
          } else {
            // Nếu xung đột: đẩy con trỏ sang slot kế tiếp gần nhất không conflict
            pointerIdx++;
          }
        }
      }
    }

    return results;
  }

  async generateFullDayAndSave(startDate, endDate, roomIds = null, options = {}) {
    const showtimes = await this.generateFullDayShowtimes(startDate, endDate, roomIds, options);
    return await this.saveShowtimes(showtimes);
  }

  // Helpers cho full-day
  nonOverlap(s1, e1, s2, e2) {
    const a1 = this.timeToMinutes(s1);
    const b1 = this.timeToMinutes(e1);
    const a2 = this.timeToMinutes(s2);
    const b2 = this.timeToMinutes(e2);
    return b1 <= a2 || b2 <= a1;
  }

  findNextSlotIndex(slots, timeStr) {
    // Làm tròn timeStr tới slot kế tiếp trong danh sách
    const t = this.timeToMinutes(timeStr);
    let best = -1;
    let bestVal = Infinity;
    for (let i = 0; i < slots.length; i++) {
      const v = this.timeToMinutes(slots[i]);
      if (v >= t && v < bestVal) {
        bestVal = v;
        best = i;
      }
    }
    if (best === -1) return slots.length; // vượt cuối ngày
    return best;
  }

  // Dàn trải: cố gắng đặt 1 suất cho phim trong một khung giờ (window)
  async placeMovieInWindow({ dateStr, movie, rooms, slots, existingFetcher, results, movies }) {
    if (slots.length === 0) return false;
    const shuffledRooms = this.shuffleArray([...rooms]);
    const shuffledSlots = this.shuffleArray([...slots]);
    for (const slot of shuffledSlots) {
      for (const room of shuffledRooms) {
        const endTime = this.addMinutes(slot, movie.duration);
        if (this.timeToMinutes(endTime) > this.timeToMinutes('24:00')) continue;
        const existing = await existingFetcher(room.id);
        const hasDbConflict = await this.checkTimeConflict(room.id, dateStr, slot, endTime);
        const hasPlanConflict = results.some(st => st.room_id === room.id && st.show_date === dateStr && !this.nonOverlap(slot, endTime, st.show_time, this.addMinutes(st.show_time, movies.find(m=>m.id===st.movie_id)?.duration || 0)));
        const hasExistingConflict = existing.some(st => !this.nonOverlap(slot, endTime, st.show_time, this.addMinutes(st.show_time, st.movie_duration)));
        if (!hasDbConflict && !hasPlanConflict && !hasExistingConflict) {
          results.push({
            movie_id: movie.id,
            room_id: room.id,
            show_date: dateStr,
            show_time: slot,
            price: this.calculatePrice(room, slot, dateStr),
            available_seats: room.total_seats
          });
          return true;
        }
      }
    }
    return false;
  }

  // Fisher–Yates shuffle
  shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Kiểm tra có thể đặt trong phòng với khoảng cách tối thiểu
   */
  canPlaceInRoom(plannedItems, startTime, endTime, minGapMinutes) {
    const newStart = this.timeToMinutes(startTime);
    const newEnd = this.timeToMinutes(endTime);
    for (const p of plannedItems) {
      const ps = this.timeToMinutes(p.start);
      const pe = this.timeToMinutes(p.end);
      // Không overlap và đảm bảo cách tối thiểu
      const gapBefore = newStart - pe;
      const gapAfter = ps - newEnd;
      const overlap = !(newEnd <= ps || newStart >= pe);
      if (overlap) return false;
      if (gapBefore > -minGapMinutes && gapBefore < minGapMinutes) return false;
      if (gapAfter > -minGapMinutes && gapAfter < minGapMinutes) return false;
    }
    // Giới hạn ngày tối đa 23:30
    if (newEnd > this.timeToMinutes('23:30')) return false;
    return true;
  }

  /**
   * Tạo suất chiếu cho một phim trong khoảng thời gian
   * @param {number} movieId - ID phim
   * @param {string} startDate - Ngày bắt đầu (YYYY-MM-DD)
   * @param {string} endDate - Ngày kết thúc (YYYY-MM-DD)
   * @param {Array} roomIds - Danh sách phòng chiếu (optional)
   * @param {Object} options - Tùy chọn
   */
  async generateShowtimes(movieId, startDate, endDate, roomIds = null, options = {}) {
    try {
      console.log(`🎬 Generating showtimes for movie ${movieId} from ${startDate} to ${endDate}`);
      
      // 1. Lấy thông tin phim
      const movie = await this.getMovieInfo(movieId);
      if (!movie) {
        throw new Error(`Movie ${movieId} not found`);
      }

      // 2. Lấy danh sách phòng chiếu
      const rooms = await this.getAvailableRooms(roomIds);
      if (rooms.length === 0) {
        throw new Error('No available rooms found');
      }

      // 3. Lấy thời gian chiếu phim (phút)
      const movieDuration = movie.duration;
      const totalShowTime = movieDuration + this.cleaningTime; // + thời gian dọn dẹp

      // 4. Tạo lịch chiếu cho từng ngày
      const generatedShowtimes = [];
      const start = new Date(startDate);
      const end = new Date(endDate);

      for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        const dateStr = date.toISOString().split('T')[0];
        const dayShowtimes = await this.generateDayShowtimes(
          movieId, 
          dateStr, 
          rooms, 
          movieDuration, 
          totalShowTime,
          options
        );
        generatedShowtimes.push(...dayShowtimes);
      }

      console.log(`✅ Generated ${generatedShowtimes.length} showtimes`);
      return generatedShowtimes;

    } catch (error) {
      console.error('❌ Error generating showtimes:', error.message);
      throw error;
    }
  }

  /**
   * Tạo suất chiếu cho một ngày cụ thể
   */
  async generateDayShowtimes(movieId, date, rooms, movieDuration, totalShowTime, options) {
    const dayShowtimes = [];
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay(); // 0 = Chủ nhật, 6 = Thứ 7

    // Điều chỉnh khung giờ theo ngày trong tuần
    const timeSlots = this.getTimeSlotsForDay(dayOfWeek, options);

    for (const room of rooms) {
      const roomShowtimes = await this.generateRoomShowtimes(
        movieId, 
        date, 
        room, 
        timeSlots, 
        movieDuration, 
        totalShowTime
      );
      dayShowtimes.push(...roomShowtimes);
    }

    return dayShowtimes;
  }

  /**
   * Tạo suất chiếu cho một phòng cụ thể
   */
  async generateRoomShowtimes(movieId, date, room, timeSlots, movieDuration, totalShowTime) {
    const roomShowtimes = [];
    const roomId = room.id;

    console.log(`   Generating for room ${roomId} (${room.total_seats} seats) on ${date}`);

    for (const timeSlot of timeSlots) {
      const showTime = timeSlot;
      const endTime = this.addMinutes(showTime, movieDuration);
      
      // Kiểm tra xem có thể fit vào khung giờ không trước
      const canFit = this.canFitInTimeSlot(showTime, endTime, timeSlots);
      
      if (canFit) {
        // Kiểm tra xung đột với suất chiếu khác
        const hasConflict = await this.checkTimeConflict(roomId, date, showTime, endTime);
        
        if (!hasConflict) {
          const showtime = {
            movie_id: movieId,
            room_id: roomId,
            show_date: date,
            show_time: showTime,
            price: this.calculatePrice(room, timeSlot, date),
            available_seats: room.total_seats
          };

          roomShowtimes.push(showtime);
          console.log(`     ✅ Added: ${showTime} - ${endTime} (${showtime.price}đ)`);
        } else {
          console.log(`     ❌ Conflict: ${showTime} - ${endTime}`);
        }
      } else {
        console.log(`     ⏰ Can't fit: ${showTime} - ${endTime}`);
      }
    }

    console.log(`   Generated ${roomShowtimes.length} showtimes for room ${roomId}`);
    return roomShowtimes;
  }

  /**
   * Kiểm tra xung đột thời gian
   */
  async checkTimeConflict(roomId, date, startTime, endTime) {
    try {
      const [conflicts] = await pool.execute(`
        SELECT id, show_time, 
               ADDTIME(show_time, SEC_TO_TIME((SELECT duration FROM movies WHERE id = movie_id) * 60)) as end_time
        FROM showtimes 
        WHERE room_id = ? AND show_date = ? AND (
          (show_time <= ? AND ADDTIME(show_time, SEC_TO_TIME((SELECT duration FROM movies WHERE id = movie_id) * 60)) > ?) OR
          (show_time < ? AND ADDTIME(show_time, SEC_TO_TIME((SELECT duration FROM movies WHERE id = movie_id) * 60)) >= ?) OR
          (show_time >= ? AND show_time < ?)
        )
      `, [roomId, date, startTime, startTime, endTime, endTime, startTime, endTime]);

      return conflicts.length > 0;
    } catch (error) {
      console.error('Error checking time conflict:', error);
      return true; // Nếu có lỗi, coi như có xung đột để an toàn
    }
  }

  /**
   * Kiểm tra xem có thể fit vào khung giờ không
   */
  canFitInTimeSlot(startTime, endTime, timeSlots) {
    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = this.timeToMinutes(endTime);
    
    // Kiểm tra xem có vượt quá 23:30 không (cuối tuần có thể đến 23:30)
    if (endMinutes > this.timeToMinutes('23:30')) {
      return false;
    }

    // Kiểm tra xem startTime có trong danh sách timeSlots không
    const isValidStartTime = timeSlots.includes(startTime);
    
    // Kiểm tra xem có vượt quá giới hạn thời gian không
    const maxTime = Math.max(...timeSlots.map(time => this.timeToMinutes(time)));
    const isValidEndTime = endMinutes <= maxTime + 30; // Cho phép thêm 30 phút buffer

    return isValidStartTime && isValidEndTime;
  }

  /**
   * Lấy khung giờ theo ngày trong tuần
   */
  getTimeSlotsForDay(dayOfWeek, options = {}) {
    const { 
      weekendExtended = true,
      morningShows = true,
      lateShows = true 
    } = options;

    let slots = [...this.timeSlots];

    // Chủ nhật và thứ 7: mở rộng giờ
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      if (weekendExtended) {
        // Thêm giờ sáng sớm và tối muộn cho cuối tuần
        const earlySlots = ['08:00', '08:30'];
        const lateSlots = ['23:00', '23:30'];
        slots = [...earlySlots, ...slots, ...lateSlots];
      }
    }

    // Ngày thường: bỏ suất sáng sớm và tối muộn
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      if (!morningShows) {
        slots = slots.filter(time => this.timeToMinutes(time) >= this.timeToMinutes('10:00'));
      }
      if (!lateShows) {
        slots = slots.filter(time => this.timeToMinutes(time) <= this.timeToMinutes('21:30'));
      }
    }

    return slots;
  }

  /**
   * Tính giá vé dựa trên phòng, giờ chiếu và ngày
   */
  calculatePrice(room, timeSlot, date) {
    let basePrice = 85000; // Giá cơ bản
    
    // Phòng lớn hơn = giá cao hơn
    if (room.total_seats > 100) {
      basePrice += 10000;
    }
    
    // Suất tối = giá cao hơn
    const timeMinutes = this.timeToMinutes(timeSlot);
    if (timeMinutes >= this.timeToMinutes('18:00')) {
      basePrice += 15000;
    }
    
    // Cuối tuần = giá cao hơn
    const dayOfWeek = new Date(date).getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      basePrice += 10000;
    }
    
    return basePrice;
  }

  /**
   * Lưu suất chiếu vào database
   */
  async saveShowtimes(showtimes) {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const savedShowtimes = [];
      
      for (const showtime of showtimes) {
        const [result] = await connection.execute(`
          INSERT INTO showtimes (movie_id, room_id, show_date, show_time, price, available_seats)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          showtime.movie_id,
          showtime.room_id,
          showtime.show_date,
          showtime.show_time,
          showtime.price,
          showtime.available_seats
        ]);

        savedShowtimes.push({
          id: result.insertId,
          ...showtime
        });
      }

      await connection.commit();
      console.log(`✅ Saved ${savedShowtimes.length} showtimes to database`);
      return savedShowtimes;

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Tạo suất chiếu và lưu vào database
   */
  async generateAndSave(movieId, startDate, endDate, roomIds = null, options = {}) {
    const showtimes = await this.generateShowtimes(movieId, startDate, endDate, roomIds, options);
    const savedShowtimes = await this.saveShowtimes(showtimes);
    return savedShowtimes;
  }

  /**
   * Xóa suất chiếu cũ (quá hạn)
   */
  async cleanupOldShowtimes() {
    const [result] = await pool.execute(`
      DELETE FROM showtimes 
      WHERE show_date < CURDATE() OR (show_date = CURDATE() AND show_time < CURTIME())
    `);
    
    console.log(`🧹 Cleaned up ${result.affectedRows} old showtimes`);
    return result.affectedRows;
  }

  /**
   * Lấy thông tin phim
   */
  async getMovieInfo(movieId) {
    const [movies] = await pool.execute(
      'SELECT * FROM movies WHERE id = ?',
      [movieId]
    );
    return movies[0] || null;
  }

  /**
   * Lấy danh sách phim đang chiếu
   */
  async getNowShowingMovies() {
    const [movies] = await pool.execute(
      'SELECT id, title, duration FROM movies WHERE status = "now" ORDER BY id ASC'
    );
    return movies;
  }

  /**
   * Lấy suất chiếu hiện có của 1 phòng theo ngày, kèm duration phim
   */
  async getRoomShowtimesForDate(roomId, dateStr) {
    const [rows] = await pool.execute(`
      SELECT s.id, s.show_time, m.duration as movie_duration
      FROM showtimes s
      JOIN movies m ON m.id = s.movie_id
      WHERE s.room_id = ? AND s.show_date = ?
      ORDER BY s.show_time
    `, [roomId, dateStr]);
    return rows;
  }

  /**
   * Lấy danh sách phòng chiếu
   */
  async getAvailableRooms(roomIds = null) {
    let query = 'SELECT * FROM rooms WHERE 1=1';
    const params = [];
    
    if (roomIds && Array.isArray(roomIds) && roomIds.length > 0) {
      query += ' AND id IN (' + roomIds.map(() => '?').join(',') + ')';
      params.push(...roomIds);
    }
    
    query += ' ORDER BY total_seats ASC';
    
    const [rooms] = await pool.execute(query, params);
    return rooms;
  }

  /**
   * Utility: Chuyển thời gian thành phút
   */
  timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Utility: Thêm phút vào thời gian
   */
  addMinutes(timeStr, minutes) {
    const totalMinutes = this.timeToMinutes(timeStr) + minutes;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }
}

module.exports = ShowtimeGenerator;
