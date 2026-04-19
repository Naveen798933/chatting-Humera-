# LoveChat / PrivateTalk

Private couple chat platform with React, Vite, Express, MongoDB, and Socket.io.

## Structure

- `client` - React + Vite UI
- `server` - Express + MongoDB API and Socket.io realtime layer

## Features

- Open registration with OTP verification
- JWT auth with bcrypt password hashing
- Private two-user room enforcement
- Realtime messaging, typing, presence, seen state, reactions, message editing, in-chat search, shared music, mood status, and live cursor events
- Responsive glassmorphism UI with dark/light mode
- Profile picture upload and daily memory panel

## Execution Guide

### 1. Install dependencies

From the project root, run:

- `npm install`

This installs both workspace apps: `client` and `server`.

If you prefer per-app installs, use:

- `cd server && npm install`
- `cd ../client && npm install`

### 2. Configure environment files

Copy the example env files and set your values:

- `server/.env.example` -> `server/.env`
- `client/.env.example` -> `client/.env`

Important server values:

- `MONGODB_URI=mongodb://127.0.0.1:27017/chat`
- `JWT_SECRET=...`
- Set `SMTP_HOST`, `SMTP_USER`, and `SMTP_PASS` to send OTPs by email.
- If SMTP is left blank, the OTP is returned in the signup/reset response and printed to the server console.
- For Gmail, use a 2-step-verified account and an app password, not your normal login password.

### 3. Start MongoDB

Make sure MongoDB is running locally before starting the server.

### 4. Start the backend

Run one of these:

- `npm run dev:server`
- `cd server && npm run dev`

The server dev script now frees port `5000` automatically before starting, which prevents the common `EADDRINUSE` restart error on Windows.

### 5. Start the frontend

Run one of these:

- `npm run dev:client`
- `cd client && npm run dev`

### 6. Open the app

Visit the Vite URL shown in the terminal, usually:

- `http://localhost:5173`

### 7. Sign in flow

1. Create a new account.
2. Verify the OTP.
3. Log in.
4. Open the private chat room.

## Notes

- Open registration to all users by removing invite-code checks, invite-email filtering, and the signup cap.
- Local MongoDB is wired to `mongodb://127.0.0.1:27017/chat` in `server/.env`.
- The message payload uses encrypted storage on the server side with a room secret, while the socket layer only forwards authorized room traffic.
- For production, enable HTTPS and set secure cookies behind a reverse proxy.
