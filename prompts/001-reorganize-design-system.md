<objective>
Reorganize BorrowMate's design system to be consistent across all pages with smaller, denser cards that maximize screen real estate while maintaining usability. Currently, the My Items page has an effective card design that works well at a smaller scale. This prompt requires you to:

1. Audit the current design patterns across all pages (identify inconsistencies, card sizes, spacing, component variations)
2. Extract and refine the card design into a reusable, composable component system
3. Systematically apply the smaller card design across the entire app (all pages, modals, lists)
4. Ensure visual and behavioral consistency throughout

This is a foundational refactoring that will improve the app's professional polish and usability.
</objective>

<context>
**Project**: BorrowMate - A contact-centric item lending app built with Next.js 16, React 19, TypeScript, and Tailwind CSS v4.

**Tech Stack**:
- Next.js 16 (App Router) with Server Components and Server Actions
- React 19 with Client Components for interactive UI
- Tailwind CSS v4 (uses @tailwindcss/postcss)
- Supabase PostgreSQL with RLS

**Current State**:
- My Items page has effective card design that works well
- Other pages (groups, contacts, borrow history, etc.) may have inconsistent card styling, spacing, and sizing
- No unified card component system exists

**Relevant Files to Examine**:
- @app/items/page.tsx - Current My Items implementation (card reference design)
- @app/ - All page files to audit for inconsistent designs
- @components/ - Existing components (identify all card-like components)
- @globals.css - Color scheme and styling conventions
- @tailwind.config.ts - Tailwind configuration (if exists)

**Design Philosophy**:
- Minimize visual clutter while maximizing information density
- Touch-friendly on mobile (adequate tap targets)
- Responsive design (mobile-first, with md: breakpoints)
- Consistent badge colors: green (success/available), red (error/unavailable), yellow (warning/pending), blue (primary), gray (secondary)
</context>

<requirements>
**Audit Phase**:
1. Identify all card-like UI patterns across the app (inventory items, groups, contacts, borrow records, etc.)
2. Document current sizing, spacing, padding, typography on each card type
3. List inconsistencies (e.g., different card heights, padding, border styles across pages)
4. Identify pages or sections with no card component (using raw divs, inconsistent styling)

**Design System Creation**:
1. Create a reusable `Card` component that supports:
   - Compact size (small cards, higher density - optimal for lists)
   - Standard variations (actions buttons, hover states, interactive elements)
   - Consistent padding, border radius, shadows using Tailwind
2. Create specialized card variants:
   - `ItemCard` (for inventory items - should be notably smaller than current)
   - `ContactCard` (for contacts list)
   - `GroupCard` (for groups)
   - `BorrowCard` (for borrow records/history)
3. Ensure cards are responsive:
   - Mobile: 2 columns (or 1 if content-heavy)
   - Tablet (md:): 3-4 columns
   - Desktop (lg:+): 4-5 columns for appropriate density
4. Maintain readability: Don't sacrifice clarity for density. Claude should optimize based on content type.

**Implementation Phase**:
1. Replace all ad-hoc card styling with the new component system
2. Apply the new smaller card design to every page:
   - Dashboard/My Items
   - Groups page
   - Contacts/lending history
   - Borrow records
   - Any modals or overlays with card-like elements
3. Ensure consistent spacing (gaps between cards, padding within cards)
4. Verify all interactive elements (buttons, links, inputs) are properly sized and accessible

**Consistency Checks**:
- All cards use consistent border styles, shadows, and hover states
- Typography is consistent across card types (headings, body text, metadata)
- Color usage follows the scheme (badges, status indicators)
- Spacing follows a consistent scale (multiples of 4px or your chosen base unit)
</requirements>

<implementation>
**Component Structure**:
Create new file `components/Card.tsx` with:
- Base `Card` component (wrapper with consistent styling)
- Optional variants: `ItemCard`, `ContactCard`, `GroupCard`, `BorrowCard`
- Each variant should accept children, action buttons, status badges, and metadata
- Use TypeScript for proper typing

**Styling Approach**:
- Use Tailwind CSS utility classes (no CSS modules unless absolutely necessary)
- Apply consistent padding, rounded corners, shadows from a unified palette
- Define card sizes clearly: "compact" (smaller) vs "standard" (larger)
- Use Tailwind's responsive classes (sm:, md:, lg:) for responsive grids

**File Modifications**:
- Create `components/Card.tsx` (new component library)
- Update `app/items/page.tsx` to use new Card system
- Update all other page files to use new Card components
- Delete or consolidate redundant card-like components if they exist

**Why This Approach**:
- Centralized component = easier to maintain consistency
- Reusable across all pages = less code duplication
- TypeScript = fewer bugs, better autocomplete
- Tailwind = no additional CSS files, faster to iterate

**Avoid**:
- Don't over-engineer: The card component should be simple and focused
- Don't create 10+ variants: Stick to 3-5 core card types
- Don't hardcode sizes: Use Tailwind classes for flexibility
- Don't break existing functionality: Preserve all features (buttons, links, modal interactions)
</implementation>

<output>
After completing the refactoring:

1. **New Component File**:
   - `components/Card.tsx` - Reusable card component with variants

2. **Modified Page Files** (update to use new Card components):
   - `app/items/page.tsx`
   - `app/groups/page.tsx`
   - Any other pages with card-like elements
   - Any modals with card layouts

3. **Verification Checklist**:
   - All pages render correctly with new card design
   - Cards are visibly smaller and denser than before
   - Responsive grid layout works on mobile, tablet, desktop
   - All interactive elements (buttons, links) are functional
   - No console errors or TypeScript issues

Save a summary to `tasks/todo.md` documenting:
- Which pages were audited
- What card components were created
- Which pages were refactored
- Any design decisions made (spacing, sizing, responsive breakpoints)
</output>

<verification>
Before declaring complete, verify your work:

1. **Visual Inspection**:
   - Run `npm run dev` and navigate through all pages
   - Confirm cards are noticeably smaller and denser than before
   - Check that spacing is consistent across all pages
   - Verify responsive behavior (check mobile, tablet, desktop sizes)

2. **Functional Testing**:
   - All links, buttons, and interactive elements work
   - Modals and overlays render correctly with new card styling
   - No broken layout or text overflow issues

3. **Code Quality**:
   - Run `npm run lint` - no ESLint errors
   - TypeScript compiles without errors
   - No unused imports or dead code

4. **Consistency Check**:
   - All card types follow the same visual language (colors, shadows, borders, padding)
   - Card component is truly reusable and not page-specific
   - No hardcoded styles outside the Card component

Success means: All pages use the new card design, cards are smaller and denser while remaining readable, and the design is visually consistent across the entire app.
</verification>

<success_criteria>
- ✓ Audit completed: Document all current card patterns and inconsistencies
- ✓ Card component created: Reusable, typed, with sensible variants
- ✓ All pages refactored: Every page uses the new card system
- ✓ Design consistent: Colors, spacing, typography, sizing match across the app
- ✓ Responsive: Cards display correctly on mobile (2 col), tablet (3-4 col), desktop (4-5 col)
- ✓ Readable: Information density improved without sacrificing usability
- ✓ No regressions: All features functional, no console errors, lint passes
- ✓ Documentation: Summary added to tasks/todo.md with changes made
</success_criteria>
