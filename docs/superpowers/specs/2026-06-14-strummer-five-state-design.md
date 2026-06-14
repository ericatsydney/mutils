# Strummer Widget — Five-State Toggle with 1/16 Note Subdivision

**Date:** 2026-06-14
**Status:** Draft

## Overview

Add two new note states (`down&down` and `down&up`) to the strummer widget, expanding the toggle cycle from 3 to 5 states. These new states split a single 1/8 note into two evenly-spaced 1/16 notes, playing two strums in the space of one slot. Also remove the "8 × ⅛ note" label text to avoid conflict with this new behavior.

## Changes

### 1. Five-state toggle cycle

Each of the 8 note buttons cycles through five states on click: `down → up → mute → down&down → down&up → down...`

| State | Icon | Sound | Timing |
|-------|------|-------|--------|
| `down` | ▼ | Single "da" tone (~220 Hz) | 1/8 note |
| `up` | ▲ | Single "di" tone (~440 Hz) | 1/8 note |
| `mute` | — | Silent | 1/8 note (advances step) |
| `down&down` | ▼▼ | Two "da" tones | Two 1/16 notes |
| `down&up` | ▼▲ | "da" then "di" | Two 1/16 notes |

### 2. Audio timing for dual notes

Current scheduler advances in `secondsPerStep = 60.0 / tempo / 2` (1/8 note duration). For dual states:

- `scheduleNote()` detects a dual state (`down&down` or `down&up`)
- Plays first strum at `time`, second strum at `time + halfStep` where `halfStep = secondsPerStep / 2`
- Step counter and `nextNote()` unchanged — the slot still consumes one step

Sound synthesis: first strum uses `playStrum("down", time)`; second strum uses `playStrum("down", time + halfStep)` for `down&down` or `playStrum("up", time + halfStep)` for `down&up`.

### 3. Status display

- Single notes: unchanged — `Beat 2 — note 1/8 · da`
- `down&down`: `Beat 2 — note 1/8 · da da`
- `down&up`: `Beat 2 — note 1/8 · da di`

### 4. Label simplification

Change HTML label from:
```html
<p class="strum-grid-label">Strum pattern &mdash; 8 &times; &#8539; note</p>
```
To:
```html
<p class="strum-grid-label">Strum pattern</p>
```

### 5. CSS — New visual states

**`[data-strum="down&down"]`**: Same amber/gold gradient as `down`, plus an inner border ring (`inset 0 0 0 2px rgba(242, 198, 109, 0.4)`) indicating "two strikes". Active glow matches `down` active style.

**`[data-strum="down&up"]`**: Amber/gold base gradient, plus a teal left-edge accent (`border-left: 3px solid rgba(114, 244, 209, 0.4)`) indicating the upstroke second half. Active glow matches `down` active style.

Both states use the amber text color (`#ffe8b2`).

### 6. Pattern persistence

- `localStorage` key `strummer-pattern` now stores arrays with values `"down"`, `"up"`, `"mute"`, `"down&down"`, or `"down&up"`
- Existing persisted patterns (down/up/mute only) continue to load correctly
- Default pattern unchanged: `["down","down","up","up","down","up","down","up"]`

### 7. Tests

Update `tests/strummer.test.js` toggle cycle test to verify all 5 states:
- Click 1: up
- Click 2: mute
- Click 3: down&down
- Click 4: down&up
- Click 5: back to down

Verify icons (▼▲—▼▼▼▲) and dataset values at each step.

## Files affected

| File | Change |
|------|--------|
| `components/main.html` | Simplify `strum-grid-label` text |
| `assets/js/strummer.js` | 5-state toggle, dual-sound scheduling in `scheduleNote`, status building for dual states |
| `assets/css/strummer.css` | Add `[data-strum="down&down"]` and `[data-strum="down&up"]` rules |
| `tests/strummer.test.js` | Extend toggle test to 5-state cycle |

## Non-goals

- No changes to metronome tempo sync (already reads from `#metronome-rpm`)
- No changes to audio synthesis (same oscillator types, same `playStrum` function)
- No changes to play/stop UI or keyboard shortcuts
- No changes to the 8-slot grid structure
