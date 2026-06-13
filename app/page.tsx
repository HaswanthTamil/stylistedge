'use client';

import { useEffect, useState, useRef } from 'react';

// TypeScript Interfaces to match the database.json structure
type PriceType = 'fixed' | 'range' | 'gender' | 'custom';
type GenderPrice = { male: number; female: number };
type RangePrice = [number, number];
type ServicePrice = number | RangePrice | GenderPrice | null;

interface Service {
  name: string;
  price: ServicePrice;
  priceType: PriceType;
}

interface Category {
  id: string;
  title: string;
  image: string;
  highlight: boolean;
  services: Service[];
}

interface Contact {
  person: string;
  phone: string;
  address: string;
}

interface Brand {
  name: string;
  tagline: string;
  heroImage?: string;
  contact: Contact;
}

interface Database {
  brand: Brand;
  categories: Category[];
}

// Custom descriptions for each category for a high-end luxury feel
const categoryDescriptions: Record<string, string> = {
  threading: "Precision shaping and threading to enhance your natural facial contours with absolute perfection.",
  waxing: "Silky smooth skin treatments utilizing premium waxes for long-lasting, gentle hair removal.",
  manicure: "Exquisite hand and feet therapies featuring nourishing botanical scrubs and flawless styling.",
  cleanup: "Revitalizing skin refreshment designed to cleanse pores and restore a vibrant, luminous glow.",
  facials: "Advanced facial treatments targeting specific skin needs for youthful rejuvenation and radiance.",
  spa: "Indulgent full-body massages and polish therapies to melt away stress and restore total harmony.",
  reflexology: "Targeted acupressure and neck therapies designed to stimulate energy flow and deep relaxation.",
  haircare: "Restorative scalp therapies and nourishing hair spa treatments to revive and strengthen every strand.",
  hairchemical: "High-end coloring, smoothing, and keratin treatments tailored to create your signature style.",
  clinical: "Dermatologically-inspired aesthetic therapies for targeted skin concerns and cellular renewal.",
  bridal: "Luxe occasion makeup and event styling packages to ensure you look breathtaking on your most special days."
};

// SVG category icons mapped to their IDs
function CategoryIcon({ id, className = "w-8 h-8" }: { id: string; className?: string }) {
  switch (id) {
    case 'threading':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
        </svg>
      );
    case 'waxing':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'manicure':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
      );
    case 'cleanup':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l8.913-6.254m-8.913 0L3.72 10.225a3.375 3.375 0 00-1.005 2.534c0 1.258.696 2.404 1.8 3l5.297 3.145zM21 18a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case 'facials':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'spa':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m9-9H3" />
        </svg>
      );
    case 'reflexology':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
        </svg>
      );
    case 'haircare':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122A3 3 0 00.47 18.242M20.312 18.242a3 3 0 01-9.06-2.12M12 9.75v-.75a3.75 3.75 0 00-7.5 0v.75m7.5 0H4.5M12 9.75v.75a3.75 3.75 0 01-7.5 0v-.75" />
        </svg>
      );
    case 'hairchemical':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v13.5m0-13.5L3.75 9.104h12l-6-6zM3.75 16.604h12v4.5h-12v-4.5z" />
        </svg>
      );
    case 'clinical':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case 'bridal':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9s2.015-9 4.5-9y" />
        </svg>
      );
    default:
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499c.173-.427.768-.427.94 0l3.001 7.41 8.017.418c.463.024.648.59.294.905l-5.955 5.319 2.052 7.784c.12.455-.38.82-.767.585L12 19.347l-6.974 4.163c-.387.236-.887-.13-.767-.585l2.051-7.784-5.955-5.32c-.354-.314-.169-.88.294-.904l8.018-.418 3.001-7.41z" />
        </svg>
      );
  }
}

