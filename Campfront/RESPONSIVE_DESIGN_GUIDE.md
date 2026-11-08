# Responsive Design Visual Guide

## Desktop View (≥1024px)
```
┌─────────────────────────────────────────────────────────────┐
│  [Logo] CampCoordAI    [Theme] [Lang] [🔔] [Profile]       │ Header
├───────────┬─────────────────────────────────────────────────┤
│           │                                                 │
│ Sidebar   │                                                 │
│ (Always   │          Main Content Area                      │
│ Visible)  │          (with left margin)                     │
│           │                                                 │
│ Dashboard │                                                 │
│ Proposals │                                                 │
│ Events    │                                                 │
│ ...       │                                                 │
│           │                                                 │
└───────────┴─────────────────────────────────────────────────┘
     256px              Remaining Width
```

## Tablet View (640px - 1023px)
```
┌─────────────────────────────────────────────────────┐
│ [☰] [Logo] CampCoordAI    [Theme] [🔔] [Profile]  │ Header
├─────────────────────────────────────────────────────┤
│                                                     │
│         Main Content Area (Full Width)              │
│                                                     │
│  (Sidebar slides in from left when menu clicked)    │
│                                                     │
└─────────────────────────────────────────────────────┘

When Menu Clicked:
┌─────────────────────────────────────────────────────┐
│ [☰] [Logo] CampCoordAI    [Theme] [🔔] [Profile]  │
├───────────┬──────────────────────────[OVERLAY]──────┤
│           │                                         │
│ Sidebar   │    Main Content (Dimmed)               │
│ (Slide-in)│                                         │
│           │                                         │
│ Dashboard │    Click overlay or nav item to close   │
│ Proposals │                                         │
│ Events    │                                         │
└───────────┴─────────────────────────────────────────┘
```

## Mobile View (<640px)
```
┌─────────────────────────────────┐
│ [☰] [Logo] [T] [L] [🔔] [👤]  │ Header (Compact)
├─────────────────────────────────┤
│                                 │
│    Main Content (Full Width)    │
│                                 │
│  Sidebar hidden by default      │
│                                 │
└─────────────────────────────────┘

When Menu Clicked:
┌─────────────────────────────────┐
│ [☰] [Logo] [T] [L] [🔔] [👤]  │
├──────────┬──────────[OVERLAY]───┤
│          │                      │
│ Sidebar  │   Dimmed Content     │
│ (Full)   │                      │
│          │                      │
│ Dash...  │   (Tap to close)     │
│ Propo... │                      │
│ Events   │                      │
└──────────┴──────────────────────┘
```

## Component Behavior Summary

### Header
- **Desktop**: Full logo, text, all controls visible
- **Tablet**: Menu button appears, slightly compact
- **Mobile**: Menu button + compact layout, some text hidden

### Sidebar
- **Desktop**: Always visible, fixed position (256px wide)
- **Tablet**: Collapsible, slides in from left with overlay
- **Mobile**: Collapsible, slides in from left with overlay

### Main Content
- **Desktop**: Left margin of 256px (ml-64 in Tailwind)
- **Tablet**: Full width (no left margin)
- **Mobile**: Full width with smaller padding

### Overlay
- **Desktop**: Never shown
- **Tablet**: Shown when sidebar open (semi-transparent black)
- **Mobile**: Shown when sidebar open (semi-transparent black)

## Key CSS Classes Used

### Layout Component
```jsx
// Main content area
className="flex-1 p-4 sm:p-6 lg:ml-64 min-h-[calc(100vh-4rem)] w-full"
```

### Sidebar Component
```jsx
// Sidebar with responsive transform
className="fixed ... ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}"
```

### Header Component
```jsx
// Menu button (hidden on desktop)
className="lg:hidden p-2 ..."

// Logo sizing
className="w-8 h-8 sm:w-10 sm:h-10"

// Spacing adjustments
className="space-x-2 sm:space-x-3.5"
```

## Animation Details

### Sidebar Slide Animation
```css
transition-transform duration-300 ease-in-out
transform: translateX(0)      /* Open */
transform: translateX(-100%)  /* Closed on mobile */
```

