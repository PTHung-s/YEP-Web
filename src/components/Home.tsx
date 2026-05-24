import React from 'react';
import { ChevronDown, Mail, MapPin, Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';
import { yepAsset } from '../lib/assets';

const timeline = [
  { time: '17:00 - 18:30', title: 'Check-in & Booth Activities', desc: 'Wristbands, booths, pre-show games' },
  { time: '18:30 - 18:40', title: 'Opening Performance', desc: 'Main stage opening' },
  { time: '18:40 - 18:50', title: 'Opening Remarks', desc: 'Welcome from the organizers' },
  { time: '18:45 - 19:05', title: 'Club Awards Ceremony', desc: 'Celebrating student clubs' },
  { time: '19:05 - 19:25', title: 'Club & Artist Performances', desc: 'Live performances' },
  { time: '19:30 - 19:45', title: 'YEP Icons Runway', desc: 'The Constellations reveal' },
  { time: '20:05 - 20:25', title: 'Talent Showcase & Q&A', desc: 'Finalist showcase' },
  { time: '20:25 - 20:45', title: 'Artist Performance', desc: 'Guest artist set' },
  { time: '20:45 - 21:15', title: 'Winner Announcement', desc: 'YEP Icons 2026' },
  { time: '21:30 - 21:45', title: 'DJ Session & Late-night Drinks', desc: 'After-party energy' },
];

const faqs = [
  { q: 'What is the dresscode?', a: 'Gardenia summer dresscode: colorful, expressive, comfortable, and ready for photos.' },
  { q: 'Do I need to bring my student ID?', a: 'Yes. Please bring your VinUni student/staff ID for check-in.' },
  { q: 'Can I check in late?', a: 'Late check-in is flexible, but arriving on time helps you catch the full program.' },
  { q: 'Will there be photography?', a: 'The event team will capture key moments, and guests can bring personal cameras.' },
  { q: 'Can I bring non-VinUni guests?', a: 'Guest ticket availability depends on the ticket sales status announced by the organizers.' },
];

export function Home() {
  const timelineSplitIndex = Math.ceil(timeline.length / 2);
  const timelineColumns = [timeline.slice(0, timelineSplitIndex), timeline.slice(timelineSplitIndex)];

  return (
    <div className="w-full">
      <section className="relative min-h-[calc(100vh-4rem)] md:min-h-[calc(100vh-5rem)] flex items-end overflow-hidden bg-primary text-white border-b-2 border-primary">
        <img
          src={yepAsset('hero-kaleido-sc.png')}
          alt="YEP'26 The Kaleido Soul"
          className="absolute inset-0 hidden md:block w-full h-full object-cover object-top"
        />
        <img
          src={yepAsset('background-stage-light.png')}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 block md:hidden w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/35 to-primary/10" />
        <div className="relative z-10 w-full px-6 md:px-12 pb-8 md:pb-12">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="max-w-xl">
              <p className="font-display text-xs md:text-sm font-black uppercase tracking-[0.3em] text-white/80 mb-3">
                June 27, 2026 / Amphitheatre - VinUni Campus
              </p>
              <h1 className="font-display text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[0.82] mb-4">
                YEP'26<br />
                <span className="text-tertiary">The Kaleido Soul</span>
              </h1>
              <p className="font-display text-3xl md:text-5xl font-black uppercase tracking-tight leading-none">
                Born to Bloom Different
              </p>
              <p className="font-body text-sm md:text-base text-white/80 max-w-lg mt-4 leading-relaxed">
                A night of blooming colors and fearless souls, where every reflection tells a story worth celebrating.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/tickets"
                className="bg-white text-primary border-4 border-white px-6 py-3 font-display font-black uppercase tracking-widest hover:bg-primary-container hover:border-primary-container transition-colors neo-shadow-sm"
              >
                Buy Ticket
              </Link>
              <Link
                to="/vote"
                className="bg-transparent text-white border-4 border-white px-6 py-3 font-display font-black uppercase tracking-widest hover:bg-white hover:text-primary transition-colors"
              >
                YEP Icons
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="bg-primary text-white py-3 border-b-2 border-primary overflow-hidden relative flex">
        <div className="animate-marquee whitespace-nowrap flex gap-12 items-center">
          <span className="font-display text-xl md:text-2xl font-bold uppercase tracking-wider">
            YEP 2026 x THE KALEIDO SOUL x BORN TO BLOOM DIFFERENT x YEP 2026 x THE KALEIDO SOUL x
          </span>
        </div>
        <div className="absolute top-0 animate-marquee2 whitespace-nowrap flex gap-12 items-center py-3">
          <span className="font-display text-xl md:text-2xl font-bold uppercase tracking-wider">
            YEP 2026 x THE KALEIDO SOUL x BORN TO BLOOM DIFFERENT x YEP 2026 x THE KALEIDO SOUL x
          </span>
        </div>
      </div>

      <section className="py-16 md:py-24 px-6 md:px-12 bg-surface border-b-2 border-primary max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
          <div>
            <span className="font-display text-tertiary font-bold tracking-widest uppercase block mb-2 text-xs md:text-sm">
              // THE KALEIDO SOUL
            </span>
            <h2 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold uppercase tracking-tighter leading-none mb-8">
              About
            </h2>
            <div className="space-y-4 text-on-surface-variant font-medium leading-relaxed">
              <p>
                YEP'26 uses the kaleidoscope as a symbol for individuality: each person carries a distinct color,
                yet together they create a fuller reflection of the VinUni community.
              </p>
              <p>
                The Kaleido Soul celebrates unique stories, vivid friendships, and the achievements that close one
                academic year while opening the next chapter.
              </p>
            </div>
          </div>

          <div className="relative min-h-[320px] border-2 border-primary overflow-hidden neo-shadow">
            <img
              src={yepAsset('header-kaleido-wide.png')}
              alt="The Kaleido Soul visual"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-primary/30" />
            <p className="absolute left-6 right-6 bottom-6 font-display font-black text-3xl md:text-4xl uppercase leading-tight text-white">
              "Where Every Flower Has Its Own Land"
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 px-6 md:px-12 bg-surface border-b-2 border-primary max-w-7xl mx-auto w-full">
        <div className="flex flex-col gap-8">
          <div>
            <h2 className="font-display text-5xl md:text-6xl font-bold uppercase mb-4 leading-[0.9] tracking-tighter">
              Timing Is<br /><span className="text-secondary">Everything</span>
            </h2>
            <p className="font-body text-base md:text-lg mb-6 font-medium text-on-surface-variant">
              June 27, 2026 - Amphitheatre, VinUni Campus.
            </p>
            <div className="bg-tertiary text-background p-4 md:p-5 border-2 border-primary neo-shadow-blue inline-block w-full md:w-auto">
              <p className="font-display font-black text-xl md:text-2xl uppercase tracking-wider mb-1">Main Stage</p>
              <p className="font-display opacity-90 uppercase tracking-widest text-xs md:text-sm font-bold">The Amphitheatre</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {timelineColumns.map((column, columnIndex) => (
              <div key={columnIndex} className="flex flex-col gap-0 border-2 border-primary bg-surface">
                {column.map((item, itemIndex) => (
                  <div key={`${columnIndex}-${itemIndex}`} className="flex flex-col lg:flex-row border-b-2 border-primary hover:bg-surface-container transition-colors cursor-default last:border-b-0">
                    <div className="px-3 py-2 lg:w-44 lg:min-w-[11rem] border-b-2 lg:border-b-0 lg:border-r-2 border-primary bg-primary text-white font-display text-sm lg:text-base font-bold flex items-center justify-center tracking-tight whitespace-nowrap">
                      {item.time}
                    </div>
                    <div className="px-3 py-2 lg:px-4 lg:py-2.5 flex-grow">
                      <h4 className="font-display text-sm lg:text-base font-black uppercase tracking-tight mb-0.5">{item.title}</h4>
                      <p className="font-display uppercase text-[10px] lg:text-[11px] font-bold text-secondary tracking-widest">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 px-6 md:px-12 bg-background border-b-2 border-primary max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <span className="font-display text-tertiary font-bold tracking-widest uppercase block mb-2 text-xs md:text-sm">
              // THE CONSTELLATIONS
            </span>
            <h2 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold uppercase tracking-tighter leading-none">
              YEP Icons
            </h2>
          </div>
          <Link to="/vote" className="inline-block bg-background text-on-surface border-2 border-primary px-6 py-3 font-display font-bold text-lg uppercase tracking-widest hover:bg-secondary hover:text-white transition-colors neo-shadow active:translate-x-1 active:translate-y-1 active:shadow-none">
            Register And Vote
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-2 border-primary">
          <div className="border-b-2 md:border-b-0 md:border-r-2 border-primary p-6">
            <h3 className="font-display text-2xl font-extrabold uppercase mb-3">Competition Overview</h3>
            <p className="font-body text-sm text-on-surface-variant font-medium leading-relaxed">
              YEP Icons is the spotlight moment for pairs who bring connection, confidence, and a vivid stage presence to VinUni.
            </p>
          </div>
          <div className="p-6">
            <h3 className="font-display text-2xl font-extrabold uppercase mb-3">Join The Journey</h3>
            <p className="font-body text-sm text-on-surface-variant font-medium leading-relaxed">
              Registration and voting details are updated through the official event channels and the YEP Icons page.
            </p>
          </div>
        </div>
      </section>

      <section className="relative py-20 md:py-24 px-6 md:px-12 bg-primary text-white border-t-2 border-primary text-center overflow-hidden w-full">
        <img
          src={yepAsset('background-stage-light.png')}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-primary/65" />
        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <h2 className="font-display text-6xl md:text-8xl lg:text-[9rem] font-bold uppercase mb-12 tracking-tighter leading-none">
            Get Your Ticket
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              ['VINUNIANS EARLY', '250K', '100 tickets', 'bg-secondary text-white'],
              ['VINUNIANS REGULAR', '300K', '400 tickets', 'bg-primary text-white'],
              ['GUEST', '400K', '200 tickets', 'bg-tertiary text-background'],
            ].map(([label, price, note, buttonClass]) => (
              <div key={label} className="bg-surface p-6 border border-outline-variant flex flex-col items-center text-on-surface transition-transform duration-300 hover:-translate-y-2">
                <span className="font-display text-lg md:text-xl font-bold uppercase mb-3 tracking-widest text-on-surface-variant">{label}</span>
                <span className="font-display text-4xl md:text-5xl font-black mb-2 tracking-tighter text-white">{price}</span>
                <span className="font-display text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">{note}</span>
                <Link to="/tickets" className={`${buttonClass} px-6 py-3 font-display font-bold uppercase hover:bg-primary transition-colors w-full border-2 border-primary neo-shadow active:translate-x-1 active:translate-y-1 active:shadow-none`}>
                  Select
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 px-6 md:px-12 bg-surface border-b-2 border-primary max-w-3xl mx-auto w-full">
        <div className="mb-10">
          <span className="font-display text-tertiary font-bold tracking-widest uppercase block mb-2 text-xs md:text-sm">// FAQ</span>
          <h2 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-tighter">Questions?</h2>
        </div>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <details key={i} className="group border border-outline-variant bg-surface">
              <summary className="flex items-center justify-between p-4 cursor-pointer font-display font-bold text-on-surface uppercase tracking-wider text-sm list-none bg-surface-container hover:bg-surface-container-high transition-colors">
                {faq.q}
                <ChevronDown className="w-5 h-5 transition-transform group-open:rotate-180" />
              </summary>
              <p className="px-4 pb-4 font-body text-sm text-on-surface leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="py-16 md:py-20 px-6 md:px-12 bg-background max-w-7xl mx-auto w-full">
        <div className="mb-10">
          <span className="font-display text-tertiary font-bold tracking-widest uppercase block mb-2 text-xs md:text-sm">// EVENT GUIDE</span>
          <h2 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-tighter">How It Works</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            [Ticket, 'Buy Tickets', 'Choose your ticket type, fill in attendee details, select ticket quantity and merch, then proceed to checkout.'],
            [Mail, 'Check Your Email', 'Your e-ticket will be sent to your email after payment confirmation. Check spam if needed.'],
            [MapPin, 'Merch Pickup', 'Pick up merch at the VinUni Student Council booth or directly during the event.'],
          ].map(([Icon, title, desc]) => (
            <div key={title as string} className="bg-surface border-4 border-primary p-6 flex flex-col items-start gap-4 hover:-translate-y-1 transition-transform">
              <div className="w-14 h-14 bg-primary-container border-2 border-primary flex items-center justify-center neo-shadow-sm">
                {React.createElement(Icon as typeof Ticket, { className: 'w-7 h-7 text-primary' })}
              </div>
              <h3 className="font-display text-xl font-black uppercase tracking-tight">{title as string}</h3>
              <p className="font-body text-sm font-medium text-on-surface-variant leading-relaxed">{desc as string}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
