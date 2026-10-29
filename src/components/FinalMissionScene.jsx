import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { RocketIllustration } from './MissionControlScene.jsx';
import './final-mission.css';

const rocketParts = ['nose', 'body', 'engine'];
const partLabels = { nose: 'Nose cone', body: 'Rocket body', engine: 'Engine' };
const answers = [
  { id: 'star', label: 'Star', symbol: '✦' },
  { id: 'planet', label: 'Planet', symbol: '◉' },
  { id: 'rocket', label: 'Rocket', symbol: 'rocket' },
];

function BirthdaySignal({ fragments }) {
  return <div className="fm-signal-status" role="status" aria-label={`Birthday Signal reconstructed, ${fragments.length} of 3 fragments`}>
    <span className="fm-signal-caption">BIRTHDAY SIGNAL</span>
    <div className="fm-signal-fragments" aria-hidden="true">{[0, 1, 2].map(n => <i key={n} className={fragments.includes(n) ? 'lit' : ''}>✦</i>)}</div>
    <span className="fm-signal-caption">RECONSTRUCTED · {fragments.length}/3</span>
    <b className="fm-signal-orbit" aria-hidden="true"><i/><i/><i/></b>
  </div>;
}

function PieceGlyph({ part }) {
  return <span className={`fm-piece-glyph glyph-${part}`} aria-hidden="true"/>;
}

function RocketAssembly({ assembled, selected, hint, wrongTarget, ready, onPick, onPlace }) {
  return <div className="fm-assembly-board">
    <div className={`fm-rocket-reference ${assembled.length === 3 ? 'rocket-ready' : ''}`}><i className="fm-rocket-outline"/><RocketIllustration/><span className="fm-engine-light"/></div>
    <div className="fm-target-list" role="group" aria-label="Rocket assembly positions">
      {rocketParts.map((part, index) => <button type="button" key={part} className={`fm-target target-${part} ${assembled.includes(part) ? 'placed' : ''} ${selected === part ? 'target-selected' : ''} ${wrongTarget === part ? 'target-hint' : ''}`} onClick={() => onPlace(part)} disabled={!ready} aria-label={`Place ${partLabels[part]} ${part === 'nose' ? 'at the top' : part === 'body' ? 'in the middle' : 'at the bottom'}`}>
        <PieceGlyph part={part}/><span><b>0{index + 1}</b>{part === 'nose' ? 'NOSE' : part === 'body' ? 'BODY' : 'ENGINE'}</span><i className="fm-slot-status">{assembled.includes(part) ? 'LOCKED' : 'PLACE'}</i>
      </button>)}
    </div>
    <p className="fm-assembly-hint" role="status" aria-live="polite">{hint}</p>
  </div>;
}

function StarGate({ mode, onAnswer, wrongAnswer }) {
  const open = ['gate-opening', 'mission-complete', 'portal-transition'].includes(mode);
  return <div className={`fm-gate-visual ${open ? 'gate-open' : ''} ${mode === 'portal-transition' ? 'portal-departure' : ''}`} aria-label="A glowing three-node star gate">
    <div className="fm-gate-halo"/><div className="fm-gate-outer-ring"/><div className="fm-gate-inner-ring"/><div className="fm-gate-core"><i/><b/></div>
    <div className="fm-gate-link link-one"/><div className="fm-gate-link link-two"/>
    {answers.map((answer, index) => {
      const className = `fm-gate-node node-${answer.id} ${mode === 'gate-opening' || mode === 'mission-complete' || mode === 'portal-transition' ? 'node-lit' : ''} ${wrongAnswer === answer.id ? 'node-wrong' : ''}`;
      const nodeContent = <><span>{answer.symbol === 'rocket' ? <RocketIllustration/> : answer.symbol}</span><small>{answer.label}</small></>;
      return mode === 'gate'
        ? <button type="button" key={answer.id} className={className} onClick={() => onAnswer(answer.id)} aria-label={`Choose ${answer.label}`}><b className="fm-node-order">0{index + 1}</b>{nodeContent}</button>
        : <div key={answer.id} className={className} aria-hidden="true"><b className="fm-node-order">0{index + 1}</b>{nodeContent}</div>;
    })}
    <div className="fm-gate-sparks" aria-hidden="true"><i/><i/><i/><i/><i/></div>
  </div>;
}

