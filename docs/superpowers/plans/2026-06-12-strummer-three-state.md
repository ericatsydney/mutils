# Strummer Three-State Toggle & Metronome Sync — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add mute toggle to strummer notes, sync tempo with metronome, remove note number labels.

**Architecture:** Three targeted edits — HTML cleanup removes BPM input and labels, CSS adds mute styling and drops dead rules, JS rewires toggle to three-state cycle (down?up?mute) and reads tempo from the metronome RPM input instead of its own. No new files, no refactoring of audio or scheduling code.

**Tech Stack:** Vanilla JS, CSS, HTML — same as existing widgets.

---

### Task 1: HTML — Remove BPM input row and number labels

**Files:**
- Modify: `components/main.html`

- [ ] **Step 1: Remove the 8 number labels and the BPM row from main.html**

In `components/main.html`, in the strummer section, replace the content from the `<div class="strum-notes">` through the `<!-- Status display -->` block with the version below that has no `<span class="strum-note-label">` elements and no `<div class="strum-bpm-row">`.

The new block is:

```html
              <!-- 8 note grid: each is a clickable up/down/mute toggle -->
              <div class="strum-notes" role="group" aria-label="Strum pattern notes">
                <div class="strum-note" role="listitem">
                  <button class="strum-note-btn" data-strum="down" aria-label="Note 1">&#9660;</button>
                </div>
                <div class="strum-note" role="listitem">
                  <button class="strum-note-btn" data-strum="down" aria-label="Note 2">&#9660;</button>
                </div>
                <div class="strum-note" role="listitem">
                  <button class="strum-note-btn" data-strum="up" aria-label="Note 3">&#9652;</button>
                </div>
                <div class="strum-note" role="listitem">
                  <button class="strum-note-btn" data-strum="up" aria-label="Note 4">&#9652;</button>
                </div>
                <div class="strum-note" role="listitem">
                  <button class="strum-note-btn" data-strum="down" aria-label="Note 5">&#9660;</button>
                </div>
                <div class="strum-note" role="listitem">
                  <button class="strum-note-btn" data-strum="up" aria-label="Note 6">&#9652;</button>
                </div>
                <div class="strum-note" role="listitem">
                  <button class="strum-note-btn" data-strum="down" aria-label="Note 7">&#9660;</button>
                </div>
                <div class="strum-note" role="listitem">
                  <button class="strum-note-btn" data-strum="up" aria-label="Note 8">&#9652;</button>
                </div>
              </div>

              <!-- Beat indicator bar -->
              <div class="strum-beat-indicator" aria-hidden="true">
                <span class="strum-beat-mark"></span>
                <span class="strum-beat-mark"></span>
                <span class="strum-beat-mark"></span>
                <span class="strum-beat-mark"></span>
                <span class="strum-beat-mark"></span>
                <span class="strum-beat-mark"></span>
                <span class="strum-beat-mark"></span>
                <span class="strum-beat-mark"></span>
              </div>

              <!-- Start/Stop buttons -->
              <div class="buttons">
                <button id="strum-start" class="btn primary">Start</button>
                <button id="strum-stop" class="btn" disabled>Stop</button>
              </div>

              <!-- Status display -->
              <div id="strum-status" class="strum-status" aria-live="polite">Ready</div>
```

Changes: removed all `strum-note-label` spans, removed the entire `strum-bpm-row` BPM input div, updated comment.

- [ ] **Step 2: Commit**

```bash
git add components/main.html
git commit -m "feat: remove strummer BPM input and note number labels"
```

---

### Task 2: CSS — Remove dead style rules, add mute state

**Files:**
- Modify: `assets/css/strummer.css`

- [ ] **Step 1: Remove dead CSS rules**

In `assets/css/strummer.css`, delete these entire rule blocks:

1. The `.strum-note-label { ... }` block
2. The `.strum-bpm-row { ... }` block
3. The `#strum-bpm { ... }` block
4. The `#strum-bpm::-webkit-outer-spin-button, #strum-bpm::-webkit-inner-spin-button { ... }` block
5. The `.strum-bpm-label { ... }` block

