// audio.js — The Last Frequency
// Web Audio synthesis: Rust Belt Requiem + The Buried Street

// ── Rust Belt Requiem — Web Audio implementation of the Sonic Pi script ────────
// Mirrors: sub_drone, piano_melody, sleet_grains, distorted_horizon

let audioCtx = null;
let audioStarted = false;
let masterGain = null;
let loopHandles = [];


function freq(note){ return NOTE_FREQ[note] || 220; }


// ── Audio helpers ─────────────────────────────────────────────────────────────
function initAudio(){
  if(audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = audioCtx.createGain();
  masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
  masterGain.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 4);
  masterGain.connect(audioCtx.destination);
}

function fadeOut(duration=3){
  if(!masterGain) return;
  masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
  masterGain.gain.setValueAtTime(masterGain.gain.value, audioCtx.currentTime);
  masterGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + duration);
}
function fadeIn(duration=3){
  if(!masterGain) return;
  masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
  masterGain.gain.setValueAtTime(masterGain.gain.value, audioCtx.currentTime);
  masterGain.gain.linearRampToValueAtTime(1, audioCtx.currentTime + duration);
}

// ── Reverb impulse (simple convolution reverb) ───────────────────────────────
function makeReverb(roomSize=0.9, mix=0.7){
  const convolver = audioCtx.createConvolver();
  const rate = audioCtx.sampleRate;
  const length = rate * (1 + roomSize * 5);
  const impulse = audioCtx.createBuffer(2, length, rate);
  for(let ch=0; ch<2; ch++){
    const data = impulse.getChannelData(ch);
    for(let i=0; i<length; i++){
      data[i] = (Math.random()*2-1) * Math.pow(1-i/length, 1.5+roomSize*2);
    }
  }
  convolver.buffer = impulse;
  const dryGain = audioCtx.createGain(); dryGain.gain.value = 1-mix;
  const wetGain = audioCtx.createGain(); wetGain.gain.value = mix;
  const merger = audioCtx.createGain();
  const input = audioCtx.createGain();
  input.connect(dryGain); input.connect(convolver);
  convolver.connect(wetGain);
  dryGain.connect(merger); wetGain.connect(merger);
  return { input, output: merger };
}

// ── LPF helper ────────────────────────────────────────────────────────────────
function makeLPF(cutoffHz){
  const f = audioCtx.createBiquadFilter();
  f.type='lowpass'; f.frequency.value=cutoffHz; f.Q.value=0.7;
  return f;
}
function makeBPF(centreHz, Q=10){
  const f = audioCtx.createBiquadFilter();
  f.type='bandpass'; f.frequency.value=centreHz; f.Q.value=Q;
  return f;
}

// ── LOOP 1: sub_drone — :dark_ambience ────────────────────────────────────────
// Deep detuned oscillators, slow attack/release, long period
function startSubDrone(){
  const period = (16 / 58) * 60 * 1000; // 16 beats at 58bpm in ms
  function fire(){
    const now = audioCtx.currentTime;
    const attack = 8; const release = 8; const amp = 0.6;
    // Two slightly detuned saws for :dark_ambience character
    [0, 0.2, -0.15].forEach((detune, i) => {
      const osc = audioCtx.createOscillator();
      const g   = audioCtx.createGain();
      const lpf = makeLPF(280);
      osc.type = i===0 ? 'sawtooth' : 'sine';
      osc.frequency.value = freq('a1') * Math.pow(2, detune/12);
      osc.connect(lpf); lpf.connect(g); g.connect(masterGain);
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(amp * (i===0?0.5:0.3), now + attack);
      g.gain.setValueAtTime(amp * (i===0?0.5:0.3), now + attack + 0.1);
      g.gain.linearRampToValueAtTime(0, now + attack + release);
      osc.start(now); osc.stop(now + attack + release + 0.1);
    });
  }
  fire();
  const handle = setInterval(fire, period);
  loopHandles.push(handle);
}

// ── LOOP 2: piano_melody — sparse piano with reverb ──────────────────────────
const pianoNotes = ['a2','g2','e2','c2'];
let pianoNoteIdx = 0;
function startPianoMelody(){
  const shuffled = [...pianoNotes].sort(()=>Math.random()-0.5);
  const reverb = makeReverb(0.9, 0.7);
  reverb.output.connect(masterGain);
  const spacings = [(8/58)*60000, (16/58)*60000, (12/58)*60000];
  function fire(){
    const note = shuffled[pianoNoteIdx % shuffled.length];
    pianoNoteIdx++;
    const now = audioCtx.currentTime;
    const release = 5; const amp = 0.5;
    const f0 = freq(note);
    // Piano: sine + harmonic partials with fast attack, long decay
    [1, 2, 3, 4, 6].forEach((partial, i) => {
      const osc = audioCtx.createOscillator();
      const g   = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = f0 * partial;
      // Detune slightly for 'felt' piano character
      osc.detune.value = (Math.random()-0.5)*4;
      const partialAmp = amp * [0.5, 0.15, 0.08, 0.04, 0.02][i];
      osc.connect(g); g.connect(reverb.input);
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(partialAmp, now + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, now + release);
      osc.start(now); osc.stop(now + release + 0.1);
    });
    const spacing = spacings[Math.floor(Math.random()*spacings.length)];
    const handle = setTimeout(fire, spacing);
    loopHandles.push(handle);
  }
  const initDelay = spacings[Math.floor(Math.random()*spacings.length)];
  const handle = setTimeout(fire, initDelay);
  loopHandles.push(handle);
}