export default function FinalMissionScene({ fragments = [], onTone, onComplete }) {
  const [mode, setMode] = useState('intro');
  const [introBeat, setIntroBeat] = useState(0);
  const [assembled, setAssembled] = useState([]);
  const [selectedPart, setSelectedPart] = useState('');
  const [wrongTarget, setWrongTarget] = useState('');
  const [assemblyHint, setAssemblyHint] = useState('Tap a part, then its matching place on the rocket.');
  const [wrongAnswer, setWrongAnswer] = useState('');
  const [gateHint, setGateHint] = useState('');
  const awardedAssembly = useRef(false);
  const gateSolved = useRef(false);
  const handoffStarted = useRef(false);
  const onToneRef = useRef(onTone);
  const onCompleteRef = useRef(onComplete);
  onToneRef.current = onTone;
  onCompleteRef.current = onComplete;
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

  useLayoutEffect(() => { window.scrollTo(0, 0); }, [mode]);

  useEffect(() => {
    const timers = [];
    const later = (fn, delay) => {
      const timer = window.setTimeout(fn, reducedMotion ? Math.max(550, delay * 0.62) : delay);
      timers.push(timer);
      return timer;
    };
    if (mode === 'intro') {
      later(() => { setIntroBeat(1); onToneRef.current?.('signal'); }, 760);
      later(() => setIntroBeat(2), 1900);
      later(() => setMode('assembly'), 3400);
      return () => timers.forEach(window.clearTimeout);
    }
    const durations = {
      'assembly-complete': 2450,
      'to-gate': 1550,
      'gate-opening': 5200,
      'mission-complete': 3900,
      'portal-transition': 2400,
    };
    if (mode === 'gate-opening') later(() => onToneRef.current?.('portal'), 500);
    if (mode === 'portal-transition' && !handoffStarted.current) {
      later(() => {
        if (handoffStarted.current) return;
        handoffStarted.current = true;
        onCompleteRef.current?.();
      }, reducedMotion ? 1200 : durations[mode]);
    } else if (durations[mode]) {
      later(() => {
        if (mode === 'assembly-complete') setMode('to-gate');
        else if (mode === 'to-gate') setMode('gate');
        else if (mode === 'gate-opening') setMode('mission-complete');
        else if (mode === 'mission-complete') setMode('portal-transition');
      }, durations[mode]);
    }
    return () => timers.forEach(window.clearTimeout);
  }, [mode, reducedMotion]);

  useEffect(() => {
    if (!wrongTarget) return undefined;
    const timer = window.setTimeout(() => setWrongTarget(''), 800);
    return () => window.clearTimeout(timer);
  }, [wrongTarget]);

  useEffect(() => {
    if (!wrongAnswer) return undefined;
    const timer = window.setTimeout(() => setWrongAnswer(''), 900);
    return () => window.clearTimeout(timer);
  }, [wrongAnswer]);

  const pickPart = part => {
    if (mode !== 'assembly' || assembled.includes(part)) return;
    setSelectedPart(part);
    setWrongTarget('');
    setAssemblyHint(`Now place the ${partLabels[part].toLowerCase()} on the rocket.`);
  };

  const placePart = target => {
    if (mode !== 'assembly' || !selectedPart || assembled.includes(target)) {
      if (mode === 'assembly' && !selectedPart) setAssemblyHint('Choose a rocket part first, then tap its matching place.');
      return;
    }
    if (selectedPart !== target) {
      setWrongTarget(target);
      setAssemblyHint('Almost there! Look at the shape of the rocket.');
      setSelectedPart('');
      onToneRef.current?.('hint');
      return;
    }
    const next = [...assembled, target];
    setAssembled(next);
    setSelectedPart('');
    onToneRef.current?.('part');
    if (next.length === 3 && !awardedAssembly.current) {
      awardedAssembly.current = true;
      setAssemblyHint('Rocket ready! You’re an amazing space engineer!');
      onToneRef.current?.('success');
      setMode('assembly-complete');
    } else setAssemblyHint(`${partLabels[target]} snapped into place!`);
  };

  const answerGate = answer => {
    if (mode !== 'gate' || gateSolved.current) return;
    if (answer !== 'planet') {
      setWrongAnswer(answer);
      setGateHint('Look at the pattern: Star, Planet, Star… what should come next?');
      onToneRef.current?.('hint');
      return;
    }
    gateSolved.current = true;
    setWrongAnswer('');
    setGateHint('You did it, Commander! The star gate is opening!');
    onToneRef.current?.('gate');
    setMode('gate-opening');
  };

  const intro = mode === 'intro';
  const assemblyMode = mode === 'assembly' || mode === 'assembly-complete' || mode === 'to-gate';
  const gateMode = mode === 'gate' || mode === 'gate-opening' || mode === 'mission-complete' || mode === 'portal-transition';
  const missionStep = mode === 'assembly-complete' || mode === 'to-gate' ? 'CHALLENGE 1 COMPLETE' : mode === 'intro' || mode === 'assembly' ? 'CHALLENGE 1 OF 2' : mode === 'gate' ? 'CHALLENGE 2 OF 2' : mode === 'gate-opening' ? 'CHALLENGE 2 COMPLETE' : 'ALL SYSTEMS READY';
  const heading = mode === 'intro' ? 'BEGIN YOUR MISSION!' : mode === 'assembly' ? 'CHALLENGE 1: BUILD YOUR ROCKET' : mode === 'assembly-complete' ? 'CHALLENGE 1 COMPLETE' : mode === 'to-gate' ? 'THE STAR GATE AWAITS' : mode === 'gate' ? 'CHALLENGE 2: NAVIGATE THE STAR GATE' : mode === 'gate-opening' ? 'CHALLENGE 2 COMPLETE' : mode === 'mission-complete' ? 'MISSION COMPLETE, COMMANDER!' : 'A SPECIAL DESTINATION AWAITS…';

  return <section className={`final-mission fm-${mode}${reducedMotion ? ' fm-reduced-motion' : ''}`} aria-labelledby="fm-heading">
    <div className="fm-space" aria-hidden="true"><i className="fm-space-stars far"/><i className="fm-space-stars near"/><i className="fm-nebula"/><i className="fm-light-sweep"/></div>
    <div className="fm-topline"><span className="fm-brandline">NAITIK-006 <i>·</i> FINAL MISSION</span><BirthdaySignal fragments={fragments}/></div>
    <div className={`fm-gate-backdrop ${gateMode || intro ? 'visible' : ''}`} aria-hidden={mode === 'gate'}><div className="fm-backdrop-ring ring-a"/><div className="fm-backdrop-ring ring-b"/><div className="fm-backdrop-nodes"><i/><i/><i/></div></div>

    {intro && <div className="fm-intro-content">
      <div className="fm-intro-signal"><i/><b/><span>✦</span><em/></div>
      <p className="fm-eyebrow">{introBeat > 0 ? 'SIGNAL VERIFIED' : 'BIRTHDAY SIGNAL · RECONSTRUCTED'}</p>
      <h1 id="fm-heading">{introBeat > 0 ? 'BEGIN YOUR MISSION!' : 'FINAL MISSION AVAILABLE'}</h1>
      {introBeat > 0 && <p className="fm-intro-copy">Commander Naitik, the signal has unlocked a secret star gate!</p>}
      {introBeat > 1 && <p className="fm-intro-copy fm-intro-second">Complete two final challenges to open the way!</p>}
      <div className="fm-intro-rocket"><RocketIllustration/></div>
    </div>}

    {assemblyMode && <div className={`fm-mission-layout fm-assembly-layout ${mode === 'to-gate' ? 'fm-leaving' : ''}`}>
      <div className="fm-mission-copy">
        <p className="fm-eyebrow">FINAL MISSION <i>·</i> {missionStep}</p>
        <h1 id="fm-heading">{heading}</h1>
        <p className="fm-story-copy">{mode === 'assembly' ? 'Commander, let’s get your rocket ready for the final journey!' : mode === 'assembly-complete' ? 'The rocket is ready. The Birthday Signal is guiding the way!' : 'The star gate is growing brighter…'}</p>
        <p className="fm-instruction">{mode === 'assembly' ? 'Tap a part, then tap its matching place on the rocket.' : mode === 'assembly-complete' ? 'CHALLENGE 1 COMPLETE' : 'TRAVELLING TO THE STAR GATE'}</p>
        <div className="fm-assembly-controls">
          <RocketAssembly assembled={assembled} selected={selectedPart} hint={assemblyHint} wrongTarget={wrongTarget} ready={mode === 'assembly'} onPick={pickPart} onPlace={placePart}/>
          <div className="fm-part-tray" role="group" aria-label="Choose a rocket component">
            {rocketParts.map((part, index) => <button type="button" key={part} className={`fm-part-choice ${selectedPart === part ? 'selected' : ''} ${assembled.includes(part) ? 'placed' : ''}`} onClick={() => pickPart(part)} disabled={mode !== 'assembly' || assembled.includes(part)} aria-pressed={selectedPart === part}>
              <span className="fm-part-number">0{index + 1}</span><PieceGlyph part={part}/><span>{partLabels[part]}</span><i>{assembled.includes(part) ? 'IN PLACE' : selectedPart === part ? 'SELECTED' : 'TAP TO PICK'}</i>
            </button>)}
          </div>
        </div>
      </div>
      <div className="fm-assembly-atmosphere" aria-hidden="true"><div className="fm-assembly-platform"/><div className="fm-assembly-particles"><i/><i/><i/><i/></div></div>
      {mode === 'assembly-complete' && <div className="fm-energy-pulse" aria-hidden="true"/>}
    </div>}

    {gateMode && <div className={`fm-mission-layout fm-gate-layout fm-gate-state-${mode}`}>
      <div className="fm-mission-copy fm-gate-copy">
        <p className="fm-eyebrow">FINAL MISSION <i>·</i> {missionStep}</p>
        <h1 id="fm-heading">{heading}</h1>
        {mode === 'gate' ? <>
          <p className="fm-story-copy">The gate follows a pattern. Can you light the stars in the right order?</p>
          <div className="fm-pattern-question">
            <span className="fm-pattern-label">WHICH SYMBOL COMES NEXT?</span>
            <div className="fm-pattern" aria-label="Star, Planet, Star, missing symbol"><span className="pattern-star">✦</span><b>→</b><span className="pattern-planet">◉</span><b>→</b><span className="pattern-star">✦</span><b>→</b><strong>?</strong></div>
          </div>
          <p className="fm-instruction">Choose the next symbol on the gate.</p>
          {gateHint && <p className="fm-feedback" role="status" aria-live="polite">{gateHint}</p>}
        </> : mode === 'gate-opening' ? <><p className="fm-story-copy">You did it, Commander! The star gate is opening!</p><p className="fm-instruction">CHALLENGE 2 COMPLETE</p></> : mode === 'mission-complete' ? <><p className="fm-story-copy">You’ve unlocked a very special destination…</p><p className="fm-instruction">THE BIRTHDAY SIGNAL IS LEADING THE WAY</p></> : <><p className="fm-story-copy">The portal is ready. Your next adventure is just beyond the light.</p><p className="fm-instruction">MISSION COMPLETE · TRANSIT INITIATED</p></>}
      </div>
      <div className="fm-gate-stage">
        <StarGate mode={mode} onAnswer={answerGate} wrongAnswer={wrongAnswer}/>
        <div className="fm-gate-rocket"><RocketIllustration/></div>
        <div className="fm-gate-signal"><span>✦</span><i/><b/></div>
        {wrongAnswer && mode === 'gate' && <span className="fm-wrong-note" role="status">Try another star node</span>}
      </div>
    </div>}
    <p className="fm-scene-footer">NAITIK-006 <i>·</i> {mode === 'intro' ? 'SIGNAL VERIFIED' : mode === 'assembly' || mode === 'assembly-complete' ? 'BIRTHDAY ROCKET' : 'STAR GATE NAVIGATION'}</p>
  </section>;
}
