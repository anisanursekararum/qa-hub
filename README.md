# QA-Hub

**QA-Hub** is a next-generation Quality Assurance and Test Management platform, featuring a premium "Obsidian Control" aesthetic. It is designed to streamline test case repositories, test cycles, and automated execution tracking in one unified interface.

## 🚀 Key Features

*   **Test Repository Management:** Organize your test cases by modules, tag them as Manual or Automated, and set priorities. Bulk import your legacy cases via CSV or ingest PRDs with AI.
*   **Test Runs & Execution Engine:** Create targeted test cycles (Test Runs) and pull in specific cases from your repository. 
*   **Hybrid Automation Tracking:** Lock your test scope and trigger automated runs. QA-Hub integrates a mock WebSocket telemetry stream to visualize your robots working in real-time.
*   **Advanced Filtering & Grouping:** Quickly find test cases across your repository or active runs using sophisticated multi-condition filters.
*   **Obsidian Control UI:** A sleek, high-contrast user interface with subtle micro-interactions, designed for focus and productivity.
*   **Project & Workspace Isolation:** Invite team members with unique join codes and keep your test artifacts separated by projects.

## 🛠️ Technology Stack

**Frontend:**
*   React 18 + Vite
*   TypeScript
*   Tailwind CSS (Vanilla-style utility classes for the custom aesthetic)
*   Lucide React (Icons)
*   Socket.io-client (Real-time telemetry)
*   React Router v6

**Backend:**
*   NestJS
*   TypeScript
*   Prisma ORM
*   PostgreSQL
*   JWT Authentication
*   Socket.io (WebSocket Gateway)

## 📦 Getting Started

### Prerequisites
*   Node.js (v18+)
*   npm or yarn
*   PostgreSQL database

### 1. Clone the repository
```bash
git clone https://github.com/anisanursekararum/qa-hub.git
cd qa-hub
```

### 2. Backend Setup
```bash
cd backend
npm install
```
*   Create a `.env` file in the `backend` directory based on your PostgreSQL setup:
    ```env
    DATABASE_URL="postgresql://user:password@localhost:5432/qa_hub?schema=public"
    JWT_SECRET="your-super-secret-key"
    ```
*   Run database migrations and start the server:
    ```bash
    npx prisma db push
    npm run start:dev
    ```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
*   The application will be available at `http://localhost:5173`.

## 🎨 Design Philosophy
QA-Hub implements a custom "Obsidian Control" design language. It eschews overly bright standard colors in favor of deep blacks, sharp greys, and precise accent colors (IBM Blue, Error Red, Success Green) to present dense information clearly and professionally.

---
*Built with Advanced Agentic Coding.*
