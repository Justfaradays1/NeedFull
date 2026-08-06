-- WHAT: Runner availability posts — "I am available if you need this service"
-- WHY: Posters discover nearby runners by service, not just by browsing tasks.
--      This is a discovery signal ONLY — the escrow/payment flow is unchanged.

CREATE TABLE IF NOT EXISTS runner_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  runner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id),
  note text NOT NULL DEFAULT '',
  available_until timestamptz NULL,
  max_travel_km numeric NOT NULL DEFAULT 5 CHECK (max_travel_km > 0),
  is_online_today boolean NOT NULL DEFAULT true,
  location_label text NULL,
  location geography(Point, 4326) NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_runner_availability_runner
  ON runner_availability (runner_id) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_runner_availability_category
  ON runner_availability (category_id) WHERE is_active = true;