// ── LOOP 3: sleet_grains — noise BPF + echo ──────────────────────────────────
function startSleetGrains(){
  const period = (0.125 / 58) * 60 * 1000;
  function fire(){
    if(Math.random() > 0.25) return; // one_in(4)
    const now = audioCtx.currentTime;
    const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.015, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for(let i=0;i<data.length;i++) data[i] = Math.random()*2-1;
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    const bpf = makeBPF(110, 12);
    // Echo: delay + feedback
    const delay = audioCtx.createDelay(1.0);
    delay.delayTime.value = (0.125/58)*60;
    const feedback = audioCtx.createGain(); feedback.gain.value = 0.35;
    const g = audioCtx.createGain();
    const amp = 0.05 + Math.random()*0.1;
    g.gain.value = amp;
    src.connect(bpf); bpf.connect(g); g.connect(delay);
    delay.connect(feedback); feedback.connect(delay);
    g.connect(masterGain); delay.connect(masterGain);
    src.start(now); src.stop(now + 0.02);
  }
  const handle = setInterval(fire, period);
  loopHandles.push(handle);
}

// ── LOOP 4: distorted_horizon — :hollow + distortion + LPF ──────────────────
function startHorizonSwells(){
  const period = (24/58)*60*1000;
  const delay  = (16/58)*60*1000;
  const horizNotes = ['a2','f2'];
  function fire(){
    const now = audioCtx.currentTime;
    const note = horizNotes[Math.floor(Math.random()*horizNotes.length)];
    const attack=6, release=10, amp=0.3;
    const f0 = freq(note);
    // :hollow — thin, breathy oscillator
    const osc1 = audioCtx.createOscillator(); osc1.type='sine'; osc1.frequency.value=f0;
    const osc2 = audioCtx.createOscillator(); osc2.type='triangle'; osc2.frequency.value=f0*2.01;
    const lpf  = makeLPF(900); // cutoff:70 in Sonic Pi midi → ~900Hz
    const waveShaper = audioCtx.createWaveShaper();
    // Soft distortion curve (distort:0.4)
    const curve = new Float32Array(256);
    const k = 0.4 * 100;
    for(let i=0;i<256;i++){const x=i*2/256-1; curve[i]=x*(Math.abs(x)+k/100)/(x*x+k/100*Math.abs(x)+1);}
    waveShaper.curve = curve;
    const g = audioCtx.createGain();
    [osc1,osc2].forEach(o=>{ o.connect(waveShaper); });
    waveShaper.connect(lpf); lpf.connect(g); g.connect(masterGain);
    // Slow unstable pitch wobble
    osc1.frequency.setValueAtTime(f0, now);
    osc1.frequency.linearRampToValueAtTime(f0*1.003, now+attack+release*0.5);
    osc1.frequency.linearRampToValueAtTime(f0, now+attack+release);
    g.gain.setValueAtTime(0,now);
    g.gain.linearRampToValueAtTime(amp, now+attack);
    g.gain.setValueAtTime(amp, now+attack+0.1);
    g.gain.linearRampToValueAtTime(0, now+attack+release);
    osc1.start(now); osc2.start(now);
    osc1.stop(now+attack+release+0.1); osc2.stop(now+attack+release+0.1);
  }
  const h = setTimeout(()=>{ fire(); const handle=setInterval(fire,period); loopHandles.push(handle); }, delay);
  loopHandles.push(h);
}

// ── Public API ────────────────────────────────────────────────────────────────
function startAudio(){
  if(audioStarted) return;
  audioStarted = true;
  initAudio();
  startSubDrone();
  startPianoMelody();
  startSleetGrains();
  startHorizonSwells();
}

function stopAudio(){
  loopHandles.forEach(h=>{ clearInterval(h); clearTimeout(h); });
  loopHandles=[];
  if(audioCtx){ fadeOut(2); setTimeout(()=>{ audioCtx.close(); audioCtx=null; audioStarted=false; masterGain=null; },2500); }
}

function setAudioVolume(v, ramp=1.5){
  if(!masterGain) return;
  masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
  masterGain.gain.setValueAtTime(masterGain.gain.value, audioCtx.currentTime);
  masterGain.gain.linearRampToValueAtTime(v, audioCtx.currentTime+ramp);
}

// ── The Buried Street — Web Audio implementation ──────────────────────────────
// Chapters VIII beats VII-XII only. Crossfades with Rust Belt Requiem.

let buriedCtx = null;
let buriedMaster = null;
let buriedLoops = [];
let buriedActive = false;

