const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const session = require('express-session');

dotenv.config();

const passport = require('./config/passport');
const authRoutes = require('./routes/authRoutes');
const { requireAuth } = require('./middleware/authMiddleware'); 
const { requireRole } = require('./middleware/roleMiddleware');

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  app.set('trust proxy', 1);
}

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
  cookie: {
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax'
  }
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

app.get('/api/protected', requireAuth, (req, res) => { 
  res.json({ 
    message: 'You are authenticated', 
    user: req.user 
  }); 
}); 

app.get('/api/admin-only', requireAuth, requireRole('admin'), (req, res) => { 
  res.json({ message: 'Admin access granted' }); 
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const db = require('./config/db');

db.query('SELECT 1')
  .then(() => console.log('DB connected'))
  .catch(err => console.error('DB connection failed:', err));