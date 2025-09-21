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

//Add Resort API
const addResort = async (req, res) => {
  try {
    const { resort_name, category } = req.body;
    const newResort = await statisticsService.addResort(resort_name, category);
    res.json(newResort);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//Get All Resorts API
const getResorts = async (req, res) => {
  try {
    const resorts = await statisticsService.getResorts();
    res.json(resorts);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch resorts" });
  }
};

//Update Resort API
const updateResort= async (req, res) => {
    try {
      const { id } = req.params;
      const { resort_name, category } = req.body;
      await statisticsService.updateResort(id, resort_name, category);
      res.json({ message: "Resort updated successfully" });
    } catch (err) {
      res.status(500).json({ error: "Failed to update resort" });
    }
  };

  //Delete Resort API
  const deleteResort= async (req, res) => {
    try {
      const { id } = req.params;
      await statisticsService.deleteResort(id);
      res.json({ message: "Resort deleted successfully" });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete resort" });
    }
  };


export default {
    login,
    forgotPassword,
    resetPassword,
    dashboard,
    addResort,
    getResorts,
    updateResort,
    deleteResort
}

