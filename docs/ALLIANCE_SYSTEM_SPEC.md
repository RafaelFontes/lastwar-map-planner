# Alliance System Specification

## Overview

This document specifies the alliance-based tile claiming system for the Last War Map application. The system introduces alliances, daily timelines, move restrictions, and a planning mode.

---

## 1. Alliances

### 1.1 Alliance Creation & Assignment

- When a logged-in user first uses the app, they must set an **alliance name**
- Alliance names are **case-insensitive** for matching (e.g., "ABC" and "abc" are the same alliance)
- No restrictions on alliance name format (any characters, any length)
- If the alliance name doesn't exist, a new alliance is created and assigned the next available color from the palette
- **Once set, a user cannot change their alliance** - it's permanent
- Multiple users can belong to the same alliance (by entering the same name)
- Users in the same alliance share:
  - The same color
  - The same tile ownership
  - The same move limitations

### 1.2 Alliance Colors

The system has a predefined palette of **20 distinguishable colors** that match the Discord-style dark theme:

```javascript
const ALLIANCE_COLORS = [
  '#E74C3C', // Red
  '#3498DB', // Blue
  '#2ECC71', // Green
  '#F39C12', // Orange
  '#9B59B6', // Purple
  '#1ABC9C', // Teal
  '#E91E63', // Pink
  '#00BCD4', // Cyan
  '#FF5722', // Deep Orange
  '#8BC34A', // Light Green
  '#673AB7', // Deep Purple
  '#FFC107', // Amber
  '#795548', // Brown
  '#607D8B', // Blue Grey
  '#CDDC39', // Lime
  '#FF9800', // Orange (alt)
  '#03A9F4', // Light Blue
  '#4CAF50', // Green (alt)
  '#F44336', // Red (alt)
  '#00E676', // Bright Green
];
```

- Colors are assigned in order as new alliances are created
- Once assigned, an alliance's color never changes

---

## 2. Tile Numbers

### 2.1 Pre-defined Tile Numbers

- Each tile on the map has a **pre-defined number** (stored in Supabase `tiles` table)
- Tile numbers are **read-only** - users cannot change them
- Multiple tiles can share the same number (e.g., many tiles with number "1")
- The tile number determines claiming rules (see section 4)

### 2.2 Data Structure

From Supabase `tiles` table:
```json
{
  "id": 107,
  "tile_id": 60,
  "number": "1",
  "name": null,
  "icon": null,
  "color": "#f8f9fa",
  "comments": null,
  "label_offset_x": -5.39247,
  "label_offset_y": -7.18996,
  "updated_by": null,
  "updated_at": "2025-11-27T10:36:46.637+00:00"
}
```

- `tile_id`: References the geometry tile (0-86)
- `number`: The tile's pre-defined number (read-only)

---

## 3. Timeline System

### 3.1 Day Structure

- The timeline is based on **days**
- Day 1 was the starting day
- **Current day: Day 11** (as of spec creation)
- **New day starts at 2:00 AM UTC**

### 3.2 Day Calculation

```javascript
function getCurrentDay() {
  const START_DATE = new Date('2025-11-17T02:00:00Z'); // Day 1 start
  const now = new Date();
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((now - START_DATE) / msPerDay) + 1;
}
```

### 3.3 Time Travel (Historical View)

- Users can navigate to any past day (Day 1 to current day)
- When viewing a past day:
  - Map shows the exact state at the **end of that day**
  - All editing is disabled
  - Users can only observe
- When viewing the current day:
  - Users can select/clear tiles (subject to rules)

---

## 4. Tile Claiming Rules

### 4.1 Tile Limit

- Each alliance can own **maximum 6 tiles** at any given time
- **Exception**: Tiles with number "7" do not count toward this limit
  - An alliance with a #7 tile can have 6 regular tiles + the #7 tile

### 4.2 Number Progression Rules

- **Alliance with no tiles**: Can only select tiles with number "1"
- **Alliance with tiles**: Must follow number progression:
  - To claim a tile with number N, the alliance must already own at least one tile with number (N-1)
  - Example: To claim a #3 tile, must own at least one #2 tile
  - Example: To claim a #2 tile, must own at least one #1 tile
- **Multiple tiles of same number allowed**:
  - Can have 2x #1, 3x #2, 1x #3, etc.
  - As long as progression rule is satisfied

