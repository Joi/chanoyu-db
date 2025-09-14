# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-09-14-joi-design-system/spec.md

## Technical Requirements

### Color System Implementation

- Update Tailwind CSS configuration with joi.ito.com color tokens:
  ```css
  :root {
    --paper: #fafafa;           /* Primary background */
    --paper-elevated: #ffffff;   /* Card/widget backgrounds */
    --section-bg: #f5f5f5;      /* Section backgrounds */
    --primary-blue: #1A80B4;    /* Primary brand blue */
    --hover-blue: #0299ce;      /* Interactive blue */
    --border-subtle: #e5e5e5;   /* Subtle borders */
    --gradient-header: linear-gradient(135deg, #1A80B4 0%, #0299ce 100%);
  }
  ```
- Ensure WCAG AA contrast ratios for all color combinations
- Implement dark mode considerations for future compatibility

### Typography Integration

- Configure Next.js font loading with Montserrat as Avenir fallback
- Update existing Japanese font integration (Noto Sans JP) to work with new stack
- Implement proper font display strategies for performance
- Create typography scale utilities in Tailwind configuration

### Component Library Extensions

#### GradientHeader Component
```tsx
interface GradientHeaderProps {
  title: string;
  subtitle?: string;
  rounded?: boolean;
  className?: string;
}

export function GradientHeader({ title, subtitle, rounded = true, className }: GradientHeaderProps)
```

#### JoiCard Component
```tsx
interface JoiCardProps {
  children: React.ReactNode;
  elevated?: boolean;
  rounded?: 'md' | 'lg' | 'xl'; // 20px = xl
  gradient?: boolean;
  className?: string;
}

export function JoiCard({ children, elevated = true, rounded = 'xl', gradient = false, className }: JoiCardProps)
```

#### SectionContainer Component
```tsx
interface SectionContainerProps {
  children: React.ReactNode;
  background?: 'paper' | 'section' | 'elevated';
  className?: string;
}

export function SectionContainer({ children, background = 'section', className }: SectionContainerProps)
```

### Layout System Updates

- Implement consistent 20px border radius system across components
- Update existing Container component for joi.ito.com spacing patterns
- Create responsive grid utilities for card layouts
- Implement gradient background utilities for headers and accents

### Performance Requirements

- Maintain Lighthouse Performance score ≥90
- Font loading optimization with proper fallbacks
- Image optimization using next/image for all visual assets
- CSS bundle size optimization through purging unused styles

### Browser Compatibility

- Support Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- Progressive enhancement for older browsers
- Proper CSS Grid and Flexbox fallbacks
- Font stack fallbacks for systems without Avenir/Montserrat

### Responsive Design Implementation

- Mobile-first approach with breakpoints matching joi.ito.com patterns
- Touch-friendly interactive elements (44px minimum)
- Optimal typography scaling across device sizes
- Proper image responsiveness and aspect ratio handling

## External Dependencies

**Google Fonts Integration**
- **Montserrat** - Primary font fallback for Avenir
- **Justification:** Closest free alternative to Avenir with similar geometric characteristics and excellent Japanese character support when paired with Noto Sans JP

**Tailwind CSS Plugins**
- **@tailwindcss/typography** - Enhanced prose styling for content areas
- **@tailwindcss/forms** - Consistent form styling across components
- **Justification:** Required for maintaining design consistency and reducing custom CSS complexity