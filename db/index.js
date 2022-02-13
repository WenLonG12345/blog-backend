const mongoose = require('mongoose');

require('dotenv').config();

const uri = process.env.MONGODB_URL
mongoose.connect(uri, { useNewUrlParser: true })
  .then(() => console.log('db connected'))
  .catch((err) => console.log('db connection failed: ', err.message || err));