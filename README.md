# ⚡ NextChat — Real-Time Web Messenger (WhatsApp Clone)

![NextChat Logo](/client/public/logo.png)

A full-stack, real-time messaging application modeled after WhatsApp Web. Built with React, Tailwind CSS, Express, Socket.IO, and Prisma ORM. It provides phone number & password authentication, rich multimedia sharing, voice notes, live typing & read receipts (blue ticks), and WhatsApp-grade group administration controls.

---

## 🌟 Key Features

### 1. 📱 Phone & Password Authentication
- User registration and login using **phone number** (with international country codes) and **password** (bcrypt-hashed).
- Profile personalization: custom avatar upload, display name, and "About" bio.
- Persistent sessions using JWT authorization tokens.

### 2. 💬 Real-Time Messaging Engine
- **Sub-millisecond delivery** powered by Socket.IO WebSockets.
- **Presence & Status**: Real-time online/offline indicator with "Last seen at..." timestamps.
- **Typing Indicators**: Dynamic `typing...` status with user names.
- **Delivery & Read Receipts**: Single tick (Sent ✓), double tick (Delivered ✓✓), and blue ticks (Read ✓✓).
- **Rich Media Sharing**:
  - 📷 Photos & Videos with full-screen lightbox preview.
  - 🎤 Audio Voice Notes recorded directly in-browser using the Web MediaRecorder API.
  - 📄 Documents and files with size calculation and download options.
  - 😀 Emoji picker integration.
- **Message Actions**: Quoted replies, copy text, delete for me, and delete for everyone.
- **Search**: Real-time filtering across conversation lists and message history inside chats.

### 3. 👑 WhatsApp-Grade Group Admin Controls
- **Create Groups**: Set group subject, description, and custom group icon.
- **Member Management**:
  - Add participants with instant contact search.
  - Remove/Kick members (exclusive to Group Admins).
- **Role Permissions**:
  - Promote members to **Group Admin** or dismiss admins back to member status.
  - **Group Creator** badge (`👑 Creator`) with protection against removal.
- **Group Settings**:
  - 🔒 **Send Messages**: Toggle between *"All participants"* and *"Only admins"* (Announcement mode).
  - ✏️ **Edit Group Info**: Restrict changing group subject, description, and icon to admins only.
- **System Events**: Automated notifications for user joins, leaves, member removals, role elevations, and permission modifications.
- **Disband & Exit**: Options for members to leave and admins/creators to permanently delete the group.

### 4. 🎨 Modern WhatsApp Web UI/UX
- Authentic dark mode layout (`#111b21`, `#202c33`, `#00a884`).
- Responsive dual-pane layout for desktop and seamless single-screen drawer navigation on mobile devices.
- Custom WhatsApp scrollbars and subtle chat background wallpaper.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- npm (v9 or higher)

### 1. Installation
Clone or navigate to the project directory:
```bash
cd C:\Users\Harsh\.gemini\antigravity\scratch\nextchat
npm install
npm --prefix client install
```

### 2. Database Setup
Initialize the local SQLite database schema using Prisma:
```bash
npm run prisma:push
```

### 3. Start Development Server
In one terminal, start the backend server:
```bash
npm run dev
```

In a second terminal, start the Vite client frontend:
```bash
npm run client:dev
```
The client will be running at `http://localhost:3000` with automatic API and WebSocket proxies to port 5000.

---

## 📦 Single-Port Production Build

To build the client and serve everything (APIs, WebSockets, Uploads, and Frontend) from a single port (`http://localhost:5000`):

```bash
npm run build
npm start
```

---

## ☁️ Online Deployment Guide

### Deploying to Render (Free Tier)
1. Push your repository to GitHub or GitLab.
2. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** -> **Web Service**.
3. Connect your repository.
4. Set the following settings:
   - **Environment**: Node
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
5. Add Environment Variables:
   - `DATABASE_URL`: `file:./dev.db`
   - `JWT_SECRET`: *(Generate any random 32-character secret)*
   - `NODE_ENV`: `production`
6. Click **Deploy Web Service**.

### Deploying via Docker (Railway, Fly.io, or VPS)
Build and run using the included production `Dockerfile`:
```bash
docker build -t nextchat .
docker run -p 5000:5000 -e JWT_SECRET="your_secure_secret" nextchat
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite 6, Tailwind CSS, Lucide Icons, Emoji Picker React, Date-fns |
| **Backend** | Node.js, Express, Socket.IO, Multer, Morgan, Dotenv |
| **Authentication** | JSON Web Tokens (JWT), Bcrypt.js password hashing |
| **Database & ORM** | SQLite / PostgreSQL, Prisma ORM 6 |
| **Real-time Protocol** | WebSockets (Socket.IO with custom rooms and events) |

---

## 🔒 Security
- Passwords are salted and hashed with `bcryptjs`.
- Protected REST endpoints require valid `Bearer <token>` headers.
- Socket connections are authenticated on the handshake before joining rooms.
- Group admin checks are enforced on both the backend REST controllers and Socket handlers.
