# Nexgo — Sistema de Paquetería Nacional
### Nacionales Delivery Services · Guatemala

---

## 🚀 Stack Tecnológico

| Layer | Tecnología |
|-------|-----------|
| Frontend | Angular 17+ (Standalone Components) |
| Backend | Node.js + Express + Socket.io |
| Base de Datos | PostgreSQL |
| Autenticación | JWT + Bcrypt |
| Real-time | Socket.io |
| Deploy Backend | Railway |
| Deploy Frontend | Vercel |

---

## 📁 Estructura del Proyecto

```
nexgo/
├── database/
│   ├── 01_schema.sql      # Esquema de tablas
│   └── 02_seed.sql        # Datos iniciales
├── nexgo-backend/         # API Node.js
│   ├── src/
│   │   ├── config/        # DB + JWT
│   │   ├── controllers/   # Lógica HTTP
│   │   ├── middleware/    # Auth, Roles, Errors
│   │   ├── routes/        # Definición de rutas
│   │   ├── services/      # Lógica de negocio
│   │   ├── socket/        # Socket.io events
│   │   └── utils/         # Logger, Helpers
│   ├── app.js             # Express app
│   └── server.js          # Entry point
└── nexgo-frontend/        # Angular App
    └── src/app/
        ├── core/          # Guards, Services, Models
        ├── features/
        │   ├── auth/      # Login
        │   ├── admin/     # Dashboard, Usuarios, Rastreo, Tarifas, Reportes
        │   ├── cliente/   # Cotizador, Mis Envíos, Nuevo Envío, Rastrear
        │   └── repartidor/ # Mis Guías, Actualizar Estado, Mi Ubicación
        └── shared/        # Sidebar, StatusBadge
```

---

## ⚙️ Instalación Local

### 1. Base de Datos
```sql
-- En Supabase o PostgreSQL local:
-- 1. Ejecutar database/01_schema.sql
-- 2. Ejecutar database/02_seed.sql
```

### 2. Backend
```bash
cd nexgo-backend
cp .env.example .env
# Edita .env con tu DATABASE_URL y JWT_SECRET
npm install
npm run dev         # http://localhost:3000
```

### 3. Frontend
```bash
cd nexgo-frontend
npm install
# Edita src/environments/environment.ts con tu Google Maps API Key
ng serve            # http://localhost:4200
```

---

## 🔐 Credenciales de Demo

| Rol | Email | Contraseña |
|-----|-------|-----------|
| Administrador | admin@nexgo.gt | Admin1234! |
| Cliente | cliente@demo.gt | Admin1234! |
| Repartidor | repartidor@nexgo.gt | Admin1234! |

---

## 🔌 API Endpoints

```
POST   /api/auth/login              # Login
POST   /api/auth/register           # Crear usuario (ADMIN)
GET    /api/auth/me                 # Perfil actual

GET    /api/users                   # Listar usuarios (ADMIN)
PUT    /api/users/:id               # Editar usuario (ADMIN)
DELETE /api/users/:id               # Desactivar usuario (ADMIN)

POST   /api/cotizar                 # Cotizar envío
POST   /api/shipments               # Crear envío
GET    /api/shipments               # Listar envíos
GET    /api/shipments/:id           # Detalle envío
PUT    /api/shipments/:id/status    # Cambiar estado (REPARTIDOR/ADMIN)
PUT    /api/shipments/:id/assign    # Asignar repartidor (ADMIN)

POST   /api/tracking/ubicacion      # Enviar GPS (REPARTIDOR)
GET    /api/tracking/repartidores   # Ver todos los repartidores (ADMIN)

GET    /api/pricing                 # Ver tarifas
PUT    /api/pricing/:id             # Actualizar tarifa (ADMIN)

GET    /api/reports/dashboard       # KPIs (ADMIN)
GET    /api/reports/shipments       # Reporte de envíos (ADMIN)
```

---

## 🚂 Deploy en Railway

1. Conecta tu repositorio GitHub a Railway
2. Crea un nuevo servicio PostgreSQL en Railway
3. Añade las variables de entorno al servicio Node.js:
   ```
   DATABASE_URL=<Railway PostgreSQL URL>
   JWT_SECRET=<secreto_seguro>
   FRONTEND_URL=https://nexgo.vercel.app
   NODE_ENV=production
   DB_SSL=true
   ```
4. Configura el Root Directory en Railway: `nexgo-backend`
5. Deploy automático en cada push a main

---

## 🌐 Deploy Frontend en Vercel

1. Importa el repositorio en Vercel
2. Root Directory: `nexgo-frontend`
3. Build Command: `ng build --configuration=production`
4. Output Directory: `dist/nexgo-frontend/browser`
5. Añade las environment variables en Vercel (si usas `.env` en build)

---

## 🎨 Paleta de Colores

| Token | Color | Uso |
|-------|-------|-----|
| `--primary` | `#1B3FA0` | Botones y elementos principales |
| `--bg` | `#05081a` | Fondo general |
| `--hover` | `#2B52C8` | Hover de elementos primarios |
| `--accent` | `#3EC6E0` | Accentos y highlights |
| `--accent-2` | `#1AAFC8` | Gradientes secundarios |
| `--text` | `#FFFFFF` | Texto principal |

---

## 🗺️ Google Maps

Edita `nexgo-frontend/src/environments/environment.ts`:
```typescript
googleMapsApiKey: 'TU_API_KEY_AQUI'
```

Activa en Google Cloud Console:
- Maps JavaScript API
- Geocoding API
- Distance Matrix API

---

**© 2024 Nacionales Delivery Services · Nexgo v1.0.0**
