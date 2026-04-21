<div align="center">

# 🚀 Emerge - Developer's Den
### The Kinetic Forge for Collaborative Engineering

[![Maintained: Yes](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/Purushotham-Prajapati-24/Emerge-2026/graphs/commit-activity)
[![Users: 50+](https://img.shields.io/badge/Tested%20on-50+%20Users-blue.svg?style=flat-square&logo=dynamic-yield&logoColor=white)](#)
[![Performance: 100ms](https://img.shields.io/badge/Laminar%20Sync-<100ms-orange.svg?style=flat-square&logo=lightning&logoColor=white)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
[![Security: JWT Rotation](https://img.shields.io/badge/Security-JWT%20Rotation-success.svg?style=flat-square&logo=json-web-tokens&logoColor=white)](#)

**Developer's Den** is a high-performance, cloud-based collaborative IDE engineered for 100+ simultaneous users. 
It bridges the gap between raw CLI power and modern creative fluidity.

[**Explore the Docs**](./docs/archive) • [**GitHub Workflow**](./GITHUB.md) • [**Request Feature**](https://github.com/Purushotham-Prajapati-24/Emerge-2026/issues)

</div>

---

## 🏗️ The Engineering Blueprint

Our architecture is designed for **Laminar Flow Synchronization**. We utilize Yjs (CRDT) over WebSockets to ensure conflict-free editing even at high concurrency.

```mermaid
graph TD
    subgraph Client_Layer [Frontend: Kinetic Terminal]
        Editor[Monaco Editor]
        Context[Context Engine]
        Terminal[Kinetic Terminal]
    end

    subgraph Sync_Layer [Orchestration]
        Socket[Socket.IO Server]
        YJS[Yjs Shared Types]
    end

    subgraph Service_Layer [Intelligence & Execution]
        AI[Groq LPU Architect]
        Docker[Sandboxed Runtimes]
    end

    Editor <-->|CRDT Diffs| YJS
    YJS <--> Socket
    Context -->|Focused Window| AI
    Terminal -->|Forensic Logs| AI
    Editor -->|Run Code| Docker
```

---

## ⚡ Live Visual Tour

Experience the **Kinetic Terminal** in action. Our interface is designed for focus, utilizing deep tonal shifts and glassmorphism.

| **The Workspace** | **AI Architect** |
| :---: | :---: |
| ![Workspace](frontend/public/assets/showcase/workspace.png) | ![Architect](frontend/public/assets/showcase/ai_architect.png) |
| *Real-time collaborative editor* | *Context-aware engineering assistant* |

| **Project Dashboard** | **Multiplayer Chat** |
| :---: | :---: |
| ![Dashboard](frontend/public/assets/showcase/dashboard.png) | ![Chat](frontend/public/assets/showcase/chat.png) |
| *Team project management* | *Laminar sync communication* |

---


## 💎 Premium Features

| Feature | Description | Implementation |
| :--- | :--- | :--- |
| **Project Shadow** | Global session memory tracking recent files. | `useCollaborationStore` + Yjs |
| **Hyper-Focus** | AI context limited to ±50 lines for precision. | Dynamic Buffer Interceptor |
| **Forensic Debug** | Root-cause analysis of terminal outputs. | `/debug` Command Parser |
| **Multiplayer Cursor** | Real-time presence with user flags. | Socket.io Presence API |
| **Laminar Sync** | 100+ concurrent user support. | Yjs CRDT + WebSocket |
| **Dual-Token Auth** | Advanced JWT Access & Refresh rotation. | Identity-First Security |

---

## 🛡️ Identity & Security

We implement a rigorous **Identity-First** security model:

- **JWT Dual-Token Rotation**: Short-lived Access Tokens paired with long-lived Refresh Tokens.
- **Stateless Verification**: High-performance middleware with `<5ms` overhead.
- **Secure Rotation**: Automated refreshing via specialized rotation endpoints.

---

## 🛠️ The Tech Forge

<div align="center">

| Frontend | Backend | Database | AI & Auth |
| :---: | :---: | :---: | :---: |
| ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB) | ![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white) | ![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white) | ![Clerk](https://img.shields.io/badge/Clerk-6C47FF?style=for-the-badge&logo=clerk&logoColor=white) |
| **React 19 / Vite** | **Node.js / Socket.io** | **MongoDB Atlas** | **Groq LPU / Clerk** |

</div>

---

## 📡 REST API Documentation

### 🔐 Authentication & Identity
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate user & receive Dual-Tokens. | ❌ |
| `POST` | `/api/auth/refresh` | Rotate Access Token using Refresh Token. | 🔄 |
| `POST` | `/api/auth/logout` | Securely terminate session. | ✅ |

### 📁 Project Management

### Intelligence & Execution
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/ai/chat` | Query the Architect with context. | ✅ |
| `POST` | `/api/execution` | Execute code in isolated sandbox. | ✅ |

---

## 🚀 Installation & Setup

### Environment Checklist
Create `.env` files in both directories following this schema:

| Variable | Source | Purpose |
| :--- | :--- | :--- |
| `MONGODB_URI` | MongoDB Atlas | Data persistence. |
| `GROQ_API_KEY` | Groq Console | Intelligence Engine. |
| `CLERK_PUBLISHABLE_KEY` | Clerk Dash | OAuth & Identity. |
| `JWT_ACCESS_SECRET` | Manual | Access token signing. |
| `JWT_REFRESH_SECRET` | Manual | Long-term session signing. |

### Terminal Jumpstart
```bash
# 1. Setup Backend
cd backend && npm install && npm run dev

# 2. Setup Frontend
cd frontend && npm install && npm run dev
```

---

## 🧬 Project Structure

```text
Emerge/
├── backend/              # Node.js Express Server
│   ├── src/controllers/  # Business Logic
│   ├── src/services/     # AI & Execution Logic
│   └── src/routes/       # API Definitions
├── frontend/             # React (Vite) Client
│   ├── src/features/     # Modular Components (AI, Editor)
│   ├── src/store/        # Zustand State Management
│   └── src/hooks/        # Specialized Logic (Real-time)
└── docs/archive/         # Technical Specifications
```

---

## 🤝 Contributing
Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feat/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feat/AmazingFeature`)
5. Open a Pull Request

---
<div align="center">
Built for the 2026 Hackathon Showcase.  
© 2026 Developer's Den Team.  
</div>
