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
router.post('/addStreamerConfig', statisticsController.addStreamerConfig);
router.get('/getAllStreamerConfig', statisticsController.getAllStreamers);
router.put('/updateStreamerConfig/:id', statisticsController.updateStreamer);
router.delete('/deleteStreamerConfig/:streamer_config_id', statisticsController.deleteStreamerConfig);

//------------------------ Island Infromations ---------------------------
router.post(
    '/addIslandInformation',
    statisticsController.addIslandInformation
);

router.put(
    '/updateIslandInformation',
    statisticsController.updateIslandInformation
);

router.get('/getIslandInformations', statisticsController.getIslandInformations);

router.delete('/deleteIslandInformation/:island_id', statisticsController.deleteIslandInformation);

// -------------------- Business Register Routes --------------------
router.get('/getAllBusinessRegisters', statisticsController.getBusinessRegisters);

router.post(
    '/addBusinessRegister/add',
    upload.fields([
        { name: 'island_attach', maxCount: 1 },
        { name: 'survey_form', maxCount: 1 },
        { name: 'network_diagram', maxCount: 1 },
        { name: 'dish_antena_image', maxCount: 1 }
    ]),
    statisticsController.addBusinessRegister
);

router.put(
    '/updateBusinessRegister/update/:id',
    upload.fields([
        { name: 'island_attach', maxCount: 1 },
        { name: 'survey_form', maxCount: 1 },
        { name: 'network_diagram', maxCount: 1 },
        { name: 'dish_antena_image', maxCount: 1 }
    ]),
    statisticsController.updateBusinessRegister
);

router.delete('/deleteBusinessRegister/:id', statisticsController.deleteBusinessRegister);



// -------------------- Export Router --------------------
export default router;