function initBuried() {
  if (buriedCtx) return;
  // Reuse the same AudioContext if possible
  if (audioCtx) { buriedCtx = audioCtx; buriedMaster = audioCtx.createGain(); buriedMaster.gain.value = 0; buriedMaster.connect(audioCtx.destination); return; }
  buriedCtx = new (window.AudioContext || window.webkitAudioContext)();
  buriedMaster = buriedCtx.createGain(); buriedMaster.gain.value = 0;
  buriedMaster.connect(buriedCtx.destination);
}

// ── Note frequencies ──────────────────────────────────────────────────────────
const BURIED_FREQ = {
  'a1': 55.00, 'f1': 43.65,
  'e4': 329.63, 'eb4': 311.13, 'a3': 220.0, 'b3': 246.94,
  'a2': 110.0,
  // Am9 chord: A2 C3 E3 G3 B3
  'c3': 130.81, 'e3': 164.81, 'g3': 196.00,
};
function bf(note) { return BURIED_FREQ[note] || 220; }

function bLPF(hz) {
  const f = buriedCtx.createBiquadFilter(); f.type='lowpass';
  f.frequency.value = hz * 12; // Sonic Pi cutoff 50 ≈ midi note 50 → ~1397Hz, but feel-wise keep low
  f.Q.value = 0.5; return f;
}
function bReverb(room=1, mix=0.8, damp=0.9) {
  const c = buriedCtx.createConvolver();
  const rate = buriedCtx.sampleRate;
  const len = rate * (2 + room * 6);
  const buf = buriedCtx.createBuffer(2, len, rate);
  for (let ch=0; ch<2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i=0; i<len; i++) d[i] = (Math.random()*2-1) * Math.pow(1 - i/len, 1 + damp*3);
  }
  c.buffer = buf;
  const dry = buriedCtx.createGain(); dry.gain.value = 1-mix;
  const wet = buriedCtx.createGain(); wet.gain.value = mix;
  const out = buriedCtx.createGain();
  const inp = buriedCtx.createGain();
  inp.connect(dry); inp.connect(c); c.connect(wet); dry.connect(out); wet.connect(out);
  return { input: inp, output: out };
}

// ── LOOP 1: heavy_bass — :fm synth, LPF cutoff:50, A1/F1 alternating ─────────
function startHeavyBass() {
  const beatMs = (1/45)*60*1000;
  const notes = ['a1','f1'];
  const sleeps = [12, 12];
  let noteIdx = 0;
  function fire() {
    const now = buriedCtx.currentTime;
    const note = notes[noteIdx % 2];
    const sleep = sleeps[noteIdx % 2];
    noteIdx++;
    const amp = note==='a1' ? 0.5 : 0.4;
    // FM synthesis: carrier + modulator
    const carrier = buriedCtx.createOscillator();
    const modulator = buriedCtx.createOscillator();
    const modGain = buriedCtx.createGain();
    const envGain = buriedCtx.createGain();
    const lpf = bLPF(55);
    const attack=6, release=10;
    const f0 = bf(note);
    carrier.type = 'sine'; carrier.frequency.value = f0;
    modulator.type = 'sine'; modulator.frequency.value = f0 * 1.5; // divisor:1.5
    modGain.gain.value = f0 * 4; // depth:4
    modulator.connect(modGain); modGain.connect(carrier.frequency);
    carrier.connect(lpf); lpf.connect(envGain); envGain.connect(buriedMaster);
    envGain.gain.setValueAtTime(0, now);
    envGain.gain.linearRampToValueAtTime(amp, now + attack);
    envGain.gain.setValueAtTime(amp, now + attack + 0.1);
    envGain.gain.linearRampToValueAtTime(0, now + attack + release);
    carrier.start(now); modulator.start(now);
    carrier.stop(now + attack + release + 0.2);
    modulator.stop(now + attack + release + 0.2);
    const h = setTimeout(fire, sleep * beatMs);
    buriedLoops.push(h);
  }
  fire();
}

// ── LOOP 2: ghost_lead — :hollow, heavy reverb, bitcrusher, devil's interval ──
const ghostNotes = ['e4','eb4','a3','b3'];
let ghostIdx = 0;
function startGhostLead() {
  const beatMs = (1/45)*60*1000;
  const rev = bReverb(1, 0.8, 0.9);
  rev.output.connect(buriedMaster);
  function fire() {
    const now = buriedCtx.currentTime;
    const note = ghostNotes[ghostIdx % ghostNotes.length]; ghostIdx++;
    const f0 = bf(note);
    const attack=5, release=8, amp=0.35;
    // :hollow — thin, breathy. Three detuned sines with phase spread
    [1, 2.01, 3.02].forEach((mult, i) => {
      const osc = buriedCtx.createOscillator(); osc.type='sine';
      osc.frequency.value = f0 * mult;
      // mod_pitch wobble: ±0.5 semitones at 4 Hz
      const lfo = buriedCtx.createOscillator(); lfo.type='sine'; lfo.frequency.value=4;
      const lfoG = buriedCtx.createGain(); lfoG.gain.value = f0 * (Math.pow(2,0.5/12)-1);
      lfo.connect(lfoG); lfoG.connect(osc.frequency);
      const envG = buriedCtx.createGain();
      const partAmp = amp * [0.4, 0.15, 0.06][i];
      envG.gain.setValueAtTime(0, now);
      envG.gain.linearRampToValueAtTime(partAmp, now + attack);
      envG.gain.exponentialRampToValueAtTime(0.0001, now + attack + release);
      osc.connect(envG); envG.connect(rev.input);
      osc.start(now); lfo.start(now);
      osc.stop(now + attack + release + 0.1); lfo.stop(now + attack + release + 0.1);
    });
    const h = setTimeout(fire, 10 * beatMs);
    buriedLoops.push(h);
  }
  const initDelay = 24 * (1/45)*60*1000;
  const h = setTimeout(fire, initDelay);
  buriedLoops.push(h);
}

