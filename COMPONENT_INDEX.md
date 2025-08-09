# Component Index

## Overview
This document provides a comprehensive index of all React components in the Nucleus application, organized by category and functionality.

## Core Application Components

### App.tsx
**Location**: `client/src/App.tsx`
**Purpose**: Main application component with routing and providers
**Dependencies**: wouter, @tanstack/react-query, ThemeContext
**Key Features**:
- Route configuration
- Authentication state management
- Global providers (Query, Theme, Tooltip)
- Loading state handling

## Page Components (`client/src/pages/`)

### Landing.tsx
**Purpose**: Homepage and marketing landing page
**Features**:
- Hero section with value proposition
- Feature highlights
- Call-to-action buttons
- Responsive design

### Login.tsx
**Purpose**: User authentication page
**Features**:
- Clerk authentication integration
- Social login options
- Form validation
- Redirect handling

### IdeaValidation.tsx
**Purpose**: Business idea submission and validation
**Features**:
- Multi-step form
- Real-time validation
- Progress indicators
- AI analysis integration

### ValidationResults.tsx
**Purpose**: Display validation analysis results
**Features**:
- Score visualization
- Detailed insights
- Recommendations
- Export options

### Matching.tsx
**Purpose**: Co-founder and investor matching interface
**Features**:
- Match algorithm results
- Filter and search
- Profile cards
- Connection requests

### Leaderboard.tsx
**Purpose**: User rankings and competition
**Features**:
- Top performers list
- Score comparisons
- Achievement badges
- Time-based filtering

### Portfolio.tsx
**Purpose**: User's validated ideas management
**Features**:
- Idea gallery
- Progress tracking
- Performance metrics
- Quick actions

### Matches.tsx
**Purpose**: Manage connections and matches
**Features**:
- Active connections
- Pending requests
- Match history
- Communication tools

### Pricing.tsx
**Purpose**: Subscription plans and billing
**Features**:
- Plan comparison
- Feature matrices
- Stripe integration
- Usage tracking

### Demo.tsx
**Purpose**: Interactive product demonstration
**Features**:
- Guided walkthrough
- Sample data
- Feature highlights
- Call-to-action

### Profile.tsx
**Purpose**: User profile management
**Features**:
- Personal information editing
- Avatar upload
- Preferences settings
- Account management

## Core Components (`client/src/components/`)

### ErrorBoundary.tsx
**Location**: `client/src/components/ErrorBoundary.tsx`
**Purpose**: Global error handling and fallback UI
**Features**:
- Error catching
- User-friendly error messages
- Error reporting to Sentry
- Retry functionality

### LeaderboardCard.tsx
**Location**: `client/src/components/LeaderboardCard.tsx`
**Purpose**: Individual user ranking display
**Props**: 
- `rank: number`
- `user: UserProfile`
- `score: number`

### PrivacySettingsModal.tsx
**Location**: `client/src/components/PrivacySettingsModal.tsx`
**Purpose**: Privacy and data management settings
**Features**:
- Data visibility controls
- Export/delete options
- Consent management

### ProReportDisplay.tsx
**Location**: `client/src/components/ProReportDisplay.tsx`
**Purpose**: Professional report viewer
**Features**:
- Multi-section layout
- Export capabilities
- Print optimization
- Interactive elements

### ProfileCard.tsx
**Location**: `client/src/components/ProfileCard.tsx`
**Purpose**: User profile preview component
**Props**:
- `user: UserProfile`
- `variant: 'compact' | 'full'`
- `showActions?: boolean`

## Professional Report Components (`client/src/components/pro-report/`)

### ExecutiveSummarySection.tsx
**Purpose**: Business overview and key highlights
**Features**:
- Summary metrics
- Key findings
- Strategic recommendations

### MarketAnalysisSection.tsx
**Purpose**: Market research and competitive analysis
**Features**:
- Market size data
- Competitor analysis
- Opportunity identification

### FinancialProjectionsSection.tsx
**Purpose**: Financial modeling and projections
**Features**:
- Revenue projections
- Cost analysis
- Break-even calculations
- Interactive charts

### FounderMatchingSection.tsx
**Purpose**: Co-founder recommendations
**Features**:
- Skill-based matching
- Compatibility scores
- Contact options

### FundingOpportunitiesSection.tsx
**Purpose**: Investment and funding options
**Features**:
- Funding type recommendations
- Investor matches
- Application guidance

### MarketingSalesSection.tsx
**Purpose**: Marketing strategy and sales projections
**Features**:
- Channel recommendations
- Customer acquisition costs
- Growth strategies

### OrganizationManagementSection.tsx
**Purpose**: Organizational structure and management
**Features**:
- Team structure recommendations
- Role definitions
- Management best practices

### ProductServiceSection.tsx
**Purpose**: Product development and service delivery
**Features**:
- Development roadmap
- Feature prioritization
- Quality metrics

### StartupResourcesSection.tsx
**Purpose**: Essential resources and tools
**Features**:
- Tool recommendations
- Resource links
- Integration guides

### CompanyDescriptionSection.tsx
**Purpose**: Company profile and description
**Features**:
- Mission statement
- Value proposition
- Company overview

### DomainSuggestionsSection.tsx
**Purpose**: Domain name and branding suggestions
**Features**:
- Available domains
- Pricing information
- Registration links

## UI Components (`client/src/components/ui/`)

### Core UI Components
All components follow Radix UI + Tailwind CSS patterns with consistent theming.

