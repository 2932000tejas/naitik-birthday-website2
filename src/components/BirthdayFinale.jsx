import { useEffect, useRef, useState } from 'react';
import './birthday-finale.css';

const asset = name => `${import.meta.env.BASE_URL}assets/${name}`;
const photos = ['naitik-photo-1.jpg', 'naitik-photo-2.jpg'];
const PHOTO_HOLD_MS = 5200;
const message = [
  'वाढदिवसाच्या खूप खूप शुभेच्छा, नैतिक! 🎂🚀',
  'लाडक्या नैतिक, तुझं आयुष्य आनंदाने, मजेने आणि नवीन नवीन गोष्टी शिकण्याच्या उत्साहाने भरलेलं असो!',
  'तू असाच हसत राहा, मोठी मोठी स्वप्नं बघ आणि तुझ्या स्वप्नांच्या दिशेने रॉकेटसारखी भरारी घे!',
  'तुझ्या सहाव्या वाढदिवसाला खूप सारा आनंद, भरपूर प्रेम आणि गोड गोड आठवणी मिळोत!',
  'हॅपी बर्थडे, आपल्या छोट्या सुपरस्टारला! ❤️',
  'तुझं पुढचं साहस आता सुरू होतंय, कमांडर नैतिक!',
];

function BirthdayPlanet({ phase }) {
  return <div className={`bf-planet-scene ${phase === 'arrival' ? 'is-dim' : 'is-awake'}`} aria-label="A glowing birthday planet with a cake and six candles">
    <div className="bf-light-cone" aria-hidden="true"/>
    <div className="bf-orbit bf-orbit-one"><i/><i/></div><div className="bf-orbit bf-orbit-two"><i/></div>
    <div className="bf-celestial-dust" aria-hidden="true">{Array.from({ length: 10 }, (_, i) => <i key={i} style={{ '--x': `${(i * 37 + 9) % 100}%`, '--y': `${(i * 53 + 13) % 100}%`, '--delay': `${(i % 5) * -1.1}s`, '--drift': `${(i % 2 ? 1 : -1) * (12 + i % 4 * 5)}px` }}/>)}</div>
    <div className="bf-planet"><span className="bf-crater crater-one"/><span className="bf-crater crater-two"/><span className="bf-planet-ring"/>
      <div className="bf-cake"><div className="bf-candle-row">{Array.from({ length: 6 }, (_, i) => <i className="bf-candle" key={i}><b/></i>)}</div><div className="bf-cake-icing"/><div className="bf-cake-layer layer-top"/><div className="bf-cake-layer layer-bottom"/><div className="bf-cake-stand"/><div className="bf-cake-stars">✦　✦　✦</div></div>
      <span className="bf-planet-caption">HAPPY BIRTHDAY, COMMANDER</span>
    </div><i className="bf-small-moon"/>
  </div>;
}

