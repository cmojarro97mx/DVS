# Nexxio - Plataforma de Gestión de Cadena de Suministro

Plataforma todo-en-uno para gestionar operaciones, clientes y finanzas con insights potenciados por IA.

---

## 🚀 Instalación Rápida

### **Requisitos Previos**
- [Node.js](https://nodejs.org/) (v18 o superior)
- PostgreSQL (o base de datos compatible)
- Claves API necesarias (ver configuración de variables de entorno)

---

### **1. Instalar dependencias**

#### Frontend
```bash
npm install
```

#### Backend
```bash
cd server
npm install
cd ..
```

---

### **2. Configurar variables de entorno**

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# Base de datos
DATABASE_URL="postgresql://usuario:contraseña@host:puerto/nombre_bd"

# Backblaze B2 (Almacenamiento)
BACKBLAZE_KEY_ID="tu_key_id"
BACKBLAZE_APPLICATION_KEY="tu_application_key"
BACKBLAZE_BUCKET_NAME="tu_bucket"
BACKBLAZE_ENDPOINT="tu_endpoint"

# Google AI (Gemini)
GEMINI_API_KEY="tu_gemini_api_key"

# JWT
JWT_SECRET="tu_secret_key_segura"

# Google OAuth (Opcional)
GOOGLE_CLIENT_ID="tu_google_client_id"
GOOGLE_CLIENT_SECRET="tu_google_client_secret"
GOOGLE_REDIRECT_URI="http://localhost:3001/api/google-auth/callback"

# Google Maps (Opcional)
GOOGLE_MAPS_API_KEY="tu_google_maps_key"

# Configuración del servidor
PORT=3001
NODE_ENV=development
```

---

### **3. Ejecutar la aplicación**

El proyecto utiliza dos workflows que se ejecutan automáticamente:

#### Backend (Puerto 3001)
```bash
cd server && ./start.sh
```

#### Frontend (Puerto 5000)
```bash
npm run dev -- --host 0.0.0.0 --port 5000
```

La aplicación estará disponible en:
- **Frontend:** http://localhost:5000
- **Backend API:** http://localhost:3001/api

---

## 🔧 Comandos Útiles

### Desarrollo
```bash
# Instalar todas las dependencias (frontend + backend)
npm install && cd server && npm install && cd ..

# Ejecutar solo frontend
npm run dev

# Ejecutar solo backend
cd server && npm run start:dev
```

### Base de datos
```bash
# Generar cliente Prisma
cd server && npm run prisma:generate

# Sincronizar esquema con la base de datos
cd server && npm run prisma:push
```

### Producción
```bash
# Construir frontend
npm run build

# Construir backend
cd server && npm run build

# Iniciar en producción
cd server && npm run start:prod
```

---

## 📁 Estructura del Proyecto

```
.
├── src/                    # Código fuente del frontend (React + Vite)
│   ├── components/         # Componentes reutilizables
│   ├── pages/             # Páginas de la aplicación
│   ├── services/          # Servicios API
│   └── contexts/          # Contextos de React
├── server/                # Backend (NestJS)
│   ├── src/
│   │   ├── modules/       # Módulos de la aplicación
│   │   └── common/        # Servicios comunes
│   └── prisma/            # Esquema de base de datos
├── public/                # Archivos estáticos
└── package.json           # Dependencias del frontend
```

---

## 🐛 Solución de Problemas

### Error: TypeScript compilation errors
Si encuentras errores de compilación de TypeScript en el backend, asegúrate de que todas las dependencias estén instaladas:
```bash
cd server
rm -rf node_modules package-lock.json
npm install
```

### Error: Port already in use
Si el puerto 5000 o 3001 está en uso:
```bash
# Encontrar y detener el proceso
lsof -ti:5000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

### Error: Cannot connect to database
Verifica que la variable `DATABASE_URL` en tu archivo `.env` esté correctamente configurada y que la base de datos esté accesible.

---

## 🌟 Características Principales

- 🤖 **Asistente Virtual con IA** - Asistente inteligente potenciado por Gemini con respuestas de voz
- 📧 **Sincronización de Gmail** - Integración completa con Gmail
- 📅 **Calendario** - Gestión de eventos y sincronización con Google Calendar
- 💼 **Gestión de Clientes** - CRM completo
- 📊 **Operaciones** - Control de operaciones y documentos
- 💰 **Facturas y Pagos** - Gestión financiera
- 📝 **Cotizaciones** - Generación de presupuestos
- 📁 **Gestor de Archivos** - Almacenamiento en la nube con Backblaze B2
- 🎙️ **Text-to-Speech Open Source** - Voces naturales sin APIs de pago

---

## 📝 Notas Importantes

- **Puerto Frontend:** Siempre debe ser **5000** (configuración de Replit)
- **Puerto Backend:** **3001** (configurable en variables de entorno)
- **Almacenamiento:** Utiliza Backblaze B2 para archivos
- **Base de datos:** PostgreSQL (recomendado usar Neon o similar)
- **IA:** Requiere clave API de Google Gemini

---

## 🚀 En Replit

Este proyecto está optimizado para ejecutarse en Replit. Los workflows están pre-configurados:

1. **Backend** - Inicia automáticamente el servidor NestJS
2. **Frontend** - Inicia automáticamente el servidor Vite

Solo necesitas configurar tus variables de entorno en los Secrets de Replit.

---

## 📄 Licencia

Este proyecto está bajo la licencia especificada en el archivo LICENSE.
