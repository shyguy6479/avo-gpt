import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RotateCcw, Volume2, VolumeX, Sparkles, Play, Pause } from 'lucide-react';

interface SpidermanAvoAnimationProps {
  className?: string;
  isDarkMode?: boolean;
}

type AnimationPhase = 'idle_start' | 'letters_arrive' | 'v_falling' | 'spiderman_swing' | 'caught_web' | 'fixing_in_place' | 'locked_avo' | 'hanging_idle';

export const SpidermanAvoAnimation: React.FC<SpidermanAvoAnimationProps> = ({
  className = '',
  isDarkMode = true,
}) => {
  const [phase, setPhase] = useState<AnimationPhase>('idle_start');
  const [progress, setProgress] = useState(0); // 0 to 100
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [interactiveWebs, setInteractiveWebs] = useState<Array<{ id: number; x: number; y: number; angle: number }>>([]);
  const [clickCount, setClickCount] = useState(0);
  const [comicText, setComicText] = useState<{ text: string; sub?: string; x: number; y: number; color: string } | null>(null);
  const [spideyPose, setSpideyPose] = useState<'diving' | 'shooting' | 'pulling' | 'perched' | 'hanging'>('diving');
  const [isHovered, setIsHovered] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);

  // Audio synthesis using Web Audio API for satisfying "THWIP", "WHOOSH", and "CLANG"
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playSound = useCallback((type: 'whoosh' | 'thwip' | 'clang' | 'snap' | 'tada') => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;

      if (type === 'thwip') {
        // High frequency whip / web burst noise
        const bufferSize = ctx.sampleRate * 0.12;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1800, now);
        filter.frequency.exponentialRampToValueAtTime(3200, now + 0.1);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start(now);
      } else if (type === 'whoosh') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(450, now + 0.18);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.35);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.25, now + 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.36);
      } else if (type === 'snap' || type === 'clang') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(580, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.18);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.23);
      } else if (type === 'tada') {
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.06);

          gain.gain.setValueAtTime(0.18, now + idx * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.4);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.06);
          osc.stop(now + idx * 0.06 + 0.45);
        });
      }
    } catch {
      // Audio autoplay policy fallback
    }
  }, [soundEnabled]);

  // Main Choreographed Animation Sequence
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  const clearTimeouts = () => {
    timeoutsRef.current.forEach((t) => clearTimeout(t));
    timeoutsRef.current = [];
  };

  const startAnimation = useCallback(() => {
    clearTimeouts();
    setPhase('idle_start');
    setProgress(0);
    setComicText(null);
    setSpideyPose('diving');

    // Step 1: 'a' and 'o' enter from left & right (0.1s)
    timeoutsRef.current.push(
      setTimeout(() => {
        setPhase('letters_arrive');
        setProgress(15);
        playSound('whoosh');
        setComicText({ text: 'INCOMING!', x: 260, y: 310, color: '#38bdf8' });
      }, 100)
    );

    // Step 2: 'v' starts falling from sky (0.9s)
    timeoutsRef.current.push(
      setTimeout(() => {
        setPhase('v_falling');
        setProgress(30);
        playSound('whoosh');
        setComicText({ text: 'LOOK OUT!', sub: "‘v’ is plummeting!", x: 260, y: 140, color: '#f59e0b' });
      }, 950)
    );

    // Step 3: Spider-Man swings in (1.6s)
    timeoutsRef.current.push(
      setTimeout(() => {
        setPhase('spiderman_swing');
        setSpideyPose('shooting');
        setProgress(50);
        playSound('whoosh');
        setComicText({ text: 'SWING IN!', x: 380, y: 160, color: '#ef4444' });
      }, 1650)
    );

    // Step 4: Spider-Man shoots web and catches 'v' mid-air! (2.2s)
    timeoutsRef.current.push(
      setTimeout(() => {
        setPhase('caught_web');
        setSpideyPose('pulling');
        setProgress(70);
        playSound('thwip');
        setComicText({ text: 'THWIP! 🕸️', sub: 'GOT IT!', x: 260, y: 220, color: '#ef4444' });
      }, 2250)
    );

    // Step 5: Spider-Man fixes 'v' between 'a' and 'o' (3.1s)
    timeoutsRef.current.push(
      setTimeout(() => {
        setPhase('fixing_in_place');
        setSpideyPose('perched');
        setProgress(85);
        playSound('clang');
        setComicText({ text: 'LOCKING IN...', x: 260, y: 380, color: '#10b981' });
      }, 3150)
    );

    // Step 6: 'v' snaps in place! "avo" formed! (3.8s)
    timeoutsRef.current.push(
      setTimeout(() => {
        setPhase('locked_avo');
        setSpideyPose('hanging');
        setProgress(100);
        playSound('snap');
        playSound('tada');
        setComicText({ text: 'AVO FORMED! ⚡', sub: 'Perfect placement!', x: 260, y: 440, color: '#3b82f6' });
      }, 3850)
    );

    // Step 7: Transition to relaxed upside-down hanging idle (4.6s)
    timeoutsRef.current.push(
      setTimeout(() => {
        setPhase('hanging_idle');
        setSpideyPose('hanging');
        setComicText(null);
      }, 4700)
    );
  }, [playSound]);

  useEffect(() => {
    startAnimation();
    return () => clearTimeouts();
  }, [startAnimation]);

  // Periodic replay when in hanging_idle if autoPlay is enabled
  useEffect(() => {
    if (phase === 'hanging_idle' && autoPlay) {
      const loopTimer = setTimeout(() => {
        startAnimation();
      }, 7500);
      return () => clearTimeout(loopTimer);
    }
  }, [phase, autoPlay, startAnimation]);

  // Click on canvas to shoot interactive webs
  const handleStageClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const angle = Math.atan2(y - 200, x - 260) * (180 / Math.PI);

    playSound('thwip');
    const newId = Date.now() + Math.random();
    setInteractiveWebs((prev) => [...prev.slice(-6), { id: newId, x, y, angle }]);
    setClickCount((c) => c + 1);

    setTimeout(() => {
      setInteractiveWebs((prev) => prev.filter((item) => item.id !== newId));
    }, 1800);
  };

  // Letter Positions
  // Left 'a' target: x = 140, y = 330
  // Mid 'v' target: x = 260, y = 330
  // Right 'o' target: x = 380, y = 330

  // Calculate coordinates based on phase
  let aX = 140;
  let aY = 330;
  let aOpacity = 1;
  let aScale = 1;

  let oX = 380;
  let oY = 330;
  let oOpacity = 1;
  let oScale = 1;

  let vX = 260;
  let vY = 330;
  let vRotate = 0;
  let vOpacity = 1;
  let vScale = 1;

  // Spider-Man position
  let spideyX = 260;
  let spideyY = 130;
  let spideyRotate = 0;
  let spideyScale = 1;
  let spideyOpacity = 1;
  let showWebToV = false;
  let webAnchorX = 260;
  let webAnchorY = 0;

  if (phase === 'idle_start') {
    aX = -200;
    aOpacity = 0;
    oX = 720;
    oOpacity = 0;
    vY = -250;
    vOpacity = 0;
    spideyY = -250;
    spideyOpacity = 0;
  } else if (phase === 'letters_arrive') {
    aX = 140;
    aOpacity = 1;
    oX = 380;
    oOpacity = 1;
    vY = -200;
    vOpacity = 0;
    spideyY = -200;
    spideyOpacity = 0;
  } else if (phase === 'v_falling') {
    aX = 140;
    oX = 380;
    // 'v' plummeting down past mid-point!
    vX = 260;
    vY = 170;
    vRotate = 24;
    vScale = 1.08;
    vOpacity = 1;
    spideyY = -120;
    spideyX = 420;
    spideyOpacity = 0.5;
  } else if (phase === 'spiderman_swing') {
    aX = 140;
    oX = 380;
    vX = 260;
    vY = 240;
    vRotate = 16;
    spideyX = 360;
    spideyY = 120;
    spideyRotate = -15;
    spideyOpacity = 1;
    showWebToV = true;
  } else if (phase === 'caught_web') {
    aX = 140;
    oX = 380;
    // 'v' is halted and snagged!
    vX = 260;
    vY = 250;
    vRotate = -5;
    vScale = 1.05;
    spideyX = 295;
    spideyY = 140;
    spideyRotate = -10;
    showWebToV = true;
  } else if (phase === 'fixing_in_place') {
    aX = 140;
    oX = 380;
    // 'v' brought down into slot
    vX = 260;
    vY = 325;
    vRotate = 2;
    spideyX = 260;
    spideyY = 200;
    spideyRotate = 0;
    showWebToV = true;
  } else if (phase === 'locked_avo' || phase === 'hanging_idle') {
    aX = 140;
    aY = 330;
    oX = 380;
    oY = 330;
    vX = 260;
    vY = 330;
    vRotate = 0;
    vScale = 1;

    // Spider-Man hangs inverted right above the formed AVO!
    spideyX = 260;
    spideyY = 145;
    spideyRotate = 180; // inverted hanging pose
    spideyScale = 0.95;
  }

  return (
    <div
      className={`w-full h-full min-h-[520px] flex flex-col items-center justify-center relative overflow-hidden select-none transition-colors duration-300 ${
        isDarkMode ? 'bg-[#06080e] text-white' : 'bg-gradient-to-b from-slate-50 to-zinc-100 text-zinc-900'
      } ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Ambience: Subtle Cyber-Spider Web Grid & Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Radial Center Spotlight */}
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[580px] h-[580px] rounded-full blur-[90px] transition-all duration-700 ${
            phase === 'locked_avo' || phase === 'hanging_idle'
              ? isDarkMode
                ? 'bg-red-600/20'
                : 'bg-red-500/10'
              : isDarkMode
              ? 'bg-blue-600/15'
              : 'bg-blue-400/10'
          }`}
        />

        {/* Ambient Web Radial Pattern Background */}
        <svg className="absolute inset-0 w-full h-full opacity-15 dark:opacity-20" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="webGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#3b82f6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>
          </defs>
          <g transform="translate(260, 260)" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 3">
            <circle r="60" fill="none" />
            <circle r="120" fill="none" />
            <circle r="180" fill="none" />
            <circle r="250" fill="none" />
            <line x1="-260" y1="0" x2="260" y2="0" />
            <line x1="0" y1="-260" x2="0" y2="260" />
            <line x1="-190" y1="-190" x2="190" y2="190" />
            <line x1="-190" y1="190" x2="190" y2="-190" />
          </g>
        </svg>
      </div>

      {/* Comic Book Banner Tag Header */}
      <div className="absolute top-4 left-6 z-20 flex items-center gap-2.5">
        <div className="px-3 py-1 rounded-full bg-red-600/20 border border-red-500/40 text-red-500 dark:text-red-400 text-xs font-black tracking-widest uppercase flex items-center gap-1.5 backdrop-blur-md shadow-lg">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
          <span>Marvel Web Action</span>
        </div>
        <span className="text-xs text-zinc-400 font-semibold hidden sm:inline">
          Spider-Man fixes the AVO logo
        </span>
      </div>

      {/* Floating Control Toolbar */}
      <div className="absolute top-4 right-6 z-20 flex items-center gap-2">
        {/* Sound FX Toggle */}
        <button
          type="button"
          onClick={() => {
            const next = !soundEnabled;
            setSoundEnabled(next);
            if (next) playSound('thwip');
          }}
          className={`p-2.5 rounded-xl border backdrop-blur-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md ${
            soundEnabled
              ? 'bg-red-500/20 border-red-500 text-red-400'
              : 'bg-zinc-900/60 border-zinc-700 text-zinc-400 hover:text-white'
          }`}
          title={soundEnabled ? 'Mute Sound FX' : 'Enable Web Sound FX (THWIP!)'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          <span className="hidden sm:inline">{soundEnabled ? 'Sound ON' : 'Sound OFF'}</span>
        </button>

        {/* Auto Loop Toggle Button */}
        <button
          type="button"
          onClick={() => setAutoPlay((prev) => !prev)}
          className={`p-2.5 rounded-xl border backdrop-blur-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md ${
            autoPlay
              ? 'bg-blue-500/20 border-blue-500 text-blue-400'
              : 'bg-zinc-900/60 border-zinc-700 text-zinc-400 hover:text-white'
          }`}
          title={autoPlay ? 'Auto-looping enabled (click to pause)' : 'Auto-looping paused (click to resume)'}
        >
          {autoPlay ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          <span className="hidden sm:inline">{autoPlay ? 'Auto Loop' : 'Paused'}</span>
        </button>

        {/* Replay Catch Button */}
        <button
          type="button"
          onClick={() => startAnimation()}
          className="px-3.5 py-2 rounded-xl border border-red-500/50 bg-gradient-to-r from-red-600/30 via-red-500/40 to-blue-600/30 hover:from-red-600/50 hover:to-blue-600/50 backdrop-blur-md text-white font-bold text-xs flex items-center gap-1.5 shadow-lg transition-all cursor-pointer active:scale-95 group"
          title="Replay Spider-Man catch & AVO lock sequence"
        >
          <RotateCcw className="w-3.5 h-3.5 group-hover:-rotate-180 transition-transform duration-500 text-red-400" />
          <span>Replay Catch</span>
        </button>
      </div>

      {/* Interactive Canvas / SVG Scene */}
      <div className="relative w-full max-w-[540px] aspect-[520/500] flex items-center justify-center">
        <svg
          viewBox="0 0 520 500"
          className="w-full h-full cursor-crosshair overflow-visible"
          onClick={handleStageClick}
        >
          <defs>
            {/* Glossy Metallic Gradient for Letters */}
            <linearGradient id="letterGradAvo" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor="#e2e8f0" />
              <stop offset="70%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>

            {/* Glowing Web Line Gradient */}
            <linearGradient id="webStrandGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#e0f2fe" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.7" />
            </linearGradient>

            {/* Red Suit Shading Gradient */}
            <linearGradient id="spideyRedSuit" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff4d4d" />
              <stop offset="55%" stopColor="#dc2626" />
              <stop offset="100%" stopColor="#991b1b" />
            </linearGradient>

            {/* Blue Suit Shading */}
            <linearGradient id="spideyBlueSuit" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="60%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>

            {/* Eye Lens Shimmer */}
            <linearGradient id="spideyEyeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="70%" stopColor="#f1f5f9" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>

            {/* Neon Drop Shadow Filter */}
            <filter id="neonGlowAvo" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Web Impact Spark Filter */}
            <filter id="webImpactGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* MAIN WEB STRING: Hanging anchor from ceiling */}
          {(phase === 'spiderman_swing' || phase === 'caught_web' || phase === 'fixing_in_place' || phase === 'locked_avo' || phase === 'hanging_idle') && (
            <g className={`transition-all duration-300 ${phase === 'hanging_idle' ? 'animate-spidey-sway' : ''}`}>
              {/* Ceiling anchor web string */}
              <line
                x1={webAnchorX}
                y1={0}
                x2={spideyX}
                y2={phase === 'hanging_idle' || phase === 'locked_avo' ? spideyY - 65 : spideyY - 35}
                stroke="url(#webStrandGrad)"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="animate-pulse"
              />
              {/* Secondary silky web fibers */}
              <line
                x1={webAnchorX - 15}
                y1={0}
                x2={spideyX}
                y2={phase === 'hanging_idle' || phase === 'locked_avo' ? spideyY - 60 : spideyY - 30}
                stroke="#ffffff"
                strokeWidth="1"
                strokeOpacity="0.6"
              />
              <line
                x1={webAnchorX + 15}
                y1={0}
                x2={spideyX}
                y2={phase === 'hanging_idle' || phase === 'locked_avo' ? spideyY - 60 : spideyY - 30}
                stroke="#ffffff"
                strokeWidth="1"
                strokeOpacity="0.6"
              />
            </g>
          )}

          {/* ACTIVE CATCH WEB LINE: From Spider-Man to letter 'v' */}
          {showWebToV && (
            <g className="transition-all duration-150">
              {/* Main taut web strand */}
              <path
                d={`M ${spideyX} ${spideyY} Q ${(spideyX + vX) / 2 - 15} ${(spideyY + vY) / 2 - 20} ${vX} ${vY - 40}`}
                fill="none"
                stroke="#ffffff"
                strokeWidth="3.5"
                filter="url(#webImpactGlow)"
              />
              {/* Secondary web tethers */}
              <path
                d={`M ${spideyX - 8} ${spideyY + 5} Q ${(spideyX + vX) / 2 + 10} ${(spideyY + vY) / 2} ${vX - 25} ${vY - 35}`}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.8"
                strokeOpacity="0.85"
              />
              <path
                d={`M ${spideyX + 8} ${spideyY + 5} Q ${(spideyX + vX) / 2 - 20} ${(spideyY + vY) / 2 + 10} ${vX + 25} ${vY - 35}`}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.8"
                strokeOpacity="0.85"
              />

              {/* Web Impact Splat on Letter 'v' */}
              <g transform={`translate(${vX}, ${vY - 42})`}>
                <circle r="12" fill="#ffffff" fillOpacity="0.9" filter="url(#webImpactGlow)" />
                <path
                  d="M0,0 L-18,-8 M0,0 L-14,14 M0,0 L14,14 M0,0 L18,-8 M0,0 L0,-20 M0,0 L0,18"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </g>
            </g>
          )}

          {/* CONNECTING WEBS BETWEEN A-V-O WHEN FORMED */}
          {(phase === 'locked_avo' || phase === 'hanging_idle') && (
            <g className="animate-fadeIn">
              {/* Web stitch from 'a' to 'v' */}
              <path
                d="M 175 320 Q 200 310 225 320"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2"
                strokeDasharray="2 2"
                strokeOpacity="0.8"
              />
              <path
                d="M 180 345 Q 200 355 220 345"
                fill="none"
                stroke="#ffffff"
                strokeWidth="1.5"
                strokeDasharray="2 2"
                strokeOpacity="0.7"
              />
              {/* Web stitch from 'v' to 'o' */}
              <path
                d="M 295 320 Q 320 310 345 320"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2"
                strokeDasharray="2 2"
                strokeOpacity="0.8"
              />
              <path
                d="M 300 345 Q 320 355 340 345"
                fill="none"
                stroke="#ffffff"
                strokeWidth="1.5"
                strokeDasharray="2 2"
                strokeOpacity="0.7"
              />

              {/* Glowing Floor Reflection / Platform */}
              <ellipse
                cx="260"
                cy="410"
                rx="180"
                ry="24"
                fill={isDarkMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.08)'}
                filter="url(#neonGlowAvo)"
              />
            </g>
          )}

          {/* LETTER 'a' (comes from left) */}
          <g
            transform={`translate(${aX}, ${aY}) scale(${aScale})`}
            opacity={aOpacity}
            className="transition-all duration-700 ease-out"
          >
            {/* Letter Shadow */}
            <text
              x="2"
              y="44"
              fontSize="110"
              fontWeight="900"
              fontFamily="system-ui, -apple-system, sans-serif"
              textAnchor="middle"
              fill="rgba(0,0,0,0.5)"
              filter="url(#neonGlowAvo)"
            >
              a
            </text>
            {/* Letter Outline Glow */}
            <text
              x="0"
              y="40"
              fontSize="110"
              fontWeight="900"
              fontFamily="system-ui, -apple-system, sans-serif"
              textAnchor="middle"
              stroke={isDarkMode ? '#38bdf8' : '#0284c7'}
              strokeWidth="6"
              fill="none"
              strokeOpacity="0.5"
            />
            {/* Letter Fill */}
            <text
              x="0"
              y="40"
              fontSize="110"
              fontWeight="900"
              fontFamily="system-ui, -apple-system, sans-serif"
              textAnchor="middle"
              fill={isDarkMode ? '#ffffff' : '#0f172a'}
              className="tracking-tighter"
            >
              a
            </text>
            {/* Left speed streaks during arrival */}
            {phase === 'letters_arrive' && (
              <g stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" opacity="0.8">
                <line x1="-80" y1="20" x2="-20" y2="20" />
                <line x1="-110" y1="40" x2="-40" y2="40" />
                <line x1="-70" y1="60" x2="-10" y2="60" />
              </g>
            )}
          </g>

          {/* LETTER 'o' (comes from right) */}
          <g
            transform={`translate(${oX}, ${oY}) scale(${oScale})`}
            opacity={oOpacity}
            className="transition-all duration-700 ease-out"
          >
            {/* Letter Shadow */}
            <text
              x="2"
              y="44"
              fontSize="110"
              fontWeight="900"
              fontFamily="system-ui, -apple-system, sans-serif"
              textAnchor="middle"
              fill="rgba(0,0,0,0.5)"
              filter="url(#neonGlowAvo)"
            >
              o
            </text>
            {/* Letter Outline Glow */}
            <text
              x="0"
              y="40"
              fontSize="110"
              fontWeight="900"
              fontFamily="system-ui, -apple-system, sans-serif"
              textAnchor="middle"
              stroke={isDarkMode ? '#38bdf8' : '#0284c7'}
              strokeWidth="6"
              fill="none"
              strokeOpacity="0.5"
            />
            {/* Letter Fill */}
            <text
              x="0"
              y="40"
              fontSize="110"
              fontWeight="900"
              fontFamily="system-ui, -apple-system, sans-serif"
              textAnchor="middle"
              fill={isDarkMode ? '#ffffff' : '#0f172a'}
              className="tracking-tighter"
            >
              o
            </text>
            {/* Right speed streaks during arrival */}
            {phase === 'letters_arrive' && (
              <g stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" opacity="0.8">
                <line x1="80" y1="20" x2="20" y2="20" />
                <line x1="110" y1="40" x2="40" y2="40" />
                <line x1="70" y1="60" x2="10" y2="60" />
              </g>
            )}
          </g>

          {/* LETTER 'v' (falls from top, caught by Spider-Man, fixed in place) */}
          <g
            transform={`translate(${vX}, ${vY}) rotate(${vRotate}) scale(${vScale})`}
            opacity={vOpacity}
            className="transition-all duration-500 ease-out"
          >
            {/* Letter Shadow */}
            <text
              x="2"
              y="44"
              fontSize="110"
              fontWeight="900"
              fontFamily="system-ui, -apple-system, sans-serif"
              textAnchor="middle"
              fill="rgba(0,0,0,0.6)"
              filter="url(#neonGlowAvo)"
            >
              v
            </text>
            {/* Electric Pulse around 'v' during catch/locking */}
            {(phase === 'caught_web' || phase === 'fixing_in_place' || phase === 'locked_avo') && (
              <text
                x="0"
                y="40"
                fontSize="110"
                fontWeight="900"
                fontFamily="system-ui, -apple-system, sans-serif"
                textAnchor="middle"
                stroke="#ef4444"
                strokeWidth="8"
                fill="none"
                filter="url(#webImpactGlow)"
                className="animate-pulse"
              />
            )}
            {/* Letter Outline Glow */}
            <text
              x="0"
              y="40"
              fontSize="110"
              fontWeight="900"
              fontFamily="system-ui, -apple-system, sans-serif"
              textAnchor="middle"
              stroke={
                phase === 'locked_avo' || phase === 'hanging_idle'
                  ? isDarkMode
                    ? '#38bdf8'
                    : '#0284c7'
                  : '#ef4444'
              }
              strokeWidth="6"
              fill="none"
              strokeOpacity="0.7"
            />
            {/* Letter Fill */}
            <text
              x="0"
              y="40"
              fontSize="110"
              fontWeight="900"
              fontFamily="system-ui, -apple-system, sans-serif"
              textAnchor="middle"
              fill={isDarkMode ? '#ffffff' : '#0f172a'}
              className="tracking-tighter"
            >
              v
            </text>
            {/* Falling Wind / Gravity Streaks */}
            {phase === 'v_falling' && (
              <g stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" opacity="0.8">
                <line x1="-30" y1="-50" x2="-30" y2="-90" />
                <line x1="0" y1="-60" x2="0" y2="-110" />
                <line x1="30" y1="-50" x2="30" y2="-90" />
              </g>
            )}
          </g>

          {/* SPIDER-MAN CHARACTER (Dynamic Vector Illustration) */}
          <g
            transform={`translate(${spideyX}, ${spideyY}) rotate(${spideyRotate}) scale(${spideyScale})`}
            opacity={spideyOpacity}
            className={`transition-all duration-400 ease-out cursor-pointer group ${
              phase === 'hanging_idle' ? 'animate-spidey-sway' : ''
            }`}
            onClick={(e) => {
              e.stopPropagation();
              playSound('thwip');
              setSpideyPose((prev) => (prev === 'hanging' ? 'shooting' : 'hanging'));
            }}
          >
            {/* Spider-Man Hanging / Acrobat Character Group */}
            <g transform="translate(-40, -45)">
              {/* Body Torso */}
              {/* Blue Suit Side Flanks */}
              <path
                d="M 24 38 C 20 48, 20 62, 25 72 L 55 72 C 60 62, 60 48, 56 38 Z"
                fill="url(#spideyBlueSuit)"
              />

              {/* Red Suit Center Chest & Shoulders */}
              <path
                d="M 28 32 C 32 30, 48 30, 52 32 C 58 38, 52 64, 40 70 C 28 64, 22 38, 28 32 Z"
                fill="url(#spideyRedSuit)"
                stroke="#111827"
                strokeWidth="1.2"
              />

              {/* Chest Web Lines */}
              <path
                d="M 40 32 L 40 70 M 28 42 Q 40 48 52 42 M 27 52 Q 40 58 53 52 M 30 62 Q 40 66 50 62"
                fill="none"
                stroke="#111827"
                strokeWidth="0.9"
                strokeOpacity="0.75"
              />

              {/* Black Spider Emblem on Chest */}
              <g transform="translate(40, 50) scale(0.7)">
                <ellipse cx="0" cy="0" rx="3.5" ry="5.5" fill="#000000" />
                {/* 8 Spider Legs */}
                <path
                  d="M -3 -2 Q -10 -9 -7 -14 M 3 -2 Q 10 -9 7 -14 M -3 0 Q -12 -2 -11 6 M 3 0 Q 12 -2 11 6 M -3 2 Q -12 8 -9 14 M 3 2 Q 12 8 9 14 M -2 4 Q -7 12 -5 16 M 2 4 Q 7 12 5 16"
                  fill="none"
                  stroke="#000000"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </g>

              {/* Left Arm / Hand (holding web or firing shooter) */}
              <g transform="translate(18, 36) rotate(-25)">
                <path
                  d="M 0 0 C -8 10, -12 24, -10 35 L -3 36 C -5 26, -1 12, 6 2 Z"
                  fill="url(#spideyBlueSuit)"
                  stroke="#111827"
                  strokeWidth="1"
                />
                {/* Red Forearm Gauntlet */}
                <path
                  d="M -10 24 C -12 32, -10 40, -6 44 L 2 42 C -2 36, -4 28, -2 22 Z"
                  fill="url(#spideyRedSuit)"
                  stroke="#111827"
                  strokeWidth="1"
                />
                {/* Iconic Web-Shooter Hand Pose */}
                <g transform="translate(-5, 45)">
                  <circle cx="0" cy="0" r="4.5" fill="url(#spideyRedSuit)" />
                  {/* Fingers: thumb & pinky out, middle fingers pressed */}
                  <path
                    d="M -3 0 L -6 5 M 3 0 L 6 5 M -1 0 L -1 3 M 1 0 L 1 3"
                    stroke="#111827"
                    strokeWidth="1.2"
                  />
                  {/* Web Shooter Trigger Spark */}
                  {showWebToV && (
                    <circle cx="0" cy="5" r="3" fill="#ffffff" filter="url(#webImpactGlow)" />
                  )}
                </g>
              </g>

              {/* Right Arm / Hand (gripping web line or reaching out) */}
              <g transform="translate(62, 36) rotate(25)">
                <path
                  d="M 0 0 C 8 10, 12 24, 10 35 L 3 36 C 5 26, 1 12, -6 2 Z"
                  fill="url(#spideyBlueSuit)"
                  stroke="#111827"
                  strokeWidth="1"
                />
                {/* Red Forearm Gauntlet */}
                <path
                  d="M 10 24 C 12 32, 10 40, 6 44 L -2 42 C 2 36, 4 28, 2 22 Z"
                  fill="url(#spideyRedSuit)"
                  stroke="#111827"
                  strokeWidth="1"
                />
                {/* Hand Gripping Web Strand */}
                <circle cx="4" cy="45" r="4.5" fill="url(#spideyRedSuit)" />
              </g>

              {/* Legs / Lower Torso */}
              <g transform="translate(40, 72)">
                {/* Blue Tights */}
                <path
                  d="M -15 0 C -20 18, -24 35, -20 50 L -12 50 C -15 36, -12 20, -5 0 Z"
                  fill="url(#spideyBlueSuit)"
                  stroke="#111827"
                  strokeWidth="1"
                />
                <path
                  d="M 15 0 C 20 18, 24 35, 20 50 L 12 50 C 15 36, 12 20, 5 0 Z"
                  fill="url(#spideyBlueSuit)"
                  stroke="#111827"
                  strokeWidth="1"
                />
                {/* Red Boots */}
                <path
                  d="M -22 45 C -25 55, -28 62, -18 64 L -10 63 C -13 56, -13 50, -12 45 Z"
                  fill="url(#spideyRedSuit)"
                  stroke="#111827"
                  strokeWidth="1"
                />
                <path
                  d="M 22 45 C 25 55, 28 62, 18 64 L 10 63 C 13 56, 13 50, 12 45 Z"
                  fill="url(#spideyRedSuit)"
                  stroke="#111827"
                  strokeWidth="1"
                />
              </g>

              {/* SPIDER-MAN MASK / HEAD */}
              <g transform="translate(40, 18)">
                {/* Head Shape */}
                <ellipse
                  cx="0"
                  cy="0"
                  rx="15"
                  ry="18"
                  fill="url(#spideyRedSuit)"
                  stroke="#111827"
                  strokeWidth="1.5"
                />

                {/* Mask Web Pattern */}
                <path
                  d="M 0 -18 L 0 18 M -15 0 L 15 0 M -12 -9 L 12 9 M -12 9 L 12 -9"
                  fill="none"
                  stroke="#111827"
                  strokeWidth="0.8"
                  strokeOpacity="0.75"
                />
                <ellipse cx="0" cy="0" rx="6" ry="7" fill="none" stroke="#111827" strokeWidth="0.8" />
                <ellipse cx="0" cy="0" rx="11" ry="13" fill="none" stroke="#111827" strokeWidth="0.8" />

                {/* Iconic White Spider Eyes with Thick Black Outlines */}
                {/* Left Eye */}
                <path
                  d="M -3 -2 Q -8 -7 -13 -2 C -15 4 -12 9 -3 4 Z"
                  fill="url(#spideyEyeGrad)"
                  stroke="#000000"
                  strokeWidth="2"
                  filter="url(#neonGlowAvo)"
                />
                {/* Right Eye */}
                <path
                  d="M 3 -2 Q 8 -7 13 -2 C 15 4 12 9 3 4 Z"
                  fill="url(#spideyEyeGrad)"
                  stroke="#000000"
                  strokeWidth="2"
                  filter="url(#neonGlowAvo)"
                />
              </g>
            </g>
          </g>

          {/* DYNAMIC COMIC POP BUBBLE / ACTION CALLOUT */}
          {comicText && (
            <g
              transform={`translate(${comicText.x}, ${comicText.y})`}
              className="animate-bounce pointer-events-none"
            >
              <g transform="translate(-70, -25)">
                {/* Starburst Badge Background */}
                <path
                  d="M 0 0 L 15 -8 L 35 -6 L 50 -14 L 65 -7 L 85 -10 L 95 0 L 108 8 L 102 24 L 112 36 L 98 48 L 84 54 L 70 60 L 52 52 L 35 62 L 20 50 L 5 54 L -6 40 L -2 24 L -12 12 Z"
                  fill={comicText.color}
                  stroke="#000000"
                  strokeWidth="2"
                  filter="url(#neonGlowAvo)"
                />
                <text
                  x="50"
                  y="24"
                  fontSize="15"
                  fontWeight="900"
                  fontFamily="Impact, sans-serif"
                  textAnchor="middle"
                  fill="#ffffff"
                  stroke="#000000"
                  strokeWidth="0.8"
                  letterSpacing="0.5"
                >
                  {comicText.text}
                </text>
                {comicText.sub && (
                  <text
                    x="50"
                    y="40"
                    fontSize="9"
                    fontWeight="800"
                    fontFamily="system-ui, sans-serif"
                    textAnchor="middle"
                    fill="#ffffff"
                  >
                    {comicText.sub}
                  </text>
                )}
              </g>
            </g>
          )}

          {/* USER INTERACTIVE WEBS (Created on Click) */}
          {interactiveWebs.map((web) => (
            <g key={web.id} transform={`translate(${web.x}, ${web.y}) rotate(${web.angle})`}>
              <line x1="-40" y1="0" x2="40" y2="0" stroke="#ffffff" strokeWidth="2.5" />
              <line x1="0" y1="-40" x2="0" y2="40" stroke="#ffffff" strokeWidth="2.5" />
              <line x1="-28" y1="-28" x2="28" y2="28" stroke="#ffffff" strokeWidth="1.5" />
              <line x1="-28" y1="28" x2="28" y2="-28" stroke="#ffffff" strokeWidth="1.5" />
              <circle r="18" fill="none" stroke="#ffffff" strokeWidth="1.8" strokeDasharray="3 3" />
              <circle r="32" fill="none" stroke="#ffffff" strokeWidth="1.2" strokeDasharray="4 4" />
              <circle r="4" fill="#38bdf8" filter="url(#webImpactGlow)" />
            </g>
          ))}
        </svg>
      </div>

      {/* Dynamic Status / Interactive Hint Footer */}
      <div className="w-full px-6 py-2 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              phase === 'locked_avo' || phase === 'hanging_idle'
                ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]'
                : 'bg-amber-500 animate-pulse'
            }`}
          />
          <span className="text-xs font-bold tracking-wide uppercase text-zinc-400">
            {phase === 'locked_avo' || phase === 'hanging_idle'
              ? 'avo brand secured & assembled'
              : phase === 'v_falling'
              ? 'Interception in progress...'
              : 'Web sling sequence active'}
          </span>
        </div>

        <div className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">
          Tip: Click canvas to shoot webs 🕸️
        </div>
      </div>
    </div>
  );
};

export default SpidermanAvoAnimation;
