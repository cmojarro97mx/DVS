# Nexxio - Supply Chain Management Platform

## Overview
Nexxio is an AI-driven logistics and CRM platform designed to optimize supply chain management, customer relationships, and financial processes. It provides a comprehensive solution for businesses to streamline operations, enhance client interactions, and maintain financial oversight.

## Recent Changes (October 26, 2025)
-   **CRITICAL DATABASE FIX - Form Saving Issue Resolved**: Fixed critical issue where all forms (tasks, quotations, invoices, etc.) failed to save data. Applied two essential corrections:
    1. Added `@updatedAt` decorator to all `updatedAt` fields in Prisma schema (32 models affected) - enables automatic timestamp management by Prisma
    2. Configured UUID auto-generation for all table `id` columns (32 tables) via `ALTER TABLE ... SET DEFAULT gen_random_uuid()::text` - eliminates "null value in column id" errors
    **Result**: All form submissions now work correctly across the entire platform
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