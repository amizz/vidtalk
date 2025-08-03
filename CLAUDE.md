# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VidTalk is a modern AI-powered video transcription and chat service that allows users to upload videos, generate transcriptions, and have intelligent conversations about their video content. Built as a full-stack React application with React Router v7, deployed on Cloudflare Workers with server-side rendering (SSR).

### Core Features
- **Video Library Management**: Upload, organize, and search through video collections with a modern grid interface
- **AI-Powered Transcription**: Automatic video transcription with synchronized playback
- **Individual Video Chat**: Context-aware AI chat for each video with timestamp references
- **Collection Chat**: Chat across entire video collection with cross-video insights
- **Modern UI/UX**: Responsive design with dark/light mode, animations, and gradient effects

## Commands

### Development
```bash
pnpm run dev         # Start development server at http://localhost:5173
```

### Build & Deploy
```bash
pnpm run build       # Build for production
pnpm run preview     # Preview production build locally
pnpm run deploy      # Build and deploy to Cloudflare Workers
```

### Type Checking
```bash
pnpm run typecheck   # Generate Cloudflare types and run TypeScript checks
pnpm run cf-typegen  # Generate Cloudflare Worker types only
```

### Testing
No test runner is currently configured. Check with the user for testing requirements.

### Linting
No linter is currently configured. Check with the user for linting requirements.

## Architecture

### Stack
- **Framework**: React Router v7 with SSR
- **Runtime**: Cloudflare Workers
- **Styling**: TailwindCSS v4
- **Build Tool**: Vite
- **Package Manager**: pnpm
- **Language**: TypeScript

### Key Files & Directories
- `app/` - React application code
  - `root.tsx` - Root layout component with error boundary
  - `routes.ts` - Route configuration
  - `routes/home.tsx` - Main application view with video library, player, and chat interfaces
  - `components/` - Reusable UI components
    - `Sidebar.tsx` - Modern animated sidebar with navigation and user controls
    - `VideoCard.tsx` - Video thumbnail cards with status indicators
    - `VideoPlayer.tsx` - Custom video player with playback controls
    - `TranscriptViewer.tsx` - Synchronized transcript viewer with search
    - `VideoUploadModal.tsx` - Drag-and-drop video upload interface
    - `ChatMessage.tsx` - Chat message bubbles with AI/user distinction
- `workers/app.ts` - Cloudflare Worker entry point that handles requests
- `wrangler.jsonc` - Cloudflare Worker configuration
- `react-router.config.ts` - React Router configuration (SSR enabled)
- `vite.config.ts` - Vite configuration with Cloudflare, TailwindCSS, and React Router plugins

### UI/UX Design
- **Color Scheme**: 
  - Primary: Blue (#1E40AF) for CTAs and active states
  - Secondary: Teal (#14B8A6) for accents and gradients
  - Neutral grays for text and backgrounds
  - Success (green) and Error (red) for status indicators
- **Design System**:
  - Modern gradient effects on key UI elements
  - Smooth animations and transitions (scale, opacity, shadows)
  - Rounded corners (rounded-xl) for modern aesthetic
  - Responsive breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)

### Component Architecture
- **State Management**: React useState hooks for local state
- **Dark Mode**: Toggle implementation with class-based theming
- **Mock Data**: Currently using mock data for videos and transcripts
- **Icons**: Lucide React for consistent iconography
- **Styling**: Tailwind CSS with custom gradient utilities

### Important Context
- The app uses React Router's file-based routing with type safety
- Cloudflare environment variables and context are available in route loaders/actions via `AppLoadContext`
- The project is configured for Cloudflare Workers deployment with observability enabled
- Uses the latest React 19 and React Router 7 with their new APIs
- All components are TypeScript-first with proper type definitions
- The UI is fully responsive with mobile-first design principles