### 4.3 Adjacency Rules

- **Alliance with no tiles**: Can select any #1 tile on the map
- **Alliance with tiles**: New tile must be **physically adjacent** to an existing alliance tile
  - Adjacent = tile polygons share a border (touching)
  - Cannot claim isolated tiles

### 4.4 Clearing Rules

- Users can clear their alliance's tiles **without restrictions**
- Clearing is **unlimited** (no move cost)
- If all tiles are cleared, alliance reverts to "no tiles" state:
  - Must start again with a #1 tile

### 4.5 Illegal Move Feedback

- When a user attempts an illegal selection:
  - Visual shake/flash effect on the tile
  - Brief error message explaining why (e.g., "Must select adjacent tile", "Need a #2 tile first")

---

## 5. Move System

### 5.1 Daily Moves

- Each alliance has **3 moves per day**
- A "move" is defined as **selecting (claiming) a tile**
- Clearing tiles does **not** cost moves (unlimited clears)
- Moves reset at 2:00 AM UTC (new day)

### 5.2 Move Tracking

- Track moves per alliance per day
- All users in an alliance share the same move pool
- Display remaining moves in the UI

### 5.3 Undo System

- Users can **undo their own moves** from the current day
- Undo restores the move (move count goes back up)
- Undo is available for both:
  - Selections (claiming tiles)
  - Clears (un-clearing tiles)
- Users can only undo **their own actions**, not other alliance members'
- Undo history is per-user, per-day

---

## 6. Planner Mode

### 6.1 Overview

- A separate mode where users can freely experiment with tile arrangements
- Changes in planner mode are **local only** - not saved to the database
- Does not affect the real map state

### 6.2 Planner Capabilities

- Start from the **current day's map state**
- Move **any alliance's tiles** (not just own)
- No move limits
- No adjacency/number restrictions
- Full freedom to experiment

### 6.3 Saving & Sharing Plans

- Plans are encoded in the URL as query parameters
- When loading a shared plan URL:
  - User sees a prompt: "View Only" or "Save a Copy"
  - "View Only": Just displays the plan
  - "Save a Copy": Saves to user's local storage for later editing

### 6.4 Plan Data Structure

```javascript
{
  baseDay: 11, // The day this plan was created from
  changes: [
    { tileId: 5, alliance: 'ABC', action: 'claim' },
    { tileId: 12, alliance: 'XYZ', action: 'clear' },
    // ...
  ]
}
```

- Encode as base64 in URL: `?plan=eyJiYXNlRGF5Ijo...`

---

## 7. Admin Mode

### 7.1 Admin User

- Admin is identified by **Discord username**
- Configurable via environment variable: `VITE_ADMIN_DISCORD_USERNAME`
- Default: `rafa.br`

### 7.2 Admin Capabilities

- Bypass all restrictions:
  - No move limits
  - No adjacency rules
  - No number progression rules
  - Can edit any alliance's tiles
  - Can edit on any day (including past days)
- Full control over the map

### 7.3 Admin Build

- **Separate build command**: `npm run build:admin`
- Sets `VITE_ADMIN_MODE=true` at build time
- Admin features are **compiled out** of the regular production build
- This prevents JavaScript manipulation to gain admin access
- The admin build should only be deployed to a secure/private URL

### 7.4 Build Configuration

```json
// package.json
{
  "scripts": {
    "build": "vite build",
    "build:admin": "VITE_ADMIN_MODE=true vite build"
  }
}
```

```javascript
// In code
const isAdminBuild = import.meta.env.VITE_ADMIN_MODE === 'true';
const isAdminUser = user?.username === import.meta.env.VITE_ADMIN_DISCORD_USERNAME;
const hasAdminAccess = isAdminBuild && isAdminUser;
```

---

## 8. Database Schema Changes

### 8.1 New Tables

#### `alliances`
```sql
CREATE TABLE alliances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_lowercase TEXT NOT NULL UNIQUE, -- For case-insensitive matching
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alliances_name_lowercase ON alliances(name_lowercase);
```

#### `user_alliances`
```sql
CREATE TABLE user_alliances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  alliance_id UUID NOT NULL REFERENCES alliances(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id) -- User can only have one alliance
);
```

