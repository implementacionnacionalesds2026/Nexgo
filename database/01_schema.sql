-- ============================================================
-- NEXGO - Sistema de Paquetería Nacional
-- Nacionales Delivery Services
-- Script 01: Schema de Base de Datos
-- ============================================================

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLA: roles
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABLA: users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id       INT NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    name          VARCHAR(150) NOT NULL,
    email         VARCHAR(200) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone         VARCHAR(20),
    company_name  VARCHAR(200),           -- Para clientes tipo empresa
    is_active     BOOLEAN DEFAULT TRUE,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABLA: pricing_rules  (Tarifas de envío)
-- ============================================================
CREATE TABLE IF NOT EXISTS pricing_rules (
    id                 SERIAL PRIMARY KEY,
    name               VARCHAR(100) NOT NULL,
    base_price         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    price_per_kg       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    price_per_km       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    price_per_extra_pkg DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    dimension_surcharge DECIMAL(10,2) NOT NULL DEFAULT 0.00, -- Recargo por dimensiones grandes
    max_weight_kg      DECIMAL(10,2) DEFAULT 100.00,
    is_active          BOOLEAN DEFAULT TRUE,
    created_at         TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at         TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABLA: shipments  (Envíos / Guías)
-- ============================================================
CREATE TABLE IF NOT EXISTS shipments (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tracking_number     VARCHAR(20) NOT NULL UNIQUE,
    client_id           UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    assigned_driver_id  UUID REFERENCES users(id) ON DELETE SET NULL,
    pricing_rule_id     INT REFERENCES pricing_rules(id) ON DELETE SET NULL,

    -- Remitente
    sender_name         VARCHAR(150) NOT NULL,
    sender_phone        VARCHAR(20),
    sender_address      TEXT NOT NULL,
    origin_city         VARCHAR(100) NOT NULL,
    origin_lat          DECIMAL(10,7),
    origin_lng          DECIMAL(10,7),

    -- Destinatario
    recipient_name      VARCHAR(150) NOT NULL,
    recipient_phone     VARCHAR(20),
    recipient_address   TEXT NOT NULL,
    destination_city    VARCHAR(100) NOT NULL,
    destination_lat     DECIMAL(10,7),
    destination_lng     DECIMAL(10,7),

    -- Paquete
    weight_kg           DECIMAL(10,2) NOT NULL,
    length_cm           DECIMAL(10,2),
    width_cm            DECIMAL(10,2),
    height_cm           DECIMAL(10,2),
    quantity            INT NOT NULL DEFAULT 1,
    description         TEXT,
    is_fragile          BOOLEAN DEFAULT FALSE,

    -- Costos
    distance_km         DECIMAL(10,2),
    estimated_cost      DECIMAL(10,2),
    final_cost          DECIMAL(10,2),

    -- Estado y fechas
    current_status      VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE',
    estimated_delivery  DATE,
    delivered_at        TIMESTAMP WITH TIME ZONE,
    notes               TEXT,

    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABLA: shipment_status  (Historial de estados)
-- ============================================================
CREATE TABLE IF NOT EXISTS shipment_status (
    id           SERIAL PRIMARY KEY,
    shipment_id  UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    status       VARCHAR(50) NOT NULL,
    -- PENDIENTE | RECOGIDO | EN_TRANSITO | EN_DESTINO | ENTREGADO | CANCELADO
    notes        TEXT,
    location     VARCHAR(200),
    updated_by   UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABLA: delivery_tracking  (Ubicación en tiempo real)
-- ============================================================
CREATE TABLE IF NOT EXISTS delivery_tracking (
    id           SERIAL PRIMARY KEY,
    driver_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shipment_id  UUID REFERENCES shipments(id) ON DELETE SET NULL,
    latitude     DECIMAL(10,7) NOT NULL,
    longitude    DECIMAL(10,7) NOT NULL,
    speed_kmh    DECIMAL(6,2),
    heading      DECIMAL(6,2),
    is_active    BOOLEAN DEFAULT TRUE,
    recorded_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_users_email        ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role         ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_shipments_client   ON shipments(client_id);
CREATE INDEX IF NOT EXISTS idx_shipments_driver   ON shipments(assigned_driver_id);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON shipments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipments_status   ON shipments(current_status);
CREATE INDEX IF NOT EXISTS idx_status_shipment    ON shipment_status(shipment_id);
CREATE INDEX IF NOT EXISTS idx_tracking_driver    ON delivery_tracking(driver_id);
CREATE INDEX IF NOT EXISTS idx_tracking_active    ON delivery_tracking(driver_id, is_active);

-- ============================================================
-- FUNCIÓN: auto-actualizar updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shipments_updated_at
    BEFORE UPDATE ON shipments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pricing_rules_updated_at
    BEFORE UPDATE ON pricing_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
