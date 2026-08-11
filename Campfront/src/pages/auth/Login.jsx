import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';
import sdaLogo from '../../assets/sda-logo.jpg';
import heroImage from '../../assets/hero.png';

import { useTranslation } from '../../contexts/LanguageContext';
import LanguageSwitcher from '../../components/ui/LanguageSwitcher';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setAlert(null);

    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        navigate('/app/dashboard');
      } else {
        setAlert({
          type: 'error',
          message: result.message || 'Login failed. Please check your credentials.'
        });
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'An unexpected error occurred. Please try again later.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative"
      style={{
        backgroundImage: `linear-gradient(to right, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.5)), url(${heroImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Top Controls: Back link and Language Switcher */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
        <Link 
          to="/" 
          className="flex items-center text-white hover:text-gray-200 transition-colors text-sm font-medium"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Home
        </Link>
        <LanguageSwitcher />
      </div>

      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex justify-center mb-4">
            <img src={sdaLogo} alt="SDA Logo" className="w-20 h-20 object-contain bg-white rounded-full p-2" />
          </Link>
          <h2 className="text-3xl font-bold text-white">
            CampCoordAI
          </h2>
          <p className="mt-2 text-sm text-gray-200">
            Adventist Camp and Conference Management System
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white/95 backdrop-blur-md rounded-lg shadow-2xl p-8">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900">{t('auth.welcomeBack', 'Welcome Back')}</h3>
            <p className="mt-1 text-sm text-gray-600">
              {t('auth.loginSubtitle', 'Sign in to access CampCoordAI Rwanda Network')}
            </p>
          </div>

          {alert && (
            <Alert
              type={alert.type}
              message={alert.message}
              onClose={() => setAlert(null)}
              className="mb-4"
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              icon={<Mail className="w-5 h-5" />}
              placeholder="admin@campcoordai.rw"
              required
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              icon={<Lock className="w-5 h-5" />}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              loading={loading}
              disabled={loading}
            >
              Sign in
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              {/* <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Demo Credentials</span>
              </div> */}
            </div>

            {/* <div className="mt-4 space-y-2 text-xs text-gray-600">
              <div className="flex justify-between p-2 bg-gray-50 rounded">
                <span>Administrator:</span>
                <span className="font-mono">admin@campcoordai.rw / Admin@2026</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-50 rounded">
                <span>Coordinator:</span>
                <span className="font-mono">youth.leader@rum.adventist.org / Youth@2026</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-50 rounded">
                <span>Participant:</span>
                <span className="font-mono">participant@campcoordai.rw / Part@2026</span>
              </div>
            </div> */}
          </div>

          <p className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
              Register here
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-200">
          &copy; 2026 Rwanda Union Mission. All rights reserved.
        </p>
      </div>
    </div>
  );
}
