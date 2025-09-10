
import mysql from 'mysql2/promise';

let pool;

export const connectDB = () => {
  pool = mysql.createPool({
    host: 'localhost',
    user: 'root',          // 👈 your MySQL username
    password: 'Medianet@123', // 👈 your MySQL password
    database: 'medianet',   // 👈 your DB name
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  console.log('✅ MySQL Connected...');
};

export const query = async (sql, params) => {
  if (!pool) {
    throw new Error('Database not connected!');
  }
  const [rows] = await pool.execute(sql, params);
  return rows;
};

export default { connectDB, query };

