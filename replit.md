# Nexxio - Supply Chain Management Platform

## Overview
Nexxio is an AI-driven logistics and CRM platform designed to optimize supply chain management, customer relationships, and financial processes. It provides a comprehensive solution for businesses to streamline operations, enhance client interactions, and maintain financial oversight.

## User Preferences
I prefer detailed explanations. Ask before making major changes. I want iterative development. I prefer simple language. I like functional programming. Do not make changes to the folder Z. Do not make changes to the file Y.

## System Architecture
Nexxio is a Single Page Application (SPA) with a decoupled frontend and backend, built with a modular and scalable design.

**UI/UX Decisions:**
The frontend uses React with TypeScript and Tailwind CSS, bundled with Vite, focusing on a modular and reusable component-based design with consistent professional flat design patterns.

**Technical Implementations & Feature Specifications:**
-   **Frontend**: React, TypeScript, Vite, Tailwind CSS.
-   **Backend**: NestJS framework for REST APIs.
-   **Database**: PostgreSQL (Neon) with Prisma ORM.
-   **Authentication**: JWT-based authentication with refresh tokens and Google OAuth.
-   **Multi-Tenancy**: Data isolation by `organizationId` is enforced throughout the system.
-   **Core Modules**: Logistics Operations, Client/Supplier Management, Financial Management (Invoices, Payments, Expenses), Employee & Task Management, Notes, File Management, Calendar, and Lead/Quotation Management.
-   **File Manager Module**: Provides a read-only, unified view of all files stored in Backblaze B2, supporting filtering, search, and secure access via signed URLs.
-   **Google Workspace Integration (Multi-Account)**: Supports multiple Google accounts for Gmail and Calendar API access, including advanced email-to-operation linking via OCR and smart pattern matching with configurable rules for auto-creation and domain filtering.
-   **Web Push Notifications & Notification Center**: Native browser push notification system with in-app management and event-driven triggers.
-   **Virtual Assistant (Voice-Enabled AI)**: A voice-enabled AI assistant leveraging Google Gemini Flash API via NestJS WebSockets and Web Speech API for real-time, bidirectional voice interactions.
-   **Operation Health Monitor**: Real-time, calculation-based scoring system analyzing progress, task completion, deadlines, documents, payments, and email activity, providing visual feedback and alerts.
-   **Task Automation System with AI Knowledge Base**: AI-powered task automation leveraging Google Gemini Flash to analyze operation-linked emails, automatically creating and updating tasks. Includes a self-learning custom knowledge base per organization (max 100 entries) with smart update logic, relevance scoring, and significant token reduction optimizations (e.g., pre-filtering, limited context, concise prompts, email body truncation). Features an advanced duplicate prevention system for tasks and email processing.

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