const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const session = require('express-session');

dotenv.config();

const passport = require('./config/passport');
const authRoutes = require('./routes/authRoutes');

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

app.use(passport.initialize()); 
app.use(passport.session());

// Health check
app.get('/', (req, res) => {
  res.send('Palagunitaan API running');
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'Connected!' });
});

app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const db = require('./config/db');

db.query('SELECT 1')
    .then(() => console.log('DB connected'))
    .catch(err => console.error(err));