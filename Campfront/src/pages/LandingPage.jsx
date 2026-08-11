import { Link } from 'react-router-dom';
import { 
  Calendar,
  Users,
  MapPin,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
  Heart
} from 'lucide-react';
import Button from '../components/ui/Button';
import heroImage from '../assets/hero.png';
import headquartersImage from '../assets/headquarters.png';
import sdaLogo from '../assets/sda-logo.jpg';

export default function LandingPage() {
  const features = [
    {
      icon: Calendar,
      title: 'Smart Camp and Conference Planning',
      description: 'AI-powered tools to plan and manage camps and conferences with ease'
    },
    {
      icon: Users,
      title: 'Seamless Registration',
      description: 'Quick online registration with QR code badges for instant check-in'
    },
    {
      icon: MapPin,
      title: 'Smart Accommodation',
      description: 'Automated room assignments with capacity tracking and management'
    },
    {
      icon: Zap,
      title: 'Real-time Tracking',
      description: 'Live attendance monitoring and instant notifications for participants'
    },
    {
      icon: Shield,
      title: 'Secure Payments',
      description: 'Safe payment verification system with proof of payment tracking'
    },
    {
      icon: Sparkles,
      title: 'AI Insights',
      description: 'Predictive analytics and smart recommendations for better planning'
    }
  ];

  const stats = [
    { value: '1,000+', label: 'Members Served' },
    { value: '100+', label: 'Events Managed' },
    { value: '100+', label: 'Churches Connected' },
    { value: '80%', label: 'Satisfaction Rate' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3">
              <img src={sdaLogo} alt="SDA Logo" className="w-12 h-12 object-contain" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">CampCoordAI</h1>
                <p className="text-xs text-gray-600">Rwanda Union Mission</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-primary-600 transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="text-gray-700 hover:text-primary-600 transition-colors">
                How It Works
              </a>
              <a href="#about" className="text-gray-700 hover:text-primary-600 transition-colors">
                About
              </a>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-3">
              <Link to="/login">
                <Button variant="outline" size="sm">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm">
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section 
        className="relative pt-16 min-h-screen flex items-center"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0.4)), url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-primary-500/20 backdrop-blur-md border border-primary-400/30 rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-400 text-sm font-medium"> CampCoordAI System</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              RWANDA UNION
              <span className="block text-cyan-400">MISSION</span>
            </h1>

            <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4">
              JESUS IS COMING SOON!
            </h2>

            <p className="text-xl text-gray-200 mb-8 max-w-2xl">
              Transform the way you plan and manage Adventist camps and conferences. 
              Streamline registrations, track attendance, and coordinate everything in one intelligent platform.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              <Link to="/register">
                <Button 
                  variant="primary" 
                  size="lg"
                  icon={<ArrowRight className="w-5 h-5" />}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg shadow-cyan-500/50"
                >
                  GET INVOLVED
                </Button>
              </Link>
              <Link to="/login">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-white text-white hover:bg-white/10 backdrop-blur-sm"
                >
                  Existing User? Login
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
                  <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                  <p className="text-sm text-gray-300">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-3 bg-white/50 rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Modern Event Management
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to coordinate successful camps and conferences, powered by AI
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index}
                  className="group p-6 rounded-2xl border border-gray-200 hover:border-primary-300 hover:shadow-xl transition-all duration-300 bg-white hover:bg-gradient-to-br hover:from-primary-50 hover:to-blue-50"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-primary-100 to-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-7 h-7 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-gradient-to-br from-primary-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple Process, Powerful Results
            </h2>
            <p className="text-xl text-gray-600">
              Get started in three easy steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Create Your Event',
                description: 'Set up your camp or conference with our easy-to-use proposal system. Add sessions, speakers, and all event details.',
                color: 'from-blue-500 to-cyan-500'
              },
              {
                step: '02',
                title: 'Manage Registrations',
                description: 'Participants register online, submit payments, and receive QR code badges instantly. Track everything in real-time.',
                color: 'from-primary-500 to-blue-500'
              },
              {
                step: '03',
                title: 'Coordinate & Track',
                description: 'Assign accommodations, track attendance with QR scanning, and get AI-powered insights for better planning.',
                color: 'from-purple-500 to-primary-500'
              }
            ].map((step, index) => (
              <div key={index} className="relative">
                <div className={`absolute top-0 left-0 w-16 h-16 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center transform -rotate-6`}>
                  <span className="text-white text-2xl font-bold">{step.step}</span>
                </div>
                <div className="bg-white rounded-2xl p-8 pt-20 shadow-lg hover:shadow-xl transition-shadow">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-600">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Built for the Seventh-day Adventist Community
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                CampCoordAI is specifically designed to meet the unique needs of Adventist camp and 
                conference coordination across the Rwanda Union Mission and beyond.
              </p>
              <div className="space-y-4">
                {[
                  'Department-specific event planning (Youth, MIFEM, Family Ministries, etc.)',
                  'Hierarchical organization structure (Union → Field → District → Church)',
                  'Integrated payment verification in Rwandan Francs (RWF)',
                  'AI-powered attendance predictions and resource recommendations',
                  'QR code check-in system for fast and accurate attendance tracking'
                ].map((item, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              {/* Headquarters Image */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img 
                  src={headquartersImage} 
                  alt="Rwanda Union Mission Headquarters" 
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary-900/80 via-primary-900/40 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                  <h3 className="text-2xl font-bold mb-2">Rwanda Union Mission</h3>
                  <p className="text-primary-100">Headquarters of the Seventh-day Adventist Church</p>
                </div>
              </div>
              
              {/* Feature Cards Overlay */}
              <div className="mt-8 grid grid-cols-1 gap-4">
                <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-primary-600">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-blue-500 rounded-full flex items-center justify-center">
                      <Heart className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Mission-Driven</h4>
                      <p className="text-sm text-gray-600">Serving the Adventist community</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-green-600">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Secure & Reliable</h4>
                      <p className="text-sm text-gray-600">Your data is safe with us</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-purple-600">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">AI-Enhanced</h4>
                      <p className="text-sm text-gray-600">Smart insights for better events</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Event Management?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join hundreds of coordinators already using CampCoordAI to plan better events
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/register">
              <Button 
                variant="primary" 
                size="lg"
                className="bg-black text-primary-600 hover:bg-gray-100"
                icon={<ArrowRight className="w-5 h-5" />}
              >
                Get Started Free
              </Button>
            </Link>
            <Link to="/login">
              <Button 
                variant="outline" 
                size="lg"
                className="border-white text-white hover:bg-white/10"
              >
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img src={sdaLogo} alt="SDA Logo" className="w-10 h-10 object-contain" />
                <span className="text-white font-bold">CampCoordAI</span>
              </div>
              <p className="text-sm text-gray-400">
                Digital event management for the Seventh-day Adventist Church in Rwanda
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#about" className="hover:text-white transition-colors">About</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQs</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Contact</h3>
              <ul className="space-y-2 text-sm">
                <li>Rwanda Union Mission</li>
                <li>Kigali, Rwanda</li>
                <li>info@rum.adventist.org</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} CampCoordAI - Rwanda Union Mission. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
