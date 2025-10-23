

import db from '../config/db.js';
import crypto from "crypto";
const SHA256 = crypto.SHA256;
import nodemailer from 'nodemailer';
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
  const baseUrl = "https://mdnislandrpt.medianet.mv";
  const resetUrl = `${baseUrl}/login/reset-password/${resetToken}`;

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
         (login_id, user_id, user_name, email, password, role, permission, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [login_id, user_id, data.user_name, data.email, data.password, data.role, data.permission]
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
    const allusers = await db.query("SELECT login_id, user_id, user_name, email,password, role, permission  FROM login WHERE actions IS NULL OR actions = ''");

    return allusers;
  } catch (err) {
    console.error("Error fetching users:", err);
    throw err;
  }
};

// Update User Rbac
const updateUser = async (login_id, data) => {
  try {

    const row = await db.query(
      `UPDATE login
       SET permission = ?, updated_at = NOW() WHERE login_id = ?`,
      [data.permissions, login_id]
    );
  } catch (err) {
    console.error("Error updating user:", err);
    throw err;
  }
};

// Delete user
const deleteUser = async (login_id) => {
  try {
    await db.query(
      `UPDATE login 
       SET updated_at = NOW(), actions = 'User Deleted' 
       WHERE login_id = ?`,
      [login_id]
    );
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

// make sure your db instance is correctly imported
// Converts JS date to MySQL DATETIME format
const toMySQLDateTime = (date) => {
  if (!date) return null;
  const d = new Date(date);
  return d.toISOString().slice(0, 19).replace("T", " ");
};

// --- Add Resort ---
export const addResort = async (data) => {
  const resort_id = uuidv4();

  await db.query(
    `INSERT INTO resort_list 
     (resort_id, resort_name, category, island,
      iptv_vendor, distribution_model, tvro_type, tvro_dish, 
      staff_area_tv, guest_area_tv, horizontal_signal, vertical_signal, 
      horizontal_link_margin, vertical_link_margin, signal_level_timestamp, 
      contact_details, actions, survey_form, service_acceptance_form, 
      dish_antena_image,  created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,  ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      resort_id,
      data.resort_name || null,
      data.category || null,
      data.island || null,
      data.iptv_vendor || null,
      data.distribution_model || null,
      data.tvro_type || null,
      data.tvro_dish || null,
      data.staff_area_tv || null,
      data.guest_area_tv || null,
      data.horizontal_signal || null,
      data.vertical_signal || null,
      data.horizontal_link_margin || null,
      data.vertical_link_margin || null,
      data.signal_level_timestamp ? toMySQLDateTime(data.signal_level_timestamp) : null,
      data.contact_details ? JSON.stringify(data.contact_details) : JSON.stringify([]),
      data.actions || null,
      data.survey_form || null,
      data.service_acceptance_form || null,
      data.dish_antena_image || null,

    ]
  );

  return { resort_id, message: "Resort added successfully" };
};

//update resort Api
export const updateResort = async (resort_id, data) => {
  // Soft mark old record as updated
  await db.query(
    `UPDATE resort_list
     SET updated_at = NOW(), actions = 'Updated'
     WHERE resort_id = ?`,
    [resort_id]
  );

  // Get the old record
  const oldRecord = await db.query(
    `SELECT * FROM resort_list WHERE resort_id = ?`,
    [resort_id]
  );

  if (oldRecord.length === 0) {
    throw new Error("Resort not found");
  }

  const old = oldRecord[0];

  const existingSurveyForm = old?.survey_form;
  const existingServiceAcceptanceForm = old?.service_acceptance_form;
  const existingDishAntenaImage = old?.dish_antena_image;

  // Now safely use them
  const survey_form =
    data.removed_survey_form === 'true'
      ? null
      : (data.survey_form || existingSurveyForm);

  const service_acceptance_form =
    data.removed_service_acceptance_form === 'true'
      ? null
      : (data.service_acceptance_form || existingServiceAcceptanceForm);

  const dish_antena_image =
    data.removed_dish_antena_image === 'true'
      ? null
      : (data.dish_antena_image || existingDishAntenaImage);

  const newResortId = uuidv4();

  await db.query(
    `INSERT INTO resort_list 
     (resort_id, resort_name, category, island, 
      iptv_vendor, distribution_model, tvro_type, tvro_dish, 
      staff_area_tv, guest_area_tv, horizontal_signal, vertical_signal, 
      horizontal_link_margin, vertical_link_margin, signal_level_timestamp, 
      contact_details, actions, survey_form, service_acceptance_form, 
      dish_antena_image, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?,  ?, ?, ?, ?,  ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      newResortId,
      data.resort_name || null,
      data.category || null,
      data.island || null,

      data.iptv_vendor || null,
      data.distribution_model || null,
      data.tvro_type || null,
      data.tvro_dish || null,
      data.staff_area_tv || null,
      data.guest_area_tv || null,
      data.horizontal_signal || null,
      data.vertical_signal || null,
      data.horizontal_link_margin || null,
      data.vertical_link_margin || null,
      data.signal_level_timestamp ? toMySQLDateTime(data.signal_level_timestamp) : null,
      data.contact_details ? JSON.stringify(data.contact_details) : JSON.stringify([]),
      data.actions || null,
      survey_form, // use the variable that might be from old record
      service_acceptance_form,
      dish_antena_image,

    ]
  );

  return { newResortId, message: "Resort updated successfully" };
};

//Get Resorts
export const getResorts = async () => {
  try {
    const rows = await db.query(
      `SELECT * FROM resort_list
       WHERE actions IS NULL OR actions = ''
       ORDER BY resort_name ASC`
    );

    return rows.map(row => ({
      ...row,
      contact_details: row.contact_details
        ? JSON.parse(row.contact_details)
        : []
    }));
  } catch (error) {
    console.error('Database error while fetching resorts:', error);
    throw error; // rethrow so the controller can handle it
  }
};




// Soft delete resort
export const deleteResort = async (resort_id) => {
  try {
    await db.query(
      `UPDATE resort_list 
       SET updated_at = NOW(), actions = 'Deleted' 
       WHERE resort_id = ?`,
      [resort_id]
    );
  } catch (err) {
    console.error("Error deleting resort:", err);
    throw err;
  }
};

export const addResortIncident = async (data) => {
  const incident_id = uuidv4();
  const insertDATA = await db.query(
    `INSERT INTO resort_incident_reports
        (
            incident_id,
            resort_id, 
            resort_name, 
            incident, 
            status, 
            incident_date, 
            assigned_to, 
            contact_name, 
            contact_number, 
            created_at, 
            updated_at
        )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      incident_id,
      data.resort_id,
      data.resort_name,
      data.incident,
      data.status,
      data.incident_date,
      data.assigned_to,
      data.contact_name,
      data.contact_number,
    ]
  );

  // Return the complete object including all saved data and timestamps
  return {
    incident_id,
    resort_id: data.resort_id,
    resort_name: data.resort_name,
    incident: data.incident,
    status: data.status,
    incident_date: data.incident_date,
    assigned_to: data.assigned_to,
    contact_name: data.contact_name,
    contact_number: data.contact_number,
    created_at: new Date(),
    updated_at: new Date(),
  };
};

export const getAllIncidentReports = async () => {
  try {
    const rows = await db.query(
      `SELECT 
        incident_id,
        resort_id, 
        resort_name,
        assigned_to,                  
        contact_name,   
        contact_number,
        status, 
        incident,
        incident_date
      FROM resort_incident_reports 
      WHERE actions IS NULL OR actions = ''
      ORDER BY incident_date DESC`
    );

    return rows;
  } catch (err) {
    console.error("Error fetching incident reports:", err);
    throw err;
  }
};

const updateIncidentReport = async (incident_id, data) => {
  try {
    // 1. Mark the old record as 'updated'
    await db.query(
      `UPDATE resort_incident_reports
         SET actions = 'updated',
             updated_at = NOW()
         WHERE incident_id = ?`,
      [incident_id]
    );

    // 2. Insert a new record with the updated data and new fields
    const newIncidentId = uuidv4();
    await db.query(
      `INSERT INTO resort_incident_reports 
         (
             incident_id, 
             resort_id, 
             resort_name, 
             incident, 
             status, 
             incident_date, 
             assigned_to,                  
             contact_name,    
             contact_number, 
             actions, 
             created_at, 
             updated_at
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NOW(), NOW())`,
      [
        newIncidentId,
        data.resort_id,
        data.resort_name,
        data.incident, // Using the 'incident' field from your frontend payload
        data.status,
        data.incident_date,
        data.assigned_to,              // <--- Data for NEW FIELD
        data.contact_name, // <--- Data for NEW FIELD
        data.contact_number, // <--- Data for NEW FIELD
      ]
    );

  } catch (err) {
    console.error("Error updating resort:", err);
    throw err;
  }
};


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


export const getStreamerResortNames = async () => {
  try {
    const query = `
      SELECT DISTINCT resort_name
      FROM streamer_config
      WHERE resort_name IS NOT NULL
      ORDER BY resort_name ASC
    `;

    const rows = await db.query(query); // ✅ remove destructuring

    // If db.query returns an object (not array), handle it safely
    const resultArray = Array.isArray(rows) ? rows : rows[0] || [];

    const resortNames = resultArray.map(r => r.resort_name);

    return resortNames;
  } catch (err) {
    console.error("Error fetching resort names:", err);
    throw err;
  }
};


export const addStreamerConfig = async (data) => {

  if (!data) throw new Error("Request body is missing");

  const streamer_config_id = uuidv4();

  // Convert arrays to JSON
  const multicast_ip = JSON.stringify(data.multicast_ip || []);
  const port = JSON.stringify(data.port || []);
  const channel_name = JSON.stringify(data.channel_name || []);

  await db.query(
    `INSERT INTO streamer_config 
     (streamer_config_id, resort_name, signal_level, card, stb_no, vc_no, strm, 
      mngmnt_ip, trfc_ip, multicast_ip, port, channel_name, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      streamer_config_id,
      data.resort_name || null,
      data.signal_level || null,
      data.card || null,
      data.stb_no || null,
      data.vc_no || null,
      data.strm || null,
      data.mngmnt_ip || null,
      data.trfc_ip || null,
      multicast_ip,
      port,
      channel_name
    ]
  );

  return { message: "Streamer configuration added successfully", streamer_config_id };
};

export const getAllStreamers = async (resortName = null) => {
  try {
    // 1. Define the base query and parameters (same for vertical and horizontal)
    const baseQuery = `
      SELECT 
        streamer_config_id,
        resort_name,
        signal_level,
        channel_name,
        multicast_ip,
        port,
        stb_no,
        vc_no,
        trfc_ip,
        mngmnt_ip,
        strm,
        card
      FROM streamer_config
      WHERE signal_level = :signal_level
      ${resortName ? 'AND resort_name = :resort_name' : ''}
      ORDER BY resort_name ASC
    `;

    // 2. Build the parameter objects for each signal level
    const verticalParams = {
      signal_level: 'Vertical'
    };

    const horizontalParams = {
      signal_level: 'Horizontal'
    };

    // 3. Conditionally add resort_name parameter to both objects
    if (resortName) {
      verticalParams.resort_name = resortName;
      horizontalParams.resort_name = resortName;
    }

    // 4. Execute queries using the constructed query and parameters

    // Fetch Vertical Streamers
    const vertical = await db.query(baseQuery, verticalParams);

    // Fetch Horizontal Streamers
    const horizontal = await db.query(baseQuery, horizontalParams);

    // Return both as an object
    return { vertical, horizontal };

  } catch (err) {
    console.error("Error fetching streamer configuration:", err);
    // Re-throw the error to be caught by the controller
    throw err;
  }
};

export const updateStreamer = async (streamerConfigId, updateData) => {
  try {
    // Validate that we have data to update
    if (!updateData || Object.keys(updateData).length === 0) {
      throw new Error("No valid fields to update");
    }

    // Build the dynamic SET clause for the UPDATE query
    const setClause = Object.keys(updateData)
      .map(key => `${key} = :${key}`)
      .join(', ');

    // Add updated_at timestamp if you have that column
    // NOTE: This logic is slightly flawed. If updateData has updated_at, you still need
    // to include it in the setClause, but let's stick to the original intent for now:
    const finalSetClause = updateData.updated_at
      ? setClause
      : `${setClause}, updated_at = CURRENT_TIMESTAMP`;

    // 1. Construct the UPDATE query (REMOVED RETURNING *)
    const updateQuery = `
      UPDATE streamer_config 
      SET ${finalSetClause}
      WHERE streamer_config_id = :streamer_config_id
    `;

    // 2. Construct the SELECT query to fetch the updated row
    const selectQuery = `
      SELECT * FROM streamer_config 
      WHERE streamer_config_id = :streamer_config_id
    `;

    // Prepare parameters for the query
    const params = {
      streamer_config_id: streamerConfigId,
      ...updateData
    };

    // 3. Execute the update query
    // In MySQL, `db.query` for UPDATE typically returns an object with `affectedRows`.
    const updateResult = await db.query(updateQuery, params);

    // Check if any row was updated (assuming affectedRows is available on updateResult)
    const affectedRows = updateResult?.affectedRows || 0;

    if (affectedRows === 0) {
      // Execute a SELECT to confirm the ID doesn't exist, if desired, 
      // but for simplicity, we throw if 0 rows were changed.
      throw new Error(`Streamer with ID ${streamerConfigId} not found or no changes were made`);
    }

    // 4. Execute the select query to get the updated data
    const selectResult = await db.query(selectQuery, { streamer_config_id: streamerConfigId });

    // Check if the row was retrieved
    if (!selectResult || selectResult.length === 0) {
      // This should ideally not happen if affectedRows > 0, but as a safeguard
      throw new Error(`Failed to retrieve updated streamer with ID ${streamerConfigId}`);
    }

    // Return the updated streamer data
    return selectResult[0];

  } catch (err) {
    console.error("Error updating streamer configuration:", err);

    // Re-throw the error with more context
    if (err.message?.includes('not found')) {
      throw new Error(`Streamer with ID ${streamerConfigId} not found`);
    }

    // Handle database constraint violations or other errors
    // Note: The original MySQL error (ER_PARSE_ERROR) will no longer occur here.
    if (err.message?.includes('unique constraint') || err.message?.includes('duplicate')) {
      throw new Error("Duplicate entry or constraint violation");
    }

    throw new Error(`Failed to update streamer: ${err.message}`);
  }
};

export const deleteStreamerConfig = async (streamer_config_id) => {
  try {

    const result = await db.query(
      'DELETE FROM streamer_config WHERE streamer_config_id = ?',
      [streamer_config_id]
    );

    // If your DB wrapper returns array, use result[0]
    if (Array.isArray(result)) {
      return result[0]?.affectedRows > 0;
    }

    // Otherwise, handle object form
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Database error while deleting streamer config:', error);
    throw error;
  }
};

export const deleteChannelFromConfig = async (streamer_config_id, channel_index) => {
  try {

    const configs = await db.query(
      'SELECT * FROM streamer_config WHERE streamer_config_id = ?',
      [streamer_config_id]
    );

    if (!configs || configs.length === 0) return false;

    const config = configs[0];

    // Safely parse JSON columns
    const channel_name = config.channel_name
      ? typeof config.channel_name === 'string'
        ? JSON.parse(config.channel_name)
        : config.channel_name
      : [];

    const multicast_ip = config.multicast_ip
      ? typeof config.multicast_ip === 'string'
        ? JSON.parse(config.multicast_ip)
        : config.multicast_ip
      : [];

    const port = config.port
      ? typeof config.port === 'string'
        ? JSON.parse(config.port)
        : config.port
      : [];

    const maxChannels = Math.max(channel_name.length, multicast_ip.length, port.length);
    if (channel_index < 0 || channel_index >= maxChannels) return false;

    if (channel_index < channel_name.length) channel_name.splice(channel_index, 1);
    if (channel_index < multicast_ip.length) multicast_ip.splice(channel_index, 1);
    if (channel_index < port.length) port.splice(channel_index, 1);

    const isEmpty = channel_name.length === 0 && multicast_ip.length === 0 && port.length === 0;

    if (isEmpty) {
      const result = await db.query(
        'DELETE FROM streamer_config WHERE streamer_config_id = ?',
        [streamer_config_id]
      );
      return result.affectedRows > 0;
    } else {
      const result = await db.query(
        `UPDATE streamer_config 
         SET channel_name = ?, multicast_ip = ?, port = ?, updated_at = CURRENT_TIMESTAMP
         WHERE streamer_config_id = ?`,
        [
          JSON.stringify(channel_name),
          JSON.stringify(multicast_ip),
          JSON.stringify(port),
          streamer_config_id
        ]
      );
      return result.affectedRows > 0;
    }
  } catch (error) {
    console.error('Database error while deleting channel from config:', error);
    throw error;
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
  deleteResortIncident,
  getStreamerResortNames,
  addStreamerConfig,
  getAllStreamers,
  updateStreamer,
  deleteStreamerConfig,
  deleteChannelFromConfig
};





