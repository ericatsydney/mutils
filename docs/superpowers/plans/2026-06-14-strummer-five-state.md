# Strummer 5-State Toggle — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand strummer note buttons from 3-state (down/up/mute) to 5-state (down/up/mute/down&down/down&up) with 1/16 note subdivision and simplified label.

**Architecture:** Pure frontend change across 4 files. JS toggle logic grows from 3 to 5 states with a lookup table. `scheduleNote()` branches for dual states to fire two strums at half-step offsets. CSS adds two new `[data-strum]` rules. Tests extend from 3-click to 5-click cycle verification.

**Tech Stack:** Vanilla JS, CSS, HTML. No new dependencies.

---

### Task 1: Simplify grid label in HTML

**Files:**
- Modify: `components/main.html`

- [ ] **Step 1: Change the label text**

In `components/main.html`, find the `<p class="strum-grid-label">` element and change it from:

```html
<p class="strum-grid-label">Strum pattern &mdash; 8 &times; &#8539; note</p>
```

To:

```html
<p class="strum-grid-label">Strum pattern</p>
```

- [ ] **Step 2: Verify in browser**

Serve the site (`python -m http.server 8000 --directory C:\Users\ericg\code\mutils`), open `http://localhost:8000/`, confirm the label reads "Strum pattern" with no note fraction.

- [ ] **Step 3: Commit**

```bash
git add components/main.html
git commit -m "feat: simplify strummer grid label text"
```

---

### Task 2: Update toggle cycle to 5 states in JS

**Files:**
- Modify: `assets/js/strummer.js`

- [ ] **Step 1: Add the 5-state lookup in the click handler**

In the note button click handler (inside `bindAndInit`), replace the current 3-way toggle:

```js
// Current (3-state):
if(cur === "down") next = "up";
else if(cur === "up") next = "mute";
else next = "down";
```

With a 5-state lookup table:

```js
// 5-state toggle: down → up → mute → down&down → down&up → down...
var nextLookup = { down: "up", up: "mute", mute: "down&down", "down&down": "down&up", "down&up": "down" };
var next = nextLookup[cur] || "down";
```

- [ ] **Step 2: Update icon assignment for the 5 states**

Replace the icon assignment lines:

```js
// Current:
if(next === "up") this.textContent = "\u25B2";
else if(next === "down") this.textContent = "\u25BC";
else this.textContent = "\u2014";
```

With:

```js
// 5-state icons:
var iconLookup = { down: "\u25BC", up: "\u25B2", mute: "\u2014", "down&down": "\u25BC\u25BC", "down&up": "\u25BC\u25B2" };
this.textContent = iconLookup[next] || "\u25BC";
```

- [ ] **Step 3: Update the saved-pattern restore block to include new states**

The saved-pattern restore block already handles arbitrary strings via `arr.forEach((dir, i) => {...})`. But the icon assignment there still uses the old 3-way. Update it to use the same icon lookup:

Find the block:

```js
if(dir === "up") noteBtns[i].textContent = "\u25B2";
else if(dir === "down") noteBtns[i].textContent = "\u25BC";
else noteBtns[i].textContent = "\u2014";
```

Replace with:

```js
var iconLookup = { down: "\u25BC", up: "\u25B2", mute: "\u2014", "down&down": "\u25BC\u25BC", "down&up": "\u25BC\u25B2" };
noteBtns[i].textContent = iconLookup[dir] || "\u25BC";
```

- [ ] **Step 4: Update the init block that sets initial button text**

Same pattern — find the initialization loop:

```js
if(dir === "up") btn.textContent = "\u25B2";
else if(dir === "down") btn.textContent = "\u25BC";
else btn.textContent = "\u2014";
```

Replace with:

```js
var iconLookupInit = { down: "\u25BC", up: "\u25B2", mute: "\u2014", "down&down": "\u25BC\u25BC", "down&up": "\u25BC\u25B2" };
btn.textContent = iconLookupInit[dir] || "\u25BC";
```

- [ ] **Step 5: Commit**

```bash
git add assets/js/strummer.js
git commit -m "feat: expand strummer toggle to 5-state cycle"
```

---

### Task 3: Dual-note audio scheduling (1/16 subdivision)

**Files:**
- Modify: `assets/js/strummer.js`

- [ ] **Step 1: Add dual-state detection in `scheduleNote()`**

In `scheduleNote()`, after getting the direction and before calling `playStrum`, add a branch for dual states. Replace the current body:

```js
function scheduleNote(stepIndex, time){
  const dir = noteBtns[stepIndex]?.dataset.strum || "down";
  if(dir !== "mute"){
    playStrum(dir, time);
  }
  window.requestAnimationFrame(() => highlightStep(stepIndex));
}
```

With:

```js
function scheduleNote(stepIndex, time){
  const dir = noteBtns[stepIndex]?.dataset.strum || "down";
  if(dir === "down&down"){
    playStrum("down", time);
    playStrum("down", time + (60.0 / tempo / 4));  // half of 1/8 note = 1/16
  } else if(dir === "down&up"){
    playStrum("down", time);
    playStrum("up", time + (60.0 / tempo / 4));
  } else if(dir !== "mute"){
    playStrum(dir, time);
  }
  window.requestAnimationFrame(() => highlightStep(stepIndex));
}
```

**Note:** `secondsPerStep = 60.0 / tempo / 2` is a local variable in `nextNote()`. We compute `60.0 / tempo / 4` (half of that) directly in `scheduleNote` to avoid hoisting/closures. This is safe because `tempo` is a module-level variable that stays in sync.

- [ ] **Step 2: Update status display for dual notes**

In the `scheduler()` function, find the status assembly:

