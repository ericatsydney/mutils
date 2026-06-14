;(function(){
  const report = document.getElementById("test-report");
  const summary = document.getElementById("test-summary");
  let passCount = 0;
  let failCount = 0;

  function pass(msg){
    passCount++;
    const el = document.createElement("div");
    el.className = "test-line test-pass";
    el.textContent = "\u2713 PASS: " + msg;
    report.appendChild(el);
  }

  function fail(msg){
    failCount++;
    const el = document.createElement("div");
    el.className = "test-line test-fail";
    el.textContent = "\u2717 FAIL: " + msg;
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
