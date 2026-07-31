-- ==============================================================================
-- WAT CHHOUK VA MONK ATTENDANCE & FINE MANAGEMENT SYSTEM - PRODUCTION SCHEMA
-- ប្រព័ន្ធគ្រប់គ្រងវត្តមាន និងប្រាក់ពិន័យព្រះសង្ឃវត្តឈូកវ៉ា (គ្មានទិន្នន័យសាកល្បង)
-- ==============================================================================

-- 1. Create Monks Table (ព័ត៌មានព្រះសង្ឃ)
CREATE TABLE IF NOT EXISTS monks (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE,
    name VARCHAR(255) NOT NULL,            -- ព្រះនាម / ឈ្មោះ
    role VARCHAR(50) NOT NULL DEFAULT 'monk' CHECK (role IN ('admin', 'monk')),
    phone VARCHAR(50),                     -- លេខទូរស័ព្ទ
    password VARCHAR(255),                  -- ពាក្យសម្ងាត់ Admin
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Attendances Table (កំណត់ត្រាវត្តមាន)
CREATE TABLE IF NOT EXISTS attendances (
    id SERIAL PRIMARY KEY,
    monk_id INT NOT NULL REFERENCES monks(id) ON DELETE CASCADE,
    date DATE NOT NULL,                                 -- កាលបរិច្ឆេទ YYYY-MM-DD
    session VARCHAR(50) NOT NULL CHECK (session IN ('morning', 'evening')), -- ព្រឹក/ល្ងាច
    status VARCHAR(50) NOT NULL CHECK (status IN ('present', 'absent', 'permission')), -- វត្តមាន / អវត្តមាន / មានច្បាប់
    fine_amount INT NOT NULL DEFAULT 0,                 -- ២០០០៛ ប្រសិនបើអវត្តមានគ្មានច្បាប់
    is_paid BOOLEAN NOT NULL DEFAULT FALSE,             -- បានបង់ប្រាក់ពិន័យ ឬ នៅ
    recorded_by INT REFERENCES monks(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_monk_date_session UNIQUE (monk_id, date, session)
);

-- 3. Create Leave Requests Table (ការសុំច្បាប់)
CREATE TABLE IF NOT EXISTS leave_requests (
    id SERIAL PRIMARY KEY,
    monk_id INT NOT NULL REFERENCES monks(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,                           -- ថ្ងៃចាប់ផ្តើម
    end_date DATE NOT NULL,                             -- ថ្ងៃបញ្ចប់
    session VARCHAR(50) NOT NULL CHECK (session IN ('morning', 'evening', 'full_day')),
    reason TEXT NOT NULL,                               -- ហេតុផលសុំច្បាប់
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by INT REFERENCES monks(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for high efficiency lookup
CREATE INDEX IF NOT EXISTS idx_attendances_monk_date ON attendances(monk_id, date);
CREATE INDEX IF NOT EXISTS idx_leave_requests_monk ON leave_requests(monk_id);
CREATE INDEX IF NOT EXISTS idx_monks_telegram_id ON monks(telegram_id);

-- 4. Initial Default Admin User Seed
INSERT INTO monks (telegram_id, name, role, phone, password)
VALUES (100000001, 'Admin វត្តឈូកវ៉ា', 'admin', '012345678', 'admin123')
ON CONFLICT (telegram_id) DO NOTHING;