Also, in the `.strum-note` rule, remove the `gap: 4px;` line so it becomes:

```css
.strum-note {
  display: flex;
  flex-direction: column;
  align-items: center;
}
```

- [ ] **Step 2: Add mute state CSS**

After the existing `[data-strum="down"]` rule block, add:

```css
.strum-note-btn[data-strum="mute"] {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(167, 182, 214, 0.08);
  color: rgba(255, 255, 255, 0.2);
  box-shadow: none;
}
```

- [ ] **Step 3: Add active highlight for mute state**

After the existing `.strum-note.active .strum-note-btn[data-strum="down"]` block, add:

```css
.strum-note.active .strum-note-btn[data-strum="mute"] {
  box-shadow: 0 0 12px rgba(167, 182, 214, 0.15), 0 0 0 2px rgba(167, 182, 214, 0.12);
  transform: scale(1.1);
}
```

- [ ] **Step 4: Commit**

```bash
git add assets/css/strummer.css
git commit -m "style: remove strummer dead CSS, add mute state styles"
```

---

### Task 3: JS — Three-state toggle, metronome tempo sync, mute-silent playback

**Files:**
- Modify: `assets/js/strummer.js`

- [ ] **Step 1: Replace tempo source — remove bpmInput, read from metronome**

In `bindAndInit()`, replace:

```js
    const bpmInput = document.getElementById("strum-bpm");
    const startBtn = document.getElementById("strum-start");
    const stopBtn = document.getElementById("strum-stop");
    const statusEl = document.getElementById("strum-status");
    const noteBtns = Array.from(document.querySelectorAll(".strum-note-btn"));
    const noteWraps = Array.from(document.querySelectorAll(".strum-note"));

    if(!bpmInput || !startBtn) return;
```

With:

```js
    const metronomeRpmInput = document.getElementById("metronome-rpm");
    const startBtn = document.getElementById("strum-start");
    const stopBtn = document.getElementById("strum-stop");
    const statusEl = document.getElementById("strum-status");
    const noteBtns = Array.from(document.querySelectorAll(".strum-note-btn"));
    const noteWraps = Array.from(document.querySelectorAll(".strum-note"));

    if(!startBtn) return;
```

- [ ] **Step 2: Replace BPM localStorage restore with metronome read**

Replace:

```js
    // Restore saved pattern + BPM
    try{
      const saved = localStorage.getItem("strummer-bpm");
      if(saved) bpmInput.value = saved;
      tempo = clampBPM(Number(bpmInput.value));
    }catch(e){}
```

With:

```js
    // Read tempo from metronome RPM input
    if(metronomeRpmInput){
      tempo = clampBPM(Number(metronomeRpmInput.value));
    }
```

- [ ] **Step 3: Replace two-state toggle with three-state cycle (down ? up ? mute ? down)**

Replace the entire toggle click handler:

```js
    // Toggle note direction on click
    noteBtns.forEach(btn => {
      btn.addEventListener("click", function(){
        if(isRunning) return; // don't allow changes while playing
        const cur = this.dataset.strum || defaultPattern[noteBtns.indexOf(this)];
        const next = cur === "up" ? "down" : "up";
        this.dataset.strum = next;
        this.textContent = next === "up" ? "?" : "?";
        // persist pattern
        const pat = noteBtns.map(b => b.dataset.strum);
        try{ localStorage.setItem("strummer-pattern", JSON.stringify(pat)); }catch(e){}
      });
    });
```

With:

