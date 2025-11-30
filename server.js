const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const proposalsRouter = require('./routes/proposals');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/proposals', proposalsRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`DAO backend server running on port ${PORT}`);
});
