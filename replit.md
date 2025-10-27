# Nexxio - Supply Chain Management Platform

## Overview
Nexxio is an AI-driven logistics and CRM platform designed to optimize supply chain management, customer relationships, and financial processes. It provides a comprehensive solution for businesses to streamline operations, enhance client interactions, and maintain financial oversight.

## Recent Changes (October 27, 2025)
-   **Smart Operation Creator - AI-Powered Operation Creation from Emails**: Implemented intelligent automation system that detects and creates operations from emails with patterns like reference numbers (e.g., "NAVI-121839"):
    - **Database Schema**: Added `operation_linking_rules` table with configurable patterns, default assignees, and auto-creation settings; extended `operations` table with `needsAttention`, `autoCreated`, and `missingFields[]` fields
    - **Backend Services**: 
        - `OperationLinkingRulesService`: Full CRUD for managing linking rules with multi-tenancy
        - `SmartOperationCreatorService`: AI-powered service using Google Gemini to analyze email content, extract operation details (client, origin, destination, dates), verify existing operations, and create new ones with intelligent data validation
    - **Email Sync Integration**: Every new email is automatically analyzed in real-time; if a matching pattern is found and auto-creation is enabled, the system creates the operation and links the email
    - **Frontend Configuration UI**: 
        - Accessible via Email & Calendario → Reglas de Vinculación
        - Subject pattern configuration, default employee assignment, enable/disable auto-creation toggle
        - Full CRUD operations with professional UI following platform design patterns
    - **Visual Indicators**: 
        - "Auto-Created" badges on operations list for AI-generated operations
        - "Needs Attention" badges for operations with incomplete data
        - Alert banners in operation detail page showing specific missing fields
        - Blue info banner for successfully auto-created operations with complete data
    - **Data Quality**: AI validates extracted information; leaves fields empty if uncertain rather than guessing, marks operation as `needsAttention=true`
    - **Smart Detection**: Checks for duplicate operations before creation to prevent duplicates
    - **Navigation**: Replaced old "Creador Inteligente" module; consolidated functionality into unified "Reglas de Vinculación" accessible from Email & Calendario hub

## Recent Changes (October 26, 2025)
-   **CRITICAL DATABASE FIX - Form Saving Issue Resolved**: Fixed critical issue where all forms (tasks, quotations, invoices, etc.) failed to save data. Applied two essential corrections:
    1. Added `@updatedAt` decorator to all `updatedAt` fields in Prisma schema (32 models affected) - enables automatic timestamp management by Prisma
    2. Configured UUID auto-generation for all table `id` columns (32 tables) via `ALTER TABLE ... SET DEFAULT gen_random_uuid()::text` - eliminates "null value in column id" errors
    **Result**: All form submissions now work correctly across the entire platform
-   **Operations Documents Upload - Backblaze Integration Fixed**: Resolved critical issue where documents in operations were only updating local state without actually uploading to Backblaze:
    - Modified `ProjectDocuments` component to call `operationsService.uploadDocument()` API for each file
    - Added professional UX feedback: full-screen loading overlay with spinner and "Subiendo archivos a Backblaze..." message
    - Disabled upload buttons during upload to prevent duplicate submissions
    - Added async/await error handling with user-friendly error messages
    - Files now properly persist to Backblaze B2 storage with proper metadata (id, name, url, size, mimeType)
    - **Note**: Folders remain client-side only (not persisted to backend) for now
-   **Operations Notes - Critical Fixes & Backblaze Integration**:
    - **Fixed Note Filtering**: Changed from incorrect ID prefix matching `n.id.startsWith()` to proper `operationId` filtering in DashboardPage
    - **Fixed Note Sorting**: Changed from non-existent `timestamp` field to `createdAt` field with proper date handling
    - **Fixed Note Interface**: Updated TypeScript interfaces to include all database fields (`author`, `attachmentUrl`, `attachmentName`, etc.)
    - **Fixed CreateNoteData Interface**: Added `attachmentUrl` and `attachmentName` fields to `CreateNoteData` interface in `notesService.ts` - this was preventing notes with file attachments from being saved
    - **Backblaze File Upload Integration**: Notes with attachments now properly upload files to Backblaze B2 storage before creating the note
    - **Loading States**: Added professional UX feedback with spinner and "Guardando..." text during file upload and note creation
    - **Error Handling**: Enhanced error handling in `handleAddClick` with try-catch blocks and user-friendly error messages
    - **Display Attachments**: Notes with attachments now display download links with proper file names and icons
    - **Result**: Notes now display correctly, attachments persist to Backblaze, and users get clear feedback during the save process
-   **Clients Module - Multi-Tenancy Security & UX Improvements**: 
    - Applied proper multi-tenancy pattern to clients controller/service using `@Request()` decorator and `organizationId` filtering on all operations (create, read, update, delete)
    - Enhanced CreateClientPage with professional UX feedback:
        - Full-screen loading overlay with spinner and "Guardando cliente..." message
        - Success banner with green checkmark: "¡Cliente creado exitosamente!"
        - Improved error display with red banner and error icon
        - Button states: Shows inline spinner during save, disables button to prevent duplicates, displays "Guardando..." → "¡Guardado!" text progression
        - Added protection against multiple submissions with early return if already saving
        - 1-second success message display before auto-closing form
-   **Quotations Module - Multi-Tenancy Security Fix**: Added missing `organizationId` field to quotations model in Prisma schema and updated controller/service to use proper multi-tenancy with `@Request()` decorator pattern
-   **Professional UI Design Consistency**: Verified and maintained professional flat design patterns across Quotations, Invoices, Expenses, and Bank Accounts modules with consistent styling, clean layouts, and user-friendly interfaces

