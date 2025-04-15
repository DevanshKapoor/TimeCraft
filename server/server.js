const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();


app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/auth');
const timetableRoutes = require('./routes/timetable');
app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true
}));
app.use('/api/auth', authRoutes);
app.use('/api/timetable', timetableRoutes);
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
