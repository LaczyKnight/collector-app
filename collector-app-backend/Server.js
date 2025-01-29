const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/Auth');

const app = express();
app.use(cors());
app.use(express.json()); // Ez lehetővé teszi a JSON formátumú adatok feldolgozását

// Kapcsolódás a MongoDB adatbázishoz
mongoose.connect('mongodb://localhost:27017/mydatabase', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Használjuk a hitelesítési útvonalakat
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