## User Preferences
I prefer detailed explanations. Ask before making major changes. I want iterative development. I prefer simple language. I like functional programming. Do not make changes to the folder Z. Do not make changes to the file Y.

## System Architecture
Nexxio is a Single Page Application (SPA) with a decoupled frontend and backend.

**UI/UX Decisions:**
The frontend uses React with TypeScript and Tailwind CSS, bundled with Vite, focusing on a modular and reusable component-based design.

**Technical Implementations & Feature Specifications:**
-   **Frontend**: React, TypeScript, Vite, Tailwind CSS.
-   **Backend**: NestJS framework for REST APIs.
-   **Database**: PostgreSQL (Neon) with Prisma ORM, optimized for connection pooling and error handling.
-   **Authentication**: JWT-based authentication with refresh tokens and Google OAuth.
-   **Multi-Tenancy**: Data isolation by `organizationId` is enforced throughout the system.
-   **Core Modules**: Logistics Operations, Client/Supplier Management, Financial Management, Employee & Task Management, Notes, File Management, Calendar, and Lead/Quotation Management.
-   **File Storage**: Integrated with Backblaze B2 for secure file storage.
-   **File Manager Module**: Provides a read-only, unified view of all files stored in Backblaze B2, supporting advanced filtering, search, and secure access via signed URLs.
-   **Operation Management**: Includes notes, tasks with Kanban board integration, documents, and commission tracking.
-   **Financial Management**: Modules for Invoices, Payments, and Expenses with organization-level data scoping.
-   **Google Workspace Integration (Multi-Account)**: Supports multiple Google accounts for Gmail and Calendar API access, including advanced email-to-operation linking via OCR and smart pattern matching.
-   **Web Push Notifications & Notification Center**: An open-source, native browser push notification system with in-app management, event-driven triggers, and automated background tasks for reminders and summaries.
-   **Virtual Assistant (Voice-Enabled AI)**: A voice-enabled AI assistant leveraging Google Gemini Flash API via NestJS WebSockets and Web Speech API for real-time, bidirectional voice interactions, featuring customizable settings and function calling capabilities.
-   **Operation Health Monitor**: Real-time operation health scoring system (100% calculation-based, no AI) that analyzes multiple factors including progress, task completion, deadline compliance, document availability, financial payments, and email activity. Provides instant visual feedback with color-coded health scores (Excellent/Good/Regular/Requires Attention) and actionable alerts for each operation.
-   **Task Automation System with AI Knowledge Base**: AI-powered task automation leveraging Google Gemini Flash to analyze operation-linked emails, automatically creating relevant tasks and updating task statuses. **Major optimizations achieve 85-90% token reduction**:
    -   **Custom Knowledge Base per Organization (Self-Learning System)**: System learns continuously from emails and operations with minimal storage overhead
        -   **Smart Update Logic**: Detects similar entries (70% threshold) and updates existing data instead of creating duplicates
        -   Auto-extracts: Booking/tracking numbers, MBL/AWB, HBL, couriers, shipping modes, locations
        -   **Background Processing**: Automated cron job runs hourly to extract knowledge from recent operations
        -   **Anti-Duplication**: SHA-256 content hashing + similarity detection prevents duplicates
        -   **Auto-Cleanup**: Removes low-value entries (score < 0.5) and unused entries (>30 days)
        -   **Reduced Capacity**: Limit of 100 entries per organization (down from 500) for minimal DB footprint
        -   Relevance scoring system (0.0-5.0) increases score when entries are used, decreases for unused
        -   Learned context injected into AI prompts only when relevant to current operation
        -   **UI Dashboard**: Visualize knowledge base, search by category, view statistics, manage entries
    -   Smart pre-filtering: Only emails with action keywords, questions, or attachments are sent to AI
    -   Limited context: Processes max 3 most recent emails (down from 20) and 5 most recent tasks (down from all)
    -   Reduced timeframe: Analyzes last 3 days of emails (down from 7 days)
    -   Ultra-concise prompts: Optimized prompt length reduced by 70%
    -   Email body truncation: 800 characters max (down from 3000), with HTML stripped
    -   Background processing via cron jobs (every 5 minutes for tasks, every hour for knowledge extraction)
    -   **Advanced Duplicate Prevention System**:
        -   Text similarity algorithm (Jaccard index) compares new task titles against existing tasks
        -   75% similarity threshold prevents creation of duplicate tasks
        -   Email source tracking via `emailSourceId` ensures emails aren't processed multiple times
        -   Pre-flight duplicate check before AI task creation
        -   Improved AI prompts with strict anti-duplication rules (max 1-2 tasks per analysis)
    -   TaskSource enum tracking (user vs automation)
    -   Visual indicators in the UI to distinguish automation-created tasks from user-created ones
    -   Automated "Automatizado" system user (automatizado@nexxio.system) auto-assigned to all AI-generated tasks

**System Design Choices:**
-   **Modular Design**: Ensures maintainability and scalability.
-   **Data Isolation**: Strong multi-tenancy for data privacy.
-   **Scalability**: Utilizes cloud-native services and a stateless backend.
-   **Developer Experience**: Vite, TypeScript, and Prisma enhance development efficiency.

## External Dependencies
-   **Database**: PostgreSQL (Neon)
-   **Cloud Storage**: Backblaze B2
-   **AI Services**: Google Gemini API
-   **Authentication/Authorization**: Google OAuth
-   **Push Notifications**: W3C Web Push API (via `web-push` library)