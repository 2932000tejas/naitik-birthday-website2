import { useEffect, useRef, useState } from 'react';
import './mission-control.css';

const bootLines = [
  'ESTABLISHING DEEP SPACE LINK…',
  'COMMANDER IDENTIFIED: NAITIK',
  'INCOMING TRANSMISSION',
  'MISSION SYSTEMS READY',
];

export function RocketIllustration() {
  return <svg className="mc-rocket" viewBox="0 0 240 440" role="img" aria-label="A silver and cyan explorer rocket in its launch bay">
    <defs>
      <linearGradient id="rocketHull" x1="0" x2="1">
        <stop offset="0" stopColor="#788daa"/><stop offset=".2" stopColor="#dcecff"/><stop offset=".52" stopColor="#fbfdff"/><stop offset=".8" stopColor="#b9cee2"/><stop offset="1" stopColor="#657b9b"/>
      </linearGradient>
      <linearGradient id="rocketNose" x1="0" y1="0" x2="1" y2="0">
        <stop stopColor="#93a9c3"/><stop offset=".48" stopColor="#f8fdff"/><stop offset="1" stopColor="#7489a7"/>
      </linearGradient>
      <linearGradient id="rocketFin" x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#83edf1"/><stop offset="1" stopColor="#498dba"/>
      </linearGradient>
      <radialGradient id="rocketWindow"><stop stopColor="#cafcff"/><stop offset=".55" stopColor="#58d5eb"/><stop offset="1" stopColor="#27547f"/></radialGradient>
      <radialGradient id="rocketEngineGlow"><stop stopColor="#fff3c3" stopOpacity=".8"/><stop offset=".5" stopColor="#f8a76a" stopOpacity=".32"/><stop offset="1" stopColor="#f8a76a" stopOpacity="0"/></radialGradient>
      <filter id="rocketSoftGlow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="10"/></filter>
    </defs>
    <ellipse className="mc-engine-halo" cx="120" cy="373" rx="51" ry="60" fill="url(#rocketEngineGlow)" filter="url(#rocketSoftGlow)"/>
    <path d="M82 279 42 326 39 365 91 339Z" fill="url(#rocketFin)" stroke="#b7faff" strokeOpacity=".5" strokeWidth="2"/>
    <path d="m158 279 40 47 3 39-52-26Z" fill="url(#rocketFin)" stroke="#b7faff" strokeOpacity=".5" strokeWidth="2"/>
    <path d="M120 42c-24 35-52 79-52 131v159c0 27 22 48 52 48s52-21 52-48V173c0-52-28-96-52-131Z" fill="url(#rocketHull)" stroke="#e7f7ff" strokeOpacity=".75" strokeWidth="2"/>
    <path d="M120 22c-17 28-34 56-45 91h90c-11-35-28-63-45-91Z" fill="url(#rocketNose)" stroke="#f4fdff" strokeOpacity=".75" strokeWidth="2"/>
    <path d="M76 145h88M69 285h102" stroke="#527492" strokeOpacity=".55" strokeWidth="3"/>
    <path d="M78 157h8v111h-8zM154 157h8v111h-8z" fill="#fff" opacity=".32"/>
    <circle cx="120" cy="190" r="25" fill="#385b7d" stroke="#e7f9ff" strokeWidth="5"/>
    <circle cx="120" cy="190" r="18" fill="url(#rocketWindow)"/>
    <path d="m110 184 14-8-7 17-13 6Z" fill="#e7ffff" opacity=".7"/>
    <rect x="88" y="339" width="19" height="24" rx="5" fill="#344966"/>
    <rect x="133" y="339" width="19" height="24" rx="5" fill="#344966"/>
    <path d="M109 361h22v19c0 8-5 14-11 14s-11-6-11-14Z" fill="#394d67"/>
    <circle cx="120" cy="312" r="5" fill="#e5f8ff"/><circle cx="120" cy="312" r="2" fill="#61dce9"/>
    <path className="mc-engine-flame" d="M112 378h16l10 35-18-12-18 12Z" fill="#ffbd78"/>
  </svg>;
}

