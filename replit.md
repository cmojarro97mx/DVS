# Nexxio - Supply Chain Management Platform

## Overview
Nexxio is a comprehensive logistics and CRM platform designed to manage operations, clients, and finances. It incorporates AI-driven capabilities to streamline supply chain management, customer relationships, and financial processes. The platform aims to provide a robust solution for businesses to optimize their logistics, enhance customer interactions, and maintain financial oversight.

## User Preferences
I prefer detailed explanations. Ask before making major changes. I want iterative development. I prefer simple language. I like functional programming. Do not make changes to the folder Z. Do not make changes to the file Y.

## System Architecture
Nexxio is built as a Single Page Application (SPA) with a clear separation between frontend and backend.

**UI/UX Decisions:**
The frontend uses React 19 with TypeScript, styled using Tailwind CSS, and bundled with Vite 6. The main dashboard (`DashboardPage.tsx`) acts as the central container, with state managed via React's `useState` hooks. The design focuses on a modular approach with reusable components.

**Technical Implementations & Feature Specifications:**
-   **Frontend**: React 19, TypeScript, Vite 6, Tailwind CSS.
-   **Backend**: NestJS framework, providing a comprehensive REST API.
-   **Database**: PostgreSQL (Neon) with Prisma ORM for schema management.
-   **Authentication**: JWT-based authentication with refresh token mechanisms for persistent sessions. Google OAuth for external integrations.
-   **Multi-Tenancy**: All data is isolated by `organizationId`, enforced through JWT validation and database queries. Organizations are automatically created upon user registration.
    -   **Security Implementation (October 2025)**: All modules (Notes, Tasks, Invoices, Payments, Expenses) enforce strict organization-level data isolation. Services validate that all referenced entities (clients, operations, bank accounts, invoices) belong to the requesting user's organization before any create/update operation, preventing cross-organization data leakage.
-   **Core Modules**:
    -   Logistics Operations (with notes, tasks, documents, and commission tracking)
    -   Client and Supplier Management
    -   Financial Management (Invoices, Payments, Expenses)
    -   Employee Management
    -   Task Management (Kanban, assignable to employees)
    -   Notes (with operation association and file attachments)
    -   File Management (Drag & drop, folder management)
    -   Calendar and Events
    -   Lead and Quotation Management
-   **File Storage**: Integrated with Backblaze B2 (S3-compatible) for secure and scalable file storage. All operation documents, note attachments, and organization logos are stored in Backblaze B2.
-   **Operation Management Features** (October 2025):
    -   **Notes**: Notes can be associated with operations via `operationId`. Notes service filters by organizationId and operationId for multi-tenant security.
    -   **Tasks**: Tasks can be assigned to employees and associated with operations. Tasks include assignees (many-to-many with users), columnId for Kanban board management, and operationId. All queries filter by organizationId.
    -   **Documents**: Documents are uploaded to Backblaze B2 in folders organized by operation (`operations/{operationId}/`). API endpoints: GET, POST, DELETE at `/operations/:id/documents`.
    -   **Commissions**: Commission history is stored as JSON in the Operation model. Endpoint: PUT `/operations/:id/commissions`.
-   **Financial Management Features** (October 2025):
    -   **Invoices**: All invoices are scoped to organizationId. Service validates that referenced clients, operations, and bank accounts belong to the same organization before create/update.
    -   **Payments**: All payments are scoped to organizationId. Service validates that referenced invoices, operations, and bank accounts belong to the same organization before create/update.
    -   **Expenses**: All expenses are scoped to organizationId and userId. Service validates that referenced operations and bank accounts belong to the same organization before create/update.
-   **Google Workspace Integration** (October 2025):
    -   **Gmail API**: Full email management including sending, reading, replying, and labeling messages. OAuth tokens stored securely in User model.
    -   **Google Calendar API**: Complete calendar management with support for listing calendars, creating/updating/deleting events, and syncing operation events to Google Calendar.
    -   **OAuth Flow**: Secure OAuth 2.0 flow with automatic token refresh, state validation, and persistent storage of access/refresh tokens in database.
    -   **Endpoints**:
        -   Google Auth: `/api/google-auth/authorize`, `/api/google-auth/callback`, `/api/google-auth/status`, `/api/google-auth/disconnect`
        -   Gmail: `/api/gmail/messages`, `/api/gmail/messages/send`, `/api/gmail/messages/:id/reply`, `/api/gmail/labels`
        -   Calendar: `/api/google-calendar/calendars`, `/api/google-calendar/events`, `/api/google-calendar/sync-events`
-   **API Endpoints**: Comprehensive CRUD operations for all modules, including:
    -   Authentication and organization management
    -   Google OAuth flow with persistent connections
    -   Operation-specific endpoints for documents and commissions
    -   Note and Task filtering by operationId
    -   Gmail and Google Calendar integrations

**System Design Choices:**
-   **Modular Design**: The application is structured into distinct modules for better maintainability and scalability.
-   **Data Isolation**: Strong multi-tenancy ensures data privacy and security between different organizations.
-   **Scalability**: Utilizing cloud-native services like Neon for PostgreSQL and Backblaze B2 for storage, along with a stateless NestJS backend, supports horizontal scaling.
-   **Developer Experience**: Vite for fast development and HMR, TypeScript for type safety, and Prisma for efficient database interactions.

## External Dependencies
-   **Database**: PostgreSQL (via Neon)
-   **Cloud Storage**: Backblaze B2 (S3-compatible API for file uploads and storage)
-   **AI Services**: Google Gemini API (optional, for AI-driven capabilities)
-   **Authentication/Authorization**: Google OAuth (for user authentication and integration with Google services)