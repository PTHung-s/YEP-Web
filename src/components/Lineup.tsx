import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Music, ArrowRight, EyeOff, Clock, Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { yepAsset } from '../lib/assets';
import { cn } from './Layout';

interface Song {
  title: string;
  vibe: string;
  accent: string;       // hex m\u00e0u accent cho song card
  coverUrl?: string;    // \u1ea3nh b\u00eca b\u00e0i h\u00e1t (placeholder n\u1ebfu ch\u01b0a c\u00f3)
  audioUrl?: string;    // file audio snippet
}

interface Artist {
  id: number;
  name: string;
  genre: string;
  time: string;
  stage: string;
  description: string;
  img: string;
  revealed: boolean;
  hintTags: string[];
  songs?: Song[];
}

const artists: Artist[] = [
  {
    id: 1,
    name: 'HO\u00c0NG T\u00d4N',
    genre: 'R&B POP SINGER-SONGWRITER',
    time: 'TBA',
    stage: 'MAIN STAGE',
    description: 'Gi\u1ecdng h\u00e1t R&B \u0111\u1ea7y n\u1ed9i l\u1ef1c, t\u1eebng g\u00e2y \u1ea5n t\u01b0\u1ee3ng t\u1ea1i Gi\u1ecdng H\u00e1t Vi\u1ec7t 2013. Ho\u00e0ng T\u00f4n mang \u0111\u1ebfn th\u1ee9 \u00e2m nh\u1ea1c pop-R&B gi\u00e0u c\u1ea3m x\u00fac, \u0111\u01b0\u1ee3c y\u00eau m\u1ebfn qua lo\u1ea1t hit nh\u01b0 D\u00e0nh Cho Em, Y\u00eau Em R\u1ea5t Nhi\u1ec1u.',
    img: yepAsset('HoangTon.png'),
    revealed: true,
    hintTags: ['Gi\u1ecdng h\u00e1t Vi\u1ec7t 2013', 'Em kh\u00f4ng quay v\u1ec1', 'D\u00e0nh cho em', 'Gia \u0111\u00ecnh ngh\u1ec7 thu\u1eadt', 'Gi\u1ea3i L\u00e0n S\u00f3ng Xanh', 'R&B pop songwriter'],
    songs: [
      { title: 'Em C\u00f2n Nh\u1edb Anh Kh\u00f4ng?', vibe: 'feat. Koo', accent: '#ff2ea6', coverUrl: 'https://i.ytimg.com/vi/n2x-V0dq7qQ/hqdefault.jpg?sqp=-oaymwEmCKgBEF5IWvKriqkDGQgBFQAAiEIYAdgBAeIBCggYEAIYBjgBQAE=&rs=AOn4CLAoLgi-mrL42vs06ceIw0NrR3jQnw', audioUrl: yepAsset('audio/em-con-nho-anh-khong.mp3') },
      { title: 'T\u00ecnh Y\u00eau Ng\u1ee7 Qu\u00ean', vibe: 'ft. LyHan', accent: '#1ecfff', coverUrl: 'https://i.ytimg.com/vi/eukA1NGSM5w/hqdefault.jpg?sqp=-oaymwEmCKgBEF5IWvKriqkDGQgBFQAAiEIYAdgBAeIBCggYEAIYBjgBQAE=&rs=AOn4CLCow0XAUlXsktPb8E6wefzyEiUmpw', audioUrl: yepAsset('audio/tinh-yeu-ngu-quen.mp3') },
    ],
  },
  {
    id: 2,
    name: 'MYSTERY ACT 02',
    genre: 'MYSTERY PERFORMER',
    time: 'TBA',
    stage: 'MAIN STAGE',
    description: 'This artist will be revealed soon. Read the clues and keep guessing.',
    img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=1200',
    revealed: false,
    hintTags: ['C\u1ef1u th\u00e0nh vi\u00ean P336', 'T\u1ed1t nghi\u1ec7p Ng\u00f4n ng\u1eef Anh \u0110HKHXH&NV', '\u0110\u1ed7 Vi\u1ec7t Ti\u1ebfn', 'T-up', 'Ho\u00e0 \u00e2m ph\u1ed1i kh\u00ed trong 5 ng\u00e0y', 'boygroup roots'],
  },
  {
    id: 3,
    name: 'MYSTERY ACT 03',
    genre: 'MYSTERY SINGER',
    time: 'TBA',
    stage: 'MAIN STAGE',
    description: 'This artist will be revealed soon. Read the clues and keep guessing.',
    img: 'https://images.unsplash.com/photo-1493225457224-eda0e6fdc758?auto=format&fit=crop&q=80&w=1200',
    revealed: false,
    hintTags: ['"Ng\u1ed3i \u0111\u1ee3i bi\u1ebft bao m\u00f9a..."', 'Billie Eilish Vi\u1ec7t Nam', 'Em Xinh Say Hi', 'not a pitbull', 'alt-pop energy', 'soft whale frequency'],
  },
  {
    id: 4,
    name: 'MYSTERY ACT 04',
    genre: 'MYSTERY PRODUCER',
    time: 'TBA',
    stage: 'MAIN STAGE',
    description: 'This artist will be revealed soon. Read the clues and keep guessing.',
    img: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&q=80&w=1200',
    revealed: false,
    hintTags: ['We go hard', '(Nh\u00e0 s\u1ea3n xu\u1ea5t) Rap Vi\u1ec7t', 'D\u00e1m r\u1ef1c r\u1ee1', 'HIEUTHUHAI', 'tlinh', 'GREY D', 'Wren Evans'],
  },
];

