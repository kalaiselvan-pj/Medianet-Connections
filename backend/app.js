// app.js
import express from 'express';
import cors from 'cors';
import statisticsRoutes from './routes/statisticsRoutes.js';
import db from './config/db.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ✅ Connect to database
db.connectDB();

// ✅ Routes
app.use('/statistics', statisticsRoutes);

// Default route
app.get('/', (req, res) => {
  res.send('Hello World! 🚀');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

export default app;
