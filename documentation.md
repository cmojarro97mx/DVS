# Technical Documentation: Logistics CRM Architecture and Operation

## 1. General Overview and Architecture

This application is a **Single Page Application (SPA)** built with **React** and **TypeScript**, using **Tailwind CSS** for styling. It is important to note that, in its current state, the application is a **pure frontend prototype**. It has no connection to a database or a persistent backend.

*   **Entry Point:** `index.html` loads the main script `index.tsx`, which renders the root component `App.tsx`.
*   **Route and Authentication Management:** The `App.tsx` component acts as a simple router. It manages a boolean state (`isAuthenticated`) to decide whether to display the `LoginPage` / `RegisterPage` view or the main `DashboardPage`.
*   **Central Dashboard:** Once authenticated, the entire application runs within `DashboardPage.tsx`. This component is the **heart of the application**, acting as the main state container and view manager for all modules.

## 2. Data Management Strategy (How is data saved?)

This is the most crucial part to understand the current operation:

**Data storage is 100% in-memory and non-persistent.**

*   **Data Source:** The entire application state (projects, clients, invoices, etc.) is managed via `React.useState` within the `DashboardPage.tsx` component.
*   **Initial Data:** When the application loads, the state is initialized with demo data imported from `data/dummyData.ts`.
*   **Data Flow (Lifting State Up):**
    1.  `DashboardPage.tsx` holds all data arrays (e.g., `const [projects, setProjects] = useState<Project[]>(initialProjects);`).
    2.  When a module needs to display data (e.g., `LogisticsProjectsPage`), `DashboardPage` passes the corresponding array as a *prop* (e.g., `<LogisticsProjectsPage projects={projects} />`).
    3.  When a module needs to modify data (create, edit, delete), `DashboardPage` passes a *handler* function as a *prop* (e.g., `onCreateOperation={handleCreateOperation}`).
    4.  The child component (the module) calls this handler function with the new data. The function, residing in `DashboardPage`, updates the central state using `setProjects`, `setClients`, etc.
    5.  React re-renders the affected components with the updated data.

*   **Main Limitation:** Due to this in-memory architecture, **all changes are lost upon reloading the page**. For the application to be "100% functional" in a production environment, this state management would need to be replaced with calls to a backend API.

## 3. Module Breakdown and Operation

The purpose and flow of each main module are detailed below:

**a) Automations (`pages/AutomationPage.tsx`)**
*   **Function:** This module simulates a hub for configuring automated workflows.
*   **Flow:** The primary "automation" is based on having a connected email account (`hasEmailConnection` prop). If an email is connected, the user can toggle on/off other automations like "Task Automation" or "Automatic Document Upload". This is a UI simulation; the background logic is not implemented. For example, toggling "Task Automations" only changes a local boolean state within the component and does not actually start scanning emails.

**b) Authentication (`pages/LoginPage.tsx`, `pages/RegisterPage.tsx`)**
*   **Function:** Simulate login and registration. They do not perform real validation.
*   **Flow:** `LoginPage` calls the `onLogin` function (passed from `App.tsx`), which simply changes the `isAuthenticated` state to `true`, rendering the `DashboardPage`.

**c) Calendar (`pages/CalendarPage.tsx`)**
*   **Function:** A calendar for managing events.
*   **Flow:** Receives `events` as a prop. It allows creating, editing, and deleting events through a modal (`EventModal.tsx`). All modifications are made by calling the handlers (`onAddEvent`, `onUpdateEvent`) from `DashboardPage`.

**d) Clients and Suppliers (`pages/ClientsManager.tsx`, `pages/SuppliersManager.tsx`)**
*   **Function:** CRUD (Create, Read, Update, Delete) management for clients and suppliers.
*   **Flow:**
    *   They display a list of client/supplier cards received as props.
    *   When "Add" or "Edit" is clicked, a side panel (`ClientPanel.tsx` or `SupplierPanel.tsx`) opens.
    *   When saving in the panel, the corresponding function (`onAddClient`, `onUpdateClient`) passed from `DashboardPage` is called to update the central state.
    *   Deletion is managed through a confirmation modal (`ConfirmationModal.tsx`).

**e) Quotations (`pages/QuotationsPage.tsx`) & Pricing (`pages/PricingPage.tsx`)**
*   **Function:** Creation, management, and viewing of quotations for clients or leads.
*   **Flow:** 
    *   `PricingPage` is the main entry point for creating a new quote. It's a calculator that allows adding cost items, applying a margin, and calculating taxes to arrive at a final price.
    *   Upon clicking "Generate Quotation", it calls a handler from `DashboardPage` that creates a new quotation object and navigates the user to the `QuotationsPage`.
    *   `QuotationsPage` has multiple internal views (`list`, `form`, `preview`).
    *   The list view shows all quotations. From here you can edit (form view) or preview. The preview (`QuotationPreview`) has a professional format, ready to be printed.
    *   All CRUD logic is handled in `DashboardPage` through the corresponding handlers.

**f) Main Dashboard (`pages/DashboardPage.tsx`)**
*   **Function:** It is the orchestrator component. It does not have its own visible UI but decides which module to render based on the `activeView` state.
*   **Flow:** It contains the `Sidebar` and `TopHeader`. The `Sidebar` modifies the `activeView` state in `DashboardPage`, and the `switch (activeView)` in the `DashboardPage` render method displays the corresponding module component.

