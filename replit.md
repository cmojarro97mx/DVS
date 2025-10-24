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
    -   **Connection Optimization**: Uses a global `PrismaModule` to ensure a single PrismaService instance across the entire application, reducing database connections from 198 (22 instances × 9 connections) to just 9 (1 instance × 9 connections) - a 91% reduction.
    -   **Enhanced Stability**: PrismaService includes automatic retry logic (up to 5 attempts), connection pooling, and comprehensive error handling for improved reliability in Replit's cloud environment.
    -   **Important**: Never add PrismaService to the `providers` array of feature modules - it's globally available via the PrismaModule.
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
    -   **Notes System**: Full CRUD operations with database persistence. Notes are linked to operations and stored in PostgreSQL with automatic loading and syncing.
    -   **Tasks System**: Kanban-based task management with automatic column assignment. When creating tasks, the backend automatically assigns them to the "To Do" column if no column is specified.
-   **Financial Management**: Invoices, Payments, and Expenses modules enforce organization-level data scoping and validation.
-   **Google Workspace Integration (Multi-Account)**:
    -   **Architecture**: Uses an `EmailAccount` model allowing users to connect multiple Google accounts.
    -   **Gmail API**: Full email management (send, read, reply, label) supporting multi-account access.
    -   **Google Calendar API**: Complete calendar management (list, create, update, delete events) with automatic background sync and visual indicators. Enforces multi-tenant security and includes cascaded event deletion and cleanup.
    -   **Email Analysis Module**: Hybrid storage (metadata in PostgreSQL, heavy content in Backblaze B2). Features include comprehensive email sync, real-time metrics, a configuration wizard for sync date ranges, and automatic storage cleanup.
    -   **OAuth Flow**: Secure OAuth 2.0 with automatic token refresh, state validation, and robust error logging.
    -   **Advanced Email-to-Operation Linking**: Intelligent automation system that links emails to operations using:
        - Standard fields: Client email, Booking/Tracking numbers, MBL/AWB, HBL/AWB, Operation ID
        - **OCR & PDF Text Extraction**: Analyzes attachments (PDFs, images, invoices, shipping documents) using Tesseract.js OCR and pdf-parse to find operation references even when missing from subject/body
        - **Smart Pattern Matching**: Searches in email subject, body, and extracted attachment text
        - Processes up to 100 emails with attachments per automation cycle
        - Logs detailed matching information for transparency
    -   **Fresh Email Viewer**: On-demand email retrieval from Gmail OAuth with original HTML design:
        - "Diseño Original" button fetches email directly from Gmail API
        - Preserves complete email styling and layout as seen in Gmail
        - Displays fresh attachments metadata from Gmail
        - Improved iframe rendering with adjustable heights (300-600px for fresh emails)
        - Secure temporary access without permanent storage
