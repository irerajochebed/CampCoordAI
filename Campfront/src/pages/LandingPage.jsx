import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar,
  Users,
  MapPin,
  CheckCircle,
  ArrowRight,
  TrendingUp,
  Building2,
  Shield,
  Zap,
  Heart,
  Menu,
  X,
  Maximize2
} from 'lucide-react';
import Button from '../components/ui/Button';
import ThemeSwitcher from '../components/ui/ThemeSwitcher';
import LanguageSwitcher from '../components/ui/LanguageSwitcher';
import { useTranslation } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import HeroSlideshow from '../components/landing/HeroSlideshow';
import headquartersImage from '../assets/headquarters.png';
import sdaLogo from '../assets/sda-logo.jpg';
import congressHallImage from '../assets/congress-stewardship-hall.jpg';
import congressParticipantsImage from '../assets/congress-stewardship-participants.jpg';
import rumStreetViewImage from '../assets/rum-street-view.jpg';

export default function LandingPage() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedGalleryImage, setSelectedGalleryImage] = useState(null);

  const features = [
    {
      icon: Calendar,
      title: t('landing.featuresSection.feature1Title', 'Smart Camp and Conference Planning'),
      description: t('landing.featuresSection.feature1Desc', 'AI-powered tools to plan and manage camps and conferences with ease')
    },
    {
      icon: Users,
      title: t('landing.featuresSection.feature2Title', 'Seamless Registration'),
      description: t('landing.featuresSection.feature2Desc', 'Quick online registration with QR code badges for instant check-in')
    },
    {
      icon: MapPin,
      title: t('landing.featuresSection.feature3Title', 'Smart Accommodation'),
      description: t('landing.featuresSection.feature3Desc', 'Automated room assignments with capacity tracking and management')
    },
    {
      icon: Zap,
      title: t('landing.featuresSection.feature4Title', 'Real-time Tracking'),
      description: t('landing.featuresSection.feature4Desc', 'Live attendance monitoring and instant notifications for participants')
    },
    {
      icon: Shield,
      title: t('landing.featuresSection.feature5Title', 'Secure Payments'),
      description: t('landing.featuresSection.feature5Desc', 'Safe payment verification system with proof of payment tracking')
    },
    {
      icon: TrendingUp,
      title: t('landing.featuresSection.feature6Title', 'Readiness & Forecasting'),
      description: t('landing.featuresSection.feature6Desc', 'Logistics diagnostics and capacity projections for proactive planning')
    }
  ];

  const stats = [
    { value: '1,000+', label: t('landing.stats.membersServed', 'Members Served') },
    { value: '100+', label: t('landing.stats.eventsManaged', 'Events Managed') },
    { value: '100+', label: t('landing.stats.churchesConnected', 'Churches Connected') },
    { value: '80%', label: t('landing.stats.satisfactionRate', 'Satisfaction Rate') }
  ];

  const steps = [
    {
      step: '01',
      title: t('landing.howItWorksSection.step1Title', 'Create Your Event'),
      description: t('landing.howItWorksSection.step1Desc', 'Set up your camp or conference with our easy-to-use proposal system. Add sessions, speakers, and all event details.'),
      color: 'from-blue-500 to-cyan-500'
    },
    {
      step: '02',
      title: t('landing.howItWorksSection.step2Title', 'Manage Registrations'),
      description: t('landing.howItWorksSection.step2Desc', 'Participants register online, submit payments, and receive QR code badges instantly. Track everything in real-time.'),
      color: 'from-primary-500 to-blue-500'
    },
    {
      step: '03',
      title: t('landing.howItWorksSection.step3Title', 'Coordinate & Track'),
      description: t('landing.howItWorksSection.step3Desc', 'Assign accommodations, track attendance with QR scanning, and get AI-powered insights for better planning.'),
      color: 'from-purple-500 to-primary-500'
    }
  ];

  const aboutPoints = [
    t('landing.aboutSection.point1', 'Department-specific event planning (Youth, MIFEM, Family Ministries, etc.)'),
    t('landing.aboutSection.point2', 'Hierarchical organization structure (Union → Field → District → Church)'),
    t('landing.aboutSection.point3', 'Integrated payment verification in Rwandan Francs (RWF)'),
    t('landing.aboutSection.point4', 'AI-powered attendance predictions and resource recommendations'),
    t('landing.aboutSection.point5', 'QR code check-in system for fast and accurate attendance tracking')
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B132B] text-slate-900 dark:text-white transition-colors duration-200 selection:bg-cyan-500 selection:text-white">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-[#0B192C]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-[#17273F] shadow-xs dark:shadow-lg dark:shadow-black/20 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Brand Logo */}
            <Link to="/" className="flex items-center space-x-3 group">
              <img src={sdaLogo} alt="SDA Logo" className="w-10 h-10 object-contain drop-shadow-xs" />
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                  {t('landing.systemName', 'CampCoordAI')}
                </h1>
                <p className="text-[11px] text-slate-500 dark:text-slate-300 font-medium">
                  {t('landing.unionName', 'Rwanda Union Mission')}
                </p>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#hero-slideshow" className="text-slate-600 dark:text-slate-200 hover:text-cyan-600 dark:hover:text-cyan-400 font-medium text-sm transition-colors">
                {t('landing.nav.home', 'Home')}
              </a>
              <a href="#features" className="text-slate-600 dark:text-slate-200 hover:text-cyan-600 dark:hover:text-cyan-400 font-medium text-sm transition-colors">
                {t('landing.nav.features', 'Features')}
              </a>
              <a href="#how-it-works" className="text-slate-600 dark:text-slate-200 hover:text-cyan-600 dark:hover:text-cyan-400 font-medium text-sm transition-colors">
                {t('landing.nav.howItWorks', 'How It Works')}
              </a>
              <a href="#gallery" className="text-slate-600 dark:text-slate-200 hover:text-cyan-600 dark:hover:text-cyan-400 font-medium text-sm transition-colors">
                {t('landing.nav.gallery', 'Congress Gallery')}
              </a>
              <a href="#about" className="text-slate-600 dark:text-slate-200 hover:text-cyan-600 dark:hover:text-cyan-400 font-medium text-sm transition-colors">
                {t('landing.nav.about', 'About')}
              </a>
            </div>

            {/* Right Controls: Theme Toggle, Language Switcher & Auth Buttons */}
            <div className="hidden sm:flex items-center space-x-2.5 sm:space-x-3">
              <ThemeSwitcher />
              <LanguageSwitcher />

              <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

              <Link to="/login">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white"
                >
                  {t('landing.nav.login', 'Login')}
                </Button>
              </Link>
              <Link to="/register">
                <Button 
                  variant="primary" 
                  size="sm"
                  className="bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-500 dark:hover:bg-cyan-600 text-white shadow-md shadow-cyan-500/20 border-0"
                >
                  {t('landing.nav.signUp', 'Sign Up')}
                </Button>
              </Link>
            </div>

            {/* Mobile Hamburger Button */}
            <div className="flex sm:hidden items-center space-x-2">
              <ThemeSwitcher />
              <LanguageSwitcher compact={true} />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0B192C]/95 backdrop-blur-md px-4 pt-2 pb-6 space-y-3">
            <a 
              href="#hero-slideshow" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {t('landing.nav.home', 'Home')}
            </a>
            <a 
              href="#features" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {t('landing.nav.features', 'Features')}
            </a>
            <a 
              href="#how-it-works" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {t('landing.nav.howItWorks', 'How It Works')}
            </a>
            <a 
              href="#gallery" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {t('landing.nav.gallery', 'Congress Gallery')}
            </a>
            <a 
              href="#about" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {t('landing.nav.about', 'About')}
            </a>
            
            <div className="pt-2 grid grid-cols-2 gap-2">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" size="sm" className="w-full">
                  {t('landing.nav.login', 'Login')}
                </Button>
              </Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" size="sm" className="w-full bg-cyan-600 dark:bg-cyan-500 text-white">
                  {t('landing.nav.signUp', 'Sign Up')}
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Slideshow Section - Placed FIRST on the webpage for immediate engagement */}
      <div id="hero-slideshow">
        <HeroSlideshow stats={stats} />
      </div>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white dark:bg-[#0E172C] border-y border-slate-200 dark:border-[#17273F] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">
              {t('landing.featuresSection.title', 'Powerful Features for Modern Event Management')}
            </h2>
            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              {t('landing.featuresSection.subtitle', 'Everything you need to coordinate successful camps and conferences, powered by AI')}
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index}
                  className="group p-6 sm:p-7 rounded-2xl border border-slate-200 dark:border-[#1E2E4E] hover:border-cyan-500/50 hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300 bg-slate-50/80 dark:bg-[#111D38] hover:bg-white dark:hover:bg-[#152445]"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-cyan-500/15 to-blue-500/15 border border-cyan-500/30 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <Icon className="w-7 h-7 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section 
        id="how-it-works" 
        className="relative py-24 overflow-hidden"
        style={{
          backgroundImage: isDark
            ? `linear-gradient(to bottom, rgba(11, 19, 43, 0.60), rgba(11, 25, 44, 0.70)), url(${headquartersImage})`
            : `linear-gradient(to bottom, rgba(248, 250, 252, 0.75), rgba(248, 250, 252, 0.85)), url(${headquartersImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-block bg-white/90 dark:bg-[#0B192C]/85 backdrop-blur-md px-6 sm:px-8 py-4 rounded-2xl border border-slate-200 dark:border-white/15 shadow-xl">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">
                {t('landing.howItWorksSection.title', 'Simple Process, Powerful Results')}
              </h2>
              <p className="text-base sm:text-xl text-slate-600 dark:text-slate-200 font-medium">
                {t('landing.howItWorksSection.subtitle', 'Get started in three easy steps')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative pt-6">
                <div className={`absolute top-0 left-6 z-10 w-14 h-14 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center transform -rotate-6 shadow-lg shadow-black/30`}>
                  <span className="text-white text-2xl font-black">{step.step}</span>
                </div>
                <div className="bg-white/95 dark:bg-[#0B192C]/90 backdrop-blur-md border border-slate-200 dark:border-white/20 rounded-2xl p-8 pt-14 shadow-xl hover:shadow-cyan-500/10 hover:border-cyan-500/50 transition-all duration-300">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                    {step.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-200 leading-relaxed text-sm font-medium">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          CONGRESS GALLERY SECTION: RWANDA UNION MISSION STEWARDSHIP CONGRESS
          ========================================================================= */}
      <section id="gallery" className="py-20 bg-slate-100/70 dark:bg-[#071221] border-y border-slate-200 dark:border-[#17273F] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="text-center mb-14">
            <div className="inline-flex items-center space-x-2 bg-cyan-100 dark:bg-cyan-950/70 border border-cyan-300 dark:border-cyan-500/40 rounded-full px-4 py-1.5 mb-4 shadow-xs">
              <Building2 className="w-4 h-4 text-cyan-700 dark:text-cyan-400" />
              <span className="text-cyan-800 dark:text-cyan-300 text-xs sm:text-sm font-semibold uppercase tracking-wider">
                {t('landing.gallerySection.badge', 'Official Event Archives')}
              </span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
              {t('landing.gallerySection.title', 'Rwanda Union Mission Stewardship Congress')}
            </h2>
            
            <div className="inline-flex items-center gap-2 text-sm sm:text-base font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 px-4 py-1.5 rounded-full mb-4 shadow-xs">
              <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>{t('landing.gallerySection.dates', 'June 10-13, 2019 • Kigali, Rwanda')}</span>
            </div>
            
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
              {t('landing.gallerySection.subtitle', 'Real gatherings powered by united leadership, bringing together delegates, pastors, and members from across the Rwanda Union network.')}
            </p>
          </div>

          {/* Gallery Showcase Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
            
            {/* Main Featured Photo: Assembly Hall */}
            <div 
              onClick={() => setSelectedGalleryImage({
                src: congressHallImage,
                title: t('landing.gallerySection.image1Title', 'Stewardship Congress Assembly Hall'),
                desc: t('landing.gallerySection.image1Desc', 'Over 500 church delegates and pastors assembled at the grand conference hall for training and spiritual revival.'),
                tag: t('landing.gallerySection.image1Tag', 'General Assembly')
              })}
              className="lg:col-span-7 group relative rounded-3xl overflow-hidden shadow-xl border border-slate-200 dark:border-[#1E2E4E] bg-slate-900 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:border-cyan-500/50"
            >
              <div className="relative h-72 sm:h-96 lg:h-[460px] overflow-hidden">
                <img 
                  src={congressHallImage} 
                  alt="Rwanda Union Mission Stewardship Congress Assembly Hall" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
                
                {/* Top Tag Badge */}
                <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-md text-cyan-300 text-xs font-bold px-3.5 py-1.5 rounded-full border border-white/20 shadow-md">
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{t('landing.gallerySection.image1Tag', 'General Assembly')}</span>
                </div>

                <div className="absolute top-4 right-4 bg-slate-950/80 backdrop-blur-md text-white p-2 rounded-full border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Maximize2 className="w-4 h-4" />
                </div>

                {/* Bottom Caption */}
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <p className="text-xs font-semibold text-amber-300 uppercase tracking-wider mb-1">
                    RWANDA UNION MISSION STEWARDSHIP CONGRESS • June 10-13, 2019
                  </p>
                  <h3 className="text-xl sm:text-2xl font-bold mb-2 text-white drop-shadow-sm">
                    {t('landing.gallerySection.image1Title', 'Stewardship Congress Assembly Hall')}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-200 line-clamp-2 drop-shadow-xs">
                    {t('landing.gallerySection.image1Desc', 'Over 500 church delegates and pastors assembled at the grand conference hall for training and spiritual revival.')}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: 2 Secondary Photos */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              
              {/* Photo 2: Participants & Leaders Seated */}
              <div 
                onClick={() => setSelectedGalleryImage({
                  src: congressParticipantsImage,
                  title: t('landing.gallerySection.image2Title', 'Congress Delegates & Leadership Sessions'),
                  desc: t('landing.gallerySection.image2Desc', 'Ministers and local church leaders participating in intensive sessions on Christian stewardship.'),
                  tag: t('landing.gallerySection.image2Tag', 'Participants & Leaders')
                })}
                className="group relative rounded-3xl overflow-hidden shadow-xl border border-slate-200 dark:border-[#1E2E4E] bg-slate-900 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:border-cyan-500/50 flex-1"
              >
                <div className="relative h-56 sm:h-64 lg:h-[218px] overflow-hidden">
                  <img 
                    src={congressParticipantsImage} 
                    alt="Congress Delegates and Leadership" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
                  
                  <div className="absolute top-3.5 left-3.5 inline-flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-md text-emerald-300 text-xs font-bold px-3 py-1 rounded-full border border-white/20 shadow-md">
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{t('landing.gallerySection.image2Tag', 'Participants & Leaders')}</span>
                  </div>

                  <div className="absolute top-3.5 right-3.5 bg-slate-950/80 backdrop-blur-md text-white p-1.5 rounded-full border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 className="w-3.5 h-3.5" />
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 text-white">
                    <h4 className="text-base sm:text-lg font-bold mb-1 text-white">
                      {t('landing.gallerySection.image2Title', 'Congress Delegates & Leadership Sessions')}
                    </h4>
                    <p className="text-xs text-slate-200 line-clamp-2">
                      {t('landing.gallerySection.image2Desc', 'Ministers and local church leaders participating in intensive sessions on Christian stewardship.')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Photo 3: Rwanda Union Mission Headquarters Campus */}
              <div 
                onClick={() => setSelectedGalleryImage({
                  src: rumStreetViewImage,
                  title: t('landing.gallerySection.image3Title', 'Rwanda Union Mission Headquarters Campus'),
                  desc: t('landing.gallerySection.image3Desc', 'Official Seventh-day Adventist Church headquarters complex in Kigali, Rwanda.'),
                  tag: t('landing.gallerySection.image3Tag', 'Union Headquarters')
                })}
                className="group relative rounded-3xl overflow-hidden shadow-xl border border-slate-200 dark:border-[#1E2E4E] bg-slate-900 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:border-cyan-500/50 flex-1"
              >
                <div className="relative h-56 sm:h-64 lg:h-[218px] overflow-hidden">
                  <img 
                    src={rumStreetViewImage} 
                    alt="Rwanda Union Mission Headquarters Campus" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
                  
                  <div className="absolute top-3.5 left-3.5 inline-flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-md text-amber-300 text-xs font-bold px-3 py-1 rounded-full border border-white/20 shadow-md">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t('landing.gallerySection.image3Tag', 'Union Headquarters')}</span>
                  </div>

                  <div className="absolute top-3.5 right-3.5 bg-slate-950/80 backdrop-blur-md text-white p-1.5 rounded-full border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 className="w-3.5 h-3.5" />
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 text-white">
                    <h4 className="text-base sm:text-lg font-bold mb-1 text-white">
                      {t('landing.gallerySection.image3Title', 'Rwanda Union Mission Headquarters Campus')}
                    </h4>
                    <p className="text-xs text-slate-200 line-clamp-2">
                      {t('landing.gallerySection.image3Desc', 'Official Seventh-day Adventist Church headquarters complex in Kigali, Rwanda.')}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Lightbox Fullscreen Preview Modal */}
        {selectedGalleryImage && (
          <div 
            onClick={() => setSelectedGalleryImage(null)}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fadeIn"
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-5xl w-full bg-slate-900 rounded-3xl overflow-hidden border border-white/20 shadow-2xl"
            >
              <button
                onClick={() => setSelectedGalleryImage(null)}
                className="absolute top-4 right-4 z-10 p-2 text-white/80 hover:text-white bg-black/60 hover:bg-black/90 rounded-full border border-white/20 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="max-h-[75vh] overflow-hidden bg-black flex items-center justify-center">
                <img 
                  src={selectedGalleryImage.src} 
                  alt={selectedGalleryImage.title}
                  className="max-h-[75vh] w-auto object-contain mx-auto"
                />
              </div>

              <div className="p-6 bg-slate-900 border-t border-white/10 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-block text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">
                    {selectedGalleryImage.tag} • RWANDA UNION MISSION (June 10-13, 2019)
                  </div>
                  <h3 className="text-xl font-bold">{selectedGalleryImage.title}</h3>
                  <p className="text-sm text-slate-300 mt-1">{selectedGalleryImage.desc}</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedGalleryImage(null)}
                  className="border-white/30 text-white shrink-0"
                >
                  {t('landing.gallerySection.close', 'Close Preview')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-slate-50 dark:bg-[#0E172C] border-t border-slate-200 dark:border-[#17273F] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight">
                {t('landing.aboutSection.title', 'Built for the Seventh-day Adventist Community')}
              </h2>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                {t('landing.aboutSection.subtitle', 'CampCoordAI is specifically designed to meet the unique needs of Adventist camp and conference coordination across the Rwanda Union Mission and beyond.')}
              </p>
              <div className="space-y-4">
                {aboutPoints.map((item, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm sm:text-base text-slate-700 dark:text-slate-200 font-medium">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              {/* Headquarters Image Card */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-[#1E2E4E]">
                <img 
                  src={headquartersImage} 
                  alt="Rwanda Union Mission Headquarters" 
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 text-white">
                  <h3 className="text-2xl font-bold mb-1">
                    {t('landing.aboutSection.headquartersTitle', 'Rwanda Union Mission')}
                  </h3>
                  <p className="text-cyan-300 text-sm font-medium">
                    {t('landing.aboutSection.headquartersSubtitle', 'Headquarters of the Seventh-day Adventist Church')}
                  </p>
                </div>
              </div>
              
              {/* Feature Cards Grid */}
              <div className="mt-6 grid grid-cols-1 gap-3.5">
                <div className="bg-white dark:bg-[#111D38] border border-slate-200 dark:border-[#1E2E4E] rounded-2xl p-4 sm:p-5 shadow-md border-l-4 border-l-primary-500">
                  <div className="flex items-center space-x-4">
                    <div className="w-11 h-11 bg-gradient-to-br from-primary-500 to-blue-500 rounded-full flex items-center justify-center shadow-md">
                      <Heart className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-base">
                        {t('landing.aboutSection.card1Title', 'Mission-Driven')}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-300">
                        {t('landing.aboutSection.card1Desc', 'Serving the Adventist community')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#111D38] border border-slate-200 dark:border-[#1E2E4E] rounded-2xl p-4 sm:p-5 shadow-md border-l-4 border-l-emerald-500">
                  <div className="flex items-center space-x-4">
                    <div className="w-11 h-11 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-md">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-base">
                        {t('landing.aboutSection.card2Title', 'Secure & Reliable')}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-300">
                        {t('landing.aboutSection.card2Desc', 'Your data is safe with us')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#111D38] border border-slate-200 dark:border-[#1E2E4E] rounded-2xl p-4 sm:p-5 shadow-md border-l-4 border-l-blue-600">
                  <div className="flex items-center space-x-4">
                    <div className="w-11 h-11 bg-blue-600 rounded-full flex items-center justify-center shadow-md">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-base">
                        {t('landing.aboutSection.card3Title', 'Decision Analytics')}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-300">
                        {t('landing.aboutSection.card3Desc', 'Automated readiness & capacity forecasting')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-cyan-700 via-blue-800 to-slate-900 dark:from-cyan-950/80 dark:via-[#0B192C] dark:to-[#071221] border-y border-cyan-500/20 dark:border-[#1E2E4E] text-white transition-colors">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-5 tracking-tight text-white">
            {t('landing.cta.title', 'Ready to Transform Your Event Management?')}
          </h2>
          <p className="text-base sm:text-xl text-cyan-100 mb-8 max-w-2xl mx-auto">
            {t('landing.cta.subtitle', 'Join hundreds of coordinators already using CampCoordAI to plan better events')}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/register">
              <Button 
                variant="primary" 
                size="lg"
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-lg shadow-cyan-500/40 border-0"
                icon={<ArrowRight className="w-5 h-5" />}
              >
                {t('landing.cta.getStarted', 'Get Started Free')}
              </Button>
            </Link>
            <Link to="/login">
              <Button 
                variant="outline" 
                size="lg"
                className="border-white/60 text-white hover:bg-white/10 backdrop-blur-md font-semibold"
              >
                {t('landing.cta.signIn', 'Sign In')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 dark:bg-[#071221] text-slate-400 py-12 border-t border-slate-800 dark:border-[#17273F] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2.5 mb-4">
                <img src={sdaLogo} alt="SDA Logo" className="w-10 h-10 object-contain drop-shadow-xs" />
                <span className="text-white font-bold text-lg">{t('landing.systemName', 'CampCoordAI')}</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                {t('landing.footer.tagline', 'Digital event management for the Seventh-day Adventist Church in Rwanda')}
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
                {t('landing.footer.platform', 'Platform')}
              </h3>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#features" className="hover:text-cyan-400 transition-colors">{t('landing.nav.features', 'Features')}</a></li>
                <li><a href="#how-it-works" className="hover:text-cyan-400 transition-colors">{t('landing.nav.howItWorks', 'How It Works')}</a></li>
                <li><a href="#gallery" className="hover:text-cyan-400 transition-colors">{t('landing.nav.gallery', 'Congress Gallery')}</a></li>
                <li><a href="#about" className="hover:text-cyan-400 transition-colors">{t('landing.nav.about', 'About')}</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
                {t('landing.footer.resources', 'Resources')}
              </h3>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#" className="hover:text-cyan-400 transition-colors">{t('landing.footer.documentation', 'Documentation')}</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">{t('landing.footer.support', 'Support')}</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">{t('landing.footer.faqs', 'FAQs')}</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
                {t('landing.footer.contact', 'Contact')}
              </h3>
              <ul className="space-y-2.5 text-sm">
                <li className="text-slate-300">Rwanda Union Mission</li>
                <li className="text-slate-300">Kigali, Rwanda</li>
                <li className="text-slate-300">info@rum.adventist.org</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 dark:border-[#17273F] pt-8 text-center text-xs text-slate-500">
            <p>&copy; {new Date().getFullYear()} {t('landing.footer.rights', 'CampCoordAI - Rwanda Union Mission. All rights reserved.')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
