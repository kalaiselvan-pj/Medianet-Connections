import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config(); // load .env file

let pool;

export const connectDB = () => {
  pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    namedPlaceholders: true
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

