import { useCallback, useEffect, useRef } from 'react';

const base = import.meta.env.BASE_URL;
const availability = new Map();
const lines = {
  'stage1-welcome': ['stage1-welcome.mp3', 'Commander Naitik, we have been waiting for you! Your special birthday mission is about to begin.'],
  'stage2-count-5': [null, 'Five.'], 'stage2-count-4': [null, 'Four.'],
  'stage2-count-3': [null, 'Three.'], 'stage2-count-2': [null, 'Two.'],
  'stage2-count-1': [null, 'One.'], 'stage2-count-0': [null, 'Zero!'],
  'stage2-ignition': ['stage2-ignition.mp3', 'Engines glowing… ignition!'],
  'stage2-liftoff': ['stage2-liftoff.mp3', 'Lift off, Commander! We are soaring into space!'],
  'stage2-atmosphere': ['stage2-atmosphere.mp3', 'The sky is glowing. The stars are coming into view!'],
  'stage2-arrival': ['stage2-arrival.mp3', 'We made it to space! The galaxy is waiting, Commander.'],
  'stage3-signal': ['stage3-signal.mp3', 'Commander Naitik, three worlds may hold the clues. Let’s explore!'],
  'stage3-world-1': ['stage3-wonder-world.mp3', 'Welcome to Wonder World! Which planet has beautiful rings?'],
  'stage3-world-2': ['stage3-rocket-forge.mp3', 'Welcome to Rocket Forge! Tap a rocket part, then its matching place.'],
  'stage3-world-3': ['stage3-pixel-planet.mp3', 'Welcome to Pixel Planet! Look at the pattern and choose what comes next.'],
  'stage3-success-1': ['stage3-encouragement.mp3', 'Amazing, Commander! You found a star fragment!'],
  'stage3-success-2': ['stage3-rocket-ready.mp3', 'Rocket ready! You are an amazing space engineer!'],
  'stage3-success-3': ['stage3-pattern-solved.mp3', 'Brilliant thinking! You solved the pattern!'],
  'stage3-hint': ['stage3-hint.mp3', 'Good try! Take another look. You can do it!'],
  'stage4-asteroid-run': ['stage4-asteroid-run.mp3', 'Commander Naitik, the Star Gate is almost within reach! Steer your rocket, collect three energy stars, and power up the gate!'],
  'stage4-energy-star': ['stage4-energy-star.mp3', 'Energy star collected! Great flying, Commander!'],
  'stage4-asteroid-bump': ['stage4-asteroid-bump.mp3', 'A little space bump! Keep steering, Commander!'],
  'stage4-gate': ['stage4-gate.mp3', 'The Star Gate is powered! Let’s fly through!'],
  'stage5-reveal': ['stage5-birthday-reveal.mp3', 'You did it, Commander! Your birthday galaxy is glowing just for you. Happy sixth birthday, Naitik!'],
};

function clipExists(url) {
  if (!availability.has(url)) {
    const check = fetch(url, { method: 'HEAD' }).then(response => response.ok).catch(() => false);
    availability.set(url, check);
  }
  return availability.get(url);
}

export default function useNarration({ muted, mutedRef, ambienceRef, musicAllowedRef }) {
  const audioRef = useRef(null);
  const speechRef = useRef(null);
  const finishRef = useRef(null);
  const volumeBeforeRef = useRef(.32);
  const timeoutRef = useRef(null);

  const stopNarration = useCallback(() => {
    const audio = audioRef.current;
    if (audio) { audio.pause(); audio.onended = null; audio.onerror = null; audio.oncanplay = null; }
    if (speechRef.current && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    speechRef.current = null;
    window.clearTimeout(timeoutRef.current);
    const finish = finishRef.current;
    finishRef.current = null;
    if (finish) finish('stopped');
    const engine = ambienceRef.current;
    if (engine && musicAllowedRef.current) engine.musicBus.gain.setTargetAtTime(volumeBeforeRef.current, engine.ctx.currentTime, .3);
  }, [ambienceRef, musicAllowedRef]);

  const playNarration = useCallback((id) => {
    stopNarration();
    if (mutedRef.current) return Promise.resolve('muted');
    const line = lines[id];
    if (!line) return Promise.resolve('missing-line');
    const engine = ambienceRef.current;
    if (engine && musicAllowedRef.current) {
      volumeBeforeRef.current = engine.musicBus.gain.value || .32;
      engine.musicBus.gain.setTargetAtTime(.045, engine.ctx.currentTime, .15);
    }
    return new Promise(resolve => {
      let settled = false;
      let fallingBack = false;
      const done = status => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeoutRef.current);
        const audio = audioRef.current;
        if (audio) { audio.onended = null; audio.onerror = null; audio.oncanplay = null; }
        if (speechRef.current) { speechRef.current.onend = null; speechRef.current.onerror = null; speechRef.current = null; }
        finishRef.current = null;
        if (engine && musicAllowedRef.current) engine.musicBus.gain.setTargetAtTime(volumeBeforeRef.current, engine.ctx.currentTime, .3);
        resolve(status);
      };
      const speakFallback = () => {
        if (fallingBack) return;
        fallingBack = true;
        if (settled || mutedRef.current) { done('muted'); return; }
        if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') { done('unavailable'); return; }
        const utterance = new SpeechSynthesisUtterance(line[1]);
        utterance.rate = .91; utterance.pitch = 1.04; utterance.volume = .86;
        speechRef.current = utterance;
        utterance.onend = () => done('spoken');
        utterance.onerror = () => done('unavailable');
        window.speechSynthesis.speak(utterance);
        timeoutRef.current = window.setTimeout(() => done('timeout'), Math.max(4500, line[1].length * 95));
      };
      finishRef.current = done;
      if (!line[0]) { speakFallback(); return; }
      const url = `${base}assets/audio/narration/${line[0]}`;
      timeoutRef.current = window.setTimeout(speakFallback, 1400);
      clipExists(url).then(exists => {
        if (settled || fallingBack) return;
        if (!exists) { window.clearTimeout(timeoutRef.current); speakFallback(); return; }
        window.clearTimeout(timeoutRef.current);
        let audio = audioRef.current;
        if (!audio) { audio = new Audio(); audio.preload = 'none'; audioRef.current = audio; }
        audio.src = url;
        audio.volume = .9;
        audio.muted = mutedRef.current;
        audio.onended = () => done('recorded');
        audio.onerror = speakFallback;
        audio.play().catch(speakFallback);
      });
    });
  }, [ambienceRef, mutedRef, musicAllowedRef, stopNarration]);

  useEffect(() => { if (muted) stopNarration(); }, [muted, stopNarration]);
  useEffect(() => () => stopNarration(), [stopNarration]);
  return { playNarration, stopNarration };
}
