# VidTalk 🎬✨

A groovy AI-powered video transcription and chat platform built with React Router v7, Cloudflare Workers, and retro vibes!

![VidTalk](https://img.shields.io/badge/VidTalk-AI%20Video%20Chat-FF6B35?style=for-the-badge&logo=tv&logoColor=white)
![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)

## 🚀 Features

### 📹 Video Library Management
- **Upload & Organize**: Drag-and-drop video uploads with a modern, animated interface
- **Smart Grid View**: Beautiful video cards with status indicators and retro-styled thumbnails
- **Search & Filter**: Quickly find videos in your collection

### 🤖 AI-Powered Intelligence
- **Automatic Transcription**: Upload videos and get AI-generated transcriptions using Whisper
- **Synchronized Playback**: Watch videos with real-time transcript highlighting
- **Smart Search**: Search within transcripts to jump to specific moments

### 💬 Interactive Chat
- **Individual Video Chat**: Have context-aware conversations about each video
- **Collection Chat**: Chat across your entire video library with cross-video insights
- **Video References**: AI responses include timestamp references and video thumbnails

### 🎨 Retro-Modern Design
- **70s-Inspired UI**: Groovy gradients, funky fonts, and playful animations
- **Dark/Light Mode**: Toggle between themes with smooth transitions
- **Responsive Design**: Looks rad on all devices from mobile to desktop

## 🛠️ Tech Stack

- **Frontend**: React 19 + React Router v7 (SSR)
- **Runtime**: Cloudflare Workers & Pages
- **Styling**: TailwindCSS v4 with custom retro utilities
- **AI Services**: 
  - Cloudflare AI (Whisper for transcription)
  - Cloudflare AI Gateway (AutoRAG for semantic search)
- **Storage**: 
  - Cloudflare R2 (video storage)
  - Cloudflare Durable Objects (database, video processing, chat sessions)
  - Cloudflare Containers (video conversion, thumbnail generation)
- **Build Tools**: Vite + pnpm
- **Language**: TypeScript

## 🚦 Getting Started

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- Cloudflare account with Workers, R2, D1, and AI enabled

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/vidtalk.git
cd vidtalk
```

2. Install dependencies:
```bash
pnpm install
```

3. Copy the example configuration:
```bash
cp wrangler.jsonc.example wrangler.jsonc
```

4. Set up Cloudflare services:
```bash
# Create R2 bucket for video storage
wrangler r2 bucket create vidtalk

# The project uses Durable Objects and Containers - these will be created on first deploy
```

5. Configure your `wrangler.jsonc`:
- Update the `routes` section with your custom domain pattern
- The configuration includes:
  - **R2 Bucket**: `VIDEO_BUCKET` for video storage
  - **Durable Objects**: For database, video processing, and chat sessions
  - **Containers**: For video conversion and thumbnail generation
  - **AI Binding**: For Whisper transcription and semantic search

### Development

Start the development server:
```bash
pnpm run dev
```

Your groovy app will be jamming at `http://localhost:5173` 🎸

### Building for Production

```bash
pnpm run build        # Build the app
pnpm run preview      # Preview production build locally
```

### Deployment

Deploy to Cloudflare Workers:
```bash
pnpm run deploy
```

## 📁 Project Structure

```
vidtalk/
├── app/
│   ├── components/         # Reusable UI components
│   │   ├── ChatMessage.tsx # AI/User message bubbles
│   │   ├── Sidebar.tsx     # Animated navigation sidebar
│   │   ├── VideoCard.tsx   # Video thumbnail cards
│   │   ├── VideoPlayer.tsx # Custom video player
│   │   └── ...
│   ├── routes/            # React Router file-based routes
│   │   ├── home.tsx       # Landing page with retro vibes
│   │   ├── videos._index.tsx       # Video library grid
│   │   ├── videos.$id.tsx          # Individual video view
│   │   ├── videos.collection-chat.tsx # Cross-video chat
│   │   └── api/                    # API routes
│   ├── lib/               # Shared utilities
│   └── styles/            # Global styles and Tailwind config
├── workers/               # Cloudflare Worker entry point
├── drizzle/              # Database schema and migrations
└── public/               # Static assets
```

## 🎮 Available Scripts

```bash
pnpm run dev         # Start development server
pnpm run build       # Build for production
pnpm run preview     # Preview production build
pnpm run deploy      # Deploy to Cloudflare Workers
pnpm run typecheck   # Run TypeScript type checking
pnpm run cf-typegen  # Generate Cloudflare types
```

## 🎨 Design System

### Color Palette
- **Primary**: Electric Blue (#1E40AF)
- **Secondary**: Funky Teal (#14B8A6)
- **Accent**: Sunset Orange (#FF6B35)
- **Background**: Warm Cream (#FFF3E0)
- **Dark Mode**: Deep Purple (#1A0033)

### Typography
- **Headers**: Bungee Shade (retro 3D effect)
- **Subheaders**: Bebas Neue (bold condensed)
- **Body**: Space Mono (monospace cool)

### Components
- Gradient overlays with animated hover effects
- Floating elements with CSS transforms
- Retro borders and shadows
- Smooth transitions and micro-interactions

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/radical-feature`)
3. Commit your changes (`git commit -m 'Add some radical feature'`)
4. Push to the branch (`git push origin feature/radical-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [React Router v7](https://reactrouter.com/)
- Powered by [Cloudflare Workers](https://workers.cloudflare.com/)
- Styled with [TailwindCSS](https://tailwindcss.com/)
- Icons by [Lucide](https://lucide.dev/)

---

<div align="center">
  <p>Made with 💜 and retro vibes</p>
  <p>Keep on groovin'! 🕺🎸</p>
</div>