```js
    // Toggle note direction on click: down ? up ? mute ? down...
    noteBtns.forEach(btn => {
      btn.addEventListener("click", function(){
        if(isRunning) return;
        const cur = this.dataset.strum || defaultPattern[noteBtns.indexOf(this)];
        let next;
        if(cur === "down") next = "up";
        else if(cur === "up") next = "mute";
        else next = "down";
        this.dataset.strum = next;
        if(next === "up") this.textContent = "?";
        else if(next === "down") this.textContent = "?";
        else this.textContent = "—";
        const pat = noteBtns.map(b => b.dataset.strum);
        try{ localStorage.setItem("strummer-pattern", JSON.stringify(pat)); }catch(e){}
      });
    });
```

- [ ] **Step 4: Update button init to handle mute display**

Replace:

```js
    // Init button text from dataset
    noteBtns.forEach((btn, i) => {
      if(!btn.dataset.strum) btn.dataset.strum = defaultPattern[i];
      btn.textContent = btn.dataset.strum === "up" ? "?" : "?";
    });
```

With:

```js
    // Init button text from dataset
    noteBtns.forEach((btn, i) => {
      if(!btn.dataset.strum) btn.dataset.strum = defaultPattern[i];
      const dir = btn.dataset.strum;
      if(dir === "up") btn.textContent = "?";
      else if(dir === "down") btn.textContent = "?";
      else btn.textContent = "—";
    });
```

- [ ] **Step 5: Update pattern restore for mute state**

Replace:

```js
    try{
      const saved = localStorage.getItem("strummer-pattern");
      if(saved){
        const arr = JSON.parse(saved);
        if(Array.isArray(arr) && arr.length === 8){
          arr.forEach((dir, i) => {
            if(i < noteBtns.length){
              noteBtns[i].dataset.strum = dir;
              noteBtns[i].textContent = dir === "up" ? "?" : "?";
            }
          });
        }
      }
    }catch(e){}
```

With:

```js
    try{
      const saved = localStorage.getItem("strummer-pattern");
      if(saved){
        const arr = JSON.parse(saved);
        if(Array.isArray(arr) && arr.length === 8){
          arr.forEach((dir, i) => {
            if(i < noteBtns.length){
              noteBtns[i].dataset.strum = dir;
              if(dir === "up") noteBtns[i].textContent = "?";
              else if(dir === "down") noteBtns[i].textContent = "?";
              else noteBtns[i].textContent = "—";
            }
          });
        }
      }
    }catch(e){}
```

- [ ] **Step 6: Skip sound on mute in scheduleNote**

Replace:

```js
    function scheduleNote(stepIndex, time){
      const dir = noteBtns[stepIndex]?.dataset.strum || "down";
      playStrum(dir, time);
      // schedule highlight on main thread
      window.requestAnimationFrame(() => highlightStep(stepIndex));
    }
```

With:

```js
    function scheduleNote(stepIndex, time){
      const dir = noteBtns[stepIndex]?.dataset.strum || "down";
      if(dir !== "mute"){
        playStrum(dir, time);
      }
      window.requestAnimationFrame(() => highlightStep(stepIndex));
    }
```

- [ ] **Step 7: Update status display for mute**

Replace the status line in `scheduler()`:

```js
        if(statusEl) statusEl.textContent = `Beat ${beatNum} — note ${eighth}/8 · ${noteBtns[currentStep]?.dataset.strum === "up" ? "di" : "da"}`;
```

With:

```js
        if(statusEl){
          const s = noteBtns[currentStep]?.dataset.strum;
          const sound = s === "up" ? "di" : s === "down" ? "da" : "—";
          statusEl.textContent = `Beat ${beatNum} — note ${eighth}/8 · ${sound}`;
        }
```

- [ ] **Step 8: Update start() — read tempo from metronome, remove BPM localStorage save**

Replace:

```js
    function start(){
      if(isRunning) return;
      initAudio();
      tempo = clampBPM(Number(bpmInput.value));
      try{ localStorage.setItem("strummer-bpm", tempo); }catch(e){}
      audioCtx.resume().then(() => {
        isRunning = true;
        startBtn.disabled = true;
        stopBtn.disabled = false;
        currentStep = 0;
        nextNoteTime = audioCtx.currentTime + 0.05;
        timerID = window.setInterval(scheduler, lookahead);
        if(statusEl) statusEl.textContent = `Playing at ${tempo} BPM`;
      });
    }
```