### Overlay Fade
```jsx
// Appears/disappears instantly (no animation currently)
// Can be enhanced with fade-in/out if needed
```

## User Interaction Flow

### Opening Sidebar (Mobile/Tablet)
1. User clicks menu button (☰) in header
2. `toggleSidebar()` called → `setSidebarOpen(true)`
3. Sidebar transforms from `-translate-x-full` to `translate-x-0`
4. Overlay appears behind sidebar
5. Sidebar slides in smoothly (300ms)

### Closing Sidebar (Mobile/Tablet)
**Option 1 - Click Overlay:**
1. User clicks semi-transparent overlay
2. `closeSidebar()` called → `setSidebarOpen(false)`
3. Sidebar transforms to `-translate-x-full`
4. Overlay disappears
5. Sidebar slides out (300ms)

**Option 2 - Click Nav Item:**
1. User clicks any navigation link
2. `onClose()` called from NavLink
3. Navigation occurs + sidebar closes
4. Same closing animation as Option 1

**Option 3 - Menu Button (Toggle):**
1. User clicks menu button again
2. `toggleSidebar()` flips state
3. Closes with same animation

## Accessibility Features

### Keyboard Navigation
- Tab through header controls
- Enter/Space to activate menu button
- Arrow keys in navigation menu
- Escape key can close sidebar (can be added)

### Screen Readers
- Menu button has `aria-label="Toggle menu"`
- Navigation items have semantic structure
- Active state announced
- Badge counts announced

### Touch Targets
- Minimum 44x44px for all interactive elements
- Menu button: 40x40px (within acceptable range)
- Navigation items: 48px height
- Header controls: 40x40px

## Responsive Breakpoints Reference

| Breakpoint | Width    | Sidebar State | Menu Button | Content Margin |
|------------|----------|---------------|-------------|----------------|
| Mobile     | <640px   | Collapsible   | Visible     | 0              |
| Tablet     | 640-1023px| Collapsible   | Visible     | 0              |
| Desktop    | ≥1024px  | Always Open   | Hidden      | 256px (ml-64)  |

## Testing Scenarios

### ✅ Mobile Testing
1. Open app on mobile device or resize browser to <640px
2. Verify menu button is visible in header
3. Verify sidebar is hidden initially
4. Click menu button → sidebar slides in
5. Click overlay → sidebar closes
6. Click menu → open sidebar → click nav item → verify navigation + close

### ✅ Tablet Testing
1. Resize browser to 768px width
2. Verify menu button is visible
3. Verify sidebar behavior same as mobile
4. Test landscape and portrait orientations

### ✅ Desktop Testing
1. Open app on desktop or resize to ≥1024px
2. Verify menu button is NOT visible
3. Verify sidebar is always visible
4. Verify content has left margin
5. Test window resizing across breakpoint

### ✅ Cross-Browser Testing
- Chrome/Edge: Test transform animations
- Firefox: Test overlay opacity
- Safari: Test iOS touch interactions
- Mobile browsers: Test swipe behavior (future enhancement)

## Performance Notes

- CSS transforms are GPU-accelerated (performant)
- Conditional rendering minimizes DOM operations
- Tailwind CSS provides optimized class utilities
- No JavaScript animations (pure CSS transitions)
- Overlay only rendered when needed

## Common Issues & Solutions

### Issue: Sidebar overlaps content on desktop
**Solution:** Ensure `lg:ml-64` is applied to main content area

### Issue: Menu button shows on desktop
**Solution:** Verify `lg:hidden` class on menu button

### Issue: Overlay doesn't cover full screen
**Solution:** Check `fixed inset-0` classes on overlay div

### Issue: Sidebar animation is jerky
**Solution:** Ensure `transition-transform duration-300 ease-in-out` is applied

### Issue: Content shifts when sidebar opens/closes
**Solution:** Use transforms instead of width/display changes

---

**Quick Reference Card**

📱 **Mobile**: Menu button → Slide-in sidebar → Click overlay/nav to close  
💻 **Desktop**: Sidebar always visible, no menu button  
🎨 **Animation**: 300ms ease-in-out transform  
⌨️ **Accessible**: Keyboard + screen reader friendly  
⚡ **Performant**: GPU-accelerated CSS transforms
