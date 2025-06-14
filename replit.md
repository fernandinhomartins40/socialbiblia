# BibliaConnect - Christian Social Network with AI

## Overview

BibliaConnect is a Christian social network application that connects people through God's word, offering spiritual support through artificial intelligence. The application provides a platform for users to share posts, pray together, and receive biblical guidance through an AI assistant that correlates emotions with relevant Bible passages.

## System Architecture

This is a full-stack web application built with a modern React frontend and Express.js backend, following a monorepo structure with shared TypeScript definitions.

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **UI Components**: Radix UI primitives with shadcn/ui styling system
- **Styling**: Tailwind CSS with custom spiritual color palette
- **State Management**: TanStack React Query for server state
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite with hot module replacement

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Authentication**: Replit Auth with OpenID Connect (OIDC)
- **Session Management**: Express sessions with PostgreSQL storage
- **API Design**: RESTful API with structured error handling
- **Database**: PostgreSQL with Drizzle ORM
- **Type Safety**: Shared TypeScript schemas between frontend and backend

## Key Components

### Authentication System
- Replit Auth integration using OpenID Connect
- Session-based authentication with PostgreSQL session storage
- User profile management with spiritual attributes (denomination, favorite verse, bio)
- Protected routes with middleware authentication

### Database Schema
- **Users**: Profile information including spiritual preferences
- **Posts**: Content sharing with types (post, prayer, verse)
- **Comments**: Threaded discussions on posts
- **Likes**: Social engagement tracking
- **Follows**: User relationship management
- **Communities**: Group organization by spiritual interests
- **AI Interactions**: Conversation history with biblical AI assistant
- **Biblical Verses**: Scripture database for AI correlations

### AI Integration
- Biblical AI assistant that correlates user emotions with relevant scripture
- Emotion-based verse recommendations
- Conversation history tracking
- Spiritual support through AI-powered interactions

### Social Features
- Post creation with multiple types (general posts, prayer requests, verse sharing)
- Like and comment system
- User following and community membership
- Feed algorithm for personalized content

## Data Flow

1. **Authentication Flow**: User authenticates via Replit OIDC → Session created → User profile retrieved/created
2. **Post Creation**: User creates post → Validation → Database storage → Real-time feed updates
3. **AI Interaction**: User shares emotion → AI processes → Bible verse correlation → Response with scripture
4. **Social Engagement**: User interactions (likes, comments) → Database updates → Query invalidation → UI updates

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Headless UI components
- **tailwindcss**: Utility-first CSS framework
- **wouter**: Lightweight React router
- **openid-client**: OIDC authentication
- **connect-pg-simple**: PostgreSQL session store

### Development Tools
- **vite**: Build tool and development server
- **typescript**: Type safety
- **@replit/vite-plugin-***: Replit-specific development plugins

## Deployment Strategy

### Environment Configuration
- **Development**: Local development with Vite dev server and tsx for backend
- **Production**: Built assets served statically with optimized Express server
- **Database**: PostgreSQL connection via environment variables

### Build Process
1. Frontend build with Vite (outputs to `dist/public`)
2. Backend build with esbuild (outputs to `dist/index.js`)
3. Single deployment artifact with both client and server

### Hosting Requirements
- Node.js runtime environment
- PostgreSQL database
- Environment variables for database connection and session secrets
- Static file serving capability

## Changelog

```
Changelog:
- June 14, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```