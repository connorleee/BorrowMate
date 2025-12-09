# Design System Reorganization - Card Component Refactoring

## Objective
Reorganize BorrowMate's design system with smaller, denser cards that maximize screen real estate while maintaining usability. Create a unified card component system based on the effective design from the My Items page.

---

## Audit Results

### Current Card Patterns Identified

#### 1. **LendableItemCard** (My Items page)
- **Location**: `components/lendable-item-card.tsx`
- **Size**: `p-5` padding (20px)
- **Design**: Clean, functional, good density
- **Features**: Multi-select mode, status badges, checkbox, delete button
- **Status**: ✅ Good reference design - smaller and cleaner

#### 2. **ContactCard** (Contacts page)
- **Location**: `components/contact-card.tsx`
- **Size**: `p-4` padding (16px)
- **Design**: Clean but could be more compact
- **Features**: Delete confirmation inline, linked user badge
- **Issues**: Larger heading (`text-lg font-bold`), could be smaller

#### 3. **GroupCard** (Groups page - inline in page.tsx)
- **Location**: `app/groups/page.tsx` (lines 23-36)
- **Size**: `p-6` padding (24px) - **TOO LARGE**
- **Design**: Inconsistent with other cards
- **Issues**: Largest padding of all cards, should be smaller

#### 4. **Dashboard Cards** (Dashboard page - inline)
- **Location**: `components/dashboard-content.tsx`
- **Multiple card types**:
  - Borrowed items: `p-4` border rounded
  - Lent items (grouped by contact): Nested structure with `px-4 py-3` header, `p-4` items
  - My items preview: `p-4` border rounded
- **Issues**: Inconsistent spacing, no reusable component, mixed sizes

### Inconsistencies Found

1. **Padding variations**: `p-6` (groups), `p-5` (items), `p-4` (contacts, dashboard)
2. **Typography**: `text-xl` vs `text-lg` vs `text-base` for headings
3. **Border radius**: All use `rounded-lg` (consistent ✓)
4. **Shadows**: Mix of `shadow-sm`, no shadow, and `hover:shadow-md`
5. **No unified component**: Each page has inline card styling
6. **Grid layouts**: Inconsistent column counts across pages

### Pages Requiring Updates

- ✅ **My Items** (`app/items/page.tsx`) - Reference design, needs component extraction
- 🔄 **Contacts** (`app/contacts/page.tsx`) - Needs smaller, denser design
- 🔄 **Groups** (`app/groups/page.tsx`) - Needs SIGNIFICANTLY smaller cards (reduce from p-6)
- 🔄 **Dashboard** (`app/dashboard/page.tsx`) - Multiple card types need consolidation
- ⚠️ **Borrow** (`app/borrow/page.tsx`) - Minimal page, no cards currently

---

## Design System Plan

### New Component Architecture

Create **one unified Card component** with variants:

#### **Base Card Component**
- **File**: `components/Card.tsx`
- **Features**:
  - Consistent base styling
  - Compact by default (`p-3` or `p-4` max)
  - Supports variants for different content types
  - TypeScript typed props

#### **Card Variants**
1. **ItemCard** - For inventory items
2. **ContactCard** - For contacts
3. **GroupCard** - For groups
4. **BorrowRecordCard** - For borrow history items

### Design Specifications

#### Spacing Scale (smaller and more consistent)
- **Base padding**: `p-3` (12px) - more compact than current
- **Medium padding**: `p-4` (16px) - for content-heavy cards
- **Never exceed**: `p-4` - no more `p-5` or `p-6`

#### Typography Scale
- **Card title**: `text-base font-semibold` (16px)
- **Subtitle/metadata**: `text-sm text-gray-600` (14px)
- **Small text**: `text-xs text-gray-500` (12px)
- **No text-lg or text-xl inside cards** - keep compact

#### Grid Layouts (responsive)
- **Mobile**: 1 column (full width)
- **Tablet (md:)**: 2-3 columns
- **Desktop (lg:)**: 3-4 columns

