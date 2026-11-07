import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  Pause, 
  Play, 
  Maximize2, 
  X, 
  ShieldCheck, 
  ArrowRight,
  MapPin
} from 'lucide-react';
import Button from '../ui/Button';
import { useTranslation } from '../../contexts/LanguageContext';

// Background images for the hero animation
import heroImage from '../../assets/hero.png';
import congressHallImage from '../../assets/congress-stewardship-hall.jpg';
import congressParticipantsImage from '../../assets/congress-stewardship-participants.jpg';
import rumStreetViewImage from '../../assets/rum-street-view.jpg';

const SLIDE_DURATION = 6000; // 6 seconds per background transition

export default function HeroSlideshow({ stats = [] }) {
  const { t } = useTranslation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lightboxImage, setLightboxImage] = useState(null);

  const progressIntervalRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  const slides = [
    {
      id: 0,
      image: heroImage,
      tag: 'Headquarters',
      title: 'Rwanda Union Mission Headquarters',
      subtitle: 'Official Seventh-day Adventist Church Headquarters Campus in Kigali',
      location: 'Kigali, Rwanda'
    },
    {
      id: 1,
      image: congressHallImage,
      tag: 'Stewardship Congress',
      title: 'Rwanda Union Mission Stewardship Congress Hall',
      subtitle: 'Over 500 delegates and pastors gathered for spiritual revival & leadership training',
      location: 'Assembly Hall, Kigali'
    },
    {
      id: 2,
      image: congressParticipantsImage,
      tag: 'Delegates & Leaders',
      title: 'Congress Delegates & Leadership Sessions',
      subtitle: 'Ministers and local church leaders united in conference sessions',
      location: 'Conference Center'
    },
    {
      id: 3,
      image: rumStreetViewImage,
      tag: 'Campus View',
      title: 'Rwanda Union Mission Campus Grounds',
      subtitle: 'Coordinating camp meetings, ministries, and missionary efforts across Rwanda',
      location: 'Rwanda Union Complex'
    }
  ];

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setProgress(0);
    startTimeRef.current = Date.now();
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setProgress(0);
    startTimeRef.current = Date.now();
  }, [slides.length]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
    setProgress(0);
    startTimeRef.current = Date.now();
  };

  // Auto-play timer with smooth progress update
  useEffect(() => {
    if (!isPlaying || isHovered) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      return;
    }

    startTimeRef.current = Date.now() - (progress / 100) * SLIDE_DURATION;

    const intervalTime = 50; // update progress every 50ms
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = Math.min((elapsed / SLIDE_DURATION) * 100, 100);
      setProgress(newProgress);

      if (elapsed >= SLIDE_DURATION) {
        nextSlide();
      }
    }, intervalTime);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [isPlaying, isHovered, currentSlide, nextSlide, progress]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide]);

  const activeSlide = slides[currentSlide];

  return (
    <section 
      className="relative pt-16 min-h-screen flex flex-col justify-between overflow-hidden bg-slate-950 text-white select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label="Rwanda Union Mission Hero"
    >
      {/* Background Animated Slideshow with Crossfade & Ken Burns Zoom Effect */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {slides.map((slide, idx) => {
          const isActive = idx === currentSlide;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              <img
                src={slide.image}
                alt={slide.title}
                className={`w-full h-full object-cover transform transition-transform duration-[7000ms] ease-out ${
                  isActive ? 'scale-105' : 'scale-100'
                }`}
              />
              {/* Tuned Balanced Gradient Overlays: Maximizes background visibility while guaranteeing crisp text readability */}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/45 to-slate-950/15" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-slate-950/40" />
            </div>
          );
        })}
      </div>

      {/* Top Countdown Progress Bar */}
      <div className="relative z-20 w-full bg-white/10 h-1 backdrop-blur-xs">
        <div 
          className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-300 transition-all duration-75 ease-linear shadow-xs shadow-cyan-400/50"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Main Hero Content Area - Clean Single-Column Layout matching First Image */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 w-full flex-1 flex flex-col justify-center">
        <div className="max-w-2xl lg:max-w-3xl space-y-4 sm:space-y-5">
          
          {/* Badge: CampCoordAI System */}
          <div className="inline-flex items-center space-x-2 bg-slate-900/70 backdrop-blur-md border border-cyan-400/50 rounded-full px-4 py-1.5 shadow-lg shadow-cyan-950/40">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-300 text-xs sm:text-sm font-semibold tracking-wide">
              {t('landing.hero.badge', 'CampCoordAI System')}
            </span>
          </div>

          {/* Main Hero Heading: RWANDA UNION MISSION */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.06] drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
            {t('landing.hero.title1', 'RWANDA UNION')}
            <br />
            <span className="text-cyan-400 drop-shadow-[0_4px_20px_rgba(6,182,212,0.5)]">
              {t('landing.hero.title2', 'MISSION')}
            </span>
          </h1>

          {/* Adventist Tagline: JESUS IS COMING SOON! */}
          <p className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-wider uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
            {t('landing.hero.tagline', 'JESUS IS COMING SOON!')}
          </p>

          {/* Platform Description */}
          <p className="text-base sm:text-lg lg:text-xl text-slate-100 font-normal leading-relaxed max-w-2xl drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
            {t('landing.hero.description', 'Transform the way you plan and manage Adventist camps and conferences. Streamline registrations, track attendance, and coordinate everything in one intelligent platform.')}
          </p>

          {/* Action Buttons: GET INVOLVED & Existing User? Login */}
          <div className="flex flex-wrap items-center gap-3.5 sm:gap-4 pt-2">
            <Link to="/register">
              <Button 
                variant="primary" 
                size="lg"
                icon={<ArrowRight className="w-5 h-5" />}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-xl shadow-cyan-500/30 border-0 hover:scale-[1.02] transition-transform px-6 sm:px-8 py-3.5"
              >
                {t('landing.hero.getInvolved', 'GET INVOLVED')}
              </Button>
            </Link>
            
            <Link to="/login">
              <Button 
                variant="outline" 
                size="lg"
                className="border-2 border-white/80 bg-slate-950/40 text-white hover:bg-white/20 backdrop-blur-md font-semibold px-6 sm:px-8 py-3.5 hover:border-white transition-all shadow-lg"
              >
                {t('landing.hero.existingUserLogin', 'Existing User? Login')}
              </Button>
            </Link>

            {/* Lightbox / Fullscreen View Trigger */}
            <button
              onClick={() => setLightboxImage(activeSlide)}
              className="p-3.5 bg-slate-900/60 hover:bg-slate-900/90 text-white rounded-xl backdrop-blur-md border border-white/25 hover:border-cyan-400/60 transition-all cursor-pointer group shadow-lg"
              title={t('landing.gallerySection.viewLarger', 'Click to view full background photo')}
              aria-label="View background photo fullscreen"
            >
              <Maximize2 className="w-5 h-5 group-hover:scale-110 transition-transform text-cyan-300" />
            </button>
          </div>

        </div>

        {/* Minimalist Floating Slide Indicator & Controls */}
        <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-white/10 max-w-2xl lg:max-w-3xl">
          
          {/* Current Slide Location & Title Indicator */}
          <div className="flex items-center space-x-2 text-xs sm:text-sm text-slate-200">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/70 backdrop-blur-md border border-white/15 text-cyan-300 font-medium">
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{activeSlide.title}</span>
            </span>
          </div>

          {/* Interactive Navigation Controls */}
          <div className="flex items-center space-x-3">
            
            {/* Play/Pause Toggle */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-900/90 text-slate-300 hover:text-white border border-white/15 transition-colors cursor-pointer"
              title={isPlaying ? 'Pause animation' : 'Play animation'}
              aria-label={isPlaying ? 'Pause animation' : 'Play animation'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 text-cyan-400" /> : <Play className="w-3.5 h-3.5 text-amber-400" />}
            </button>

            {/* Slide Dots */}
            <div className="flex items-center space-x-1.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToSlide(i)}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    i === currentSlide 
                      ? 'w-6 bg-cyan-400 shadow-xs shadow-cyan-400/80' 
                      : 'w-2 bg-white/30 hover:bg-white/60'
                  }`}
                  aria-label={`Go to background slide ${i + 1}`}
                />
              ))}
            </div>

            {/* Prev / Next Buttons */}
            <div className="flex items-center space-x-1">
              <button
                onClick={prevSlide}
                className="p-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-900/90 text-white border border-white/15 hover:border-cyan-400/50 transition-colors cursor-pointer"
                aria-label="Previous Photo"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextSlide}
                className="p-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-900/90 text-white border border-white/15 hover:border-cyan-400/50 transition-colors cursor-pointer"
                aria-label="Next Photo"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* Bottom Live Stats Bar */}
      <div className="relative z-20 border-t border-white/15 bg-slate-950/75 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 divide-x-0 sm:divide-x divide-white/10">
            {stats.map((stat, index) => (
              <div key={index} className={`flex flex-col items-center sm:items-start ${index > 0 ? 'sm:pl-6' : ''}`}>
                <p className="text-xl sm:text-2xl lg:text-3xl font-black text-cyan-400 tracking-tight">
                  {stat.value}
                </p>
                <p className="text-xs sm:text-sm text-slate-300 font-medium">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fullscreen Lightbox Modal */}
      {lightboxImage && (
        <div 
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fadeIn"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-5xl w-full bg-slate-900 rounded-3xl overflow-hidden border border-white/20 shadow-2xl"
          >
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 z-10 p-2.5 text-white/80 hover:text-white bg-black/70 hover:bg-black/90 rounded-full border border-white/20 transition-colors cursor-pointer"
              aria-label="Close Preview"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="max-h-[75vh] overflow-hidden bg-black flex items-center justify-center">
              <img 
                src={lightboxImage.image} 
                alt={lightboxImage.title}
                className="max-h-[75vh] w-auto object-contain mx-auto"
              />
            </div>

            <div className="p-6 bg-slate-900 border-t border-white/10 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-block text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">
                  {lightboxImage.tag} • RWANDA UNION MISSION
                </div>
                <h3 className="text-xl font-bold">{lightboxImage.title}</h3>
                <p className="text-sm text-slate-300 mt-1">{lightboxImage.subtitle}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setLightboxImage(null)}
                className="border-white/30 text-white shrink-0 hover:bg-white/10"
              >
                {t('landing.gallerySection.close', 'Close Preview')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
