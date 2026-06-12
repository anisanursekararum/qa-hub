# 🎯 QA-Hub (Quality Assurance Hub)

[![React](https://img.shields.io/badge/React-18.2-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![NestJS](https://img.shields.io/badge/NestJS-10.0-red?style=for-the-badge&logo=nestjs)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15.0-blue?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.7-black?style=for-the-badge&logo=socket.io)](https://socket.io/)
[![DeepSeek AI](https://img.shields.io/badge/DeepSeek_AI-V3-blueviolet?style=for-the-badge&logo=openai)](https://api.deepseek.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-Google_Cloud-4285F4?style=for-the-badge&logo=google-gemini)](https://deepmind.google/technologies/gemini/)

> **QA-Hub** is designed to simplify engineering workflows by centralizing all your testing needs. It’s a tool built not just for QA, but for every IT professional committed to safeguarding system quality. By integrating test management, execution, and AI-powered insights, QA-Hub boosts productivity and drives high-quality software delivery. High-quality releases mean happy users 🥳🎉

---

## 🌟 The AI-Powered Test Case Lifecycle

The core engine of QA-Hub's automated test management is the **AI PRD Extraction and Verification Cycle**, which automates the transition from product requirements to verified test cases:

*   **Extraction:** Uploaded PDF requirements (PRDs) are parsed and processed via the **DeepSeek V3 LLM** (with Gemini fallback) to auto-generate structured test cases in **DRAFT** state.
*   **Verification:** Generated drafts are compared with legacy test cases using **Supabase Vector (pgvector)** embeddings to automatically detect overlap, modifications, or functional gaps.
*   **Curation:** Team members review the AI-generated cases, promote them to **READY** state, and organize them into modules or active Test Runs.

---

## ✨ Key Features

1.  **AI PRD Extraction (Non-Blocking):** Upload a product requirements document (PDF) and let the LLM generate test cases in the background. The user can minimize this process into a floating progress widget and continue working elsewhere.
2.  **Sleek Obsidian Control UI:** High-contrast theme adaptation (Light/Dark mode) utilizing deep obsidian tones, clean borders, and premium typography tailored for readability.
3.  **Real-Time Test Telemetry:** Built-in WebSocket streaming (`Socket.io`) provides live feedback of test runner execution directly in the dashboard.
4.  **Flexible Module Organization:** Hierarchical grouping of test cases inside projects with custom module codes and search capability.
5.  **Multi-Condition Filtering:** Advanced filtering criteria (Status, Priority, Module, Source, Automation) to query large repositories in milliseconds.
6.  **Workspace & Access Isolation:** Secure project collaboration using invite-only join codes, member role management, and brute-force protection.

---

## 🛠️ Technology Stack

| Category | Technology Used | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18 (Vite + TypeScript) | Fast, type-safe Single Page Application (SPA) foundation. |
| **Backend Framework** | NestJS (Node.js) | Structured, enterprise-ready REST and WebSocket server. |
| **Database & ORM** | PostgreSQL + Prisma ORM | Relational data persistence with Prisma client schema modeling. |
| **Vector Database** | pgvector (Supabase Vector) | Semantic search engine for detecting legacy test case overlap. |
| **AI Processing** | DeepSeek V3 API (`deepseek-chat`) | Primary text generator for structured test case extraction. |
| **AI Embeddings** | Google Gemini API (`text-embedding-004`) | High-dimensional vector generation for semantic comparison. |
| **Real-Time Stream** | Socket.io (WebSockets) | Live progress logs and test execution telemetry broadcast. |
| **Styling** | Tailwind CSS + CSS Variables | Precise custom implementation of the "Obsidian Control" theme. |

---

## 📦 Getting Started

### Prerequisites
*   Node.js (v18+)
*   npm or yarn
*   PostgreSQL database with `pgvector` extension enabled

### 1. Clone the Repository
```bash
git clone https://github.com/anisanursekararum/qa-hub.git
cd qa-hub
```

### 2. Backend Setup
Navigate to the backend directory, install dependencies, and configure env variables:
```bash
cd backend
npm install
```
Create a `.env` file inside the `backend` folder:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/qa_hub?schema=public"
JWT_SECRET="your-super-secret-key"
DEEPSEEK_API_KEY="your-deepseek-api-key"
GEMINI_API_KEY="your-gemini-api-key"
```
Run Prisma migrations and start the backend development server:
```bash
npx prisma db push
npm run start:dev
```

### 3. Frontend Setup
Navigate to the frontend directory, install dependencies, and launch the Vite dev server:
```bash
cd ../frontend
npm install
npm run dev
```
The application will be accessible locally at `http://localhost:5173`.

---

## 🎨 Design Philosophy
QA-Hub implements a custom "Obsidian Control" design language. It eschews generic colors in favor of harmonized deep dark modes, precise accent tones (`#0F62FE` blue and `#8A3FFC` purple), and custom typography (Inter, JetBrains Mono) to present dense quality assurance data with absolute clarity and elite aesthetics.

---

