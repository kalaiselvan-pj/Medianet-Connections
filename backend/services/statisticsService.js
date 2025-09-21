

import db from '../config/db.js';
import crypto from "crypto";
const SHA256 = crypto.SHA256;
import nodemailer from 'nodemailer';
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
dotenv.config();



export const login = async ({ email, password }) => {
  try {
    const rows = await db.query(
      `SELECT * 
       FROM login 
       WHERE LOWER(email) = LOWER(?) 
         AND (actions IS NULL OR actions = '')`,
      [email.trim()]
    );

    if (!rows || rows.length === 0) {
      return { success: false, message: 'User not found' };
    }

    const user = rows[0];

    if (password !== user.password.toString()) {
      return { success: false, message: 'Invalid password' };
    }

    return { success: true, user };
  } catch (err) {
    return { success: false, message: 'Server error' };
  }
};


export const forgotPassword = async (email) => {
  if (!email) throw new Error("Email is required");

  //  Find the latest user row
  const rows = await db.query(
    `SELECT * FROM login WHERE email=? `,
    [email]
  );

  if (!rows || rows.length === 0) throw new Error("User not found");

  const userRow = rows[0];

  //  Generate reset token and expiry
  const resetToken = crypto.randomBytes(20).toString("hex");
  const expiry = new Date(Date.now() + 3600000); // 1 hour from now

  //  Update the latest row with token & expiry
  await db.query(
    `UPDATE login
       SET resetPasswordToken=?, resetPasswordExpires=?
     WHERE login_id=?`,
    [resetToken, expiry, userRow.login_id]
  );

  //  Send reset email
  const resetUrl = `http://localhost:3000/login/reset-password/${resetToken}`;
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: { rejectUnauthorized: false },
  });

  await transporter.sendMail({
    to: email,
    from: process.env.EMAIL_USER,
    subject: "Password Reset Request",
    html: `
    <div style="font-family: Arial, sans-serif; color:#000;">
      <p>Hello,</p>
      <p>You requested to reset your password. Click the button below to set a new one:</p>

      <p style="text-align:center;">
        <a 
          href="${resetUrl}" 
          style="
            display:inline-block;
            padding:12px 24px;
            background:#007bff;
            color:#fff !important;
            text-decoration:none;
            border-radius:6px;
            font-weight:bold;
          "
        >
          Reset Password
        </a>
      </p>

      <p>This link is valid for 1 hour. If you didn’t request a reset, please ignore this email.</p>

      <p>Thank you,<br/>
      <strong>Medianet Pvt Ltd</strong></p>

      <hr/>
      <p style="font-size:12px; color:#666;">
        H.Zoneyria, 5th Floor<br/>
        Boduthakurufaanu Maagu<br/>
        Male', 20057<br/>
        Republic of Maldives
      </p>
    </div>
  `
  });

  return { message: "Reset Password link sent to your email." };
};


export const resetPassword = async (token, newPassword) => {
  // Find the user row by token & check expiry
  const rows = await db.query(
    `SELECT * FROM login
       WHERE resetPasswordToken=? 
         AND resetPasswordExpires > ?`,
    [token, new Date()]
  );

  if (!rows || rows.length === 0) {
    throw new Error("Invalid or expired token");
  }
  const userRow = rows[0];

  //  Mark the old row as updated
  await db.query(
    `UPDATE login
       SET actions='updated',
           updated_at=NOW()
     WHERE user_id=?`,
    [userRow.user_id]
  );

  //  Insert new row with same user_id, name, email & new password
  const newLoginId = uuidv4();
  await db.query(
    `INSERT INTO login
       (login_id, user_id, name, email, password, actions, resetPasswordToken, resetPasswordExpires, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, NULL, NULL, NULL, NOW(), NOW())`,
    [newLoginId, userRow.user_id, userRow.name, userRow.email, newPassword]
  );

  return { message: "Password changed successfully" };
};


const getDashboardStats = async () => {
  try {
    const query = `
      SELECT category AS name, COUNT(*) AS Resorts
      FROM resort_list
      GROUP BY category
    `;
    // Use promise style (no callbacks)
    const results = await db.query(query);

    return results;
  } catch (err) {
    throw err;
  }
};


export const addResort = async (resort_name, category) => {
  const resort_id = uuidv4(); // ✅ generate new uuid

  await db.query(
    `INSERT INTO resort_list
       (resort_id, resort_name, category, created_at, updated_at)
     VALUES (?, ?, ?, NOW(), NOW())`,
    [resort_id, resort_name, category]
  );

  return {
    resort_id,
    resort_name,
    category,
    created_at: new Date(),
    updated_at: new Date(),
  };
};


export const getResorts = async () => {
  try {
    // Only select resort_name and category
    const rows = await db.query("SELECT resort_id, resort_name, category FROM resort_list ORDER BY resort_name ASC");

    return rows;
  } catch (err) {
    console.error("Error fetching resorts:", err);
    throw err;
  }
};
// Update resort
const updateResort = async (resort_id, resort_name, category) => {
  try {
    await db.query(
      "UPDATE resort_list SET resort_name = ?, category = ?, updated_at = NOW() WHERE resort_id = ?",
      [resort_name, category, resort_id]
    );
  } catch (err) {
    console.error("Error updating resort:", err);
    throw err;
  }
};
// Delete resort
const deleteResort = async (resort_id) => {
  try {
    await db.query("DELETE FROM resort_list WHERE resort_id = ?", [resort_id]);
  } catch (err) {
    console.error("Error deleting resort:", err);
    throw err;
  }

};


// ✅ Export using ES module syntax
export default {
  login,
  forgotPassword,
  resetPassword,
  getDashboardStats,
  addResort,
  getResorts,
  updateResort,
  deleteResort
};