export default function BirthdayFinale({ muted, onNarration }) {
  const [phase, setPhase] = useState('arrival');
  const [photoIndex, setPhotoIndex] = useState(0);
  const [photoAvailable, setPhotoAvailable] = useState([true, true]);
  const [photoRatios, setPhotoRatios] = useState([4 / 3, 4 / 3]);
  const [voiceState, setVoiceState] = useState('waiting');
  const [musicState, setMusicState] = useState('waiting');
  const [paragraphs, setParagraphs] = useState(0);
  const [replayTick, setReplayTick] = useState(0);
  const runId = useRef(0);
  const voiceRef = useRef(null);
  const songRef = useRef(null);
  const narrationRef = useRef(onNarration);
  const revealNarrationRef = useRef(Promise.resolve('unavailable'));
  narrationRef.current = onNarration;
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const timeScale = reducedMotion ? 0.55 : 1;
  const messagePhotoIndex = photoAvailable[photoIndex] ? photoIndex : photoAvailable.findIndex(Boolean);

  useEffect(() => {
    if (voiceRef.current) voiceRef.current.muted = muted;
    if (songRef.current) songRef.current.muted = muted;
  }, [muted]);

  useEffect(() => {
    const id = ++runId.current;
    let timer;
    const schedule = (callback, delay) => { timer = window.setTimeout(() => { if (runId.current === id) callback(); }, delay * timeScale); };
    revealNarrationRef.current = Promise.resolve(narrationRef.current?.('stage5-reveal'));
    schedule(() => setPhase('awakening'), 850);
    return () => { window.clearTimeout(timer); runId.current += 1; };
  }, [timeScale, replayTick]);

  useEffect(() => {
    if (phase !== 'awakening') return undefined;
    const id = runId.current;
    const timer = window.setTimeout(() => { if (runId.current === id) setPhase('hero'); }, 3000 * timeScale);
    return () => window.clearTimeout(timer);
  }, [phase, timeScale]);

  useEffect(() => {
    if (phase !== 'hero') return undefined;
    const id = runId.current;
    let live = true;
    let timer;
    const safety = window.setTimeout(() => { if (live && runId.current === id) beginVoice(); }, 7000);
    revealNarrationRef.current.finally(() => {
      if (!live || runId.current !== id) return;
      window.clearTimeout(safety);
      timer = window.setTimeout(() => beginVoice(), 350 * timeScale);
    });
    return () => { live = false; window.clearTimeout(timer); window.clearTimeout(safety); };
  }, [phase, timeScale]);

  useEffect(() => {
    if (phase !== 'photo-one' && phase !== 'photo-two') return undefined;
    if (!photoAvailable[photoIndex]) {
      if (phase === 'photo-one' && photoAvailable[1]) { setPhotoIndex(1); setPhase('photo-two'); }
      else enterMessage();
      return undefined;
    }
    const id = runId.current;
    const timer = window.setTimeout(() => {
      if (runId.current !== id) return;
      if (phase === 'photo-one') {
        const nextPhoto = new Image();
        nextPhoto.onload = () => { if (runId.current === id) { setPhotoIndex(1); setPhase('photo-two'); } };
        nextPhoto.onerror = () => { if (runId.current === id) { setPhotoAvailable(current => current.map((value, i) => i === 1 ? false : value)); enterMessage(); } };
        nextPhoto.src = asset(photos[1]);
      }
      else enterMessage();
    }, PHOTO_HOLD_MS * timeScale);
    return () => window.clearTimeout(timer);
  }, [phase, photoAvailable, photoIndex, timeScale]);

  useEffect(() => {
    if (phase !== 'message') return undefined;
    setParagraphs(0);
    const timers = message.map((_, index) => window.setTimeout(() => setParagraphs(index + 1), (500 + index * 620) * timeScale));
    const finish = window.setTimeout(() => enterCelebration(), 22000);
    return () => { timers.forEach(window.clearTimeout); window.clearTimeout(finish); };
  }, [phase, timeScale]);

  useEffect(() => () => { if (voiceRef.current) { voiceRef.current.pause(); voiceRef.current.onended = null; voiceRef.current.onerror = null; } if (songRef.current) { songRef.current.pause(); songRef.current.onplay = null; songRef.current.onerror = null; } }, []);

  function beginVoice() {
    setPhase('voice');
    const voice = voiceRef.current;
    if (!voice) { setVoiceState('missing'); advanceToPhotos(); return; }
    if (songRef.current && !songRef.current.paused) songRef.current.pause();
    voice.pause();
    try { voice.currentTime = 0; } catch { /* Media metadata may not be ready yet. */ }
    voice.muted = muted;
    setVoiceState('playing');
    voice.onended = () => { setVoiceState('done'); advanceToPhotos(); };
    voice.onerror = () => { setVoiceState('missing'); advanceToPhotos(); };
    voice.play().catch(() => { setVoiceState('blocked'); advanceToPhotos(); });
  }

  function advanceToPhotos() {
    setPhotoIndex(0);
    setPhase('photo-one');
    startSongQuietly();
  }

  function startSongQuietly() {
    const song = songRef.current;
    if (!song) { setMusicState('missing'); return; }
    song.loop = true;
    song.muted = muted;
    song.volume = 0.055;
    if (!song.paused && !song.ended) { setMusicState('playing'); return; }
    song.play().then(() => setMusicState('playing')).catch(() => setMusicState(song.error ? 'missing' : 'ready'));
  }

  function enterMessage() { setPhase('message'); }

  function enterCelebration() {
    setPhase('celebration');
    const song = songRef.current;
    if (!song) { setMusicState('missing'); return; }
    song.muted = muted;
    song.loop = true;
    song.volume = 0.42;
    if (!song.paused && !song.ended) { setMusicState('playing'); return; }
    song.play().then(() => setMusicState('playing')).catch(() => setMusicState(song.error ? 'missing' : 'ready'));
  }

  function replayCelebration() {
    runId.current += 1;
    if (voiceRef.current) { voiceRef.current.pause(); voiceRef.current.onended = null; voiceRef.current.onerror = null; }
    setVoiceState('waiting');
    setMusicState('waiting');
    setPhotoAvailable([true, true]);
    setPhotoIndex(0);
    setParagraphs(0);
    setPhase('arrival');
    setReplayTick(value => value + 1);
    const song = songRef.current;
    if (song && !song.paused) song.pause();
  }

  return <section className={`scene birthday-finale bf-${phase}${reducedMotion ? ' bf-reduced-motion' : ''}`} aria-labelledby="bf-title">
    <div className="bf-portal-glow" aria-hidden="true"/>
    <div className="bf-backdrop" aria-hidden="true"><i className="bf-nebula nebula-a"/><i className="bf-nebula nebula-b"/><div className="bf-confetti">{Array.from({ length: 20 }, (_, i) => <i key={i} style={{ '--x': `${(i * 43 + 7) % 100}%`, '--delay': `${i * -0.6}s`, '--duration': `${5 + (i % 5)}s` }}/>)}</div><div className="bf-fireworks"><i/><i/><i/><i/></div><div className="bf-balloons"><i/><i/><i/><i/></div></div>
    <audio ref={voiceRef} src={asset('voice-note.m4a')} preload="none" muted={muted}/>
    <audio ref={songRef} src={asset('birthday-song.mp3')} preload="none" loop muted={muted} onError={() => setMusicState('missing')} onPlay={() => setMusicState('playing')}/>
    <p className="bf-arrival-label" aria-live="polite">{phase === 'arrival' || phase === 'awakening' ? 'DESTINATION REACHED' : phase === 'celebration' ? 'MISSION COMPLETE · SIGNAL DECODED' : 'A BIRTHDAY GALAXY, MADE FOR YOU'}</p>
    <div className="bf-hero-row"><BirthdayPlanet phase={phase}/><header className={`bf-hero-title ${['hero','voice','photo-one','photo-two','message','celebration'].includes(phase) ? 'is-visible' : ''}`}>
      <p className="bf-title-kicker">THE GALAXY CELEBRATES</p><h1 id="bf-title">COMMANDER NAITIK</h1><p className="bf-level">GALAXY EXPLORER, LEVEL 6</p>
    </header></div>
    <div className="bf-story-area">
      {(phase === 'arrival' || phase === 'awakening' || phase === 'hero') && <p className="bf-story-status" aria-live="polite">{phase === 'arrival' ? 'Your rocket has arrived at a very special planet…' : phase === 'awakening' ? 'Look! The birthday planet is waking up!' : 'Six candles, shining just for you.'}</p>}
      {phase === 'voice' && <div className="bf-voice-arrival" aria-live="polite"><span className={`bf-sound-wave ${voiceState === 'playing' ? 'is-speaking' : ''}`} aria-hidden="true"><i/><i/><i/><i/><i/></span><p>{voiceState === 'playing' ? 'A special message, just for you…' : 'Your friend Tejas has a message for you.'}</p></div>}
      {(phase === 'photo-one' || phase === 'photo-two') && <div className="bf-personal-reveal">
        <div className={`bf-photo-frame photo-in ${phase === 'photo-two' ? 'photo-second' : ''}`} style={{ '--photo-ratio': photoRatios[photoIndex] }}>
          {phase === 'photo-two' && photoAvailable[0] && <img className="bf-photo-previous" src={asset(photos[0])} alt="" aria-hidden="true"/>}
          {photoAvailable[photoIndex] && <img className="bf-photo-current" src={asset(photos[photoIndex])} alt={`Naitik, birthday memory ${photoIndex + 1}`} onLoad={event => { const image = event.currentTarget; if (image.naturalWidth && image.naturalHeight) setPhotoRatios(current => current.map((ratio, i) => i === photoIndex ? image.naturalWidth / image.naturalHeight : ratio)); }} onError={() => setPhotoAvailable(current => current.map((value, i) => i === photoIndex ? false : value))}/>}
          {!photoAvailable[photoIndex] && <div className="bf-photo-placeholder"><span>✦</span><b>YOUR PHOTO GOES HERE</b><small>Replace {photos[photoIndex]} in public/assets</small></div>}
        </div>
        <div className="bf-voice-copy" aria-live="polite"><span className={`bf-sound-wave ${voiceState === 'playing' ? 'is-speaking' : ''}`} aria-hidden="true"><i/><i/><i/><i/><i/></span><p>{voiceState === 'blocked' ? 'Your voice message is ready when you are.' : voiceState === 'missing' ? 'The personal voice message is not available yet.' : 'A little birthday memory from your friend Tejas.'}</p>
          {voiceState === 'blocked' && <button type="button" className="bf-small-button" onClick={beginVoice}>▶ PLAY VOICE MESSAGE</button>}
        </div>
      </div>}
      {(phase === 'message' || phase === 'celebration') && <div className="bf-message-layout">
        <div className="bf-message-photo">{messagePhotoIndex >= 0 ? <img style={{ '--photo-ratio': photoRatios[messagePhotoIndex] }} src={asset(photos[messagePhotoIndex])} alt={`Naitik, birthday memory ${messagePhotoIndex + 1}`} onLoad={event => { const image = event.currentTarget; if (image.naturalWidth && image.naturalHeight) setPhotoRatios(current => current.map((ratio, i) => i === messagePhotoIndex ? image.naturalWidth / image.naturalHeight : ratio)); }} onError={() => setPhotoAvailable(current => current.map((value, i) => i === messagePhotoIndex ? false : value))}/> : <div className="bf-photo-placeholder"><span>✦</span><b>YOUR PHOTOS GO HERE</b><small>Add Naitik's photos to public/assets</small></div>}</div>
        <article className="bf-marathi-letter" lang="mr"><p className="bf-letter-label">A BIRTHDAY SURPRISE FROM YOUR FRIEND TEJAS · ✦</p>{message.map((line, index) => <p key={line} className={index < paragraphs || phase === 'celebration' ? 'paragraph-visible' : 'paragraph-hidden'}>{line}</p>)}</article>
      </div>}
      {phase === 'message' && <div className="bf-message-actions"><p>Take your time, Commander. This message is for you.</p></div>}
      {phase === 'celebration' && <div className="bf-celebration-controls"><p className="bf-song-state" aria-live="polite">{musicState === 'playing' ? '♪ Birthday music is playing on repeat' : musicState === 'ready' ? 'Your birthday song is ready.' : musicState === 'missing' ? 'Birthday music can be added when you’re ready.' : 'The celebration is ready!'}</p>{musicState === 'ready' && <button type="button" className="bf-small-button" onClick={enterCelebration}>▶ PLAY BIRTHDAY MUSIC</button>}<button type="button" className="bf-replay-button" onClick={replayCelebration}>↺ &nbsp; REPLAY CELEBRATION</button></div>}
    </div>
  </section>;
}