```js
const s = noteBtns[currentStep]?.dataset.strum;
const sound = s === "up" ? "di" : s === "down" ? "da" : "\u2014";
statusEl.textContent = `Beat ${beatNum} \u2014 note ${eighth}/8 \u00B7 ${sound}`;
```

Replace with:

```js
const s = noteBtns[currentStep]?.dataset.strum;
var sound;
if(s === "up") sound = "di";
else if(s === "down") sound = "da";
else if(s === "down&down") sound = "da da";
else if(s === "down&up") sound = "da di";
else sound = "\u2014";
statusEl.textContent = `Beat ${beatNum} \u2014 note ${eighth}/8 \u00B7 ${sound}`;
```

- [ ] **Step 3: Smoke test — start strummer, click a note to dual state, verify it plays two sounds**

Use `tests/strummer-smoke.html` or open the main page. Set a note to `down&down` or `down&up`, hit Start, and listen for the double strum in one slot.

- [ ] **Step 4: Commit**

```bash
git add assets/js/strummer.js
git commit -m "feat: add 1/16 note dual-sound scheduling for down&down and down&up"
```

---

### Task 4: CSS for new states

**Files:**
- Modify: `assets/css/strummer.css`

- [ ] **Step 1: Add `[data-strum="down&down"]` rule**

After the existing `[data-strum="down"]` rule block, add:

```css
.strum-note-btn[data-strum="down\u0026down"] {
  background: linear-gradient(180deg, rgba(242, 198, 109, 0.22), rgba(242, 198, 109, 0.10));
  border-color: rgba(242, 198, 109, 0.30);
  color: #ffe8b2;
  box-shadow: inset 0 1px 0 rgba(242, 198, 109, 0.10), inset 0 0 0 2px rgba(242, 198, 109, 0.4);
}
```

**CSS note:** The `&` in `down&down` must be escaped as `\u0026` in CSS attribute selectors.

- [ ] **Step 2: Add `[data-strum="down&up"]` rule**

```css
.strum-note-btn[data-strum="down\u0026up"] {
  background: linear-gradient(180deg, rgba(242, 198, 109, 0.22), rgba(242, 198, 109, 0.10));
  border-color: rgba(242, 198, 109, 0.30);
  border-left: 3px solid rgba(114, 244, 209, 0.4);
  color: #ffe8b2;
  box-shadow: inset 0 1px 0 rgba(242, 198, 109, 0.10);
}
```

- [ ] **Step 3: Add active glow rules for both new states**

After the existing `.strum-note.active .strum-note-btn[data-strum="down"]` rule, add:

```css
.strum-note.active .strum-note-btn[data-strum="down\u0026down"] {
  box-shadow: 0 0 12px rgba(242, 198, 109, 0.30), 0 0 0 2px rgba(242, 198, 109, 0.25);
  transform: scale(1.1);
}

.strum-note.active .strum-note-btn[data-strum="down\u0026up"] {
  box-shadow: 0 0 12px rgba(242, 198, 109, 0.30), 0 0 0 2px rgba(242, 198, 109, 0.25);
  transform: scale(1.1);
}
```

- [ ] **Step 4: Visual check**

Use `tests/strummer-smoke.html` or the main page. Click a note through all 5 states. Verify:
- `down&down`: amber with inset ring
- `down&up`: amber with teal left border
- Both glow correctly when active during playback

- [ ] **Step 5: Commit**

```bash
git add assets/css/strummer.css
git commit -m "feat: add CSS styles for down&down and down&up strummer states"
```

---

### Task 5: Update tests for 5-state cycle

**Files:**
- Modify: `tests/strummer.test.js`

- [ ] **Step 1: Replace the 3-click test with a 5-click test**

In `tests/strummer.test.js`, find the test starting with `// Test 6: Click toggles down -> up -> mute -> down` and replace the entire block:

```js
// Test 6: Click toggles down -> up -> mute -> down&down -> down&up -> down
var firstBtn = noteBtns[0];
var initDir = firstBtn.dataset.strum;
assert(initDir === "down", "First button should start as down, got: " + initDir);

firstBtn.click();
assert(firstBtn.dataset.strum === "up", "Click 1: should be up, got: " + firstBtn.dataset.strum);
assert(firstBtn.textContent === "\u25B2", "Click 1 icon: should be \u25B2, got: " + firstBtn.textContent);

firstBtn.click();
assert(firstBtn.dataset.strum === "mute", "Click 2: should be mute, got: " + firstBtn.dataset.strum);
assert(firstBtn.textContent === "\u2014", "Click 2 icon: should be \u2014, got: " + firstBtn.textContent);

firstBtn.click();
assert(firstBtn.dataset.strum === "down&down", "Click 3: should be down&down, got: " + firstBtn.dataset.strum);
assert(firstBtn.textContent === "\u25BC\u25BC", "Click 3 icon: should be \u25BC\u25BC, got: " + firstBtn.textContent);

firstBtn.click();
assert(firstBtn.dataset.strum === "down&up", "Click 4: should be down&up, got: " + firstBtn.dataset.strum);
assert(firstBtn.textContent === "\u25BC\u25B2", "Click 4 icon: should be \u25BC\u25B2, got: " + firstBtn.textContent);

firstBtn.click();
assert(firstBtn.dataset.strum === "down", "Click 5: should be back to down, got: " + firstBtn.dataset.strum);
assert(firstBtn.textContent === "\u25BC", "Click 5 icon: should be \u25BC, got: " + firstBtn.textContent);
```

- [ ] **Step 2: Run the test page**

Open `tests/strummer.test.js` test harness page in browser. Expected: all tests pass including the 5-click cycle test.

- [ ] **Step 3: Commit**

```bash
git add tests/strummer.test.js
git commit -m "test: update strummer toggle test to 5-state cycle"
```

---
