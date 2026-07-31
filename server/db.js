// server/db.js
// Production Database engine supporting Supabase PostgreSQL Database & Clean Local Persistence

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'data.json');

// Supabase Cloud DB Connection setup if credentials provided
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabase = (SUPABASE_URL && SUPABASE_KEY && !SUPABASE_URL.includes('xyzcompany'))
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

if (supabase) {
  console.log("Connected to Real Supabase Cloud Database:", SUPABASE_URL);
} else {
  console.log("Operating on Clean Local Production Storage (No dummy data)");
}

// Clean Initial State with 0 dummy data
const cleanInitialData = {
  monks: [],
  attendances: [],
  leave_requests: [],
  bot_logs: []
};

class ProductionDB {
  constructor() {
    this.data = cleanInitialData;
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const fileContent = fs.readFileSync(DATA_FILE, 'utf8');
        this.data = JSON.parse(fileContent);
        if (!Array.isArray(this.data.monks)) this.data.monks = [];
        if (!Array.isArray(this.data.attendances)) this.data.attendances = [];
        if (!Array.isArray(this.data.leave_requests)) this.data.leave_requests = [];
        if (!Array.isArray(this.data.bot_logs)) this.data.bot_logs = [];
      } else {
        this.save();
      }
    } catch (err) {
      console.warn("Could not load data file:", err.message);
    }
  }

  save() {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.warn("Could not persist data file:", err.message);
    }
  }

  // Clear all existing data (Purge endpoint/method)
  clearAllData() {
    this.data = {
      monks: [],
      attendances: [],
      leave_requests: [],
      bot_logs: []
    };
    this.save();
    console.log("All sample data purged. Database is now clean.");
  }

  // Monks API
  getMonks() {
    return this.data.monks;
  }

  getMonkById(id) {
    return this.data.monks.find(m => m.id === Number(id));
  }

  getMonkByTelegramId(telegramId) {
    if (!telegramId) return null;
    return this.data.monks.find(m => m.telegram_id === Number(telegramId));
  }

  registerMonk({ telegram_id, name, phone = '', role = 'monk' }) {
    const numTgId = Number(telegram_id);
    const existing = this.getMonkByTelegramId(numTgId);

    if (existing) {
      existing.name = name || existing.name;
      existing.phone = phone || existing.phone;
      existing.role = role || existing.role;
      this.save();
      return { monk: existing, created: false };
    }

    const newId = this.data.monks.length > 0 ? Math.max(...this.data.monks.map(m => m.id)) + 1 : 1;
    // First monk registered automatically gets 'admin' role if no admins exist
    const finalRole = (this.data.monks.length === 0) ? 'admin' : role;

    const newMonk = {
      id: newId,
      telegram_id: numTgId,
      name,
      role: finalRole,
      phone,
      status: 'active',
      created_at: new Date().toISOString()
    };

    this.data.monks.push(newMonk);
    this.save();

    this.logBotEvent({
      type: 'monk_registered',
      message: `ព្រះសង្ឃអង្គថ្មីបានចុះឈ្មោះ៖ ${name} (Telegram ID: ${numTgId}, តួនាទី: ${finalRole})`
    });

    return { monk: newMonk, created: true };
  }

  addMonk({ name, role = 'monk', phone = '', telegram_id = null }) {
    const newId = this.data.monks.length > 0 ? Math.max(...this.data.monks.map(m => m.id)) + 1 : 1;
    const newMonk = {
      id: newId,
      telegram_id: telegram_id ? Number(telegram_id) : 100000000 + newId,
      name,
      role,
      phone,
      status: 'active',
      created_at: new Date().toISOString()
    };
    this.data.monks.push(newMonk);
    this.save();
    return newMonk;
  }

  updateMonk(id, updates) {
    const index = this.data.monks.findIndex(m => m.id === Number(id));
    if (index !== -1) {
      this.data.monks[index] = { ...this.data.monks[index], ...updates };
      this.save();
      return this.data.monks[index];
    }
    return null;
  }

  // Attendances API
  getAttendances(filters = {}) {
    let result = [...this.data.attendances];
    if (filters.date) {
      result = result.filter(a => a.date === filters.date);
    }
    if (filters.session) {
      result = result.filter(a => a.session === filters.session);
    }
    if (filters.monk_id) {
      result = result.filter(a => a.monk_id === Number(filters.monk_id));
    }
    return result;
  }

  toggleAttendanceStatus(date, session, monkId, recordedBy = 1) {
    const numMonkId = Number(monkId);
    const existingIndex = this.data.attendances.findIndex(
      a => a.monk_id === numMonkId && a.date === date && a.session === session
    );

    let nextStatus = 'absent';
    if (existingIndex !== -1) {
      const curr = this.data.attendances[existingIndex].status;
      if (curr === 'present') nextStatus = 'absent';
      else if (curr === 'absent') nextStatus = 'permission';
      else nextStatus = 'present';
    }

    const fine_amount = nextStatus === 'absent' ? 2000 : 0;

    if (existingIndex !== -1) {
      this.data.attendances[existingIndex].status = nextStatus;
      this.data.attendances[existingIndex].fine_amount = fine_amount;
      this.data.attendances[existingIndex].is_paid = nextStatus !== 'absent';
      this.data.attendances[existingIndex].recorded_by = recordedBy;
      this.data.attendances[existingIndex].updated_at = new Date().toISOString();
    } else {
      const newId = this.data.attendances.length > 0
        ? Math.max(...this.data.attendances.map(a => a.id)) + 1
        : 1;

      this.data.attendances.push({
        id: newId,
        monk_id: numMonkId,
        date,
        session,
        status: nextStatus,
        fine_amount,
        is_paid: nextStatus !== 'absent',
        recorded_by: recordedBy,
        created_at: new Date().toISOString()
      });
    }

    this.save();
    return { monk_id: numMonkId, status: nextStatus, fine_amount };
  }

  recordAttendanceBatch({ date, session, records, recorded_by = 1 }) {
    records.forEach(rec => {
      const monkId = Number(rec.monk_id);
      const status = rec.status;
      const fine_amount = status === 'absent' ? 2000 : 0;

      const existingIndex = this.data.attendances.findIndex(
        a => a.monk_id === monkId && a.date === date && a.session === session
      );

      if (existingIndex !== -1) {
        this.data.attendances[existingIndex] = {
          ...this.data.attendances[existingIndex],
          status,
          fine_amount,
          recorded_by,
          updated_at: new Date().toISOString()
        };
      } else {
        const newId = this.data.attendances.length > 0
          ? Math.max(...this.data.attendances.map(a => a.id)) + 1
          : 1;

        this.data.attendances.push({
          id: newId,
          monk_id: monkId,
          date,
          session,
          status,
          fine_amount,
          is_paid: status !== 'absent',
          recorded_by,
          created_at: new Date().toISOString()
        });
      }
    });

    this.save();
    return this.getAttendances({ date, session });
  }

  markFineAsPaid(attendanceId) {
    const record = this.data.attendances.find(a => a.id === Number(attendanceId));
    if (record) {
      record.is_paid = true;
      this.save();
      return record;
    }
    return null;
  }

  // Leave Requests API
  getLeaveRequests(filters = {}) {
    let result = [...this.data.leave_requests];
    if (filters.monk_id) {
      result = result.filter(r => r.monk_id === Number(filters.monk_id));
    }
    if (filters.status) {
      result = result.filter(r => r.status === filters.status);
    }
    return result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  createLeaveRequest({ monk_id, start_date, end_date, session, reason }) {
    const newId = this.data.leave_requests.length > 0
      ? Math.max(...this.data.leave_requests.map(r => r.id)) + 1
      : 1;

    const newRequest = {
      id: newId,
      monk_id: Number(monk_id),
      start_date,
      end_date,
      session,
      reason,
      status: 'pending',
      approved_by: null,
      created_at: new Date().toISOString()
    };

    this.data.leave_requests.push(newRequest);
    this.save();
    return newRequest;
  }

  updateLeaveRequestStatus(id, { status, approved_by = 1 }) {
    const req = this.data.leave_requests.find(r => r.id === Number(id));
    if (req) {
      req.status = status;
      req.approved_by = approved_by;

      if (status === 'approved') {
        const monkId = req.monk_id;
        const targetDate = req.start_date;
        const targetSessions = req.session === 'full_day' ? ['morning', 'evening'] : [req.session];

        targetSessions.forEach(sess => {
          const attIndex = this.data.attendances.findIndex(a => a.monk_id === monkId && a.date === targetDate && a.session === sess);
          if (attIndex !== -1) {
            this.data.attendances[attIndex].status = 'permission';
            this.data.attendances[attIndex].fine_amount = 0;
            this.data.attendances[attIndex].is_paid = true;
          } else {
            const newAttId = this.data.attendances.length > 0 ? Math.max(...this.data.attendances.map(a => a.id)) + 1 : 1;
            this.data.attendances.push({
              id: newAttId,
              monk_id: monkId,
              date: targetDate,
              session: sess,
              status: 'permission',
              fine_amount: 0,
              is_paid: true,
              recorded_by: approved_by,
              created_at: new Date().toISOString()
            });
          }
        });
      }
      this.save();
      return req;
    }
    return null;
  }

  // Summary & Fines Report
  getMonkSummary(monkId) {
    const monk = this.getMonkById(monkId);
    if (!monk) return null;

    const attendances = this.getAttendances({ monk_id: monkId });
    const leaveRequests = this.getLeaveRequests({ monk_id: monkId });

    const totalPresent = attendances.filter(a => a.status === 'present').length;
    const totalAbsent = attendances.filter(a => a.status === 'absent').length;
    const totalPermission = attendances.filter(a => a.status === 'permission').length;
    const totalFine = attendances.reduce((sum, a) => sum + (a.status === 'absent' ? a.fine_amount : 0), 0);
    const unpaidFine = attendances.reduce((sum, a) => sum + (a.status === 'absent' && !a.is_paid ? a.fine_amount : 0), 0);

    return {
      monk,
      stats: {
        totalPresent,
        totalAbsent,
        totalPermission,
        totalFine,
        unpaidFine,
      },
      recentAttendances: attendances.slice(-10).reverse(),
      leaveRequests
    };
  }

  logBotEvent(event) {
    if (!this.data.bot_logs) this.data.bot_logs = [];
    this.data.bot_logs.push({
      timestamp: new Date().toISOString(),
      ...event
    });
    if (this.data.bot_logs.length > 50) this.data.bot_logs.shift();
    this.save();
  }

  getBotLogs() {
    return this.data.bot_logs || [];
  }
}

export const db = new ProductionDB();
