const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const { initEventListeners } = require('./events');
const proposalsRouter = require('./routes/proposals');
const authRouter = require('./routes/auth');

const app = express();

const buildCorsOptions = () => {
  const rawOrigins = process.env.CLIENT_ORIGIN;
  if (!rawOrigins) {
    return {
      origin: 'http://localhost:5173',
      credentials: true
    };
  }

  if (rawOrigins === '*') {
    return {
      origin: '*'
    };
  }

  const origins = rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return {
    origin: origins.length === 1 ? origins[0] : origins,
    credentials: true
  };
};

app.use(cors(buildCorsOptions()));
app.use(express.json());

app.use('/auth', authRouter);
app.use('/proposals', proposalsRouter);

initEventListeners();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`DAO backend server running on port ${PORT}`);
});
