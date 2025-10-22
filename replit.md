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
- ✅ Todos los módulos CRUD funcionando (Operaciones, Clientes, Empleados, Facturas, Pagos, Gastos, Tareas, Notas, Archivos, Calendario, Leads, Cotizaciones)
- ✅ **Frontend completamente conectado con backend API**:
  - Clientes: ClientsManager y CreateClientPage
  - Operaciones: LogisticsProjectsPage y CreateOperationPage
  - Empleados: EmployeesPage (auto-creación durante registro)
  - Servicios TypeScript para todos los módulos (invoices, payments, expenses, tasks, notes, employees)
- ✅ Configuración de Replit completada
- ✅ Datos de prueba eliminados
- ✅ Deployment configurado
- ✅ **Google OAuth backend implementado**:
  - GoogleAuthModule con endpoints: /authorize, /callback, /status, /disconnect
  - Campos agregados al schema Prisma: googleAccessToken, googleRefreshToken, googleTokenExpiry
  - Prisma Client regenerado con nuevos campos
  - Backend compilando sin errores
- ✅ **Módulo de Employees implementado**:
  - Schema Prisma actualizado con organizationId y userId en Employee
  - Módulo completo en backend (service, controller, module)
  - Auto-creación de Employee durante registro de usuario
  - Employee creado para usuario de prueba existente
  - Frontend conectado con backend API de employees
  - Validación y error handling implementados

## Configuración de Replit

### Variables de Entorno Necesarias
- `DATABASE_URL`: URL de conexión a PostgreSQL (configurada)
- `GEMINI_API_KEY`: Clave API de Google Gemini (opcional)
- `GOOGLE_CLIENT_ID`: ID de cliente de Google OAuth (configurado)
- `GOOGLE_CLIENT_SECRET`: Secret de cliente de Google OAuth (configurado)

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
- `/api/employees` - Gestión de empleados (con auto-creación durante registro)
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

### Google OAuth
- `GET /api/google-auth/authorize` - Iniciar autorización OAuth
- `GET /api/google-auth/callback` - Callback de Google OAuth
- `GET /api/google-auth/status` - Verificar estado de conexión
- `GET /api/google-auth/disconnect` - Desconectar cuenta de Google

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
3. ✅ ~~Conectar módulo de operaciones con asignación de usuarios~~ - COMPLETADO
4. ⏳ **Implementar Google OAuth para email y calendario** - EN PROGRESO
5. Configurar almacenamiento de archivos (Replit Object Storage)
6. Agregar validaciones y manejo de errores más robustos
7. Implementar sistema de automatizaciones
8. Configurar Tailwind CSS como PostCSS plugin (eliminar CDN)
9. Agregar tests unitarios y de integración

## Cambios Recientes

**2025-10-22 (Tarde)**
- ✅ **Módulo de Operaciones completamente conectado con backend**:
  - Frontend ahora envía campo `assignees` al crear operaciones
  - Backend procesa assignees correctamente usando tabla junction `OperationAssignee`
  - OperationsService actualizado para crear relaciones many-to-many con usuarios
  - JWT strategy actualizado para incluir `userId` y `organizationId` en `req.user`
  - OperationsController implementa multi-tenancy (filtra por organizationId)
  - LogisticsProjectsPage mapea correctamente assignees desde estructura anidada del backend
  - Interfaz TypeScript `CreateOperationData` actualizada con campo assignees
  - ✅ **Problema resuelto**: Operaciones ahora se guardan en PostgreSQL con sus assignees

**2025-10-22 (Mañana)**
- ✅ **Módulo de Employees completamente funcional**:
  - Schema Prisma actualizado: agregados userId (relación con User) y organizationId
  - Módulo completo en backend: service, controller, module con validación
  - Auto-creación de Employee durante registro de usuario (rol CEO por defecto)
  - Employee creado para usuario de prueba existente
  - Frontend conectado: DashboardPage carga employees desde API al iniciar
  - Empleados aparecen en selector "Assigned To" al crear operaciones
  - Formulario de creación de empleados corregido (sin campo password)
  - EmployeesPage conectado con backend API
  - ✅ **Problema resuelto**: Usuarios ahora aparecen automáticamente en selectores de asignación

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
- **Frontend completamente conectado con backend**:
  - AuthContext implementado para gestión de sesión
  - Login y Register conectados con backend API
  - CompanyProfilePage carga y guarda datos reales desde backend
  - ClientsManager y CreateClientPage conectados con API de clientes
  - LogisticsProjectsPage y CreateOperationPage conectados con API de operaciones
  - Servicios creados para todos los módulos:
    - `clientsService.ts` - Gestión de clientes
    - `operationsService.ts` - Gestión de operaciones
    - `invoicesService.ts` - Gestión de facturas
    - `paymentsService.ts` - Gestión de pagos
    - `expensesService.ts` - Gestión de gastos
    - `tasksService.ts` - Gestión de tareas Kanban
    - `notesService.ts` - Gestión de notas
    - `employeesService.ts` - Gestión de empleados
  - Multi-tenancy implementado con organizationId en todas las tablas
  - JWT incluye organizationId para aislamiento de datos
  - Organizaciones creadas automáticamente durante registro
- **Google OAuth backend implementado**:
  - Módulo GoogleAuthModule creado en `server/src/modules/google-auth/`
  - 4 endpoints funcionando: /authorize, /callback, /status, /disconnect
  - Schema Prisma actualizado con campos: googleAccessToken, googleRefreshToken, googleTokenExpiry
  - Prisma Client regenerado correctamente
  - Backend compilando sin errores
