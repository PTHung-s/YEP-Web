import React from 'react';
import { Menu } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const path = location.pathname;

  return (
    <div className="min-h-screen flex flex-col pt-16 md:pt-20">
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-4 md:px-12 h-16 md:h-20 bg-surface border-b border-primary">
        <Link to="/" className="flex items-center gap-3 md:gap-4">
          <Menu className="w-6 h-6 md:w-8 md:h-8 text-primary cursor-pointer" />
            <h1 className="font-display text-xl md:text-2xl font-extrabold tracking-widest uppercase text-primary leading-none">
              YEP VINUNI
            </h1>
          </Link>
          <nav className="hidden md:flex gap-6 lg:gap-8 items-center">
            <Link
              to="/"
              className={cn(
                "font-display text-sm font-bold uppercase tracking-widest transition-colors",
                path === '/' ? "text-primary underline decoration-2 underline-offset-8" : "text-secondary hover:text-primary"
              )}
            >
              HOME
            </Link>
            <Link
              to="/lineup"
              className={cn(
                "font-display text-sm font-bold uppercase tracking-widest transition-colors",
                path === '/lineup' ? "text-primary underline decoration-2 underline-offset-8" : "text-secondary hover:text-primary"
              )}
            >
              LINEUP
            </Link>
            <Link
              to="/tickets"
              className={cn(
                "font-display text-sm font-bold uppercase tracking-widest transition-colors",
                path === '/tickets' ? "text-primary underline decoration-2 underline-offset-8" : "text-secondary hover:text-primary"
              )}
            >
              TICKETS
            </Link>
            <Link
              to="/vote"
              className={cn(
                "font-display text-sm font-bold uppercase tracking-widest transition-colors",
                path === '/vote' ? "text-primary underline decoration-2 underline-offset-8" : "text-secondary hover:text-primary"
              )}
            >
              VOTE
            </Link>
          </nav>
          <Link
            to="/tickets"
            className="bg-primary text-background px-4 md:px-6 py-2 border-2 border-primary font-display font-bold uppercase tracking-widest hover:bg-primary-container hover:text-primary transition-all duration-300 active:scale-95 text-xs md:text-sm"
          >
            BUY TICKET
          </Link>
      </header>

      <main className="flex-grow flex flex-col w-full relative">
        {children}
      </main>

      <footer className="w-full py-12 px-6 md:px-12 flex flex-col gap-8 md:flex-row justify-between items-start bg-surface border-t border-primary mt-auto">
        <div className="flex flex-col gap-3">
            <h2 className="font-display text-xl md:text-2xl font-bold tracking-tighter uppercase text-primary">
              YEP VINUNI
            </h2>
            <p className="font-display text-[10px] md:text-xs uppercase tracking-widest text-primary/60 font-bold max-w-sm leading-relaxed">
              YEAR END PARTY. BUILT FOR THE BOLD. DESIGNED FOR THE CURIOUS.
            </p>
            <p className="font-display text-[10px] md:text-xs uppercase tracking-widest text-primary/60 mt-2">
              © 2026 YEP VINUNI. ALL RIGHTS RESERVED.
            </p>
            <p className="font-body text-[10px] md:text-xs tracking-widest text-primary/60 mt-2">
              © 2026 YEP VINUNI. ALL RIGHTS RESERVED.
            </p>
          <p className="font-display text-[10px] md:text-xs uppercase tracking-widest text-primary/60 mt-2">
            © 2024 YEP VINUNI. ALL RIGHTS RESERVED.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-12 gap-y-8">
          <nav className="flex flex-col gap-4">
            <span className="font-display font-black text-sm uppercase tracking-widest text-secondary mb-2">NAVIGATE</span>
            <Link to="/" className="font-display text-xs font-bold uppercase tracking-widest text-primary hover:text-secondary transition-colors">HOME</Link>
            <Link to="/lineup" className="font-display text-xs font-bold uppercase tracking-widest text-primary hover:text-secondary transition-colors">LINEUP</Link>
            <Link to="/tickets" className="font-display text-xs font-bold uppercase tracking-widest text-primary hover:text-secondary transition-colors">TICKETS</Link>
            <Link to="/vote" className="font-display text-xs font-bold uppercase tracking-widest text-primary hover:text-secondary transition-colors">VOTE</Link>
          </nav>
            <nav className="flex flex-col gap-4">
              <span className="font-display font-black text-sm uppercase tracking-widest text-secondary mb-2">SOCIAL</span>
              <a href="https://facebook.com/vinuni.student.council" target="_blank" rel="noopener noreferrer" className="font-display text-xs font-bold uppercase tracking-widest text-primary hover:text-secondary transition-colors">FACEBOOK</a>
              <a href="https://instagram.com/vinunisc" target="_blank" rel="noopener noreferrer" className="font-display text-xs font-bold uppercase tracking-widest text-primary hover:text-secondary transition-colors">INSTAGRAM</a>
              <a href="mailto:studentcouncil@vinuni.edu.vn" className="font-display text-xs font-bold uppercase tracking-widest text-primary hover:text-secondary transition-colors">EMAIL</a>
            </nav>
        </div>
      </footer>
      
      {/* Mobile Nav */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-16 bg-surface border-t border-primary md:hidden">
        <Link to="/" className={cn("p-2", path === '/' ? "bg-primary text-background" : "text-primary opacity-50 block")}>
           <span className="font-bold text-xs uppercase tracking-wider">Home</span>
        </Link>
        <Link to="/tickets" className={cn("p-2", path === '/tickets' || path === '/checkout' ? "bg-primary text-background" : "text-primary opacity-50 block")}>
           <span className="font-bold text-xs uppercase tracking-wider">Tix</span>
        </Link>
         <Link to="/vote" className={cn("p-2", path === '/vote' ? "bg-primary text-background" : "text-primary opacity-50 block")}>
            <span className="font-bold text-xs uppercase tracking-wider">Vote</span>
        </Link>
      </nav>
    </div>
  );
}