With:

```js
    function start(){
      if(isRunning) return;
      initAudio();
      if(metronomeRpmInput){
        tempo = clampBPM(Number(metronomeRpmInput.value));
      }
      audioCtx.resume().then(() => {
        isRunning = true;
        startBtn.disabled = true;
        stopBtn.disabled = false;
        currentStep = 0;
        nextNoteTime = audioCtx.currentTime + 0.05;
        timerID = window.setInterval(scheduler, lookahead);
        if(statusEl) statusEl.textContent = `Playing at ${tempo} BPM`;
      });
    }
```

- [ ] **Step 9: Remove dead BPM change event listener**

Remove this entire block:

```js
    bpmInput.addEventListener("change", function(){
      this.value = clampBPM(this.value);
      tempo = Number(this.value);
      try{ localStorage.setItem("strummer-bpm", tempo); }catch(e){}
    });
```

- [ ] **Step 10: Update keyboard shortcut — remove bpmInput reference**

Replace:

```js
    document.addEventListener("keydown", function(e){
      if(e.code === "Space" && document.activeElement &&
        (document.activeElement === startBtn || document.activeElement === stopBtn || document.activeElement === bpmInput)){
        e.preventDefault();
        if(isRunning) stop(); else start();
      }
    });
```

With:

```js
    document.addEventListener("keydown", function(e){
      if(e.code === "Space" && document.activeElement &&
        (document.activeElement === startBtn || document.activeElement === stopBtn)){
        e.preventDefault();
        if(isRunning) stop(); else start();
      }
    });
```

- [ ] **Step 11: Update exposed debug API**

Replace:

```js
    window._strummer = { start, stop, setBpm: function(v){ bpmInput.value = clampBPM(v); tempo = Number(bpmInput.value); } };
```

With:

```js
    window._strummer = { start, stop, setBpm: function(v){ if(metronomeRpmInput){ metronomeRpmInput.value = clampBPM(v); tempo = Number(metronomeRpmInput.value); } } };
```

- [ ] **Step 12: Commit**

```bash
git add assets/js/strummer.js
git commit -m "feat: three-state strummer toggle, metronome tempo sync, mute silence"
```

---

### Task 4: Smoke test — verify all changes

**Files:**
- Create: `tests/strummer-smoke.html` (new)
- Create: `tests/strummer.test.js` (new)

- [ ] **Step 1: Create smoke test HTML fixture**

