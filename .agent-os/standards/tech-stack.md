# Tech Stack

## Context
Global tech stack defaults for Agent OS projects, overridable in project-specific `.agent-os/product/tech-stack.md`.

## Languages & Environments
- TypeScript (app + frontend)  
- Python (backend services/agents, data, infra scripts)  
- Environment Management:  
  - Python: venv  
  - TypeScript: Volta (with .nvmrc fallback)  
- Pinned Versions:  
  - Node.js 22 LTS  
  - pnpm 9+  
  - Python 3.12+  
- Local Development: Homebrew installs preferred  

## Application Frameworks
- TypeScript: Next.js (React latest stable)  
- Python: FastAPI or Flask  

## Database & Persistence
- Database: PostgreSQL 17+ (via Supabase)  
- ORM (TS): Prisma  
- ORM (Python): SQLAlchemy  

## Build & Tooling
- Build Tool: Vite  
- Import Strategy: Node.js modules  
- Package Manager: pnpm  

## UI & Styling
- CSS Framework: TailwindCSS 4.0+  
- UI Components: shadcn/ui (or equivalent)  
- Icons: Lucide React components  
- Fonts: Google Fonts (self-hosted)  

## Infrastructure & Ops
- Application Hosting: Vercel (default)  
- Database Hosting: Supabase (managed PostgreSQL + edge functions)  
- API Integrations: Google Cloud APIs (as needed)  
- Database Backups: Managed by Supabase  
- Asset Storage: Supabase Storage
- CDN: Vercel Edge / CloudFront (as fallback)  
- Asset Access: Private with signed URLs  

## Testing
- Unit Testing (TS): Vitest (preferred) or Jest  
- Unit Testing (Python): pytest  
- Test Runner: GitHub Actions (PRs + pre-deploy)  

## CI/CD
- Platform: GitHub Actions  
- Trigger: Push to main/staging branches  
- Tests: Run before deployment  
- Production: main branch (deployed via Vercel)  
- Staging: staging branch (preview deploys via Vercel)  