-   **Web Push Notifications & Notification Center** (100% Open Source): Native browser push notification system using W3C Push API with in-app notification management.
    -   **Database Storage**: 
        - `Notification` model: Stores all notifications in PostgreSQL with user/organization relations, types (info, success, warning, error, event, task, invoice), read/unread status
        - `PushSubscription` model: Stores device push subscriptions with endpoint, keys, user-agent, and last-used tracking
        - `NotificationSettings` model: User preferences for various event types (operations, tasks, invoices, payments, expenses, calendar, emails)
    -   **Backend (Open Source - web-push)**:
        - Uses `web-push` npm library (open source implementation of W3C Push API)
        - VAPID authentication for secure push notifications
        - Automatic subscription management (register/unregister devices)
        - Expired subscription cleanup (410 status code detection)
        - Multi-device support (users can have multiple subscriptions)
    -   **Event-Driven**: Notifications triggered for new operations, tasks, invoices, payments, expenses, calendar events, and important emails.
    -   **Automated Background Tasks** (`NotificationsSchedulerService`):
        - **Upcoming Events**: Checks every 5 minutes for calendar events starting within 1 hour and sends reminders to assigned users
        - **Overdue Tasks**: Checks every 10 minutes for tasks past their due date and alerts assigned users
        - **Pending Invoices**: Checks every 30 minutes for invoices due within 3 days and notifies the organization
        - **Daily Summary**: Sends a comprehensive daily report at 9 AM with upcoming events, pending tasks, and active operations
        - All scheduled notifications track sent status to avoid duplicates (fields: `notificationSent`, `overdueNotificationSent`, `reminderSent`)
    -   **Frontend (Native Web APIs)**:
        - **Service Worker** (`/sw.js`): Handles push events, notification click/close events, and subscription changes
        - **Automatic Registration**: Push notifications automatically requested and registered on login/register
        - **Notification Center UI**: Interactive dropdown in TopHeader with bell icon, animated badge showing unread count
        - **Features**: View all notifications, mark as read (individual/bulk), delete notifications, automatic polling (30s intervals), click-to-navigate
        - **Rich Display**: Color-coded by type, time-relative timestamps ("Hace 5m"), icons per type, notification preview
    -   **API Endpoints**: 
        - `GET /api/notifications` - Fetch user notifications (paginated)
        - `GET /api/notifications/unread-count` - Get unread count for badge
        - `GET /api/notifications/vapid-public-key` - Get VAPID public key for subscription
        - `POST /api/notifications/subscribe` - Register push subscription
        - `DELETE /api/notifications/subscribe` - Unregister push subscription
        - `GET /api/notifications/subscriptions` - List user's devices
        - `POST /api/notifications/:id/read` - Mark single as read
        - `POST /api/notifications/read-all` - Mark all as read
        - `DELETE /api/notifications/:id` - Delete notification
        - `GET /api/notifications/settings` - Get user notification preferences
        - `PUT /api/notifications/settings` - Update preferences
    -   **Configuration Page**: Full settings UI in slidemenu (`NotificationsSettingsPage`) with toggle controls for each notification type
    -   **Browser Compatibility**:
        - Desktop: Chrome, Firefox, Edge, Safari (full support)
        - Android: Chrome, Firefox, Edge (full support)
        - iOS 16.4+: Requires adding site to home screen first (PWA requirement)
    -   **Dual System**: When `sendNotificationToUser()` is called: (1) stores in database for in-app display, (2) sends native push notification to all user devices if push enabled
-   **Virtual Assistant (Voice-Enabled AI)**:
    -   **Backend**: NestJS WebSocket Gateway for real-time bidirectional communication with Gemini AI.
    -   **Frontend**: React components with Web Speech API for native browser voice recognition and synthesis.
    -   **Access Control**: Token-based system for secure, authentication-free access via unique UUID links.
    -   **AI Integration**: Powered by Google Gemini Flash API (gemini-2.0-flash-exp) with function calling capabilities to query and create operations, clients, events, and tasks.
    -   **Real-Time Conversation**: Full duplex communication through Socket.IO WebSockets for instant voice interactions.
    -   **Customizable Settings**: Full assistant customization through settings interface:
        - **Name**: Personalize the assistant's display name
        - **Welcome Message**: Custom greeting shown on first connection
        - **System Instructions**: Define assistant behavior and personality through custom prompts
        - **Personality**: Select tone (Professional, Friendly & Professional, Casual, Formal, Enthusiastic)
        - Settings stored in JSON field and applied dynamically via WebSocket gateway
    -   **Voice Interface (100% Open Source)**: 
        - **Speech-to-Text (STT)**: Web Speech API's SpeechRecognition for voice input (voz → texto)
        - **Text-to-Speech (TTS)**: Web Speech API's SpeechSynthesis for voice output (texto → voz)
        - Optimized TTS settings: rate 0.95, pitch 1.0, prioritizing Neural/Enhanced/Premium voices
        - Intelligent voice selection in Spanish (es-ES, es-MX, es-US)
        - Zero dependencies, no downloads, fully browser-native
        - Works on both mobile and desktop devices using system voices
    -   **Connection**: Auto-detects production URL using `window.location.origin` to connect to backend WebSocket (port 3001).
    -   **Interface**: Modern dark theme with ElevenLabs-inspired audio visualizations, supports both text and voice input.
    -   **Management**: Edit button in config page opens modal with all customization fields, instant updates via PUT endpoint
    -   **Browser Compatibility**: 
        - Text input/output: Works universally on all browsers
        - Voice recognition (STT): Chrome, Edge, Safari (via Web Speech API)
        - Voice synthesis (TTS): All modern browsers with native voices

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