// ── LOOP 3: noir_guitar — :pluck, wobble (tremolo), long echo ─────────────────
const am9Notes = ['a2','c3','e3','g3','b3'];
let guitarIdx = 0;
function startNoirGuitar() {
  const beatMs = (1/45)*60*1000;
  // Simple pluck: short attack, exponential decay, karplus-strong-ish
  function fire() {
    const now = buriedCtx.currentTime;
    const shuffled = [...am9Notes].sort(()=>Math.random()-0.5);
    const note = shuffled[guitarIdx % shuffled.length]; guitarIdx++;
    const f0 = bf(note);
    const release=4, amp=0.28;
    // Pluck: noise burst convolved with resonant filter
    const bufLen = Math.floor(buriedCtx.sampleRate / f0);
    const noiseBuf = buriedCtx.createBuffer(1, bufLen, buriedCtx.sampleRate);
    const nd = noiseBuf.getChannelData(0);
    for (let i=0; i<bufLen; i++) nd[i] = Math.random()*2-1;
    // Tremolo (wobble phase:0.4 wave:saw mix:0.7) — LFO on gain
    const lfo = buriedCtx.createOscillator(); lfo.type='sawtooth'; lfo.frequency.value=1/0.4;
    const lfoG = buriedCtx.createGain(); lfoG.gain.value = 0.35;
    const tremoloBase = buriedCtx.createGain(); tremoloBase.gain.value = 0.65;
    lfo.connect(lfoG); lfoG.connect(tremoloBase.gain);
    // Echo: two delay taps
    const delay1 = buriedCtx.createDelay(4); delay1.delayTime.value = 1.5;
    const delay2 = buriedCtx.createDelay(4); delay2.delayTime.value = 3.0;
    const fb1 = buriedCtx.createGain(); fb1.gain.value = 0.35;
    const fb2 = buriedCtx.createGain(); fb2.gain.value = 0.18;
    const mixG = buriedCtx.createGain(); mixG.gain.value = 0.4;
    const envG = buriedCtx.createGain();
    envG.gain.setValueAtTime(amp, now);
    envG.gain.exponentialRampToValueAtTime(0.001, now + release);
    // Build a pluck by creating a short pitched oscillator
    const osc = buriedCtx.createOscillator(); osc.type='triangle'; osc.frequency.value=f0;
    osc.connect(envG); envG.connect(tremoloBase);
    tremoloBase.connect(buriedMaster);
    tremoloBase.connect(delay1); delay1.connect(fb1); fb1.connect(delay1);
    delay1.connect(mixG); delay2.connect(fb2); fb2.connect(delay2); delay2.connect(mixG);
    mixG.connect(buriedMaster);
    osc.start(now); lfo.start(now);
    osc.stop(now + release + 0.1); lfo.stop(now + release + 0.1);
    const h = setTimeout(fire, 3 * beatMs);
    buriedLoops.push(h);
  }
  fire();
}

// ── LOOP 4: industrial_grain — :bnoise, LPF, slicer ──────────────────────────
function startIndustrialGrain() {
  const beatMs = (1/45)*60*1000;
  function fire() {
    const now = buriedCtx.currentTime;
    const attack=8, release=8, amp=0.06;
    const rate = buriedCtx.sampleRate;
    const len = rate * (attack + release);
    const buf = buriedCtx.createBuffer(1, len, rate);
    const d = buf.getChannelData(0);
    // Brown noise (integrated white noise)
    let last=0;
    for (let i=0; i<len; i++) { last = last*0.99 + (Math.random()-0.5)*0.1; d[i]=Math.max(-1,Math.min(1,last)); }
    const src = buriedCtx.createBufferSource(); src.buffer=buf;
    const lpf = bLPF(40);
    // Slicer: LFO gating with square wave at phase:8
    const slicerLFO = buriedCtx.createOscillator(); slicerLFO.type='square'; slicerLFO.frequency.value=1/8;
    const slicerG = buriedCtx.createGain(); slicerG.gain.value=0.2;
    slicerLFO.connect(slicerG);
    const envG = buriedCtx.createGain();
    envG.gain.setValueAtTime(0, now);
    envG.gain.linearRampToValueAtTime(amp, now+attack);
    envG.gain.linearRampToValueAtTime(0, now+attack+release);
    slicerG.connect(envG.gain);
    src.connect(lpf); lpf.connect(envG); envG.connect(buriedMaster);
    src.start(now); slicerLFO.start(now);
    src.stop(now+attack+release+0.1); slicerLFO.stop(now+attack+release+0.1);
    const h = setTimeout(fire, 16 * beatMs);
    buriedLoops.push(h);
  }
  fire();
}