Create `tests/strummer-smoke.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Strummer Smoke Test</title>
    <link rel="stylesheet" href="../assets/css/styles.css">
    <link rel="stylesheet" href="../assets/css/metronome.css">
    <link rel="stylesheet" href="../assets/css/strummer.css">
    <style>
      body { margin: 0; padding: 2rem; min-height: 100vh; background: #071018; color: #f2f5f8; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
      h1 { margin: 0 0 1rem; font-size: 1.7rem; }
      #test-report { margin-bottom: 1.5rem; }
      .test-line { margin: 0.25rem 0; }
      .test-pass { color: #7dd3fc; }
      .test-fail { color: #f87171; }
      .test-summary { margin-top: 1.25rem; padding: 1rem; border-radius: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); }
      .test-fixture { max-width: 680px; }
    </style>
  </head>
  <body>
    <main>
      <h1>Strummer Smoke Test</h1>
      <div id="test-report" aria-live="polite"></div>
      <div id="test-summary" class="test-summary" aria-live="polite">Running smoke tests...</div>
      <section class="test-fixture">
        <!-- Metronome RPM source (required by strummer) -->
        <section class="metronome widget-module" role="region" aria-labelledby="metronome-title">
          <h2 id="metronome-title" class="widget-title">Metronome</h2>
          <div class="metronome-card">
            <div class="metronome-controls">
              <label for="metronome-rpm">RPM</label>
              <input id="metronome-rpm" type="number" min="30" max="300" step="1" value="120" aria-label="Beats per minute" />
              <div class="buttons">
                <button id="metronome-start" class="btn primary">Start</button>
                <button id="metronome-stop" class="btn" disabled>Stop</button>
                <button id="metronome-mute" class="btn" aria-pressed="false">Mute</button>
                <button id="metronome-tap" class="btn secondary">Tap tempo</button>
              </div>
              <div class="tap-panel">
                <span class="tap-display">Average: <strong id="metronome-tap-value">--</strong> RPM</span>
              </div>
            </div>
            <div class="metronome-visual" aria-hidden="false">
              <div class="beat-strip" role="list" aria-label="Beats">
                <div class="beat" data-beat="0" role="listitem" aria-label="Beat 1"></div>
                <div class="beat" data-beat="1" role="listitem" aria-label="Beat 2"></div>
                <div class="beat" data-beat="2" role="listitem" aria-label="Beat 3"></div>
                <div class="beat" data-beat="3" role="listitem" aria-label="Beat 4"></div>
              </div>
              <div id="metronome-status" class="sr-only" aria-live="polite"></div>
            </div>
          </div>
        </section>

        <!-- Strummer fixture -->
        <section class="strummer widget-module" role="region" aria-labelledby="strummer-title" style="margin-top: 20px;">
          <h2 id="strummer-title" class="widget-title">Strummer</h2>
          <div class="strum-card">
            <div class="strum-controls">
              <p class="strum-grid-label">Strum pattern &mdash; 8 &times; &#8539; note</p>
              <div class="strum-notes" role="group" aria-label="Strum pattern notes">
                <div class="strum-note" role="listitem">
                  <button class="strum-note-btn" data-strum="down" aria-label="Note 1">&#9660;</button>
                </div>
                <div class="strum-note" role="listitem">
                  <button class="strum-note-btn" data-strum="down" aria-label="Note 2">&#9660;</button>
                </div>
                <div class="strum-note" role="listitem">
                  <button class="strum-note-btn" data-strum="up" aria-label="Note 3">&#9652;</button>
                </div>
                <div class="strum-note" role="listitem">
                  <button class="strum-note-btn" data-strum="up" aria-label="Note 4">&#9652;</button>
                </div>
                <div class="strum-note" role="listitem">
                  <button class="strum-note-btn" data-strum="down" aria-label="Note 5">&#9660;</button>
                </div>
                <div class="strum-note" role="listitem">
                  <button class="strum-note-btn" data-strum="up" aria-label="Note 6">&#9652;</button>
                </div>
                <div class="strum-note" role="listitem">
                  <button class="strum-note-btn" data-strum="down" aria-label="Note 7">&#9660;</button>
                </div>
                <div class="strum-note" role="listitem">
                  <button class="strum-note-btn" data-strum="up" aria-label="Note 8">&#9652;</button>
                </div>
              </div>
              <div class="strum-beat-indicator" aria-hidden="true">
                <span class="strum-beat-mark"></span>
                <span class="strum-beat-mark"></span>
                <span class="strum-beat-mark"></span>
                <span class="strum-beat-mark"></span>
                <span class="strum-beat-mark"></span>
                <span class="strum-beat-mark"></span>
                <span class="strum-beat-mark"></span>
                <span class="strum-beat-mark"></span>
              </div>
              <div class="buttons">
                <button id="strum-start" class="btn primary">Start</button>
                <button id="strum-stop" class="btn" disabled>Stop</button>
              </div>
              <div id="strum-status" class="strum-status" aria-live="polite">Ready</div>
            </div>
          </div>
        </section>
      </section>
    </main>
    <script>document.body.dataset.ready = 'true';</script>
    <script src="../assets/js/metronome.js"></script>
    <script src="../assets/js/strummer.js"></script>
    <script src="strummer.test.js"></script>
  </body>
</html>
```

