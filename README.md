# 🛕 ប្រព័ន្ធគ្រប់គ្រងវត្តមានព្រះសង្ឃឡើងនមស្សការ វត្តឈូកវ៉ា (Wat Chhouk Va Monk Attendance System)

ប្រព័ន្ធគ្រប់គ្រងវត្តមានព្រះសង្ឃឡើងនមស្សការ វត្តឈូកវ៉ា ត្រូវបានបង្កើតឡើងយ៉ាងសម្រិតសម្រាំងសម្រាប់កត់ត្រាវត្តមាន/អវត្តមានប្រចាំថ្ងៃ (ពេលព្រឹក និង ពេលល្ងាច), គ្រប់គ្រងការសុំច្បាប់, គណនាប្រាក់ពិន័យអវត្តមានស្វ័យប្រវត្តិ (២,០០០៛/លើក), និងភ្ជាប់ផ្ទាល់ជាមួយ Telegram Bot & Telegram Mini App។

---

## 🌟 លក្ខណៈពិសេសចម្បង (Key Features)

1. **📱 Telegram Mini App & Bot Integration:**
   - ចូលប្រើប្រាស់បានភ្លាមៗក្នុង Telegram ដោយមិនបាច់ចាំ Password (ប្រើប្រាស់ Telegram User ID ផ្ទៀងផ្ទាត់)។
   - ទទួលសារស្វ័យប្រវត្តិ និងប៊ូតុង [អនុម័ត / បដិសេធ] ការសុំច្បាប់ក្នុង Telegram Admin Group។

2. **👤 ផ្ទាំងព្រះសង្ឃ (Monk User View):**
   - មើលវត្តមាន អវត្តមាន និងប្រាក់ពិន័យត្រូវបង់សរុប (២,០០០៛ ក្នុង១ពេល)។
   - ទម្រង់សុំច្បាប់ (Leave Request Form) ជ្រើសរើសថ្ងៃ ពេលព្រឹក/ល្ងាច/ពេញមួយថ្ងៃ និងបញ្ចូលមូលហេតុ។
   - តាមដានស្ថានភាពសុំច្បាប់ (រង់ចាំ / បានអនុម័ត / បានបដិសេធ)។

3. **📋 ស្រង់វត្តមានប្រចាំថ្ងៃ (Admin Daily Attendance Sheet):**
   - ស្រង់វត្តមានបានយ៉ាងលឿនតាមសម័យ 🌅 ពេលព្រឹក ឬ 🌆 ពេលល្ងាច។
   - ជ្រើសរើស វត្តមាន / អវត្តមាន (ពិន័យ ២,០០០៛) / មានច្បាប់ (០៛)។
   - មុខងារ One-click "វត្តមានទាំងអស់" ឬ "អវត្តមានទាំងអស់"។

4. **✅ គ្រប់គ្រង និងអនុម័តការសុំច្បាប់ (Leave Approvals Manager):**
   - ពិនិត្យ និងអនុម័តការសុំច្បាប់របស់ព្រះសង្ឃ។
   - នៅពេល Admin អនុម័ត ប្រព័ន្ធនឹងកែប្រែវត្តមានទៅជា "មានច្បាប់" (០៛) ដោយស្វ័យប្រវត្តិ។

5. **💰 របាយការណ៍ និងការទូទាត់ប្រាក់ពិន័យ (Fines & Reports):**
   - មើលប្រាក់ពិន័យសរុបប្រចាំវត្ត និងតាមព្រះសង្ឃនីមួយៗ។
   - ប៊ូតុងសម្គាល់ "បង់រួច" (Mark as Paid) នៅពេលព្រះសង្ឃបានយកប្រាក់ពិន័យមកទូទាត់ជូនវត្ត។

---

## 🛠️ បច្ចេកវិទ្យាប្រើប្រាស់ (Tech Stack)

- **Frontend:** React 18, Vite, Tailwind CSS (Custom Temple Gold & Saffron Glassmorphic Theme), Lucide Icons
- **Backend:** Node.js, Express REST API, Telegraf.js (Telegram Bot Engine)
- **Database:** Local JSON/In-Memory Engine (សម្រាប់ local test) + Supabase (PostgreSQL `schema.sql`)
- **Telegram:** Telegram WebApp SDK (`telegram-web-app.js`)

---

## 🚀 របៀបដំឡើង និងរត់ក្នុងស្រុក (Local Setup Guide)

### ១. ដំឡើង Dependencies
```bash
npm install
```

### ២. រត់ Backend API & Telegram Bot Engine
```bash
npm run server
```
*(Server នឹងដំណើរការនៅលើ Port `5000`)*

### ៣. រត់ Frontend Web App & Telegram Mini App
```bash
npm run dev
```
*(អ្នកអាចបើក browser ទៅកាន់ `http://localhost:3000`)*

---

## 📁 រចនាសម្ព័ន្ធកូដ (Directory Structure)

```
wat-chhouk-va-attendance/
├── supabase/
│   └── schema.sql                 # PostgreSQL Database Tables & Initial Sample Data
├── server/
│   ├── index.js                   # Express REST API Server
│   ├── db.js                      # Database Access Layer & Fines Logic
│   └── bot.js                     # Telegraf Telegram Bot Commands & Action Handlers
├── src/
│   ├── App.jsx                    # Main App with Navigation & Tab Switcher
│   ├── index.css                  # Custom Tailwind & Temple Gold Glassmorphic Theme
│   ├── components/
│   │   ├── Navbar.jsx             # Top Header & Monk Switcher
│   │   ├── MonkView.jsx           # Monk Portal, Fine Summary & Leave Application Form
│   │   ├── AdminAttendance.jsx    # Session Attendance Sheet Taker
│   │   ├── AdminLeaveApproval.jsx # Pending Leave Requests Manager
│   │   ├── AdminReports.jsx       # Monk Fines & Payment Tracker
│   │   └── TelegramSimulator.jsx  # Interactive Telegram Bot & Event Monitor Simulator
├── DEPLOYMENT.md                  # Free Hosting Deployment Instructions
└── README.md
```

---

## 📜 អាជ្ញាប័ណ្ណ (License)
កូដនេះត្រូវបានបង្កើតឡើងសម្រាប់ប្រើប្រាស់ក្នុងវត្តឈូកវ៉ា ឥតគិតថ្លៃ (Open for Wat Chhouk Va).
