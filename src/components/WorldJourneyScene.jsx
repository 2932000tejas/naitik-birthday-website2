import { useEffect, useRef, useState } from 'react';
import { RocketIllustration } from './MissionControlScene.jsx';
import RocketAssemblyChallenge from './RocketAssemblyChallenge.jsx';
import './world-journey.css';

const destinations = [
  {
    name: 'Wonder World',
    line: 'A universe full of planets, stars, and amazing discoveries!',
    question: 'Which planet is famous for its beautiful rings?',
  },
  {
    name: 'Rocket Forge',
    line: 'Every great space explorer needs a rocket!',
    question: 'Build the explorer rocket, one piece at a time.',
  },
  {
    name: 'Pixel Planet',
    line: 'A world where computers, patterns, and imagination come alive!',
    question: 'What comes next?',
  },
];

function MissionSignal({ fragments }) {
  return <div className="jw-signal-device" role="status" aria-live="polite" aria-label={`Birthday signal, ${fragments.length} of 3 star fragments collected`}>
    <span className="jw-signal-label">BIRTHDAY SIGNAL</span>
    <div className="jw-signal-stars" aria-hidden="true">{[0, 1, 2].map(n => <span key={n} className={fragments.includes(n) ? 'lit' : ''}>✦</span>)}</div>
    <span className="jw-signal-count">STAR FRAGMENTS {fragments.length} / 3</span>
  </div>;
}

function WorldArt({ world }) {
  return <div className={`jw-art jw-art-${world}`} aria-hidden="true">
    <div className="jw-art-stars">{Array.from({ length: 13 }, (_, i) => <i key={i} style={{ left: `${(i * 47 + 9) % 95}%`, top: `${(i * 61 + 7) % 87}%`, width: `${2 + i % 2}px`, height: `${2 + i % 2}px`, animationDuration: `${2.3 + i * 0.17}s` }} />)}</div>
    {world === 0 && <>
      <div className="jw-orbit jw-orbit-one"/><div className="jw-orbit jw-orbit-two"/>
      <div className="jw-saturn"><span className="jw-saturn-light"/><i className="jw-saturn-ring"/><i className="jw-saturn-ring jw-saturn-ring-back"/></div>
      <div className="jw-moon"/><div className="jw-small-planet"/><span className="jw-art-star star-a">✦</span><span className="jw-art-star star-b">✧</span>
    </>}
    {world === 1 && <>
      <div className="jw-forge-window"><i/><i/><i/></div><div className="jw-bench"/><div className="jw-robot-arm"><i/><b/></div>
      <span className="jw-work-light work-a"/><span className="jw-work-light work-b"/><span className="jw-work-light work-c"/>
    </>}
    {world === 2 && <>
      <div className="jw-circuit circuit-a"/><div className="jw-circuit circuit-b"/>
      <div className="jw-pixel-planet">{Array.from({ length: 25 }, (_, i) => <i key={i} className={`tile-${i}`} />)}</div>
      <span className="jw-data-bit bit-a"/><span className="jw-data-bit bit-b"/><span className="jw-art-star star-a">✦</span>
    </>}
  </div>;
}

