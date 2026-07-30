-- WHAT: Rename and standardize category names across NeedFull
-- WHY: Ensure consistent, professional category names everywhere in the app
-- RUN: Execute this in Supabase SQL Editor

-- Rename categories to clean, standardized names
UPDATE categories SET name = 'Laundry & Washing', icon = '🧺' WHERE LOWER(name) LIKE '%laundry%';
UPDATE categories SET name = 'Delivery & Errands', icon = '🛵' WHERE LOWER(name) LIKE '%delivery%';
UPDATE categories SET name = 'Cleaning', icon = '🧹' WHERE LOWER(name) LIKE '%clean%';
UPDATE categories SET name = 'Printing & Binding', icon = '🖨' WHERE LOWER(name) LIKE '%print%';
UPDATE categories SET name = 'Shopping', icon = '🛒' WHERE LOWER(name) LIKE '%shop%';
UPDATE categories SET name = 'Food Runs', icon = '🍔' WHERE LOWER(name) LIKE '%food%';
UPDATE categories SET name = 'Tech Support', icon = '💻' WHERE LOWER(name) = 'tech';
UPDATE categories SET name = 'Graphic Design', icon = '🎨' WHERE LOWER(name) LIKE '%design%' OR LOWER(name) = 'graphic';
UPDATE categories SET name = 'Photography', icon = '📷' WHERE LOWER(name) LIKE '%photo%';
UPDATE categories SET name = 'Repairs & Maintenance', icon = '🛠' WHERE LOWER(name) LIKE '%repair%' OR LOWER(name) = 'handyman';
UPDATE categories SET name = 'Moving Help', icon = '📦' WHERE LOWER(name) LIKE '%mov%';
UPDATE categories SET name = 'Academic Assistance', icon = '📚' WHERE LOWER(name) LIKE '%assign%' OR LOWER(name) LIKE '%tutor%' OR LOWER(name) LIKE '%academic%';
UPDATE categories SET name = 'Other / Custom', icon = '✨' WHERE LOWER(name) = 'other' OR LOWER(name) = 'event';

-- Set sort_order for consistent ordering
UPDATE categories SET sort_order = 1 WHERE name = 'Laundry & Washing';
UPDATE categories SET sort_order = 2 WHERE name = 'Delivery & Errands';
UPDATE categories SET sort_order = 3 WHERE name = 'Cleaning';
UPDATE categories SET sort_order = 4 WHERE name = 'Printing & Binding';
UPDATE categories SET sort_order = 5 WHERE name = 'Shopping';
UPDATE categories SET sort_order = 6 WHERE name = 'Food Runs';
UPDATE categories SET sort_order = 7 WHERE name = 'Tech Support';
UPDATE categories SET sort_order = 8 WHERE name = 'Graphic Design';
UPDATE categories SET sort_order = 9 WHERE name = 'Photography';
UPDATE categories SET sort_order = 10 WHERE name = 'Repairs & Maintenance';
UPDATE categories SET sort_order = 11 WHERE name = 'Moving Help';
UPDATE categories SET sort_order = 12 WHERE name = 'Academic Assistance';
UPDATE categories SET sort_order = 13 WHERE name = 'Other / Custom';

-- Activate all and ensure descriptions are set
UPDATE categories SET is_active = true;
