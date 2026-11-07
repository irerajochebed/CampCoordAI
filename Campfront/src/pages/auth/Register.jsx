import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, User, Phone, CheckCircle2, ArrowLeft } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Alert from '../../components/ui/Alert';
import OrganizationUnitSelector from '../../components/ui/OrganizationUnitSelector';
import sdaLogo from '../../assets/sda-logo.jpg';
import heroImage from '../../assets/hero.png';

import { useTranslation } from '../../contexts/LanguageContext';
import LanguageSwitcher from '../../components/ui/LanguageSwitcher';
import ThemeSwitcher from '../../components/ui/ThemeSwitcher';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { t, language } = useTranslation();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    organizationUnitId: '',
    districtId: '',
    customChurchName: '',
    gender: ''
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

  const handleOrgSelectorChange = ({ organizationUnitId, districtId, customChurchName }) => {
    setFormData(prev => ({
      ...prev,
      organizationUnitId: organizationUnitId || '',
      districtId: districtId || '',
      customChurchName: customChurchName || ''
    }));
    if (errors.organizationUnitId || errors.customChurchName) {
      setErrors(prev => ({ ...prev, organizationUnitId: '', customChurchName: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!formData.organizationUnitId && (!formData.districtId || !formData.customChurchName.trim())) {
      newErrors.organizationUnitId = 'Please select your District and Church, or enter your Church Name';
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
      const { confirmPassword, ...rawRegisterData } = formData;
      const registerData = {
        ...rawRegisterData,
        role: 'PARTICIPANT', // Strict church member role
        position: null,
        organizationUnitId: rawRegisterData.organizationUnitId ? parseInt(rawRegisterData.organizationUnitId, 10) : null,
        districtId: rawRegisterData.districtId ? parseInt(rawRegisterData.districtId, 10) : null,
        customChurchName: rawRegisterData.customChurchName ? rawRegisterData.customChurchName.trim() : null,
        preferredLanguage: language || localStorage.getItem('app_language') || 'en'
      };

      const result = await register(registerData);

      if (result.success) {
        setAlert({ type: 'success', message: 'Registration successful! Redirecting to login...' });
        setTimeout(() => navigate('/login'), 2000);
      } else {
        if (result.validationErrors) {
          const fieldErrors = {};
          result.validationErrors.forEach(({ field, message }) => {
            fieldErrors[field] = message;
          });
          setErrors(fieldErrors);
        }
        setAlert({ type: 'error', message: result.message || 'Registration failed. Please check the errors above.' });
      }
    } catch (error) {
      const serverMsg = error?.response?.data?.message || 'An error occurred during registration';
      setAlert({ type: 'error', message: serverMsg });
    } finally {
      setLoading(false);
    }
  };

  const genderOptions = [
    { value: 'MALE', label: 'Male' },
    { value: 'FEMALE', label: 'Female' },
  ];

  return (
    <div 
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative bg-slate-950"
      style={{
        backgroundImage: `linear-gradient(to right, rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.80)), url(${heroImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Top Header Navigation: Back Link, Theme Switcher & Language Switcher */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between max-w-4xl mx-auto">
        <Link 
          to="/" 
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-200 hover:text-white bg-slate-900/60 hover:bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-full transition-all border border-slate-700 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Home</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <LanguageSwitcher />
        </div>
      </div>

      <div className="max-w-2xl w-full space-y-6 my-8 relative z-10 pt-4">
        {/* Header Branding */}
        <div className="text-center">
          <Link to="/" className="inline-flex justify-center mb-3">
            <div className="w-16 h-16 bg-white rounded-2xl p-2 shadow-md border border-slate-200 flex items-center justify-center">
              <img src={sdaLogo} alt="SDA Logo" className="w-full h-full object-contain" />
            </div>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            CampCoordAI
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-300">
            Adventist Camp and Conference Management System
          </p>
        </div>

        {/* Form Container (Theme-aware: White in Light mode, Dark Slate in Dark mode) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 transition-colors">
          <div className="mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {t('auth.createAccount', 'Create an Account')}
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  {t('auth.registerSubtitle', 'Register your SDA membership to participate in camps and events')}
                </p>
              </div>
              <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800">
                Participant Account
              </span>
            </div>
          </div>

          {alert && (
            <Alert
              type={alert.type}
              message={alert.message}
              onClose={() => setAlert(null)}
              className="mb-4 text-xs"
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="First Name"
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                error={errors.firstName}
                icon={<User className="w-4 h-4" />}
                placeholder="John"
                required
              />

              <Input
                label="Last Name"
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                error={errors.lastName}
                icon={<User className="w-4 h-4" />}
                placeholder="Doe"
                required
              />
            </div>

            {/* Email and Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Email Address"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                icon={<Mail className="w-4 h-4" />}
                placeholder="john.doe@example.com"
                required
              />

              <Input
                label="Phone Number"
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                error={errors.phoneNumber}
                icon={<Phone className="w-4 h-4" />}
                placeholder="+250788123456"
                required
              />
            </div>

            {/* Gender Selection */}
            <div>
              <Select
                label="Gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                error={errors.gender}
                options={genderOptions}
                placeholder="Select gender"
                required
              />
            </div>

            {/* Hybrid Organization Hierarchy Selector */}
            <OrganizationUnitSelector
              value={{
                organizationUnitId: formData.organizationUnitId,
                districtId: formData.districtId,
                customChurchName: formData.customChurchName
              }}
              onChange={handleOrgSelectorChange}
              error={errors.organizationUnitId || errors.customChurchName}
              required
            />

            {/* Password Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                icon={<Lock className="w-4 h-4" />}
                placeholder="At least 8 characters"
                required
                helperText="Must be at least 8 characters"
              />

              <Input
                label="Confirm Password"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                icon={<Lock className="w-4 h-4" />}
                placeholder="Re-enter password"
                required
              />
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start pt-1">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700 rounded mt-0.5 cursor-pointer"
              />
              <label htmlFor="terms" className="ml-2 block text-xs text-slate-700 dark:text-slate-300 select-none">
                I agree to the{' '}
                <a href="#" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                  Terms and Conditions
                </a>{' '}
                and{' '}
                <a href="#" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                  Privacy Policy
                </a>
              </label>
            </div>

            {/* Submit Button (Clean solid 2-color styling) */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span>Creating Account...</span>
              ) : (
                <span>Create Member Account</span>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
            <span>Need Coordinator or Pastor access?</span>
            <span className="text-slate-700 dark:text-slate-300 font-medium">Contact your Conference Administrator</span>
          </div>

          <p className="mt-4 text-center text-xs text-slate-600 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline">
              Sign in here
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400">
          &copy; 2026 Seventh-day Adventist Church • Rwanda Union Mission. All rights reserved.
        </p>
      </div>
    </div>
  );
}
