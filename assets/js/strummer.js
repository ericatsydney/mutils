// Guitar strummer widget — 8-note pattern player with up/down/mute toggle per note
;(function(){
  let audioCtx = null;
  let timerID = null;
  let nextNoteTime = 0.0;
  let currentStep = 0;
  let isRunning = false;
  let tempo = 120;
  let scheduleAheadTime = 0.1;
  let lookahead = 25.0;

  // Default pattern: D, D, U, U, D, U, D, U (basic 4/4 strumming)
  const defaultPattern = ["down","down","up","up","down","up","down","up"];

  // 5-state icon lookup
  var iconLookup = { down: "\u25BC", up: "\u25B2", mute: "\u2014", "down&down": "\u25BC\u25BC", "down&up": "\u25BC\u25B2" };

  function clampBPM(v){ return Math.max(40, Math.min(240, Math.round(v||120))); }

  function initAudio(){
    if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  function bindAndInit(){
    const metronomeRpmInput = document.getElementById("metronome-rpm");
    const startBtn = document.getElementById("strum-start");
    const stopBtn = document.getElementById("strum-stop");
    const noteBtns = Array.from(document.querySelectorAll(".strum-note-btn"));
    const noteWraps = Array.from(document.querySelectorAll(".strum-note"));

    if(!startBtn) return;

    // Read tempo from metronome RPM input
    if(metronomeRpmInput){
      tempo = clampBPM(Number(metronomeRpmInput.value));
    }
    try{
      const saved = localStorage.getItem("strummer-pattern");
      if(saved){
        const arr = JSON.parse(saved);
        if(Array.isArray(arr) && arr.length === 8){
          arr.forEach((dir, i) => {
            if(i < noteBtns.length){
              noteBtns[i].dataset.strum = dir;
              noteBtns[i].textContent = iconLookup[dir] || "\u25BC";
            }
          });
        }
      }
    }catch(e){}

    // Toggle note direction on click: down → up → mute → down&down → down&up → down...
    noteBtns.forEach(btn => {
      btn.addEventListener("click", function(){
        if(isRunning) return;
        const cur = this.dataset.strum || defaultPattern[noteBtns.indexOf(this)];
        // 5-state lookup table
        var nextLookup = { down: "up", up: "mute", mute: "down&down", "down&down": "down&up", "down&up": "down" };
        var next = nextLookup[cur] || "down";
        this.dataset.strum = next;
        this.textContent = iconLookup[next] || "\u25BC";
        const pat = noteBtns.map(b => b.dataset.strum);
        try{ localStorage.setItem("strummer-pattern", JSON.stringify(pat)); }catch(e){}
      });
    });

    // Init button text from dataset
    noteBtns.forEach((btn, i) => {
      if(!btn.dataset.strum) btn.dataset.strum = defaultPattern[i];
      const dir = btn.dataset.strum;
      btn.textContent = iconLookup[dir] || "\u25BC";
    });

    // Strum sound: "da" for down, "di" for up
    function playStrum(strumDir, time){
      if(!audioCtx) initAudio();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      // Down = lower pitch (da), Up = higher pitch (di)
      if(strumDir === "down"){
        osc.type = "triangle";
        osc.frequency.setValueAtTime(220, time);       // A3 — "da"
        osc.frequency.linearRampToValueAtTime(180, time + 0.04);
      } else {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(440, time);       // A4 — "di"
        osc.frequency.linearRampToValueAtTime(360, time + 0.04);
      }

      gain.gain.setValueAtTime(0.0, time);
      gain.gain.linearRampToValueAtTime(0.55, time + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(time);
      osc.stop(time + 0.14);
    }

    // UI highlight on current note
    function highlightStep(stepIndex){
      noteWraps.forEach(w => w.classList.remove("active"));
      if(noteWraps[stepIndex]) noteWraps[stepIndex].classList.add("active");
    }

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

    function nextNote(){
      const secondsPerStep = 60.0 / tempo / 2; // 1/8 note = half a beat
      nextNoteTime += secondsPerStep;
      currentStep = (currentStep + 1) % 8;
    }

    function scheduler(){
      while(nextNoteTime < audioCtx.currentTime + scheduleAheadTime){
        scheduleNote(currentStep, nextNoteTime);
        
        nextNote();
      }
    }

    function start(){
      if(isRunning) return;
      initAudio();
      if(metronomeRpmInput){
        tempo = clampBPM(Number(metronomeRpmInput.value));
      }
      // Auto-resume AudioContext (required after user gesture in modern browsers)
      if(audioCtx.state === "suspended"){
        audioCtx.resume();
      }
      isRunning = true;
      startBtn.disabled = true;
      stopBtn.disabled = false;
      currentStep = 0;
      nextNoteTime = audioCtx.currentTime + 0.05;
      timerID = window.setInterval(scheduler, lookahead);
          }

    function stop(){
      if(!isRunning) return;
      isRunning = false;
      startBtn.disabled = false;
      stopBtn.disabled = true;
      if(timerID){ clearInterval(timerID); timerID = null; }
      noteWraps.forEach(w => w.classList.remove("active"));
          }

    // UI wiring
    startBtn.addEventListener("click", start);
    stopBtn.addEventListener("click", stop);

    // Keyboard shortcut: space toggles when strummer is focused
    document.addEventListener("keydown", function(e){
      if(e.code === "Space" && document.activeElement &&
        (document.activeElement === startBtn || document.activeElement === stopBtn)){
        e.preventDefault();
        if(isRunning) stop(); else start();
      }
    });

    // Expose for debugging
    window._strummer = { start, stop, setBpm: function(v){ if(metronomeRpmInput){ metronomeRpmInput.value = clampBPM(v); tempo = Number(metronomeRpmInput.value); } } };
  }

  function waitForAppReady(){
    if(document.body && document.body.dataset && document.body.dataset.ready === "true"){
      bindAndInit();
      return;
    }
    const obs = new MutationObserver(function(mutations){
      for(let i = 0; i < mutations.length; i++){
        if(mutations[i].type === "attributes" && mutations[i].attributeName === "data-ready"){
          if(document.body.dataset.ready === "true"){
            obs.disconnect();
            bindAndInit();
            return;
          }
        }
      }
    });
    if(document.body){
      obs.observe(document.body, { attributes: true, attributeFilter: ["data-ready"] });
    }
    window.addEventListener("load", function(){
      if(!document.body.dataset || document.body.dataset.ready !== "true") bindAndInit();
    }, { once: true });
  }

  waitForAppReady();
})();

