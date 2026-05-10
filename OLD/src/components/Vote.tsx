import React from 'react';
import { Heart, PlusCircle } from 'lucide-react';
import { cn } from './Layout';

const contestants = [
  {
    id: 1,
    name: 'ALEXA VANCE',
    description: 'Visual communication major with a passion for geometric abstraction and digital performance art.',
    img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    votes: '1,240',
    rank: '01'
  },
  {
    id: 2,
    name: 'MARCUS CHEN',
    description: 'Architecture student specializing in brutalist structures and their impact on urban socialization.',
    img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
    votes: '982',
    rank: '02'
  },
  {
    id: 3,
    name: 'LIAM SMITH',
    description: 'Conceptual photographer focusing on the intersection of human emotion and industrial design.',
    img: 'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?auto=format&fit=crop&w=800&q=80',
    votes: '745',
    rank: '03'
  },
  {
    id: 4,
    name: 'SOFIA RODRIGUEZ',
    description: 'Industrial designer reimagining everyday objects through the lens of early 20th century modernism.',
    img: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=800&q=80',
    votes: '612',
    rank: '04'
  }
];

export function Vote() {
  return (
    <div className="w-full max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-16">
      {/* Header */}
      <section className="mb-12 md:mb-16 relative max-w-4xl mx-auto lg:mx-0">
        <div className="border-4 border-primary p-6 md:p-10 bg-primary-container neo-shadow relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="font-display text-5xl md:text-7xl lg:text-[8rem] font-black uppercase leading-[0.8] tracking-tighter text-primary">
              YEP ICON<br />CONTEST
            </h2>
            <div className="mt-6 md:mt-8 border-l-8 border-primary pl-4 md:pl-6">
              <p className="font-display text-lg md:text-xl font-bold max-w-2xl text-primary uppercase leading-tight">
                CELEBRATING THE MOST INFLUENTIAL PERSONALITIES OF THE YEAR. FORM FOLLOWS FUNCTION, FAME FOLLOWS TALENT.
              </p>
            </div>
          </div>
          <div className="absolute -right-32 -bottom-32 opacity-10 pointer-events-none">
            {/* Using a large geometric shape to mimic the theater_comedy icon background effect */}
            <div className="w-[400px] h-[400px] md:w-[600px] md:h-[600px] rounded-full border-[40px] md:border-[60px] border-primary"></div>
          </div>
        </div>
      </section>

      {/* Tab Switcher */}
      <div className="flex flex-col md:flex-row gap-0 mb-12 border-b-4 border-primary mx-auto max-w-4xl lg:mx-0">
        <button className="relative bg-primary text-background px-8 py-4 md:py-6 font-display text-xl md:text-2xl font-black uppercase tracking-widest flex items-center justify-center flex-1">
          VOTING
          {/* Active indicator */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-6 md:w-8 h-4 bg-primary" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%)' }}></div>
        </button>
        <button className="bg-surface text-primary px-8 py-4 md:py-6 font-display text-xl md:text-2xl font-black uppercase tracking-widest hover:bg-surface-container transition-colors flex-1">
          REGISTRATION
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {contestants.map((c) => (
          <div key={c.id} className="border-2 border-primary bg-surface flex flex-col group hover:-translate-y-2 hover:neo-shadow transition-all duration-300">
            <div className="aspect-[4/5] overflow-hidden border-b-2 border-primary bg-surface-dim relative">
              <img src={c.img} alt={c.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
            </div>
            
            <div className="p-6 flex flex-col flex-grow">
              <div className="flex justify-between items-start mb-4">
                <span className={cn(
                  "text-background px-3 py-1 font-display text-xs md:text-sm font-bold uppercase tracking-widest neo-shadow-sm",
                  c.id === 1 ? "bg-tertiary" : "bg-primary"
                )}>
                  RANK {c.rank}
                </span>
                <div className="flex items-center gap-2 font-display font-black text-xl md:text-2xl">
                  <Heart className="w-5 h-5 md:w-6 md:h-6 fill-primary" />
                  {c.votes}
                </div>
              </div>
              
              <h3 className="font-display text-2xl md:text-3xl font-black uppercase mb-3 tracking-tighter">{c.name}</h3>
              <p className="font-body text-sm mb-6 text-on-surface-variant font-medium leading-relaxed line-clamp-3">
                {c.description}
              </p>
              
              <div className="mt-auto pt-4 border-t-2 border-primary/10">
                <button className="w-full bg-secondary text-white py-3 md:py-4 border-2 border-primary font-display font-black text-lg md:text-xl uppercase tracking-widest hover:bg-primary transition-colors active:translate-y-1 active:shadow-none neo-shadow-sm">
                  VOTE
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Join Contest Card */}
        <div className="border-4 border-dashed border-primary bg-surface-container flex items-center justify-center p-8 text-center group cursor-pointer hover:bg-primary-container transition-colors min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <PlusCircle className="w-16 h-16 md:w-20 md:h-20 text-primary" strokeWidth={1.5} />
            <h3 className="font-display text-2xl md:text-3xl font-black uppercase tracking-widest leading-tight">
              JOIN THE<br />CONTEST
            </h3>
          </div>
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-16 flex justify-center items-center gap-3">
        <button className="w-12 h-12 border-2 border-primary bg-primary text-background flex items-center justify-center font-display font-black text-lg neo-shadow-sm">1</button>
        <button className="w-12 h-12 border-2 border-primary bg-surface text-primary flex items-center justify-center font-display font-black text-lg hover:bg-primary-container transition-colors">2</button>
        <button className="w-12 h-12 border-2 border-primary bg-surface text-primary flex items-center justify-center font-display font-black text-lg hover:bg-primary-container transition-colors">3</button>
        <span className="font-display font-black text-xl mx-2">...</span>
        <button className="w-12 h-12 border-2 border-primary bg-surface text-primary flex items-center justify-center font-display font-black text-lg hover:bg-primary-container transition-colors">10</button>
      </div>

    </div>
  );
}
