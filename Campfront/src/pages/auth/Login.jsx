import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, Shield, User as UserIcon, CheckCircle2 } from 'lucide-react';
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
  
  // Portal Toggle State: 'PARTICIPANT' vs 'COORDINATOR_ADMIN'
  const [portal, setPortal] = useState('PARTICIPANT');

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
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePortalSwitch = (newPortal) => {
    setPortal(newPortal);
    setAlert(null);
    setErrors({});
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
      const result = await login(formData.email, formData.password, portal);
      
      if (result.success) {
        const userRole = result.user?.role;
        // Role-tailored navigation
        if (userRole === 'PARTICIPANT') {
          navigate('/app/dashboard/participant');
        } else if (userRole === 'COORDINATOR') {
          navigate('/app/dashboard/coordinator');
        } else if (userRole === 'ADMINISTRATOR') {
          navigate('/app/dashboard/admin');
        } else {
          navigate('/app/dashboard');
        }
      } else {
        setAlert({
          type: 'error',
          message: result.message || 'Login failed. Please check your credentials.'
        });
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'An unexpected error occurred. Please try again later.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative"
      style={{
        backgroundImage: `linear-gradient(to right, rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0.55)), url(${heroImage})`,
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

      <div className="max-w-md w-full space-y-8 my-6">
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex justify-center mb-4">
            <img src={sdaLogo} alt="SDA Logo" className="w-20 h-20 object-contain bg-white rounded-full p-2 shadow-xl ring-2 ring-white/30" />
          </Link>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            CampCoordAI
          </h2>
          <p className="mt-1 text-sm text-gray-200">
            Adventist Camp and Conference Management System
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-6 sm:p-8 border border-white/30">
          
          {/* Multi-Portal Toggle Tabs */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 text-center">
              Select Portal
            </label>
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-gray-100/90 rounded-xl border border-gray-200">
              <button
                type="button"
                onClick={() => handlePortalSwitch('PARTICIPANT')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 ${
                  portal === 'PARTICIPANT'
                    ? 'bg-white text-primary-700 shadow-md ring-1 ring-black/5'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                }`}
              >
                <UserIcon className="w-4 h-4 text-primary-600" />
                <span>Participant</span>
              </button>
              
              <button
                type="button"
                onClick={() => handlePortalSwitch('COORDINATOR_ADMIN')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 ${
                  portal === 'COORDINATOR_ADMIN'
                    ? 'bg-white text-primary-700 shadow-md ring-1 ring-black/5'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                }`}
              >
                <Shield className="w-4 h-4 text-amber-600" />
                <span>Staff & Admin</span>
              </button>
            </div>
            
            {/* Portal Badge / Description */}
            <div className="mt-3 text-center">
              {portal === 'PARTICIPANT' ? (
                <span className="inline-flex items-center text-xs text-primary-700 bg-primary-50 px-2.5 py-1 rounded-md font-medium border border-primary-100">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-primary-600" />
                  Church Members, Attendees & Campers
                </span>
              ) : (
                <span className="inline-flex items-center text-xs text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md font-medium border border-amber-200">
                  <Shield className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
                  Pastors, Field Leaders, Officers & Admins
                </span>
              )}
            </div>
          </div>

          {alert && (
            <Alert
              type={alert.type}
              message={alert.message}
              onClose={() => setAlert(null)}
              className="mb-4 text-xs sm:text-sm"
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
              placeholder={portal === 'PARTICIPANT' ? 'member@church.rw' : 'leader@rum.adventist.org'}
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

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-xs sm:text-sm text-gray-700">
                  Remember me
                </label>
              </div>

              <div>
                <Link
                  to="/forgot-password"
                  className="font-medium text-xs sm:text-sm text-primary-600 hover:text-primary-500"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full shadow-lg"
              loading={loading}
              disabled={loading}
            >
              Sign In to {portal === 'PARTICIPANT' ? 'Participant Portal' : 'Staff Portal'}
            </Button>
          </form>

          {/* Conditional Registration Footer */}
          {portal === 'PARTICIPANT' ? (
            <p className="mt-6 text-center text-sm text-gray-600 border-t border-gray-100 pt-4">
              Don't have a member account?{' '}
              <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-500">
                Register here
              </Link>
            </p>
          ) : (
            <div className="mt-6 text-center text-xs text-gray-500 border-t border-gray-100 pt-4">
              <p>Staff & Coordinator accounts are provisioned by Conference Administrators.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-300">
          &copy; 2026 Rwanda Union Mission. All rights reserved.
        </p>
      </div>
    </div>
  );
}
