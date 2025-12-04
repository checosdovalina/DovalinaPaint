# Overview

This is a business management application for **Dovalina Pro Painters** (formerly Dovalina Painting LLC), a painting contractor company. The system handles client management, project tracking, quotes, service orders, invoicing, payments, calendar scheduling, and financial reporting. It provides a complete workflow from client acquisition through project completion and payment collection.

The application uses a modern full-stack architecture with React/TypeScript on the frontend and Express/Node.js on the backend, with PostgreSQL (via Neon) for data persistence.

# Recent Changes

**December 2025 - Company Rebranding**
- Company name changed from "Dovalina Painting LLC" to "Dovalina Pro Painters"
- Updated brand color scheme:
  - Primary: Navy Blue (#3d4f6f)
  - Secondary/Accent: Gold (#c9a962)
  - Destructive: Red (#a31621)
- New logo assets:
  - `PNG_2_1764824638618.png` - Horizontal logo (sidebar)
  - `JPG_1_1764824638626.jpg` - Square icon logo (PDFs)
  - `JPG_3_1764824638626.jpg` - Square logo (auth page)
- Updated all PDF generation (quotes, invoices, service orders) with new company name
- Updated all page titles, headers, and testimonials with new branding

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework**: React 18 with TypeScript and Vite as the build tool

**UI Framework**: shadcn/ui component library built on Radix UI primitives, styled with Tailwind CSS v4

**Routing**: Wouter for lightweight client-side routing

**State Management**: 
- TanStack Query (React Query) for server state management and caching
- React Hook Form for form state with Zod validation
- Context API for authentication state

**Key Design Patterns**:
- Component-based architecture with separation of concerns (pages, components, hooks, lib utilities)
- Protected routes that redirect unauthenticated users to login
- Custom hooks for auth and toast notifications
- Centralized API request handling with error management

**Notable Features**:
- Calendar integration with FullCalendar for project/service order scheduling
- Google Calendar sync capability
- Stripe integration for payment processing
- PDF generation using jsPDF and html2canvas for quotes, invoices, and service orders
- Kanban board for project status visualization
- Mobile-responsive design with safe area considerations

## Backend Architecture

**Framework**: Express.js with TypeScript running on Node.js

**Authentication**: 
- Passport.js with local strategy for username/password authentication
- Express sessions for user state persistence
- Session store backed by PostgreSQL (connect-pg-simple)
- Simplified password hashing (noted as testing-only, should use bcrypt/scrypt in production)

**API Design**:
- RESTful API endpoints organized by resource type (clients, projects, quotes, etc.)
- Middleware for authentication checks on protected routes
- JSON request/response format
- Error handling middleware for consistent error responses

**Key Patterns**:
- Storage abstraction layer that wraps database operations
- Modular route registration separated from server setup
- Request/response logging middleware for API debugging

## Data Storage

**Database**: PostgreSQL via Neon serverless database

**ORM**: Drizzle ORM with schema-first approach

**Schema Design**:
- Users table for authentication
- Clients table (prospects and active clients)
- Projects table linked to clients
- Quotes table linked to projects
- Service Orders table linked to projects
- Staff table for employee management
- Subcontractors table for external workers
- Invoices table for billing
- Payments table for expense tracking
- Suppliers table for material vendors
- Purchase Orders table for procurement
- Activities table for audit trail
- Payment categories for expense classification

**Data Relationships**:
- One-to-many: Client → Projects → Quotes/ServiceOrders
- Many-to-many: Projects ↔ Staff (via JSON arrays)
- Many-to-many: Projects ↔ Subcontractors (via JSON arrays)
- File attachments stored as JSON arrays with URLs

**Migration Strategy**: Drizzle Kit for schema migrations with version tracking

## External Dependencies

**Payment Processing**:
- Stripe API for online invoice payments
- Client-side integration via @stripe/stripe-js and @stripe/react-stripe-js
- Server-side payment intent creation and webhook handling

**Email Service**:
- SendGrid for transactional emails (quote sending, invoice notifications)
- API key configuration via environment variables

**Calendar Integration**:
- Google Calendar API for two-way sync of projects and service orders
- OAuth2 authentication flow for calendar access
- googleapis npm package for API communication

**File Storage**:
- File uploads handled via attached_assets directory
- Images and documents stored with metadata in JSON format
- Base64 encoding for small files, URL references for larger files

**Third-Party UI Components**:
- Radix UI primitives for accessible component foundations
- FullCalendar for scheduling interface
- Recharts for financial reporting charts
- React Beautiful DnD for Kanban board drag-and-drop

**Development Tools**:
- Replit-specific plugins for development environment integration
- Runtime error overlay for debugging
- Cartographer plugin for code navigation (development only)

**Session Storage**:
- PostgreSQL-backed sessions in production via connect-pg-simple
- Memory store fallback for development

**WebSocket Support**:
- ws package for Neon serverless database connections
- WebSocket constructor configuration for serverless environments