**g) Email Client (`pages/EmailClientPage.tsx`, `MailboxView.tsx`)**
*   **Function:** A simulated email client within the CRM.
*   **Flow:** This module manages its own state for email accounts, initialized from `dummyData`. It allows viewing a list of accounts (`EmailAccountsManager`), "opening" a mailbox (`MailboxView`), and simulating email composition and sending (`ComposeEmailView`). The `onSendEmail` handler adds the new email to the central state in `DashboardPage`.

**h) Finance (`pages/FinanceHubPage.tsx`, `FinanceDashboardPage.tsx`, etc.)**
*   **Function:** Offers an aggregated view of finances.
*   **Flow:**
    *   `FinanceHubPage`: Acts as a navigation menu to all other financial sections.
    *   `FinanceDashboardPage`: Receives `invoices`, `payments`, and `expenses` from `DashboardPage`. It displays summaries and charts.
    *   The "Manage" buttons change the view to full list pages like `AllInvoicesPage`, `AllExpensesPage`, `BankAccountsPage`, etc., which also receive the full data as props.

**i) File Manager (`pages/FilesManagerPage.tsx`)**
*   **Function:** A centralized explorer to create folders and manage files uploaded across all operations.
*   **Flow:**
    *   This module manages a flat array of `FileSystemItem` objects.
    *   It simulates a folder hierarchy by filtering items based on the `currentFolderId` and `parentId`.
    *   Allows the user to view files in `grid` or `list` mode, create new folders, rename items, and upload files.
    *   All file system modifications are managed locally within `DashboardPage` through the `onFileSystemUpdate` state setter.

**j) Leads (`pages/LeadsPage.tsx`)**
*   **Function:** CRUD management of potential customers (leads).
*   **Flow:**
    *   `LeadsPage` displays a table with all leads, their status (`New`, `Contacted`, etc.), and their source.
    *   When "Add" or "Edit" is clicked, a side panel (`LeadPanel.tsx`) opens to enter or modify lead information.
    *   All state updates happen in `DashboardPage`.

**k) Operations (`pages/LogisticsProjectsPage.tsx`, `CreateOperationPage.tsx`, `OperationDetailPage.tsx`)**
*   **Function:** Central module for managing logistics operations.
*   **Flow:**
    *   `LogisticsProjectsPage`: Receives the `projects` array and displays a table. Clicking "Create Operation" calls `setActiveView` to show `CreateOperationPage`.
    *   `CreateOperationPage`: A multi-step form that collects data for a new project. Upon saving, it calls the `onCreateOperation` function (from `DashboardPage`) with the new project details.
    *   `OperationDetailPage`: Displayed when an operation is selected. It receives the specific `project` object and all related data (notes, tasks, expenses, etc.) filtered within `DashboardPage`. This component is a mini-dashboard with tabs that render other sub-modules like `TaskManager`, `ExpensesManager`, `InvoicesManager`, etc.

**l) Tasks (`pages/TaskManager.tsx` - in `OperationDetailPage`, and `pages/AllTasksPage.tsx`)**
*   **Function:** Manage tasks associated with operations.
*   **Flow:**
    *   `TaskManager`: A Kanban board (To Do, In Progress, Done). It receives `tasks`, `columns`, and `columnOrder` data from `DashboardPage`. Drag-and-drop logic and task editing update the state in `DashboardPage` through handler functions.
    *   `AllTasksPage`: A table view that shows all tasks from all operations, enriched with the project name and column status.

## 4. Connections and Path to Full Functionality

*   **Current Connections:** There are no external connections (API, database). All "connections" are internal to React, through prop passing from a parent component (`DashboardPage`) to its children (the modules).

*   **Steps for a 100% Functional Application:**
    1.  **Create a Backend and a REST API:** A server (e.g., Node.js with Express, Python with Django, etc.) would be needed to expose endpoints for each resource (e.g., `GET /api/projects`, `POST /api/clients`, `PUT /api/projects/:id`).
    2.  **Set up a Database:** The backend would connect to a database (e.g., PostgreSQL, MongoDB) to store data persistently.
    3.  **Replace State Management:**
        *   In `DashboardPage.tsx`, the `useState` hooks holding data arrays would be removed.
        *   `useEffect` would be used to make `fetch` calls to the API and load initial data when the component mounts.
        *   Handler functions (`handleCreateOperation`, `handleUpdateClient`, etc.) would no longer use `setProjects` but would make `POST`, `PUT`, `DELETE` calls to the API. After a successful response, they would either re-fetch the updated data or update the local state to reflect the change.
    4.  **Implement Real Authentication:** The `isAuthenticated` boolean would be replaced by a token system (e.g., JWT). The login would request a token from the API, which would be stored securely (e.g., in `localStorage` or `cookies`), and sent in the headers of every API request.
    5.  **Real Integrations:** Features like the email client would require secure backend integrations with APIs like Gmail's or with IMAP/SMTP servers. The SAT invoice manager would require connecting to the official SAT web services.

This documentation provides a complete map of how the application is built and, more importantly, what is needed to take it from a prototype to a functional, persistent product.
