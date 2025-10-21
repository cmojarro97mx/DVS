# Nexxio - Logistics CRM

## Overview
Nexxio es una plataforma completa para gestión de cadena de suministro (Supply Chain) con capacidades de gestión de operaciones logísticas, clientes, finanzas e integración con IA.

## Estado del Proyecto
- **Última actualización**: 21 de octubre de 2025
- **Estado**: Proyecto configurado y funcionando en Replit
- **Base de datos**: PostgreSQL (Neon) configurada

## Tecnologías
- **Frontend**: React 19 + TypeScript + Vite
- **Estilos**: Tailwind CSS (CDN)
- **Base de datos**: PostgreSQL (Neon)
- **IA**: Google Gemini API

## Estructura del Proyecto
```
/
├── components/          # Componentes React reutilizables
│   ├── dashboard/      # Componentes del dashboard
│   └── icons/          # Iconos SVG
├── pages/              # Páginas/vistas principales
├── data/               # Datos iniciales (vacíos)
├── App.tsx             # Componente raíz
├── index.tsx           # Punto de entrada
└── index.html          # HTML principal
```

## Características Principales
- Dashboard de operaciones logísticas
- Gestión de clientes y proveedores
- Sistema de finanzas (facturas, pagos, gastos)
- Cliente de email integrado
- Calendario de eventos
- Gestión de tareas (Kanban)
- Gestor de archivos
- Conciliación bancaria
- Generación de cotizaciones
- Leads y CRM

## Configuración de Desarrollo

### Variables de Entorno
- `DATABASE_URL`: URL de conexión a PostgreSQL (Neon)
- `GEMINI_API_KEY`: API key de Google Gemini (opcional)

### Comandos
- `npm run dev`: Servidor de desarrollo (puerto 5000)
- `npm run build`: Compilar para producción
- `npm run preview`: Vista previa de producción

## Notas de Configuración
- El servidor de desarrollo está configurado en el puerto 5000
- Los datos de prueba han sido eliminados - la aplicación inicia vacía
- La base de datos PostgreSQL está conectada vía Neon
- El frontend está configurado para funcionar correctamente en el entorno de Replit con proxy

## Deployment
- **Tipo**: Autoscale (stateless)
- **Build**: `npm run build`
- **Run**: `npm run preview --port 5000 --host 0.0.0.0`

## Preferencias del Usuario
- Sistema sin datos de prueba/falsos
- Base de datos PostgreSQL de Neon
- Idioma: Español