- [ ] **Step 2: Create test JS**

Create `tests/strummer.test.js`:

```js
;(function(){
  const report = document.getElementById("test-report");
  const summary = document.getElementById("test-summary");
  let passCount = 0;
  let failCount = 0;

  function pass(msg){
    passCount++;
    const el = document.createElement("div");
    el.className = "test-line test-pass";
    el.textContent = "? PASS: " + msg;
    report.appendChild(el);
  }

  function fail(msg){
    failCount++;
    const el = document.createElement("div");
    el.className = "test-line test-fail";
    el.textContent = "? FAIL: " + msg;
    report.appendChild(el);
  }

  function assert(condition, msg){
    if(condition) pass(msg);
    else fail(msg);
  }

  window.addEventListener("load", function(){
    window.setTimeout(function(){

      // Test 1: No number labels exist
      var labels = document.querySelectorAll(".strum-note-label");
      assert(labels.length === 0, "No .strum-note-label elements should exist");

      // Test 2: No BPM input exists
      var bpmInput = document.getElementById("strum-bpm");
      assert(!bpmInput, "No #strum-bpm input should exist");

      // Test 3: Metronome RPM input exists
      var rpmInput = document.getElementById("metronome-rpm");
      assert(!!rpmInput, "#metronome-rpm should exist (tempo source)");

      // Test 4: 8 note buttons exist
      var noteBtns = document.querySelectorAll(".strum-note-btn");
      assert(noteBtns.length === 8, "Should have 8 note buttons, got " + noteBtns.length);

      // Test 5: Start and Stop buttons exist
      var startBtn = document.getElementById("strum-start");
      var stopBtn = document.getElementById("strum-stop");
      assert(!!startBtn && !!stopBtn, "Start and Stop buttons should exist");

      // Test 6: Click toggles down ? up ? mute ? down
      var firstBtn = noteBtns[0];
      var initDir = firstBtn.dataset.strum;
      assert(initDir === "down", "First button should start as down, got: " + initDir);

      firstBtn.click();
      assert(firstBtn.dataset.strum === "up", "After 1 click: should be up, got: " + firstBtn.dataset.strum);
      assert(firstBtn.textContent === "\u25B2", "Up state icon: should be ?, got: " + firstBtn.textContent);

      firstBtn.click();
      assert(firstBtn.dataset.strum === "mute", "After 2 clicks: should be mute, got: " + firstBtn.dataset.strum);
      assert(firstBtn.textContent === "\u2014", "Mute state icon: should be —, got: " + firstBtn.textContent);

      firstBtn.click();
      assert(firstBtn.dataset.strum === "down", "After 3 clicks: should be back to down, got: " + firstBtn.dataset.strum);
      assert(firstBtn.textContent === "\u25BC", "Down state icon: should be ?, got: " + firstBtn.textContent);

      // Test 7: _strummer exposed
      assert(!!window._strummer, "window._strummer should be exposed");
      assert(typeof window._strummer.start === "function", "_strummer.start should be a function");
      assert(typeof window._strummer.stop === "function", "_strummer.stop should be a function");

      // Test 8: setBpm writes to metronome RPM
      window._strummer.setBpm(140);
      assert(rpmInput.value === "140", "setBpm(140) should set metronome RPM to 140, got: " + rpmInput.value);

      // Restore default
      rpmInput.value = 120;

      // Summary
      summary.textContent = passCount + "/" + (passCount + failCount) + " tests passed" +
        (failCount > 0 ? " (" + failCount + " failed)" : " \u2713 All passing");
    }, 300);
  });
})();
```

- [ ] **Step 3: Open smoke test in browser to verify**

Open `tests/strummer-smoke.html` in the in-app browser and confirm all tests pass.

- [ ] **Step 4: Commit**

```bash
git add tests/strummer-smoke.html tests/strummer.test.js
git commit -m "test: add strummer smoke test for three-state toggle and metronome sync"
```
