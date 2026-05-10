CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  city VARCHAR(100),
  country VARCHAR(100),
  photo_url TEXT,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user','admin')),
  gemini_key TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE trips (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  cover_photo TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_budget NUMERIC(12,2) DEFAULT 0,
  is_public BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming','ongoing','completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE cities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  country VARCHAR(100) NOT NULL,
  region VARCHAR(100),
  avg_daily_cost NUMERIC(10,2),
  popularity_score INT DEFAULT 0,
  image_url TEXT
);

CREATE TABLE trip_stops (
  id SERIAL PRIMARY KEY,
  trip_id INT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  city_id INT REFERENCES cities(id),
  custom_city VARCHAR(150),
  stop_order INT NOT NULL DEFAULT 1,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  section_type VARCHAR(30) DEFAULT 'general' CHECK (section_type IN ('travel','hotel','activity','general')),
  budget NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE activities (
  id SERIAL PRIMARY KEY,
  city_id INT REFERENCES cities(id),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(80),
  description TEXT,
  estimated_cost NUMERIC(10,2),
  duration_hrs NUMERIC(4,1),
  image_url TEXT,
  popularity INT DEFAULT 0
);

CREATE TABLE stop_activities (
  id SERIAL PRIMARY KEY,
  stop_id INT NOT NULL REFERENCES trip_stops(id) ON DELETE CASCADE,
  activity_id INT REFERENCES activities(id),
  custom_name VARCHAR(255),
  scheduled_time TIME,
  cost NUMERIC(10,2) DEFAULT 0,
  is_completed BOOLEAN DEFAULT false
);

CREATE TABLE expenses (
  id SERIAL PRIMARY KEY,
  trip_id INT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  stop_id INT REFERENCES trip_stops(id),
  category VARCHAR(50) CHECK (category IN ('transport','stay','activities','meals','misc')),
  description VARCHAR(255),
  amount NUMERIC(12,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  expense_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE packing_items (
  id SERIAL PRIMARY KEY,
  trip_id INT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  category VARCHAR(80) DEFAULT 'General',
  item_name VARCHAR(255) NOT NULL,
  is_packed BOOLEAN DEFAULT false,
  ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE trip_notes (
  id SERIAL PRIMARY KEY,
  trip_id INT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  stop_id INT REFERENCES trip_stops(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE community_posts (
  id SERIAL PRIMARY KEY,
  trip_id INT NOT NULL REFERENCES trips(id),
  user_id INT NOT NULL REFERENCES users(id),
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE invoices (
  id SERIAL PRIMARY KEY,
  trip_id INT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  generated_date DATE DEFAULT CURRENT_DATE,
  subtotal NUMERIC(12,2),
  tax_rate NUMERIC(5,2) DEFAULT 5.00,
  discount NUMERIC(12,2) DEFAULT 0,
  grand_total NUMERIC(12,2),
  is_paid BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trips_user      ON trips(user_id)      WHERE deleted_at IS NULL;
CREATE INDEX idx_stops_trip      ON trip_stops(trip_id);
CREATE INDEX idx_expenses_trip   ON expenses(trip_id);
CREATE INDEX idx_cities_name     ON cities(name);
CREATE INDEX idx_activities_city ON activities(city_id);
CREATE INDEX idx_packing_trip    ON packing_items(trip_id);
CREATE INDEX idx_notes_trip      ON trip_notes(trip_id);
CREATE INDEX idx_community_date  ON community_posts(created_at DESC);
