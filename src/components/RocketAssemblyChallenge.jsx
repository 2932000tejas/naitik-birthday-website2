import { useEffect, useRef, useState } from 'react';
import { RocketIllustration } from './MissionControlScene.jsx';
import './final-mission.css';

const parts = ['nose', 'body', 'engine'];
const labels = { nose: 'Nose cone', body: 'Rocket body', engine: 'Engine' };

function PieceGlyph({ part }) { return <span className={`fm-piece-glyph glyph-${part}`} aria-hidden="true"/>; }

export default function RocketAssemblyChallenge({ active, onComplete, onTone, onNarration, title = 'BUILD YOUR ROCKET' }) {
  const [assembled, setAssembled] = useState([]);
  const [selected, setSelected] = useState('');
  const [hint, setHint] = useState('Tap a rocket part, then tap its matching place.');
  const [wrongTarget, setWrongTarget] = useState('');
  const completed = useRef(false);

  useEffect(() => {
    if (!wrongTarget) return undefined;
    const timer = window.setTimeout(() => setWrongTarget(''), 650);
    return () => window.clearTimeout(timer);
  }, [wrongTarget]);

  function pick(part) {
    if (!active || assembled.includes(part)) return;
    setSelected(part);
    setHint(`Now place the ${labels[part].toLowerCase()} on the rocket.`);
  }

  function place(target) {
    if (!active || !selected || assembled.includes(target)) {
      if (active && !selected) setHint('Choose a part first, then tap its matching place.');
      return;
    }
    if (selected !== target) {
      setWrongTarget(target);
      setHint(`Almost there! The ${labels[selected].toLowerCase()} goes ${selected === 'nose' ? 'at the top' : selected === 'body' ? 'in the middle' : 'at the bottom'}.`);
      setSelected('');
      onTone?.('hint');
      onNarration?.('stage3-hint');
      return;
    }
    const next = [...assembled, target];
    setAssembled(next);
    setSelected('');
    onTone?.('part');
    if (next.length === 3 && !completed.current) {
      completed.current = true;
      setHint('Rocket ready! You’re an amazing space engineer!');
      onTone?.('success');
      onComplete?.();
    } else setHint(`${labels[target]} snapped into place!`);
  }

  return <div className={`fm-shared-forge ${!active ? 'forge-inactive' : ''}`}>
    <p className="fm-forge-label">{title}</p>
    <p className="fm-forge-instruction">Choose a part, then its matching rocket position.</p>
    <div className="fm-assembly-controls">
      <div className="fm-assembly-board">
        <div className={`fm-rocket-reference ${assembled.length === 3 ? 'rocket-ready' : ''}`}><i className="fm-rocket-outline"/><RocketIllustration/><span className="fm-engine-light"/></div>
        <div className="fm-target-list" role="group" aria-label="Rocket assembly positions">
          {parts.map((part, index) => <button type="button" key={part} className={`fm-target target-${part} ${assembled.includes(part) ? 'placed' : ''} ${selected === part ? 'target-selected' : ''} ${wrongTarget === part ? 'target-hint' : ''}`} onClick={() => place(part)} disabled={!active || assembled.includes(part)} aria-label={`Place ${labels[part]} ${part === 'nose' ? 'at the top' : part === 'body' ? 'in the middle' : 'at the bottom'}`}><PieceGlyph part={part}/><span><b>0{index + 1}</b>{part.toUpperCase()}</span><i className="fm-slot-status">{assembled.includes(part) ? 'LOCKED' : 'PLACE'}</i></button>)}
        </div>
        <p className="fm-assembly-hint" role="status" aria-live="polite">{hint}</p>
      </div>
      <div className="fm-part-tray" role="group" aria-label="Choose a rocket component">
        {parts.map((part, index) => <button type="button" key={part} className={`fm-part-choice ${selected === part ? 'selected' : ''} ${assembled.includes(part) ? 'placed' : ''}`} onClick={() => pick(part)} disabled={!active || assembled.includes(part)} aria-pressed={selected === part}><span className="fm-part-number">0{index + 1}</span><PieceGlyph part={part}/><span>{labels[part]}</span><i>{assembled.includes(part) ? 'IN PLACE' : selected === part ? 'SELECTED' : 'TAP TO PICK'}</i></button>)}
      </div>
    </div>
  </div>;
}
