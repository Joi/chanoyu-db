# Deployment Specification

This is the deployment specification for the spec detailed in @.agent-os/specs/2025-09-14-joi-design-system/spec.md

## Deployment Requirements

### GitHub Actions Workflow Configuration

#### Enhanced CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy joi.ito.com Design System
on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main, dev]

jobs:
  quality-gates:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Type checking
        run: pnpm typecheck

      - name: Linting
        run: pnpm lint

      - name: Build project
        run: pnpm build

      - name: Accessibility testing
        run: pnpm test:a11y

      - name: Visual regression testing
        run: pnpm test:visual
```

#### Preview Deployments
- Automatic preview deployments for all feature branches
- Branch-specific URLs following pattern: `{branch-name}.preview.collection.ito.com`
- Environment variable injection for preview-specific configurations
- Automatic cleanup of preview deployments when branches are deleted

#### Production Deployment
- Automatic production deployment on merge to `main` branch
- Zero-downtime deployment strategy with health checks
- Automatic rollback on deployment failure
- Post-deployment smoke tests to verify functionality

### Vercel Configuration Enhancement

```json
{
  "framework": "nextjs",
  "buildCommand": "pnpm build",
  "outputDirectory": ".next",
  "installCommand": "pnpm install --frozen-lockfile",
  "regions": ["sfo1"],
  "functions": {
    "app/**": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/admin",
      "destination": "/admin/objects",
      "permanent": false
    }
  ]
}
```

### Environment Configuration

#### Environment Variables
```bash
# Production
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://collection.ito.com

# Preview/Development
NEXT_PUBLIC_SUPABASE_URL=https://your-staging-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-staging-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-staging-service-role-key
NEXTAUTH_SECRET=your-dev-nextauth-secret
NEXTAUTH_URL=https://{branch-name}.preview.collection.ito.com
```

#### Domain Configuration
- Production: `collection.ito.com`
- Preview: `{branch-name}.preview.collection.ito.com`
- Development: `localhost:3000`

### Quality Assurance Integration

#### Automated Testing Suite
```bash
# Package.json scripts addition
"scripts": {
  "test:a11y": "axe-cli build/ --exit",
  "test:visual": "percy exec -- pnpm build && percy snapshot build/",
  "test:lighthouse": "lhci autorun",
  "test:smoke": "playwright test --config=playwright.smoke.config.ts"
}
```

#### Performance Monitoring
- Lighthouse CI integration for performance regression detection
- Core Web Vitals monitoring with automatic alerts
- Bundle size tracking with size-limit integration
- Performance budgets enforcement in CI pipeline

#### Visual Regression Testing
- Percy integration for automated visual diff detection
- Screenshot comparison across different browsers and devices
- Component-level visual testing for design system components
- Automated approval workflow for intentional visual changes

### Monitoring and Alerting

#### Production Monitoring
```yaml
# .github/workflows/monitoring.yml
name: Production Health Checks
on:
  schedule:
    - cron: '*/5 * * * *' # Every 5 minutes

jobs:
  health-check:
    runs-on: ubuntu-latest
    steps:
      - name: Check site availability
        run: |
          curl -f https://collection.ito.com/api/health || exit 1

      - name: Check performance metrics
        uses: GoogleChrome/lighthouse-ci@v1
        with:
          urls: https://collection.ito.com
          budgetPath: .lighthouse/budget.json
```

#### Alert Configuration
- Slack notifications for deployment failures
- Email alerts for performance degradation
- Discord webhook for successful deployments
- PagerDuty integration for critical site outages

### Security Configuration

#### Content Security Policy
```javascript
// next.config.js security headers
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src 'self' fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https://*.supabase.co;"
  }
]
```

#### Dependency Security
- Automated security scanning with GitHub Dependabot
- Regular dependency updates through automated PRs
- npm audit integration in CI pipeline
- OWASP dependency check integration

### Rollback Strategy

#### Automatic Rollback Triggers
- 4xx/5xx error rate exceeding 5% for 2 minutes
- Core Web Vitals degradation beyond acceptable thresholds
- Failed smoke test execution post-deployment
- Manual rollback capability via GitHub Actions workflow dispatch

#### Rollback Process
1. Automatic detection of deployment issues
2. Immediate traffic routing to previous stable version
3. Notification to development team
4. Root cause analysis initiation
5. Fix deployment or manual intervention

### Performance Optimization

#### Build Optimization
- Next.js App Router optimizations for faster builds
- Incremental Static Regeneration (ISR) for dynamic content
- Edge runtime optimization for API routes
- Bundle analysis and optimization recommendations

#### CDN Configuration
- Vercel Edge Network optimization
- Custom caching strategies for static assets
- Image optimization with next/image
- Font optimization with proper preload strategies

## Implementation Timeline

### Phase 1: CI/CD Setup (Week 1)
- GitHub Actions workflow configuration
- Environment variable setup
- Basic automated testing integration

### Phase 2: Quality Gates (Week 2)
- Lighthouse CI integration
- Visual regression testing setup
- Accessibility testing automation

### Phase 3: Monitoring (Week 3)
- Production health checks
- Alert configuration
- Performance monitoring dashboard

### Phase 4: Security Hardening (Week 4)
- CSP implementation
- Security headers configuration
- Dependency security scanning

### Phase 5: Optimization (Week 5)
- Performance optimization
- CDN configuration
- Rollback strategy testing