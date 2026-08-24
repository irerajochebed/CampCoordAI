-- =============================================================================
-- CampCoordAI - Official Organization Units Seed Data (PostgreSQL)
-- Rwanda Union Mission (RUM) Organizational Hierarchy up to DISTRICT Level ONLY
-- =============================================================================

-- 0. Ensure PostgreSQL check constraint permits 'CHURCH' level
ALTER TABLE organization_units DROP CONSTRAINT IF EXISTS organization_units_level_check;
UPDATE organization_units SET level = 'CHURCH' WHERE level IS NOT NULL AND level NOT IN ('UNION', 'FIELD', 'DISTRICT', 'CHURCH');
ALTER TABLE organization_units ADD CONSTRAINT organization_units_level_check CHECK (level IN ('UNION', 'FIELD', 'DISTRICT', 'CHURCH'));

-- 0.1 Migration: Update legacy district codes to match official NRF codes
UPDATE organization_units SET code = 'NRF-BUKO' WHERE code = 'NRF-BUK';
UPDATE organization_units SET code = 'NRF-BUK' WHERE code = 'NRF-BKA';
UPDATE organization_units SET code = 'NRF-KIV' WHERE code = 'NRF-KVY';
UPDATE organization_units SET code = 'NRF-RUHA' WHERE code = 'NRF-RUH';
UPDATE organization_units SET code = 'NRF-RUH' WHERE code = 'NRF-RHO';
UPDATE organization_units SET code = 'NRF-NKUM' WHERE code = 'NRF-NKU';
UPDATE organization_units SET code = 'NRF-NKU' WHERE code = 'NRF-NKL';
UPDATE organization_units SET code = 'NRF-RWA' WHERE code = 'NRF-RWN';
UPDATE organization_units SET code = 'NRF-BUB' WHERE code = 'NRF-BBE';
UPDATE organization_units SET code = 'NRF-KIVU' WHERE code = 'NRF-KIV' AND name LIKE 'Kivuruga%';
UPDATE organization_units SET code = 'NRF-BUHO' WHERE code = 'NRF-BUH';

