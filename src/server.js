// src/server.js
require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`KidsSpeak backend server running on port ${PORT}`);
});