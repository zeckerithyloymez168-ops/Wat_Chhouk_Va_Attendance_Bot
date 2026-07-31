// server/app.js
// Express API Engine for Wat Chhouk Va Monk Attendance System

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db } from './db.js';
import { notifyAdminLeaveRequest, sendBroadcastMessage, sendPrayerSessionReminder } from './bot.js';

dotenv.config();

export const app = express();

app.use(cors());
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 1. Monks Routes
app.get('/api/monks', (req, res) => {
  res.json({ success: true, monks: db.getMonks() });
});

app.get('/api/monks/by-telegram/:tgId', (req, res) => {
  const monk = db.getMonkByTelegramId(req.params.tgId);
  if (!monk) {
    return res.status(404).json({ success: false, message: 'Monk not registered' });
  }
  res.json({ success: true, monk });
});

app.get('/api/monks/:id/summary', (req, res) => {
  const summary = db.getMonkSummary(req.params.id);
  if (!summary) {
    return res.status(404).json({ success: false, message: 'Monk not found' });
  }
  res.json({ success: true, ...summary });
});

app.post('/api/monks/register', (req, res) => {
  try {
    const { telegram_id, name, phone, role } = req.body;
    if (!telegram_id || !name) {
      return res.status(400).json({ success: false, message: 'Telegram ID and Name are required' });
    }

    const result = db.registerMonk({ telegram_id, name, phone, role });
    res.json({ success: true, ...result });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
  }
});

app.post('/api/monks', (req, res) => {
  const { name, role, phone, telegram_id } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Name is required' });
  }
  const monk = db.addMonk({ name, role, phone, telegram_id });
  res.json({ success: true, monk });
});

app.patch('/api/monks/:id', (req, res) => {
  const { name, role, phone, telegram_id, status } = req.body;
  const updated = db.updateMonk(req.params.id, { name, role, phone, telegram_id, status });
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Monk not found' });
  }
  res.json({ success: true, monk: updated });
});

app.delete('/api/monks/:id', (req, res) => {
  const deleted = db.deleteMonk(req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: 'Monk not found' });
  }
  res.json({ success: true, monk: deleted });
});

// 2. Attendance Routes
app.get('/api/attendance', (req, res) => {
  const { date, session, monk_id } = req.query;
  const records = db.getAttendances({ date, session, monk_id });
  res.json({ success: true, attendances: records });
});

app.post('/api/attendance/toggle', (req, res) => {
  const { date, session, monk_id, recorded_by } = req.body;
  if (!date || !session || !monk_id) {
    return res.status(400).json({ success: false, message: 'Missing parameters' });
  }

  const updated = db.toggleAttendanceStatus(date, session, monk_id, recorded_by || 1);
  res.json({ success: true, record: updated });
});

app.post('/api/attendance/batch', (req, res) => {
  const { date, session, records, recorded_by } = req.body;
  if (!date || !session || !Array.isArray(records)) {
    return res.status(400).json({ success: false, message: 'Invalid payload' });
  }

  const updated = db.recordAttendanceBatch({ date, session, records, recorded_by });

  db.logBotEvent({
    type: 'attendance_recorded',
    message: `បានស្រង់វត្តមានប្រចាំថ្ងៃ (${date} - ពេល${session === 'morning' ? 'ព្រឹក' : 'ល្ងាច'}) សម្រាប់ព្រះសង្ឃ ${records.length} អង្គ។`
  });

  res.json({ success: true, attendances: updated });
});

app.patch('/api/attendance/:id/paid', (req, res) => {
  const record = db.markFineAsPaid(req.params.id);
  if (!record) {
    return res.status(404).json({ success: false, message: 'Attendance record not found' });
  }
  res.json({ success: true, record });
});

// 3. Leave Request Routes
app.get('/api/leave', (req, res) => {
  const { monk_id, status } = req.query;
  const requests = db.getLeaveRequests({ monk_id, status });
  res.json({ success: true, leaveRequests: requests });
});

app.post('/api/leave', (req, res) => {
  const { monk_id, start_date, end_date, session, reason } = req.body;
  if (!monk_id || !start_date || !end_date || !reason) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  const newRequest = db.createLeaveRequest({ monk_id, start_date, end_date, session, reason });
  const monk = db.getMonkById(monk_id);

  if (monk) {
    notifyAdminLeaveRequest(newRequest, monk);
  }

  res.json({ success: true, leaveRequest: newRequest });
});

app.patch('/api/leave/:id/status', (req, res) => {
  const { status, approved_by } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  const updated = db.updateLeaveRequestStatus(req.params.id, { status, approved_by: approved_by || 1 });
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Leave request not found' });
  }

  const monk = db.getMonkById(updated.monk_id);
  db.logBotEvent({
    type: 'leave_status_changed',
    message: `ការសុំច្បាប់របស់ ${monk ? monk.name : 'ព្រះសង្ឃ'} ត្រូវបាន ${status === 'approved' ? 'អនុម័ត (Approved)' : 'បដិសេធ (Rejected)'}។`
  });

  res.json({ success: true, leaveRequest: updated });
});

// 4. Bot Simulation Logs API
app.get('/api/bot-logs', (req, res) => {
  res.json({ success: true, logs: db.getBotLogs() });
});

// 5. Audit Logs API
app.get('/api/audit-logs', (req, res) => {
  res.json({ success: true, auditLogs: db.getAuditLogs() });
});

// 6. Monthly Analytics API
app.get('/api/analytics/monthly', (req, res) => {
  res.json({ success: true, analytics: db.getMonthlyAnalytics() });
});

// 7. Telegram Broadcast & Reminders API
app.post('/api/broadcast', (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ success: false, message: 'Title and content are required' });
  }
  const result = sendBroadcastMessage(title, content);
  res.json({ success: true, message: 'Broadcast sent successfully', ...result });
});

app.post('/api/reminders/send', (req, res) => {
  const { session } = req.body; // 'morning' or 'evening'
  const result = sendPrayerSessionReminder(session || 'morning');
  res.json({ success: true, message: 'Reminder sent successfully', ...result });
});

// 8. Holidays & Sabbath API
app.get('/api/holidays', (req, res) => {
  res.json({ success: true, holidays: db.getHolidays() });
});

app.post('/api/holidays', (req, res) => {
  const { date, title, is_sabbath } = req.body;
  if (!date || !title) {
    return res.status(400).json({ success: false, message: 'Date and title are required' });
  }
  const holiday = db.addHoliday({ date, title, is_sabbath });
  res.json({ success: true, holiday });
});

app.delete('/api/holidays/:id', (req, res) => {
  const deleted = db.deleteHoliday(req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: 'Holiday not found' });
  }
  res.json({ success: true, holiday: deleted });
});

export default app;
