import React from 'react';
import { Music, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const artists = [
  {
    id: 1,
    name: 'SOLO ECHO',
    genre: 'ELECTRONIC / TECHNO',
    time: '21:00 - 22:30',
    stage: 'MAIN STAGE',
    description: 'Cutting-edge electronic music producer known for immersive, geometric soundscapes that push the boundaries of techno and experimental electronica.',
    img: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=1200',
  },
  {
    id: 2,
    name: 'NOVA RAY',
    genre: 'INDIE POP / SYNTH',
    time: '19:30 - 20:15',
    stage: 'MAIN STAGE',
    description: 'Blending dreamy synth textures with indie pop sensibilities, Nova Ray creates atmospheric performances that transport audiences to another dimension.',
    img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=1200',
  },
  {
    id: 3,
    name: 'THE GRID',
    genre: 'HOUSE / DISCO',
    time: '22:00 - 23:15',
    stage: 'SIDE STAGE',
    description: 'A dynamic house and disco collective bringing infectious grooves and high-energy performances to the dance floor.',
    img: 'https://images.unsplash.com/photo-1493225457224-eda0e6fdc758?auto=format&fit=crop&q=80&w=1200',
  },
  {
    id: 4,
    name: 'BRASS BOX',
    genre: 'EXPERIMENTAL JAZZ',
    time: '19:00 - 19:45',
    stage: 'SIDE STAGE',
    description: 'Pushing the boundaries of jazz with experimental compositions, Brass Box combines traditional brass instrumentation with modern electronic elements.',
    img: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&q=80&w=1200',
  },
  {
    id: 5,
    name: 'PIXEL DRIFT',
    genre: 'CHILLWAVE / AMBIENT',
    time: '20:30 - 21:15',
    stage: 'LOUNGE',
    description: 'Creating lush, textured ambient soundscapes perfect for the chill-out lounge. Pixel Drift blends analog warmth with digital precision.',
    img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1?auto=format&fit=crop&q=80&w=1200',
  },
  {
    id: 6,
    name: 'NEON FUSE',
    genre: 'SYNTHWAVE / RETRO',
    time: '23:30 - 00:30',
    stage: 'MAIN STAGE',
    description: 'Closing the night with an explosive fusion of retro synthwave and modern electronic beats, guaranteed to keep the energy high until midnight.',
    img: 'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?auto=format&fit=crop&q=80&w=1200',
  },
];

export function Lineup() {
  return (
    <div className="w-full bg-primary text-white">
      <div className="w-full max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-16">
        <div className="mb-10 md:mb-14">
          <span className="font-display text-primary-container font-bold tracking-widest uppercase block mb-2 text-xs md:text-sm">// THE COMPLETE LINEUP</span>
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.9] mb-6">
            ALL <br /><span className="text-primary-container">ARTISTS</span>
          </h1>
          <p className="font-body text-lg md:text-xl max-w-2xl text-white/80 font-medium leading-relaxed">
            Artist showcase for YEP'26: The Kaleido Soul.
          </p>
        </div>

        <div className="space-y-8">
          {artists.map((artist, index) => (
            <section
              key={artist.id}
              className="min-h-[80vh] border-2 border-white/30 bg-black/20 grid grid-cols-1 lg:grid-cols-2"
            >
              <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                <img
                  src={artist.img}
                  alt={artist.name}
                  className="w-full h-[360px] md:h-[520px] lg:h-full object-cover grayscale"
                />
              </div>
              <div className="p-6 md:p-10 lg:p-14 flex flex-col justify-center">
                <p className="font-display text-xs font-bold uppercase tracking-widest text-primary-container mb-2">Artist #{String(index + 1).padStart(2, '0')}</p>
                <h2 className="font-display text-4xl md:text-6xl font-black uppercase tracking-tight leading-none">{artist.name}</h2>
                <p className="font-body text-sm md:text-base font-bold uppercase tracking-widest text-white/70 mt-3">{artist.genre}</p>

                <div className="mt-6 flex items-center gap-3 text-sm">
                  <Music className="w-4 h-4 shrink-0" />
                  <span className="font-display font-bold uppercase tracking-wider">{artist.stage}</span>
                  <span className="font-body text-xs text-white/60">•</span>
                  <span className="font-display text-xs font-bold tracking-wider text-white/70">{artist.time}</span>
                </div>

                <p className="font-body text-base text-white/85 font-medium leading-relaxed mt-6 max-w-xl">
                  {artist.description}
                </p>
              </div>
            </section>
          ))}
        </div>

        <div className="mt-16 border-t-2 border-white/30 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <p className="font-display text-lg md:text-xl font-black uppercase tracking-wider">READY TO SEE THEM LIVE?</p>
            <p className="font-body text-sm text-white/70 font-medium">June 27, 2026 at VinUni Amphitheatre</p>
          </div>
          <Link
            to="/tickets"
            className="bg-background text-primary border-4 border-background px-8 py-4 font-display font-black text-xl uppercase tracking-widest hover:bg-primary hover:text-background transition-colors neo-shadow-sm active:translate-y-1 active:shadow-none inline-flex items-center gap-2"
          >
            GET TICKETS
            <ExternalLink className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
