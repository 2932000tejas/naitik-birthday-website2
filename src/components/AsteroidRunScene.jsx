import { useEffect, useRef, useState } from 'react';
import { RocketIllustration } from './MissionControlScene.jsx';
import './asteroid-run.css';

const laneNames = ['left', 'middle', 'right'];
const starLanes = [0, 1, 2, 1, 0, 2, 1, 0];
const rockLanes = [2, 0, 1, 2, 1, 0];

export default function AsteroidRunScene({ onComplete, onTone, onNarration }) {
  const [phase, setPhase] = useState('intro');
  const [lane, setLane] = useState(1);
  const [energy, setEnergy] = useState(0);
  const [items, setItems] = useState([]);
  const [bumped, setBumped] = useState(false);
  const [assist, setAssist] = useState(false);
  const [message, setMessage] = useState('The Star Gate is close. Let’s fly!');
  const laneRef = useRef(1);
  const energyRef = useRef(0);
  const itemId = useRef(0);
  const waveRef = useRef(0);
  const missedStars = useRef(0);
  const assistRef = useRef(false);
  const collected = useRef(new Set());
  const timers = useRef(new Set());
  const handoff = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const onToneRef = useRef(onTone);
  const narrationRef = useRef(onNarration);
  onCompleteRef.current = onComplete;
  onToneRef.current = onTone;
  narrationRef.current = onNarration;
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

  function later(callback, delay) {
    const timer = window.setTimeout(() => { timers.current.delete(timer); callback(); }, delay);
    timers.current.add(timer);
    return timer;
  }

  useEffect(() => {
    let active = true;
    const fallback = later(() => { if (active) setPhase('run'); }, 5900);
    Promise.resolve(narrationRef.current?.('stage4-asteroid-run')).then(() => {
      if (!active) return;
      window.clearTimeout(fallback); timers.current.delete(fallback);
      later(() => { if (active) setPhase('run'); }, reducedMotion ? 450 : 850);
    });
    return () => { active = false; window.clearTimeout(fallback); timers.current.delete(fallback); };
  }, [reducedMotion]);

  useEffect(() => {
    if (phase !== 'run') return undefined;
    const spawn = () => {
      if (energyRef.current >= 3) return;
      const wave = waveRef.current++;
      const type = wave % 2 === 0 ? 'star' : 'asteroid';
      const targetLane = type === 'star' ? starLanes[Math.floor(wave / 2) % starLanes.length] : rockLanes[Math.floor(wave / 2) % rockLanes.length];
      const id = ++itemId.current;
      setItems(current => [...current, { id, type, lane: targetLane }]);
      later(() => {
        if (collected.current.has(id)) return;
        collected.current.add(id);
        setItems(current => current.filter(item => item.id !== id));
        if (type === 'star') {
          const magnet = assistRef.current || missedStars.current >= 2;
          if (magnet || laneRef.current === targetLane) {
            const next = Math.min(energyRef.current + 1, 3);
            energyRef.current = next; setEnergy(next);
            setMessage(magnet && laneRef.current !== targetLane ? 'A star found your rocket! Energy star collected!' : 'Energy star collected! Great flying, Commander!');
            onToneRef.current?.('collect');
            narrationRef.current?.('stage4-energy-star');
            if (next >= 3) setPhase('gate');
          } else {
            missedStars.current += 1;
            setMessage(missedStars.current >= 2 ? 'A star-helper beam is ready to guide the next one!' : 'Keep steering—the next energy star is on its way!');
            if (missedStars.current >= 2) { assistRef.current = true; setAssist(true); }
          }
        } else if (laneRef.current === targetLane) {
          setBumped(true);
          setMessage('A little space bump! You’re still flying strong!');
          onToneRef.current?.('hint');
          narrationRef.current?.('stage4-asteroid-bump');
          later(() => setBumped(false), 850);
        }
      }, 2200);
      later(() => { collected.current.add(id); setItems(current => current.filter(item => item.id !== id)); }, 4300);
    };
    spawn();
    const interval = window.setInterval(spawn, 1450);
    return () => { window.clearInterval(interval); timers.current.forEach(window.clearTimeout); timers.current.clear(); };
  }, [phase]);

  useEffect(() => {
    if (phase !== 'gate') return undefined;
    narrationRef.current?.('stage4-gate');
    const timer = later(() => setPhase('portal'), reducedMotion ? 1200 : 1750);
    return () => { window.clearTimeout(timer); timers.current.delete(timer); };
  }, [phase, reducedMotion]);

  useEffect(() => {
    if (phase !== 'portal' || handoff.current) return undefined;
    const timer = later(() => {
      if (handoff.current) return;
      handoff.current = true;
      onCompleteRef.current?.();
    }, reducedMotion ? 1200 : 3300);
    return () => { window.clearTimeout(timer); timers.current.delete(timer); };
  }, [phase, reducedMotion]);

  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);

  function steer(direction) {
    if (phase !== 'run') return;
    const next = Math.max(0, Math.min(2, laneRef.current + direction));
    if (next === laneRef.current) return;
    laneRef.current = next; setLane(next); onToneRef.current?.('tap');
  }

  function handleKeyDown(event) {
    if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') { event.preventDefault(); steer(-1); }
    if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') { event.preventDefault(); steer(1); }
  }

  return <section className={`asteroid-run ar-${phase}${reducedMotion ? ' ar-reduced-motion' : ''}`} tabIndex={0} onKeyDown={handleKeyDown} aria-label="Asteroid Run: steer the rocket and collect three energy stars">
    <div className="ar-space" aria-hidden="true"><i className="ar-stars ar-far"/><i className="ar-stars ar-near"/><i className="ar-nebula"/><i className="ar-horizon"/></div>
    <header className="ar-header"><p className="ar-eyebrow">NAITIK-006 <i>·</i> FINAL FLIGHT</p><div className="ar-energy" role="status" aria-label={`${energy} of 3 energy stars collected`}><span>STAR GATE ENERGY</span>{[0, 1, 2].map(index => <i key={index} className={index < energy ? 'charged' : ''}>✦</i>)}</div></header>
    {(phase === 'intro' || phase === 'run') && <>
      <div className="ar-story"><p className="ar-step">FINAL MISSION · ASTEROID RUN</p><h1>POWER THE STAR GATE</h1><p>{phase === 'intro' ? 'Steer around asteroids, collect three energy stars, and power the gate!' : message}</p><span className="ar-control-hint">Use ← → keys or the big steering buttons</span></div>
      <div className={`ar-flight ${bumped ? 'is-bumped' : ''}`}>
        <div className="ar-lane-lines" aria-hidden="true"><i/><i/><i/></div><div className="ar-flight-glow"/>
        {items.map(item => <i key={item.id} className={`ar-flight-item ${item.type} lane-${item.lane}`} aria-hidden="true">{item.type === 'star' ? '✦' : <b/>}</i>)}
        <div className={`ar-player-rocket lane-${lane}`}><div className="ar-engine-trail"/><RocketIllustration/></div>
        {assist && <span className="ar-helper-beam" aria-hidden="true"/>}
        <div className="ar-flight-floor"/>
      </div>
      {phase === 'run' && <div className="ar-controls"><button type="button" onClick={() => steer(-1)} aria-label="Steer rocket left" disabled={lane === 0}>← <span>LEFT</span></button><p>{message}</p><button type="button" onClick={() => steer(1)} aria-label="Steer rocket right" disabled={lane === 2}><span>RIGHT</span> →</button></div>}
    </>}
    {(phase === 'gate' || phase === 'portal') && <div className="ar-gate-sequence" aria-live="polite"><div className="ar-open-gate"><i/><i/><b/><span>✦</span></div><div className="ar-gate-rocket"><RocketIllustration/></div><p className="ar-step">{phase === 'gate' ? 'ENERGY TRANSFER IN PROGRESS' : 'PORTAL OPEN'}</p><h1>{phase === 'gate' ? 'STAR GATE POWERED!' : 'FLYING TO YOUR BIRTHDAY GALAXY…'}</h1><p>{phase === 'gate' ? 'You did it, Commander! The way is open.' : 'A special destination is waiting beyond the stars.'}</p></div>}
    <footer className="ar-footer">{phase === 'run' ? 'NO TIMER · KEEP FLYING AT YOUR OWN PACE' : 'COMMANDER NAITIK · GALAXY EXPLORER'}</footer>
  </section>;
}