#### `tile_claims`
```sql
CREATE TABLE tile_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tile_id INTEGER NOT NULL, -- References geometry tile
  alliance_id UUID NOT NULL REFERENCES alliances(id),
  day INTEGER NOT NULL,
  claimed_by UUID REFERENCES auth.users(id),
  claimed_at TIMESTAMPTZ DEFAULT NOW(),
  cleared_at TIMESTAMPTZ, -- NULL if still claimed
  cleared_by UUID REFERENCES auth.users(id),
  UNIQUE(tile_id, day, claimed_at) -- Allow multiple claims/clears per day
);

CREATE INDEX idx_tile_claims_day ON tile_claims(day);
CREATE INDEX idx_tile_claims_alliance ON tile_claims(alliance_id);
```

#### `daily_moves`
```sql
CREATE TABLE daily_moves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alliance_id UUID NOT NULL REFERENCES alliances(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  day INTEGER NOT NULL,
  tile_id INTEGER NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('claim', 'clear')),
  performed_at TIMESTAMPTZ DEFAULT NOW(),
  undone_at TIMESTAMPTZ, -- NULL if not undone
  UNIQUE(alliance_id, day, tile_id, performed_at)
);

CREATE INDEX idx_daily_moves_alliance_day ON daily_moves(alliance_id, day);
CREATE INDEX idx_daily_moves_user_day ON daily_moves(user_id, day);
```

### 8.2 Migration Strategy

1. Create new tables
2. Migrate existing `tiles` data to `tile_claims` for day 11
3. Keep `tiles` table for tile numbers/geometry reference

---

## 9. UI Components

### 9.1 Alliance Setup Modal

- Shown on first login (if user has no alliance)
- Input field for alliance name
- "Join Alliance" button
- Shows assigned color after joining

### 9.2 Timeline Controls

- Day selector/slider in header
- Shows current day prominently
- Previous/Next day buttons
- "Today" button to jump to current day
- Time remaining until next day

### 9.3 Move Counter

- Display: "Moves: 2/3 remaining"
- Shows in sidebar when viewing current day
- Hidden when viewing past days

### 9.4 Undo Panel

- List of user's actions today
- "Undo" button next to each action
- Shows action type and tile

### 9.5 Planner Toggle

- Button to enter/exit planner mode
- Visual indicator when in planner mode
- Share plan button
- Reset plan button

### 9.6 Tile Selection Feedback

- Valid selection: Smooth claim animation
- Invalid selection: Shake animation + error toast

### 9.7 Tile Colors

