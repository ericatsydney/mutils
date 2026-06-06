# Mutils

A small music utility page for guitar and songwriting workflows.

## What this page is about

This project is a lightweight page shell for music-focused widgets. It currently includes a metronome module designed for practice and tempo discovery.

## Current functionality

- **Metronome widget**
  - RPM/BPM input with range validation (30–300)
  - Start / Stop controls
  - Mute toggle
  - Fixed 4/4 beat display with accented downbeat
  - Tap tempo button for matching a song's tempo
  - Persistent RPM and mute state via `localStorage`

## How to start locally

1. Open a terminal in the project root.
2. Run a simple local server from the repo directory:

```bash
python -m http.server 8000
```

3. Open your browser and visit:

```text
http://localhost:8000
```

## How to run tests

### CLI smoke test (recommended)

Run tests directly from the terminal without needing a server:

```bash
node tests/run-test.js
```

This checks:
- HTML markup structure and required elements
- CSS styles for the widget
- JavaScript implementation and functions
- Test infrastructure files
- Documentation completeness

### Browser smoke test (interactive)

Alternatively, run tests in the browser:

1. Start the local server if it is not already running.
2. Visit:

```text
http://localhost:8000/tests/metronome-smoke.html
```

3. The page will automatically run the smoke tests and display a pass/fail summary.

## Files of note

- `index.html` — main page shell with component placeholders
- `components/main.html` — main content and metronome widget markup
- `assets/css/metronome.css` — metronome widget styles
- `assets/js/metronome.js` — metronome behavior and scheduling logic
- `tests/metronome-smoke.html` — smoke test harness page
- `tests/metronome.test.js` — automated smoke test script