#### Navigation & Layout
- **accordion.tsx** - Collapsible content sections
- **breadcrumb.tsx** - Navigation breadcrumbs
- **navigation-menu.tsx** - Main navigation component
- **sidebar.tsx** - Sidebar navigation layout
- **sheet.tsx** - Slide-out panels
- **tabs.tsx** - Tabbed interface component

#### Forms & Input
- **form.tsx** - Form wrapper with validation
- **input.tsx** - Text input field
- **input-otp.tsx** - One-time password input
- **textarea.tsx** - Multi-line text input
- **select.tsx** - Dropdown selection
- **checkbox.tsx** - Checkbox input
- **radio-group.tsx** - Radio button groups
- **switch.tsx** - Toggle switch
- **slider.tsx** - Range slider input
- **calendar.tsx** - Date picker calendar

#### Display & Feedback
- **card.tsx** - Content card container
- **badge.tsx** - Status and category badges
- **avatar.tsx** - User avatar display
- **alert.tsx** - Alert notifications
- **toast.tsx** - Toast notifications
- **toaster.tsx** - Toast notification provider
- **progress.tsx** - Progress indicators
- **skeleton.tsx** - Loading skeletons
- **table.tsx** - Data table component

#### Interactive Elements
- **button.tsx** - Primary button component
- **dropdown-menu.tsx** - Dropdown menus
- **context-menu.tsx** - Right-click context menus
- **menubar.tsx** - Menu bar component
- **popover.tsx** - Popover content
- **tooltip.tsx** - Hover tooltips
- **hover-card.tsx** - Hover card previews
- **dialog.tsx** - Modal dialogs
- **alert-dialog.tsx** - Confirmation dialogs
- **drawer.tsx** - Mobile-optimized drawers

#### Layout & Structure
- **separator.tsx** - Visual separators
- **aspect-ratio.tsx** - Aspect ratio containers
- **scroll-area.tsx** - Scrollable content areas
- **resizable.tsx** - Resizable panels
- **collapsible.tsx** - Collapsible content
- **command.tsx** - Command palette
- **carousel.tsx** - Image/content carousels

#### Data Visualization
- **chart.tsx** - Chart components wrapper
- **pagination.tsx** - Data pagination

#### Utility Components
- **theme-toggle.tsx** - Dark/light theme switcher
- **toggle.tsx** - Toggle button
- **toggle-group.tsx** - Toggle button groups

## Context Providers (`client/src/contexts/`)

### ThemeContext.tsx
**Purpose**: Application theme management
**Features**:
- Dark/light mode toggle
- System preference detection
- Theme persistence
- CSS variable management

## Custom Hooks (`client/src/hooks/`)

### useAuth.ts
**Purpose**: Authentication state management
**Returns**:
- `isAuthenticated: boolean`
- `isLoading: boolean`
- `user: User | null`
- `login: () => void`
- `logout: () => void`

### useToast.ts
**Purpose**: Toast notification management
**Returns**:
- `toast: (options) => void`
- `dismiss: (id) => void`

### useMobile.tsx
**Purpose**: Mobile device detection and responsive utilities
**Returns**:
- `isMobile: boolean`
- `isTablet: boolean`
- `isDesktop: boolean`

## Utility Libraries (`client/src/lib/`)

### api.ts
**Purpose**: API client configuration and request utilities
**Features**:
- Axios instance configuration
- Request/response interceptors
- Error handling
- Authentication token management

### authUtils.ts
**Purpose**: Authentication helper functions
**Functions**:
- Token validation
- User role checking
- Permission utilities

### oauthCallback.ts
**Purpose**: OAuth callback handling
**Functions**:
- Token extraction
- Redirect management
- Error handling

### performance.ts
**Purpose**: Performance monitoring and optimization
**Features**:
- Performance metrics collection
- Bundle analysis utilities
- Loading optimization

### queryClient.ts
**Purpose**: React Query configuration
**Features**:
- Query client setup
- Default query options
- Cache configuration

### sentry.ts
**Purpose**: Error tracking and monitoring
**Features**:
- Sentry SDK configuration
- Error reporting
- Performance monitoring

### utils.ts
**Purpose**: General utility functions
**Functions**:
- `cn()` - Class name merging
- `formatDate()` - Date formatting
- `generateId()` - ID generation
- `debounce()` - Function debouncing

## Component Usage Guidelines

### Importing Components
```typescript
// Page components
import Landing from '@/pages/landing';

// UI components
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

// Custom components
import { ErrorBoundary } from '@/components/ErrorBoundary';
```

### Component Props Pattern
```typescript
interface ComponentProps {
  children?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}
```

### Styling Conventions
- Use Tailwind CSS classes
- Follow BEM-like naming for custom classes
- Use CSS variables for theme-aware properties
- Implement responsive design with Tailwind breakpoints

## Testing Components

### Test File Locations
- Component tests: `client/src/components/__tests__/`
- Hook tests: `client/src/hooks/__tests__/`
- Utility tests: `client/src/lib/__tests__/`

### Testing Utilities
- **@testing-library/react** - Component testing
- **@testing-library/user-event** - User interaction simulation
- **@testing-library/jest-dom** - Custom Jest matchers

### Example Test
```typescript
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

describe('ErrorBoundary', () => {
  it('catches and displays errors', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});
```

## Performance Considerations

### Component Optimization
- Use React.memo() for expensive components
- Implement useMemo() for computed values
- Use useCallback() for event handlers
- Lazy load heavy components with React.lazy()

### Bundle Optimization
- Code splitting by route
- Dynamic imports for conditional features
- Tree shaking optimization
- Vendor chunk separation

---

**Last Updated**: August 2025
**Total Components**: 50+
**Test Coverage**: 80%+