import React from 'react';
import { ArrowRight, Ticket, PartyPopper } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Home() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative min-h-[500px] md:min-h-[600px] flex items-center px-6 md:px-12 py-12 border-b-2 border-primary overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 w-full gap-8 lg:gap-12 items-center mx-auto max-w-7xl">
          <div className="lg:col-span-7 z-10 w-full relative">
            <h1 className="font-display text-6xl md:text-8xl lg:text-[9rem] font-bold leading-[0.85] tracking-tighter uppercase mb-6">
              YEP<br />
              <span className="text-secondary">VINUNI</span>
            </h1>
            <div className="flex flex-col xl:flex-row gap-4 mt-8">
              <div className="bg-primary-container p-4 md:p-6 border-2 border-primary neo-shadow max-w-sm">
                <p className="font-display font-bold text-lg md:text-xl uppercase leading-tight">
                  The ultimate academic finale. Music, Art & Geometry.
                </p>
              </div>
              <div className="flex items-end mt-4 xl:mt-0 xl:ml-6">
                <span className="font-display text-2xl md:text-3xl font-bold uppercase text-tertiary tracking-tighter">
                  DECEMBER 31 / 2024
                </span>
              </div>
            </div>
          </div>
          <div className="lg:col-span-5 relative w-full aspect-square mt-8 lg:mt-0 max-w-sm mx-auto">
            <div className="absolute inset-0 bg-secondary border-2 border-primary translate-x-4 translate-y-4"></div>
            <img 
              src="https://images.unsplash.com/photo-1540039155732-d6741b687f88?q=80&w=1974&auto=format&fit=crop" 
              alt="Festival Crowd" 
              className="absolute inset-0 w-full h-full object-cover border-2 border-primary grayscale hover:grayscale-0 transition-all duration-500 z-10" 
            />
          </div>
        </div>
      </section>

      {/* Marquee Strip */}
      <div className="bg-primary text-background py-3 border-b-2 border-primary overflow-hidden relative flex">
        <div className="animate-marquee whitespace-nowrap flex gap-12 items-center">
          <span className="font-display text-xl md:text-2xl font-bold uppercase tracking-wider">YEP VINUNI × YEAR END PARTY × THE GEOMETRY OF SOUND × YEP VINUNI × YEAR END PARTY × THE GEOMETRY OF SOUND ×</span>
        </div>
         <div className="absolute top-0 animate-marquee2 whitespace-nowrap flex gap-12 items-center py-3">
          <span className="font-display text-xl md:text-2xl font-bold uppercase tracking-wider">YEP VINUNI × YEAR END PARTY × THE GEOMETRY OF SOUND × YEP VINUNI × YEAR END PARTY × THE GEOMETRY OF SOUND ×</span>
        </div>
      </div>

      {/* Artist Lineup Section */}
      <section className="py-16 md:py-24 px-6 md:px-12 bg-surface border-b-2 border-primary max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <span className="font-display text-tertiary font-bold tracking-widest uppercase block mb-2 text-xs md:text-sm">// THE LINEUP</span>
            <h2 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold uppercase tracking-tighter leading-none">ARTISTS</h2>
          </div>
          <div className="hidden md:block">
            <Link to="/lineup" className="inline-block bg-background text-primary border-2 border-primary px-6 py-3 font-display font-bold text-lg uppercase tracking-widest hover:bg-secondary hover:text-white transition-colors neo-shadow active:translate-x-1 active:translate-y-1 active:shadow-none">
              VIEW ALL
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border-2 border-primary">
          <div className="border-b-2 md:border-b-0 md:border-r-2 border-primary p-4 lg:p-6 group hover:bg-primary-container transition-colors relative">
            <div className="aspect-[4/5] bg-surface-dim mb-4 overflow-hidden border-2 border-primary relative">
              <img src="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=800" alt="SOLO ECHO" className="w-full h-full object-cover grayscale group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute top-3 right-3 bg-secondary text-white px-2 py-1 font-display font-bold text-[10px] md:text-xs tracking-wider uppercase border-2 border-primary">HEADLINER</div>
            </div>
            <h3 className="font-display text-2xl font-extrabold uppercase tracking-tight">SOLO ECHO</h3>
            <p className="font-body text-on-surface-variant uppercase text-xs mt-1 font-bold tracking-wider">ELECTRONIC / TECHNO</p>
          </div>

          <div className="border-b-2 md:border-b-0 md:border-r-2 border-primary p-4 lg:p-6 group hover:bg-tertiary/20 transition-colors">
            <div className="aspect-[4/5] bg-surface-dim mb-4 overflow-hidden border-2 border-primary">
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800" alt="NOVA RAY" className="w-full h-full object-cover grayscale group-hover:scale-105 transition-transform duration-500" />
            </div>
            <h3 className="font-display text-2xl font-extrabold uppercase tracking-tight">NOVA RAY</h3>
            <p className="font-body text-on-surface-variant uppercase text-xs mt-1 font-bold tracking-wider">INDIE POP / SYNTH</p>
          </div>

          <div className="border-b-2 md:border-b-0 md:border-r-2 border-primary p-4 lg:p-6 group hover:bg-primary-container transition-colors">
            <div className="aspect-[4/5] bg-surface-dim mb-4 overflow-hidden border-2 border-primary">
               <img src="https://images.unsplash.com/photo-1493225457224-eda0e6fdc758?auto=format&fit=crop&q=80&w=800" alt="THE GRID" className="w-full h-full object-cover grayscale group-hover:scale-105 transition-transform duration-500" />
            </div>
            <h3 className="font-display text-2xl font-extrabold uppercase tracking-tight">THE GRID</h3>
            <p className="font-body text-on-surface-variant uppercase text-xs mt-1 font-bold tracking-wider">HOUSE / DISCO</p>
          </div>

          <div className="p-4 lg:p-6 group hover:bg-secondary/20 transition-colors">
            <div className="aspect-[4/5] bg-surface-dim mb-4 overflow-hidden border-2 border-primary">
              <img src="https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&q=80&w=800" alt="BRASS BOX" className="w-full h-full object-cover grayscale group-hover:scale-105 transition-transform duration-500" />
            </div>
            <h3 className="font-display text-2xl font-extrabold uppercase tracking-tight">BRASS BOX</h3>
            <p className="font-body text-on-surface-variant uppercase text-xs mt-1 font-bold tracking-wider">EXPERIMENTAL JAZZ</p>
          </div>
        </div>
      </section>

      {/* Schedule Section */}
      <section className="py-16 md:py-24 px-6 md:px-12 bg-background max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          <div className="lg:col-span-4">
            <h2 className="font-display text-5xl md:text-6xl font-bold uppercase mb-6 leading-[0.9] tracking-tighter">
              TIMING IS<br /><span className="text-secondary">EVERYTHING</span>
            </h2>
            <p className="font-body text-base md:text-lg max-w-xs mb-10 font-medium text-on-surface-variant">
              Follow the rhythm of the night. Strict adherence to the geometric timeline is required.
            </p>
            <div className="bg-tertiary text-white p-6 md:p-8 border-2 border-primary neo-shadow-blue inline-block w-full">
              <p className="font-display font-black text-2xl uppercase tracking-wider mb-1">MAIN STAGE</p>
              <p className="font-display opacity-90 uppercase tracking-widest text-xs md:text-sm font-bold">THE AUDITORIUM</p>
            </div>
          </div>
          <div className="lg:col-span-8">
            <div className="flex flex-col gap-0 border-2 border-primary bg-surface/50">
              
              <div className="flex flex-col md:flex-row border-b-2 border-primary hover:bg-surface transition-colors group cursor-default">
                <div className="p-6 md:w-48 lg:w-56 border-b-2 md:border-b-0 md:border-r-2 border-primary bg-primary text-background font-display text-3xl md:text-4xl font-bold flex items-center justify-center tracking-tighter">19:00</div>
                <div className="p-6 md:p-8 flex-grow flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-display text-2xl md:text-3xl font-black uppercase tracking-tight mb-1">OPENING CEREMONY</h4>
                    <p className="font-display uppercase text-xs md:text-sm font-bold text-secondary tracking-widest">PROLOGUE</p>
                  </div>
                  <ArrowRight className="w-8 h-8 group-hover:translate-x-2 transition-transform hidden md:block text-primary" />
                </div>
              </div>

              <div className="flex flex-col md:flex-row border-b-2 border-primary hover:bg-surface transition-colors group cursor-default">
                <div className="p-6 md:w-48 lg:w-56 border-b-2 md:border-b-0 md:border-r-2 border-primary font-display text-3xl md:text-4xl font-bold flex items-center justify-center tracking-tighter">20:30</div>
                <div className="p-6 md:p-8 flex-grow flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-display text-2xl md:text-3xl font-black uppercase tracking-tight mb-1">LIVE PERFORMANCES</h4>
                    <p className="font-display uppercase text-xs md:text-sm font-bold text-secondary tracking-widest">CHAPTER I</p>
                  </div>
                  <ArrowRight className="w-8 h-8 group-hover:translate-x-2 transition-transform hidden md:block text-primary" />
                </div>
              </div>

              <div className="flex flex-col md:flex-row border-b-2 border-primary hover:bg-surface transition-colors group cursor-default">
                <div className="p-6 md:w-48 lg:w-56 border-b-2 md:border-b-0 md:border-r-2 border-primary font-display text-3xl md:text-4xl font-bold flex items-center justify-center tracking-tighter">22:00</div>
                <div className="p-6 md:p-8 flex-grow flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-display text-2xl md:text-3xl font-black uppercase tracking-tight mb-1">AWARDS & RECOGNITION</h4>
                    <p className="font-display uppercase text-xs md:text-sm font-bold text-secondary tracking-widest">CHAPTER II</p>
                  </div>
                  <ArrowRight className="w-8 h-8 group-hover:translate-x-2 transition-transform hidden md:block text-primary" />
                </div>
              </div>

              <div className="flex flex-col md:flex-row bg-secondary text-white hover:bg-secondary/90 transition-colors group cursor-default">
                <div className="p-6 md:w-48 lg:w-56 border-b-2 md:border-b-0 md:border-r-2 border-primary font-display text-3xl md:text-4xl font-black flex items-center justify-center tracking-tighter bg-primary-container text-primary">00:00</div>
                <div className="p-6 md:p-8 flex-grow flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-display text-2xl md:text-3xl font-black uppercase tracking-tight mb-1">THE FINALE COUNTDOWN</h4>
                    <p className="font-display uppercase text-xs md:text-sm font-black text-primary tracking-widest">EPILOGUE</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Ticket CTA Section */}
      <section className="py-20 md:py-24 px-6 md:px-12 bg-primary text-background border-t-2 border-primary text-center relative overflow-hidden w-full">
        {/* Abstract Background grid pattern */}
        <div className="absolute inset-0 w-full h-full opacity-10 pointer-events-none flex">
          {[...Array(10)].map((_, i) => (
             <div key={i} className="flex-1 border-r border-white h-full shrink-0"></div>
          ))}
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <h2 className="font-display text-6xl md:text-8xl lg:text-[9rem] font-bold uppercase mb-12 tracking-tighter leading-none">GET IN <br className="md:hidden"/> NOW</h2>
          <div className="flex flex-col md:flex-row text-primary justify-center items-center gap-8 px-4">
            <div className="bg-background p-8 border-2 border-white flex flex-col items-center w-full max-w-[20rem] relative z-10 transition-transform duration-300 hover:-translate-y-2">
               <span className="font-display text-lg md:text-xl font-bold uppercase mb-3 tracking-widest">GENERAL ACCESS</span>
               <span className="font-display text-5xl md:text-6xl font-black mb-8 tracking-tighter">200K<span className="text-xl tracking-normal">VND</span></span>
               <Link to="/tickets" className="bg-secondary text-white px-8 py-4 font-display font-bold text-lg uppercase hover:bg-tertiary transition-colors w-full border-2 border-primary neo-shadow active:translate-x-1 active:translate-y-1 active:shadow-none">SELECT</Link>
            </div>
            
            <div className="bg-primary-container p-8 border-2 border-white flex flex-col items-center w-full max-w-[20rem] neo-shadow-red z-20 md:-mt-6 transition-transform duration-300 hover:-translate-y-2">
               <span className="font-display text-xl md:text-2xl font-black uppercase mb-3 tracking-widest">VIP ADMISSION</span>
               <span className="font-display text-5xl md:text-7xl font-black mb-8 tracking-tighter">500K<span className="text-2xl tracking-normal">VND</span></span>
               <Link to="/tickets" className="bg-primary text-background px-8 py-4 font-display font-bold text-lg uppercase hover:bg-secondary transition-colors w-full border-2 border-primary neo-shadow active:translate-x-1 active:translate-y-1 active:shadow-none">SELECT</Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
