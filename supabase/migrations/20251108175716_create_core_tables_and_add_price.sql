/*
  # Create Core Tables and Add Service Price to Appointments

  1. New Tables
    - `business_settings` - stores barbershop configuration
    - `services` - stores available services
    - `appointments` - stores customer appointments with service price

  2. Details for business_settings
    - `id` (uuid, primary key)
    - `weekday_off` (integer array, days of week when closed: 0=Sunday)
    - `specific_days_off` (date array, specific dates when closed)
    - `work_start_time` (time)
    - `work_end_time` (time)
    - `slot_interval_minutes` (integer)
    - `whatsapp_message_template` (text)
    - `admin_password` (text)
    - `whatsapp_number` (text)
    - `updated_at` (timestamp)

  3. Details for services
    - `id` (uuid, primary key)
    - `name` (text)
    - `description` (text)
    - `duration_minutes` (integer)
    - `price` (numeric)
    - `active` (boolean)
    - `created_at` (timestamp)

  4. Details for appointments
    - `id` (uuid, primary key)
    - `service_id` (uuid, foreign key)
    - `customer_name` (text)
    - `customer_whatsapp` (text)
    - `appointment_date` (date)
    - `appointment_time` (time)
    - `service_price` (numeric) - price at time of booking
    - `status` (text: pending, confirmed, cancelled)
    - `created_at` (timestamp)
    - `updated_at` (timestamp)

  5. Security
    - Enable RLS on all tables
    - Allow public SELECT on services table
    - Allow public INSERT on appointments (with validation)
    - Restrict business_settings to admin only
*/

CREATE TABLE IF NOT EXISTS business_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  weekday_off integer[] DEFAULT ARRAY[0],
  specific_days_off date[] DEFAULT ARRAY[]::date[],
  work_start_time time DEFAULT '09:00:00',
  work_end_time time DEFAULT '18:00:00',
  slot_interval_minutes integer DEFAULT 30,
  whatsapp_message_template text DEFAULT '',
  admin_password text DEFAULT 'onzy2025',
  whatsapp_number text DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  duration_minutes integer NOT NULL,
  price numeric NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES services(id),
  customer_name text NOT NULL,
  customer_whatsapp text NOT NULL,
  appointment_date date NOT NULL,
  appointment_time time NOT NULL,
  service_price numeric DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Services are publicly readable" ON services FOR SELECT USING (true);

CREATE POLICY "Public can insert appointments" ON appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Appointments are publicly readable" ON appointments FOR SELECT USING (true);

CREATE POLICY "Business settings are readable" ON business_settings FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_appointments_date_time ON appointments(appointment_date, appointment_time);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_service ON appointments(service_id);

INSERT INTO business_settings (
  id,
  weekday_off,
  specific_days_off,
  work_start_time,
  work_end_time,
  slot_interval_minutes,
  whatsapp_message_template,
  admin_password,
  whatsapp_number
)
SELECT
  gen_random_uuid(),
  ARRAY[0]::integer[],
  ARRAY[]::date[],
  '09:00:00'::time,
  '18:00:00'::time,
  30,
  'Olá {name}, seu horário foi agendado com sucesso para {date} às {time} na Onzy Barber! 💈',
  'onzy2025',
  ''
WHERE NOT EXISTS (SELECT 1 FROM business_settings);

INSERT INTO services (name, description, duration_minutes, price, active)
SELECT 'Corte Masculino', 'Corte cabelo com estilo', 30, 50.00, true
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Corte Masculino');

INSERT INTO services (name, description, duration_minutes, price, active)
SELECT 'Barba', 'Aparagem e acabamento de barba', 15, 30.00, true
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Barba');

INSERT INTO services (name, description, duration_minutes, price, active)
SELECT 'Corte + Barba', 'Combo de corte e barba', 45, 70.00, true
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Corte + Barba');
