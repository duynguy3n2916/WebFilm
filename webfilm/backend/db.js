const mysql = require('mysql2/promise');
require('dotenv').config();

// Tạo connection pool để tối ưu hiệu suất
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'webfilm_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

// Hàm test kết nối database
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Kết nối MySQL thành công!');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Lỗi kết nối MySQL:', error.message);
    return false;
  }
};



module.exports = {
  pool,
  testConnection
};
