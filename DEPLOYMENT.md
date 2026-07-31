# 🚀 ណែនាំអំពីការ Deploy ប្រព័ន្ធគ្រប់គ្រងវត្តមានព្រះសង្ឃ វត្តឈូកវ៉ា ឥតគិតថ្លៃ (Free Deployment Guide)

ឯកសារនេះរៀបរាប់អំពីជំហានក្នុងការ Deploy ប្រព័ន្ធ Telegram Bot & Web App (Telegram Mini App) វត្តឈូកវ៉ា ទៅកាន់ Cloud Hosting ដោយឥតគិតថ្លៃ (Free Tier 24/7)៖

---

## 1. ជំហានទី ១៖ បង្កើត និង Setup Database លើ Supabase (PostgreSQL)

1. ចូលទៅកាន់គេហទំព័រ [Supabase.com](https://supabase.com) រួចចុច **Sign Up / Sign In**។
2. បង្កើត Project ថ្មី (ឧទាហរណ៍៖ `wat-chhouk-va-db`) និងកំណត់ Password សម្រាប់ Database។
3. នៅផ្ទាំង Dashboard ខាងឆ្វេង ចូលទៅកាន់ **SQL Editor** -> ចុច **New Query**។
4. ចម្លងកូដ SQL ទាំងស្រុងចេញពីស្រោមសំបុត្រ `supabase/schema.sql` ក្នុង Project នេះ យកទៅ Paste រួចចុច **Run**។
5. តារាងទាំងឡាយ (`monks`, `attendances`, `leave_requests`) និងទិន្នន័យគំរំនឹងត្រូវបានបង្កើតដោយស្វ័យប្រវត្តិ។

---

## 2. ជំហានទី ២៖ បង្កើត Telegram Bot តាមរយៈ `@BotFather`

1. បើក Telegram រួចស្វែងរក賬號 `@BotFather`។
2. ផ្ញើសារ `/newbot` -> វាយឈ្មោះប៊ូត (ឧទាហរណ៍៖ `Wat Chhouk Va Attendance Bot`) -> វាយ username (ឧទាហរណ៍៖ `wat_chhouk_va_bot`)។
3. ទទួលបាន **HTTP API Token** (ឧទាហរណ៍៖ `7123456789:AAFxxx...`)។
4. កត់ត្រា Token នេះទុកសម្រាប់ដាក់ក្នុង Backend Environment Variable។

---

## 3. ជំហានទី ៣៖ Deploy Frontend Web App (Telegram Mini App) លើ Vercel

1. Push កូដ Project នេះទៅកាន់ GitHub Repository របស់អ្នក។
2. ចូលទៅកាន់ [Vercel.com](https://vercel.com) រួចចុច **Add New** -> **Project** -> ជ្រើសរើស GitHub Repo របស់អ្នក។
3. ត្រង់ **Framework Preset** ជ្រើសរើស **Vite**។
4. ចុច **Deploy**។
5. បន្ទាប់ពី Deploy រួចរាល់ អ្នកនឹងទទួលបាន URL ឥតគិតថ្លៃ (ឧទាហរណ៍៖ `https://wat-chhouk-va.vercel.app`)។

---

## 4. ជំហានទី ៤៖ Deploy Backend API & Bot លើ Render.com

1. ចូលទៅកាន់ [Render.com](https://render.com) រួចចុច **New +** -> **Web Service**។
2. ភ្ជាប់ជាមួយ GitHub Repository របស់អ្នក។
3. បំពេញព័ត៌មានដូចខាងក្រោម៖
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm run server`
4. បន្ថែម **Environment Variables**:
   - `PORT`: `5000`
   - `TELEGRAM_BOT_TOKEN`: (API Token ទទួលបានពី BotFather)
   - `WEB_APP_URL`: (URL Vercel ទទួលបានពីជំហានទី ៣)
5. ចុច **Create Web Service** -> Backend និង Telegram Bot នឹងដំណើរការ 24/7 ឥតគិតថ្លៃ!

---

## 5. ជំហានទី ៥៖ ភ្ជាប់ Vercel Web App ទៅកាន់ Telegram Mini App Menu Button

1. បើក Telegram ទៅកាន់ `@BotFather`។
2. ផ្ញើសារ `/newapp` ជ្រើសរើស Bot របស់អ្នក -> បញ្ចូល Title & Description -> ផ្ញើរូបភាព ឬ Skip។
3. ត្រង់ URL របស់ Web App សូមបញ្ចូល Vercel URL (ឧទាហរណ៍៖ `https://wat-chhouk-va.vercel.app`)។
4. ផ្ញើសារ `/setmenubutton` ទៅ `@BotFather` -> ជ្រើសរើស Bot -> ដាក់ឈ្មោះប៊ូតុង `📱 បើកកម្មវិធី` -> បញ្ចូល Vercel URL។
5. រួចរាល់! ពេលនេះព្រះសង្ឃ និង Admin អាចបើកប្រព័ន្ធកត់ត្រាវត្តមានវត្តឈូកវ៉ា ពីក្នុង Telegram បានភ្លាមៗ!
