import db from '../config/db.js';
import bcrypt from 'bcrypt';

export const login = async ({ email, password }) => {
  try {    
    // 1. Get user by email
    const rows = await db.query(
      'SELECT * FROM login WHERE email = ?',
      [email.trim()]
    );

    if (rows.length === 0) {
      return { success: false, message: 'User not found' };
    }

    const user = rows[0];

    // 2. Compare password (BLOB) with bcrypt
    const isMatch = await bcrypt.compare(password, user.password.toString('utf8'));

    if (!isMatch) {
      return { success: false, message: 'Invalid password' };
    }

    // 3. Login successful
    return { success: true, user };
  } catch (err) {
    console.error('DB error:', err);
    return { success: false, message: 'Server error' };
  }
};

export default { login };
