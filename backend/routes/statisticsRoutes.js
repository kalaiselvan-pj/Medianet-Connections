import express from 'express';
import statisticsController from '../controllers/statisticsController.js';
import multer from 'multer';

const router = express.Router();

// Configure multer to store files in memory
const upload = multer({ storage: multer.memoryStorage() });

// -------------------- Login Routes --------------------
router.post('/login', statisticsController.login);
router.post('/login/forgot-password', statisticsController.forgotPassword);
router.post('/login/reset-password', statisticsController.resetPassword);

// -------------------- User Management --------------------
router.post('/addUser', statisticsController.addUser);
router.get('/getAllUsersData', statisticsController.getAllUsers);
router.put('/updateUser/:login_id', statisticsController.updateUser);
router.delete('/deleteUser/:id', statisticsController.deleteUser);

// -------------------- Dashboard --------------------
router.get('/dashboard', statisticsController.dashboard);

// -------------------- Resort Routes --------------------
router.get('/getAllResorts', statisticsController.getResorts);

router.post(
    '/addResort',
    upload.fields([
        { name: 'survey_form', maxCount: 1 },
        { name: 'service_acceptance_form', maxCount: 1 },
        { name: 'dish_antena_image', maxCount: 1 },
        { name: 'signal_image', maxCount: 1 }
    ]),
    statisticsController.addResort
);

router.put(
    '/updateResort/:id',
    upload.fields([
        { name: 'survey_form', maxCount: 1 },
        { name: 'service_acceptance_form', maxCount: 1 },
        { name: 'dish_antena_image', maxCount: 1 },
        { name: 'signal_image', maxCount: 1 }
    ]),
    statisticsController.updateResort
);

router.delete('/deleteResort/:id', statisticsController.deleteResort);

// -------------------- Incident Reports --------------------
router.post('/addIncidentReports', statisticsController.addResortIncident);
router.get('/getAllIncidentReports', statisticsController.getAllIncidentReports);
router.put('/updateIncidentReport/:id', statisticsController.updateIncidentReport);
router.delete('/deleteResortIncident/:incident_id', statisticsController.deleteResortIncident);

// -------------------- Streamer Config --------------------
router.get('/getStreamerResortNames', statisticsController.getStreamerResortNames);
router.post('/addStreamerConfig', statisticsController.addStreamerConfig);
router.get('/getAllStreamerConfig', statisticsController.getAllStreamers);
router.put('/updateStreamerConfig/:id', statisticsController.updateStreamer);
router.delete('/deleteStreamerConfig/:streamer_config_id', statisticsController.deleteStreamerConfig);

// -------------------- Export Router --------------------
export default router;
