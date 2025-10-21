# Nexxio - Supply Chain Management Platform

## Descripción General
Nexxio es una plataforma completa de gestión de logística y CRM que permite administrar operaciones, clientes y finanzas con capacidades impulsadas por IA.

## Tecnologías
- **Frontend**: React 19 + TypeScript
- **Bundler**: Vite 6
- **Estilos**: Tailwind CSS
- **Base de Datos**: PostgreSQL (Neon)
- **IA**: Google Gemini API

## Estructura del Proyecto
```
/
├── components/          # Componentes reutilizables de UI
│   ├── dashboard/      # Componentes del dashboard
│   └── icons/          # Iconos personalizados
├── pages/              # Páginas principales de la aplicación
├── data/               # Datos iniciales (vacíos)
├── App.tsx             # Componente raíz
├── index.tsx           # Punto de entrada
└── vite.config.ts      # Configuración de Vite
```

## Estado Actual
- ✅ Aplicación frontend funcionando en puerto 5000
- ✅ Base de datos PostgreSQL configurada (Neon)
- ✅ Backend NestJS funcionando en puerto 3001
- ✅ Esquema completo de base de datos creado con Prisma
- ✅ API REST con autenticación JWT implementada
- ✅ Todos los módulos CRUD funcionando (Operaciones, Clientes, Facturas, Pagos, Gastos, Tareas, Notas, Archivos, Calendario, Leads, Cotizaciones)
- ✅ Configuración de Replit completada
- ✅ Datos de prueba eliminados
- ✅ Deployment configurado

## Configuración de Replit

### Variables de Entorno Necesarias
- `DATABASE_URL`: URL de conexión a PostgreSQL (configurada)
- `GEMINI_API_KEY`: Clave API de Google Gemini (opcional)

### Workflows
- **Frontend**: `npm run dev` en puerto 5000 (React + Vite)
- **Backend**: `./start.sh` en puerto 3001 (NestJS + Prisma)

### Deployment
- Tipo: Autoscale (sin estado)
- Build: `npm run build`
- Run: `npm run preview`

## Desarrollo

### Instalar dependencias
```bash
npm install
```

### Ejecutar en desarrollo
```bash
npm run dev
```

### Construir para producción
```bash
npm run build
```

## Arquitectura de la Aplicación

La aplicación es una Single Page Application (SPA) con:

- **Autenticación simulada**: Login/Register pages (sin backend real)
- **Dashboard central**: `DashboardPage.tsx` actúa como contenedor principal
- **Gestión de estado**: Todos los datos se gestionan con React useState
- **Módulos principales**:
  - Operaciones logísticas
  - Gestión de clientes y proveedores
  - Finanzas (facturas, pagos, gastos)
  - Email integrado
  - Calendario y tareas
  - Cotizaciones
  - Automatizaciones

## Backend API

El backend proporciona endpoints REST completos para todos los módulos:

### Autenticación
- `POST /api/auth/register` - Registro de usuarios
- `POST /api/auth/login` - Login con JWT

### Módulos Disponibles
Todos los módulos tienen endpoints CRUD estándar (GET, POST, PUT, DELETE):
- `/api/users` - Gestión de usuarios
- `/api/organizations` - Gestión de organizaciones (GET /current, PUT /current)
- `/api/clients` - Gestión de clientes
- `/api/operations` - Gestión de operaciones logísticas
- `/api/invoices` - Gestión de facturas
- `/api/payments` - Gestión de pagos
- `/api/expenses` - Gestión de gastos
- `/api/tasks` - Gestión de tareas Kanban
- `/api/notes` - Gestión de notas
- `/api/files` - Gestión de archivos
- `/api/calendar` - Gestión de eventos del calendario
- `/api/leads` - Gestión de prospectos
- `/api/quotations` - Gestión de cotizaciones

### Multi-Tenancy
- Todas las entidades filtradas por `organizationId`
- JWT incluye `organizationId` para validación
- Organizaciones creadas automáticamente durante registro
- Aislamiento completo de datos entre organizaciones

## Base de Datos (Neon PostgreSQL)

Esquema completo implementado con las siguientes tablas:
- users, refresh_tokens, organizations
- clients, suppliers, employees
- operations, operation_assignees, operation_suppliers
- tasks, task_assignees, columns
- notes, documents
- invoices, payments, expenses, bank_accounts, bank_transactions
- events, leads, quotations
- email_accounts, email_messages
- file_folders, files
- automations, reconciliation_sessions

## Notas Importantes

1. **Datos de prueba eliminados**: El archivo `data/dummyData.ts` ahora contiene arrays vacíos
2. **Base de datos**: Esquema completo creado en Neon PostgreSQL y listo para usar
3. **Backend funcional**: API REST completa con autenticación JWT
4. **Tailwind CDN**: Actualmente usa CDN de Tailwind (solo desarrollo, cambiar para producción)
5. **Próximo paso**: Conectar el frontend React con el backend API

## Próximos Pasos Sugeridos

1. ✅ ~~Implementar backend API para persistencia de datos~~ - COMPLETADO
2. ✅ ~~Conectar frontend React con el backend API~~ - COMPLETADO
3. **Implementar Google OAuth para email y calendario** - PENDIENTE
4. Configurar almacenamiento de archivos (Replit Object Storage)
5. Configurar Tailwind CSS como PostCSS plugin (eliminar CDN)
6. Agregar validaciones y manejo de errores más robustos
7. Implementar sistema de automatizaciones
8. Agregar tests unitarios y de integración

## Cambios Recientes

**2025-10-21**
- Eliminados todos los datos de prueba de `dummyData.ts`
- Configurado port 5000 para Replit (frontend)
- Agregado `allowedHosts: true` para proxy de Replit
- Configurado DATABASE_URL como secreto
- Configuración de deployment completada
- **Backend NestJS completo implementado**:
  - Esquema Prisma con todas las tablas creadas en Neon
  - Módulos CRUD para todas las entidades
  - Autenticación JWT con refresh tokens
  - API REST completa en puerto 3001
  - 80+ endpoints disponibles
- **Frontend conectado con backend**:
  - AuthContext implementado para gestión de sesión
  - Login y Register conectados con backend API
  - CompanyProfilePage carga y guarda datos reales desde backend
  - Multi-tenancy implementado con organizationId en todas las tablas
  - JWT incluye organizationId para aislamiento de datos
  - Organizaciones creadas automáticamente durante registro
