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
- ✅ Configuración de Replit completada
- ✅ Datos de prueba eliminados
- ✅ Deployment configurado

## Configuración de Replit

### Variables de Entorno Necesarias
- `DATABASE_URL`: URL de conexión a PostgreSQL (configurada)
- `GEMINI_API_KEY`: Clave API de Google Gemini (opcional)

### Workflow
- **Frontend**: `npm run dev` en puerto 5000

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

## Notas Importantes

1. **Datos de prueba eliminados**: El archivo `data/dummyData.ts` ahora contiene arrays vacíos
2. **Base de datos**: Está configurada pero aún no integrada con la UI
3. **Tailwind CDN**: Actualmente usa CDN de Tailwind (solo desarrollo, cambiar para producción)
4. **Sin backend**: La aplicación actual es puramente frontend sin persistencia real

## Próximos Pasos Sugeridos

1. Implementar backend API para persistencia de datos
2. Conectar UI con la base de datos PostgreSQL
3. Configurar Tailwind CSS como PostCSS plugin (eliminar CDN)
4. Implementar autenticación real con tokens JWT
5. Agregar validaciones y manejo de errores
6. Implementar integraciones reales de email y calendario

## Cambios Recientes

**2025-10-21**
- Eliminados todos los datos de prueba de `dummyData.ts`
- Configurado port 5000 para Replit
- Agregado `allowedHosts: true` para proxy de Replit
- Configurado DATABASE_URL como secreto
- Configuración de deployment completada
