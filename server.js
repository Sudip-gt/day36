const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const morgan = require('morgan');

dotenv.config();

const app = express();
app.use(express.json());

app.use(morgan('dev'));

app.get('/', (req, res) => {
  res.send('Hello World!'); 
});

app.use('/api/auth', require('./routes/auth.routes'));

const PORT = process.env.PORT || 4000;

connectDB().then(() => {
  app.listen(PORT, () => {
    connectDB();
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
