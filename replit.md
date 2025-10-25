# Nexxio - Supply Chain Management Platform

## Overview
Nexxio is an AI-driven logistics and CRM platform designed to optimize supply chain management, customer relationships, and financial processes. It provides a comprehensive solution for businesses to streamline operations, enhance client interactions, and maintain financial oversight.

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
-   **Task Automation System with AI Knowledge Base**: AI-powered task automation leveraging Google Gemini Flash to analyze operation-linked emails, automatically creating relevant tasks and updating task statuses. **Major optimizations achieve 85-90% token reduction**:
    -   **Custom Knowledge Base per Organization**: System learns continuously from emails, operations, and user interactions
        -   Auto-extracts tracking numbers, ports, carriers, contacts, and operation patterns
        -   Anti-duplication via content hashing and keyword matching
        -   Auto-cleanup of low-value entries (relevance scoring system)
        -   Capacity limit of 500 entries per organization to prevent bloat
        -   Learned context injected into AI prompts only when relevant
    -   Smart pre-filtering: Only emails with action keywords, questions, or attachments are sent to AI
    -   Limited context: Processes max 3 most recent emails (down from 20) and 5 most recent tasks (down from all)
    -   Reduced timeframe: Analyzes last 3 days of emails (down from 7 days)
    -   Ultra-concise prompts: Optimized prompt length reduced by 70%
    -   Email body truncation: 800 characters max (down from 3000), with HTML stripped
    -   Background processing via cron jobs (every 5 minutes)
    -   Duplicate prevention logic
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