#### Visual Style
- **Border**: `border border-gray-200` (dark mode aware via globals.css)
- **Radius**: `rounded-lg` (consistent)
- **Shadow**: None by default, `hover:shadow-md` on interactive cards
- **Background**: `bg-white` (dark mode aware)
- **Hover**: `hover:border-primary-300` for clickable cards

---

## Implementation Tasks

### Phase 1: Create Card Component System
- [ ] Create `components/Card.tsx` with base Card component
- [ ] Create ItemCard variant (based on LendableItemCard design)
- [ ] Create ContactCard variant (smaller than current)
- [ ] Create GroupCard variant (much smaller than current p-6)
- [ ] Create BorrowRecordCard variant
- [ ] Add proper TypeScript types for all variants

### Phase 2: Refactor Pages
- [ ] Refactor `app/items/page.tsx` - Use new ItemCard
- [ ] Refactor `components/my-inventory-section.tsx` - Use new ItemCard
- [ ] Refactor `components/lendable-item-card.tsx` - Replace with ItemCard or delete
- [ ] Refactor `app/groups/page.tsx` - Use new GroupCard (reduce from p-6)
- [ ] Refactor `app/contacts/page.tsx` - Use new ContactCard
- [ ] Refactor `components/contact-card.tsx` - Update or replace
- [ ] Refactor `components/dashboard-content.tsx` - Use appropriate card variants
- [ ] Update any modals using card-like layouts

### Phase 3: Consistency & Cleanup
- [ ] Verify all cards use consistent spacing (p-3 or p-4 max)
- [ ] Verify all cards use consistent typography
- [ ] Verify responsive grid layouts work on mobile, tablet, desktop
- [ ] Remove old card components if fully replaced
- [ ] Update globals.css .card utility if needed

### Phase 4: Testing & Verification
- [ ] Run `npm run dev` and test all pages
- [ ] Check mobile responsiveness (1 col)
- [ ] Check tablet responsiveness (2-3 col)
- [ ] Check desktop responsiveness (3-4 col)
- [ ] Verify all interactive elements work (buttons, links, checkboxes)
- [ ] Run `npm run lint` - ensure no errors
- [ ] Check TypeScript compilation - no errors
- [ ] Visual inspection - cards are noticeably smaller and denser

---

## Design Decisions

### Why p-3/p-4 instead of p-5/p-6?
- Current cards (especially groups with p-6) waste too much space
- p-3 (12px) and p-4 (16px) provide adequate breathing room while maximizing density
- Reference: LendableItemCard uses p-5, but we can go smaller with p-3/p-4

### Why text-base for card titles?
- Keeps cards compact and professional
- Current mix of text-xl, text-lg, and text-base is inconsistent
- text-base (16px) is readable on all devices while maintaining density

### Responsive Breakpoints
- **Mobile (default)**: 1 column - touch-friendly, easy to scan
- **Tablet (md: 768px+)**: 2-3 columns - better use of horizontal space
- **Desktop (lg: 1024px+)**: 3-4 columns - maximum information density

### Component Approach
- Single `Card.tsx` file with multiple exports for variants
- Keeps related components together
- Easier to maintain consistency
- Less file clutter

---

## Success Criteria

- ✅ All pages use new unified card system
- ✅ Cards are visibly smaller (p-3/p-4 vs old p-5/p-6)
- ✅ Typography is consistent (text-base titles, text-sm/xs metadata)
- ✅ Spacing is consistent across all card types
- ✅ Responsive grids work correctly (1/2-3/3-4 columns)
- ✅ No console errors or TypeScript issues
- ✅ All interactive features still functional
- ✅ Lint passes with no errors
- ✅ Visual polish improved - professional and consistent

---

## Review Section

*(To be completed after implementation)*

### Changes Made
- TBD

### Pages Refactored
- TBD

### Components Created
- TBD

### Components Deleted/Replaced
- TBD

### Before/After Comparison
- TBD

### Issues Encountered
- TBD

### Next Steps
- TBD
