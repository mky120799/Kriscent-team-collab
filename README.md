# Kriscent Team Collab

A real-time team collaboration platform built for the Kriscent Techno Hub Pvt Ltd assessment. This platform allows teams to manage projects, create and assign tasks, and track progress live. It features role-based access control (Admin, Manager, Member), Kanban boards for task management, a real-time team chat system, and a built-in AI assistant for managing tasks using natural language.

## Features

- **Authentication & Authorization**: Firebase authentication with Role-Based Access Control (RBAC). Roles include `ADMIN`, `MANAGER`, and `MEMBER`.
- **Project Management**: Admins and Managers can create, update, and delete projects for their team.
- **Task Management**: Real-time Kanban board with drag-and-drop functionality (`@hello-pangea/dnd`).
- **AI Task Assistant**: A natural language assistant that lets Managers and Admins quickly create or update tasks (e.g., "Create a task for API Integration", "Move task API Integration to In Progress"). Powered by Gemini AI (with a built-in fallback parser).
- **Real-Time Collaboration**: Live task updates and team chat functionality powered by `Socket.IO`.
- **Responsive & Dark Mode UI**: Built with React, Tailwind CSS, and Shadcn UI.

## Tech Stack

### Frontend

- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS + Shadcn UI
- **State Management**: Redux Toolkit (RTK Query for API calls)
- **Routing**: React Router v7
- **Real-time**: Socket.IO Client
- **Auth**: Firebase Auth

### Backend

- **Environment**: Node.js + Express
- **Database**: MongoDB with Mongoose
- **Validation**: Joi
- **Real-time**: Socket.IO
- **AI Integration**: Google Generative AI (Gemini)

## Setup Instructions

### Prerequisites

- Node.js (v18+)
- MongoDB (Local or Atlas URL)
- Firebase Project for Authentication

### 1. Clone the repository

```bash
git clone <repository-url>
cd kriscent-team-collab
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:

```env
PORT=5555
MONGO_URI=mongodb://127.0.0.1:27017/Krescent-collab
SESSION_SECRET=your_super_secret_key
# Optional: Provide Google Gemini API Key for advanced AI features. If omitted, a basic parser is used.
GEMINI_API_KEY=your_gemini_api_key
```

Run the backend:

```bash
npm run dev
```

### 3. Frontend Setup

Open a new terminal and navigate to the frontend directory:

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` directory:

```env
VITE_API_URL=http://localhost:5555/api

VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

Run the frontend:

```bash
npm run dev
```

### 4. Running the app

Once both servers are running, open your browser and go to `http://localhost:5173`.
Login/Register using Firebase Auth. The first user to register will automatically be assigned the `ADMIN` role.

## Extra Features Added

1. **Fallback AI Parser**: To ensure the platform runs smoothly without requiring external API keys immediately, the AI Assistant includes a built-in regex-based fallback parser.
2. **RTK Query Auto-Caching**: Integrating Socket.IO directly into RTK Query cache invalidation to provide seamless real-time KanBan updates across multiple browser tabs without heavy manual state synchronization.
3. **Session-based Firebase Auth mapping**: Securing endpoints smoothly by combining Firebase JWTs via headers with session-backed context.
