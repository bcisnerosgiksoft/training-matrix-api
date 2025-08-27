# Training Matrix API

API REST en Node.js/Express para maquiladoras.  
Gestiona empleados, áreas, operaciones y habilidades, con autenticación JWT, control por roles, carga de evidencias, logs en MongoDB y datos en MySQL. Backend del sistema **Matriz de Entrenamiento** para evaluar y documentar competencias laborales.

---

## 🚀 Características
- Autenticación con **JWT**
- Control de permisos basado en roles (RBAC)
- Gestión de empleados, áreas, operaciones, posiciones y turnos
- Matriz de entrenamiento con niveles y documentos de evidencia
- Logs y notificaciones centralizadas en **MongoDB**
- Modelos relacionales en **MySQL**

---

## 📂 Estructura del proyecto
```
src/
├── config/ # Configuración (MySQL, MongoDB)
├── controllers/ # Lógica de negocio
├── middlewares/ # Autenticación, permisos, validaciones, uploads
├── models/ # Modelos MySQL y MongoDB
├── routes/ # Definición de endpoints
├── utils/ # Helpers y seeders
├── validators/ # Validaciones de entrada
├── app.js # Configuración principal Express
└── server.js # Punto de arranque del servidor
uploads/ # Archivos de evidencia
.env # Configuración de entorno
```

---

## ⚙️ Requisitos
- Node.js **20+**
- MySQL **8+**
- MongoDB **6+**
- npm o yarn

---

## 🔧 Instalación
1. Clonar el repositorio:
   ```bash
   git clone https://github.com/bcisnerosgiksoft/training-matrix-api.git
   cd training-matrix-api
   npm install
   ```
## ⚙️ Configuración del entorno 
   ```
# ── App ──
NODE_ENV=development
PORT=3000
PROCESS_TITLE=training-matrix-api

# ── MySQL ──
MYSQL_DB=training_matrix_db
MYSQL_USER=tm_user
MYSQL_PASSWORD=tm_password123
MYSQL_HOST=localhost
# MYSQL_PORT=3306

# ── MongoDB ──
MONGO_URI=mongodb://localhost:27017/training-matrix
REQUIRE_MONGO=true

# ── Auth ──
JWT_SECRET=super_secret_key_please_change
JWT_EXPIRES_IN=7d

# ── ORM Sync & Seeds ──
# 'none' (recomendado), 'alter' (solo dev), 'force' (solo pruebas)
SEQUELIZE_SYNC=none

# Ejecuta seeds en el arranque (roles/áreas/etc.)
RUN_SEEDS=false

# Seeder del usuario Admin inicial
SEED_ADMIN_USER=admin
SEED_ADMIN_CODE=U-0001
SEED_ADMIN_PASSWORD=admin123
```
## 🚀 Ejecución
En desarrollo:
   ```bash
      npm run dev
   ```
En producción:
   ```bash
      npm start
   ```