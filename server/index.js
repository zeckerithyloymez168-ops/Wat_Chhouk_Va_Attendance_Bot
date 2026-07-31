// server/index.js
// Express API Server & Bot Listener for Wat Chhouk Va Monk Attendance System

import { app } from './app.js';
import './bot.js'; // Starts Telegraf bot polling

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`===========================================================`);
  console.log(`WAT CHHOUK VA API SERVER STARTED ON PORT ${PORT}`);
  console.log(`===========================================================`);
});
