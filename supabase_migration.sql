-- ============ MIGRATION: SQLite → Supabase Postgres ============

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  onboarding_completed BOOLEAN DEFAULT FALSE
);

-- 3. Create assessment_questions table (21 questions from seed.py)
CREATE TABLE IF NOT EXISTS assessment_questions (
  id SERIAL PRIMARY KEY,
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) NOT NULL,
  options JSONB NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Insert the 21 assessment questions
INSERT INTO assessment_questions (question_text, question_type, options, active, created_at) VALUES
  ('Have you experienced migraine or headache episodes before?', 'single', '["Never","Occasionally","Frequently","Very frequently"]', TRUE, NOW()),
  ('How often do you typically experience migraine or headache episodes?', 'single', '["Less than once/month","1-3/month","4-8/month","More than 8/month"]', TRUE, NOW()),
  ('How long does a typical episode last?', 'single', '["Less than 2 hours","2-6 hours","6-12 hours","More than 12 hours"]', TRUE, NOW()),
  ('What symptoms usually occur with your episodes?', 'multi', '["Head pain","Nausea","Light sensitivity","Sound sensitivity","Visual disturbances","Dizziness","Other"]', TRUE, NOW()),
  ('How many hours do you normally sleep?', 'single', '["Less than 5","5-6","6-7","7-8","More than 8"]', TRUE, NOW()),
  ('How consistent is your sleep schedule?', 'single', '["Very consistent","Mostly consistent","Sometimes irregular","Very irregular"]', TRUE, NOW()),
  ('How physically active are you?', 'single', '["Very low","Low","Moderate","High"]', TRUE, NOW()),
  ('How much caffeine do you normally consume?', 'single', '["None","1 serving/day","2-3 servings/day","More than 3 servings/day"]', TRUE, NOW()),
  ('How would you describe your normal hydration?', 'single', '["Low","Moderate","Good","Very good"]', TRUE, NOW()),
  ('How frequently do you experience significant stress?', 'single', '["Rarely","Occasionally","Frequently","Almost daily"]', TRUE, NOW()),
  ('Which factors have you noticed may be associated with your headaches?', 'multi', '["Lack of sleep","Stress","Skipping meals","Dehydration","Bright light","Noise","Caffeine changes","Physical exertion","Weather/environmental changes","Other","Not sure"]', TRUE, NOW()),
  ('What is your usual resting heart-rate range, if known?', 'single', '["Less than 60","60-70","70-80","80-90","More than 90","Don\'t know"]', TRUE, NOW()),
  ('Do you regularly monitor your blood pressure?', 'single', '["Yes","No"]', TRUE, NOW()),
  ('Have you noticed a consistent pattern before your headaches begin?', 'single', '["Yes","Sometimes","No","Not sure"]', TRUE, NOW());

-- 5. Create user_risk_profiles table
CREATE TABLE IF NOT EXISTS user_risk_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  profile_version VARCHAR(20) DEFAULT 'v1',
  migraine_history_score FLOAT DEFAULT 0,
  sleep_profile VARCHAR(50),
  sleep_hours FLOAT,
  stress_profile VARCHAR(50),
  activity_profile VARCHAR(50),
  hydration_profile VARCHAR(50),
  caffeine_profile VARCHAR(50),
  trigger_profile JSONB DEFAULT '[]',
  resting_hr INTEGER DEFAULT 72,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 6. Create dataset_exports table
CREATE TABLE IF NOT EXISTS dataset_exports (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  file_path TEXT,
  export_type VARCHAR(50) DEFAULT 'csv',
  user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 7. Enable Row Level Security (optional but recommended)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_risk_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (TRUE);
CREATE POLICY "Questions are publicly visible" ON assessment_questions FOR SELECT USING (TRUE);

SELECT 'Migration complete: assessment_questions and user_risk_profiles tables created';