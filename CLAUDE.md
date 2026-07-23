# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Vaultify is a cloud storage and video streaming platform with a React frontend and Node.js backend. It supports file storage, folder management, video uploads with multipart support, and public sharing via expiring links.

## Project Structure

This is a monorepo with two sub-projects:

- **vaultify-frontend/** - React 19 SPA with Vite, Tailwind CSS v4, Firebase Auth
- **vaultify-backend/** - Express.js API with MongoDB, AWS S3, JWT + Firebase Admin auth

## Common Commands

### Frontend (vaultify-frontend/)

```bash
cd vaultify-frontend
npm install
npm run dev        # Start dev server on http://localhost:5173
npm run build      # Production build
npm run lint       # ESLint check
npm run preview    # Preview production build locally
```

### Backend (vaultify-backend/)

```bash
cd vaultify-backend
npm install
npm run dev        # Start with nodemon hot-reload on port 5000
npm start          # Production mode (node src/server.js)
```

## Architecture

### Authentication Flow

1. Frontend uses Firebase Auth (client SDK) for email/password and Google OAuth
2. Backend verifies Firebase tokens via Firebase Admin SDK
3. Backend issues JWT tokens stored in `localStorage` as `vaultify_token`
4. All protected API calls include `Authorization: Bearer <jwt-token>` header
5. Backend `authMiddleware.protect` validates JWT and attaches user to request

### API Client Pattern

Frontend uses a central API service at `src/services/api.js` with:
- `getHeaders(isFormData)` - Attaches auth token, sets Content-Type
- `handleResponse()` - Parses JSON, throws on non-ok status
- Endpoint methods grouped by domain: auth, files, folders, etc.

### Frontend State Management

Global state is managed via `FileContext.jsx` (React Context):
- User authentication state
- File/folder lists fetched from backend
- Storage stats and activities
- Video upload queue with progress tracking
- Local settings (theme, sidebar, accent color) persisted to localStorage

### Backend Structure

Express app in `src/app.js` mounts routes under `/api`:
- `/auth` - Login, register, profile, password management
- `/files` - File upload, download, move, favorite, delete
- `/folders` - CRUD for hierarchical folders
- `/videos` - Multipart video upload, streaming, sharing
- `/share` - Public share links with expiry
- `/admin` - Admin dashboard endpoints

Middleware stack: helmet → cors → express.json → morgan → rateLimiter → routes → errorHandler

### Video Upload System

Videos use multipart chunked upload:
1. `POST /videos/upload/init` - Initialize upload, get uploadId
2. `POST /videos/upload/part` - Upload individual chunks (5MB recommended)
3. `POST /videos/upload/complete` - Complete and assemble in S3

Frontend uses `useVideoUpload` hook and `videoUploadService` to manage queue.

### Data Storage

- **MongoDB Atlas** - User profiles, file/folder metadata, share tokens, activities
- **AWS S3** - Binary file storage, video streaming via pre-signed URLs
- **localStorage** - Frontend: JWT token, user settings, local trash state

### Environment Configuration

Frontend (`.env`):
- `VITE_API_URL` - Backend API base URL
- `VITE_FIREBASE_*` - Firebase client config

Backend (`.env`):
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET`, `JWT_EXPIRES_IN` - JWT signing config
- `AWS_*` - S3 bucket and credentials
- `CORS_ORIGIN` - Frontend origin for CORS

### Key Models

- `User` - Profile, auth, storage plan, UI preferences
- `File` - Metadata (name, type, size, S3 key), folder reference, soft-delete flag
- `Folder` - Hierarchical (parent_folder_id), cascade deletion handled in controller
- `Video` - Separate track for uploaded videos with multipart state, share tokens
- `SharedLink` - Expiring public share tokens for files

### Error Handling

Backend uses custom error classes in `utils/errors.js` (AppError, NotFoundError, UnauthorizedError). Global `errorHandler` middleware formats responses as:
```json
{ "status": "error", "message": "...", "stack?": "..." }
```

## Important Patterns

### File vs Video Distinction

The app has two parallel systems:
- **Regular files** - Stored via File model, uploaded via multipart form to `/files/upload`
- **Videos** - Stored via Video model, use multipart S3 upload, have separate folder structure via VideoFolder

Frontend detects video by extension or mimeType and routes to appropriate service.

### Soft Delete (Trash)

Files are soft-deleted via `is_deleted` flag on backend, but trash state is also managed locally in frontend via `localStorage` (`vaultify_local_trash_files`). The backend doesn't have a trash concept - deletes are permanent S3 + DB removal.

### Share Links

- Regular files: Time-limited share tokens stored in `SharedLink` model
- Videos: Permanent share tokens stored directly on `Video` model (`shareToken`, `isShared` fields)

Public share routes at root level (`/share/:token/stream`, `/v/:code`) bypass auth middleware.

### Frontend Theming

Settings applied via DOM attributes on `<html>` element:
- `data-dark-mode-active` - true/false
- `data-accent-color` - blue, purple, green, orange, red
- `data-sidebar-mode` - compact, expanded
- `data-display-view` - grid, list
- `data-font-size` - small, medium, large

Initialized from `localStorage.getItem('vaultify_settings')` on boot, synced from user profile after login.

## Deployment

- Frontend: Configured for Vercel (`vercel.json` with SPA rewrite rules)
- Backend: Supports AWS Lambda (`lambda.js` entry point) or traditional server via `server.js`
