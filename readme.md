# Relay

A real-time chat application built with Spring Boot WebSockets and a React + TypeScript frontend. Features a dark obsidian theme and responsive mobile-friendly design.

## Architecture

```
┌──────────────────────┐       WebSocket (STOMP)       ┌──────────────────────┐
│   Frontend (React)   │ ◄──────────────────────────►  │   Backend (Spring)   │
│   Vite + Tailwind    │       HTTP (REST auth)        │   WebSocket + JWT    │
│   Deployed: Vercel   │                               │   Deployed: Heroku   │
└──────────────────────┘                               └──────────────────────┘
```

- **Backend**: Spring Boot 4.1.0 (Java 17) — pure WebSocket/STOMP server with JWT authentication. No database, no JPA, no server-side rendering.
- **Frontend**: React 18 + TypeScript, built with Vite 5, styled with Tailwind CSS 3.4. State management via Zustand.

## Features

- Real-time messaging via STOMP over WebSocket
- Multiple chat rooms (join by typing `#room-name`)
- Private direct messaging between connected users
- Live user count per room
- Connection status indicators (connected/reconnecting/disconnected)
- JWT-based authentication
- Mobile-responsive layout with slide-in drawer sidebar
- Dark theme ("Obsidian Flux")

## Prerequisites

- Node.js 18+
- Java 17+
- Maven

## Getting Started

### Backend

```bash
cd backend

# Set required environment variables
export JWT_Secret=your-secret-key
export ALLOWED_ORIGIN=http://localhost:5173

# Run with Maven
./mvnw spring-boot:run
```

The backend starts on `http://localhost:8080`.

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server (proxies API/WebSocket to localhost:8080)
npm run dev
```

The frontend starts on `http://localhost:5173`.

Open the app, enter a username, and start chatting. Messages are broadcast in real-time to all connected clients in the same room.

## Configuration

### Frontend (`frontend/.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend URL (empty = use Vite dev proxy to `localhost:8080`) |

### Backend (`backend/.env` or environment variables)

| Variable | Description |
|---|---|
| `JWT_Secret` | Secret key for signing JWT tokens |
| `ALLOWED_ORIGIN` | CORS allowed origin (e.g., `http://localhost:5173` for dev) |

## Project Structure

```
├── backend/
│   └── src/main/java/com/rho/backend/
│       ├── config/          # WebSocket & CORS config
│       ├── controller/      # REST auth & STOMP chat endpoints
│       ├── handler/         # JWT handshake interceptor
│       ├── listener/        # WebSocket lifecycle events
│       ├── model/           # ChatMessage POJO
│       ├── security/        # Channel security config
│       └── service/         # Connected user registry & JWT service
│
└── frontend/
    └── src/
        ├── components/      # Sidebar, ChatInput, MessageBubble, etc.
        ├── hooks/           # useStompClient (STOMP connection lifecycle)
        ├── pages/           # LoginPage, ChatRoomPage, DMThreadPage
        ├── store/           # Zustand stores (auth, rooms, inbox, connection)
        └── types/           # TypeScript type definitions
```

## Deployment

- **Backend**: Deployed to Heroku via the `backend/` directory. Uses `Procfile` with `web: java -Dserver.port=$PORT -jar target/*.jar`.
- **Frontend**: Deployed to Vercel. SPA fallback configured via `vercel.json` rewrites.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend framework | Spring Boot 4.1.0 |
| Real-time transport | STOMP over WebSocket (`@stomp/stompjs`) |
| Auth | JWT (custom handshake interceptor) |
| Frontend framework | React 18 + TypeScript |
| Build tool | Vite 5 |
| Styling | Tailwind CSS 3.4 |
| State management | Zustand |
| Routing | React Router v6 |
| Deployment | Heroku (backend) + Vercel (frontend) |
