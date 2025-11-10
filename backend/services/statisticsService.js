

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
const updateUser = async (data) => {
  try {
    const result = await db.query(
      `UPDATE login
       SET permission = ?, updated_at = NOW() WHERE user_id = ?`,
      [JSON.stringify(data.permissions), data.user_id]
    );
    return result;

  } catch (err) {
    console.error("Error updating user:", err);
    throw err;
  }
};

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
  try {
    const resort_id = uuidv4();

    await db.query(
      `INSERT INTO resort_list 
       (resort_id, resort_name, category, island, it_person_name,
        iptv_vendor, distribution_model, tvro_type, tvro_dish,dish_type,dish_brand,streamer_types,
        transmodelator_ip,middleware_ip,username,password, 
        staff_area_tv, guest_area_tv, horizontal_signal, vertical_signal, 
        horizontal_link_margin, vertical_link_margin, signal_level_timestamp, 
        contact_details, actions, survey_form, service_acceptance_form, 
        dish_antena_image,  created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?, ?, ?,?,?,?,?,?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        resort_id,
        data.resort_name || null,
        data.category || null,
        data.island || null,
        data.it_person_name || null,
        data.iptv_vendor || null,
        data.distribution_model || null,
        data.tvro_type || null,
        data.tvro_dish || null,
        data.dish_type || null,
        data.dish_brand || null,
        data.streamer_types || null,
        data.transmodelator_ip || null,
        data.middleware_ip || null,
        data.username || null,
        data.password || null,
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

    return {
      success: true,
      resort_id,
      message: "Resort added successfully"
    };

  } catch (error) {
    console.error('Error adding resort:', error);

    // Return structured error response
    return {
      success: false,
      error: error.message,
      message: "Failed to add resort"
    };

    // OR throw the error to be handled by the caller:
    // throw new Error(`Failed to add resort: ${error.message}`);
  }
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
      iptv_vendor, distribution_model, tvro_type, tvro_dish,dish_type,dish_brand,streamer_types,
      transmodelator_ip,middleware_ip,username,password, 
      staff_area_tv, guest_area_tv, horizontal_signal, vertical_signal, 
      horizontal_link_margin, vertical_link_margin, signal_level_timestamp, 
      contact_details, actions, survey_form, service_acceptance_form, 
      dish_antena_image, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?,  ?, ?, ?, ?, ?,?, ?, ?, ?, ?, ?,?,?,?,?,?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      newResortId,
      data.resort_name || null,
      data.category || null,
      data.island || null,

      data.iptv_vendor || null,
      data.distribution_model || null,
      data.tvro_type || null,
      data.tvro_dish || null,
      data.dish_type || null,
      data.dish_brand || null,
      data.streamer_types || null,
      data.transmodelator_ip || null,
      data.middleware_ip || null,
      data.username || null,
      data.password || null,
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

  // 2. Update streamer configs table to link to new resort
  await db.query(
    `UPDATE streamer_config
   SET resort_id = ?
   WHERE resort_id = ?`,
    [newResortId, resort_id]
  );

  return { newResortId, message: "Resort updated successfully" };
};

export const getResorts = async () => {
  try {
    const rows = await db.query(
      `SELECT * FROM resort_list
       WHERE actions IS NULL OR actions = ''
       ORDER BY resort_name ASC`
    );

    return rows.map(row => ({
      ...row,
      signal_level_timestamp: row.signal_level_timestamp ? new Date(row.signal_level_timestamp).toISOString() : null,
      contact_details: row.contact_details
        ? JSON.parse(row.contact_details)
        : []
    }));
  } catch (error) {
    console.error('Database error while fetching resorts:', error);
    throw error;
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

export const addStreamerConfig = async (data) => {
  if (!data) throw new Error("Request body is missing");

  const streamer_config_id = uuidv4();

  // Ensure exactly 3 channels for each array
  const ensureThreeChannels = (array) => {
    const result = array || [];
    // Ensure we have exactly 3 items
    while (result.length < 3) {
      result.push({ key: '' });
    }
    return result.slice(0, 3); // Take only first 3 if more are provided
  };

  // Apply 3-channel structure to the incoming data
  const multicast_ip = JSON.stringify(ensureThreeChannels(data.multicast_ip));
  const port = JSON.stringify(ensureThreeChannels(data.port));
  const channel_name = JSON.stringify(ensureThreeChannels(data.channel_name));
  const frequency = JSON.stringify(ensureThreeChannels(data.frequency));

  await db.query(
    `INSERT INTO streamer_config 
     (streamer_config_id, resort_id, signal_level, card, stb_no, vc_no, strm, 
      mngmnt_ip, trfc_ip, multicast_ip, port, channel_name, frequency, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      streamer_config_id,
      data.resort_id || null,
      data.signal_level || null,
      data.card || null,
      data.stb_no || null,
      data.vc_no || null,
      data.strm || null,
      data.mngmnt_ip || null,
      data.trfc_ip || null,
      multicast_ip,
      port,
      channel_name,
      frequency
    ]
  );

  return { message: "Streamer configuration added successfully", streamer_config_id };
};

