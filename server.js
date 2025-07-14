const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const app = express();
app.use(express.json());        // for parsing application/json

app.use('/api/auth', require('./routes/auth.routes'));

const PORT = process.env.PORT || 4000;

connectDB().then(() => {
  app.listen(PORT, () => {
    connectDB();
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
