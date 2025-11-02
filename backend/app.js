// // app.js
// import express from 'express';
// import cors from 'cors';
// import statisticsRoutes from './routes/statisticsRoutes.js';
// import db from './config/db.js';

// const app = express();

// // Middleware
// app.use(cors());

// // Keep this for JSON-only requests
// app.use(express.json());
// // For URL-encoded form data (optional)
// app.use(express.urlencoded({ extended: true }));

// // ✅ Connect to database
// db.connectDB();

// // ✅ Routes
// app.use('/statistics', statisticsRoutes);

// // Default route
// app.get('/', (req, res) => {
//   res.send('Hello World! 🚀');
// });

// // Start server
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`✅ Server running on http://localhost:${PORT}`);
// });

// export default app;


// app.js
import express from 'express';
import cors from 'cors';
import statisticsRoutes from './routes/statisticsRoutes.js';
import db from './config/db.js';

const app = express();

// Middleware - IMPORTANT: Increase payload limits
app.use(cors({
  origin: 'https://mdnislandrpt.medianet.mv',
  credentials: true
}));

// Increase payload limits for file uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({
  extended: true,
  limit: '50mb',
  parameterLimit: 1000000
}));

// ✅ Connect to database
db.connectDB();

// ✅ Routes
app.use('/statistics', statisticsRoutes);

// Default route
app.get('/', (req, res) => {
  res.send('Hello World! 🚀');
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large'
      });
    }
  }
  next(error);
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

export default app;