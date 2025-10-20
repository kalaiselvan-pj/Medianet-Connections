import express from 'express';
const router = express.Router();
import statisticsController from '../controllers/statisticsController.js';

router.post('/login', statisticsController.login);

router.post('/login/forgot-password', statisticsController.forgotPassword);

router.post('/login/reset-password', statisticsController.resetPassword);

router.post("/addUser", statisticsController.addUser);

router.get("/getAllUsersData", statisticsController.getAllUsers);

router.put("/updateUser/:login_id", statisticsController.updateUser);

router.delete("/deleteUser/:id", statisticsController.deleteUser);

router.get('/dashboard', statisticsController.dashboard);

router.get("/getAllResorts", statisticsController.getResorts);

router.post("/addResort", statisticsController.addResort);

router.put("/updateResort/:id", statisticsController.updateResort);

router.delete("/deleteResort/:id", statisticsController.deleteResort);

router.post("/resortIncidentReports", statisticsController.addResortIncident);

router.get("/getAllIncidentReports", statisticsController.getAllIncidentReports);

router.put("/updateIncidentReport/:id", statisticsController.updateIncidentReport);

router.delete("/deleteResortIncident/:incident_id", statisticsController.deleteResortIncident);

router.get("/streamers/all", statisticsController.getStreamers);

router.put("/updateStreamerConfig/:id", statisticsController.updateStreamer);



export default router; // this must exist