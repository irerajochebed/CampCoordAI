import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';
import ThemeSwitcher from '../../components/ui/ThemeSwitcher';
import LanguageSwitcher from '../../components/ui/LanguageSwitcher';
import sdaLogo from '../../assets/sda-logo.jpg';
import heroImage from '../../assets/hero.png';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Email is invalid');
      return;
    }

    setLoading(true);
    try {
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative"
      style={{
        backgroundImage: `linear-gradient(to right, rgba(0, 0, 0, 0.30), rgba(0, 0, 0, 0.15)), url(${heroImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Top Header Navigation */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between max-w-5xl mx-auto">
        <Link 
          to="/login" 
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-800 dark:text-white/90 hover:text-slate-900 dark:hover:text-white bg-white/80 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-full transition-all border border-slate-200 dark:border-white/20 shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Login</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <LanguageSwitcher />
        </div>
      </div>

      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link to="/login" className="inline-flex justify-center mb-4">
            <img src={sdaLogo} alt="SDA Logo" className="w-20 h-20 object-contain drop-shadow-md" />
          </Link>
          <h2 className="text-3xl font-bold text-white">
            Reset your password
          </h2>
          <p className="mt-2 text-sm text-gray-200">
            {success 
              ? 'Check your email for reset instructions' 
              : 'Enter your email address and we\'ll send you a link to reset your password'
            }
          </p>
        </div>

        {/* Form */}
        <div className="bg-white/95 backdrop-blur-md rounded-lg shadow-2xl p-8">
          {success ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
              
              <Alert
                type="success"
                title="Email Sent"
                message={`We've sent password reset instructions to ${email}`}
              />

              <div className="text-sm text-gray-600 space-y-2">
                <p>Didn't receive the email?</p>
                <button
                  onClick={() => setSuccess(false)}
                  className="text-primary-600 hover:text-primary-500 font-medium"
                >
                  Try again
                </button>
              </div>

              <Link to="/login">
                <Button variant="outline" className="w-full" icon={<ArrowLeft className="w-4 h-4" />}>
                  Back to Login
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <Alert
                  type="error"
                  message={error}
                  onClose={() => setError('')}
                  className="mb-4"
                />
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  error={error}
                  icon={<Mail className="w-5 h-5" />}
                  placeholder="Enter your email"
                  required
                  autoComplete="email"
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  loading={loading}
                  disabled={loading}
                >
                  Send Reset Link
                </Button>

                <Link to="/login">
                  <Button 
                    variant="ghost" 
                    className="w-full" 
                    icon={<ArrowLeft className="w-4 h-4" />}
                  >
                    Back to Login
                  </Button>
                </Link>
              </form>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500">
          &copy; 2026 Rwanda Union Mission. All rights reserved.
        </p>
      </div>
    </div>
  );
}
