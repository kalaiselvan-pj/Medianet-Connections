import express from 'express';
const router = express.Router();
import statisticsController from '../controllers/statisticsController.js';
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

router.post('/login', statisticsController.login);

router.post('/login/forgot-password', statisticsController.forgotPassword);

router.post('/login/reset-password', statisticsController.resetPassword);

router.post("/addUser", statisticsController.addUser);

router.get("/getAllUsersData", statisticsController.getAllUsers);

router.put("/updateUser/:login_id", statisticsController.updateUser);

router.delete("/deleteUser/:id", statisticsController.deleteUser);

router.get('/dashboard', statisticsController.dashboard);

router.get("/getAllResorts", statisticsController.getResorts);

router.post(
    "/addResort",
    upload.fields([
        { name: "survey_form", maxCount: 1 },
        { name: "service_acceptance_form", maxCount: 1 },
        { name: "dish_antena_image", maxCount: 1 },
        { name: "signal_image", maxCount: 1 }
    ]),
    statisticsController.addResort
);

router.put(
    "/updateResort/:id",
    upload.fields([
        { name: "survey_form", maxCount: 1 },
        { name: "service_acceptance_form", maxCount: 1 },
        { name: "dish_antena_image", maxCount: 1 },
        { name: "signal_image", maxCount: 1 }
    ]),
    statisticsController.updateResort
);

router.delete("/deleteResort/:id", statisticsController.deleteResort);

router.post("/addIncidentReports", statisticsController.addResortIncident);

router.get("/getAllIncidentReports", statisticsController.getAllIncidentReports);

router.put("/updateIncidentReport/:id", statisticsController.updateIncidentReport);

router.delete("/deleteResortIncident/:incident_id", statisticsController.deleteResortIncident);

router.get("/getStreamerResortNames", statisticsController.getStreamerResortNames);

router.post("/addStreamerConfig", statisticsController.addStreamerConfig);

router.get("/getAllStreamerConfig", statisticsController.getAllStreamers);

router.put("/updateStreamerConfig/:id", statisticsController.updateStreamer);

router.delete("/deleteStreamerConfig/:streamer_config_id", statisticsController.deleteStreamerConfig);


export default router; // this must exist