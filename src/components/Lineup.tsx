import React from 'react';
import { Music, ArrowRight, EyeOff, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { yepAsset } from '../lib/assets';
import { cn } from './Layout';

const artists = [
  {
    id: 1,
    name: 'MYSTERY ACT 01',
    genre: 'MYSTERY VOCALIST',
    time: 'TBA',
    stage: 'MAIN STAGE',
    description: 'This artist will be revealed soon. Read the clues and keep guessing.',
    img: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=1200',
    revealed: false,
    hintTags: ['“Ngồi đợi biết bao mùa...”', 'Billie Eilish Việt Nam', 'Em Xinh Say Hi', 'not a pitbull', 'alt-pop energy', 'soft whale frequency'],
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
    hintTags: ['Cựu thành viên P336', 'Tốt nghiệp Ngôn ngữ Anh ĐHKHXH&NV', 'Đỗ Việt Tiến', 'T-up', 'Hoà âm phối khí trong 5 ngày', 'boygroup roots'],
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
    hintTags: ['Giọng hát Việt 2013', 'Em không quay về', 'Dành cho em', 'Gia đình nghệ thuật', 'Giải Làn Sóng Xanh', 'R&B pop songwriter'],
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
    hintTags: ['We go hard', '(Nhà sản xuất) Rap Việt', 'Dám rực rỡ', 'HIEUTHUHAI', 'tlinh', 'GREY D', 'Wren Evans'],
  },
];

const revealedCount = artists.filter(a => a.revealed).length;
const totalCount = artists.length;

export function Lineup() {
  return (
    <div className="w-full max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-16">
      {/* Header */}
      <section className="mb-12 md:mb-16 relative">
        <div className="border-4 border-primary p-8 md:p-14 bg-primary text-white neo-shadow relative overflow-hidden min-h-[420px] md:min-h-[520px] flex items-center">
          <img
            src={yepAsset('background-stage-light.webp')}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-primary/65" />
          <div className="relative z-10 max-w-3xl">
            <span className="inline-block font-display text-on-surface-variant font-bold tracking-widest uppercase text-xs md:text-sm mb-4 bg-secondary/10 border-2 border-secondary/30 px-3 py-1">
              THE COMPLETE LINEUP
            </span>
            <h1 className="font-display text-6xl md:text-8xl lg:text-[8rem] font-black uppercase leading-[0.82] tracking-tighter">
              ARTIST<br />
              <span className="text-tertiary">SHOWCASE</span>
            </h1>
            <p className="font-body text-base md:text-lg text-white/75 max-w-xl leading-relaxed mt-6">
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
          <section
            key={artist.id}
            className="border-4 border-primary bg-surface overflow-hidden grid grid-cols-1 lg:grid-cols-2 neo-shadow-sm"
          >
            <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
              <img
                src={artist.img}
                alt={artist.name}
                className="w-full h-[300px] md:h-[400px] lg:h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%23141a24' width='400' height='400'/%3E%3Ctext fill='%23a7b3c7' font-family='monospace' font-size='20' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3EPhoto%3C/text%3E%3C/svg%3E`;
                }}
              />
            </div>
            <div className="p-6 md:p-10 lg:p-12 flex flex-col justify-center">
              <p className="font-display text-xs font-bold uppercase tracking-widest text-tertiary mb-2">
                Artist #{String(index + 1).padStart(2, '0')}
              </p>
              <h2 className="font-display text-4xl md:text-5xl font-black uppercase tracking-tight leading-none text-white">
                {artist.name}
              </h2>
              <p className="font-body text-sm md:text-base font-bold uppercase tracking-widest text-tertiary mt-3">
                {artist.genre}
              </p>
              <div className="mt-6 flex items-center gap-3 text-sm border-2 border-outline-variant bg-primary-container/50 p-3">
                <Music className="w-4 h-4 shrink-0 text-tertiary" />
                <span className="font-display font-bold uppercase tracking-wider">{artist.stage}</span>
                <span className="text-on-surface-variant">•</span>
                <span className="font-display text-xs font-bold tracking-wider text-on-surface-variant">{artist.time}</span>
              </div>
              <p className="font-body text-sm md:text-base text-on-surface-variant font-medium leading-relaxed mt-6 max-w-xl">
                {artist.description}
              </p>
            </div>
          </section>
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
          <p className="font-body text-sm text-on-surface-variant font-medium">June 27, 2026 at VinUni Amphitheatre</p>
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
