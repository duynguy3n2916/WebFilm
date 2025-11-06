require('dotenv').config({ path: require('path').join(__dirname, '..', 'config.env') });

const path = require('path');
const { testConnection } = require('../db');
const ShowtimeGenerator = require('../services/showtimeGenerator');

async function main() {
  const ok = await testConnection();
  if (!ok) {
    console.error('Không thể kết nối DB. Kiểm tra file backend/config.env (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME).');
    process.exit(1);
  }

  const generator = new ShowtimeGenerator();

  // Tham số CLI: --mode balanced|full, --start YYYY-MM-DD, --end YYYY-MM-DD, --movie <id>
  const args = process.argv.slice(2);
  const getArg = (key, defVal) => {
    const idx = args.findIndex(a => a === key);
    if (idx === -1) return defVal;
    const v = args[idx + 1];
    return v && !v.startsWith('--') ? v : defVal;
  };

  const mode = getArg('--mode', 'balanced');
  const today = new Date();
  const toIsoDate = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0,10);

  const start = getArg('--start', toIsoDate(today));
  const endDate = new Date(today); endDate.setDate(endDate.getDate() + 6);
  const end = getArg('--end', toIsoDate(endDate));
  const movieId = getArg('--movie', null);

  try {
    let saved = [];
    if (mode === 'balanced') {
      console.log(`▶️  Generating BALANCED showtimes ${start} → ${end}`);
      const data = await generator.generateBalancedShowtimes(start, end);
      saved = await generator.saveShowtimes(data);
    } else if (mode === 'full') {
      console.log(`▶️  Generating FULL-DAY showtimes ${start} → ${end}`);
      const data = await generator.generateFullDayShowtimes(start, end);
      saved = await generator.saveShowtimes(data);
    } else if (mode === 'movie' && movieId) {
      console.log(`▶️  Generating showtimes for movie ${movieId} ${start} → ${end}`);
      saved = await generator.generateAndSave(Number(movieId), start, end);
    } else {
      console.log('Cách dùng:');
      console.log('  node scripts/auto-generate-showtimes.js --mode balanced --start 2025-11-01 --end 2025-11-07');
      console.log('  node scripts/auto-generate-showtimes.js --mode full     --start 2025-11-01 --end 2025-11-07');
      console.log('  node scripts/auto-generate-showtimes.js --mode movie --movie 1 --start 2025-11-01 --end 2025-11-07');
      process.exit(0);
    }

    console.log(`✅ Đã tạo và lưu ${saved.length} suất chiếu.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi khi tạo suất chiếu:', err?.message || err);
    process.exit(1);
  }
}

main();


