import React, { useState } from 'react';
import { Heart, PlusCircle, Crown, Users2, Camera, ExternalLink, Star, Sparkles, Trophy } from 'lucide-react';
import { cn } from './Layout';
import { yepAsset } from '../lib/assets';
import { useEventConfig } from '../store/EventConfigContext';

const REGISTRATION_LINK = 'https://forms.office.com/pages/responsepage.aspx?id=iSf4WJVmSk-r2zV2aNVc_7piQs8SyDVLv38cAsrkapVURDVPQ1QwQVpOR1FaQVRUWURTTEoxNDBCOS4u&route=shorturl';
const VOTE_URL = ''; // Set to Google Form voting URL when voting opens

const rounds = [
  {
    phase: 'ROUND 1',
    subtitle: 'Registration - Stardust Call',
    period: '30/5 - 04/6',
    icon: Users2,
    details: [
      'Duos register to join YEP Icons.',
      'The organizers record each pair profile and story.',
      'Standout faces advance to The Constellations journey.',
    ],
    criteria: [
      { label: 'Registration', pct: 'Stardust Call' },
    ],
  },
  {
    phase: 'ROUND 2',
    subtitle: 'Campaign - Constellation',
    period: '15/6 - 20/6',
    icon: Camera,
    details: [
      'Duos enter the official campaign phase.',
      'Photos and stories spread across media channels.',
      'Audiences follow, engage, and cheer for their favorite constellation.',
    ],
    criteria: [
      { label: 'Campaign', pct: 'Constellation' },
    ],
  },
  {
    phase: 'ROUND 3',
    subtitle: 'Final',
    period: '25/6',
    icon: Crown,
    details: [
      'Duos appear at YEP\u201926: The Kaleido Soul.',
      'The final moment unfolds live at the event.',
      'YEP Icons are crowned on finale night.',
    ],
    criteria: [
      { label: 'Final', pct: '25/6' },
    ],
  },
];

interface Top8Entry {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  imageUrl: string;
}

const top8Data: Top8Entry[] = [
  {
    id: '1',
    name: 'T\u00ean c\u1eb7p \u0111\u00f4i 1',
    subtitle: 'CLASS OF 2027',
    description: '"We are the definition of harmony. Together, we create a Kaleidoscope bursting with color at VinUni."',
    imageUrl: 'https://images.unsplash.com/photo-1516571748831-5d81767b788d?w=400&h=400&fit=crop',
  },
  {
    id: '2',
    name: 'T\u00ean c\u1eb7p \u0111\u00f4i 2',
    subtitle: 'CLASS OF 2026',
    description: '"From late-night study sessions to all-nighter projects — we have always stood by each other."',
    imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop',
  },
  {
    id: '3',
    name: 'T\u00ean c\u1eb7p \u0111\u00f4i 3',
    subtitle: 'CLASS OF 2028',
    description: '"Two seemingly opposite pieces, yet when combined, they create a perfect picture."',
    imageUrl: 'https://images.unsplash.com/photo-1506863530036-1efeddceb993?w=400&h=400&fit=crop',
  },
  {
    id: '4',
    name: 'T\u00ean c\u1eb7p \u0111\u00f4i 4',
    subtitle: 'CLASS OF 2025',
    description: '"The energy of youth, the passion of art — we bring it all to the YEP stage."',
    imageUrl: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=400&fit=crop',
  },
  {
    id: '5',
    name: 'T\u00ean c\u1eb7p \u0111\u00f4i 5',
    subtitle: 'CLASS OF 2026',
    description: '"More than classmates, we are soulmates — where every moment becomes a cherished memory."',
    imageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop',
  },
  {
    id: '6',
    name: 'T\u00ean c\u1eb7p \u0111\u00f4i 6',
    subtitle: 'CLASS OF 2027',
    description: '"Together we overcome every challenge, and YEP is the stage where we shine."',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop',
  },
  {
    id: '7',
    name: 'T\u00ean c\u1eb7p \u0111\u00f4i 7',
    subtitle: 'CLASS OF 2028',
    description: '"Every day together is a new chapter in our story. YEP will be the most beautiful one."',
    imageUrl: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?w=400&h=400&fit=crop',
  },
  {
    id: '8',
    name: 'T\u00ean c\u1eb7p \u0111\u00f4i 8',
    subtitle: 'CLASS OF 2026',
    description: '"From our first steps at VinUni to the YEP stage — this journey is ours."',
    imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop',
  },
];

