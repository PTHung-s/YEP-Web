import React from 'react';
import { Music, Instagram, Youtube, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const artists = [
  {
    id: 1,
    name: 'SOLO ECHO',
    genre: 'ELECTRONIC / TECHNO',
    type: 'HEADLINER',
    time: '21:00 - 22:30',
    stage: 'MAIN STAGE',
    description: 'Cutting-edge electronic music producer known for immersive, geometric soundscapes that push the boundaries of techno and experimental electronica.',
    img: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=800',
    social: { instagram: '#', youtube: '#' }
  },
  {
    id: 2,
    name: 'NOVA RAY',
    genre: 'INDIE POP / SYNTH',
    type: 'FEATURED',
    time: '19:30 - 20:15',
    stage: 'MAIN STAGE',
    description: 'Blending dreamy synth textures with indie pop sensibilities, Nova Ray creates atmospheric performances that transport audiences to another dimension.',
    img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800',
    social: { instagram: '#', youtube: '#' }
  },
  {
    id: 3,
    name: 'THE GRID',
    genre: 'HOUSE / DISCO',
    type: 'FEATURED',
    time: '22:00 - 23:15',
    stage: 'SIDE STAGE',
    description: 'A dynamic house and disco collective bringing infectious grooves and high-energy performances to the dance floor.',
    img: 'https://images.unsplash.com/photo-1493225457224-eda0e6fdc758?auto=format&fit=crop&q=80&w=800',
    social: { instagram: '#', youtube: '#' }
  },
  {
    id: 4,
    name: 'BRASS BOX',
    genre: 'EXPERIMENTAL JAZZ',
    type: 'SUPPORTING',
    time: '19:00 - 19:45',
    stage: 'SIDE STAGE',
    description: 'Pushing the boundaries of jazz with experimental compositions, Brass Box combines traditional brass instrumentation with modern electronic elements.',
    img: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&q=80&w=800',
    social: { instagram: '#', youtube: '#' }
  },
  {
    id: 5,
    name: 'PIXEL DRIFT',
    genre: 'CHILLWAVE / AMBIENT',
    type: 'SUPPORTING',
    time: '20:30 - 21:15',
    stage: 'LOUNGE',
    description: 'Creating lush, textured ambient soundscapes perfect for the chill-out lounge. Pixel Drift blends analog warmth with digital precision.',
    img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=800',
    social: { instagram: '#', youtube: '#' }
  },
  {
    id: 6,
    name: 'NEON FUSE',
    genre: 'SYNTHWAVE / RETRO',
    type: 'SUPPORTING',
    time: '23:30 - 00:30',
    stage: 'MAIN STAGE',
    description: 'Closing the night with an explosive fusion of retro synthwave and modern electronic beats, guaranteed to keep the energy high until midnight.',
    img: 'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?auto=format&fit=crop&q=80&w=800',
    social: { instagram: '#', youtube: '#' }
  },
];

const typeColors: Record<string, string> = {
  HEADLINER: 'bg-secondary text-white',
  FEATURED: 'bg-tertiary text-white',
  SUPPORTING: 'bg-primary text-background',
};

export function Lineup() {
  return (
    <div className="w-full max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-16">
      {/* Header */}
      <div className="mb-12 md:mb-16">
        <span className="font-display text-tertiary font-bold tracking-widest uppercase block mb-2 text-xs md:text-sm">// THE COMPLETE LINEUP</span>
        <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.9] mb-6">
          ALL <br /><span className="text-secondary">ARTISTS</span>
        </h1>
        <p className="font-body text-lg md:text-xl max-w-2xl text-on-surface-variant font-medium leading-relaxed">
          Meet every artist performing at YEP VinUni 2024. From headliners to supporting acts, experience the full spectrum of sound.
        </p>
      </div>

      {/* Stage Legend */}
      <div className="flex flex-wrap gap-4 mb-12 p-6 bg-surface border-4 border-primary">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-secondary border border-primary"></div>
          <span className="font-display text-xs font-black uppercase tracking-wider">HEADLINER</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-tertiary border border-primary"></div>
          <span className="font-display text-xs font-black uppercase tracking-wider">FEATURED</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-primary border border-primary"></div>
          <span className="font-display text-xs font-black uppercase tracking-wider">SUPPORTING</span>
        </div>
      </div>

      {/* Full Artist Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {artists.map(artist => (
          <div key={artist.id} className="border-4 border-primary bg-surface group hover:-translate-y-2 hover:neo-shadow transition-all duration-300 flex flex-col">
            {/* Image */}
            <div className="aspect-[4/5] overflow-hidden border-b-4 border-primary bg-surface-dim relative">
              <img
                src={artist.img}
                alt={artist.name}
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
              />
              <div className="absolute top-3 left-3">
                <span className={`px-3 py-1 font-display text-[10px] md:text-xs font-bold uppercase tracking-wider border-2 border-primary ${typeColors[artist.type]}`}>
                  {artist.type}
                </span>
              </div>
            </div>

            {/* Details */}
            <div className="p-5 flex flex-col flex-grow">
              <div className="mb-3">
                <h3 className="font-display text-2xl md:text-3xl font-black uppercase tracking-tight">{artist.name}</h3>
                <p className="font-body text-xs font-bold uppercase tracking-widest text-on-surface-variant mt-1">{artist.genre}</p>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Music className="w-4 h-4 shrink-0 text-primary" />
                  <span className="font-display font-bold uppercase tracking-wider">{artist.stage}</span>
                  <span className="font-body text-xs text-on-surface-variant">•</span>
                  <span className="font-display text-xs font-bold tracking-wider text-on-surface-variant">{artist.time}</span>
                </div>
              </div>

              <p className="font-body text-sm text-on-surface-variant font-medium leading-relaxed mb-5 flex-grow">
                {artist.description}
              </p>

              {/* Social Links */}
              <div className="flex items-center gap-3 pt-4 border-t-2 border-primary/20">
                <a href={artist.social.instagram} className="w-8 h-8 border-2 border-primary flex items-center justify-center hover:bg-primary hover:text-background transition-colors" title="Instagram">
                  <Instagram className="w-4 h-4" />
                </a>
                <a href={artist.social.youtube} className="w-8 h-8 border-2 border-primary flex items-center justify-center hover:bg-primary hover:text-background transition-colors" title="YouTube">
                  <Youtube className="w-4 h-4" />
                </a>
                <div className="flex-grow"></div>
                <a href="#" className="font-display text-xs font-black uppercase tracking-widest text-primary hover:text-secondary transition-colors flex items-center gap-1">
                  MORE <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="mt-16 border-t-4 border-primary pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <p className="font-display text-lg md:text-xl font-black uppercase tracking-wider">READY TO SEE THEM LIVE?</p>
          <p className="font-body text-sm text-on-surface-variant font-medium">December 31, 2024 at VinUni Auditorium</p>
        </div>
        <Link
          to="/tickets"
          className="bg-primary text-background border-4 border-primary px-8 py-4 font-display font-black text-xl uppercase tracking-widest hover:bg-background hover:text-primary transition-colors neo-shadow-sm active:translate-y-1 active:shadow-none inline-flex items-center gap-2"
        >
          GET TICKETS
          <ExternalLink className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