// ── Public crossfade API ──────────────────────────────────────────────────────
function startBuried(fadeTime=4) {
  if (buriedActive) return;
  buriedActive = true;
  initBuried();
  startHeavyBass();
  startGhostLead();
  startNoirGuitar();
  startIndustrialGrain();
  // Fade in
  buriedMaster.gain.cancelScheduledValues(buriedCtx.currentTime);
  buriedMaster.gain.setValueAtTime(0, buriedCtx.currentTime);
  buriedMaster.gain.linearRampToValueAtTime(1, buriedCtx.currentTime + fadeTime);
}

function stopBuried(fadeTime=4) {
  if (!buriedActive) return;
  buriedMaster.gain.cancelScheduledValues(buriedCtx.currentTime);
  buriedMaster.gain.setValueAtTime(buriedMaster.gain.value, buriedCtx.currentTime);
  buriedMaster.gain.linearRampToValueAtTime(0, buriedCtx.currentTime + fadeTime);
  setTimeout(() => {
    buriedLoops.forEach(h => { clearTimeout(h); clearInterval(h); });
    buriedLoops = [];
    buriedActive = false;
  }, (fadeTime + 0.5) * 1000);
}

// Apply mute/volume to both engines
const _origSetVol = window.setAudioVolume;
window.setAudioVolume = function(v, ramp=1.5) {
  if (_origSetVol) _origSetVol(v, ramp);
  if (!buriedMaster) return;
  buriedMaster.gain.cancelScheduledValues(buriedCtx.currentTime);
  buriedMaster.gain.setValueAtTime(buriedMaster.gain.value, buriedCtx.currentTime);
  buriedMaster.gain.linearRampToValueAtTime(buriedActive ? v : 0, buriedCtx.currentTime + ramp);
};

// ── The Prequels (Chapters I–VI) — Web Audio implementation ──────────────────
// Mirrors: earth_resonance, environmental_textures, the_signal,
//          steps_count, prequel_melody
// use_bpm 60  (1 beat = 1 second throughout)

let prequelCtx    = null;
let prequelMaster = null;
let prequelLoops  = [];
let prequelActive = false;
let prequelChapter = 1;   // 1–6, updated by setPrequelChapter()

// Shared context with the surface engine
function initPrequel() {
  if (prequelCtx) return;
  initAudio();   // ensure audioCtx exists
  prequelCtx    = audioCtx;
  prequelMaster = audioCtx.createGain();
  prequelMaster.gain.value = 0;
  prequelMaster.connect(audioCtx.destination);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function midiToHz(m) { return 440 * Math.pow(2, (m - 69) / 12); }

function pLPF(hz) {
  const f = prequelCtx.createBiquadFilter();
  f.type = 'lowpass'; f.frequency.value = hz; return f;
}

function pReverb(room = 0.8, mix = 0.6) {
  const c    = prequelCtx.createConvolver();
  const rate = prequelCtx.sampleRate;
  const len  = rate * (1 + room * 5);
  const buf  = prequelCtx.createBuffer(2, len, rate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++)
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 1 + room * 2);
  }
  c.buffer = buf;
  const dry = prequelCtx.createGain(); dry.gain.value = 1 - mix;
  const wet = prequelCtx.createGain(); wet.gain.value = mix;
  const out = prequelCtx.createGain();
  const inp = prequelCtx.createGain();
  inp.connect(dry); inp.connect(c); c.connect(wet);
  dry.connect(out); wet.connect(out);
  return { input: inp, output: out };
}

// ── Loop 1: earth_resonance ───────────────────────────────────────────────────
// bd_haus rate:0.25, LPF cutoff = midi(100 - chap*10), reverb 0.8/0.6, pan -0.5
// Period: 8 s
function startEarthResonance() {
  function fire() {
    const now      = prequelCtx.currentTime;
    const cutoffHz = midiToHz(100 - prequelChapter * 10);  // 1480→82 Hz over 6 chapters
    const attack   = 0.01, release = 5.5, amp = 0.7;

    // Sine body: pitch sweeps 80→30 Hz (stretched kick)
    const osc = prequelCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);

    // Transient click
    const nBuf = prequelCtx.createBuffer(1, Math.floor(prequelCtx.sampleRate * 0.05), prequelCtx.sampleRate);
    const nd   = nBuf.getChannelData(0);
    for (let i = 0; i < nd.length; i++)
      nd[i] = (Math.random() * 2 - 1) * Math.exp(-i / (nd.length * 0.12));
    const nSrc = prequelCtx.createBufferSource(); nSrc.buffer = nBuf;

    const lpf  = pLPF(cutoffHz);
    const rev  = pReverb(0.8, 0.6);
    const pan  = prequelCtx.createStereoPanner(); pan.pan.value = -0.5;
    const envG = prequelCtx.createGain();
    envG.gain.setValueAtTime(0, now);
    envG.gain.linearRampToValueAtTime(amp, now + attack);
    envG.gain.exponentialRampToValueAtTime(0.001, now + release);

    osc.connect(lpf); nSrc.connect(lpf);
    lpf.connect(rev.input); rev.output.connect(envG);
    envG.connect(pan); pan.connect(prequelMaster);

    osc.start(now);  osc.stop(now + release + 0.1);
    nSrc.start(now); nSrc.stop(now + 0.06);

    prequelLoops.push(setTimeout(fire, 8000));
  }
  fire();
}

