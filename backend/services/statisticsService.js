

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
      <p>Hello ${userRow.user_name},</p>
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
       SET actions='password changed',
       resetPasswordToken=?,
       resetPasswordExpires=?,
           updated_at=NOW()
     WHERE user_id=?`,
    [userRow.resetPasswordToken, userRow.resetPasswordExpires, userRow.user_id]
  );

  //  Insert new row 
  const newLoginId = uuidv4();
  await db.query(
    `INSERT INTO login
       (login_id, user_id, user_name, email, password, actions, resetPasswordToken, resetPasswordExpires, role, permission, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, NULL, NULL, NULL, ?, ?, NOW(), NOW())`,
    [newLoginId, userRow.user_id, userRow.user_name, userRow.email, newPassword, userRow.role, userRow.permission]
  );

  return { message: "Password changed successfully" };
};

export const addUser = async (data) => {
  const login_id = uuidv4();
  const user_id = uuidv4();

  try {
    await db.query(
      `INSERT INTO login
         (login_id, user_id, user_name, email, password, role, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [login_id, user_id, data.user_name, data.email, data.password, data.role]
    );

    return {
      login_id,
      user_id,
      user_name: data.user_name,
      email: data.email,
      role: data.role,
      created_at: new Date(),
      updated_at: new Date(),
    };
  } catch (err) {
    console.error("Error inserting user:", err);
    throw err;
  }
};



export const getAllUsers = async () => {
  try {
    const allusers = await db.query("SELECT login_id, user_id, user_name, email,password, role, permission  FROM login WHERE actions IS NULL");

    return allusers;
  } catch (err) {
    console.error("Error fetching users:", err);
    throw err;
  }
};

// Update User Rbac
const updateUser = async (login_id, data) => {
  try {
    const kalai = await db.query(
      `UPDATE login
       SET role = ?, permission = ?, updated_at = NOW() WHERE login_id = ?`,
      [data.role, data.permissions, login_id]
    );
  } catch (err) {
    console.error("Error updating user:", err);
    throw err;
  }
};

// Delete user
const deleteUser = async (login_id) => {
  try {
    await db.query("DELETE FROM login WHERE login_id = ?", [login_id]);
  } catch (err) {
    console.error("Error deleting user:", err);
    throw err;
  }

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

const addResort = async (data) => {
  try {
    const resort_id = uuidv4(); // generate new uuid
    await db.query(
      `INSERT INTO resort_list 
       (resort_id, resort_name, category, island, email, phone_number, actions, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, null, NOW(), null)`,
      [resort_id, data.resort_name, data.category, data.island, data.email, data.phone_number]
    );
  } catch (err) {
    // Check for duplicate entry error (MySQL error code 1062)
    if (err.code === "ER_DUP_ENTRY") {
      console.error("Duplicate resort detected:", err.message);
      throw new Error("Resort already exists!");
    }
    console.error("Error inserting resort:", err);
    throw err;
  }
};

export const getResorts = async () => {
  try {
    // Select resorts where action is NULL
    const rows = await db.query(
      `SELECT resort_id, resort_name, category, island, email, phone_number 
       FROM resort_list 
       WHERE (actions IS NULL OR actions = '')
       ORDER BY resort_name ASC`
    );

    return rows;
  } catch (err) {
    console.error("Error fetching resorts:", err);
    throw err;
  }
};

const updateResort = async (resort_id, data) => {
  try {
    // Step 1: Mark old record as Updated
    const rows = await db.query(
      `UPDATE resort_list
       SET updated_at = NOW(),
           actions = 'Updated'
       WHERE resort_id = ?`,
      [resort_id]
    );

    // Step 2: Insert a new record with new UUID and updated data
    const newResortId = uuidv4();

    await db.query(
      `INSERT INTO resort_list 
       (resort_id, resort_name, category, island, email, phone_number,actions, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?,NULL, NOW(), NOW())`,
      [
        newResortId,
        data.resort_name || null,
        data.category || null,
        data.island || null,
        data.email || null,
        data.phone_number || null
      ]
    );

  } catch (err) {
    console.error("Error updating resort:", err);
    throw err;
  }
};

// Delete resort
const deleteResort = async (resort_id) => {
  try {
    await db.query("UPDATE resort_list SET updated_at= NOW() , actions='deleted' WHERE resort_id = ?", [resort_id]);
  } catch (err) {
    console.error("Error deleting resort:", err);
    throw err;
  }
};

export const addResortIncident = async (data) => {
  const incident_id = uuidv4();
  const insertDATA = await db.query(
    `INSERT INTO resort_incident_reports
       (incident_id,resort_id, resort_name, category,notes,status,incident_date, created_at, updated_at)
     VALUES (?, ?, ?,?,?,?,?, NOW(), NOW())`,
    [incident_id, data.resort_id, data.resort_name, data.category, data.notes, data.status, data.incident_date]
  );

  return {
    incident_id,
    resort_id: data.resort_id,
    resort_name: data.resort_name,
    category: data.category,
    notes: data.notes,
    status: data.status,
    incident_date: data.incident_date,
    created_at: new Date(),
    updated_at: new Date(),
  };
};

export const getAllIncidentReports = async () => {
  try {
    const rows = await db.query("SELECT incident_id,resort_id, resort_name, category,notes,status,incident_date FROM resort_incident_reports WHERE actions IS NULL ORDER BY incident_date DESC");
    return rows;
  } catch (err) {
    console.error("Error fetching resorts:", err);
    throw err;
  }
};

const updateIncidentReport = async (incident_id, data) => {
  try {
    await db.query(
      `UPDATE resort_incident_reports
       SET actions = 'updated',
           updated_at = NOW()
       WHERE incident_id = ?`,
      [incident_id]
    );

    const newIncidentId = uuidv4();
    await db.query(
      `INSERT INTO resort_incident_reports 
        (incident_id, resort_id, resort_name, category, notes, status, incident_date, actions, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NOW(), NOW())`,
      [
        newIncidentId,
        data.resort_id,
        data.resort_name,
        data.category,
        data.notes,
        data.status,
        data.incident_date
      ]
    );

  } catch (err) {
    console.error("Error updating resort:", err);
    throw err;
  }
};

// Delete Resort Incident
const deleteResortIncident = async (incident_id) => {
  try {
    await db.query(
      "UPDATE resort_incident_reports SET actions = 'deleted', updated_at = NOW() WHERE incident_id = ?",
      [incident_id]
    );

    return { success: true, message: "Incident report marked as deleted" };
  } catch (err) {
    console.error("Error soft-deleting resort incident report:", err);
    throw err;
  }
};



// Export using ES module syntax
export default {
  login,
  forgotPassword,
  resetPassword,
  addUser,
  getAllUsers,
  updateUser,
  deleteUser,
  getDashboardStats,
  addResort,
  getResorts,
  updateResort,
  deleteResort,
  addResortIncident,
  getAllIncidentReports,
  updateIncidentReport,
  deleteResortIncident
};





