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
-   **Core Modules**:
    -   Logistics Operations
    -   Client and Supplier Management
    -   Financial Management (Invoices, Payments, Expenses)
    -   Employee Management
    -   Task Management (Kanban)
    -   Notes
    -   File Management (Drag & drop, folder management)
    -   Calendar and Events
    -   Lead and Quotation Management
-   **File Storage**: Integrated with Backblaze B2 (S3-compatible) for secure and scalable file storage, with atomic delete operations to maintain data consistency.
-   **API Endpoints**: Comprehensive CRUD operations for all modules, including specific endpoints for authentication, organization management, and Google OAuth flow.

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