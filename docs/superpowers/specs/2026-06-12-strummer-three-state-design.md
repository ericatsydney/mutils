# Strummer Widget Redesign — Three-State Toggle & Metronome Sync

**Date:** 2026-06-12
**Status:** Draft

## Overview

The strummer widget currently has only up/down toggle per note (8-note pattern) with its own independent BPM control and numbered labels below each note button. This redesign adds a third "mute" state, synchronizes tempo with the metronome widget, and removes the number labels.

## Changes

### 1. Three-state toggle cycle

Each of the 8 note buttons cycles through three states on click: `down ? up ? mute ? down...`

| State | Visual | Sound |
|-------|--------|-------|
| `down` | Warm amber/gold gradient (existing) | "da" tone (~220 Hz) |
| `up` | Cool teal/blue gradient (existing) | "di" tone (~440 Hz) |
| `mute` | Faded ghost — dimmed background, reduced opacity, em-dash icon | Silent (skip `playStrum`) |

The mute state still advances the step counter — it just produces no sound and shows a muted visual.

### 2. Tempo sync with metronome

- Remove the strummer's own BPM `<input>` and label row from the HTML
- Strummer reads tempo from the metronome's RPM input (`document.getElementById('metronome-rpm').value`)
- When the metronome changes tempo (via direct input, tap tempo, or programmatic `setBpm`), the strummer automatically follows
- Strummer start reads the metronome's current RPM as its starting tempo

### 3. Remove number labels

- Remove all `<span class="strum-note-label">` elements (1–8) from the HTML
- Remove `.strum-note-label` CSS rules
- Clean up `gap` on `.strum-note` since no element sits below the button

### 4. Mute visual style

New CSS rule for `data-strum="mute"`:
- Background: near-transparent white (rgba 0.03)
- Border: very dim (rgba 0.08)
- Text color: faint white (rgba 0.2)
- No box shadow

### 5. Pattern persistence

- localStorage key `strummer-pattern` now stores arrays with values `"up"`, `"down"`, or `"mute"`
- Existing persisted patterns (up/down only) continue to load correctly
- Default pattern unchanged: `["down","down","up","up","down","up","down","up"]`

## Files affected

| File | Change |
|------|--------|
| `components/main.html` | Remove BPM input row, remove 1-8 label spans |
| `assets/css/strummer.css` | Remove `.strum-note-label`, `.strum-bpm-row` rules; add `[data-strum="mute"]` style |
| `assets/js/strummer.js` | Three-state toggle logic, read tempo from metronome RPM, skip sound on mute |

## Non-goals

- No changes to metronome widget behavior
- No changes to audio synthesis (same oscillator types)
- No changes to the play/stop UI or keyboard shortcut
