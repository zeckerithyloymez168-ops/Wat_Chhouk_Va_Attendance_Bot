// server/bot.js
// Automatic Telegram Profile Registration & Interactive Attendance Ticking

import { Telegraf, Markup } from 'telegraf';
import { db } from './db.js';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8841599239:AAEIAZfe80Dgo2otyv3KxaYeok6BsCQS4v4';
export const bot = BOT_TOKEN ? new Telegraf(BOT_TOKEN) : null;
export const WEB_APP_URL = process.env.WEB_APP_URL || 'http://localhost:3000';

if (bot) {
  bot.catch((err, ctx) => {
    console.warn(`Telegraf error handling update for ${ctx.updateType}:`, err.message || err);
  });

  // Helper to construct full user name from Telegram profile
  const getTelegramFullName = (from) => {
    if (!from) return 'ព្រះសង្ឃ';
    const nameParts = [from.first_name, from.last_name].filter(Boolean);
    return nameParts.length > 0 ? nameParts.join(' ') : (from.username ? `@${from.username}` : 'ព្រះសង្ឃ');
  };

  // 1. Command: /start
  bot.start(async (ctx) => {
    const telegramId = ctx.from.id;
    const monk = db.getMonkByTelegramId(telegramId);
    const fullName = getTelegramFullName(ctx.from);

    if (!monk) {
      // Unregistered user -> Offer 1-click registration using Telegram Profile
      const welcomeUnreg = `សូមក្រាបថ្វាយបង្គំ/ជម្រាបសួរ **${fullName}**!\n\n` +
        `លោកអ្នកមិនទាន់មានគណនីក្នុង **ប្រព័ន្ធគ្រប់គ្រងវត្តមាន វត្តឈូកវ៉ា** នៅឡើយទេ (Telegram ID: \`${telegramId}\`)。\n\n` +
        `👉 **សូមចុចប៊ូតុងខាងក្រោមដើម្បីចុះឈ្មោះដោយប្រើប្រាស់ Telegram របស់អ្នកភ្លាមៗ៖**`;

      return ctx.replyWithMarkdownV2(
        welcomeUnreg.replace(/[-_.[\]()~>#+=|{}]/g, '\\$&'),
        Markup.inlineKeyboard([
          [Markup.button.callback(`📝 ចុះឈ្មោះជា: ${fullName}`, 'action_auto_register')],
          [Markup.button.webApp('📱 បើក Mini App ចុះឈ្មោះ', WEB_APP_URL)]
        ])
      );
    }

    // Registered Monk
    const welcomeMsg = `សូមក្រាបថ្វាយបង្គំ/ជម្រាបសួរ **${monk.name}**!\n\n` +
      `សូមស្វាគមន៍មកកាន់ **ប្រព័ន្ធគ្រប់គ្រងវត្តមានព្រះសង្ឃ វត្តឈូកវ៉ា** (Telegram Bot & Mini App)។\n\n` +
      `📌 **ព័ត៌មានគណនី៖**\n` +
      `• ព្រះនាម/ឈ្មោះ៖ **${monk.name}**\n` +
      `• តួនាទី៖ ${monk.role === 'admin' ? '🛡️ Admin/គ្រូសូត្រ' : '🙏 ព្រះសង្ឃ'}\n` +
      `• Telegram ID: \`${telegramId}\`\n\n` +
      `សូមជ្រើសរើសមុខងារខាងក្រោម៖`;

    const buttons = [
      [Markup.button.webApp('📱 បើកកម្មវិធី (Mini App)', WEB_APP_URL)],
      [Markup.button.callback('📊 មើលវត្តមានរបស់ខ្ញុំ', 'cmd_my_attendance')],
      [Markup.button.callback('📝 សុំច្បាប់', 'cmd_leave')]
    ];

    if (monk.role === 'admin') {
      buttons.push([Markup.button.callback('📋 ស្រង់វត្តមានក្នុង Telegram', 'cmd_admin_sheet')]);
      buttons.push([Markup.button.callback('📊 មើលរបាយការណ៍ពិន័យសរុប', 'cmd_admin_report')]);
    }

    return ctx.replyWithMarkdownV2(
      welcomeMsg.replace(/[-_.[\]()~>#+=|{}]/g, '\\$&'),
      Markup.inlineKeyboard(buttons)
    );
  });

  // 2. Action: 1-Click Auto Register using Telegram Profile Info
  bot.action('action_auto_register', async (ctx) => {
    const telegramId = ctx.from.id;
    const fullName = getTelegramFullName(ctx.from);

    const result = db.registerMonk({
      telegram_id: telegramId,
      name: fullName,
      phone: '',
      role: 'monk'
    });

    await ctx.answerCbQuery('ចុះឈ្មោះដោយជោគជ័យ!');

    const successText = `✅ **បានចុះឈ្មោះដោយជោគជ័យ!**\n\n` +
      `• ព្រះនាម/ឈ្មោះ៖ **${fullName}**\n` +
      `• Telegram ID៖ \`${telegramId}\`\n` +
      `• តួនាទី៖ ព្រះសង្ឃ (Monk)\n\n` +
      `លោកអ្នកអាចប្រើប្រាស់មុខងារមើលវត្តមាន និងសុំច្បាប់បានភ្លាមៗ!`;

    return ctx.editMessageText(
      successText,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.webApp('📱 បើកកម្មវិធី (Mini App)', WEB_APP_URL)],
          [Markup.button.callback('📊 មើលវត្តមានរបស់ខ្ញុំ', 'cmd_my_attendance')],
          [Markup.button.callback('📝 សុំច្បាប់', 'cmd_leave')]
        ])
      }
    );
  });

  // 3. Command: /register <Name>
  bot.command('register', (ctx) => {
    const telegramId = ctx.from.id;
    const text = ctx.message.text.replace('/register', '').trim();
    const nameToRegister = text || getTelegramFullName(ctx.from);

    const result = db.registerMonk({
      telegram_id: telegramId,
      name: nameToRegister,
      phone: '',
      role: 'monk'
    });

    return ctx.replyWithMarkdownV2(
      `✅ **បានចុះឈ្មោះដោយជោគជ័យ\\!**\n\n` +
      `• ព្រះនាម/ឈ្មោះ៖ **${nameToRegister}**\n` +
      `• Telegram ID៖ \`${telegramId}\`\n` +
      `• តួនាទី៖ ព្រះសង្ឃ (Monk)\n\n` +
      `លោកអ្នកអាចមើលវត្តមាន និងសុំច្បាប់តាម Telegram Bot នេះបានហើយ\\!`,
      Markup.inlineKeyboard([
        [Markup.button.webApp('📱 បើក Mini App', WEB_APP_URL)],
        [Markup.button.callback('📊 មើលវត្តមានរបស់ខ្ញុំ', 'cmd_my_attendance')]
      ])
    );
  });

  // 4. Command: /attendance
  bot.command('attendance', (ctx) => handleMyAttendance(ctx));
  bot.action('cmd_my_attendance', (ctx) => handleMyAttendance(ctx));

  // 5. Command: /leave
  bot.command('leave', (ctx) => handleLeaveCommand(ctx));
  bot.action('cmd_leave', (ctx) => handleLeaveCommand(ctx));

  // 6. Admin Attendance Sheet Commands & Actions
  bot.command('sheet', (ctx) => handleAdminSheetSelect(ctx));
  bot.action('cmd_admin_sheet', (ctx) => handleAdminSheetSelect(ctx));

  bot.action(/^sheet_sess_(morning|evening)$/, (ctx) => {
    const session = ctx.match[1];
    const today = new Date().toISOString().split('T')[0];
    return renderTelegramAttendanceSheet(ctx, today, session);
  });

  bot.action(/^tg_toggle_(\d+)_(.+)_(morning|evening)$/, (ctx) => {
    const monkId = ctx.match[1];
    const date = ctx.match[2];
    const session = ctx.match[3];

    db.toggleAttendanceStatus(date, session, monkId, 1);
    ctx.answerCbQuery('បានប្តូរវត្តមានរហ័ស!');
    return renderTelegramAttendanceSheet(ctx, date, session, true);
  });

  bot.action(/^tg_save_(.+)_(morning|evening)$/, async (ctx) => {
    const date = ctx.match[1];
    const session = ctx.match[2];
    await ctx.answerCbQuery('បានរក្សាទុកវត្តមានសម័យនេះរួចរាល់!');
    return ctx.editMessageText(
      `✅ **បានរក្សាទុកវត្តមានរួចរាល់ (Saved)!**\n\n` +
      `• កាលបរិច្ឆេទ៖ ${date}\n` +
      `• សម័យ៖ ${session === 'morning' ? '🌅 ពេលព្រឹក' : '🌆 ពេលល្ងាច'}\n\n` +
      `ទិន្នន័យត្រូវបានធ្វើបច្ចុប្បន្នភាពក្នុងប្រព័ន្ធវត្តឈូកវ៉ា។`
    );
  });

  // 7. Admin Fines Report Command in Bot
  bot.command('report', (ctx) => handleAdminReport(ctx));
  bot.action('cmd_admin_report', (ctx) => handleAdminReport(ctx));

  // 8. Leave Approval Action Handlers
  bot.action(/^approve_leave_(\d+)$/, async (ctx) => {
    const leaveId = ctx.match[1];
    const updated = db.updateLeaveRequestStatus(leaveId, { status: 'approved', approved_by: 1 });
    if (updated) {
      const monk = db.getMonkById(updated.monk_id);
      await ctx.answerCbQuery('បានអនុម័តការសុំច្បាប់រួចរាល់!');
      await ctx.editMessageText(
        `✅ **បានអនុម័តការសុំច្បាប់រួចរាល់!**\n\n` +
        `• ព្រះសង្ឃ៖ ${monk ? monk.name : 'Unknown'}\n` +
        `• កាលបរិច្ឆេទ៖ ${updated.start_date}\n` +
        `• ពេល៖ ${updated.session === 'morning' ? 'ព្រឹក' : updated.session === 'evening' ? 'ល្ងាច' : 'ពេញមួយថ្ងៃ'}\n` +
        `• មូលហេតុ៖ ${updated.reason}`
      );
    }
  });

  bot.action(/^reject_leave_(\d+)$/, async (ctx) => {
    const leaveId = ctx.match[1];
    const updated = db.updateLeaveRequestStatus(leaveId, { status: 'rejected', approved_by: 1 });
    if (updated) {
      const monk = db.getMonkById(updated.monk_id);
      await ctx.answerCbQuery('បានបដិសេធការសុំច្បាប់!');
      await ctx.editMessageText(
        `❌ **បានបដិសេធការសុំច្បាប់!**\n\n` +
        `• ព្រះសង្ឃ៖ ${monk ? monk.name : 'Unknown'}\n` +
        `• កាលបរិច្ឆេទ៖ ${updated.start_date}\n` +
        `• មូលហេតុ៖ ${updated.reason}`
      );
    }
  });

  // Launch Telegraf Bot
  bot.launch().then(() => {
    console.log('Wat Chhouk Va Telegram Bot is running live with Telegraf polling...');
  }).catch(err => {
    console.warn('Telegram Bot launch status:', err.message);
  });
}

