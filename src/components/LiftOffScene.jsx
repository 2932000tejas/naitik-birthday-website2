import { useEffect, useRef, useState } from 'react';
import { RocketIllustration } from './MissionControlScene.jsx';
import './lift-off.css';

const COUNTDOWN_MS = 780;

export default function LiftOffScene({ onComplete, onTone, onNarration }) {
  const [phase, setPhase] = useState('accepted');
  const [count, setCount] = useState(5);
  const [reducedMotion] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
  const completed = useRef(false);
  const completeRef = useRef(onComplete);
  const toneRef = useRef(onTone);
  const narrationRef = useRef(onNarration);
  completeRef.current = onComplete;
  toneRef.current = onTone;
  narrationRef.current = onNarration;
  const timeScale = reducedMotion ? 0.72 : 1;

  useEffect(() => {
    let timer;
    const advance = (next, delay) => { timer = window.setTimeout(() => setPhase(next), delay * timeScale); };
    if (phase === 'accepted') advance('preparing', 650);
    else if (phase === 'preparing') advance('countdown', 1300);
    else if (phase === 'ignition') advance('liftoff', 1050);
    else if (phase === 'liftoff') advance('atmosphere', 2400);
    else if (phase === 'atmosphere') advance('space', 2100);
    else if (phase === 'space') advance('arrival', 1700);
    else if (phase === 'arrival' && !completed.current) {
      advance('complete', 1800);
    } else if (phase === 'complete' && !completed.current) {
      completed.current = true;
      completeRef.current?.();
    }
    return () => window.clearTimeout(timer);
  }, [phase, timeScale]);

  useEffect(() => {
    if (phase !== 'countdown') return undefined;
    toneRef.current?.(count === 0 ? 'ignition' : 'count');
    narrationRef.current?.(`stage2-count-${count}`);
    const timer = window.setTimeout(() => {
      if (count === 0) setPhase('ignition');
      else setCount(value => value - 1);
    }, (count === 0 ? 620 : COUNTDOWN_MS) * timeScale);
    return () => window.clearTimeout(timer);
  }, [phase, count, timeScale]);

  useEffect(() => {
    if (phase === 'liftoff') toneRef.current?.('launch');
  }, [phase]);

  useEffect(() => {
    const cue = { ignition: 'stage2-ignition', liftoff: 'stage2-liftoff', atmosphere: 'stage2-atmosphere', arrival: 'stage2-arrival' }[phase];
    if (cue) narrationRef.current?.(cue);
  }, [phase]);

  const message = {
    accepted: <>COMMAND ACCEPTED<span>LAUNCH SEQUENCE INITIATED</span></>,
    preparing: <>LAUNCH PREPARATION<span>PROPULSION READY · NAVIGATION LOCKED</span></>,
    countdown: <><span className="lift-count-label">COUNTDOWN INITIATED</span><strong key={count} className="lift-count-number" aria-live="polite">{count}</strong><span>ALL SYSTEMS GO</span></>,
    ignition: <>IGNITION<span>ENGINES ONLINE</span></>,
    liftoff: <>LIFT OFF!<span>ASCENDING THROUGH THE ATMOSPHERE</span></>,
    atmosphere: <>CLEARING THE ATMOSPHERE<span>THE STARS ARE COMING INTO VIEW</span></>,
    space: <span className="lift-space-whisper">A NEW GALAXY AWAITS</span>,
    arrival: <>WE MADE IT TO SPACE!<span>THE GALAXY IS WAITING, COMMANDER.</span></>,
    complete: <>WE MADE IT TO SPACE!<span>THE GALAXY IS WAITING, COMMANDER.</span></>,
  }[phase];

  return <section className={`lift-off-scene phase-${phase}${reducedMotion ? ' reduced-motion' : ''}`}>
    <div className="lift-space-backdrop" aria-hidden="true">
      <div className="lift-stars lift-stars-far"/><div className="lift-stars lift-stars-near"/>
      <div className="lift-nebula"/><div className="lift-observation-window"><div className="lift-distant-world"/><div className="lift-world-ring"/></div>
      <div className="lift-hangar-arch"/><div className="lift-hangar-lights"><i/><i/><i/><i/><i/></div><div className="lift-hangar-rib lift-rib-left"/><div className="lift-hangar-rib lift-rib-right"/>
      <div className="lift-hangar-floor"><i/><i/><i/></div><div className="lift-atmosphere-band"/>
      <div className="lift-speed-lines"><i/><i/><i/><i/><i/></div>
    </div>
    <div className="lift-launch-status" aria-hidden="true"><span className={phase === 'accepted' ? 'active' : ''}>COMMAND</span><i/><span className={['preparing','countdown','ignition'].includes(phase) ? 'active' : ''}>PREPARE</span><i/><span className={['liftoff','atmosphere','space','arrival','complete'].includes(phase) ? 'active' : ''}>FLIGHT</span></div>
    <div className="lift-copy" key={phase} aria-live="polite" aria-atomic="true">
      {typeof message === 'string' ? <p className="lift-arrival-message">{message}</p> : <p className={phase === 'countdown' ? 'lift-count-copy' : ''}>{message}</p>}
    </div>
    <div className="lift-rocket-track" aria-label="The Mission Control rocket launching into space">
      <div className="lift-exhaust"/><div className="lift-exhaust-core"/><div className="lift-engine-vapour"/><RocketIllustration/>
    </div>
    <div className="lift-ignition-flare" aria-hidden="true"/>
    <p className="lift-stage-label" aria-hidden="true">NAITIK-006 <i>·</i> LIFT OFF!</p>
  </section>;
}