// ── Loop 2: environmental_textures ────────────────────────────────────────────
// Pan -1.  Ch1-2: wind/hiss.  Ch3-4: bitcrushed glitch.  Ch5-6: deep bell.
// Period: 8 s
function startEnvTexture() {
  function fire() {
    const now  = prequelCtx.currentTime;
    const chap = prequelChapter;
    const pan  = prequelCtx.createStereoPanner(); pan.pan.value = -1;
    const envG = prequelCtx.createGain();
    envG.connect(pan); pan.connect(prequelMaster);

    if (chap <= 2) {
      // vinyl_hiss + loop_industrial: bandpass-filtered white noise
      const dur = 8;
      const buf = prequelCtx.createBuffer(1, prequelCtx.sampleRate * dur, prequelCtx.sampleRate);
      const d   = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.09;
      const src = prequelCtx.createBufferSource(); src.buffer = buf;
      const bpf = prequelCtx.createBiquadFilter();
      bpf.type = 'bandpass'; bpf.frequency.value = 3200; bpf.Q.value = 0.5;
      src.connect(bpf); bpf.connect(envG);
      envG.gain.setValueAtTime(0.3, now);
      envG.gain.linearRampToValueAtTime(0.08, now + dur);
      src.start(now); src.stop(now + dur + 0.1);

    } else if (chap <= 4) {
      // elec_hollow_kick + bitcrusher: 4-bit quantised noise burst
      const rate  = prequelCtx.sampleRate;
      const dur   = 3;
      const step  = Math.pow(2, -(4 - 1));   // 4-bit step size
      const buf   = prequelCtx.createBuffer(1, rate * dur, rate);
      const d     = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) {
        const raw = Math.random() * 2 - 1;
        d[i] = Math.round(raw / step) * step
             * Math.exp(-i / (rate * 0.45)) * 0.22;
      }
      const src = prequelCtx.createBufferSource(); src.buffer = buf;
      src.connect(envG);
      envG.gain.setValueAtTime(0.2, now);
      envG.gain.exponentialRampToValueAtTime(0.001, now + dur);
      src.start(now); src.stop(now + dur + 0.1);
      // one_in(3) glitch grain
      if (Math.random() < 0.33) {
        const gDur = 0.04;
        const gBuf = prequelCtx.createBuffer(1, Math.floor(rate * gDur), rate);
        const gd   = gBuf.getChannelData(0);
        for (let i = 0; i < gd.length; i++)
          gd[i] = Math.round((Math.random() * 2 - 1) / step) * step * 0.09;
        const gSrc = prequelCtx.createBufferSource(); gSrc.buffer = gBuf;
        gSrc.connect(envG);
        gSrc.start(now + 0.5 + Math.random() * 3);
      }

    } else {
      // perc_bell whammy -12: very slow, pitched-down sine bell
      // rate:0.1 on a bell ≈ fundamental ÷ 10 in time, whammy -12 ≈ freq ÷ 2
      const f0  = midiToHz(60) * 0.25;  // deeply transposed bell fundamental
      const f1  = f0 * 2.76;            // inharmonic partial
      const o1  = prequelCtx.createOscillator(); o1.type = 'sine'; o1.frequency.value = f0;
      const o2  = prequelCtx.createOscillator(); o2.type = 'sine'; o2.frequency.value = f1;
      const g1  = prequelCtx.createGain(); g1.gain.value = 0.07;
      const g2  = prequelCtx.createGain(); g2.gain.value = 0.018;
      o1.connect(g1); o2.connect(g2); g1.connect(envG); g2.connect(envG);
      envG.gain.setValueAtTime(0, now);
      envG.gain.linearRampToValueAtTime(0.1, now + 2);
      envG.gain.exponentialRampToValueAtTime(0.001, now + 7.5);
      o1.start(now); o1.stop(now + 8.1);
      o2.start(now); o2.stop(now + 8.1);
    }

    prequelLoops.push(setTimeout(fire, 8000));
  }
  fire();
}

