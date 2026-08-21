---
inclusion: auto
---

# Figma Design System Integration

This project uses a custom design system built with Next.js 16, React 19, Tailwind CSS v4, and shadcn/ui components. When generating code from Figma designs or mapping components to Figma, follow these guidelines.

## Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19
- **Styling**: Tailwind CSS v4 with custom design tokens
- **Component Library**: shadcn/ui + Base UI primitives
- **Icons**: lucide-react
- **Utilities**: class-variance-authority (cva), clsx, tailwind-merge

## Design Tokens

### Color System
Uses OKLCH color space with semantic tokens:

**Light Mode:**
- `--background`: oklch(0.985 0.005 145)
- `--foreground`: oklch(0.22 0.02 160)
- `--primary`: oklch(0.52 0.11 165)
- `--primary-foreground`: oklch(0.985 0.01 145)
- `--secondary`: oklch(0.95 0.02 160)
- `--muted`: oklch(0.95 0.01 160)
- `--accent`: oklch(0.8 0.13 85)
- `--destructive`: oklch(0.577 0.22 25)
- `--border`: oklch(0.9 0.01 160)
- `--ring`: oklch(0.52 0.11 165)

**Dark Mode:**
- Uses `.dark` class with adjusted OKLCH values
- Supports `prefers-color-scheme` media query

### Border Radius Scale
- `--radius`: 0.625rem (base)
- `--radius-sm`: calc(var(--radius) * 0.6)
- `--radius-md`: calc(var(--radius) * 0.8)
- `--radius-lg`: var(--radius)
- `--radius-xl`: calc(var(--radius) * 1.4)
- `--radius-2xl`: calc(var(--radius) * 1.8)
- `--radius-3xl`: calc(var(--radius) * 2.2)
- `--radius-4xl`: calc(var(--radius) * 2.6)

### Typography
- `--font-sans`: Inter (primary font)
- `--font-mono`: Space Grotesk
- `--font-display`: Space Grotesk

### Spacing
Uses Tailwind's default spacing scale with custom card spacing:
- `--card-spacing`: --spacing(4) default, --spacing(3) for small cards

## Component Patterns

### Button Component
- Uses Base UI primitives (`@base-ui/react/button`)
- Styled with class-variance-authority (cva)
- **Variants**: default, outline, secondary, ghost, destructive, link
- **Sizes**: default (h-8), xs (h-6), sm (h-7), lg (h-9), icon (size-8), icon-xs (size-6), icon-sm (size-7), icon-lg (size-9)
- **States**: hover, focus-visible, active, disabled, aria-invalid
- Includes focus ring: `focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50`
- SVG icons sized automatically with `[&_svg:not([class*='size-'])]:size-4`

### Card Component
- Uses data attributes for styling: `data-slot`, `data-size`
- **Sub-components**: CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter
- **Sizes**: default (spacing-4), sm (spacing-3)
- Uses CSS custom properties: `py-(--card-spacing)`, `px-(--card-spacing)`
- Container queries: `@container/card-header`
- Ring border: `ring-1 ring-foreground/10`

### Icons
- Use `lucide-react` for all icons
- Default size: `size-4` (16px)
- Adjust with `size-3` (12px), `size-3.5` (14px), or custom sizes
- Icons are pointer-events-none and non-shrinking in flex containers

## Code Generation Rules

### When Converting Figma to Code

1. **Replace Tailwind utilities from Figma** with project tokens:
   - Convert hex colors → semantic color tokens (bg-primary, text-foreground, etc.)
   - Use existing design token CSS variables, not hardcoded OKLCH values
   - Replace fixed border-radius → radius scale (rounded-lg, rounded-xl, etc.)

2. **Reuse existing components**:
   - Button: Use `<Button variant="..." size="...">` instead of custom buttons
   - Card: Use Card component family instead of div with borders/shadows
   - Input, Select, Dialog, etc.: Check `components/ui/` directory first

3. **Match existing patterns**:
   - Use `cn()` utility from `@/lib/utils` for className merging
   - Apply data attributes (`data-slot`, `data-size`) for variant styling
   - Include focus states: `focus-visible:border-ring focus-visible:ring-3`
   - Support dark mode with semantic tokens (not manual dark: prefixes)

4. **Layout conventions**:
   - Use flexbox/grid with semantic gap utilities
   - Prefer container queries (`@container`) for responsive design
   - Use CSS custom properties for spacing: `px-(--card-spacing)`

5. **Typography**:
   - Base text size: `text-sm`
   - Headings: `text-base` (default), `text-lg`, `text-xl`
   - Muted text: `text-muted-foreground`
   - Leading: `leading-snug` for titles

6. **Accessibility**:
   - Include proper ARIA attributes
   - Support keyboard navigation with focus-visible states
   - Use semantic HTML elements
   - Provide alt text for images
   - Include aria-invalid styles for form validation

### When Creating Code Connect Mappings

1. Map Figma component names to their code equivalents in `components/ui/`
2. Document variant prop mappings (Figma properties → React props)
3. Include usage examples showing how design tokens map to props
4. Note any differences between Figma design and code implementation

## File Structure

```
components/
├── ui/                      # shadcn/ui components
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   └── ...
├── dashboard/              # Feature-specific components
│   ├── dashboard.tsx
│   ├── summary-cards.tsx
│   └── ...
└── theme-provider.tsx

app/
├── globals.css             # Design tokens, base styles
├── layout.tsx              # Root layout with theme
└── [routes]/

lib/
├── utils.ts                # cn() utility
└── ...
```

## Animations

Custom animations available:
- `animate-blob`: Floating blob animation (16s)
- `animate-blob-reverse`: Reverse floating (24s)
- Uses tw-animate-css library

## Glass Effects

Utility classes for glassmorphism:
- `border-glass`: oklch(1 0 0 / 12%)
- `shadow-glass`: 0 8px 32px 0 oklch(0 0 0 / 10%)

## Figma MCP Integration Guidelines

When using Figma MCP tools:

1. **Treat Figma output as design reference**, not final code
2. Replace generated Tailwind classes with semantic tokens
3. Reuse existing component library instead of creating new components
4. Maintain 1:1 visual parity while respecting the design system
5. Validate against Figma screenshots for both look and behavior
6. Use project's routing, state management, and data patterns
7. Apply accessibility standards consistently

## Do Not

- ❌ Create new button/input/card components (use existing from `components/ui/`)
- ❌ Hardcode color values (use semantic tokens)
- ❌ Use inline styles (use Tailwind utilities)
- ❌ Ignore dark mode (all tokens support automatic dark mode)
- ❌ Skip focus states (critical for accessibility)
- ❌ Use deprecated Tailwind v3 syntax (this project uses v4)