-- 1. Level 1: UNION
INSERT INTO organization_units (name, code, level, location, parent_id, is_custom, deleted, created_at, updated_at)
VALUES ('Rwanda Union Mission', 'RUM', 'UNION', 'Kigali, Rwanda', NULL, false, false, NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET 
    name = EXCLUDED.name, 
    level = EXCLUDED.level, 
    location = EXCLUDED.location,
    updated_at = NOW();

-- 2. Level 2: 8 FIELDS under RUM
INSERT INTO organization_units (name, code, level, location, parent_id, is_custom, deleted, created_at, updated_at)
VALUES 
    ('North Rwanda Field', 'NRF', 'FIELD', 'Musanze', (SELECT id FROM organization_units WHERE code = 'RUM' LIMIT 1), false, false, NOW(), NOW()),
    ('East Central Rwanda Field', 'ECRF', 'FIELD', 'Kigali', (SELECT id FROM organization_units WHERE code = 'RUM' LIMIT 1), false, false, NOW(), NOW()),
    ('North-East Rwanda Field', 'NERF', 'FIELD', 'Nyagatare', (SELECT id FROM organization_units WHERE code = 'RUM' LIMIT 1), false, false, NOW(), NOW()),
    ('South-East Rwanda Field', 'SERF', 'FIELD', 'Ngoma', (SELECT id FROM organization_units WHERE code = 'RUM' LIMIT 1), false, false, NOW(), NOW()),
    ('North-West Rwanda Field', 'NWRF', 'FIELD', 'Rubavu', (SELECT id FROM organization_units WHERE code = 'RUM' LIMIT 1), false, false, NOW(), NOW()),
    ('West Rwanda Field', 'WRF', 'FIELD', 'Karongi', (SELECT id FROM organization_units WHERE code = 'RUM' LIMIT 1), false, false, NOW(), NOW()),
    ('South Rwanda Field', 'SRF', 'FIELD', 'Southern Province', (SELECT id FROM organization_units WHERE code = 'RUM' LIMIT 1), false, false, NOW(), NOW()),
    ('Central Rwanda Field', 'CRF', 'FIELD', 'Muhanga / Gitwe', (SELECT id FROM organization_units WHERE code = 'RUM' LIMIT 1), false, false, NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET 
    name = EXCLUDED.name, 
    level = EXCLUDED.level, 
    location = EXCLUDED.location,
    parent_id = EXCLUDED.parent_id,
    updated_at = NOW();

-- 3. Level 3: 34 OFFICIAL DISTRICTS UNDER NORTH RWANDA FIELD (NRF)
INSERT INTO organization_units (name, code, level, location, parent_id, is_custom, deleted, created_at, updated_at)
VALUES 
    ('Bukamba District', 'NRF-BUK', 'DISTRICT', 'Bukamba Zone, Musanze', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Kivuye District', 'NRF-KIV', 'DISTRICT', 'Ndorwa Zone, Gicumbi', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Musanze District', 'NRF-MUS', 'DISTRICT', 'Kigombe Zone, Musanze', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Gasiho District', 'NRF-GAS', 'DISTRICT', 'Kibali Zone, Gicumbi', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Ruhondo District', 'NRF-RUH', 'DISTRICT', 'Bukamba Zone, Musanze', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Kabere District', 'NRF-KAB', 'DISTRICT', 'Kigombe Zone, Musanze', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Nkuli District', 'NRF-NKU', 'DISTRICT', 'Nkuli Zone, Nyabihu', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Kidaho District', 'NRF-KID', 'DISTRICT', 'Bukamba Zone, Musanze', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('CAR District', 'NRF-CAR', 'DISTRICT', 'Nkuli Zone, Nyabihu', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Kibali District', 'NRF-KIB', 'DISTRICT', 'Kibali Zone, Gicumbi', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Rwankeri District', 'NRF-RWA', 'DISTRICT', 'Nkuli Zone, Nyabihu', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Kigombe District', 'NRF-KIG', 'DISTRICT', 'Kigombe Zone, Musanze', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Joma District', 'NRF-JOM', 'DISTRICT', 'Kibali Zone, Gicumbi', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Ruhanga District', 'NRF-RUHA', 'DISTRICT', 'Bukamba Zone, Musanze', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Nkumba District', 'NRF-NKUM', 'DISTRICT', 'Bukamba Zone, Musanze', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Kinigi District', 'NRF-KIN', 'DISTRICT', 'Bukamba Zone, Musanze', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Mataba District', 'NRF-MAT', 'DISTRICT', 'Kibali Zone, Gicumbi', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Bugarura District', 'NRF-BUG', 'DISTRICT', 'Kigombe Zone, Musanze', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Kalinzi District', 'NRF-KAL', 'DISTRICT', 'Kigombe Zone, Musanze', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Kirambo District', 'NRF-KIR', 'DISTRICT', 'Ndorwa Zone, Gicumbi', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Runoga District', 'NRF-RUN', 'DISTRICT', 'Kibali Zone, Gicumbi', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Buberuka District', 'NRF-BUB', 'DISTRICT', 'Ndorwa Zone, Gicumbi', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Mugali District', 'NRF-MUG', 'DISTRICT', 'Nkuli Zone, Nyabihu', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Buhoma District', 'NRF-BUHO', 'DISTRICT', 'Nkuli Zone, Nyabihu', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Nyarugina District', 'NRF-NYA', 'DISTRICT', 'Bukamba Zone, Musanze', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Kivuruga District', 'NRF-KIVU', 'DISTRICT', 'Kibali Zone, Gicumbi', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Marangara District', 'NRF-MAR', 'DISTRICT', 'Nkuli Zone, Nyabihu', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Bwuzuri District', 'NRF-BWU', 'DISTRICT', 'Kigombe Zone, Musanze', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Bukonya District', 'NRF-BUKO', 'DISTRICT', 'Kigombe Zone, Musanze', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Ndusu District', 'NRF-NDU', 'DISTRICT', 'Kigombe Zone, Musanze', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Munyana District', 'NRF-MUN', 'DISTRICT', 'Kibali Zone, Gicumbi', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Ndorwa District', 'NRF-NDO', 'DISTRICT', 'Ndorwa Zone, Gicumbi', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Rutovu District', 'NRF-RUT', 'DISTRICT', 'Ndorwa Zone, Gicumbi', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Mucaca District', 'NRF-MUC', 'DISTRICT', 'Ndorwa Zone, Gicumbi', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET 
    name = EXCLUDED.name, 
    level = EXCLUDED.level, 
    location = EXCLUDED.location,
    parent_id = EXCLUDED.parent_id,
    updated_at = NOW();

