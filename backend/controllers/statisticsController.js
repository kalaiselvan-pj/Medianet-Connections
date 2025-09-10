import statisticsService from "../services/statisticsService.js";

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
export default {
    login
}