function handleMyAttendance(ctx) {
  const telegramId = ctx.from.id;
  let monk = db.getMonkByTelegramId(telegramId);
  if (!monk) {
    const fullName = [ctx.from.first_name, ctx.from.last_name].filter(Boolean).join(' ') || 'អ្នកប្រើប្រាស់';
    return ctx.replyWithMarkdownV2(
      `លោកអ្នកមិនទាន់មានគណនីក្នុងប្រព័ន្ធនៅឡើយទេ\\!`,
      Markup.inlineKeyboard([
        [Markup.button.callback(`📝 ចុះឈ្មោះជា: ${fullName}`, 'action_auto_register')]
      ])
    );
  }

  const summary = db.getMonkSummary(monk.id);
  const msg = `📊 **របាយការណ៍វត្តមាន៖ ${monk.name}**\n\n` +
    `✅ វត្តមាន៖ ${summary.stats.totalPresent} លើក\n` +
    `❌ អវត្តមាន៖ ${summary.stats.totalAbsent} លើក\n` +
    `📝 មានច្បាប់៖ ${summary.stats.totalPermission} លើក\n` +
    `💰 ប្រាក់ពិន័យសរុប៖ ${summary.stats.totalFine.toLocaleString()} ៛\n` +
    `⚠️ ប្រាក់ពិន័យនៅខ្វះ៖ ${summary.stats.unpaidFine.toLocaleString()} ៛\n\n` +
    `*(កំណត់សម្គាល់៖ អវត្តមាន ១ លើក ពិន័យ ២,០០០៛)*`;

  return ctx.replyWithMarkdownV2(
    msg.replace(/[-_.[\]()~>#+=|{}]/g, '\\$&'),
    Markup.inlineKeyboard([
      [Markup.button.webApp('📱 មើលលម្អិតក្នុង Mini App', WEB_APP_URL)]
    ])
  );
}

function handleLeaveCommand(ctx) {
  const msg = `📝 **ការសុំច្បាប់ឡើងនមស្សការ**\n\n` +
    `សូមចុចប៊ូតុងខាងក្រោមដើម្បីសុំច្បាប់តាមរយៈ Telegram Mini App ដោយបំពេញកាលបរិច្ឆេទ ពេល (ព្រឹក/ល្ងាច) និងមូលហេតុ៖`;

  return ctx.replyWithMarkdownV2(
    msg.replace(/[-_.[\]()~>#+=|{}]/g, '\\$&'),
    Markup.inlineKeyboard([
      [Markup.button.webApp('📝 បំពេញទម្រង់សុំច្បាប់', WEB_APP_URL)]
    ])
  );
}

function handleAdminSheetSelect(ctx) {
  const telegramId = ctx.from.id;
  const monk = db.getMonkByTelegramId(telegramId);

  if (monk && monk.role !== 'admin') {
    return ctx.reply('⚠️ មុខងារនេះសម្រាប់តែ Admin/គ្រូសូត្រ ប៉ុណ្ណោះ!');
  }

  const msg = `📋 **ស្រង់វត្តមានប្រចាំថ្ងៃក្នុង Telegram (Interactive Attendance Sheet)**\n\n` +
    `សូមជ្រើសរើសសម័យនមស្សការថ្ងៃនេះ៖`;

  return ctx.replyWithMarkdownV2(
    msg.replace(/[-_.[\]()~>#+=|{}]/g, '\\$&'),
    Markup.inlineKeyboard([
      [
        Markup.button.callback('🌅 ពេលព្រឹក', 'sheet_sess_morning'),
        Markup.button.callback('🌆 ពេលល្ងាច', 'sheet_sess_evening')
      ]
    ])
  );
}

function renderTelegramAttendanceSheet(ctx, date, session, isEdit = false) {
  const monks = db.getMonks();
  const attendances = db.getAttendances({ date, session });

  const attMap = {};
  attendances.forEach(a => attMap[a.monk_id] = a.status);

  let totalAbsent = 0;
  const keyboardButtons = [];

  monks.forEach(m => {
    const status = attMap[m.id] || 'present';
    if (status === 'absent') totalAbsent++;

    let badge = '✅';
    if (status === 'absent') badge = '❌ (២,០០០៛)';
    if (status === 'permission') badge = '📝 មានច្បាប់';

    keyboardButtons.push([
      Markup.button.callback(`${badge} ${m.name}`, `tg_toggle_${m.id}_${date}_${session}`)
    ]);
  });

  const totalFine = totalAbsent * 2000;
  keyboardButtons.push([
    Markup.button.callback('💾 រក្សាទុកវត្តមាន (Save)', `tg_save_${date}_${session}`)
  ]);

  const text = `📋 **ស្រង់វត្តមានប្រចាំថ្ងៃ (${date} - ពេល${session === 'morning' ? 'ព្រឹក' : 'ល្ងាច'})**\n\n` +
    `*ណែនាំ៖ ចុចលើឈ្មោះព្រះសង្ឃនីមួយៗដើម្បីប្តូរ (✅ វត្តមាន ➔ ❌ អវត្តមាន ➔ 📝 មានច្បាប់)*\n\n` +
    `💰 **ប្រាក់ពិន័យសម័យនេះ៖** ${totalFine.toLocaleString()} ៛ (អវត្តមាន ${totalAbsent} អង្គ)`;

  if (isEdit) {
    return ctx.editMessageText(
      text,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(keyboardButtons)
      }
    );
  } else {
    return ctx.reply(
      text,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(keyboardButtons)
      }
    );
  }
}

function handleAdminReport(ctx) {
  const monks = db.getMonks();
  let totalFineSum = 0;
  let unpaidFineSum = 0;

  let reportText = `📊 **របាយការណ៍ប្រាក់ពិន័យសរុប វត្តឈូកវ៉ា**\n\n`;

  monks.forEach(m => {
    const summary = db.getMonkSummary(m.id);
    const stats = summary.stats;
    totalFineSum += stats.totalFine;
    unpaidFineSum += stats.unpaidFine;

    reportText += `• **${m.name}**: វត្តមាន ${stats.totalPresent} | អវត្តមាន ${stats.totalAbsent} | ពិន័យខ្វះ \`${stats.unpaidFine.toLocaleString()}៛\`\n`;
  });

  reportText += `\n💵 **ប្រាក់ពិន័យនៅខ្វះសរុបវត្ត៖** \`${unpaidFineSum.toLocaleString()} ៛\`\n` +
    `💰 **ប្រាក់ពិន័យសរុបទាំងអស់៖** \`${totalFineSum.toLocaleString()} ៛\``;

  return ctx.replyWithMarkdownV2(
    reportText.replace(/[-_.[\]()~>#+=|{}]/g, '\\$&'),
    Markup.inlineKeyboard([
      [Markup.button.webApp('📱 មើល និងគ្រប់គ្រងក្នុង Mini App', WEB_APP_URL)]
    ])
  );
}

export function notifyAdminLeaveRequest(leaveRequest, monk) {
  const messageText = `🔔 **ការសុំច្បាប់ថ្មី (រង់ចាំការអនុម័ត)**\n\n` +
    `• **អង្គសុំច្បាប់៖** ${monk.name}\n` +
    `• **កាលបរិច្ឆេទ៖** ${leaveRequest.start_date} ដល់ ${leaveRequest.end_date}\n` +
    `• **ពេល៖** ${leaveRequest.session === 'morning' ? 'ព្រឹក' : leaveRequest.session === 'evening' ? 'ល្ងាច' : 'ពេញមួយថ្ងៃ'}\n` +
    `• **មូលហេតុ៖** ${leaveRequest.reason}`;

  db.logBotEvent({
    type: 'leave_request_notification',
    leave_id: leaveRequest.id,
    monk_name: monk.name,
    message: messageText
  });

  if (bot && process.env.TELEGRAM_ADMIN_CHAT_ID) {
    try {
      bot.telegram.sendMessage(
        process.env.TELEGRAM_ADMIN_CHAT_ID,
        messageText,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [
              Markup.button.callback('✅ អនុម័ត (Approve)', `approve_leave_${leaveRequest.id}`),
              Markup.button.callback('❌ បដិសេធ (Reject)', `reject_leave_${leaveRequest.id}`)
            ]
          ])
        }
      );
    } catch (e) {
      console.warn("Could not dispatch live Telegram message:", e.message);
    }
  }
}

export function sendBroadcastMessage(title, content) {
  const monks = db.getMonks();
  const text = `📢 **${title}**\n\n${content}\n\n— វត្តឈូកវ៉ា (Wat Chhouk Va System)`;

  db.logBotEvent({
    type: 'broadcast_sent',
    message: `បានផ្ញើសារជូនដំណឹងទៅព្រះសង្ឃ ${monks.length} អង្គ៖ "${title}"`
  });

  db.logAuditAction({
    actor_name: 'Admin',
    action_type: 'BROADCAST_SENT',
    description: `បានផ្ញើសារជូនដំណឹង (Broadcast): "${title}"`,
    target: `${monks.length} Telegram users`
  });

  if (!bot) return { sentCount: monks.length, simulated: true };

  let sentCount = 0;
  monks.forEach(m => {
    if (m.telegram_id) {
      try {
        bot.telegram.sendMessage(m.telegram_id, text, {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.webApp('📱 បើក Mini App', WEB_APP_URL)]
          ])
        }).then(() => sentCount++).catch(e => console.warn(e.message));
      } catch (e) {
        console.warn(e);
      }
    }
  });

  return { sentCount: monks.length, simulated: false };
}

