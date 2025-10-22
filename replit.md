# Nexxio - Supply Chain Management Platform

## Overview
Nexxio is a comprehensive logistics and CRM platform designed to manage operations, clients, and finances. It incorporates AI-driven capabilities to streamline supply chain management, customer relationships, and financial processes. The platform aims to provide a robust solution for businesses to optimize their logistics, enhance customer interactions, and maintain financial oversight.

## User Preferences
I prefer detailed explanations. Ask before making major changes. I want iterative development. I prefer simple language. I like functional programming. Do not make changes to the folder Z. Do not make changes to the file Y.

## System Architecture
Nexxio is built as a Single Page Application (SPA) with a clear separation between frontend and backend.

**UI/UX Decisions:**
The frontend uses React with TypeScript, styled using Tailwind CSS, and bundled with Vite. The design focuses on a modular approach with reusable components.

**Technical Implementations & Feature Specifications:**
-   **Frontend**: React, TypeScript, Vite, Tailwind CSS.
-   **Backend**: NestJS framework, providing a comprehensive REST API.
-   **Database**: PostgreSQL (Neon) with Prisma ORM.
-   **Authentication**: JWT-based authentication with refresh tokens and Google OAuth.
-   **Multi-Tenancy**: All data is isolated by `organizationId`, enforced through JWT validation and database queries.
-   **Core Modules**: Logistics Operations, Client/Supplier Management, Financial Management (Invoices, Payments, Expenses), Employee Management, Task Management (Kanban), Notes, File Management, Calendar and Events, Lead and Quotation Management.
-   **File Storage**: Integrated with Backblaze B2 for secure and scalable file storage of documents, attachments, and logos.
-   **File Manager Module**: Read-only unified view of all files stored in Backblaze B2 across the system.
    -   **Unified View**: Aggregates files from three sources: Files module (general files with folders), Operation Documents, and Email Files (HTML content from synchronized emails).
    -   **Organized Display**: Files are grouped in collapsible sections by source (General Files by folder, Operation Documents by operation reference, and Email Files).
    -   **Features**: Compact grid view (up to 6 columns) and list view modes, advanced filtering (by source, file type), real-time search functionality, auto-refreshing statistics (every 30 seconds).
    -   **File Sources**: 
        - `files` table: General files with folder organization
        - `documents` table: Operation-related documents
        - `emailMessages` table: HTML email content and attachments stored in B2
    -   **Secure Access**: Uses signed URLs (valid for 2 hours) generated via AWS S3 SDK for temporary authorized access to private Backblaze B2 files.
    -   **Preview Features**: Image thumbnails with lazy loading, file type icons, compact file cards optimized for large datasets (1425+ files).
    -   **Read-Only**: View and download only; no editing or deletion capabilities (managed through respective modules).
    -   **Statistics Dashboard**: Real-time metrics showing total file count, storage usage, and breakdown by source (general files, operation documents, email files).
-   **Operation Management**: Includes notes, tasks (with assignees and Kanban board integration), documents (stored in Backblaze B2), and commission tracking.
-   **Financial Management**: Invoices, Payments, and Expenses modules enforce organization-level data scoping and validation.
-   **Google Workspace Integration (Multi-Account)**:
    -   **Architecture**: Uses an `EmailAccount` model allowing users to connect multiple Google accounts.
    -   **Gmail API**: Full email management (send, read, reply, label) supporting multi-account access.
    -   **Google Calendar API**: Complete calendar management (list, create, update, delete events) with automatic background sync and visual indicators. Enforces multi-tenant security and includes cascaded event deletion and cleanup.
    -   **Email Analysis Module**: Hybrid storage (metadata in PostgreSQL, heavy content in Backblaze B2). Features include comprehensive email sync, real-time metrics, a configuration wizard for sync date ranges, and automatic storage cleanup.
    -   **OAuth Flow**: Secure OAuth 2.0 with automatic token refresh, state validation, and robust error logging.
-   **Push Notifications**: Integrated SendPulse web push notifications for real-time alerts.
    -   **User Controls**: `NotificationSettings` model allows users to manage preferences for various event types (operations, tasks, invoices, payments, expenses, calendar, emails).
    -   **Event-Driven**: Notifications triggered for new operations, tasks, invoices, payments, expenses, calendar events, and important emails.

**System Design Choices:**
-   **Modular Design**: Structured into distinct modules for maintainability and scalability.
-   **Data Isolation**: Strong multi-tenancy ensures data privacy and security.
-   **Scalability**: Utilizes cloud-native services (Neon, Backblaze B2) and a stateless NestJS backend.
-   **Developer Experience**: Vite for fast development, TypeScript for type safety, and Prisma for efficient database interactions.

## External Dependencies
-   **Database**: PostgreSQL (via Neon)
-   **Cloud Storage**: Backblaze B2
-   **AI Services**: Google Gemini API
-   **Authentication/Authorization**: Google OAuth
-   **Push Notifications**: SendPulse