export default function MissionControlScene({ onInitialize, onLaunch, onNarration }) {
  const [phase, setPhase] = useState('booting');
  const timerRef = useRef(null);
  const launchFallbackRef = useRef(null);
  const launchLock = useRef(false);
  const launchStarted = useRef(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      setPhase('ready');
      return undefined;
    }
    timerRef.current = window.setTimeout(() => setPhase('ready'), 4400);
    return () => window.clearTimeout(timerRef.current);
  }, []);

  useEffect(() => () => { window.clearTimeout(timerRef.current); window.clearTimeout(launchFallbackRef.current); }, []);

  useEffect(() => {
    const narrationTimer = window.setTimeout(() => {
      if (!launchLock.current) onNarration?.('stage1-boot');
    }, 480);
    return () => window.clearTimeout(narrationTimer);
  }, [onNarration]);

  const initialize = () => {
    if (phase !== 'ready' || launchLock.current) return;
    launchLock.current = true;
    const narration = onInitialize();
    setPhase('launching');
    const continueLaunch = () => {
      if (launchStarted.current) return;
      launchStarted.current = true;
      window.clearTimeout(launchFallbackRef.current);
      timerRef.current = window.setTimeout(onLaunch, 380);
    };
    launchFallbackRef.current = window.setTimeout(continueLaunch, 7500);
    Promise.resolve(narration).then(continueLaunch, continueLaunch);
  };

  const skipIntro = () => {
    if (phase !== 'booting') return;
    window.clearTimeout(timerRef.current);
    setPhase('ready');
  };

  return <section className={`mission-control-scene mc-${phase}`} aria-labelledby="mc-title">
    <div className="mc-window" aria-hidden="true">
      <div className="mc-star-layer mc-star-far"/><div className="mc-star-layer mc-star-near"/>
      <div className="mc-nebula"/><div className="mc-observation-window"><div className="mc-distant-planet"/><div className="mc-planet-ring"/><div className="mc-horizon"/></div>
      <div className="mc-room-rib rib-left"/><div className="mc-room-rib rib-right"/><div className="mc-floor-grid"/>
    </div>

    <button className="mc-skip" type="button" onClick={skipIntro} hidden={phase !== 'booting'}>SKIP INTRO <span aria-hidden="true">↗</span></button>
    <div className="mc-layout">
      <div className="mc-console-side">
        <div className="mc-boot-feed" aria-label="Mission systems initializing" aria-live="polite">
          {bootLines.map((line, i) => <p className={`boot-line boot-line-${i + 1}`} key={line}><i/>{line}</p>)}
        </div>
        <div className="mc-copy">
          <p className="mc-kicker"><span className="mc-live-dot"/> COMMANDER IDENTIFICATION <span className="mc-kicker-code">· 006</span></p>
          <h1 id="mc-title">NAITIK-006</h1>
          <p className="mc-subtitle">A MISSION TO REMEMBER</p>
          <p className="mc-message">Commander Naitik, we have a special mission for you!</p>
          <p className="mc-prompt">The stars are waiting. Are you ready to explore?</p>
          <dl className="mc-mission-data">
            <div><dt>COMMANDER</dt><dd>NAITIK <span className="mc-verified">VERIFIED</span></dd></div>
            <div><dt>MISSION</dt><dd>BIRTHDAY-006</dd></div>
            <div><dt>DESTINATION</dt><dd className="mc-unknown">UNKNOWN <span className="mc-signal-bars"><i/><i/><i/></span></dd></div>
          </dl>
          <p className="mc-console-status" aria-live="polite">{phase === 'launching' ? 'COMMAND ACCEPTED · LAUNCH SYSTEMS READY' : 'UNKNOWN SIGNAL DETECTED · GALAXY MAP READY'}</p>
          <button className="mc-launch-button" type="button" onClick={initialize} disabled={phase !== 'ready'}>
            <span className="mc-button-icon" aria-hidden="true">✧</span><span>INITIALIZE MISSION</span><b aria-hidden="true">↗</b>
          </button>
        </div>
      </div>

      <div className="mc-hangar" aria-hidden="true">
        <div className="mc-hangar-arch"/><div className="mc-hangar-lights"><i/><i/><i/><i/></div>
        <div className="mc-bay-label">LAUNCH BAY <b>01</b></div>
        <div className="mc-rocket-wrap"><div className="mc-rocket-sheen"/><RocketIllustration/></div>
        <div className="mc-bay-floor"><i/><i/><i/></div>
        <div className="mc-diagnostics"><span>FLIGHT SYSTEMS</span><b><i/> READY</b><span>ROCKET IDLE</span></div>
        <div className="mc-orbit-display"><span className="mc-orbit-planet"/><i/><b>STAR MAP</b></div>
        <div className="mc-particles"><i/><i/><i/><i/><i/></div>
      </div>
    </div>
    <p className="mc-bottom-note"><span>MISSION CONTROL IS ALIVE</span><span>STARDATE <b>006</b></span></p>
  </section>;
}
