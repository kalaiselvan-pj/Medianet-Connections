import statisticsService from "../services/statisticsService.js";

//Login API
const login = async (req, res) => {
  try {
    const result = await statisticsService.login(req.body);

    if (result.success) {
      res.status(200).json({
        success: true,
        token: "dummy-jwt-token",
        user: result.user
      });
    } else {
      res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
}

//Forgot Password API
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await statisticsService.forgotPassword(email);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

//Reset Password API
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: "Token and password are required" });
    }

    const result = await statisticsService.resetPassword(token, password);

    return res.status(200).json(result); // { message: "Password changed successfully" }
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

//Add user API
const addUser = async (req, res) => {
  try {
    const newUser = await statisticsService.addUser(req.body);
    res.json(newUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//Get All Users API
const getAllUsers = async (req, res) => {
  try {
    const users = await statisticsService.getAllUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

//Update User RBAC API
const updateUser = async (req, res) => {
  try {
    const { login_id } = req.params;

    await statisticsService.updateUser(login_id, req.body);
    res.json({ message: "user updated successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update user" });
  }
};

//Delete user RBAC API
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await statisticsService.deleteUser(id);
    res.json({ message: "user deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete resort" });
  }
};

//  Dashboard API
export const dashboard = async (req, res) => {
  try {
    const data = await statisticsService.getDashboardStats();
    res.json(data);
  } catch (err) {
    console.error("Error fetching dashboard data:", err);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
};

// Add Resort API
export const addResort = async (req, res) => {
  try {
    const data = {
      ...req.body,
      survey_form: req.files?.survey_form?.[0]?.buffer || null,
      service_acceptance_form: req.files?.service_acceptance_form?.[0]?.buffer || null,
      dish_antena_image: req.files?.dish_antena_image?.[0]?.buffer || null,
      signal_image: req.files?.signal_image?.[0]?.buffer || null
    };

    const result = await statisticsService.addResort(data);
    res.json(result);
  } catch (err) {
    console.error("Error adding resort:", err);
    res.status(500).json({ error: err.message });
  }
};

//update resort API
export const updateResort = async (req, res) => {
  try {
    const { id } = req.params;

    const data = {
      ...req.body,
      survey_form: req.files?.survey_form?.[0]?.buffer || null,
      service_acceptance_form: req.files?.service_acceptance_form?.[0]?.buffer || null,
      dish_antena_image: req.files?.dish_antena_image?.[0]?.buffer || null,
      signal_image: req.files?.signal_image?.[0]?.buffer || null
    };

    await statisticsService.updateResort(id, data);
    res.json({ message: "Resort updated successfully" });
  } catch (err) {
    console.error("Error updating resort:", err);
    res.status(500).json({ error: "Failed to update resort" });
  }
};

//get all resort details API
export const getResorts = async (req, res) => {
  try {
    const resorts = await statisticsService.getResorts();
    res.json(resorts);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch resorts" });
  }
};

//delete resort API
export const deleteResort = async (req, res) => {
  try {
    const { id } = req.params;
    await statisticsService.deleteResort(id);
    res.json({ message: "Resort deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete resort" });
  }
};

//Add ResortIncident API
const addResortIncident = async (req, res) => {
  try {
    const data = req.body;
    const addResortIncident = await statisticsService.addResortIncident(data);
    res.json(addResortIncident);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//Get All Resorts Incidents Reports API
const getAllIncidentReports = async (req, res) => {
  try {
    const resorts = await statisticsService.getAllIncidentReports();
    res.json(resorts);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch resorts" });
  }
};

//Update Resort Incident API
const updateIncidentReport = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    await statisticsService.updateIncidentReport(id, data);
    res.json({ message: "Resort Incident updated successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update resort" });
  }
};

//Delete Resort Incident API
const deleteResortIncident = async (req, res) => {
  try {
    const { incident_id } = req.params;
    await statisticsService.deleteResortIncident(incident_id);
    res.json({ message: "Resort Incident deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete resort incident" });
  }
};


export const addStreamerConfig = async (req, res) => {
  try {
    const data = req.body;
    const newStreamer = await statisticsService.addStreamerConfig(data);
    res.json(newStreamer);
  } catch (err) {
    console.error("Error adding streamer config:", err);
    res.status(500).json({ error: err.message });
  }
};

export const deleteStreamerConfig = async (req, res) => {
  try {
    // Safely extract params and body/query
    const { streamer_config_id } = req.params;
    const channel_index = req.body?.channel_index ?? req.query?.channel_index;


    if (!streamer_config_id) {
      return res.status(400).json({ message: "Missing streamer_config_id parameter" });
    }

    // Keep UUID as string, do not parseInt
    const configId = streamer_config_id;

    if (channel_index !== undefined && channel_index !== null) {
      const channelIndex = parseInt(channel_index, 10);
      if (isNaN(channelIndex) || channelIndex < 0) {
        return res.status(400).json({
          message: "Invalid channel_index format. Must be a non-negative number.",
        });
      }

      const success = await statisticsService.deleteChannelFromConfig(configId, channelIndex);

      if (!success) {
        return res.status(404).json({
          message: "Streamer config not found or channel index invalid",
        });
      }

      return res.status(200).json({ message: "Channel deleted successfully" });
    } else {
      // Delete entire configuration
      const success = await statisticsService.deleteStreamerConfig(configId);

      if (!success) {
        return res.status(404).json({ message: "Streamer config not found" });
      }

      return res.status(200).json({ message: "Streamer config deleted successfully" });
    }
  } catch (error) {
    console.error("Error in deleteStreamerConfig:", error);
    res.status(500).json({
      message: "Error processing delete request",
      error: error.message,
    });
  }
};

export const getAllStreamers = async (req, res) => {
  try {
    // FIX: Get resort_name from req.query (query parameters in the URL)
    const { resort_id } = req.query;

    if (!resort_id) {
      // Optional: Return a 400 Bad Request if the required parameter is missing
      return res.status(400).json({ error: "Missing resort_id query parameter" });
    }

    // Destructure tsStreamer from the service response
    const { vertical, horizontal, tsStreamer } = await statisticsService.getAllStreamers(resort_id);

    // Include tsStreamer in the response
    res.json({ vertical, horizontal, tsStreamer });
  } catch (err) {
    console.error("Error in getStreamers controller:", err);
    res.status(500).json({ error: "Failed to fetch streamer data" });
  }
};

export const updateStreamer = async (req, res) => {
  try {
    const { id } = req.params; // streamer_config_id from URL parameter
    const updateData = req.body; // Update fields from request body

    // Validate that ID exists
    if (!id) {
      return res.status(400).json({ error: "Missing streamer ID parameter" });
    }

    // Validate that update data exists
    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No update data provided" });
    }

    // Define allowed fields to prevent updating restricted fields
    const allowedFields = [
      'resort_id',
      'signal_level',
      'channel_name',
      'frequency',
      'multicast_ip',
      'port',
      'stb_no',
      'vc_no',
      'trfc_ip',
      'mngmnt_ip',
      'strm',
      'card'
    ];

    // Filter update data to only include allowed fields
    const filteredUpdateData = {};
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        // Handle array fields - convert to JSON string if they are arrays/objects
        if (['channel_name', 'frequency', 'multicast_ip', 'port'].includes(key) &&
          Array.isArray(updateData[key])) {
          filteredUpdateData[key] = JSON.stringify(updateData[key]);
        } else {
          filteredUpdateData[key] = updateData[key];
        }
      }
    });

    // Call service to update the streamer
    const updatedStreamer = await statisticsService.updateStreamer(id, filteredUpdateData);

    if (!updatedStreamer) {
      return res.status(404).json({ error: "Streamer not found" });
    }

    res.json({
      message: "Streamer updated successfully",
      data: updatedStreamer
    });

  } catch (err) {
    console.error("Error in updateStreamer controller:", err);

    // Handle specific error cases
    if (err.message?.includes('not found')) {
      return res.status(404).json({ error: "Streamer not found" });
    }

    if (err.message?.includes('Duplicate entry') || err.message?.includes('constraint violation')) {
      return res.status(409).json({ error: "Duplicate entry or constraint violation" });
    }

    res.status(500).json({ error: "Failed to update streamer" });
  }
};


export default {
  login,
  forgotPassword,
  resetPassword,
  addUser,
  getAllUsers,
  updateUser,
  deleteUser,
  dashboard,
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
  deleteStreamerConfig
}