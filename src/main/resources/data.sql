-- =============================================================================
-- CampCoordAI - Official Organization Units & Leadership Seed Data (PostgreSQL)
-- North Rwanda Field (NRF) & Rwanda Union Mission (RUM) Full Hierarchy & Leaders
-- =============================================================================

-- 0. Ensure PostgreSQL check constraints do not block valid enum values
ALTER TABLE departments DROP CONSTRAINT IF EXISTS departments_type_check;
ALTER TABLE organization_units DROP CONSTRAINT IF EXISTS organization_units_level_check;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_position_check;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_gender_check;
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_type_check;
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_status_check;
ALTER TABLE proposals DROP CONSTRAINT IF EXISTS proposals_status_check;
ALTER TABLE proposals DROP CONSTRAINT IF EXISTS proposals_scope_check;
ALTER TABLE registrations DROP CONSTRAINT IF EXISTS registrations_status_check;
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_status_check;
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_method_check;
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_session_type_check;
ALTER TABLE resources DROP CONSTRAINT IF EXISTS resources_resource_type_check;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- 0.1 AI Insights Table Creation (if not exists)
CREATE TABLE IF NOT EXISTS ai_insights (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL,
    generated_at TIMESTAMP NOT NULL,
    window_label VARCHAR(50),
    predicted_attendance INT,
    confidence VARCHAR(20),
    risk_level VARCHAR(20),
    risks TEXT,
    recommendations TEXT,
    summary_text TEXT,
    provider_used VARCHAR(50),
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ai_insights_event_id ON ai_insights(event_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_window ON ai_insights(event_id, window_label);
ALTER TABLE ai_insights DROP CONSTRAINT IF EXISTS ai_insights_risk_level_check;
ALTER TABLE ai_insights DROP CONSTRAINT IF EXISTS ai_insights_confidence_check;

-- 0.3 District code standardizations
UPDATE organization_units SET code = 'NRF-BUKO' WHERE code = 'NRF-BUK' AND name LIKE '%Bukonya%';
UPDATE organization_units SET code = 'NRF-BUK' WHERE code = 'NRF-BKA' OR (name LIKE '%Bukamba%' AND code = 'NRF-BUKO');
UPDATE organization_units SET code = 'NRF-KIV' WHERE code = 'NRF-KVY' OR (name LIKE '%Kivuye%' AND code = 'NRF-KIVU');
UPDATE organization_units SET code = 'NRF-RUHA' WHERE code = 'NRF-RUH' AND name LIKE '%Ruhanga%';
UPDATE organization_units SET code = 'NRF-RUH' WHERE code = 'NRF-RHO' OR (name LIKE '%Ruhondo%' AND code = 'NRF-RUHA');
UPDATE organization_units SET code = 'NRF-NKUM' WHERE code = 'NRF-NKU' AND name LIKE '%Nkumba%';
UPDATE organization_units SET code = 'NRF-NKU' WHERE code = 'NRF-NKL' OR (name LIKE '%Nkuli%' AND code = 'NRF-NKUM');
UPDATE organization_units SET code = 'NRF-RWA' WHERE code = 'NRF-RWN';
UPDATE organization_units SET code = 'NRF-BUB' WHERE code = 'NRF-BBE';
UPDATE organization_units SET code = 'NRF-KIVU' WHERE name LIKE '%Kivuruga%';
UPDATE organization_units SET code = 'NRF-BUHO' WHERE code = 'NRF-BUH';

-- =============================================================================
-- 1. LEVEL 1: RWANDA UNION MISSION (UNION)
-- =============================================================================
INSERT INTO organization_units (name, code, level, location, contact_email, contact_phone, parent_id, is_custom, deleted, created_at, updated_at)
VALUES ('Rwanda Union Mission', 'RUM', 'UNION', 'Kigali, Rwanda', 'info@rumadventist.org', '+250788000000', NULL, false, false, NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET 
    name = EXCLUDED.name, 
    level = EXCLUDED.level, 
    location = EXCLUDED.location,
    contact_email = EXCLUDED.contact_email,
    contact_phone = EXCLUDED.contact_phone,
    updated_at = NOW();

-- =============================================================================
-- 2. LEVEL 2: 8 FIELDS UNDER RWANDA UNION MISSION
-- =============================================================================
INSERT INTO organization_units (name, code, level, location, contact_email, contact_phone, parent_id, is_custom, deleted, created_at, updated_at)
VALUES 
    ('North Rwanda Field', 'NRF', 'FIELD', 'Musanze, Northern Province', 'info@nrf.rumadventist.org', '+250788756534', (SELECT id FROM organization_units WHERE code = 'RUM' LIMIT 1), false, false, NOW(), NOW()),
    ('Central Rwanda Field', 'CRF', 'FIELD', 'Muhanga, Southern Province', 'crf@rumadventist.org', '+250788100001', (SELECT id FROM organization_units WHERE code = 'RUM' LIMIT 1), false, false, NOW(), NOW()),
    ('East Central Rwanda Field', 'ECRF', 'FIELD', 'Kigali City', 'ecrf@rumadventist.org', '+250788100002', (SELECT id FROM organization_units WHERE code = 'RUM' LIMIT 1), false, false, NOW(), NOW()),
    ('North-East Rwanda Field', 'NERF', 'FIELD', 'Nyagatare, Eastern Province', 'nerf@rumadventist.org', '+250788100004', (SELECT id FROM organization_units WHERE code = 'RUM' LIMIT 1), false, false, NOW(), NOW()),
    ('North-West Rwanda Field', 'NWRF', 'FIELD', 'Rubavu, Western Province', 'nwrf@rumadventist.org', '+250788100005', (SELECT id FROM organization_units WHERE code = 'RUM' LIMIT 1), false, false, NOW(), NOW()),
    ('South Rwanda Field', 'SRF', 'FIELD', 'Huye, Southern Province', 'srf@rumadventist.org', '+250788100006', (SELECT id FROM organization_units WHERE code = 'RUM' LIMIT 1), false, false, NOW(), NOW()),
    ('South-East Rwanda Field', 'SERF', 'FIELD', 'Ngoma, Eastern Province', 'serf@rumadventist.org', '+250788100007', (SELECT id FROM organization_units WHERE code = 'RUM' LIMIT 1), false, false, NOW(), NOW()),
    ('West Rwanda Field', 'WRF', 'FIELD', 'Karongi, Western Province', 'wrf@rumadventist.org', '+250788100008', (SELECT id FROM organization_units WHERE code = 'RUM' LIMIT 1), false, false, NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET 
    name = EXCLUDED.name, 
    level = EXCLUDED.level, 
    location = EXCLUDED.location,
    contact_email = EXCLUDED.contact_email,
    contact_phone = EXCLUDED.contact_phone,
    parent_id = EXCLUDED.parent_id,
    updated_at = NOW();

-- =============================================================================
-- 3. LEVEL 3: 34 OFFICIAL DISTRICTS UNDER NORTH RWANDA FIELD (NRF)
-- Extracted from Official 2026 NRF Report
-- =============================================================================
INSERT INTO organization_units (name, code, level, location, contact_email, contact_phone, parent_id, is_custom, deleted, created_at, updated_at)
VALUES 
    ('Bukamba District', 'NRF-BUK', 'DISTRICT', 'Bukamba Zone, Musanze', 'bukamba@nrf.rumadventist.org', '+250788001001', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Kivuye District', 'NRF-KIV', 'DISTRICT', 'Ndorwa Zone, Gicumbi', 'kivuye@nrf.rumadventist.org', '+250788001002', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Musanze District', 'NRF-MUS', 'DISTRICT', 'Kigombe Zone, Musanze', 'musanze@nrf.rumadventist.org', '+250788001003', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Gasiho District', 'NRF-GAS', 'DISTRICT', 'Kibali Zone, Gicumbi', 'gasiho@nrf.rumadventist.org', '+250788001004', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Ruhondo District', 'NRF-RUH', 'DISTRICT', 'Bukamba Zone, Musanze', 'ruhondo@nrf.rumadventist.org', '+250788001005', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Kabere District', 'NRF-KAB', 'DISTRICT', 'Kigombe Zone, Musanze', 'kabere@nrf.rumadventist.org', '+250788001006', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Nkuli District', 'NRF-NKU', 'DISTRICT', 'Nkuli Zone, Nyabihu', 'nkuli@nrf.rumadventist.org', '+250788001007', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Kidaho District', 'NRF-KID', 'DISTRICT', 'Bukamba Zone, Musanze', 'kidaho@nrf.rumadventist.org', '+250788001008', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('CAR District', 'NRF-CAR', 'DISTRICT', 'Nkuli Zone, Nyabihu', 'car@nrf.rumadventist.org', '+250788001009', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Kibali District', 'NRF-KIB', 'DISTRICT', 'Kibali Zone, Gicumbi', 'kibali@nrf.rumadventist.org', '+250788001010', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Rwankeri District', 'NRF-RWA', 'DISTRICT', 'Nkuli Zone, Nyabihu', 'rwankeri@nrf.rumadventist.org', '+250788001011', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Kigombe District', 'NRF-KIG', 'DISTRICT', 'Kigombe Zone, Musanze', 'kigombe@nrf.rumadventist.org', '+250788001012', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Joma District', 'NRF-JOM', 'DISTRICT', 'Kibali Zone, Gicumbi', 'joma@nrf.rumadventist.org', '+250788001013', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Ruhanga District', 'NRF-RUHA', 'DISTRICT', 'Bukamba Zone, Musanze', 'ruhanga@nrf.rumadventist.org', '+250788001014', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Nkumba District', 'NRF-NKUM', 'DISTRICT', 'Bukamba Zone, Musanze', 'nkumba@nrf.rumadventist.org', '+250788001015', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Kinigi District', 'NRF-KIN', 'DISTRICT', 'Bukamba Zone, Musanze', 'kinigi@nrf.rumadventist.org', '+250788001016', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Mataba District', 'NRF-MAT', 'DISTRICT', 'Kibali Zone, Gicumbi', 'mataba@nrf.rumadventist.org', '+250788001017', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Bugarura District', 'NRF-BUG', 'DISTRICT', 'Kigombe Zone, Musanze', 'bugarura@nrf.rumadventist.org', '+250788001018', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Kalinzi District', 'NRF-KAL', 'DISTRICT', 'Kigombe Zone, Musanze', 'kalinzi@nrf.rumadventist.org', '+250788001019', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Kirambo District', 'NRF-KIR', 'DISTRICT', 'Ndorwa Zone, Gicumbi', 'kirambo@nrf.rumadventist.org', '+250788001020', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Runoga District', 'NRF-RUN', 'DISTRICT', 'Kibali Zone, Gicumbi', 'runoga@nrf.rumadventist.org', '+250788001021', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Buberuka District', 'NRF-BUB', 'DISTRICT', 'Ndorwa Zone, Gicumbi', 'buberuka@nrf.rumadventist.org', '+250788001022', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Mugali District', 'NRF-MUG', 'DISTRICT', 'Nkuli Zone, Nyabihu', 'mugali@nrf.rumadventist.org', '+250788001023', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Buhoma District', 'NRF-BUHO', 'DISTRICT', 'Nkuli Zone, Nyabihu', 'buhoma@nrf.rumadventist.org', '+250788001024', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Nyarugina District', 'NRF-NYA', 'DISTRICT', 'Bukamba Zone, Musanze', 'nyarugina@nrf.rumadventist.org', '+250788001025', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Kivuruga District', 'NRF-KIVU', 'DISTRICT', 'Kibali Zone, Gicumbi', 'kivuruga@nrf.rumadventist.org', '+250788001026', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Marangara District', 'NRF-MAR', 'DISTRICT', 'Nkuli Zone, Nyabihu', 'marangara@nrf.rumadventist.org', '+250788001027', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Bwuzuri District', 'NRF-BWU', 'DISTRICT', 'Kigombe Zone, Musanze', 'bwuzuri@nrf.rumadventist.org', '+250788001028', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Bukonya District', 'NRF-BUKO', 'DISTRICT', 'Kigombe Zone, Musanze', 'bukonya@nrf.rumadventist.org', '+250788001029', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Ndusu District', 'NRF-NDU', 'DISTRICT', 'Kigombe Zone, Musanze', 'ndusu@nrf.rumadventist.org', '+250788001030', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Munyana District', 'NRF-MUN', 'DISTRICT', 'Kibali Zone, Gicumbi', 'munyana@nrf.rumadventist.org', '+250788001031', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Ndorwa District', 'NRF-NDO', 'DISTRICT', 'Ndorwa Zone, Gicumbi', 'ndorwa@nrf.rumadventist.org', '+250788001032', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Rutovu District', 'NRF-RUT', 'DISTRICT', 'Ndorwa Zone, Gicumbi', 'rutovu@nrf.rumadventist.org', '+250788001033', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW()),
    ('Mucaca District', 'NRF-MUC', 'DISTRICT', 'Ndorwa Zone, Gicumbi', 'mucaca@nrf.rumadventist.org', '+250788001034', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), false, false, NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET 
    name = EXCLUDED.name, 
    level = EXCLUDED.level, 
    location = EXCLUDED.location,
    contact_email = EXCLUDED.contact_email,
    contact_phone = EXCLUDED.contact_phone,
    parent_id = EXCLUDED.parent_id,
    updated_at = NOW();

-- =============================================================================
-- 4. LEVEL 4: RESPONSIVE LOCAL CHURCHES UNDER NRF DISTRICTS
-- =============================================================================
INSERT INTO organization_units (name, code, level, location, parent_id, is_custom, deleted, created_at, updated_at)
VALUES 
    ('Bukamba Central Church', 'CH-BUK-1', 'CHURCH', 'Bukamba, Musanze', (SELECT id FROM organization_units WHERE code = 'NRF-BUK' LIMIT 1), false, false, NOW(), NOW()),
    ('Kivuye Central Church', 'CH-KIV-1', 'CHURCH', 'Kivuye, Gicumbi', (SELECT id FROM organization_units WHERE code = 'NRF-KIV' LIMIT 1), false, false, NOW(), NOW()),
    ('Musanze Central Church', 'CH-MUS-1', 'CHURCH', 'Musanze City', (SELECT id FROM organization_units WHERE code = 'NRF-MUS' LIMIT 1), false, false, NOW(), NOW()),
    ('Gasiho Central Church', 'CH-GAS-1', 'CHURCH', 'Gasiho, Gicumbi', (SELECT id FROM organization_units WHERE code = 'NRF-GAS' LIMIT 1), false, false, NOW(), NOW()),
    ('Ruhondo Central Church', 'CH-RUH-1', 'CHURCH', 'Ruhondo, Musanze', (SELECT id FROM organization_units WHERE code = 'NRF-RUH' LIMIT 1), false, false, NOW(), NOW()),
    ('Kabere Central Church', 'CH-KAB-1', 'CHURCH', 'Kabere, Musanze', (SELECT id FROM organization_units WHERE code = 'NRF-KAB' LIMIT 1), false, false, NOW(), NOW()),
    ('Nkuli Central Church', 'CH-NKU-1', 'CHURCH', 'Nkuli, Nyabihu', (SELECT id FROM organization_units WHERE code = 'NRF-NKU' LIMIT 1), false, false, NOW(), NOW()),
    ('Kidaho Central Church', 'CH-KID-1', 'CHURCH', 'Kidaho, Musanze', (SELECT id FROM organization_units WHERE code = 'NRF-KID' LIMIT 1), false, false, NOW(), NOW()),
    ('CAR Campus Church', 'CH-CAR-1', 'CHURCH', 'Rwankeri Campus, Nyabihu', (SELECT id FROM organization_units WHERE code = 'NRF-CAR' LIMIT 1), false, false, NOW(), NOW()),
    ('Kibali Central Church', 'CH-KIB-1', 'CHURCH', 'Kibali, Gicumbi', (SELECT id FROM organization_units WHERE code = 'NRF-KIB' LIMIT 1), false, false, NOW(), NOW()),
    ('Rwankeri Central Church', 'CH-RWA-1', 'CHURCH', 'Rwankeri, Nyabihu', (SELECT id FROM organization_units WHERE code = 'NRF-RWA' LIMIT 1), false, false, NOW(), NOW()),
    ('Kigombe Central Church', 'CH-KIG-1', 'CHURCH', 'Kigombe, Musanze', (SELECT id FROM organization_units WHERE code = 'NRF-KIG' LIMIT 1), false, false, NOW(), NOW()),
    ('Joma Central Church', 'CH-JOM-1', 'CHURCH', 'Joma, Gicumbi', (SELECT id FROM organization_units WHERE code = 'NRF-JOM' LIMIT 1), false, false, NOW(), NOW()),
    ('Ruhanga Central Church', 'CH-RUHA-1', 'CHURCH', 'Ruhanga, Musanze', (SELECT id FROM organization_units WHERE code = 'NRF-RUHA' LIMIT 1), false, false, NOW(), NOW()),
    ('Nkumba Central Church', 'CH-NKUM-1', 'CHURCH', 'Nkumba, Musanze', (SELECT id FROM organization_units WHERE code = 'NRF-NKUM' LIMIT 1), false, false, NOW(), NOW()),
    ('Kinigi Central Church', 'CH-KIN-1', 'CHURCH', 'Kinigi, Musanze', (SELECT id FROM organization_units WHERE code = 'NRF-KIN' LIMIT 1), false, false, NOW(), NOW()),
    ('Mataba Central Church', 'CH-MAT-1', 'CHURCH', 'Mataba, Gicumbi', (SELECT id FROM organization_units WHERE code = 'NRF-MAT' LIMIT 1), false, false, NOW(), NOW()),
    ('Bugarura Central Church', 'CH-BUG-1', 'CHURCH', 'Bugarura, Musanze', (SELECT id FROM organization_units WHERE code = 'NRF-BUG' LIMIT 1), false, false, NOW(), NOW()),
    ('Kalinzi Central Church', 'CH-KAL-1', 'CHURCH', 'Kalinzi, Musanze', (SELECT id FROM organization_units WHERE code = 'NRF-KAL' LIMIT 1), false, false, NOW(), NOW()),
    ('Kirambo Central Church', 'CH-KIR-1', 'CHURCH', 'Kirambo, Gicumbi', (SELECT id FROM organization_units WHERE code = 'NRF-KIR' LIMIT 1), false, false, NOW(), NOW()),
    ('Runoga Central Church', 'CH-RUN-1', 'CHURCH', 'Runoga, Gicumbi', (SELECT id FROM organization_units WHERE code = 'NRF-RUN' LIMIT 1), false, false, NOW(), NOW()),
    ('Buberuka Central Church', 'CH-BUB-1', 'CHURCH', 'Buberuka, Gicumbi', (SELECT id FROM organization_units WHERE code = 'NRF-BUB' LIMIT 1), false, false, NOW(), NOW()),
    ('Mugali Central Church', 'CH-MUG-1', 'CHURCH', 'Mugali, Nyabihu', (SELECT id FROM organization_units WHERE code = 'NRF-MUG' LIMIT 1), false, false, NOW(), NOW()),
    ('Buhoma Central Church', 'CH-BUHO-1', 'CHURCH', 'Buhoma, Nyabihu', (SELECT id FROM organization_units WHERE code = 'NRF-BUHO' LIMIT 1), false, false, NOW(), NOW()),
    ('Nyarugina Central Church', 'CH-NYA-1', 'CHURCH', 'Nyarugina, Musanze', (SELECT id FROM organization_units WHERE code = 'NRF-NYA' LIMIT 1), false, false, NOW(), NOW()),
    ('Kivuruga Central Church', 'CH-KIVU-1', 'CHURCH', 'Kivuruga, Gicumbi', (SELECT id FROM organization_units WHERE code = 'NRF-KIVU' LIMIT 1), false, false, NOW(), NOW()),
    ('Marangara Central Church', 'CH-MAR-1', 'CHURCH', 'Marangara, Nyabihu', (SELECT id FROM organization_units WHERE code = 'NRF-MAR' LIMIT 1), false, false, NOW(), NOW()),
    ('Bwuzuri Central Church', 'CH-BWU-1', 'CHURCH', 'Bwuzuri, Musanze', (SELECT id FROM organization_units WHERE code = 'NRF-BWU' LIMIT 1), false, false, NOW(), NOW()),
    ('Bukonya Central Church', 'CH-BUKO-1', 'CHURCH', 'Bukonya, Musanze', (SELECT id FROM organization_units WHERE code = 'NRF-BUKO' LIMIT 1), false, false, NOW(), NOW()),
    ('Ndusu Central Church', 'CH-NDU-1', 'CHURCH', 'Ndusu, Musanze', (SELECT id FROM organization_units WHERE code = 'NRF-NDU' LIMIT 1), false, false, NOW(), NOW()),
    ('Munyana Central Church', 'CH-MUN-1', 'CHURCH', 'Munyana, Gicumbi', (SELECT id FROM organization_units WHERE code = 'NRF-MUN' LIMIT 1), false, false, NOW(), NOW()),
    ('Ndorwa Central Church', 'CH-NDO-1', 'CHURCH', 'Ndorwa, Gicumbi', (SELECT id FROM organization_units WHERE code = 'NRF-NDO' LIMIT 1), false, false, NOW(), NOW()),
    ('Rutovu Central Church', 'CH-RUT-1', 'CHURCH', 'Rutovu, Gicumbi', (SELECT id FROM organization_units WHERE code = 'NRF-RUT' LIMIT 1), false, false, NOW(), NOW()),
    ('Mucaca Central Church', 'CH-MUC-1', 'CHURCH', 'Mucaca, Gicumbi', (SELECT id FROM organization_units WHERE code = 'NRF-MUC' LIMIT 1), false, false, NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET 
    name = EXCLUDED.name, 
    level = EXCLUDED.level, 
    location = EXCLUDED.location,
    parent_id = EXCLUDED.parent_id,
    updated_at = NOW();

-- =============================================================================
-- 5. OFFICIAL 17 RUM & NRF MINISTRIES (DEPARTMENTS)
-- =============================================================================
INSERT INTO departments (type, name, description, deleted, created_at, updated_at)
VALUES 
    ('YOUTH', 'Youth Ministries', 'Adventist Youth Ministries (AYM) focused on young people spiritual growth, Pathfinder and Adventurer clubs, and youth camps', false, NOW(), NOW()),
    ('WOMEN', 'Women Ministries (MIFEM)', 'Ministères Féminins — Empowering Adventist women in leadership, evangelism, and family care', false, NOW(), NOW()),
    ('CHILDREN', 'Children Ministries', 'Ministry dedicated to children spiritual education, Sabbath school classes, and Bible clubs', false, NOW(), NOW()),
    ('FAMILY', 'Family Ministries', 'Supporting and strengthening Christian marriages, parenting, and Adventist home life', false, NOW(), NOW()),
    ('MINISTERIAL', 'Ministerial Association & Spouses', 'Supporting pastors, elders, evangelists, and ministerial spouses across fields', false, NOW(), NOW()),
    ('PERSONAL_MINISTRIES', 'Personal Ministries & Sabbath School', 'Fostering personal Bible study, outreach, discipleship programs, and Sabbath School classes', false, NOW(), NOW()),
    ('CHAPLAINCY', 'Adventist Chaplaincy Ministries (ACM)', 'Chaplaincy services in schools, universities, hospitals, correctional institutions, and military', false, NOW(), NOW()),
    ('POSSIBILITY', 'Adventist Possibility Ministries (APM)', 'Promoting inclusion, accessibility, and support for individuals with special needs and disabilities', false, NOW(), NOW()),
    ('HEALTH', 'Health Ministries', 'Promoting holistic healing and health principles caring for physical, mental, and spiritual wellness', false, NOW(), NOW()),
    ('PUBLISHING', 'Publishing Ministries', 'Literature evangelism, publishing, and Christian book distribution ministry', false, NOW(), NOW()),
    ('STEWARDSHIP', 'Stewardship Ministries', 'Biblical stewardship education, tithing faithfulness, and resource management', false, NOW(), NOW()),
    ('PARL', 'Public Affairs & Religious Liberty (PARL)', 'Promoting religious freedom, human rights, freedom of conscience, and inter-organizational relations', false, NOW(), NOW()),
    ('EDUCATION', 'Education Department', 'Overseeing Adventist educational institutions, schools, teacher training, and Christian pedagogy', false, NOW(), NOW()),
    ('COMMUNICATION', 'Communication Department', 'Media relations, digital evangelism, Voice of Hope Radio, and broadcasting', false, NOW(), NOW()),
    ('EVANGELISM', 'Evangelism & Adventist Mission', 'The Great Commission of making disciples, public evangelism crusades, and church planting', false, NOW(), NOW()),
    ('REVIVAL_REFORMATION', 'Revival and Reformation', 'Spiritual revival initiatives, prayer emphasis, and holy living in preparation for Christ return', false, NOW(), NOW()),
    ('MUSIC', 'Music & Choir Ministries', 'Elevating worship through sacred music, choir coordination, and hymnody', false, NOW(), NOW())
ON CONFLICT (type) DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    updated_at = NOW();

-- =============================================================================
-- 6. RECORDING ALL NRF & RUM LEADERS INTO DATABASE
-- Password hash for all seeded accounts: $2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq
-- Corresponding Plain Password: Admin@2026 / Pastor@2026 / Leader@2026
-- =============================================================================

-- 6.1 Administrator User
INSERT INTO users (first_name, last_name, email, phone_number, password, role, position, gender, organization_unit_id, active, deleted, created_at, updated_at)
VALUES ('System', 'Administrator', 'admin@campcoordai.rw', '+250788123456', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'ADMINISTRATOR', 'UNION_ADMINISTRATOR', 'MALE', (SELECT id FROM organization_units WHERE code = 'RUM' LIMIT 1), true, false, NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET 
    role = EXCLUDED.role, 
    position = EXCLUDED.position,
    organization_unit_id = EXCLUDED.organization_unit_id,
    active = true;

-- 6.2 NRF Field Officers & Administration
INSERT INTO users (first_name, last_name, email, phone_number, password, role, position, gender, organization_unit_id, active, deleted, created_at, updated_at)
VALUES 
    ('SETAKO', 'Sophonie', 'president@nrf.rumadventist.org', '+250788756534', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'COORDINATOR', 'FIELD_LEADER', 'MALE', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), true, false, NOW(), NOW()),
    ('Jean Nepo', 'Rutikanga', 'exec@nrf.rumadventist.org', '+250788756535', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'COORDINATOR', 'FIELD_LEADER', 'MALE', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), true, false, NOW(), NOW()),
    ('Kageruka Elly', 'Nkuba', 'treasurer@nrf.rumadventist.org', '+250788354912', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'COORDINATOR', 'FINANCE_OFFICER', 'MALE', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), true, false, NOW(), NOW()),
    ('Jackson', 'NIYITEGEKA', 'asstreasurer@nrf.rumadventist.org', '+250788354913', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'COORDINATOR', 'FINANCE_OFFICER', 'MALE', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), true, false, NOW(), NOW()),
    ('MUKAYUHI N.', 'Judith', 'assistantexec@nrf.rumadventist.org', '+250788354914', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'COORDINATOR', 'CAMP_SECRETARY', 'FEMALE', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), true, false, NOW(), NOW()),
    ('ELIE', 'KAREMERA', 'presiassistant@nrf.rumadventist.org', '+250788354915', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'COORDINATOR', 'CAMP_SECRETARY', 'MALE', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), true, false, NOW(), NOW()),
    ('Maua', 'UMUTONI', 'accountant1@nrf.rumadventist.org', '+250788354916', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'COORDINATOR', 'FINANCE_OFFICER', 'FEMALE', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), true, false, NOW(), NOW()),
    ('INES', 'KANKUMI', 'accountant2@nrf.rumadventist.org', '+250788354917', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'COORDINATOR', 'FINANCE_OFFICER', 'FEMALE', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), true, false, NOW(), NOW()),
    ('GAPIRA GASUKU', 'Olivier', 'maintenance@nrf.rumadventist.org', '+250788354918', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'COORDINATOR', 'ACCOMMODATION_OFFICER', 'MALE', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), true, false, NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET 
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    position = EXCLUDED.position,
    organization_unit_id = EXCLUDED.organization_unit_id,
    active = true;