export function Vote() {
  const { config } = useEventConfig();
  const [tab, setTab] = useState<'info' | 'prizes' | 'top8'>(config.top8Enabled ? 'top8' : 'info');

  return (
    <div className="w-full max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-16">
      {/* Header */}
      <section className="mb-10 md:mb-16 relative">
        <div className="border-4 border-primary p-4 sm:p-6 md:p-10 bg-primary text-white neo-shadow relative overflow-hidden min-h-[280px] sm:min-h-[320px] md:min-h-[360px] flex items-end">
          <img
            src={yepAsset('background-stage-light.webp')}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-primary/55" />
          <div className="relative z-10">
            <h2 className="font-display text-3xl sm:text-5xl md:text-7xl lg:text-[8rem] font-black uppercase leading-[0.85] tracking-tighter text-white">
              YEP ICONS<br />THE CONSTELLATIONS
            </h2>
            <div className="mt-4 sm:mt-6 md:mt-8 border-l-8 border-primary-container pl-4 md:pl-6">
              <p className="font-display text-sm sm:text-lg md:text-xl font-bold max-w-2xl text-white/85 uppercase leading-tight">
                THE JOURNEY TO FIND THE MOST RADIANT DUO AT VINUNI 2026
              </p>
            </div>
          </div>
          <div className="absolute -right-32 -bottom-32 opacity-10 pointer-events-none">
            <div className="w-[400px] h-[400px] md:w-[600px] md:h-[600px] rounded-full border-[40px] md:border-[60px] border-primary"></div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex flex-col md:flex-row gap-0 mb-12 border-b-4 border-primary">
        <button
          onClick={() => setTab('info')}
          className={cn(
            'relative px-8 py-4 md:py-6 font-display text-xl md:text-2xl font-black uppercase tracking-widest flex items-center justify-center flex-1 transition-colors',
            tab === 'info' ? 'bg-primary text-white' : 'bg-surface text-on-surface-variant hover:bg-surface-container'
          )}
        >
          COMPETITION
          {tab === 'info' && (
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-6 md:w-8 h-4 bg-primary" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%)' }}></div>
          )}
        </button>
        <button
          onClick={() => setTab('prizes')}
          className={cn(
            'relative px-8 py-4 md:py-6 font-display text-xl md:text-2xl font-black uppercase tracking-widest flex items-center justify-center flex-1 transition-colors',
            tab === 'prizes' ? 'bg-primary text-white' : 'bg-surface text-on-surface-variant hover:bg-surface-container'
          )}
        >
          PRIZES
          {tab === 'prizes' && (
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-6 md:w-8 h-4 bg-primary" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%)' }}></div>
          )}
        </button>
        {config.top8Enabled && (
          <button
            onClick={() => setTab('top8')}
            className={cn(
              'relative px-8 py-4 md:py-6 font-display text-xl md:text-2xl font-black uppercase tracking-widest flex items-center justify-center flex-1 transition-colors',
              tab === 'top8' ? 'bg-primary text-white' : 'bg-surface text-on-surface-variant hover:bg-surface-container'
            )}
          >
            <Heart className={cn('w-5 h-5 mr-2', tab === 'top8' ? 'fill-white' : '')} />
            TOP 8
            {tab === 'top8' && (
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-6 md:w-8 h-4 bg-primary" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%)' }}></div>
            )}
          </button>
        )}
      </div>

      {/* Competition Info Tab */}
      {tab === 'info' && (
        <>
          {/* Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-2 border-outline-variant mb-12">
            <div className="border-b-2 md:border-b-0 md:border-r-2 border-outline-variant p-6 text-center bg-surface-container-high">
              <span className="text-4xl mb-3 block">👥</span>
              <h4 className="font-display text-lg font-extrabold uppercase mb-1">Join as a Duo</h4>
              <p className="font-body text-xs text-on-surface font-medium">M x F, F x F, M x M — every combination is welcome.</p>
            </div>
            <div className="border-b-2 md:border-b-0 md:border-r-2 border-outline-variant p-6 text-center bg-surface-container-high">
              <span className="text-4xl mb-3 block">🎯</span>
              <h4 className="font-display text-lg font-extrabold uppercase mb-1">3 Rounds</h4>
              <p className="font-body text-xs text-on-surface font-medium">Selection → Campaign → Live Final on D-Day.</p>
            </div>
            <div className="p-6 text-center bg-surface-container-high">
              <span className="text-4xl mb-3 block">💎</span>
              <h4 className="font-display text-lg font-extrabold uppercase mb-1">Valuable Prizes</h4>
              <p className="font-body text-xs text-on-surface font-medium">Total 3,000,000 VND + gifts from sponsors.</p>
            </div>
          </div>

          {/* 3 Rounds */}
          <div className="space-y-10 mb-12">
            {rounds.map((r, i) => (
              <div key={i} className="border-4 border-outline-variant bg-surface-container-high">
                <div className="flex flex-col md:flex-row md:items-center gap-4 p-6 border-b-2 border-outline-variant bg-surface-container">
                  <div className="w-14 h-14 bg-primary text-white flex items-center justify-center shrink-0 border-2 border-outline-variant">
                    <r.icon className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="font-display text-xs font-bold uppercase tracking-widest text-secondary">{r.period}</span>
                    <h3 className="font-display text-2xl md:text-3xl font-black uppercase tracking-tight">{r.phase} — {r.subtitle}</h3>
                  </div>
                </div>
                <div className="p-6">
                  <ul className="space-y-2 mb-4">
                    {r.details.map((d, j) => (
                      <li key={j} className="font-body text-sm text-on-surface flex items-start gap-2">
                        <Star className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                        {d}
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-2">
                    {r.criteria.map((c, k) => (
                      <span key={k} className="bg-primary-container text-on-surface px-3 py-1 font-display text-xs font-bold uppercase tracking-wider border-2 border-outline-variant">
                        {c.label}: {c.pct}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Prizes Tab */}
      {tab === 'prizes' && (
        <div className="space-y-10">
          <div className="border-4 border-primary bg-surface p-6 md:p-10">
            <div className="flex items-center gap-4 mb-6">
              <Trophy className="w-10 h-10 text-secondary" />
              <div>
                <h3 className="font-display text-2xl md:text-3xl font-black uppercase tracking-tight">YEP ICONS — The Constellations</h3>
                <p className="font-display text-xs font-bold uppercase tracking-widest text-on-surface-variant">Champion</p>
              </div>
            </div>
            <div className="bg-primary text-white p-6 border-2 border-primary">
              <span className="font-display text-3xl md:text-4xl font-black tracking-tighter">2,000,000 VND</span>
              <span className="font-display text-sm font-bold uppercase tracking-wider ml-3">/ duo</span>
            </div>
            <ul className="mt-6 space-y-3">
              {['1,000,000 VND / member', 'The Constellations commemorative medal', 'Sash, Award board & Flowers', 'Exclusive gifts from Sponsors', 'Certificate of Achievement'].map((item, i) => (
                <li key={i} className="font-body text-sm flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="border-4 border-primary bg-surface p-6 md:p-10">
            <div className="flex items-center gap-4 mb-6">
              <Trophy className="w-10 h-10 text-tertiary" />
              <div>
                <h3 className="font-display text-2xl md:text-3xl font-black uppercase tracking-tight">Most Inspiring Duo</h3>
                <p className="font-display text-xs font-bold uppercase tracking-widest text-on-surface-variant">Most Inspiring Duo</p>
              </div>
            </div>
            <div className="bg-secondary/20 p-6 border-2 border-primary">
              <span className="font-display text-3xl md:text-4xl font-black tracking-tighter">1,000,000 VND</span>
              <span className="font-display text-sm font-bold uppercase tracking-wider ml-3">/ duo</span>
            </div>
            <ul className="mt-6 space-y-3">
              {['500,000 VND / member', 'Most Inspiring Duo commemorative medal', 'Award board, Flowers & Sponsor gifts', 'Certificate of Achievement'].map((item, i) => (
                <li key={i} className="font-body text-sm flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-tertiary shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="border-4 border-primary bg-primary-container p-6 text-center">
            <h3 className="font-display text-xl font-extrabold uppercase mb-3">Other Benefits for Top 8</h3>
            <div className="flex flex-wrap justify-center gap-6 font-body text-sm font-medium text-on-surface-variant">
              <span>📸 Kaleidoscope concept photoshoot</span>
              <span>🎤 Main stage (Top 4)</span>
              <span>📣 Shout-out from organizers</span>
            </div>
          </div>
        </div>
      )}

      {/* Top 8 Leaderboard Tab */}
      {tab === 'top8' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {top8Data.map((entry, index) => (
              <div
                key={entry.id}
                className="group bg-surface border-4 border-primary hover:border-secondary transition-colors duration-300 neo-shadow-sm hover:-translate-y-1 transition-transform"
              >
                <div className="relative">
                  <img
                    src={entry.imageUrl}
                    alt={entry.name}
                    className="w-full aspect-square object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%23141a24' width='400' height='400'/%3E%3Ctext fill='%23a7b3c7' font-family='monospace' font-size='20' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3EPhoto%3C/text%3E%3C/svg%3E`;
                    }}
                  />
                  <span className={cn(
                    'absolute top-3 left-3 w-10 h-10 flex items-center justify-center font-display font-black text-lg border-2',
                    index === 0 ? 'bg-secondary text-white border-secondary' :
                    index === 1 ? 'bg-tertiary text-background border-tertiary' :
                    index === 2 ? 'bg-primary text-white border-primary' :
                    'bg-surface-dim text-on-surface-variant border-outline-variant',
                  )}>
                    {index + 1}
                  </span>
                </div>
                <div className="p-5 space-y-3">
                  <div>
                    <h3 className="font-display text-lg font-black uppercase tracking-tight leading-tight group-hover:text-secondary transition-colors">
                      {entry.name}
                    </h3>
                    <p className="font-display text-[10px] font-bold uppercase tracking-widest text-secondary">
                      {entry.subtitle}
                    </p>
                  </div>
                  <p className="font-body text-xs text-on-surface-variant leading-relaxed line-clamp-4">
                    {entry.description}
                  </p>
                  {VOTE_URL ? (
                    <a
                      href={VOTE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 bg-secondary text-white border-4 border-secondary px-4 py-3 font-display font-black text-sm uppercase tracking-widest hover:bg-primary hover:border-primary hover:text-white transition-colors"
                    >
                      VOTE NOW
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  ) : (
                    <span className="w-full inline-flex items-center justify-center gap-2 bg-surface-dim text-on-surface-variant border-2 border-outline-variant px-4 py-3 font-display font-black text-sm uppercase tracking-widest cursor-not-allowed">
                      VOTE COMING SOON
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t-4 border-primary pt-10 text-center space-y-6">
            <h3 className="font-display text-2xl md:text-3xl font-black uppercase tracking-tight">
              VOTING RULES
            </h3>
            <div className="flex justify-center gap-4 flex-wrap">
              <div className="bg-primary-container border-2 border-outline-variant px-6 py-3 text-center">
                <span className="block font-display text-xs font-bold uppercase tracking-widest text-on-surface-variant">1 Like</span>
                <span className="font-display text-xl font-black text-secondary">3 points</span>
              </div>
              <div className="bg-primary-container border-2 border-outline-variant px-6 py-3 text-center">
                <span className="block font-display text-xs font-bold uppercase tracking-widest text-on-surface-variant">1 Comment</span>
                <span className="font-display text-xl font-black text-tertiary">1 point</span>
              </div>
              <div className="bg-primary-container border-2 border-outline-variant px-6 py-3 text-center">
                <span className="block font-display text-xs font-bold uppercase tracking-widest text-on-surface-variant">1 Share</span>
                <span className="font-display text-xl font-black text-tertiary">5 points</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Register CTA */}
      <div className="mt-16 border-t-4 border-primary pt-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          {REGISTRATION_LINK ? (
            <a
              href={REGISTRATION_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-primary text-white border-4 border-primary px-8 py-4 font-display font-black text-xl uppercase tracking-widest hover:bg-background hover:text-primary transition-colors neo-shadow-sm active:translate-y-1 active:shadow-none"
            >
              REGISTER NOW
              <ExternalLink className="w-5 h-5" />
            </a>
          ) : (
            <span className="inline-flex items-center gap-2 bg-surface-dim text-on-surface-variant border-4 border-outline-variant px-8 py-4 font-display font-black text-xl uppercase tracking-widest cursor-not-allowed">
              REGISTRATION COMING SOON
            </span>
          )}
        </div>
        <div className="text-right">
          <p className="font-display text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            📋 Full rules on Notion & VinUni Student Council Fanpage
          </p>
        </div>
      </div>
    </div>
  );
}