const revealedCount = artists.filter(a => a.revealed).length;
const totalCount = artists.length;
const firstRevealedId = artists.find(a => a.revealed)?.id;

/* ─────── Revealed Artist Card (has its own hooks) ─────── */
function RevealedArtistCard({ artist, index }: { artist: Artist; index: number }) {
  const songScrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const [activeSongIdx, setActiveSongIdx] = useState(0);
  const [playingSongIdx, setPlayingSongIdx] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const songs = artist.songs || [];
  const isFirstRevealed = artist.id === firstRevealedId;
  const cardRef = useRef<HTMLElement>(null);
  const hasAutoPlayedRef = useRef(false);

  // Draw real-time waveform on active song's canvas
  const drawWaveform = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const canvas = canvasRefs.current[playingSongIdx ?? -1];
    if (!canvas) { animFrameRef.current = requestAnimationFrame(drawWaveform); return; }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    ctx.clearRect(0, 0, W, H);

    const barCount = 48;
    const barWidth = (W / barCount) * 0.7;
    const gap = (W / barCount) * 0.3;
    const step = Math.floor(bufferLength / barCount);

    const accent = songs[playingSongIdx ?? 0]?.accent || '#1ecfff';
    for (let i = 0; i < barCount; i++) {
      const value = dataArray[i * step] / 255;
      const barHeight = Math.max(2, value * H * 0.85);
      const x = i * (barWidth + gap);
      const y = H - barHeight;

      ctx.fillStyle = accent;
      ctx.globalAlpha = 0.3 + value * 0.7;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, 1);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    animFrameRef.current = requestAnimationFrame(drawWaveform);
  }, [playingSongIdx, songs]);

  // Start/stop waveform animation
  useEffect(() => {
    if (isPlaying && analyserRef.current) {
      animFrameRef.current = requestAnimationFrame(drawWaveform);
    } else {
      cancelAnimationFrame(animFrameRef.current);
    }
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isPlaying, drawWaveform]);

  // Update canvas refs array
  useEffect(() => {
    canvasRefs.current = canvasRefs.current.slice(0, songs.length);
  }, [songs.length]);

  const togglePlay = useCallback((sIdx: number) => {
    const song = songs[sIdx];
    if (!song?.audioUrl) return;

    if (playingSongIdx === sIdx && isPlaying) {
      audioRef.current?.pause();
      return;
    }

    if (playingSongIdx === sIdx && !isPlaying) {
      audioRef.current?.play().catch(() => {});
      return;
    }

    // Different song — init audio element + Web Audio API
    const setupAudio = async () => {
      if (!audioRef.current) {
        const audio = new Audio();
        audio.addEventListener('ended', () => { setIsPlaying(false); setCurrentTime(0); });
        audio.addEventListener('pause', () => setIsPlaying(false));
        audio.addEventListener('play', () => setIsPlaying(true));
        audio.addEventListener('timeupdate', () => setCurrentTime(audio.currentTime));
        audio.addEventListener('loadedmetadata', () => setDuration(audio.duration));
        audioRef.current = audio;
      }

      // Init AudioContext + Analyser on first user gesture
      if (!audioCtxRef.current) {
        const ctx = new AudioContext();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        const source = ctx.createMediaElementSource(audioRef.current);
        source.connect(analyser);
        analyser.connect(ctx.destination);
        audioCtxRef.current = ctx;
        analyserRef.current = analyser;
      }

      if (audioCtxRef.current.state === 'suspended') {
        await audioCtxRef.current.resume();
      }

      audioRef.current.src = song.audioUrl;
      setCurrentTime(0);
      setDuration(0);
      audioRef.current.play().catch(() => {});
      setPlayingSongIdx(sIdx);
    };

    setupAudio();
  }, [songs, playingSongIdx, isPlaying]);

  // Auto-play first song when card scrolls into view, pause when leaving
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            if (!hasAutoPlayedRef.current && songs.length > 0 && songs[0]?.audioUrl) {
              hasAutoPlayedRef.current = true;
              setTimeout(() => togglePlay(0), 300);
            }
          } else if (!entry.isIntersecting) {
            if (isPlaying && playingSongIdx !== null) {
              audioRef.current?.pause();
            }
          }
        });
      },
      { threshold: [0, 0.5] }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [songs, isPlaying, playingSongIdx, togglePlay]);

  const handleSongScroll = useCallback(() => {
    const el = songScrollRef.current;
    if (!el || songs.length === 0) return;
    const idx = Math.round(el.scrollLeft / (el.scrollWidth / songs.length));
    setActiveSongIdx(Math.min(idx, songs.length - 1));
  }, [songs.length]);

  const scrollToSong = (dir: 'prev' | 'next') => {
    const el = songScrollRef.current;
    if (!el || songs.length === 0) return;
    const cardWidth = el.scrollWidth / songs.length;
    el.scrollBy({ left: dir === 'next' ? cardWidth : -cardWidth, behavior: 'smooth' });
  };

  return (
    <section
      ref={cardRef}
      className={cn(
        'border-4 border-primary bg-surface overflow-hidden neo-shadow-sm',
        isFirstRevealed && 'animate-reveal-glow'
      )}
    >
      {/* Main content: 40% square image | 60% info + songs */}
      <div className="grid grid-cols-1 lg:grid-cols-[40%_60%]">
        {/* LEFT: Square image */}
        <div className="aspect-square overflow-hidden border-b-4 lg:border-b-0 lg:border-r-4 border-primary bg-surface-container">
          <img
            src={artist.img}
            alt={artist.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              const target = e.currentTarget;
              target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%23141a24' width='400' height='400'/%3E%3Ctext fill='%23a7b3c7' font-family='monospace' font-size='20' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3EPhoto%3C/text%3E%3C/svg%3E`;
            }}
          />
        </div>

        {/* RIGHT: Artist info + Song cards */}
        <div className="p-5 md:p-6 lg:p-8 flex flex-col min-h-0">
          {/* Top row: number + badge */}
          <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
            <p className="font-display text-xs font-bold uppercase tracking-widest text-tertiary">
              ARTIST #{String(index + 1).padStart(2, '0')}
            </p>
            {isFirstRevealed && (
              <span className="inline-flex items-center gap-1.5 font-display text-[10px] font-black uppercase tracking-[0.2em] text-white bg-secondary border-2 border-secondary px-3 py-1.5 animate-kaleido-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                JUST ANNOUNCED
              </span>
            )}
          </div>

          {/* Artist name */}
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-tight leading-none text-white">
            {artist.name}
          </h2>
          <p className="font-body text-sm md:text-base font-bold uppercase tracking-widest text-tertiary mt-2">
            {artist.genre}
          </p>

          {/* Stage + Time */}
          <div className="mt-3 flex items-center gap-3 text-sm border-2 border-outline-variant bg-primary-container/50 p-2.5 w-fit">
            <Music className="w-4 h-4 shrink-0 text-tertiary" />
            <span className="font-display font-bold uppercase tracking-wider text-on-surface-variant text-xs">{artist.stage}</span>
            <span className="text-on-surface-variant">•</span>
            <span className="font-display text-xs font-bold tracking-wider text-on-surface-variant">{artist.time}</span>
          </div>

          {/* Description */}
          <p className="font-body text-sm text-on-surface-variant font-medium leading-relaxed mt-3 line-clamp-2">
            {artist.description}
          </p>

          {/* Song previews — Spotify-style cards */}
          {songs.length > 0 && (
            <div className="mt-auto pt-4">
              <p className="font-display text-[10px] font-black uppercase tracking-[0.25em] text-tertiary/70 mb-3 flex items-center gap-2">
                <span className="w-4 h-px bg-tertiary/30" />
                PREVIEW TRACKS
                <span className="w-4 h-px bg-tertiary/30" />
              </p>

              {/* Horizontal scroll container */}
              <div className="relative group">
                {/* Left/Right nav arrows — desktop */}
                {songs.length > 1 && (
                  <>
                    <button
                      onClick={() => scrollToSong('prev')}
                      className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 items-center justify-center rounded-full bg-background/90 border-2 border-outline-variant text-on-surface-variant hover:text-tertiary hover:border-tertiary transition-colors -ml-1 opacity-0 group-hover:opacity-100"
                      aria-label="Previous song"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => scrollToSong('next')}
                      className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 items-center justify-center rounded-full bg-background/90 border-2 border-outline-variant text-on-surface-variant hover:text-tertiary hover:border-tertiary transition-colors -mr-1 opacity-0 group-hover:opacity-100"
                      aria-label="Next song"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}

                <div
                  ref={songScrollRef}
                  onScroll={handleSongScroll}
                  className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {songs.map((song, sIdx) => {
                    const isActive = playingSongIdx === sIdx && isPlaying;
                    const progress = playingSongIdx === sIdx && duration > 0 ? currentTime / duration : 0;
                    const fmtTime = (t: number) => {
                      if (!isFinite(t) || t <= 0) return '0:00';
                      const m = Math.floor(t / 60);
                      const s = Math.floor(t % 60);
                      return `${m}:${String(s).padStart(2, '0')}`;
                    };

                    return (
                    <div
                      key={sIdx}
                      className={cn(
                        'snap-start flex-shrink-0 w-[290px] md:w-[320px] border-2 bg-surface-container-high transition-all group/card cursor-pointer flex flex-row',
                        isActive ? '' : 'border-outline-variant hover:border-outline'
                      )}
                      style={isActive ? {
                        borderColor: song.accent || '#1ecfff',
                        boxShadow: `0 0 14px ${song.accent || '#1ecfff'}35`,
                      } : undefined}
                    >
                      {/* LEFT: Cover image + play button overlay */}
                      <div
                        className="w-[100px] md:w-[110px] flex-shrink-0 relative overflow-hidden"
                        style={{ backgroundColor: song.accent ? `${song.accent}18` : '#1b2230' }}
                      >
                        {song.coverUrl ? (
                          <img
                            src={song.coverUrl}
                            alt={song.title}
                            className="absolute inset-0 w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <span
                            className="absolute inset-0 flex items-center justify-center font-display text-2xl font-black opacity-15"
                            style={{ color: song.accent || '#1ecfff' }}
                          >
                            {String(sIdx + 1).padStart(2, '0')}
                          </span>
                        )}
                        {/* Play/Pause overlay */}
                        <button
                          onClick={(e) => { e.stopPropagation(); togglePlay(sIdx); }}
                          disabled={!song.audioUrl}
                          className={cn(
                            'absolute inset-0 flex items-center justify-center transition-all',
                            song.audioUrl ? 'opacity-0 group-hover/card:opacity-100' : '',
                            !song.audioUrl && 'cursor-not-allowed'
                          )}
                          style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
                          aria-label={isActive ? 'Pause' : 'Play'}
                        >
                          <div className="w-9 h-9 rounded-full border-2 flex items-center justify-center"
                            style={{ borderColor: song.accent || '#1ecfff', backgroundColor: `${song.accent}30` }}
                          >
                            {isActive ? (
                              <Pause className="w-4 h-4" style={{ color: song.accent || '#1ecfff' }} />
                            ) : (
                              <Play className="w-4 h-4 ml-0.5" style={{ color: song.accent || '#1ecfff' }} />
                            )}
                          </div>
                        </button>
                      </div>

                      {/* RIGHT: Info + waveform + progress */}
                      <div className="flex-1 flex flex-col justify-between p-2.5 md:p-3 min-w-0">
                        {/* Song title + vibe */}
                        <div>
                          <p className="font-display text-xs md:text-sm font-bold uppercase tracking-tight text-white truncate leading-tight">
                            {song.title}
                          </p>
                          {song.vibe && (
                            <p className="font-body text-[10px] uppercase tracking-widest font-medium mt-0.5 opacity-70"
                              style={{ color: song.accent || '#a7b3c7' }}
                            >
                              {song.vibe}
                            </p>
                          )}
                        </div>

                        {/* Waveform canvas OR EQ bars placeholder */}
                        <div className="my-1 flex-1 min-h-[28px] flex items-center">
                          {isActive ? (
                            <canvas
                              ref={(el) => { canvasRefs.current[sIdx] = el; }}
                              width={180}
                              height={36}
                              className="w-full h-full"
                              style={{ imageRendering: 'pixelated' }}
                            />
                          ) : (
                            <div className="flex items-end gap-[2px] h-5 opacity-30 w-full">
                              {Array.from({length: 24}).map((_, bi) => (
                                <div
                                  key={bi}
                                  className="w-[3px] rounded-full flex-1"
                                  style={{
                                    backgroundColor: song.accent || '#1ecfff',
                                    animation: `bar-eq-${(bi % 3) + 1} ${0.6 + bi * 0.12}s ease-in-out infinite`,
                                    animationDelay: `${bi * 0.1}s`,
                                  }}
                                />
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Progress bar + time */}
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[9px] text-on-surface-variant/60 w-8 text-right tabular-nums">
                            {playingSongIdx === sIdx ? fmtTime(currentTime) : '0:00'}
                          </span>
                          <div className="flex-1 h-1 bg-outline-variant rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-200"
                              style={{
                                width: `${progress * 100}%`,
                                backgroundColor: song.accent || '#1ecfff',
                              }}
                            />
                          </div>
                          <span className="font-mono text-[9px] text-on-surface-variant/60 w-8 tabular-nums">
                            {playingSongIdx === sIdx && duration > 0 ? fmtTime(duration) : '0:00'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )})}
                </div>
              </div>

              {/* Dot indicators */}
              {songs.length > 1 && (
                <div className="flex items-center justify-center gap-2 mt-3">
                  {songs.map((_, sIdx) => (
                    <button
                      key={sIdx}
                      onClick={() => {
                        const el = songScrollRef.current;
                        if (!el) return;
                        el.scrollTo({ left: (el.scrollWidth / songs.length) * sIdx, behavior: 'smooth' });
                      }}
                      className={cn(
                        'w-2 h-2 rounded-full transition-all duration-300',
                        sIdx === activeSongIdx
                          ? 'scale-125'
                          : 'opacity-40 hover:opacity-70'
                      )}
                      style={{
                        backgroundColor: sIdx === activeSongIdx ? (songs[activeSongIdx]?.accent || '#1ecfff') : '#a7b3c7',
                        boxShadow: sIdx === activeSongIdx ? `0 0 8px ${songs[activeSongIdx]?.accent || '#1ecfff'}` : 'none',
                      }}
                      aria-label={`Song ${sIdx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

    </section>
  );
}

export function Lineup() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-12 py-10 md:py-16">
      {/* Header */}
      <section className="mb-12 md:mb-16 relative">
        <div className="border-4 border-primary p-6 md:p-14 bg-primary text-white neo-shadow relative overflow-hidden min-h-[360px] md:min-h-[520px] flex items-center">
          <img
            src={yepAsset('background-stage-light.webp')}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-primary/65" />
          <div className="relative z-10 max-w-3xl">
            <span className="inline-block font-display text-on-surface-variant font-bold tracking-widest uppercase text-[10px] md:text-sm mb-4 bg-secondary/10 border-2 border-secondary/30 px-3 py-1">
              THE COMPLETE LINEUP
            </span>
            <h1 className="font-display text-[3.25rem] sm:text-6xl md:text-8xl lg:text-[8rem] font-black uppercase leading-[0.86] tracking-normal md:tracking-tighter break-words">
              ARTIST<br />
              <span className="text-tertiary">SHOWCASE</span>
            </h1>
            <p className="font-body text-sm md:text-lg text-white/75 max-w-xl leading-relaxed mt-5 md:mt-6">
              Four mystery acts. One main stage. One unforgettable night at YEP'26: The Kaleido Soul.
            </p>
          </div>
          <div className="absolute -right-20 -bottom-20 opacity-8 pointer-events-none">
            <div className="w-[400px] h-[400px] md:w-[700px] md:h-[700px] rounded-full border-[60px] md:border-[80px] border-white/10" />
          </div>
        </div>
      </section>

      {/* Reveal progress */}
      <div className="flex items-center gap-4 mb-8 border-2 border-outline-variant bg-surface-container/50 p-4">
        <Clock className="w-5 h-5 text-tertiary" />
        <span className="font-display text-sm font-black uppercase tracking-widest text-on-surface-variant">
          {revealedCount} / {totalCount} ARTISTS REVEALED
        </span>
        <div className="flex-1 h-2 bg-surface-dim border border-outline-variant">
          <div className="h-full bg-tertiary transition-all duration-700" style={{ width: `${(revealedCount / totalCount) * 100}%` }} />
        </div>
      </div>

      {/* Artist List */}
      <div className="space-y-6 md:space-y-8">
        {artists.map((artist, index) => artist.revealed ? (
          <RevealedArtistCard key={artist.id} artist={artist} index={index} />
        ) : (
          <section
            key={artist.id}
            className="border-4 border-dashed border-outline-variant bg-surface-dim overflow-hidden grid grid-cols-1 lg:grid-cols-2 neo-shadow-sm opacity-70 hover:opacity-90 transition-opacity"
          >
            <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
              <div className="w-full h-[300px] md:h-[400px] lg:h-full bg-surface-container flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-transparent to-tertiary/5 animate-pulse" />
                <div className="relative z-10 text-center space-y-4">
                  <div className="w-20 h-20 md:w-28 md:h-28 mx-auto rounded-full border-4 border-dashed border-outline-variant bg-surface-container-high flex items-center justify-center">
                    <EyeOff className="w-10 h-10 md:w-14 md:h-14 text-on-surface-variant/50" />
                  </div>
                  <p className="font-display text-5xl md:text-7xl font-black text-on-surface-variant/40 tracking-tighter">???</p>
                </div>
              </div>
            </div>
            <div className="p-6 md:p-10 lg:p-12 flex flex-col justify-center items-center text-center">
              <span className="inline-block font-display text-xs font-bold uppercase tracking-[0.3em] text-secondary bg-secondary/5 border-2 border-secondary/20 px-4 py-2 mb-6">
                COMING SOON
              </span>
              <p className="font-display text-xs font-bold uppercase tracking-widest text-on-surface-variant/60 mb-2">
                ARTIST #{String(index + 1).padStart(2, '0')}
              </p>
              <h2 className="font-display text-4xl md:text-5xl font-black uppercase tracking-tight leading-none text-on-surface-variant/40">
                MYSTERY ACT
              </h2>
              <div className="mt-6 flex items-center gap-3 text-sm border-2 border-dashed border-outline-variant bg-surface-container/50 p-3">
                <Music className="w-4 h-4 shrink-0 text-on-surface-variant/60" />
                <span className="font-display font-bold uppercase tracking-wider text-on-surface-variant/60">
                  {artist.stage}
                </span>
                <span className="text-on-surface-variant/40">•</span>
                <span className="font-display text-xs font-bold tracking-wider text-on-surface-variant/60">
                  {artist.time}
                </span>
              </div>
              <p className="font-body text-sm md:text-base text-on-surface-variant/50 font-medium leading-relaxed mt-6 max-w-sm">
                This artist will be revealed soon. Stay tuned for the announcement.
              </p>
              <div className="mt-7 w-full max-w-xl overflow-hidden border-y-2 border-outline-variant bg-background/60 py-3">
                <div
                  className={cn(
                    'flex w-max gap-3 whitespace-nowrap',
                    index % 2 === 0 ? 'animate-marquee-seamless' : 'animate-marquee-seamless-reverse'
                  )}
                  style={{
                    animationDuration: `${24 + index * 3}s`,
                    animationDelay: `-${index * 4}s`,
                  }}
                >
                  {[...(artist.hintTags || []), ...(artist.hintTags || []), ...(artist.hintTags || []), ...(artist.hintTags || [])].map((hint, hintIndex) => (
                    <span
                      key={`${artist.id}-${hintIndex}`}
                      className="rounded-full border border-tertiary/50 bg-tertiary/10 px-4 py-2 font-display text-xs font-black uppercase tracking-widest text-tertiary"
                    >
                      {hint}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="mt-16 border-t-4 border-primary pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <p className="font-display text-lg md:text-xl font-black uppercase tracking-wider">READY TO SEE THEM LIVE?</p>
          <p className="font-body text-sm text-on-surface-variant font-medium">June 25, 2026 at VinUni Amphitheatre</p>
        </div>
        <Link
          to="/tickets"
          className="bg-secondary text-background border-4 border-secondary px-8 py-4 font-display font-black text-xl uppercase tracking-widest hover:bg-primary hover:text-white hover:border-primary transition-colors neo-shadow-sm active:translate-y-1 active:shadow-none inline-flex items-center gap-2"
        >
          GET TICKETS
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
