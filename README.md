# 🚀 Team Task Manager

A state-of-the-art, full-stack workflow orchestration platform engineered with **Next.js 15** and **Supabase**. This platform empowers organizations to manage complex projects through a robust **Role-Based Access Control (RBAC)** system, featuring a modern, minimalist interface.

---

## ✨ Key Features

- **🔐 Robust Authentication**: Secure JWT-based authentication system with encrypted password storage using Bcrypt.
- **🛡️ Role-Based Access Control (RBAC)**: Distinct permissions for `Admin` and `Member` roles ensuring data integrity and security.
- **📊 Interactive Dashboard**: A centralized hub for project health statistics, real-time task tracking, and seamless navigation.
- **📁 Project Management**: Create, edit, and delete projects with ease (Admin-exclusive management).
- **📝 Granular Task Engine**:
  - Multi-user task assignment using a junction architecture.
  - Real-time status toggling (Todo, Doing, Done).
  - Project-specific task filtering.
- **🎨 Premium UI/UX**: Built with a focus on aesthetics, featuring a responsive layout and Lucide-react iconography.

---

## 🚀 Tech Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Database & Auth**: [Supabase](https://supabase.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: Vanilla CSS (Modern Design System)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Security**: JWT & Bcrypt

---

## 🛠️ Getting Started

### Prerequisites

- Node.js (Latest LTS)
- pnpm (Recommended) or npm
- A Supabase account and project

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd team-task-manager
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Set up Environment Variables**:
   Create a `.env.local` file in the root directory and add your credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   JWT_SECRET=your_jwt_secret
   ```

4. **Database Setup**:
   Execute the SQL commands found in `database_schema.sql` within your Supabase SQL Editor to create the necessary tables (`projects`, `tasks`, and `users`).

5. **Run the development server**:
   ```bash
   pnpm dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 📖 Usage Guide

### 1. Authentication
Start by creating an account on the `/signup` page. You can choose a role (`Admin` or `Member`). After signing up, log in at `/login` to access the dashboard.

### 2. Dashboard Overview
- **Sidebar**: Switch between "All Projects" or select a specific project to filter tasks.
- **Stats Cards**: Quickly see the total number of tasks, pending items, and completed work.
- **Task List**: View tasks organized by their current status.

### 3. Project & Task Management
- **Admins** can create new projects and tasks using the "New Project" and "New Task" buttons.
- When creating a task, you can assign it to multiple team members.
- **Members** can view projects they are assigned to and update the status of tasks they are involved in.

---

## 🔗 API Reference

| Endpoint | Method | Description | Access |
| :--- | :--- | :--- | :--- |
| `/api/auth/signup` | `POST` | Register a new user | Public |
| `/api/auth/login` | `POST` | Authenticate user & get JWT | Public |
| `/api/projects` | `GET/POST` | Fetch/Create projects | Auth/Admin |
| `/api/projects/[id]` | `PATCH/DELETE`| Update/Delete project | Admin |
| `/api/tasks` | `GET/POST` | Fetch/Create tasks | Auth |
| `/api/tasks/[id]` | `PATCH/DELETE`| Update/Delete task | Auth/Admin |
| `/api/users` | `GET` | List all users | Auth |


---