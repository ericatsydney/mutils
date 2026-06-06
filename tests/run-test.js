#!/usr/bin/env node
/**
 * CLI test runner for metronome widget
 * Run: node tests/run-test.js
 */

const fs = require('fs');
const path = require('path');

let passCount = 0;
let failCount = 0;
let testResults = [];

function logPass(message) {
  passCount++;
  testResults.push(`✓ ${message}`);
  console.log(`\x1b[32m✓\x1b[0m ${message}`);
}

function logFail(message) {
  failCount++;
  testResults.push(`✗ ${message}`);
  console.log(`\x1b[31m✗\x1b[0m ${message}`);
}

function assert(condition, message) {
  if (condition) {
    logPass(message);
  } else {
    logFail(message);
  }
  return condition;
}

console.log('\n--- Metronome Widget Smoke Tests ---\n');

// Test 1: Check HTML structure
console.log('Checking HTML structure...');
const mainHtmlPath = path.join(__dirname, '../components/main.html');
const mainHtml = fs.readFileSync(mainHtmlPath, 'utf-8');

assert(mainHtml.includes('id="metronome-rpm"'), 'RPM input element exists in HTML');
assert(mainHtml.includes('id="metronome-start"'), 'Start button exists in HTML');
assert(mainHtml.includes('id="metronome-stop"'), 'Stop button exists in HTML');
assert(mainHtml.includes('id="metronome-mute"'), 'Mute button exists in HTML');
assert(mainHtml.includes('id="metronome-tap"'), 'Tap tempo button exists in HTML');
assert(mainHtml.includes('id="metronome-tap-value"'), 'Tap tempo display exists in HTML');
assert(mainHtml.match(/class="beat"/g) && mainHtml.match(/class="beat"/g).length === 4, 'Four beat indicators exist');

// Test 2: Check CSS file
console.log('\nChecking CSS styles...');
const cssPath = path.join(__dirname, '../assets/css/metronome.css');
const cssContent = fs.readFileSync(cssPath, 'utf-8');

assert(cssContent.includes('.metronome-card'), 'metronome-card class defined in CSS');
assert(cssContent.includes('.btn'), 'btn class defined in CSS');
assert(cssContent.includes('.beat'), 'beat class defined in CSS');
assert(cssContent.includes('.widget-area'), 'widget-area class defined in CSS');

// Test 3: Check JavaScript file syntax and structure
console.log('\nChecking JavaScript implementation...');
const jsPath = path.join(__dirname, '../assets/js/metronome.js');
const jsContent = fs.readFileSync(jsPath, 'utf-8');

assert(jsContent.includes('recordTap'), 'Tap tempo function exists');
assert(jsContent.includes('function start()'), 'Start function exists');
assert(jsContent.includes('function stop()'), 'Stop function exists');
assert(jsContent.includes('scheduleNote'), 'Schedule note function exists');
assert(jsContent.includes('localStorage'), 'localStorage persistence implemented');
assert(jsContent.includes('Web Audio'), 'Web Audio API usage mentioned');

// Test 4: Check test file structure
console.log('\nChecking test infrastructure...');
const testHtmlPath = path.join(__dirname, './metronome-smoke.html');
assert(fs.existsSync(testHtmlPath), 'Smoke test HTML file exists');

const testJsPath = path.join(__dirname, './metronome.test.js');
assert(fs.existsSync(testJsPath), 'Smoke test JS file exists');

// Test 5: Check README
console.log('\nChecking documentation...');
const readmePath = path.join(__dirname, '../README.md');
const readmeContent = fs.readFileSync(readmePath, 'utf-8');

assert(readmeContent.includes('Metronome'), 'README documents metronome');
assert(readmeContent.includes('http.server'), 'README includes startup instructions');
assert(readmeContent.includes('test'), 'README documents testing');

// Summary
console.log('\n--- Test Summary ---');
console.log(`\nPassed: \x1b[32m${passCount}\x1b[0m`);
console.log(`Failed: \x1b[31m${failCount}\x1b[0m`);
console.log(`Total:  ${passCount + failCount}\n`);

if (failCount > 0) {
  console.log('\x1b[31mSome tests failed.\x1b[0m');
  process.exit(1);
} else {
  console.log('\x1b[32mAll tests passed!\x1b[0m\n');
  process.exit(0);
}