// ── Loop 3: the_signal ────────────────────────────────────────────────────────
// A5 = 880 Hz.  Slicer probability 0.1×chap.  Reverb room 1.
// Attack 4 s, release 4 s, pan 0.3.  Period: 11 s.
function startSignalLoop() {
  function fire() {
    const now  = prequelCtx.currentTime;
    const prob = 0.1 * prequelChapter;   // slicer probability: 0.1–0.6
    const attack = 4, hold = 3, release = 4, amp = 0.2;
    const total  = attack + hold + release;

    const osc  = prequelCtx.createOscillator();
    osc.type = 'sine'; osc.frequency.value = 880;

    const rev  = pReverb(1.0, 0.65);
    const pan  = prequelCtx.createStereoPanner(); pan.pan.value = 0.3;
    const envG = prequelCtx.createGain();

    // Base envelope
    envG.gain.setValueAtTime(0, now);
    envG.gain.linearRampToValueAtTime(amp, now + attack);
    envG.gain.setValueAtTime(amp, now + attack + hold);
    envG.gain.linearRampToValueAtTime(0, now + total);

    // Slicer: interrupt amplitude at 1/8-note intervals (0.125 s at 60bpm)
    for (let t = attack; t < total - 0.25; t += 0.125) {
      if (Math.random() < prob) {
        envG.gain.setValueAtTime(0,   now + t);
        envG.gain.setValueAtTime(amp, now + t + 0.125);
      }
    }

    osc.connect(rev.input);
    rev.output.connect(envG);
    envG.connect(pan); pan.connect(prequelMaster);
    osc.start(now); osc.stop(now + total + 0.2);

    prequelLoops.push(setTimeout(fire, 11000));
  }
  fire();
}

// ── Loop 4: steps_count ───────────────────────────────────────────────────────
// bd_sub: 14 pulses × 1 s, then 2 s rest = 16 s cycle.  Pan -0.8.
function startStepsCount() {
  function fire() {
    const now = prequelCtx.currentTime;
    const pan = prequelCtx.createStereoPanner(); pan.pan.value = -0.8;
    pan.connect(prequelMaster);

    for (let s = 0; s < 14; s++) {
      const t   = now + s;
      const osc = prequelCtx.createOscillator();
      osc.type  = 'sine';
      osc.frequency.setValueAtTime(60, t);
      osc.frequency.exponentialRampToValueAtTime(28, t + 0.3);
      const g = prequelCtx.createGain();
      g.gain.setValueAtTime(0,   t);
      g.gain.linearRampToValueAtTime(0.55, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.75);
      osc.connect(g); g.connect(pan);
      osc.start(t); osc.stop(t + 0.8);
    }

    prequelLoops.push(setTimeout(fire, 16000));
  }
  fire();
}

// ── Loop 5: prequel_melody ────────────────────────────────────────────────────
// Pan 1.  Echo: 0.75 s delay, decay 6 s.  ~11.5 s period.
// Ch 1-2: :hollow   D4/A3/E4 [4,4,3]
// Ch 3-4: :dark_ambience  D4/Eb4/Gb3/D3 [2,2,2,5]
// Ch 5-6: :piano  D4/E4/F4/A4 [1,1,0.5,2.5] + G3/Bb3/D3 [2,2,1.5]

function pHollow(ctx, freq, t0, dur, amp) {
  // :hollow — slow attack, slightly detuned pair, vibrato LFO
  const atk  = Math.min(2, dur * 0.28);
  const o1   = ctx.createOscillator(); o1.type = 'sine'; o1.frequency.value = freq;
  const o2   = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = freq * 1.0028;
  const lfo  = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 3.1;
  const lfoG = ctx.createGain();       lfoG.gain.value = freq * 0.004;
  const g    = ctx.createGain();
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(amp * 0.5, t0 + atk);
  g.gain.setValueAtTime(amp * 0.5,          t0 + dur - Math.min(1.5, dur * 0.3));
  g.gain.linearRampToValueAtTime(0,          t0 + dur);
  lfo.connect(lfoG); lfoG.connect(o1.frequency);
  o1.connect(g); o2.connect(g);
  [o1, o2, lfo].forEach(x => { x.start(t0); x.stop(t0 + dur + 0.15); });
  return g;
}

function pDark(ctx, freq, t0, dur, amp) {
  // :dark_ambience — triangle + sub octave, slow attack
  const atk = Math.min(2.5, dur * 0.38);
  const o1  = ctx.createOscillator(); o1.type = 'triangle'; o1.frequency.value = freq;
  const o2  = ctx.createOscillator(); o2.type = 'sine';     o2.frequency.value = freq * 0.5;
  const g   = ctx.createGain();
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(amp * 0.48, t0 + atk);
  g.gain.setValueAtTime(amp * 0.48,           t0 + dur - 0.8);
  g.gain.linearRampToValueAtTime(0,            t0 + dur);
  o1.connect(g); o2.connect(g);
  [o1, o2].forEach(x => { x.start(t0); x.stop(t0 + dur + 0.15); });
  return g;
}

