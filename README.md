# 🚀 Kriscent Team Collab

A high-performance, real-time team collaboration platform designed for modern project management. This platform combines real-time data synchronization, AI-powered task management, and a premium responsive UI, built as part of the Kriscent Techno Hub Pvt Ltd assessment.

### 🌐 Live Deployment
- **Frontend (Vercel)**: [https://kriscent-team-collab.vercel.app](https://kriscent-team-collab.vercel.app)
- **Backend API (Railway)**: [https://kriscent-backend-production.up.railway.app](https://kriscent-backend-production.up.railway.app)

---

## 📖 Table of Contents
- [✨ Key Features](#✨-key-features)
- [🛠️ Tech Stack](#🛠️-tech-stack)
- [🏗️ Project Architecture](#🏗️-project-architecture)
- [📡 API Documentation](#📡-api-documentation)
- [🚀 Quick Start](#🚀-quick-start)
- [🧪 Technical Highlights](#🧪-technical-highlights)
- [⚙️ Configuration](#⚙️-configuration)

---

## ✨ Key Features

### 🔐 Robust Authentication & RBAC
Custom role-based access control built on top of Firebase Authentication.
- **Admin**: Create teams, manages all projects, and has full system visibility.
- **Manager**: Manage assigned teams, create/edit tasks, and assign members.
- **Member**: Focus on assigned tasks and participate in real-time chat.

### 📋 Real-Time Kanban Board
A highly interactive task management board with instant synchronization across all users.
- **Drag-and-Drop**: Built using `@hello-pangea/dnd` for smooth, accessible interactions.
- **Live Updates**: All task status changes are broadcasted via Socket.IO, meaning zero-refresh is required for teammates to see your progress.

### 🤖 AI Task Assistant
An intelligent interface for managing your workflow using natural language.
- **Powered by Gemini AI**: Leverages state-of-the-art LLMs to understand complex commands.
- **Sample Commands**: 
  - *"Assign the API refactor task to John"*
  - *"Remind me to fix the login bug under the high-priority project"*
- **Smart Fallback**: Includes a regex-based parser to ensure features work even if AI quotas are hit.

### 💬 Team Communication
- **Real-Time Team Chat**: A dedicated channel for each team to discuss projects instantly.
- **Activity Logs**: See a live feed of who did what (e.g., "John moved Task #402 to Done").

- **🌙 Dark Mode**: System-aware dark/light mode support for a comfortable experience.

---

## 🛡️ Role-Based Access Control (RBAC)

The platform implements a strict RBAC system to ensure data integrity and security. Permissions are enforced both on the Frontend UI (conditional rendering) and the Backend API (middleware validation).

### 👑 Admin
*Highest authority; intended for organizational leaders.*
- **Project Control**: Create, edit, and delete any project in the system.
- **Team Management**: Create teams and manage overall team structures.
- **Member Management**: Add/remove members from any team and change user roles.
- **AI Assistant**: Full access to create and update tasks using natural language.
- **Full CRUD**: Complete control over all tasks, projects, and users.

### 💼 Manager
*Project leads and team supervisors.*
- **Project Visibility**: View projects they are assigned to.
- **Task Management**: Create new tasks and assign them to team members.
- **Team Coordination**: Add/invite members to their specific teams.
- **AI Assistant**: Fully enabled for rapid task creation and status updates.
- **Monitoring**: View detailed activity logs and team chat history.

### 👤 Member
*Core contributors and team players.*
- **Task Execution**: Update task status (e.g., moving Todo → Done) on the Kanban board.
- **Communication**: Full access to real-time team chat.
- **Visibility**: View project goals, team members, and their own assigned tasks.
- **Restrictions**: Cannot create/delete projects or teams. AI Assistant creation is restricted.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 + TypeScript + Vite
- **State**: Redux Toolkit (RTK) + RTK Query (Optimistic UI & Cache Sync)
- **Styling**: Tailwind CSS + Shadcn UI (Customized Component Library)
- **Real-time**: Socket.IO Client
- **Auth**: Firebase Auth Integration

### Backend
- **Environment**: Node.js + Express (ESM)
- **Database**: MongoDB (Mongoose ODM)
- **Real-time**: Socket.IO Server
- **AI**: Google Generative AI (Gemini) SDK
- **Validation**: Joi (Body) & Zod (Config)

---

## 🏗️ Project Architecture

```text
kriscent-team-collab/
├── frontend/                 # React client
│   ├── src/
│   │   ├── components/       # UI/Shared & Feature-specific components
│   │   ├── config/           # API & Firebase configurations
│   │   ├── hooks/            # Custom React hooks (auth, socket)
│   │   ├── layouts/          # Responsive App & Auth layouts
│   │   ├── pages/            # View components (Dashboard, Tasks, etc.)
│   │   ├── store/            # Redux & RTK Query Services
│   │   └── types/            # TypeScript interfaces
├── backend/                  # Node.js server
│   ├── src/
│   │   ├── controllers/      # Request handlers
│   │   ├── middlewares/      # Auth, RBAC, and error handlers
│   │   ├── models/           # Mongoose schemas
│   │   ├── routes/           # API route definitions
│   │   ├── services/         # Business logic & AI integration
│   │   └── app.ts            # Express app initialization
```

---

## 📡 API Documentation

Base URL: `https://kriscent-backend-production.up.railway.app/api`

### 🔑 Authentication
- `POST /auth/login` - Local + Firebase verification
- `POST /auth/register` - New user creation (Auto-admins first user)

### 📂 Projects & Teams
- `GET /projects` - List all projects (RBAC filtered)
- `POST /projects` - Create new project (Admin/Manager only)
- `GET /teams/:id/members` - Fetch all members of a specific team

### ✅ Tasks
- `GET /tasks?projectId=...` - Fetch tasks for a project
- `PUT /tasks/:id` - Update task status or details
- `POST /tasks` - Create a new task

### 💬 Messages & AI
- `GET /messages?teamId=...` - Fetch team chat history
- `POST /assistant/process` - Process natural language commands via Gemini

---

## 🚀 Quick Start

### 1. Pre-requisites
- **Node.js**: v18 or higher
- **MongoDB**: Active instance (Atlas or local)
- **Firebase**: Project with Authentication enabled

### 2. Installation
```bash
# Clone
git clone https://github.com/mky120799/kriscent-team-collab.git
cd kriscent-team-collab

# Backend
cd backend && npm install
cp .env.example .env

# Frontend
cd ../frontend && npm install
cp .env.example .env
```

### 3. Running Locally
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

---

## 🧪 Technical Highlights

1.  **Smart API Routing**: Custom sanitized API base URL configuration that handles production/local environments seamlessly, ensuring no more "double-slash" 404s.
2.  **Socket-Driven Caching**: RTK Query cache invalidation synced with Socket.IO events for "zero-refresh" updates across multiple tabs.
3.  **Graceful AI Degredation**: Includes a regex-based fallback parser to ensure features work even if AI keys are missing or quotas are reached.
4.  **Responsive Sidebar**: Custom-built mobile drawer system in `AppLayout` for optimal mobile navigation.

---
contact me at [mky120799@gmail.com]
Built with ❤️ by **Mithilesh Yadav**