-- 6.3 Ministry & Department Leaders (RUM & NRF)
INSERT INTO users (first_name, last_name, email, phone_number, password, role, position, gender, organization_unit_id, department_id, active, deleted, created_at, updated_at)
VALUES 
    ('Esdras', 'MUPENZI', 'youth@nrf.rumadventist.org', '+250788756540', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'COORDINATOR', 'MINISTRY_LEADER', 'MALE', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), (SELECT id FROM departments WHERE type = 'YOUTH' LIMIT 1), true, false, NOW(), NOW()),
    ('Schadrack', 'NTABUMWE', 'stewardship@nrf.rumadventist.org', '+250788756541', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'COORDINATOR', 'MINISTRY_LEADER', 'MALE', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), (SELECT id FROM departments WHERE type = 'STEWARDSHIP' LIMIT 1), true, false, NOW(), NOW()),
    ('Judith', 'BATWARE', 'womenmin@nrf.rumadventist.org', '+250788756542', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'COORDINATOR', 'MINISTRY_LEADER', 'FEMALE', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), (SELECT id FROM departments WHERE type = 'WOMEN' LIMIT 1), true, false, NOW(), NOW()),
    ('Amie Fidele', 'NGERERO', 'evangelismdir@nrf.rumadventist.org', '+250788756543', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'COORDINATOR', 'MINISTRY_LEADER', 'MALE', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), (SELECT id FROM departments WHERE type = 'EVANGELISM' LIMIT 1), true, false, NOW(), NOW()),
    ('Athalie', 'NYIRANDAGIJIMANA', 'ministerial@nrf.rumadventist.org', '+250788756544', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'COORDINATOR', 'MINISTRY_LEADER', 'FEMALE', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), (SELECT id FROM departments WHERE type = 'MINISTERIAL' LIMIT 1), true, false, NOW(), NOW()),
    ('Jean Pierre', 'Mugiraneza', 'personalmin@nrf.rumadventist.org', '+250788756545', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'COORDINATOR', 'MINISTRY_LEADER', 'MALE', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), (SELECT id FROM departments WHERE type = 'PERSONAL_MINISTRIES' LIMIT 1), true, false, NOW(), NOW()),
    ('Alice', 'Nyiraneza', 'children@nrf.rumadventist.org', '+250788756546', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'COORDINATOR', 'MINISTRY_LEADER', 'FEMALE', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), (SELECT id FROM departments WHERE type = 'CHILDREN' LIMIT 1), true, false, NOW(), NOW()),
    ('Eric', 'Habiyambere', 'family@nrf.rumadventist.org', '+250788756547', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'COORDINATOR', 'MINISTRY_LEADER', 'MALE', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), (SELECT id FROM departments WHERE type = 'FAMILY' LIMIT 1), true, false, NOW(), NOW()),
    ('Joseph', 'Mukama', 'chaplaincy@nrf.rumadventist.org', '+250788756548', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'COORDINATOR', 'MINISTRY_LEADER', 'MALE', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), (SELECT id FROM departments WHERE type = 'CHAPLAINCY' LIMIT 1), true, false, NOW(), NOW()),
    ('Claire', 'Uwera', 'possibility@nrf.rumadventist.org', '+250788756549', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'COORDINATOR', 'MINISTRY_LEADER', 'FEMALE', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), (SELECT id FROM departments WHERE type = 'POSSIBILITY' LIMIT 1), true, false, NOW(), NOW()),
    ('Samuel', 'Karemera', 'health@nrf.rumadventist.org', '+250788756550', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'COORDINATOR', 'MINISTRY_LEADER', 'MALE', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), (SELECT id FROM departments WHERE type = 'HEALTH' LIMIT 1), true, false, NOW(), NOW()),
    ('Mary', 'Uwimana', 'publishing@nrf.rumadventist.org', '+250788756551', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'COORDINATOR', 'MINISTRY_LEADER', 'FEMALE', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), (SELECT id FROM departments WHERE type = 'PUBLISHING' LIMIT 1), true, false, NOW(), NOW()),
    ('Emmanuel', 'Bizimana', 'parl@nrf.rumadventist.org', '+250788756552', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'COORDINATOR', 'MINISTRY_LEADER', 'MALE', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), (SELECT id FROM departments WHERE type = 'PARL' LIMIT 1), true, false, NOW(), NOW()),
    ('Peter', 'Ndayisaba', 'education@nrf.rumadventist.org', '+250788756553', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'COORDINATOR', 'MINISTRY_LEADER', 'MALE', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), (SELECT id FROM departments WHERE type = 'EDUCATION' LIMIT 1), true, false, NOW(), NOW()),
    ('Jean Paul', 'Manirakiza', 'communication@nrf.rumadventist.org', '+250788756554', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'COORDINATOR', 'MINISTRY_LEADER', 'MALE', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), (SELECT id FROM departments WHERE type = 'COMMUNICATION' LIMIT 1), true, false, NOW(), NOW()),
    ('Claude', 'Nsengiyumva', 'revival@nrf.rumadventist.org', '+250788756555', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'COORDINATOR', 'MINISTRY_LEADER', 'MALE', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), (SELECT id FROM departments WHERE type = 'REVIVAL_REFORMATION' LIMIT 1), true, false, NOW(), NOW()),
    ('Aimable', 'Mugisha', 'music@nrf.rumadventist.org', '+250788756556', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'COORDINATOR', 'MINISTRY_LEADER', 'MALE', (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1), (SELECT id FROM departments WHERE type = 'MUSIC' LIMIT 1), true, false, NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET 
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    position = EXCLUDED.position,
    organization_unit_id = EXCLUDED.organization_unit_id,
    department_id = EXCLUDED.department_id,
    active = true;

-- Link departments to their leaders
UPDATE departments SET leader_id = (SELECT id FROM users WHERE email = 'youth@nrf.rumadventist.org' LIMIT 1) WHERE type = 'YOUTH';
UPDATE departments SET leader_id = (SELECT id FROM users WHERE email = 'stewardship@nrf.rumadventist.org' LIMIT 1) WHERE type = 'STEWARDSHIP';
UPDATE departments SET leader_id = (SELECT id FROM users WHERE email = 'womenmin@nrf.rumadventist.org' LIMIT 1) WHERE type = 'WOMEN';
UPDATE departments SET leader_id = (SELECT id FROM users WHERE email = 'evangelismdir@nrf.rumadventist.org' LIMIT 1) WHERE type = 'EVANGELISM';
UPDATE departments SET leader_id = (SELECT id FROM users WHERE email = 'ministerial@nrf.rumadventist.org' LIMIT 1) WHERE type = 'MINISTERIAL';
UPDATE departments SET leader_id = (SELECT id FROM users WHERE email = 'personalmin@nrf.rumadventist.org' LIMIT 1) WHERE type = 'PERSONAL_MINISTRIES';
UPDATE departments SET leader_id = (SELECT id FROM users WHERE email = 'children@nrf.rumadventist.org' LIMIT 1) WHERE type = 'CHILDREN';
UPDATE departments SET leader_id = (SELECT id FROM users WHERE email = 'family@nrf.rumadventist.org' LIMIT 1) WHERE type = 'FAMILY';
UPDATE departments SET leader_id = (SELECT id FROM users WHERE email = 'chaplaincy@nrf.rumadventist.org' LIMIT 1) WHERE type = 'CHAPLAINCY';
UPDATE departments SET leader_id = (SELECT id FROM users WHERE email = 'possibility@nrf.rumadventist.org' LIMIT 1) WHERE type = 'POSSIBILITY';
UPDATE departments SET leader_id = (SELECT id FROM users WHERE email = 'health@nrf.rumadventist.org' LIMIT 1) WHERE type = 'HEALTH';
UPDATE departments SET leader_id = (SELECT id FROM users WHERE email = 'publishing@nrf.rumadventist.org' LIMIT 1) WHERE type = 'PUBLISHING';
UPDATE departments SET leader_id = (SELECT id FROM users WHERE email = 'parl@nrf.rumadventist.org' LIMIT 1) WHERE type = 'PARL';
UPDATE departments SET leader_id = (SELECT id FROM users WHERE email = 'education@nrf.rumadventist.org' LIMIT 1) WHERE type = 'EDUCATION';
UPDATE departments SET leader_id = (SELECT id FROM users WHERE email = 'communication@nrf.rumadventist.org' LIMIT 1) WHERE type = 'COMMUNICATION';
UPDATE departments SET leader_id = (SELECT id FROM users WHERE email = 'revival@nrf.rumadventist.org' LIMIT 1) WHERE type = 'REVIVAL_REFORMATION';
UPDATE departments SET leader_id = (SELECT id FROM users WHERE email = 'music@nrf.rumadventist.org' LIMIT 1) WHERE type = 'MUSIC';

-- =============================================================================
-- 6.4 ALL 34 DISTRICT PASTORS (ABAKURU B'INTARA) OF NORTH RWANDA FIELD
-- Extracted from Official 2026 NRF Report
-- =============================================================================
INSERT INTO users (first_name, last_name, email, phone_number, password, role, position, gender, organization_unit_id, sda_district, active, deleted, created_at, updated_at)
VALUES 
    -- 1. BUKAMBA - NIZEYIMANA Gad
    ('Gad', 'NIZEYIMANA', 'nizeyimana.gad@nrf.rumadventist.org', '+250788002001', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'COORDINATOR', 'DISTRICT_PASTOR', 'MALE', (SELECT id FROM organization_units WHERE code = 'NRF-BUK' LIMIT 1), 'Bukamba', true, false, NOW(), NOW()),
    -- 2. KIVUYE - NIYONZIMA Samuel
    ('Samuel', 'NIYONZIMA', 'niyonzima.samuel@nrf.rumadventist.org', '+250788002002', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'COORDINATOR', 'DISTRICT_PASTOR', 'MALE', (SELECT id FROM organization_units WHERE code = 'NRF-KIV' LIMIT 1), 'Kivuye', true, false, NOW(), NOW()),
    -- 3. MUSANZE - KANOTI Francois
    ('Francois', 'KANOTI', 'kanoti.francois@nrf.rumadventist.org', '+250788002003', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'COORDINATOR', 'DISTRICT_PASTOR', 'MALE', (SELECT id FROM organization_units WHERE code = 'NRF-MUS' LIMIT 1), 'Musanze', true, false, NOW(), NOW()),
    -- 4. GASIHO - NIYONZIMA Froduald
    ('Froduald', 'NIYONZIMA', 'niyonzima.froduald@nrf.rumadventist.org', '+250788002004', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'COORDINATOR', 'DISTRICT_PASTOR', 'MALE', (SELECT id FROM organization_units WHERE code = 'NRF-GAS' LIMIT 1), 'Gasiho', true, false, NOW(), NOW()),
    -- 5. RUHONDO - RUKUNDO B. Faustin
    ('Faustin', 'RUKUNDO B.', 'rukundo.faustin@nrf.rumadventist.org', '+250788002005', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'COORDINATOR', 'DISTRICT_PASTOR', 'MALE', (SELECT id FROM organization_units WHERE code = 'NRF-RUH' LIMIT 1), 'Ruhondo', true, false, NOW(), NOW()),
    -- 6. KABERE - NGAMIJE Hesron
    ('Hesron', 'NGAMIJE', 'ngamije.hesron@nrf.rumadventist.org', '+250788002006', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'COORDINATOR', 'DISTRICT_PASTOR', 'MALE', (SELECT id FROM organization_units WHERE code = 'NRF-KAB' LIMIT 1), 'Kabere', true, false, NOW(), NOW()),
    -- 7. NKULI - MUREGO A. Kadahwema
    ('Kadahwema', 'MUREGO A.', 'murego.kadahwema@nrf.rumadventist.org', '+250788002007', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'COORDINATOR', 'DISTRICT_PASTOR', 'MALE', (SELECT id FROM organization_units WHERE code = 'NRF-NKU' LIMIT 1), 'Nkuli', true, false, NOW(), NOW()),
    -- 8. KIDAHO - NTARE MUSAFIRI James
    ('James', 'NTARE MUSAFIRI', 'ntare.james@nrf.rumadventist.org', '+250788002008', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'COORDINATOR', 'DISTRICT_PASTOR', 'MALE', (SELECT id FROM organization_units WHERE code = 'NRF-KID' LIMIT 1), 'Kidaho', true, false, NOW(), NOW()),
    -- 9. CAR - UWIDUHAYE Josias
    ('Josias', 'UWIDUHAYE', 'uwiduhaye.josias@nrf.rumadventist.org', '+250788002009', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'COORDINATOR', 'DISTRICT_PASTOR', 'MALE', (SELECT id FROM organization_units WHERE code = 'NRF-CAR' LIMIT 1), 'CAR', true, false, NOW(), NOW()),
    -- 10. KIBALI - NGABOYISONGA JMV
    ('JMV', 'NGABOYISONGA', 'ngaboyisonga.jmv@nrf.rumadventist.org', '+250788002010', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'COORDINATOR', 'DISTRICT_PASTOR', 'MALE', (SELECT id FROM organization_units WHERE code = 'NRF-KIB' LIMIT 1), 'Kibali', true, false, NOW(), NOW()),
    -- 11. RWANKERI - NIZEYIMANA Zelobabel
    ('Zelobabel', 'NIZEYIMANA', 'nizeyimana.zelobabel@nrf.rumadventist.org', '+250788002011', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'COORDINATOR', 'DISTRICT_PASTOR', 'MALE', (SELECT id FROM organization_units WHERE code = 'NRF-RWA' LIMIT 1), 'Rwankeri', true, false, NOW(), NOW()),
    -- 12. KIGOMBE - KABERUKA RWAMUCYO
    ('RWAMUCYO', 'KABERUKA', 'kaberuka.rwamucyo@nrf.rumadventist.org', '+250788002012', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'COORDINATOR', 'DISTRICT_PASTOR', 'MALE', (SELECT id FROM organization_units WHERE code = 'NRF-KIG' LIMIT 1), 'Kigombe', true, false, NOW(), NOW()),
    -- 13. JOMA - HAKIZIMANA Faustin
    ('Faustin', 'HAKIZIMANA', 'hakizimana.faustin@nrf.rumadventist.org', '+250788002013', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'COORDINATOR', 'DISTRICT_PASTOR', 'MALE', (SELECT id FROM organization_units WHERE code = 'NRF-JOM' LIMIT 1), 'Joma', true, false, NOW(), NOW()),
    -- 14. RUHANGA - BONAVENTURE
    ('Bonaventure', 'RUHANGA', 'bonaventure@nrf.rumadventist.org', '+250788002014', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'COORDINATOR', 'DISTRICT_PASTOR', 'MALE', (SELECT id FROM organization_units WHERE code = 'NRF-RUHA' LIMIT 1), 'Ruhanga', true, false, NOW(), NOW()),
    -- 15. NKUMBA - NKIRIYUMWAMI NGABO Gérard
    ('Gérard', 'NKIRIYUMWAMI NGABO', 'nkiriyumwami.gerard@nrf.rumadventist.org', '+250788002015', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'COORDINATOR', 'DISTRICT_PASTOR', 'MALE', (SELECT id FROM organization_units WHERE code = 'NRF-NKUM' LIMIT 1), 'Nkumba', true, false, NOW(), NOW()),
    -- 16. KINIGI - NSENGIYUMVA Job
    ('Job', 'NSENGIYUMVA', 'nsengiyumva.job@nrf.rumadventist.org', '+250788002016', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'COORDINATOR', 'DISTRICT_PASTOR', 'MALE', (SELECT id FROM organization_units WHERE code = 'NRF-KIN' LIMIT 1), 'Kinigi', true, false, NOW(), NOW()),
    -- 17. MATABA - SINDUKINGIYE Jean Bosco
    ('Jean Bosco', 'SINDUKINGIYE', 'sindukingiye.jeanbosco@nrf.rumadventist.org', '+250788002017', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'COORDINATOR', 'DISTRICT_PASTOR', 'MALE', (SELECT id FROM organization_units WHERE code = 'NRF-MAT' LIMIT 1), 'Mataba', true, false, NOW(), NOW()),
    -- 18. BUGARURA - NGERERO Thaddée
    ('Thaddée', 'NGERERO', 'ngerero.thaddee@nrf.rumadventist.org', '+250788002018', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'COORDINATOR', 'DISTRICT_PASTOR', 'MALE', (SELECT id FROM organization_units WHERE code = 'NRF-BUG' LIMIT 1), 'Bugarura', true, false, NOW(), NOW()),
    -- 19. KALINZI - IYAMUREMYE Joseph
    ('Joseph', 'IYAMUREMYE', 'iyamuremye.joseph@nrf.rumadventist.org', '+250788002019', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'COORDINATOR', 'DISTRICT_PASTOR', 'MALE', (SELECT id FROM organization_units WHERE code = 'NRF-KAL' LIMIT 1), 'Kalinzi', true, false, NOW(), NOW()),
    -- 20. KIRAMBO - NKUNDIMANA Aimable
    ('Aimable', 'NKUNDIMANA', 'nkundimana.aimable@nrf.rumadventist.org', '+250788002020', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'COORDINATOR', 'DISTRICT_PASTOR', 'MALE', (SELECT id FROM organization_units WHERE code = 'NRF-KIR' LIMIT 1), 'Kirambo', true, false, NOW(), NOW()),
    -- 21. RUNOGA - UWIRINGIYIMANA Emmanuel
    ('Emmanuel', 'UWIRINGIYIMANA', 'uwiringiyimana.emmanuel@nrf.rumadventist.org', '+250788002021', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'COORDINATOR', 'DISTRICT_PASTOR', 'MALE', (SELECT id FROM organization_units WHERE code = 'NRF-RUN' LIMIT 1), 'Runoga', true, false, NOW(), NOW()),
    -- 22. BUBERUKA - ABAYISENGA Jotham
    ('Jotham', 'ABAYISENGA', 'abayisenga.jotham@nrf.rumadventist.org', '+250788002022', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'COORDINATOR', 'DISTRICT_PASTOR', 'MALE', (SELECT id FROM organization_units WHERE code = 'NRF-BUB' LIMIT 1), 'Buberuka', true, false, NOW(), NOW()),
    -- 23. MUGALI - SEBUNTU GASHABUKA
    ('Gashabuka', 'SEBUNTU', 'sebuntu.gashabuka@nrf.rumadventist.org', '+250788002023', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'COORDINATOR', 'DISTRICT_PASTOR', 'MALE', (SELECT id FROM organization_units WHERE code = 'NRF-MUG' LIMIT 1), 'Mugali', true, false, NOW(), NOW()),
    -- 24. BUHOMA - NTAKIRUTIMANA Martin
    ('Martin', 'NTAKIRUTIMANA', 'ntakirutimana.martin@nrf.rumadventist.org', '+250788002024', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'COORDINATOR', 'DISTRICT_PASTOR', 'MALE', (SELECT id FROM organization_units WHERE code = 'NRF-BUHO' LIMIT 1), 'Buhoma', true, false, NOW(), NOW()),
    -- 25. NYARUGINA - NTIBAZIRIKANA Emmanuel
    ('Emmanuel', 'NTIBAZIRIKANA', 'ntibazirikana.emmanuel@nrf.rumadventist.org', '+250788002025', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'COORDINATOR', 'DISTRICT_PASTOR', 'MALE', (SELECT id FROM organization_units WHERE code = 'NRF-NYA' LIMIT 1), 'Nyarugina', true, false, NOW(), NOW()),
    -- 26. KIVURUGA - BANTEGEYE Jean Pierre
    ('Jean Pierre', 'BANTEGEYE', 'bantegeye.jeanpierre@nrf.rumadventist.org', '+250788002026', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'COORDINATOR', 'DISTRICT_PASTOR', 'MALE', (SELECT id FROM organization_units WHERE code = 'NRF-KIVU' LIMIT 1), 'Kivuruga', true, false, NOW(), NOW()),
    -- 27. MARANGAR - MUTAZIHANA Amon
    ('Amon', 'MUTAZIHANA', 'mutazihana.amon@nrf.rumadventist.org', '+250788002027', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'COORDINATOR', 'DISTRICT_PASTOR', 'MALE', (SELECT id FROM organization_units WHERE code = 'NRF-MAR' LIMIT 1), 'Marangar', true, false, NOW(), NOW()),
    -- 28. BWUZURI - KAMANUTSI Javan
    ('Javan', 'KAMANUTSI', 'kamanutsi.javan@nrf.rumadventist.org', '+250788002028', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'COORDINATOR', 'DISTRICT_PASTOR', 'MALE', (SELECT id FROM organization_units WHERE code = 'NRF-BWU' LIMIT 1), 'Bwuzuri', true, false, NOW(), NOW()),
    -- 29. BUKONYA - UWIMANA Heritier
    ('Heritier', 'UWIMANA', 'uwimana.heritier@nrf.rumadventist.org', '+250788002029', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'COORDINATOR', 'DISTRICT_PASTOR', 'MALE', (SELECT id FROM organization_units WHERE code = 'NRF-BUKO' LIMIT 1), 'Bukonya', true, false, NOW(), NOW()),
    -- 30. NDUSU - MASENGESHO Michel
    ('Michel', 'MASENGESHO', 'masengesho.michel@nrf.rumadventist.org', '+250788002030', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'COORDINATOR', 'DISTRICT_PASTOR', 'MALE', (SELECT id FROM organization_units WHERE code = 'NRF-NDU' LIMIT 1), 'Ndusu', true, false, NOW(), NOW()),
    -- 31. MUNYANA - NSHIMIYIMANA Emile
    ('Emile', 'NSHIMIYIMANA', 'nshimiyimana.emile@nrf.rumadventist.org', '+250788002031', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'COORDINATOR', 'DISTRICT_PASTOR', 'MALE', (SELECT id FROM organization_units WHERE code = 'NRF-MUN' LIMIT 1), 'Munyana', true, false, NOW(), NOW()),
    -- 32. NDORWA - NTABAJIYANA J. Damascene
    ('J. Damascene', 'NTABAJIYANA', 'ntabajiyana.damascene@nrf.rumadventist.org', '+250788002032', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'COORDINATOR', 'DISTRICT_PASTOR', 'MALE', (SELECT id FROM organization_units WHERE code = 'NRF-NDO' LIMIT 1), 'Ndorwa', true, false, NOW(), NOW()),
    -- 33. RUTOVU - NIRINGIYIMANA Samuel
    ('Samuel', 'NIRINGIYIMANA', 'niringiyimana.samuel@nrf.rumadventist.org', '+250788002033', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'COORDINATOR', 'DISTRICT_PASTOR', 'MALE', (SELECT id FROM organization_units WHERE code = 'NRF-RUT' LIMIT 1), 'Rutovu', true, false, NOW(), NOW()),
    -- 34. MUCACA - GASHUGURU Damien
    ('Damien', 'GASHUGURU', 'gashuguru.damien@nrf.rumadventist.org', '+250788002034', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'COORDINATOR', 'DISTRICT_PASTOR', 'MALE', (SELECT id FROM organization_units WHERE code = 'NRF-MUC' LIMIT 1), 'Mucaca', true, false, NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET 
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    position = EXCLUDED.position,
    organization_unit_id = EXCLUDED.organization_unit_id,
    sda_district = EXCLUDED.sda_district,
    active = true;

-- Sample Participant
INSERT INTO users (first_name, last_name, email, phone_number, password, role, position, gender, organization_unit_id, active, deleted, created_at, updated_at)
VALUES ('Sample', 'Participant', 'participant@campcoordai.rw', '+250788999888', '$2a$10$w09Zk3mU0d.jD6zF2wWvNu87pZJqB9P3U3IqN2B2T/H9A/K9Z7Nq', 'PARTICIPANT', NULL, 'FEMALE', (SELECT id FROM organization_units WHERE code = 'NRF-MUS' LIMIT 1), true, false, NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET active = true;