function pPiano(ctx, freq, t0, dur, amp) {
  // :piano — percussive attack, harmonic series, exponential decay
  const o1 = ctx.createOscillator(); o1.type = 'triangle'; o1.frequency.value = freq;
  const o2 = ctx.createOscillator(); o2.type = 'sine';     o2.frequency.value = freq * 2;
  const o3 = ctx.createOscillator(); o3.type = 'sine';     o3.frequency.value = freq * 3;
  const g  = ctx.createGain();
  g.gain.setValueAtTime(amp,        t0);
  g.gain.exponentialRampToValueAtTime(amp * 0.35, t0 + 0.25);
  g.gain.exponentialRampToValueAtTime(0.001,       t0 + dur);
  const g2 = ctx.createGain(); g2.gain.value = 0.14;
  const g3 = ctx.createGain(); g3.gain.value = 0.05;
  o1.connect(g); o2.connect(g2); g2.connect(g); o3.connect(g3); g3.connect(g);
  [o1, o2, o3].forEach(x => { x.start(t0); x.stop(t0 + dur + 0.15); });
  return g;
}

function startPrequelMelody() {
  function fire() {
    const now  = prequelCtx.currentTime;
    const chap = prequelChapter;
    const ctx  = prequelCtx;

    const pan  = ctx.createStereoPanner(); pan.pan.value = 1;
    pan.connect(prequelMaster);

    // Echo: 0.75 s delay, feedback 0.45, mix 0.38
    const echoDelay = ctx.createDelay(2);  echoDelay.delayTime.value = 0.75;
    const echoFB    = ctx.createGain();    echoFB.gain.value = 0.45;
    const echoMix   = ctx.createGain();    echoMix.gain.value = 0.38;
    echoDelay.connect(echoFB); echoFB.connect(echoDelay);
    echoDelay.connect(echoMix); echoMix.connect(pan);

    const rev = pReverb(0.85, 0.42);
    rev.output.connect(pan);

    // Route note output → reverb + echo
    function playNote(noteG) {
      noteG.connect(rev.input);
      noteG.connect(echoDelay);
    }

    let loopMs = 11500;

    if (chap <= 2) {
      // :hollow  D4/A3/E4  [4, 4, 3]
      [[293.66, 4], [220.00, 4], [329.63, 3]].reduce((t, [f, d]) => {
        playNote(pHollow(ctx, f, now + t, d, 0.8));
        return t + d;
      }, 0);

    } else if (chap <= 4) {
      // :dark_ambience  D4/Eb4/Gb3/D3  [2, 2, 2, 5]
      [[293.66, 2], [311.13, 2], [185.00, 2], [146.83, 5]].reduce((t, [f, d]) => {
        playNote(pDark(ctx, f, now + t, d, 1.0));
        return t + d;
      }, 0);

    } else {
      // :piano  D4/E4/F4/A4 [1,1,0.5,2.5] + G3/Bb3/D3 [2,2,1.5]
      let t = [[293.66,1],[329.63,1],[349.23,0.5],[440.00,2.5]].reduce((acc, [f, d]) => {
        playNote(pPiano(ctx, f, now + acc, d, 1.3));
        return acc + d;
      }, 0);
      t += 0.5;  // sleep 0.5
      [[196.00,2],[233.08,2],[146.83,1.5]].reduce((acc, [f, d]) => {
        playNote(pPiano(ctx, f, now + acc, d, 0.7));
        return acc + d;
      }, t);
    }

    prequelLoops.push(setTimeout(fire, loopMs));
  }
  fire();
}

// ── Public API ────────────────────────────────────────────────────────────────
function startPrequel(fadeTime = 4) {
  if (prequelActive) return;
  prequelActive = true;
  initPrequel();
  startEarthResonance();
  startEnvTexture();
  startSignalLoop();
  startStepsCount();
  startPrequelMelody();
  prequelMaster.gain.cancelScheduledValues(prequelCtx.currentTime);
  prequelMaster.gain.setValueAtTime(0,         prequelCtx.currentTime);
  prequelMaster.gain.linearRampToValueAtTime(1, prequelCtx.currentTime + fadeTime);
}

function stopPrequel(fadeTime = 4) {
  if (!prequelActive) return;
  prequelMaster.gain.cancelScheduledValues(prequelCtx.currentTime);
  prequelMaster.gain.setValueAtTime(prequelMaster.gain.value, prequelCtx.currentTime);
  prequelMaster.gain.linearRampToValueAtTime(0, prequelCtx.currentTime + fadeTime);
  setTimeout(() => {
    prequelLoops.forEach(h => { clearTimeout(h); clearInterval(h); });
    prequelLoops  = [];
    prequelActive = false;
  }, (fadeTime + 0.5) * 1000);
}

function setPrequelChapter(n) {
  // Updates chapter number (1–6); loops read it at the start of each next cycle
  prequelChapter = Math.max(1, Math.min(6, n));
}

// Extend setAudioVolume to cover prequelMaster
const _origSetVolP = window.setAudioVolume;
window.setAudioVolume = function(v, ramp = 1.5) {
  if (_origSetVolP) _origSetVolP(v, ramp);
  if (!prequelMaster) return;
  prequelMaster.gain.cancelScheduledValues(prequelCtx.currentTime);
  prequelMaster.gain.setValueAtTime(prequelMaster.gain.value, prequelCtx.currentTime);
  prequelMaster.gain.linearRampToValueAtTime(prequelActive ? v : 0, prequelCtx.currentTime + ramp);
};
