import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import MissionControlScene from './components/MissionControlScene.jsx';
import LiftOffScene from './components/LiftOffScene.jsx';
import WorldJourneyScene from './components/WorldJourneyScene.jsx';
import AsteroidRunScene from './components/AsteroidRunScene.jsx';
import BirthdayFinale from './components/BirthdayFinale.jsx';
import useNarration from './audio/useNarration.js';
const stages = ['Mission Control Is Alive', 'Lift Off!', 'Welcome to Our World', 'Begin Your Mission!', 'Light Your Reward!'];

function Stars() { return <div className="stars" aria-hidden="true">{Array.from({ length: 65 }, (_, i) => <i key={i} style={{ '--x': `${(i * 47 + 11) % 100}%`, '--y': `${(i * 71 + 4) % 100}%`, '--d': `${(i % 7) * -0.7}s`, '--s': `${1 + (i % 3)}px` }} />)}</div>; }
function AudioControl({ muted, toggle }) { return <button className="sound-toggle" onClick={toggle} aria-label={muted ? 'Turn sound on' : 'Mute sound'}>{muted ? '♪̸' : '♪'} <span>{muted ? 'SOUND OFF' : 'SOUND ON'}</span></button>; }

export default function App() {
  const [stage, setStage] = useState(0); const [parts, setParts] = useState([]); const [muted, setMuted] = useState(true); const ambienceRef = useRef(null); const mutedRef = useRef(true); const lock = useRef(false);
  const musicAllowedRef = useRef(stage < 4); musicAllowedRef.current = stage < 4;
  const { playNarration, stopNarration } = useNarration({ muted, mutedRef, ambienceRef, musicAllowedRef });
  const stopAmbience = useCallback(() => { const engine = ambienceRef.current; if (engine) { clearInterval(engine.timer); engine.timer = null; engine.musicBus.gain.setTargetAtTime(0, engine.ctx.currentTime, 0.6); } }, []);
  const destroyAudio = useCallback(() => { const engine = ambienceRef.current; if (engine) { clearInterval(engine.timer); engine.oscillators.forEach(osc => { try { osc.stop(); } catch { /* Already stopped. */ } }); engine.ctx.close().catch(() => {}); ambienceRef.current = null; } }, []);
  useEffect(() => () => { destroyAudio(); }, [destroyAudio]);
  useLayoutEffect(() => { window.scrollTo(0, 0); }, [stage]);
  const startAmbience = () => { try { const Ctx = window.AudioContext || window.webkitAudioContext; if (!Ctx) return; if (ambienceRef.current) return; const ctx = new Ctx(); ctx.resume().catch(() => {}); const master = ctx.createGain(); master.gain.value = mutedRef.current ? 0 : 1; master.connect(ctx.destination); const musicBus = ctx.createGain(); musicBus.gain.value = 0.32; musicBus.connect(master); const sfxBus = ctx.createGain(); sfxBus.gain.value = 0.65; sfxBus.connect(master); const chords = [[130.81,164.81,196,261.63],[110,130.81,164.81,220],[87.31,110,130.81,174.61],[98,123.47,146.83,196]]; const oscillators = chords[0].map((hz, i) => { const osc = ctx.createOscillator(); const voice = ctx.createGain(); osc.type = i === 0 ? 'triangle' : 'sine'; osc.frequency.value = hz; voice.gain.value = [0.22,0.15,0.12,0.07][i]; osc.connect(voice); voice.connect(musicBus); osc.start(); return osc; }); let chordIndex = 0; const timer = setInterval(() => { chordIndex = (chordIndex + 1) % chords.length; chords[chordIndex].forEach((hz, i) => oscillators[i].frequency.setTargetAtTime(hz, ctx.currentTime, 1.2)); }, 7200); ambienceRef.current = { ctx, master, musicBus, sfxBus, oscillators, timer }; } catch { /* Audio is an enhancement; the mission works silently. */ } };
  const playSfx = (kind = 'tap') => { const engine = ambienceRef.current; if (!engine || mutedRef.current) return; const patterns = { tap: [[659.25,0,0.055,0.035]], count: [[523.25,0,0.1,0.045]], signal: [[440,0,0.2,0.045],[659.25,0.22,0.25,0.05]], collect: [[659.25,0,0.11,0.065],[783.99,0.11,0.15,0.065],[987.77,0.26,0.27,0.07]], reassembly: [[392,0,0.2,0.05],[523.25,0.2,0.22,0.055],[659.25,0.42,0.25,0.06],[783.99,0.67,0.42,0.065]], gate: [[523.25,0,0.16,0.055],[659.25,0.15,0.16,0.06],[783.99,0.3,0.2,0.065]], portal: [[392,0,0.35,0.055],[523.25,0.22,0.4,0.06],[659.25,0.48,0.5,0.06],[783.99,0.78,0.7,0.055]], ignition: [[220,0,0.28,0.075],[440,0.08,0.24,0.07],[659.25,0.18,0.32,0.065]], launch: [[196,0,0.34,0.08],[293.66,0.12,0.31,0.075],[440,0.26,0.38,0.07]], boot: [[392,0,0.13,0.07],[587.33,0.12,0.16,0.07],[783.99,0.27,0.24,0.065]], part: [[523.25,0,0.09,0.065],[659.25,0.09,0.14,0.06]], success: [[659.25,0,0.11,0.075],[783.99,0.1,0.13,0.075],[987.77,0.21,0.25,0.07]], hint: [[440,0,0.12,0.045],[392,0.12,0.14,0.04]] }; const now = engine.ctx.currentTime; (patterns[kind] || patterns.tap).forEach(([hz, delay, duration, volume]) => { const osc = engine.ctx.createOscillator(); const gain = engine.ctx.createGain(); const startAt = now + delay; osc.type = kind === 'hint' ? 'sine' : 'triangle'; osc.frequency.setValueAtTime(hz, startAt); gain.gain.setValueAtTime(0, startAt); gain.gain.linearRampToValueAtTime(volume, startAt + 0.012); gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration); osc.connect(gain); gain.connect(engine.sfxBus); osc.start(startAt); osc.stop(startAt + duration + 0.02); }); };
  const handleActionSound = event => { const button = event.target.closest?.('button'); if (stage < 4 && button && !button.disabled) playSfx('tap'); };
  const start = () => { if (lock.current) return; lock.current = true; mutedRef.current = false; setMuted(false); startAmbience(); playSfx('boot'); return playNarration('stage1-welcome'); };
  const enterLiftOff = () => { stopNarration(); setStage(1); };
  const enterWorldJourney = () => { stopNarration(); setParts([]); setStage(2); };
  const collectWorldFragment = index => setParts(current => current.includes(index) ? current : [...current, index]);
  const activateBirthday = () => { stopNarration(); stopAmbience(); setStage(4); };
  const toggleMute = () => { const nextMuted = !mutedRef.current; mutedRef.current = nextMuted; setMuted(nextMuted); if (ambienceRef.current) ambienceRef.current.master.gain.setTargetAtTime(nextMuted ? 0 : 1, ambienceRef.current.ctx.currentTime, 0.08); if (!nextMuted && stage < 4) playSfx('tap'); };
  return <main className={`app stage-${stage}`} onClickCapture={handleActionSound}><Stars/><div className="nebula nebula-one"/><div className="nebula nebula-two"/><header className="topbar"><div className="brand"><span className="brand-mark">N</span><span>NAITIK<span className="brand-dash">-</span>006</span></div><AudioControl muted={muted} toggle={toggleMute}/></header>
    {stage === 0 && <MissionControlScene onInitialize={start} onLaunch={enterLiftOff}/>}
    {stage === 1 && <LiftOffScene onComplete={enterWorldJourney} onTone={playSfx} onNarration={playNarration}/>}
    {stage === 2 && <WorldJourneyScene onComplete={() => { stopNarration(); setStage(3); }} onFragment={collectWorldFragment} onTone={playSfx} onNarration={playNarration}/>}
    {stage === 3 && <AsteroidRunScene onTone={playSfx} onComplete={activateBirthday} onNarration={playNarration}/>}
    {stage === 4 && <BirthdayFinale muted={muted} onNarration={playNarration}/>}
    <footer className="footer"><span>{stage === 0 ? 'SYSTEMS INITIALIZING' : stages[stage]?.toUpperCase()}</span><span>{String(stage + 1).padStart(2,'0')} <i>/</i> 05</span></footer>
  </main>;
}