export function sendPrayerSessionReminder(session = 'morning') {
  const isMorning = session === 'morning';
  const title = isMorning ? '🔔 រំលឹកឡើងនមស្សការពេលព្រឹក' : '🔔 រំលឹកឡើងនមស្សការពេលល្ងាច';
  const content = isMorning
    ? 'សូមក្រាបថ្វាយបង្គំ/ជម្រាបសួរ ព្រះសង្ឃគ្រប់អង្គ! ដល់ម៉ោងឡើងនមស្សការពេលព្រឹកហើយ។ សូមនិមន្ត/អញ្ជើញចូលរួមសាលានមស្សការ។'
    : 'សូមក្រាបថ្វាយបង្គំ/ជម្រាបសួរ ព្រះសង្ឃគ្រប់អង្គ! ដល់ម៉ោងឡើងនមស្សការពេលល្ងាចហើយ។ សូមនិមន្ត/អញ្ជើញចូលរួមសាលានមស្សការ។';

  return sendBroadcastMessage(title, content);
}

// Automated Scheduled Reminders Scheduler (Runs every minute check)
let lastTriggeredMorning = '';
let lastTriggeredEvening = '';

setInterval(() => {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const hours = now.getHours();
  const minutes = now.getMinutes();

  // Check if today is a Buddhist Sabbath day / Holiday
  const holiday = db.isHolidayDate(todayStr);
  if (holiday) return; // Skip reminders on Sabbath/Holiday if desired

  // 05:00 AM Morning Prayer Reminder
  if (hours === 5 && minutes === 0 && lastTriggeredMorning !== todayStr) {
    lastTriggeredMorning = todayStr;
    console.log(`[Auto Scheduler] Triggering 05:00 AM Morning Prayer Reminder for ${todayStr}...`);
    sendPrayerSessionReminder('morning');
  }

  // 17:00 (5:00 PM) Evening Prayer Reminder
  if (hours === 17 && minutes === 0 && lastTriggeredEvening !== todayStr) {
    lastTriggeredEvening = todayStr;
    console.log(`[Auto Scheduler] Triggering 05:00 PM Evening Prayer Reminder for ${todayStr}...`);
    sendPrayerSessionReminder('evening');
  }
}, 60000);
