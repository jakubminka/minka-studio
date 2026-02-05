-- Create tables for all collections used in the app

-- Blog posts table
CREATE TABLE IF NOT EXISTS blog (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  image_url TEXT,
  author TEXT,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inquiries (contact form submissions)
CREATE TABLE IF NOT EXISTS inquiries (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  project_url TEXT,
  tags TEXT[], -- Array of tags/specializations
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Web settings (single document configuration)
CREATE TABLE IF NOT EXISTS web_settings (
  id TEXT PRIMARY KEY,
  hero_title TEXT,
  hero_subtitle TEXT,
  about_text TEXT,
  contact_email TEXT,
  phone TEXT,
  social_links JSONB,
  sidebar_tagline TEXT,
  hide_portfolio BOOLEAN DEFAULT FALSE,
  hide_blog BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reviews/testimonials table
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  rating INTEGER,
  company TEXT,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Partners table
CREATE TABLE IF NOT EXISTS partners (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  description TEXT,
  website_url TEXT,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Media metadata (file management)
CREATE TABLE IF NOT EXISTS media_meta (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,
  size TEXT,
  url TEXT,
  parent_id TEXT,
  specialization_id TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS (Row Level Security) for public access if needed
ALTER TABLE blog ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_meta ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Enable public read access for blog" ON blog FOR SELECT USING (true);
CREATE POLICY "Enable public read access for projects" ON projects FOR SELECT USING (true);
CREATE POLICY "Enable public read access for web_settings" ON web_settings FOR SELECT USING (true);
CREATE POLICY "Enable public read access for reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Enable public read access for partners" ON partners FOR SELECT USING (true);
CREATE POLICY "Enable public read access for media_meta" ON media_meta FOR SELECT USING (true);

-- Allow authenticated users or with proper permissions to insert/update/delete
CREATE POLICY "Enable insert for inquiries" ON inquiries FOR INSERT USING (true);
CREATE POLICY "Enable update for inquiries" ON inquiries FOR UPDATE USING (true);
CREATE POLICY "Enable delete for inquiries" ON inquiries FOR DELETE USING (true);
