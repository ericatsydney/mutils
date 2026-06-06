let testFailed = false;

function appendResult(message, passed) {
  const report = document.getElementById('test-report');
  const line = document.createElement('div');
  line.className = 'test-line ' + (passed ? 'test-pass' : 'test-fail');
  line.textContent = (passed ? 'PASS: ' : 'FAIL: ') + message;
  report.appendChild(line);
  if (!passed) {
    testFailed = true;
  }
  return passed;
}

function appendSummary(message, passed) {
  const summary = document.getElementById('test-summary');
  summary.textContent = message;
  summary.className = passed ? 'test-summary test-pass' : 'test-summary test-fail';
  document.title = passed ? 'Metronome Smoke Test: PASS' : 'Metronome Smoke Test: FAIL';
}

function assert(condition, message) {
  if (!condition) {
    appendResult(message, false);
    throw new Error(message);
  }
  appendResult(message, true);
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runSmokeTests() {
  const bpmInput = document.getElementById('metronome-rpm');
  const startBtn = document.getElementById('metronome-start');
  const stopBtn = document.getElementById('metronome-stop');
  const muteBtn = document.getElementById('metronome-mute');
  const tapBtn = document.getElementById('metronome-tap');
  const tapValue = document.getElementById('metronome-tap-value');
  const beats = document.querySelectorAll('.beat');

  assert(bpmInput !== null, 'RPM input should exist');
  assert(startBtn !== null, 'Start button should exist');
  assert(stopBtn !== null, 'Stop button should exist');
  assert(muteBtn !== null, 'Mute button should exist');
  assert(tapBtn !== null, 'Tap tempo button should exist');
  assert(tapValue !== null, 'Tap tempo display should exist');
  assert(beats.length === 4, 'There should be 4 beat indicators');

  assert(startBtn.disabled === false, 'Start button should be enabled initially');
  assert(stopBtn.disabled === true, 'Stop button should be disabled initially');
  assert(muteBtn.getAttribute('aria-pressed') === 'false', 'Mute button should be unpressed initially');

  tapBtn.click();
  await wait(80);
  tapBtn.click();
  await wait(80);
  tapBtn.click();
  await wait(80);

  const averageText = tapValue.textContent.trim();
  assert(averageText !== '--' && averageText !== '', 'Tap tempo should compute an average RPM');
  assert(Number(averageText) >= 30 && Number(averageText) <= 300, 'Tap tempo RPM should be in valid range');
  assert(Number(bpmInput.value) === Number(averageText), 'RPM input should update to tap tempo value');

  startBtn.click();
  await wait(120);
  assert(startBtn.disabled === true, 'Start button should disable after starting');
  assert(stopBtn.disabled === false, 'Stop button should enable after starting');

  stopBtn.click();
  await wait(120);
  assert(startBtn.disabled === false, 'Start button should re-enable after stopping');
  assert(stopBtn.disabled === true, 'Stop button should re-disable after stopping');

  muteBtn.click();
  await wait(20);
  assert(muteBtn.getAttribute('aria-pressed') === 'true', 'Mute button should toggle on');

  appendSummary('Smoke tests passed.', true);
}

window.addEventListener('load', () => {
  setTimeout(() => {
    runSmokeTests().catch(error => {
      appendSummary('Smoke tests failed: ' + error.message, false);
    });
  }, 100);
});