export default function WorldJourneyScene({ onComplete, onFragment, onTone, onNarration }) {
  const [mode, setMode] = useState('signal');
  const [introBeat, setIntroBeat] = useState(0);
  const [world, setWorld] = useState(0);
  const [entranceReady, setEntranceReady] = useState(false);
  const [fragments, setFragments] = useState([]);
  const [wrongChoice, setWrongChoice] = useState('');
  const [hint, setHint] = useState('');
  const [pixelAnswer, setPixelAnswer] = useState('');
  const awarded = useRef(new Set());
  const completed = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const onFragmentRef = useRef(onFragment);
  const onToneRef = useRef(onTone);
  const narrationRef = useRef(onNarration);
  onCompleteRef.current = onComplete;
  onFragmentRef.current = onFragment;
  onToneRef.current = onTone;
  narrationRef.current = onNarration;
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

  useEffect(() => {
    const timers = [];
    const later = (fn, delay) => timers.push(window.setTimeout(fn, reducedMotion ? Math.max(550, delay * 0.58) : delay));
    if (mode === 'signal') {
      narrationRef.current?.('stage3-signal');
      later(() => { onToneRef.current?.('signal'); setIntroBeat(1); }, 950);
      later(() => setIntroBeat(2), 2150);
      later(() => setIntroBeat(3), 3650);
      later(() => { setMode('world'); setWorld(0); }, 6500);
    } else if (mode === 'world') {
      setEntranceReady(false);
      later(() => setEntranceReady(true), 1150);
    } else if (mode === 'collect') {
      later(() => setMode(world === 2 ? 'reassembly' : 'travel'), 2750);
    } else if (mode === 'travel') {
      later(() => {
        setWorld(value => Math.min(value + 1, 2));
        setWrongChoice('');
        setHint('');
        setMode('world');
      }, 1650);
    } else if (mode === 'reassembly') {
      later(() => onToneRef.current?.('reassembly'), 450);
      later(() => setMode('complete'), 5000);
    } else if (mode === 'complete' && !completed.current) {
      later(() => {
        if (completed.current) return;
        completed.current = true;
        onCompleteRef.current?.();
      }, 3800);
    }
    return () => timers.forEach(window.clearTimeout);
  }, [mode, world, reducedMotion]);

  useEffect(() => {
    if (mode === 'world' && entranceReady) narrationRef.current?.(`stage3-world-${world + 1}`);
  }, [mode, world, entranceReady]);

  const awardFragment = () => {
    if (awarded.current.has(world) || mode !== 'world') return;
    awarded.current.add(world);
    setFragments(current => current.includes(world) ? current : [...current, world]);
    onFragmentRef.current?.(world);
    onToneRef.current?.('collect');
    narrationRef.current?.(`stage3-success-${world + 1}`);
    setHint('');
    setMode('collect');
  };

  const answerWonder = choice => {
    if (!entranceReady || mode !== 'world') return;
    if (choice === 'Saturn') { setWrongChoice(''); awardFragment(); return; }
    setWrongChoice(choice);
    setHint('Look for the planet with the giant rings!');
    onToneRef.current?.('hint');
    narrationRef.current?.('stage3-hint');
  };

  const answerPixel = choice => {
    if (!entranceReady || mode !== 'world') return;
    if (choice === 'square') { setPixelAnswer(choice); awardFragment(); return; }
    setPixelAnswer(choice);
    setHint('Look closely! The shapes are taking turns.');
    onToneRef.current?.('hint');
    narrationRef.current?.('stage3-hint');
  };

  const isDestination = mode === 'world' || mode === 'collect' || mode === 'travel';
  const successText = world === 0
    ? 'Amazing, Commander! You discovered a star fragment!'
    : world === 1
      ? 'Rocket assembled! You’re an amazing space engineer!'
      : 'Brilliant thinking, Commander! You solved the pattern!';

  return <section className={`world-journey mode-${mode} jw-world-${world}${reducedMotion ? ' jw-reduced-motion' : ''}`} aria-live="off">
    <div className="jw-deep-space" aria-hidden="true"><i className="jw-parallax jw-far-stars"/><i className="jw-parallax jw-near-stars"/><i className="jw-nebula"/><i className="jw-atmosphere"/></div>
    <div className="jw-topline"><span className="jw-mission-mark">NAITIK-006 <i>·</i> GALAXY EXPLORATION</span><MissionSignal fragments={fragments}/></div>

    {mode === 'signal' && <div className="jw-intro" aria-live="polite" aria-atomic="true">
      <div className="jw-arrival-rocket"><RocketIllustration/></div><div className="jw-signal-beacon"><i/><b/><span/></div>
      <p className="jw-transmission-label">{introBeat >= 1 ? 'INCOMING TRANSMISSION' : 'DEEP SPACE · EXPLORATION VIEW'}</p>
      <h1>{introBeat >= 2 ? 'UNKNOWN SIGNAL DETECTED' : 'A new signal is calling…'}</h1>
      {introBeat >= 2 && <p className="jw-intro-copy">Commander Naitik, we’ve discovered a mysterious signal somewhere in this galaxy!</p>}
      {introBeat >= 3 && <p className="jw-intro-copy jw-intro-last">Three worlds may hold the clues. Let’s explore!</p>}
    </div>}

    {isDestination && <>
      {mode === 'travel' && <div className="jw-travel-rocket" aria-hidden="true"><RocketIllustration/></div>}
      <div className="jw-destination" key={`destination-${world}`}>
        <div className="jw-world-copy">
          <p className="jw-destination-label">DESTINATION 0{world + 1}</p>
          <h1>{destinations[world].name}</h1>
          <p className="jw-world-intro">{destinations[world].line}</p>
          <div className={`jw-challenge ${entranceReady ? 'ready' : ''}`} aria-live="polite">
            {world === 0 && <>
              <p className="jw-question">{destinations[world].question}</p>
              <div className="jw-answer-options" role="group" aria-label="Choose the planet famous for its rings">
                {['Earth', 'Saturn', 'Mars'].map(name => <button type="button" key={name} className={`jw-answer ${wrongChoice === name ? 'is-wrong' : ''} ${mode === 'collect' && name === 'Saturn' ? 'is-right' : ''}`} onClick={() => answerWonder(name)} disabled={!entranceReady || mode !== 'world'}>{name}</button>)}
              </div>
            </>}
            {world === 1 && <RocketAssemblyChallenge active={entranceReady && mode === 'world'} onTone={kind => onToneRef.current?.(kind)} onNarration={id => narrationRef.current?.(id)} onComplete={awardFragment} title="ROCKET FORGE · BUILD YOUR ROCKET"/>}
            {world === 2 && <>
              <p className="jw-question">{destinations[world].question}</p>
              <div className="jw-pattern" aria-label="Blue square, gold star, blue square, gold star, missing shape"><span className="shape-square"/><b>→</b><span className="shape-star">✦</span><b>→</b><span className="shape-square"/><b>→</b><span className="shape-star">✦</span><b>→</b><span className={`shape-missing ${pixelAnswer === 'square' ? 'revealed' : ''}`}>{pixelAnswer === 'square' ? <i/> : '?'}</span></div>
              <div className="jw-answer-options jw-pixel-options" role="group" aria-label="Choose the next shape in the pattern">
                <button type="button" className={`jw-answer ${pixelAnswer === 'square' ? 'is-right' : ''}`} onClick={() => answerPixel('square')} disabled={!entranceReady || mode !== 'world'}><i className="shape-square"/>Blue square</button>
                <button type="button" className={`jw-answer ${pixelAnswer === 'star' ? 'is-wrong' : ''}`} onClick={() => answerPixel('star')} disabled={!entranceReady || mode !== 'world'}><i className="shape-star">✦</i>Gold star</button>
                <button type="button" className={`jw-answer ${pixelAnswer === 'circle' ? 'is-wrong' : ''}`} onClick={() => answerPixel('circle')} disabled={!entranceReady || mode !== 'world'}><i className="shape-circle"/>Purple circle</button>
              </div>
            </>}
            {hint && mode === 'world' && <p className="jw-feedback jw-hint" role="status">{hint}</p>}
            {mode === 'collect' && <div className="jw-collect-message" role="status"><strong>{successText}</strong><span>STAR FRAGMENT {world + 1} OF 3 COLLECTED</span></div>}
          </div>
        </div>
        <WorldArt world={world}/>
      </div>
      {mode === 'collect' && <div className="jw-collected-star" aria-hidden="true">✦</div>}
      {mode === 'travel' && <div className="jw-travel-caption" aria-live="polite">TRAVELLING TO DESTINATION 0{world + 2}</div>}
    </>}

    {(mode === 'reassembly' || mode === 'complete') && <div className="jw-reassembly" aria-live="polite">
      <div className="jw-signal-core"><i/><b/><span>✦</span><em/></div>
      <div className="jw-orbit-fragments" aria-hidden="true"><i>✦</i><i>✦</i><i>✦</i></div>
      <p className="jw-transmission-label">{mode === 'complete' ? 'SIGNAL RECONSTRUCTED' : 'THREE FRAGMENTS · ONE SIGNAL'}</p>
      <h1>{mode === 'complete' ? 'SIGNAL RECONSTRUCTED' : 'Bringing the signal together…'}</h1>
      {mode === 'complete' && <><p>Commander Naitik, you’ve found all three star fragments!</p><p className="jw-intro-last">The signal is getting stronger. A new mission awaits…</p></>}
    </div>}
    <p className="jw-scene-foot">{mode === 'signal' ? 'SECTOR 00 · DEEP SPACE' : mode === 'reassembly' || mode === 'complete' ? 'MISSION SIGNAL · 03 / 03' : `GALAXY MAP · 0${world + 1} / 03`}</p>
  </section>;
}
