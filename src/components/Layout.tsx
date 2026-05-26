import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { yepAsset } from '../lib/assets';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Layout({ children }: { children: React.ReactNode }) {
  const BRAND_NAME = "YEP'26: THE KALEIDO SOUL";
  const location = useLocation();
  const path = location.pathname;

  return (
    <div className="min-h-screen flex flex-col pt-16 md:pt-20">
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-4 md:px-12 h-16 md:h-20 bg-background/95 backdrop-blur-md border-b-2 border-outline shadow-[0_10px_32px_rgba(0,0,0,0.45)]">
        <Link to="/" className="flex items-center gap-3 md:gap-4 border-2 border-on-surface/60 px-2 py-1 bg-on-surface/5 hover:bg-on-surface/10 transition-colors">
          <img
            src={yepAsset('yep-logo.png')}
            alt="YEP'26"
            className="h-9 w-9 md:h-12 md:w-12 object-contain"
          />
            <h1 className="font-display text-sm md:text-base lg:text-lg font-extrabold tracking-wider uppercase text-white leading-none">
              {BRAND_NAME}
            </h1>
          </Link>
          <nav className="hidden md:flex gap-6 lg:gap-8 items-center" aria-label="Main navigation">
            <Link
              to="/"
              className={cn(
                "font-display text-sm font-bold uppercase tracking-widest transition-colors",
                path === '/' ? "text-white underline decoration-secondary decoration-2 underline-offset-8" : "text-on-surface hover:text-white"
              )}
            >
              HOME
            </Link>
            <Link
              to="/lineup"
              className={cn(
                "font-display text-sm font-bold uppercase tracking-widest transition-colors",
                path === '/lineup' ? "text-white underline decoration-secondary decoration-2 underline-offset-8" : "text-on-surface hover:text-white"
              )}
            >
              LINEUP
            </Link>
            <Link
              to="/tickets"
              className={cn(
                "font-display text-sm font-bold uppercase tracking-widest transition-colors",
                path === '/tickets' ? "text-white underline decoration-secondary decoration-2 underline-offset-8" : "text-on-surface hover:text-white"
              )}
            >
              TICKETS
            </Link>
            <Link
              to="/vote"
              className={cn(
                "font-display text-sm font-bold uppercase tracking-widest transition-colors",
                path === '/vote' ? "text-white underline decoration-secondary decoration-2 underline-offset-8" : "text-on-surface hover:text-white"
              )}
            >
              VOTE
            </Link>
          </nav>
          <Link
            to="/tickets"
            className="bg-white text-primary px-4 md:px-6 py-2 border-2 border-white font-display font-bold uppercase tracking-widest hover:bg-secondary hover:text-white hover:border-secondary transition-all duration-300 active:scale-95 text-xs md:text-sm shadow-[0_0_24px_rgba(34,211,238,0.35)]"
          >
            BUY TICKET
          </Link>
      </header>

      <main className="flex-grow flex flex-col w-full relative pb-16 md:pb-0">
        {children}
      </main>

      <footer className="w-full py-12 px-6 md:px-12 flex flex-col gap-8 md:flex-row justify-between items-start bg-background/95 border-t-2 border-outline mt-auto">
        <div className="flex flex-col gap-3">
            <img
              src={yepAsset('yep-logo.png')}
              alt="YEP'26"
              className="h-14 w-14 object-contain"
            />
            <h2 className="font-display text-xl md:text-2xl font-bold tracking-tighter uppercase text-white">
              {BRAND_NAME}
            </h2>
            <p className="font-display text-xs md:text-sm uppercase tracking-widest text-on-surface/70 font-bold max-w-sm leading-relaxed">
              YEAR END PARTY BY VINUNI STUDENT COUNCIL.
            </p>
            <p className="font-display text-xs md:text-sm uppercase tracking-widest text-on-surface/70 mt-2">
              © 2026 VINUNI STUDENT COUNCIL. ALL RIGHTS RESERVED.
            </p>
        </div>
        <div className="flex flex-wrap gap-x-12 gap-y-8">
          <nav className="flex flex-col gap-4" aria-label="Footer navigation">
            <span className="font-display font-black text-sm uppercase tracking-widest text-secondary mb-2">NAVIGATE</span>
            <Link to="/" className="font-display text-xs font-bold uppercase tracking-widest text-on-surface hover:text-white transition-colors">HOME</Link>
            <Link to="/lineup" className="font-display text-xs font-bold uppercase tracking-widest text-on-surface hover:text-white transition-colors">LINEUP</Link>
            <Link to="/tickets" className="font-display text-xs font-bold uppercase tracking-widest text-on-surface hover:text-white transition-colors">TICKETS</Link>
            <Link to="/vote" className="font-display text-xs font-bold uppercase tracking-widest text-on-surface hover:text-white transition-colors">VOTE</Link>
          </nav>
            <nav className="flex flex-col gap-4" aria-label="Social links">
              <span className="font-display font-black text-sm uppercase tracking-widest text-secondary mb-2">SOCIAL</span>
              <a href="https://facebook.com/vinuni.student.council" target="_blank" rel="noopener noreferrer" className="font-display text-xs font-bold uppercase tracking-widest text-on-surface hover:text-white transition-colors">FACEBOOK</a>
              <a href="https://instagram.com/vinunisc" target="_blank" rel="noopener noreferrer" className="font-display text-xs font-bold uppercase tracking-widest text-on-surface hover:text-white transition-colors">INSTAGRAM</a>
              <a href="mailto:studentcouncil@vinuni.edu.vn" className="font-display text-xs font-bold uppercase tracking-widest text-on-surface hover:text-white transition-colors">EMAIL</a>
            </nav>
        </div>
      </footer>
      
      {/* Mobile Nav */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-16 bg-background/95 backdrop-blur-md border-t-2 border-outline md:hidden" aria-label="Mobile navigation">
        <Link to="/" className={cn("flex-1 h-full flex items-center justify-center", path === '/' ? "bg-white text-primary" : "text-on-surface")}>
           <span className="font-display font-bold text-xs uppercase tracking-wider">HOME</span>
        </Link>
        <Link to="/lineup" className={cn("flex-1 h-full flex items-center justify-center", path === '/lineup' ? "bg-white text-primary" : "text-on-surface")}>
           <span className="font-display font-bold text-xs uppercase tracking-wider">LINEUP</span>
        </Link>
        <Link to="/tickets" className={cn("flex-1 h-full flex items-center justify-center", path === '/tickets' || path === '/checkout' ? "bg-white text-primary" : "text-on-surface")}>
           <span className="font-display font-bold text-xs uppercase tracking-wider">TICKETS</span>
        </Link>
        <Link to="/vote" className={cn("flex-1 h-full flex items-center justify-center", path === '/vote' ? "bg-white text-primary" : "text-on-surface")}>
            <span className="font-display font-bold text-xs uppercase tracking-wider">VOTE</span>
        </Link>
      </nav>
    </div>
  );
}
