// server/db.js
// Production Database engine with Supabase Cloud DB write-through & local persistence

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
  console.log("===========================================================");
  console.log("CONNECTED TO SUPABASE CLOUD DATABASE:", SUPABASE_URL);
  console.log("===========================================================");
} else {
  console.log("Operating on Clean Production Storage (No dummy data)");
}

const cleanInitialData = {
  monks: [],
  attendances: [],
  leave_requests: [],
  bot_logs: [],
  audit_logs: [],
  holidays: []
};

class ProductionDB {
  constructor() {
    this.data = cleanInitialData;
    this.load();
    if (supabase) {
      this.syncFromSupabase();
    }
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
        if (!Array.isArray(this.data.audit_logs)) this.data.audit_logs = [];
        if (!Array.isArray(this.data.holidays)) this.data.holidays = [];
      } else {
        this.save();
      }
    } catch (err) {
      console.warn("Could not load local data file:", err.message);
    }
  }

  save() {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.warn("Could not persist local data file:", err.message);
    }
  }

  // Fetch initial state from Supabase Cloud DB on server startup
  async syncFromSupabase() {
    if (!supabase) return;
    try {
      console.log("Syncing tables from Supabase Cloud DB...");
      const { data: dbMonks, error: errMonks } = await supabase.from('monks').select('*');
      if (!errMonks && dbMonks) {
        this.data.monks = dbMonks;
      }

      const { data: dbAttendances, error: errAtt } = await supabase.from('attendances').select('*');
      if (!errAtt && dbAttendances) {
        this.data.attendances = dbAttendances;
      }

      const { data: dbLeave, error: errLeave } = await supabase.from('leave_requests').select('*');
      if (!errLeave && dbLeave) {
        this.data.leave_requests = dbLeave;
      }

      this.save();
      console.log(`Supabase Sync Complete: ${this.data.monks.length} monks, ${this.data.attendances.length} attendances, ${this.data.leave_requests.length} leave requests.`);
    } catch (e) {
      console.warn("Supabase Sync Warning:", e.message);
    }
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

  registerMonk({ telegram_id, name, phone = '', role = null }) {
    const numTgId = Number(telegram_id);
    const existing = this.getMonkByTelegramId(numTgId);

    if (existing) {
      existing.name = name || existing.name;
      existing.phone = phone || existing.phone;
      if (role) existing.role = role;
      this.save();

      // Write-through to Supabase if connected
      if (supabase) {
        supabase.from('monks').update({ name: existing.name, phone: existing.phone, role: existing.role })
          .eq('telegram_id', numTgId).then(() => {}).catch(e => console.warn(e));
      }

      return { monk: existing, created: false };
    }

    const newId = this.data.monks.length > 0 ? Math.max(...this.data.monks.map(m => m.id)) + 1 : 1;
    // The very first registered user becomes 'admin', all subsequent users become 'monk'
    const finalRole = (this.data.monks.length === 0) ? 'admin' : (role || 'monk');

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

    // Write-through to Supabase if connected
    if (supabase) {
      supabase.from('monks').insert([newMonk]).then(() => {}).catch(e => console.warn("Supabase insert monk error:", e.message));
    }

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

    if (supabase) {
      supabase.from('monks').insert([newMonk]).then(() => {}).catch(e => console.warn(e));
    }

    return newMonk;
  }

  updateMonk(id, updates) {
    const index = this.data.monks.findIndex(m => m.id === Number(id));
    if (index !== -1) {
      this.data.monks[index] = { ...this.data.monks[index], ...updates };
      this.save();

      if (supabase) {
        supabase.from('monks').update(updates).eq('id', id).then(() => {}).catch(e => console.warn(e));
      }

      return this.data.monks[index];
    }
    return null;
  }

  deleteMonk(id) {
    const index = this.data.monks.findIndex(m => m.id === Number(id));
    if (index !== -1) {
      const removed = this.data.monks.splice(index, 1)[0];
      this.save();

      if (supabase) {
        supabase.from('monks').delete().eq('id', id).then(() => {}).catch(e => console.warn(e));
      }

      return removed;
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
    let targetRecord;

    if (existingIndex !== -1) {
      this.data.attendances[existingIndex].status = nextStatus;
      this.data.attendances[existingIndex].fine_amount = fine_amount;
      this.data.attendances[existingIndex].is_paid = nextStatus !== 'absent';
      this.data.attendances[existingIndex].recorded_by = recordedBy;
      this.data.attendances[existingIndex].updated_at = new Date().toISOString();
      targetRecord = this.data.attendances[existingIndex];
    } else {
      const newId = this.data.attendances.length > 0
        ? Math.max(...this.data.attendances.map(a => a.id)) + 1
        : 1;

      targetRecord = {
        id: newId,
        monk_id: numMonkId,
        date,
        session,
        status: nextStatus,
        fine_amount,
        is_paid: nextStatus !== 'absent',
        recorded_by: recordedBy,
        created_at: new Date().toISOString()
      };
      this.data.attendances.push(targetRecord);
    }

    this.save();

    if (supabase) {
      supabase.from('attendances').upsert([targetRecord]).then(() => {}).catch(e => console.warn(e));
    }

    return { monk_id: numMonkId, status: nextStatus, fine_amount };
  }

  recordAttendanceBatch({ date, session, records, recorded_by = 1 }) {
    const upsertList = [];
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
        upsertList.push(this.data.attendances[existingIndex]);
      } else {
        const newId = this.data.attendances.length > 0
          ? Math.max(...this.data.attendances.map(a => a.id)) + 1
          : 1;

        const newAtt = {
          id: newId,
          monk_id: monkId,
          date,
          session,
          status,
          fine_amount,
          is_paid: status !== 'absent',
          recorded_by,
          created_at: new Date().toISOString()
        };
        this.data.attendances.push(newAtt);
        upsertList.push(newAtt);
      }
    });

    this.save();

    if (supabase && upsertList.length > 0) {
      supabase.from('attendances').upsert(upsertList).then(() => {}).catch(e => console.warn(e));
    }

    this.logAuditAction({
      actor_name: 'Admin',
      action_type: 'ATTENDANCE_RECORDED',
      description: `បានស្រង់វត្តមានប្រចាំថ្ងៃ (${date} - ពេល${session === 'morning' ? 'ព្រឹក' : 'ល្ងាច'}) សម្រាប់ ${records.length} អង្គ`,
      target: `${date} - ${session}`
    });

    return this.getAttendances({ date, session });
  }

  markFineAsPaid(attendanceId) {
    const record = this.data.attendances.find(a => a.id === Number(attendanceId));
    if (record) {
      record.is_paid = true;
      this.save();

      if (supabase) {
        supabase.from('attendances').update({ is_paid: true }).eq('id', attendanceId).then(() => {}).catch(e => console.warn(e));
      }

      const monk = this.getMonkById(record.monk_id);
      this.logAuditAction({
        actor_name: 'Admin',
        action_type: 'FINE_PAID',
        description: `បានទទួលការបង់ប្រាក់ពិន័យ (២,០០០៛) ពី ${monk ? monk.name : 'ព្រះសង្ឃ'}`,
        target: monk ? monk.name : `Monk #${record.monk_id}`
      });

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

    if (supabase) {
      supabase.from('leave_requests').insert([newRequest]).then(() => {}).catch(e => console.warn(e));
    }

    const monk = this.getMonkById(monk_id);
    this.logAuditAction({
      actor_name: monk ? monk.name : 'Monk',
      action_type: 'LEAVE_SUBMITTED',
      description: `បានផ្ញើសារសុំច្បាប់ (${start_date} ដល់ ${end_date}): "${reason}"`,
      target: monk ? monk.name : `Monk #${monk_id}`
    });

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
            const newAtt = {
              id: newAttId,
              monk_id: monkId,
              date: targetDate,
              session: sess,
              status: 'permission',
              fine_amount: 0,
              is_paid: true,
              recorded_by: approved_by,
              created_at: new Date().toISOString()
            };
            this.data.attendances.push(newAtt);
            if (supabase) {
              supabase.from('attendances').upsert([newAtt]).then(() => {}).catch(e => console.warn(e));
            }
          }
        });
      }
      this.save();

      const monk = this.getMonkById(req.monk_id);
      this.logAuditAction({
        actor_name: 'Admin',
        action_type: status === 'approved' ? 'LEAVE_APPROVED' : 'LEAVE_REJECTED',
        description: `បាន ${status === 'approved' ? 'អនុម័ត' : 'បដិសេធ'} ការសុំច្បាប់របស់ ${monk ? monk.name : 'ព្រះសង្ឃ'}`,
        target: monk ? monk.name : `Leave #${id}`
      });

      if (supabase) {
        supabase.from('leave_requests').update({ status, approved_by }).eq('id', id).then(() => {}).catch(e => console.warn(e));
      }

      return req;
    }
    return null;
  }

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

  logAuditAction({ actor_name = 'Admin', action_type, description, target = '' }) {
    if (!this.data.audit_logs) this.data.audit_logs = [];
    const newLog = {
      id: this.data.audit_logs.length > 0 ? Math.max(...this.data.audit_logs.map(l => l.id)) + 1 : 1,
      actor_name,
      action_type,
      description,
      target,
      timestamp: new Date().toISOString()
    };
    this.data.audit_logs.unshift(newLog);
    if (this.data.audit_logs.length > 200) this.data.audit_logs.pop();
    this.save();
    return newLog;
  }

  getAuditLogs() {
    return this.data.audit_logs || [];
  }

  getMonthlyAnalytics() {
    const monks = this.data.monks;
    const attendances = this.data.attendances;
    const totalAttendances = attendances.length;
    const totalPresent = attendances.filter(a => a.status === 'present').length;
    const totalAbsent = attendances.filter(a => a.status === 'absent').length;
    const totalPermission = attendances.filter(a => a.status === 'permission').length;
    const totalFines = totalAbsent * 2000;
    const paidFines = attendances.filter(a => a.status === 'absent' && a.is_paid).length * 2000;
    const unpaidFines = totalFines - paidFines;

    const rate = totalAttendances > 0 ? Math.round((totalPresent / totalAttendances) * 100) : 100;

    // Leaderboard
    const monkStats = monks.map(m => {
      const mAtt = attendances.filter(a => a.monk_id === m.id);
      const mTotal = mAtt.length;
      const mPresent = mAtt.filter(a => a.status === 'present').length;
      const mRate = mTotal > 0 ? Math.round((mPresent / mTotal) * 100) : 100;
      return {
        id: m.id,
        name: m.name,
        role: m.role,
        present: mPresent,
        absent: mAtt.filter(a => a.status === 'absent').length,
        permission: mAtt.filter(a => a.status === 'permission').length,
        rate: mRate
      };
    }).sort((a, b) => b.rate - a.rate || b.present - a.present);

    return {
      overview: {
        totalMonks: monks.length,
        totalAttendances,
        totalPresent,
        totalAbsent,
        totalPermission,
        attendanceRate: rate,
        totalFines,
        paidFines,
        unpaidFines
      },
      leaderboard: monkStats
    };
  }

  // Sabbath & Holidays API
  getHolidays() {
    return this.data.holidays || [];
  }

  isHolidayDate(date) {
    if (!this.data.holidays) return null;
    return this.data.holidays.find(h => h.date === date) || null;
  }

  addHoliday({ date, title, is_sabbath = true }) {
    if (!this.data.holidays) this.data.holidays = [];
    const existingIndex = this.data.holidays.findIndex(h => h.date === date);
    const newHoliday = {
      id: existingIndex !== -1 ? this.data.holidays[existingIndex].id : (this.data.holidays.length > 0 ? Math.max(...this.data.holidays.map(h => h.id)) + 1 : 1),
      date,
      title,
      is_sabbath,
      created_at: new Date().toISOString()
    };

    if (existingIndex !== -1) {
      this.data.holidays[existingIndex] = newHoliday;
    } else {
      this.data.holidays.push(newHoliday);
    }
    this.save();

    this.logAuditAction({
      actor_name: 'Admin',
      action_type: 'HOLIDAY_ADDED',
      description: `បានបន្ថែមថ្ងៃសីល/ថ្ងៃបុណ្យ (${date}): "${title}"`,
      target: date
    });

    return newHoliday;
  }

  deleteHoliday(id) {
    if (!this.data.holidays) return null;
    const index = this.data.holidays.findIndex(h => h.id === Number(id));
    if (index !== -1) {
      const removed = this.data.holidays.splice(index, 1)[0];
      this.save();
      return removed;
    }
    return null;
  }
}

export const db = new ProductionDB();
