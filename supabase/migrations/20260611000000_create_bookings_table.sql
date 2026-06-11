-- Create the bookings table
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    time TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    gender TEXT NOT NULL,
    service_id TEXT NOT NULL DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
-- We will use the Service Role key from the backend to bypass RLS,
-- so we can safely disable public access by enabling RLS but adding no policies.
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create indexes for common query patterns
CREATE INDEX idx_bookings_date ON bookings (date);
CREATE INDEX idx_bookings_date_time ON bookings (date, time);
CREATE INDEX idx_bookings_phone ON bookings (phone);