- **Tile color = Alliance color**
- When an alliance claims a tile, the tile is filled with that alliance's color
- Users cannot manually set tile colors
- Unclaimed tiles use the default background color (#f8f9fa)

### 9.8 Labeled Tiles List (TileList)

The labeled tiles table shows:
| Number | Alliance |
|--------|----------|
| 1      | ABC      |
| 1      | XYZ      |
| 2      | ABC      |
| ...    | ...      |

- **Number**: The pre-defined tile number
- **Alliance**: The name of the alliance that owns the tile
- Sorted by tile number
- Filterable by number or alliance name
- Clicking a row selects that tile on the map

---

## 10. Implementation Phases

### Phase 1: Foundation
1. Add tile numbers to geometry (from Supabase)
2. Create alliance database tables
3. Implement alliance creation/joining
4. Add user-alliance association

### Phase 2: Timeline
5. Implement day calculation
6. Create tile_claims table
7. Migrate existing data to day 11
8. Add timeline UI controls
9. Implement historical view

### Phase 3: Rules Engine
10. Implement adjacency detection
11. Implement number progression validation
12. Implement tile limit checking
13. Add move tracking
14. Implement undo system

### Phase 4: UI Polish
15. Add illegal move feedback
16. Style alliance colors on map
17. Add move counter
18. Add undo panel

### Phase 5: Planner
19. Implement planner mode state
20. Add URL encoding/decoding for plans
21. Add share/load plan functionality

### Phase 6: Admin
22. Add admin build configuration
23. Implement admin bypass logic
24. Test admin vs regular builds

---

## 11. Edge Cases

### 11.1 Concurrent Users

- If two users from same alliance try to claim at same time:
  - First one succeeds
  - Second gets "Move already used" error
- Use database transactions for atomic operations

### 11.2 Alliance With All #7 Tiles

- Theoretically possible to have 6+ tiles if all are #7
- Edge case, but allowed by rules

### 11.3 Clearing Creates Invalid State

- User clears #1 tile, but alliance has #2 and #3 tiles
- This is **allowed** - clearing has no restrictions
- Alliance cannot claim new tiles until they have proper progression again

### 11.4 Day Rollover During Action

- User starts action at 1:59 AM, completes at 2:01 AM
- Use server timestamp for day calculation
- Action goes to the day when it was **completed**

---

## 12. API Endpoints (Supabase RPC Functions)

### `join_alliance(alliance_name TEXT)`
- Creates alliance if needed
- Associates user with alliance
- Returns alliance info with color

### `claim_tile(tile_id INTEGER)`
- Validates all rules
- Records claim
- Returns success/error

### `clear_tile(tile_id INTEGER)`
- Validates ownership
- Records clear
- Returns success/error

### `undo_action(action_id UUID)`
- Validates user owns action
- Reverts action
- Returns success/error

### `get_map_state(day INTEGER)`
- Returns all tile claims for given day
- Includes alliance colors

### `get_alliance_moves(day INTEGER)`
- Returns remaining moves for user's alliance
- Returns list of actions (for undo)

---

## 13. Environment Variables

```env
# Admin Configuration
VITE_ADMIN_DISCORD_USERNAME=rafa.br
VITE_ADMIN_MODE=false  # Set to true in admin build

# Timeline Configuration
VITE_SEASON_START_DATE=2025-11-17T02:00:00Z
VITE_DAY_ROLLOVER_HOUR=2  # 2 AM UTC
```

---

## Appendix A: Color Palette Preview

| Index | Color | Hex | Name |
|-------|-------|-----|------|
| 0 | ![#E74C3C](https://via.placeholder.com/15/E74C3C/E74C3C) | #E74C3C | Red |
| 1 | ![#3498DB](https://via.placeholder.com/15/3498DB/3498DB) | #3498DB | Blue |
| 2 | ![#2ECC71](https://via.placeholder.com/15/2ECC71/2ECC71) | #2ECC71 | Green |
| 3 | ![#F39C12](https://via.placeholder.com/15/F39C12/F39C12) | #F39C12 | Orange |
| 4 | ![#9B59B6](https://via.placeholder.com/15/9B59B6/9B59B6) | #9B59B6 | Purple |
| 5 | ![#1ABC9C](https://via.placeholder.com/15/1ABC9C/1ABC9C) | #1ABC9C | Teal |
| 6 | ![#E91E63](https://via.placeholder.com/15/E91E63/E91E63) | #E91E63 | Pink |
| 7 | ![#00BCD4](https://via.placeholder.com/15/00BCD4/00BCD4) | #00BCD4 | Cyan |
| 8 | ![#FF5722](https://via.placeholder.com/15/FF5722/FF5722) | #FF5722 | Deep Orange |
| 9 | ![#8BC34A](https://via.placeholder.com/15/8BC34A/8BC34A) | #8BC34A | Light Green |
| 10 | ![#673AB7](https://via.placeholder.com/15/673AB7/673AB7) | #673AB7 | Deep Purple |
| 11 | ![#FFC107](https://via.placeholder.com/15/FFC107/FFC107) | #FFC107 | Amber |
| 12 | ![#795548](https://via.placeholder.com/15/795548/795548) | #795548 | Brown |
| 13 | ![#607D8B](https://via.placeholder.com/15/607D8B/607D8B) | #607D8B | Blue Grey |
| 14 | ![#CDDC39](https://via.placeholder.com/15/CDDC39/CDDC39) | #CDDC39 | Lime |
| 15 | ![#FF9800](https://via.placeholder.com/15/FF9800/FF9800) | #FF9800 | Orange Alt |
| 16 | ![#03A9F4](https://via.placeholder.com/15/03A9F4/03A9F4) | #03A9F4 | Light Blue |
| 17 | ![#4CAF50](https://via.placeholder.com/15/4CAF50/4CAF50) | #4CAF50 | Green Alt |
| 18 | ![#F44336](https://via.placeholder.com/15/F44336/F44336) | #F44336 | Red Alt |
| 19 | ![#00E676](https://via.placeholder.com/15/00E676/00E676) | #00E676 | Bright Green |

---

*Document Version: 1.0*
*Created: 2025-11-27*
*Last Updated: 2025-11-27*