export default function HomePage() {
  const [db, setDb] = useState<Database | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const servicesRef = useRef<HTMLDivElement | null>(null);

  // Monitor scroll for premium transparent floating navbar styling
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch the data-driven database
  useEffect(() => {
    let active = true;
    fetch('/database.json?v=' + Date.now())
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        setDb(data);
      })
      .catch((err) => console.error("Error reading database:", err));

    return () => {
      active = false;
    };
  }, []);

  // Bottom Sheet animations helper
  const openDetailPanel = (category: Category) => {
    setActiveCategory(category);
    // Delay to let React render bottom sheet container, then trigger slide up animation
    setTimeout(() => {
      setSheetOpen(true);
      document.body.style.overflow = 'hidden'; // Lock background scroll
    }, 50);
  };

  const closeDetailPanel = () => {
    setSheetOpen(false);
    // Wait for exit transition to finish, then clear state
    setTimeout(() => {
      setActiveCategory(null);
      document.body.style.overflow = 'unset'; // Unlock background scroll
    }, 400);
  };

  // Helper to format service prices based on criteria
  const renderPrice = (service: Service) => {
    if (service.priceType === 'fixed') {
      return (
        <span className="font-semibold text-primary text-base md:text-lg">
          ₹{service.price as number}
        </span>
      );
    }
    if (service.priceType === 'range') {
      const range = service.price as RangePrice;
      return (
        <span className="font-semibold text-primary text-base md:text-lg">
          ₹{range[0]}–₹{range[1]}
        </span>
      );
    }
    if (service.priceType === 'gender') {
      const gender = service.price as GenderPrice;
      return (
        <div className="flex flex-col sm:flex-row gap-2 text-right">
          <span className="inline-flex items-center justify-end text-xs text-text-muted">
            <span className="font-medium mr-1 text-[10px] uppercase tracking-wider bg-primary/5 text-primary px-1.5 py-0.5 rounded border border-primary/10">Male</span>
            <strong className="font-semibold text-primary text-sm">₹{gender.male}</strong>
          </span>
          <span className="inline-flex items-center justify-end text-xs text-text-muted">
            <span className="font-medium mr-1 text-[10px] uppercase tracking-wider bg-accent/10 text-accent-light px-1.5 py-0.5 rounded border border-accent/20">Female</span>
            <strong className="font-semibold text-primary text-sm">₹{gender.female}</strong>
          </span>
        </div>
      );
    }
    return (
      <span className="text-xs md:text-sm font-medium text-accent uppercase tracking-wider italic">
        Consultation Required
      </span>
    );
  };

  // Skeleton Loader for premium loading experience
  if (!db) {
    return (
      <div className="min-h-screen bg-bg-luxury flex flex-col items-center justify-center p-6 text-center">
        <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-accent/20 border-t-primary animate-spin"></div>
          <div className="w-20 h-20 rounded-full overflow-hidden bg-white flex items-center justify-center shadow-md">
            <img src="/logo.png" alt="Stylist Edge Logo" className="w-full h-full object-cover" />
          </div>
        </div>
        <p className="font-serif-luxury text-lg tracking-widest text-primary animate-pulse">Stylist Edge Salon</p>
        <p className="text-xs text-accent uppercase tracking-widest mt-1">Loading experience...</p>
      </div>
    );
  }

  // Filter signature/highlighted services
  const signatureCategories = db.categories.filter((cat) => cat.highlight);

  return (
    <div className="relative min-h-screen font-sans-luxury text-text-luxury selection:bg-accent/60 selection:text-primary overflow-x-hidden">
      
      {/* FLOATING NAVBAR */}
      <nav
        className={`fixed top-0 left-0 w-full z-40 transition-all duration-500 ${
          scrolled
            ? 'bg-bg-luxury/90 backdrop-blur-md shadow-md py-4 border-b border-primary/5'
            : 'bg-transparent py-6'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center">
          <a
            href="#"
            className={`flex items-center group transition-all duration-500 ${
              scrolled
                ? 'opacity-100 translate-x-0 pointer-events-auto bg-transparent px-3 py-1.5 gap-3'
                : 'opacity-0 -translate-x-4 pointer-events-none gap-0'
            }`}
          >
            {/* Elegant logo emblem */}
            <div className="w-10 h-10 rounded-full bg-white overflow-hidden flex items-center justify-center transition-all duration-300 shrink-0">
              <img src="/logo.png" alt="Stylist Edge Logo" className="w-full h-full object-cover" />
            </div>
            <div
              className={`flex flex-col transition-all duration-500 overflow-hidden ${
                scrolled
                  ? 'opacity-100 max-w-[300px] translate-x-0'
                  : 'opacity-0 max-w-0 -translate-x-2 pointer-events-none'
              }`}
            >
              <span className="font-serif-luxury text-xl font-bold tracking-wider text-primary group-hover:text-accent transition-colors whitespace-nowrap">
                {db.brand.name}
              </span>
              <span className="text-[10px] tracking-widest text-[#D4AF37] uppercase font-medium -mt-1 hidden sm:block whitespace-nowrap">
                {db.brand.tagline}
              </span>
            </div>
          </a>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-4 text-xs uppercase tracking-wider font-medium">
            <a
              href="/services"
              className={`transition-all duration-500 rounded-full px-4 py-2 text-xs uppercase tracking-wider font-medium ${
                scrolled
                  ? 'bg-transparent border-transparent text-primary hover:text-accent shadow-none'
                  : 'bg-white/95 backdrop-blur-sm shadow-sm border border-white/20 text-primary hover:text-accent'
              }`}
            >
              Services
            </a>
            <a
              href="#signature"
              className={`transition-all duration-500 rounded-full px-4 py-2 text-xs uppercase tracking-wider font-medium ${
                scrolled
                  ? 'bg-transparent border-transparent text-primary hover:text-accent shadow-none'
                  : 'bg-white/95 backdrop-blur-sm shadow-sm border border-white/20 text-primary hover:text-accent'
              }`}
            >
              Signature
            </a>
            <a
              href="#about"
              className={`transition-all duration-500 rounded-full px-4 py-2 text-xs uppercase tracking-wider font-medium ${
                scrolled
                  ? 'bg-transparent border-transparent text-primary hover:text-accent shadow-none'
                  : 'bg-white/95 backdrop-blur-sm shadow-sm border border-white/20 text-primary hover:text-accent'
              }`}
            >
              About
            </a>
            <a
              href="#contact"
              className={`transition-all duration-500 rounded-full px-4 py-2 text-xs uppercase tracking-wider font-medium ${
                scrolled
                  ? 'bg-transparent border-transparent text-primary hover:text-accent shadow-none'
                  : 'bg-white/95 backdrop-blur-sm shadow-sm border border-white/20 text-primary hover:text-accent'
              }`}
            >
              Contact
            </a>
            <a
              href="/book"
              className="ml-2 bg-black text-white hover:bg-gray-800 transition-all duration-300 rounded-full px-6 py-2.5 text-xs uppercase tracking-widest font-semibold shadow-lg"
            >
              Book Now
            </a>
          </div>


        </div>
      </nav>

      {/* SECTION 1 — HERO */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Luxury Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src={db.brand.heroImage || "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&q=80&w=1600"}
            alt="Luxury Salon Interior"
            className="w-full h-full object-cover scale-105 animate-[subtle-zoom_20s_infinite_alternate] brightness-[0.7] contrast-[1.05]"
          />
          {/* Subtle gradient overlay to match soft luxury style and deep plum brand colors */}
          <div className="absolute inset-0 bg-gradient-to-t from-primary/75 via-primary/40 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-bg-luxury/25 via-transparent to-bg-luxury/25 z-10" />
        </div>

        {/* Hero content */}
        <div className="relative z-20 max-w-5xl mx-auto px-6 text-center text-white pt-20 flex flex-col items-center">
          {/* Circular luxury badge logo */}
          <div className="w-20 h-20 rounded-full border border-accent/40 bg-white overflow-hidden flex items-center justify-center mb-8 shadow-xl animate-fade-in">
            <img src="/logo.png" alt="Stylist Edge Badge" className="w-full h-full object-cover" />
          </div>

          <h1 className="font-serif-luxury text-5xl md:text-8xl font-normal tracking-wide leading-tight mb-4 drop-shadow-md max-w-4xl">
            {db.brand.name}
          </h1>

          <p className="text-sm md:text-xl font-light tracking-widest text-[#D4AF37] uppercase mb-12 drop-shadow">
            {db.brand.tagline}
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="/book"
              className="group relative px-8 py-4 border border-transparent overflow-hidden rounded bg-black font-medium text-sm tracking-widest uppercase text-white hover:shadow-2xl transition-all duration-500 flex items-center justify-center gap-2"
            >
              <span className="relative z-10 flex items-center gap-2">
                Book Appointment
                <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </span>
            </a>
            <button
              onClick={() => servicesRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="group relative px-8 py-4 border border-accent overflow-hidden rounded bg-transparent font-medium text-sm tracking-widest uppercase text-white hover:text-primary transition-colors duration-500"
            >
              <span className="absolute inset-0 w-full h-full bg-accent scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 ease-out z-0" />
              <span className="relative z-10 flex items-center gap-2">
                Explore Services
                <svg className="w-4 h-4 transform group-hover:translate-y-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </span>
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-20 flex flex-col items-center gap-2 text-white/50 text-xs tracking-widest uppercase">
          <span className="animate-bounce">↓</span>
        </div>
      </section>

      {/* SECTION 2 & 3 — SERVICES EXPERIENCE (FLIP GRID) */}
      <section ref={servicesRef} id="services" className="py-24 bg-bg-luxury">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          {/* Section heading */}
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest block mb-3">Our Offerings</span>
            <h2 className="font-serif-luxury text-3xl md:text-5xl font-bold text-black mb-6">
              The Services Experience
            </h2>
            <div className="w-24 h-[1px] bg-accent mx-auto mb-6"></div>
            <p className="text-text-muted text-sm md:text-base leading-relaxed">
              Unlock a world of sophisticated styling, skincare, and therapeutic pampering. Hover over each card to explore our bespoke services, and click to view pricing details.
            </p>
          </div>

          {/* Interactive Categories Tile Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {db.categories.map((category) => {
              const desc = categoryDescriptions[category.id] || "Experience custom-designed styling and premium body care tailored for you.";

              return (
                <div
                  key={category.id}
                  onClick={() => openDetailPanel(category)}
                  className="group relative h-96 perspective-1000 cursor-pointer rounded-xl overflow-hidden focus:outline-none"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openDetailPanel(category);
                    }
                  }}
                >
                  {/* Outer Wrapper with preserve-3d */}
                  <div className="relative w-full h-full duration-700 preserve-3d group-hover:[transform:rotateY(180deg)] shadow-sm group-hover:shadow-xl rounded-xl border border-primary/5 transition-all">
                    
                    {/* FRONT SIDE */}
                    <div className="absolute inset-0 w-full h-full backface-hidden rounded-xl overflow-hidden bg-white">
                      {/* Image zoom effect */}
                      <img
                        src={category.image}
                        alt={category.title}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                      />
                      {/* Elegant dark gradient overlay for legible text */}
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/45 to-transparent" />
                      
                      {/* Content (Title) */}
                      <div className="absolute bottom-0 left-0 w-full p-8 text-white z-20">
                        <span className="text-[10px] tracking-widest text-accent uppercase font-medium mb-1 block">Luxury Service</span>
                        <h3 className="font-serif-luxury text-xl md:text-2xl font-light tracking-wide leading-snug">
                          {category.title}
                        </h3>
                        <div className="w-12 h-[1px] bg-accent mt-4 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
                      </div>
                    </div>

                    {/* BACK SIDE */}
                    <div className="absolute inset-0 w-full h-full [transform:rotateY(180deg)] backface-hidden rounded-xl bg-white p-8 flex flex-col justify-between items-center text-center border-2 border-primary/10 overflow-hidden">
                      {/* Subtle pattern background for back card */}
                      <div className="absolute inset-0 bg-bg-luxury/40 -z-10 opacity-30 pointer-events-none" />
                      
                      {/* Top design decoration */}
                      <div className="w-full flex justify-center mt-4">
                        <div className="p-4 rounded-full bg-primary/5 text-primary border border-primary/10 group-hover:scale-110 transition-transform duration-500">
                          <CategoryIcon id={category.id} className="w-8 h-8" />
                        </div>
                      </div>

                      {/* Title & custom description */}
                      <div className="my-auto px-2">
                        <h3 className="font-serif-luxury text-lg md:text-xl font-bold text-black mb-3">
                          {category.title}
                        </h3>
                        <p className="text-xs md:text-sm text-text-muted leading-relaxed max-w-[240px] mx-auto font-light">
                          {desc}
                        </p>
                      </div>

                      {/* CTA Button */}
                      <div className="w-full mb-4">
                        <span className="inline-block px-5 py-2.5 bg-primary hover:bg-accent text-white text-xs tracking-widest uppercase font-semibold rounded shadow transition-all duration-300 transform group-hover:translate-y-0 translate-y-1">
                          View Services
                        </span>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>

          {/* View Full Menu CTA */}
          <div className="mt-16 text-center">
            <a
              href="/menu"
              className="inline-flex items-center gap-2 px-8 py-4 bg-black text-white text-sm tracking-widest uppercase font-semibold rounded shadow-lg hover:bg-gray-800 hover:-translate-y-1 transition-all duration-300"
            >
              View All Services
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* SECTION 4 — SERVICE DETAIL PANEL (BOTTOM SHEET MODAL) */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 ${
          activeCategory ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Dimmed Background Overlay */}
        <div
          onClick={closeDetailPanel}
          className={`absolute inset-0 bg-primary/60 backdrop-blur-sm transition-opacity duration-500 ${
            sheetOpen ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Sliding Bottom Sheet Container */}
        <div
          className={`absolute bottom-0 left-0 w-full bg-bg-luxury rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl transition-transform duration-500 ease-out border-t border-accent/20 ${
            sheetOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          {/* Drag indicator for mobile luxury touch */}
          <div className="w-16 h-1 bg-accent/25 rounded-full mx-auto my-3 pointer-events-none" />

          {/* Panel Header */}
          <div className="px-6 md:px-12 pb-4 flex justify-between items-center border-b border-primary/5">
            <div>
              <span className="text-[10px] tracking-widest text-[#D4AF37] uppercase font-bold">Service Catalogue</span>
              <h3 className="font-serif-luxury text-2xl md:text-3xl font-bold text-black">
                {activeCategory?.title}
              </h3>
            </div>
            
            {/* Close Button */}
            <button
              onClick={closeDetailPanel}
              className="p-3 rounded-full border border-primary/10 hover:border-accent hover:bg-accent hover:text-white transition-all text-primary"
              aria-label="Close panel"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Panel Body (Dynamic Service List) */}
          <div className="flex-1 overflow-y-auto px-6 md:px-12 py-6">
            {activeCategory?.services && activeCategory.services.length > 0 ? (
              <div className="space-y-3 max-w-4xl mx-auto pb-12">
                {activeCategory.services.map((service, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-4 bg-white hover:bg-primary/5 rounded-xl border border-primary/5 transition-all duration-300 group/row"
                  >
                    <div className="flex-1 pr-6">
                      <h4 className="font-sans-luxury text-sm md:text-base font-medium text-text-luxury group-hover/row:text-primary transition-colors">
                        {service.name}
                      </h4>
                      <p className="text-[10px] text-accent tracking-wider uppercase font-light mt-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity">
                        Premium Care
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      {renderPrice(service)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="font-serif-luxury text-lg text-text-muted italic">
                  New services are being curated. Please contact us for custom packages.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 5 — SIGNATURE SERVICES */}
      <section id="signature" className="py-24 bg-white border-y border-primary/5">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          {/* Section title */}
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest block mb-3">Masterpieces</span>
            <h2 className="font-serif-luxury text-3xl md:text-5xl font-bold text-black mb-6">
              Signature Experiences
            </h2>
            <div className="w-24 h-[1px] bg-accent mx-auto mb-6"></div>
            <p className="text-text-muted text-sm md:text-base">
              A curated selection of our most highlighted treatment packages, handpicked to deliver unmatched indulgence and transformational beauty.
            </p>
          </div>

          {/* Signature Cards Showcase */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {signatureCategories.map((category) => {
              const desc = categoryDescriptions[category.id] || "Indulge in a premium combination of our top-rated care regimens.";

              return (
                <div
                  key={category.id}
                  onClick={() => openDetailPanel(category)}
                  className="group relative bg-bg-luxury rounded-2xl overflow-hidden border border-primary/5 shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer flex flex-col"
                >
                  {/* Large visual header */}
                  <div className="relative h-64 md:h-80 overflow-hidden">
                    <img
                      src={category.image}
                      alt={category.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent" />
                    <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                      <span className="px-3 py-1 bg-accent text-white text-[10px] uppercase tracking-widest font-semibold rounded">
                        Highlight
                      </span>
                      <div className="p-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white">
                        <CategoryIcon id={category.id} className="w-6 h-6" />
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-8 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] tracking-widest text-[#D4AF37] uppercase font-bold mb-1.5 block">Exclusive Offering</span>
                      <h3 className="font-serif-luxury text-2xl font-bold text-black mb-3 group-hover:text-[#D4AF37] transition-colors">
                        {category.title}
                      </h3>
                      <p className="text-sm text-text-muted leading-relaxed font-light mb-6">
                        {desc}
                      </p>
                    </div>

                    <div className="flex justify-between items-center border-t border-primary/5 pt-4">
                      <span className="text-xs text-primary font-medium tracking-wide uppercase">
                        {category.services.length} Premium Options
                      </span>
                      <span className="text-xs text-accent font-semibold tracking-wider uppercase group-hover:underline flex items-center gap-1.5">
                        Discover Packages
                        <svg className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 6 — ABOUT EXPERIENCE (EDITORIAL) */}
      <section id="about" className="py-24 bg-bg-luxury">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            
            {/* Image display */}
            <div className="lg:col-span-5 relative">
              <div className="absolute -inset-4 border border-accent/30 rounded-2xl translate-x-2 translate-y-2 pointer-events-none" />
              <div className="relative h-[450px] md:h-[550px] rounded-2xl overflow-hidden shadow-lg">
                <img
                  src="https://images.unsplash.com/photo-1493256338651-d82f7acb2b38?auto=format&fit=crop&q=80&w=800"
                  alt="Stylist Edge Artistry"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Editorial Content */}
            <div className="lg:col-span-7 space-y-6 lg:pl-6">
              <span className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest block">The Edge Story</span>
              <h2 className="font-serif-luxury text-3xl md:text-5xl font-bold text-black leading-tight">
                Where Style Meets Confidence
              </h2>
              <div className="w-20 h-[1.5px] bg-accent"></div>
              
              <div className="space-y-4 text-text-muted font-light leading-relaxed text-sm md:text-base">
                <p>
                  At <strong className="font-medium text-primary">{db.brand.name}</strong>, we believe that style is a language that speaks of your identity and confidence. Nestled in the heart of Dharmapuri, our unisex salon offers a sanctuary of refined luxury, pristine aesthetics, and masterfully crafted personal care services for everyone.
                </p>
                <p>
                  Curated and led by <strong className="font-medium text-primary">{db.brand.contact.person}</strong>, the brand is built upon an unwavering standard of excellence. Whether you visit us for precision threading, skin-refreshing cleanups, specialized hair treatments, or occasion styling, you enter a space dedicated entirely to your comfort and self-expression.
                </p>
                <p className="italic font-serif-luxury text-primary border-l-2 border-accent pl-4 text-base my-6">
                  "We do not merely change hairstyles or perform skincare; we elevate your innate self-assurance, designing experiences that let your unique style radiate with absolute conviction."
                </p>
                <p>
                  Our services are entirely personalized. We merge premium salon products, contemporary artistic technique, and deep-care clinical treatments to ensure each visit feels restorative, luxurious, and uniquely yours.
                </p>
              </div>

              <div className="pt-6">
                <a
                  href="#services"
                  className="inline-block px-8 py-3.5 bg-primary hover:bg-accent text-white font-medium text-xs tracking-widest uppercase rounded shadow hover:shadow-lg transition-all duration-300"
                >
                  Explore Our Services
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 7 — CONTACT (PREMIUM CARD) */}
      <section id="contact" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest block mb-3">Reservations & Location</span>
            <h2 className="font-serif-luxury text-3xl md:text-5xl font-bold text-black mb-6">
              Connect With Us
            </h2>
            <div className="w-24 h-[1px] bg-accent mx-auto"></div>
          </div>

          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Contact Person Card */}
            <div className="p-8 bg-bg-luxury rounded-2xl border border-primary/5 hover:border-accent/30 transition-all duration-300 text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-primary/5 text-primary border border-primary/10 flex items-center justify-center mb-6">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <span className="text-[10px] tracking-widest text-accent uppercase font-bold mb-1">Director & Stylist</span>
              <h3 className="font-serif-luxury text-lg font-medium text-primary mb-2">
                {db.brand.contact.person}
              </h3>
              <p className="text-xs text-text-muted">Personalized beauty consulting and execution specialist.</p>
            </div>

            {/* Telephone Call Card */}
            <a
              href={`tel:${db.brand.contact.phone}`}
              className="p-8 bg-bg-luxury rounded-2xl border border-primary/5 hover:border-accent/40 transition-all duration-300 text-center flex flex-col items-center group"
            >
              <div className="w-12 h-12 rounded-full bg-primary/5 text-primary border border-primary/10 group-hover:bg-primary group-hover:text-white transition-all duration-300 flex items-center justify-center mb-6">
                <svg className="w-6 h-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.387a12.035 12.035 0 01-7.108-7.108c-.145-.44.02-.927.396-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
              </div>
              <span className="text-[10px] tracking-widest text-accent uppercase font-bold mb-1">Direct Helpline</span>
              <h3 className="font-serif-luxury text-lg font-semibold text-primary mb-2 group-hover:text-accent transition-colors">
                +91 {db.brand.contact.phone.replace(/(\d{5})(\d{5})/, '$1 $2')}
              </h3>
              <p className="text-xs text-text-muted group-hover:underline">Click to call and book your priority appointment.</p>
            </a>

            {/* Address Location Card */}
            <div className="p-8 bg-bg-luxury rounded-2xl border border-primary/5 hover:border-accent/30 transition-all duration-300 text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-primary/5 text-primary border border-primary/10 flex items-center justify-center mb-6">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
              </div>
              <span className="text-[10px] tracking-widest text-accent uppercase font-bold mb-1">Our Location</span>
              <h3 className="font-serif-luxury text-base font-medium text-primary mb-2">
                Stylist Edge Salon
              </h3>
              <p className="text-xs text-text-muted leading-relaxed">
                {db.brand.contact.address}
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 8 — FOOTER */}
      <footer className="bg-primary text-white pt-16 pb-8 border-t border-accent/20">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-3 gap-12 pb-12 border-b border-white/10">
          
          {/* Logo & description */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border border-white/20 bg-white overflow-hidden flex items-center justify-center">
                <img src="/logo.png" alt="Stylist Edge Logo" className="w-full h-full object-cover" />
              </div>
              <h3 className="font-serif-luxury text-2xl font-semibold tracking-wider text-accent">
                {db.brand.name}
              </h3>
            </div>
            <p className="text-xs text-white/70 max-w-xs font-light tracking-wide leading-relaxed">
              Premium unisex luxury and personalized styling curation designed to make everyone feel confident, refreshed, and uniquely themselves.
            </p>
          </div>

          {/* Quick navigations */}
          <div className="space-y-4 text-sm">
            <h4 className="font-serif-luxury text-lg font-medium text-accent">Services</h4>
            <div className="grid grid-cols-2 gap-2 text-xs text-white/75 font-light">
              <a href="#services" className="hover:text-accent hover:underline">Services Catalogue</a>
              <a href="#signature" className="hover:text-accent hover:underline">Signature Deals</a>
              <a href="#about" className="hover:text-accent hover:underline">About Edge</a>
              <a href="#contact" className="hover:text-accent hover:underline">Connect/Find Us</a>
            </div>
          </div>

          {/* Contact details */}
          <div className="space-y-4 text-xs text-white/75 font-light">
            <h4 className="font-serif-luxury text-lg font-medium text-accent">Contact Details</h4>
            <p className="flex items-center gap-2">
              <span className="text-accent font-semibold">Head:</span> {db.brand.contact.person}
            </p>
            <p className="flex items-center gap-2">
              <span className="text-accent font-semibold">Phone:</span> +91 {db.brand.contact.phone}
            </p>
            <p className="flex items-center gap-2">
              <span className="text-accent font-semibold">Address:</span> {db.brand.contact.address}
            </p>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-6 md:px-12 pt-8 flex flex-col md:flex-row justify-between items-center text-[10px] text-white/50 tracking-wider uppercase">
          <p>© {new Date().getFullYear()} {db.brand.name}. All Rights Reserved.</p>
          <p className="mt-2 md:mt-0">Design & Curation by {db.brand.contact.person}</p>
        </div>
      </footer>

      {/* Floating Call CTA for mobile screens */}
      <a
        href={`tel:${db.brand.contact.phone}`}
        className="fixed bottom-6 right-6 z-30 md:hidden flex items-center justify-center w-14 h-14 bg-accent text-white rounded-full shadow-lg hover:bg-primary transition-all duration-300"
        title="Call Salon"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.387a12.035 12.035 0 01-7.108-7.108c-.145-.44.02-.927.396-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
        </svg>
      </a>

      {/* Embedded Animations Styles */}
      <style jsx global>{`
        @keyframes subtle-zoom {
          0% {
            transform: scale(1.02) translate(0, 0);
          }
          100% {
            transform: scale(1.08) translate(-1%, -1%);
          }
        }
        
        .animate-fade-in {
          animation: fadeIn 1.2s ease-out forwards;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

    </div>
  );
}