export const getAllStreamers = async (resortId = null) => {
  try {
    if (!resortId) {
      return { vertical: [], horizontal: [], tsStreamer: [] };
    }

    const query = `
      SELECT * 
      FROM streamer_config 
      WHERE resort_id = ? 
      ORDER BY created_at ASC
    `;
    const rows = await db.query(query, [resortId]);

    if (!rows || rows.length === 0) {
      return { vertical: [], horizontal: [], tsStreamer: [] };
    }

    const vertical = [];
    const horizontal = [];
    const tsStreamer = [];

    const safeParseJSON = (value) => {
      if (!value) return [];
      try {
        if (Array.isArray(value)) return value;
        if (typeof value === "string") {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) ? parsed : [];
        }
        return [];
      } catch (error) {
        console.error('JSON parse error:', error, 'Value:', value);
        return [];
      }
    };

    const ensureThreeChannels = (arr) => {
      const normalizedArray = [];
      if (Array.isArray(arr)) {
        for (let i = 0; i < Math.min(arr.length, 3); i++) {
          const item = arr[i];
          if (item && typeof item === 'object' && 'key' in item) {
            normalizedArray.push({ key: item.key || '' });
          } else {
            normalizedArray.push({ key: item?.toString() || '' });
          }
        }
      }
      while (normalizedArray.length < 3) {
        normalizedArray.push({ key: '' });
      }
      return normalizedArray;
    };

    rows.forEach(row => {
      const channelName = safeParseJSON(row.channel_name);
      const multicastIp = safeParseJSON(row.multicast_ip);
      const port = safeParseJSON(row.port);
      const frequency = safeParseJSON(row.frequency);

      const baseConfig = {
        streamer_config_id: row.streamer_config_id,
        resort_id: row.resort_id,
        signal_level: row.signal_level,
        channel_name: ensureThreeChannels(channelName),
        multicast_ip: ensureThreeChannels(multicastIp),
        port: ensureThreeChannels(port),
        frequency: ensureThreeChannels(frequency),
        stb_no: row.stb_no,
        vc_no: row.vc_no,
        trfc_ip: row.trfc_ip,
        mngmnt_ip: row.mngmnt_ip,
        strm: row.strm,
        card: row.card,
        created_at: row.created_at,
        updated_at: row.updated_at
      };

      const level = (row.signal_level || "").toLowerCase();

      if (level === "vertical") {
        vertical.push(baseConfig);
      } else if (level === "horizontal") {
        horizontal.push(baseConfig);
      } else if (level === "ts streamer" || level === "ts_streamer") {
        tsStreamer.push(baseConfig);
      }
    });


    return { vertical, horizontal, tsStreamer };
  } catch (err) {
    console.error("Error fetching streamer configuration:", err);
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
      .map(key => `\`${key}\` = ?`)
      .join(', ');

    // Add updated_at timestamp
    const finalSetClause = `${setClause}, updated_at = CURRENT_TIMESTAMP`;

    // Construct the UPDATE query
    const updateQuery = `
      UPDATE streamer_config 
      SET ${finalSetClause}
      WHERE streamer_config_id = ?
    `;

    // Prepare parameters for the query (using ? placeholders)
    const params = [
      ...Object.values(updateData),
      streamerConfigId
    ];

    // Execute the update query
    const updateResult = await db.query(updateQuery, params);

    // Check if any row was updated
    const affectedRows = updateResult?.affectedRows || 0;

    if (affectedRows === 0) {
      throw new Error(`Streamer with ID ${streamerConfigId} not found or no changes were made`);
    }

    // Construct the SELECT query to fetch the updated row
    const selectQuery = `
      SELECT * FROM streamer_config 
      WHERE streamer_config_id = ?
    `;

    // Execute the select query to get the updated data
    const selectResult = await db.query(selectQuery, [streamerConfigId]);

    // Check if the row was retrieved
    if (!selectResult || selectResult.length === 0) {
      throw new Error(`Failed to retrieve updated streamer with ID ${streamerConfigId}`);
    }

    const updatedStreamer = selectResult[0];

    // Parse JSON fields back to objects if they exist
    const jsonFields = ['channel_name', 'frequency', 'multicast_ip', 'port'];
    jsonFields.forEach(field => {
      if (updatedStreamer[field] && typeof updatedStreamer[field] === 'string') {
        try {
          updatedStreamer[field] = JSON.parse(updatedStreamer[field]);
        } catch (err) {
          console.warn(`Failed to parse ${field} as JSON:`, updatedStreamer[field]);
          // Keep as string if parsing fails
        }
      }
    });

    // Return the updated streamer data
    return updatedStreamer;

  } catch (err) {
    console.error("Error updating streamer configuration:", err);

    // Re-throw the error with more context
    if (err.message?.includes('not found')) {
      throw new Error(`Streamer with ID ${streamerConfigId} not found`);
    }

    // Handle database constraint violations or other errors
    if (err.message?.includes('unique constraint') || err.message?.includes('duplicate')) {
      throw new Error("Duplicate entry or constraint violation");
    }

    // Handle MySQL errors
    if (err.code) {
      switch (err.code) {
        case 'ER_DUP_ENTRY':
          throw new Error("Duplicate entry exists");
        case 'ER_NO_REFERENCED_ROW':
        case 'ER_NO_REFERENCED_ROW_2':
          throw new Error("Referenced resort_id not found");
        default:
          throw new Error(`Database error: ${err.message}`);
      }
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

    // Safely parse JSON columns - ADD FREQUENCY
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

    // ADD: Parse frequency field
    const frequency = config.frequency
      ? typeof config.frequency === 'string'
        ? JSON.parse(config.frequency)
        : config.frequency
      : [];

    const maxChannels = Math.max(
      channel_name.length,
      multicast_ip.length,
      port.length,
      frequency.length // ADD frequency to max calculation
    );

    if (channel_index < 0 || channel_index >= maxChannels) return false;

    // Remove the channel from all arrays including frequency
    if (channel_index < channel_name.length) channel_name.splice(channel_index, 1);
    if (channel_index < multicast_ip.length) multicast_ip.splice(channel_index, 1);
    if (channel_index < port.length) port.splice(channel_index, 1);
    if (channel_index < frequency.length) frequency.splice(channel_index, 1); // ADD: Remove frequency

    // Check if configuration is empty (consider frequency as well)
    const isEmpty = channel_name.length === 0 &&
      multicast_ip.length === 0 &&
      port.length === 0 &&
      frequency.length === 0; // ADD frequency to empty check

    if (isEmpty) {
      const result = await db.query(
        'DELETE FROM streamer_config WHERE streamer_config_id = ?',
        [streamer_config_id]
      );
      return result.affectedRows > 0;
    } else {
      // UPDATE: Include frequency in the UPDATE query
      const result = await db.query(
        `UPDATE streamer_config 
         SET channel_name = ?, multicast_ip = ?, port = ?, frequency = ?, updated_at = CURRENT_TIMESTAMP
         WHERE streamer_config_id = ?`,
        [
          JSON.stringify(channel_name),
          JSON.stringify(multicast_ip),
          JSON.stringify(port),
          JSON.stringify(frequency), // ADD: Include frequency in update
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


export const getIslandInformations = async () => {
  try {
    const rows = await db.query(`
      SELECT 
        ii.island_id,
        ii.island_name,
        ii.atoll,
        ii.total_dtv_markets,
        ii.active_dtv_markets,
        ii.active_dtv_update_time,
        ii.total_corporate_markets,
        ii.active_corporate_markets,
        ii.active_corporate_update_time,
        ii.created_at,
        ii.updated_at,
        GROUP_CONCAT(bp.register_name) as register_names
      FROM island_informations ii
      LEFT JOIN business_partner bp ON ii.island_id = bp.island_id
      GROUP BY ii.island_id
      ORDER BY ii.created_at DESC
    `);

    // Process the results to convert register_names string to array
    if (rows && Array.isArray(rows)) {
      return rows.map(row => ({
        ...row,
        register_names: row.register_names ? row.register_names.split(',') : []
      }));
    }

    return rows || [];

  } catch (error) {
    throw new Error(`Failed to fetch island informations: ${error.message}`);
  }
};

export const addIslandInformation = async (data) => {
  try {
    const island_id = uuidv4();

    // Convert string dates to MySQL timestamp format
    const convertToMySQLTimestamp = (dateString) => {

      if (!dateString || dateString.trim() === '') return null;

      try {
        // Handle format: "11/05/2025, 03:48:24 PM"
        const [datePart, timePart] = dateString.split(', ');
        const [month, day, year] = datePart.split('/');
        const [time, period] = timePart.split(' ');
        let [hours, minutes, seconds] = time.split(':');

        // Convert to 24-hour format
        if (period === 'PM' && hours !== '12') {
          hours = parseInt(hours) + 12;
        } else if (period === 'AM' && hours === '12') {
          hours = '00';
        }

        // Format as MySQL timestamp: YYYY-MM-DD HH:MM:SS
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} ${hours}:${minutes}:${seconds}`;
      } catch (error) {
        console.error('Error converting date:', error);
        return null;
      }
    };

    // Only convert if the frontend provided non-empty values
    const dtvUpdateTime = convertToMySQLTimestamp(data.dtvActiveUpdateTime);
    const corporateUpdateTime = convertToMySQLTimestamp(data.corporateActiveUpdateTime);

    await db.query(
      `INSERT INTO island_informations 
       (island_id, island_name, atoll, total_dtv_markets, active_dtv_markets,
        active_dtv_update_time, total_corporate_markets, active_corporate_markets,
        active_corporate_update_time, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        island_id,
        data.islandName || null,
        data.atoll || null,
        data.dtvNoOfMarkets || null,
        data.dtvActive || null,
        dtvUpdateTime, // This will be null if frontend didn't provide value
        data.corporateNoOfMarkets || null,
        data.corporateActive || null,
        corporateUpdateTime // This will be null if frontend didn't provide value
      ]
    );

    return {
      success: true,
      island_id,
      message: "Island information added successfully"
    };

  } catch (error) {
    console.error('Error adding island information:', error);
    return {
      success: false,
      error: error.message,
      message: "Failed to add island information"
    };
  }
};

export const updateIslandInformation = async (data) => {
  try {
    // Get current time in Maldives (UTC+5)
    const now = new Date();
    const maldivesTime = new Date(now.getTime() + (5 * 60 * 60 * 1000)); // Add 5 hours for UTC+5
    const maldivesTimestamp = maldivesTime.toISOString().slice(0, 19).replace('T', ' ');

    // Convert string dates to MySQL timestamp format
    const convertToMySQLTimestamp = (dateString) => {
      if (!dateString) return maldivesTimestamp;

      try {
        // Handle format: "11/05/2025, 03:48:24 PM"
        const [datePart, timePart] = dateString.split(', ');
        const [month, day, year] = datePart.split('/');
        const [time, period] = timePart.split(' ');
        let [hours, minutes, seconds] = time.split(':');

        // Convert to 24-hour format
        if (period === 'PM' && hours !== '12') {
          hours = parseInt(hours) + 12;
        } else if (period === 'AM' && hours === '12') {
          hours = '00';
        }

        // Format as MySQL timestamp: YYYY-MM-DD HH:MM:SS
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} ${hours}:${minutes}:${seconds}`;
      } catch (error) {
        console.error('Error converting date:', error);
        return maldivesTimestamp;
      }
    };

    await db.query(
      `UPDATE island_informations 
       SET island_name = ?, atoll = ?, total_dtv_markets = ?, active_dtv_markets = ?,
           active_dtv_update_time = ?, total_corporate_markets = ?, active_corporate_markets = ?,
           active_corporate_update_time = ?, updated_at = NOW()
       WHERE island_id = ?`,
      [
        data.islandName || null,
        data.atoll || null,
        data.dtvNoOfMarkets || null,
        data.dtvActive || null,
        convertToMySQLTimestamp(data.dtvActiveUpdateTime),
        data.corporateNoOfMarkets || null,
        data.corporateActive || null,
        convertToMySQLTimestamp(data.corporateActiveUpdateTime),
        data.island_id
      ]
    );

    return {
      success: true,
      message: "Island information updated successfully"
    };

  } catch (error) {
    console.error('Error updating island information:', error);
    return {
      success: false,
      error: error.message,
      message: "Failed to update island information"
    };
  }
};

export const deleteIslandInformation = async (island_id) => {
  try {
    // Delete the island directly without checking existence first
    const result = await db.query(
      'DELETE FROM island_informations WHERE island_id = ?',
      [island_id]
    );
    let affectedRows;

    // Handle different response formats from database
    if (Array.isArray(result)) {
      // If result is an array, check the first element
      affectedRows = result[0]?.affectedRows || 0;
    } else {
      // If result is an object, check directly
      affectedRows = result.affectedRows || 0;
    }

    if (affectedRows > 0) {
      return {
        success: true,
        island_id: island_id,
        message: "Island information deleted successfully"
      };
    } else {
      throw new Error('Island not found or already deleted');
    }

  } catch (error) {
    console.error('Database error while deleting island information:', error);
    throw error;
  }
};

//Add BusinessRegister API
export const addBusinessRegister = async (data) => {
  try {
    const business_id = uuidv4();
    if (!data.register_name) {
      return { success: false, message: "register_name is required" };
    }

    if (!data.island_id) {
      return { success: false, message: "island_id is required" };
    }
    const [islandRows] = await db.query(
      "SELECT island_id FROM island_informations WHERE island_id = ?",
      [data.island_id]
    );

    if (islandRows.length === 0) {
      return {
        success: false,
        message: "Invalid island_id — not found in island_informations table",
      };
    }
    await db.query(
      `INSERT INTO business_partner (
        business_id, island_id, register_name, register_number, service_provider,
        olt_owner, network_type, fiber_coax_convertor, island_attach,dish_antena_size,
        tvro_type, dish_type, dish_brand,
        horizontal_signal, vertical_signal,
        horizontal_link_margin, vertical_link_margin,
        survey_form, network_diagram, dish_antena_image,
        contact_information, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        business_id,
        data.island_id || null,
        data.register_name || null,
        data.register_number || null,
        data.service_provider || null,
        data.olt_owner || null,
        data.network_type || null,
        data.fiber_coax_convertor || null,

        //  Store uploaded file buffers like in resort code
        data.island_attach || null, // Buffer (e.g., file)
        data.dish_antena_size || null,
        data.tvro_type || null,
        data.dish_type || null,
        data.dish_brand || null,

        data.horizontal_signal || null,
        data.vertical_signal || null,
        data.horizontal_link_margin || null,
        data.vertical_link_margin || null,

        // File upload fields — same pattern as in addResort
        data.survey_form || null,         // Blob
        data.network_diagram || null,     // Blob
        data.dish_antena_image || null,  // Blob
        data.contact_information
          ? JSON.stringify(data.contact_information)
          : JSON.stringify([]),
      ]
    );

    return {
      success: true,
      business_id,
      message: "Business partner added successfully",
    };
  } catch (error) {
    console.error(" Error adding business partner:", error);
    return {
      success: false,
      message: "Failed to add business partner",
      error: error.message,
    };
  }
};

//GET BusinessRegisters API 
export const getBusinessRegisters = async () => {
  try {
    const rows = await db.query(
      `SELECT * FROM business_partner
       ORDER BY register_name ASC`
    );


    return rows;
  } catch (error) {
    console.error('Database error while fetching business registers:', error);
    throw error;
  }
};

//UPDATE BusinessRegister API
export const updateBusinessRegister = async (business_id, data = {}, files = {}) => {
  try {
    if (!business_id) {
      return { success: false, message: "business_id is required" };
    }
    //  Fetch existing record safely
    const existingResult = await db.query(
      "SELECT * FROM business_partner WHERE business_id = ?",
      [business_id]
    );
    const existingRows = Array.isArray(existingResult) ? existingResult[0] : existingResult;
    if (!existingRows || existingRows.length === 0) {
      return { success: false, message: "Business partner not found" };
    }

    const existing = existingRows[0] || {};

    //  Validate island_id if provided
    if (data.island_id) {
      const islandResult = await db.query(
        "SELECT island_id FROM island_informations WHERE island_id = ?",
        [data.island_id]
      );
      const islandRows = Array.isArray(islandResult) ? islandResult[0] : islandResult;
      if (!islandRows || islandRows.length === 0) {
        return {
          success: false,
          message: "Invalid island_id — not found in island_informations table",
        };
      }
    }

    //  Safe file handler
    const handleFileUpdate = (key, removeFlag) => {
      try {
        if (data?.[removeFlag] === true || data?.[removeFlag] === "true") return null;
        if (files?.[key]?.[0]?.buffer) return files[key][0].buffer;
        if (data?.[key]) return data[key];
        return existing?.[key] ?? null;
      } catch {
        return existing?.[key] ?? null;
      }
    };

    //  Prepare safe field values
    const safe = (field) =>
      data[field] !== undefined && data[field] !== null && data[field] !== ""
        ? data[field]
        : existing?.[field] ?? null;

    //  Handle files
    const island_attach_value = handleFileUpdate("island_attach", "removed_island_attach");
    const survey_form_value = handleFileUpdate("survey_form", "removed_survey_form");
    const network_diagram_value = handleFileUpdate("network_diagram", "removed_network_diagram");
    const dish_antena_image_value = handleFileUpdate("dish_antena_image", "removed_dish_antena_image");

    //  Parse contact info safely
    let contactInfo = [];
    try {
      if (typeof data.contact_information === "string") {
        contactInfo = JSON.parse(data.contact_information);
      } else if (Array.isArray(data.contact_information)) {
        contactInfo = data.contact_information;
      } else if (existing.contact_information) {
        contactInfo = JSON.parse(existing.contact_information);
      }
    } catch {
      contactInfo = [];
    }

    //  SQL update query
    const query = `
      UPDATE business_partner SET
        island_id = ?, register_name = ?, register_number = ?, service_provider = ?,
        olt_owner = ?, network_type = ?, fiber_coax_convertor = ?, island_attach = ?,
        tvro_type = ?,  dish_type = ?, dish_antena_size = ?, dish_brand = ?,
        horizontal_signal = ?, vertical_signal = ?, horizontal_link_margin = ?, vertical_link_margin = ?,
        survey_form = ?, network_diagram = ?, dish_antena_image = ?, contact_information = ?,
        updated_at = NOW()
      WHERE business_id = ?
    `;

    const params = [
      safe("island_id"),
      safe("register_name"),
      safe("register_number"),
      safe("service_provider"),
      safe("olt_owner"),
      safe("network_type"),
      safe("fiber_coax_convertor"),
      island_attach_value,
      safe("tvro_type"),
      safe("dish_type"),
      safe("dish_antena_size"),
      safe("dish_brand"),
      safe("horizontal_signal"),
      safe("vertical_signal"),
      safe("horizontal_link_margin"),
      safe("vertical_link_margin"),
      survey_form_value,
      network_diagram_value,
      dish_antena_image_value,
      JSON.stringify(contactInfo),
      business_id,
    ];

    //  Execute update safely
    const updateResultRaw = await db.query(query, params);
    const updateResult = Array.isArray(updateResultRaw) ? updateResultRaw[0] : updateResultRaw;

    if (updateResult.affectedRows > 0) {
      return {
        success: true,
        message: "Business partner updated successfully",
        business_id,
      };
    }

    return { success: false, message: "No changes detected or update failed" };
  } catch (error) {
    console.error(" Error updating business partner:", error);
    return {
      success: false,
      message: "Error updating business partner",
      error: error.message,
    };
  }
};

//DELETE BusinessRegister API
export const deleteBusinessRegister = async (business_id) => {
  try {
    const [result] = await db.query(
      `DELETE FROM business_partner WHERE business_id = ?`,
      [business_id]
    );

    if (result.affectedRows === 0) {
      throw new Error("Business partner not found");
    }
    return {
      success: true,
      message: "Business partner deleted successfully",
    };
  } catch (err) {
    console.error(" Error deleting business partner:", err);
    return {
      success: false,
      message: "Failed to delete business partner",
      error: err.message,
    };
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
  addStreamerConfig,
  getAllStreamers,
  updateStreamer,
  deleteStreamerConfig,
  deleteChannelFromConfig,
  addIslandInformation,
  getIslandInformations,
  updateIslandInformation,
  deleteIslandInformation,
  addBusinessRegister,
  getBusinessRegisters,
  updateBusinessRegister,
  deleteBusinessRegister
};