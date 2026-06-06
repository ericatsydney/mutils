// Metronome widget - scheduling using Web Audio API with lookahead
// Wait for the app's component injection to finish (app.js sets body.dataset.ready = 'true')
;(function(){
  let audioCtx = null;
  let timerID = null;
  let nextNoteTime = 0.0;
  let currentBeat = 0;
  let isRunning = false;
  let tempo = 120;
  let scheduleAheadTime = 0.1; // seconds
  let lookahead = 25.0; // ms
  let isMuted = false;

  function clampBPM(v){ return Math.max(30, Math.min(300, Math.round(v||120))); }
  function initAudio(){ if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }

  // core functions will be bound once DOM elements exist
  function bindAndInit(){
    const bpmInput = document.getElementById('metronome-rpm');
    const startBtn = document.getElementById('metronome-start');
    const stopBtn = document.getElementById('metronome-stop');
    const muteBtn = document.getElementById('metronome-mute');
    const tapBtn = document.getElementById('metronome-tap');
    const tapValue = document.getElementById('metronome-tap-value');
    const beats = Array.from(document.querySelectorAll('.beat'));
    const statusLive = document.getElementById('metronome-status');
    if(!bpmInput || !startBtn) return;

    let tapTimes = [];
    let tapTimeout = null;

    function updateTapDisplay(value){
      if(!tapValue) return;
      tapValue.textContent = value ? String(value) : '--';
    }

    function resetTapTempo(){
      tapTimes = [];
      updateTapDisplay(null);
      if(tapTimeout){ clearTimeout(tapTimeout); tapTimeout = null; }
    }

    function recordTap(){
      const now = performance.now();
      if(tapTimes.length && now - tapTimes[tapTimes.length - 1] > 2000){
        tapTimes = [];
      }
      tapTimes.push(now);
      if(tapTimes.length > 8){ tapTimes.shift(); }
      if(tapTimeout){ clearTimeout(tapTimeout); }
      tapTimeout = window.setTimeout(resetTapTempo, 2500);
      if(tapTimes.length >= 2){
        const intervals = [];
        for(let i = 1; i < tapTimes.length; i += 1){
          intervals.push(tapTimes[i] - tapTimes[i - 1]);
        }
        const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
        const bpm = clampBPM(60000 / avgInterval);
        bpmInput.value = bpm;
        tempo = bpm;
        try{ localStorage.setItem('metronome-bpm', bpm); }catch(e){}
        updateTapDisplay(bpm);
        statusLive.textContent = `Tap tempo: ${bpm} RPM`;
      }
    }

    // restore persisted state
    try{ const saved = localStorage.getItem('metronome-bpm'); if(saved) bpmInput.value = saved; }catch(e){}
    try{ const m = localStorage.getItem('metronome-muted'); if(m==='true'){ isMuted=true; muteBtn.setAttribute('aria-pressed','true'); } }catch(e){}

    function scheduleNote(beatIndex, time){
      window.requestAnimationFrame(()=>{
        beats.forEach(b=>b.classList.remove('active'));
        const el = beats[beatIndex];
        if(el){
          el.classList.add('active');
          if(beatIndex===0){ el.classList.add('accent'); el.classList.remove('regular'); }
          else{ el.classList.add('regular'); el.classList.remove('accent'); }
        }
      });
      if(isMuted) return;
      if(!audioCtx) initAudio();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = (beatIndex===0) ? 1000 : 800;
      gain.gain.setValueAtTime(0.0, time);
      gain.gain.linearRampToValueAtTime(0.9, time + 0.001);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.start(time);
      osc.stop(time + 0.07);
    }

    function nextNote(){
      const secondsPerBeat = 60.0 / tempo;
      nextNoteTime += secondsPerBeat;
      currentBeat = (currentBeat + 1) % 4;
    }

    function scheduler(){
      while(nextNoteTime < audioCtx.currentTime + scheduleAheadTime){
        scheduleNote(currentBeat, nextNoteTime);
        statusLive.textContent = `Beat ${currentBeat+1}`;
        nextNote();
      }
    }

    function start(){
      if(isRunning) return;
      initAudio();
      tempo = clampBPM(Number(bpmInput.value));
      try{ localStorage.setItem('metronome-bpm', tempo); }catch(e){}
      audioCtx.resume().then(()=>{
        isRunning = true;
        startBtn.disabled = true; stopBtn.disabled = false;
        currentBeat = 0;
        nextNoteTime = audioCtx.currentTime + 0.05;
        timerID = setInterval(scheduler, lookahead);
        statusLive.textContent = `Started at ${tempo} RPM`;
      });
    }

    function stop(){
      if(!isRunning) return;
      isRunning = false;
      startBtn.disabled = false; stopBtn.disabled = true;
      if(timerID){ clearInterval(timerID); timerID = null; }
      beats.forEach(b=>b.classList.remove('active','accent','regular'));
      statusLive.textContent = `Stopped`;
    }

    // UI wiring
    startBtn.addEventListener('click', ()=>{ start(); });
    stopBtn.addEventListener('click', ()=>{ stop(); });
    muteBtn.addEventListener('click', ()=>{ isMuted = !isMuted; muteBtn.setAttribute('aria-pressed', String(isMuted)); try{ localStorage.setItem('metronome-muted', String(isMuted)); }catch(e){} });
    bpmInput.addEventListener('change', ()=>{ bpmInput.value = clampBPM(bpmInput.value); tempo = Number(bpmInput.value); try{ localStorage.setItem('metronome-bpm', tempo); }catch(e){} });
    if(tapBtn){ tapBtn.addEventListener('click', ()=>{ recordTap(); }); }
    document.addEventListener('keydown', (e)=>{
      if(e.code==='Space' && document.activeElement && (document.activeElement===startBtn || document.activeElement===stopBtn || document.activeElement===bpmInput)){
        e.preventDefault(); if(isRunning) stop(); else start();
      }
    });

    // expose for debugging
    window._metronome = { start, stop, setBpm:(v)=>{ bpmInput.value = clampBPM(v); tempo = Number(bpmInput.value); } };
  }

  function waitForAppReady(){
    if(document.body && document.body.dataset && document.body.dataset.ready === 'true'){
      bindAndInit();
      return;
    }
    // observe body dataset changes
    const obs = new MutationObserver((records)=>{
      if(document.body && document.body.dataset && document.body.dataset.ready === 'true'){
        obs.disconnect();
        bindAndInit();
      }
    });
    if(document.body) obs.observe(document.body, { attributes: true, attributeFilter: ['data-ready'] });
    // fallback to load event
    window.addEventListener('load', ()=>{ if(!document.body.dataset || document.body.dataset.ready !== 'true') bindAndInit(); }, { once:true });
  }

  waitForAppReady();

})();
