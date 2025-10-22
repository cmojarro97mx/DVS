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
-   **Google Workspace Integration - Multi-Account Architecture** (October 2025):
    -   **Architecture Update**: Migrated from single-account (User model) to multi-account architecture using EmailAccount model. Each user can now connect multiple Google accounts independently.
    -   **EmailAccount Model**: Stores OAuth tokens, sync settings, and metadata for each connected Google/email account. Fields include: userId, email, provider, status, accessToken, refreshToken, tokenExpiry, syncEmail, syncCalendar, lastEmailSync, lastCalendarSync.
    -   **Gmail API**: Full email management including sending, reading, replying, and labeling messages. All operations support accountId parameter for multi-account access.
    -   **Google Calendar API**: Complete calendar management with support for listing calendars, creating/updating/deleting events, and syncing operation events to Google Calendar. All operations support accountId parameter.
        -   **Automatic Background Sync**: Cron job runs every 5 minutes to sync Google Calendar events for all EmailAccounts with `syncCalendar = true` and active refresh tokens.
        -   **Visual Indicators**: Synced events display a Google Calendar icon badge in the Calendar UI.
        -   **Individual Account Controls**: Each connected account has independent Gmail and Calendar sync toggles in the Integrations page.
        -   **Multi-Tenant Security**: Event sync enforces strict user and organization scoping with composite unique constraint `@@unique([userId, googleEventId])` in Prisma schema. Events without valid googleEventId are skipped and logged. All sync operations include organizationId validation and ownership verification before updates to prevent cross-tenant data leakage.
        -   **Cascaded Event Deletion** (October 2025): When a Google account is disconnected, all associated calendar events are automatically deleted from the database using onDelete: Cascade relationship. The disconnect endpoint returns the count of deleted events to the user.
        -   **Automatic Cleanup**: Cron job runs daily at 3 AM to permanently delete events with status 'deleted' or 'cancelled' that are older than 30 days, preventing unnecessary data accumulation.
        -   **Real-Time Synchronization**: Calendar frontend polls for updates every 15 seconds and automatically reloads when the browser tab becomes visible again, ensuring users always see the latest event data.
        -   **Enhanced UI/UX**: Calendar displays event states (scheduled, completed, cancelled) with appropriate visual indicators, shows sync status for each connected account, and provides direct links to connect Google accounts when none are linked.
    -   **Email Analysis Module** (October 2025):
        -   **Hybrid Storage Architecture**: Metadata stored in PostgreSQL (EmailMessage table), heavy content (HTML bodies, attachments) stored in Backblaze B2 with signed URLs (1-hour expiration).
        -   **EmailMessage Model**: Stores email metadata including gmailMessageId, threadId, subject, from/to/cc addresses, snippet, date, labels, isRead, hasAttachments, replyCount. Includes counters in EmailAccount for total/downloaded/replied/unreplied messages.
        -   **Email Sync Service**: Downloads complete email history from Gmail API, extracts attachments (stored in `emails/{accountId}/attachments/`), stores HTML bodies in Backblaze (`emails/{accountId}/messages/`), and maintains metadata in PostgreSQL.
        -   **Automatic Background Sync**: Cron job runs every 10 minutes to sync emails for all EmailAccounts with `syncEmail = true` and active refresh tokens. System operates fully automatically without manual intervention.
        -   **Email Analysis Page**: UI with account selector, real-time metrics display (total messages, downloaded, replied, unreplied), and comprehensive email listing with date, subject, recipients, thread chain, and full HTML content rendering. Metrics auto-refresh every 30 seconds.
        -   **Sync Control & Data Management** (October 2025 - Phase 1):
            -   **Discovery System**: Automatically detects email date range (oldest/newest messages) and total message count when user activates email sync using temporal queries (before:YYYY) instead of pagination.
            -   **Configuration Wizard**: Compact, professional UI wizard with horizontal scrollable card selector appearing before first sync activation. Preset options: Current Month, 3 months, 6 months, 1 year, 2 years, all, custom date.
            -   **Estimated Impact Display**: Shows real-time approximate number of messages and storage size to be synced based on selected date range.
            -   **Filtered Synchronization**: Email sync respects `syncFromDate` setting, using Gmail query parameter `after:YYYY/MM/DD` to download only emails from specified date forward. Sync configuration persists in DB and automatic background sync (every 10 min) respects the configured date range.
            -   **Automatic Storage Cleanup**: When user reduces sync date range (e.g., 1 year → 1 month), system automatically deletes messages outside new range from PostgreSQL and Backblaze B2, reclaiming storage space and reducing costs. Cleanup runs before applying new settings.
            -   **EmailAccount Extensions**: New fields include `syncFromDate`, `detectedOldestEmailDate`, `detectedNewestEmailDate`, `estimatedTotalMessages`, `storageUsageBytes`, `pendingInitialSync` for sync control and monitoring.
            -   **API Endpoints**: `GET /api/email-sync/accounts/:id/discovery` (detect date range), `POST /api/email-sync/accounts/:id/settings` (configure sync parameters, triggers cleanup if reducing range).
            -   **Cost Optimization**: Prevents unnecessary download of years-old emails and automatically removes outdated data, reducing storage costs and sync time significantly.
        -   **Security**: All email data scoped to userId via EmailAccount relationship. Signed URLs prevent unauthorized access to Backblaze content.
    -   **OAuth Flow**: Secure OAuth 2.0 flow with automatic token refresh, state validation, and persistent storage of access/refresh tokens in EmailAccount table.
        -   **Desktop**: Popup window for OAuth (500x600px) with automatic closure on success/error. Uses window.postMessage for communication.
        -   **Mobile**: Full-page redirect flow (detects iOS/Android devices) with seamless return to dashboard.
        -   **Security**: State-based CSRF protection with 10-minute expiry, secure token storage in PostgreSQL with unique constraint on (userId, email).
        -   **Bug Fix (October 2025)**: Added comprehensive logging to OAuth callback to track email obtained from Google. Logs include userId, email from Google userinfo, and account creation/update events to help diagnose any email mismatch issues.
    -   **Endpoints**:
        -   Google Auth: `/api/google-auth/auth-url` (get OAuth URL), `/api/google-auth/callback` (OAuth callback), `/api/google-auth/status` (list all connected accounts), `/api/google-auth/disconnect/:accountId` (disconnect specific account), `/api/google-auth/sync/gmail/enable` (body: {accountId}), `/api/google-auth/sync/gmail/disable` (body: {accountId}), `/api/google-auth/sync/calendar/enable` (body: {accountId}), `/api/google-auth/sync/calendar/disable` (body: {accountId})
        -   Gmail: All endpoints support optional `accountId` query parameter. `/api/gmail/messages?accountId=xxx`, `/api/gmail/messages/send` (body: {accountId}), `/api/gmail/messages/:id/reply` (body: {accountId}), `/api/gmail/labels?accountId=xxx`
        -   Calendar: All endpoints support optional `accountId` query parameter. `/api/google-calendar/calendars?accountId=xxx`, `/api/google-calendar/events?accountId=xxx`, `/api/google-calendar/sync-events` (body: {accountId}), `/api/google-calendar/sync-from-google` (body: {accountId})
        -   Email Sync: `/api/email-sync/sync/:accountId` (POST, trigger email sync), `/api/email-sync/accounts` (GET, list accounts with email sync enabled), `/api/email-sync/metrics/:accountId` (GET, get email metrics), `/api/email-sync/messages/:accountId` (GET, list all synced messages), `/api/email-sync/message/:messageId` (GET, get message with signed URLs for HTML and attachments), `/api/email-sync/html/:messageId` (GET, get signed URL for HTML body)
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