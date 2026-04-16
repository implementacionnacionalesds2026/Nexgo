-- ============================================================
-- NEXGO - Script 02: Datos Iniciales (Seed)
-- ============================================================

-- ============================================================
-- ROLES
-- ============================================================
INSERT INTO roles (id, name, description) VALUES
(1, 'ADMIN',       'Administrador del sistema con acceso total'),
(2, 'CLIENTE',     'Empresa cliente que registra y consulta envíos'),
(3, 'REPARTIDOR',  'Repartidor que gestiona entregas en campo')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- USUARIO ADMINISTRADOR POR DEFECTO
-- Contraseña: Admin1234!
-- Hash bcrypt (cost 10)
-- ============================================================
INSERT INTO users (id, role_id, name, email, password_hash, phone, is_active)
VALUES (
    uuid_generate_v4(),
    1,
    'Administrador Nexgo',
    'admin@nexgo.gt',
    '$2a$10$ZkGMD7YEDNYByi04HZA7GuL94UoGLxrKnQ0Yzfs4kaa0nOkxAl4s.', -- Admin1234!
    '50222334455',
    TRUE
)
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- USUARIO CLIENTE DE PRUEBA
-- Contraseña: Cliente123!
-- ============================================================
INSERT INTO users (id, role_id, name, email, password_hash, phone, company_name, is_active)
VALUES (
    uuid_generate_v4(),
    2,
    'Empresa Demo S.A.',
    'cliente@demo.gt',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    '50255667788',
    'Empresa Demo S.A.',
    TRUE
)
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- USUARIO REPARTIDOR DE PRUEBA
-- Contraseña: Reparto123!
-- ============================================================
INSERT INTO users (id, role_id, name, email, password_hash, phone, is_active)
VALUES (
    uuid_generate_v4(),
    3,
    'Juan Repartidor',
    'repartidor@nexgo.gt',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    '50299887766',
    TRUE
)
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- TARIFAS BASE
-- ============================================================
INSERT INTO pricing_rules (name, base_price, price_per_kg, price_per_km, price_per_extra_pkg, dimension_surcharge, max_weight_kg, is_active)
VALUES
    ('Tarifa Estándar',     25.00,  3.50,  0.80, 10.00, 15.00, 50.00,  TRUE),
    ('Tarifa Express',      45.00,  5.00,  1.20, 15.00, 20.00, 30.00,  TRUE),
    ('Tarifa Carga Pesada', 80.00,  2.50,  1.50, 20.00, 25.00, 500.00, TRUE),
    ('Tarifa Económica',    15.00,  2.00,  0.50, 8.00,  10.00, 20.00,  TRUE)
ON CONFLICT DO NOTHING;

-- ============================================================
-- ENVÍO DE PRUEBA
-- ============================================================
DO $$
DECLARE
    v_client_id UUID;
    v_rule_id   INT;
    v_shipment_id UUID := uuid_generate_v4();
BEGIN
    SELECT id INTO v_client_id FROM users WHERE email = 'cliente@demo.gt';
    SELECT id INTO v_rule_id   FROM pricing_rules WHERE name = 'Tarifa Estándar';

    IF v_client_id IS NOT NULL THEN
        INSERT INTO shipments (
            id, tracking_number, client_id, pricing_rule_id,
            sender_name, sender_phone, sender_address, origin_city,
            origin_lat, origin_lng,
            recipient_name, recipient_phone, recipient_address, destination_city,
            destination_lat, destination_lng,
            weight_kg, quantity, description,
            distance_km, estimated_cost, final_cost,
            current_status
        ) VALUES (
            v_shipment_id,
            'NX-2024-00001',
            v_client_id,
            v_rule_id,
            'Empresa Demo S.A.', '50255667788',
            '4a Calle 11-22 Zona 1, Guatemala City', 'Guatemala',
            14.6349, -90.5069,
            'Tienda Central Huehue', '50233445566',
            '5a Avenida 2-15 Zona 1, Huehuetenango', 'Huehuetenango',
            15.3197, -91.4732,
            5.50, 1, 'Documentos importantes',
            260.00, 298.00, 298.00,
            'PENDIENTE'
        ) ON CONFLICT (tracking_number) DO NOTHING;

        INSERT INTO shipment_status (shipment_id, status, notes, location)
        VALUES (v_shipment_id, 'PENDIENTE', 'Envío registrado en sistema', 'Guatemala City');
    END IF;
END $$;

-- Confirmación
SELECT 'Seed completado exitosamente' AS resultado;
SELECT r.name AS rol, COUNT(u.id) AS total_usuarios
FROM roles r
LEFT JOIN users u ON u.role_id = r.id
GROUP BY r.name;
