import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, User, Phone, CheckCircle2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Alert from '../../components/ui/Alert';
import OrganizationUnitSelector from '../../components/ui/OrganizationUnitSelector';
import sdaLogo from '../../assets/sda-logo.jpg';
import heroImage from '../../assets/hero.png';

import { useTranslation } from '../../contexts/LanguageContext';
import LanguageSwitcher from '../../components/ui/LanguageSwitcher';

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
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative"
      style={{
        backgroundImage: `linear-gradient(to right, rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0.6)), url(${heroImage})`,
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

      <div className="max-w-2xl w-full space-y-8 my-8">
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex justify-center mb-4">
            <img src={sdaLogo} alt="SDA Logo" className="w-20 h-20 object-contain bg-white rounded-full p-2 shadow-lg" />
          </Link>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            CampCoordAI
          </h2>
          <p className="mt-2 text-sm text-gray-200">
            Adventist Camp and Conference Management System
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/20">
          <div className="mb-6 pb-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{t('auth.createAccount', 'Church Member Registration')}</h3>
                <p className="mt-1 text-sm text-gray-600">
                  {t('auth.registerSubtitle', 'Register your SDA membership to participate in camps and events')}
                </p>
              </div>
              <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-800">
                Participant Account
              </span>
            </div>
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
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="First Name"
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                error={errors.firstName}
                icon={<User className="w-5 h-5" />}
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
                icon={<User className="w-5 h-5" />}
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
                icon={<Mail className="w-5 h-5" />}
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
                icon={<Phone className="w-5 h-5" />}
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
                icon={<Lock className="w-5 h-5" />}
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
                icon={<Lock className="w-5 h-5" />}
                placeholder="Re-enter password"
                required
              />
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                I agree to the{' '}
                <a href="#" className="text-primary-600 hover:text-primary-500">
                  Terms and Conditions
                </a>{' '}
                and{' '}
                <a href="#" className="text-primary-600 hover:text-primary-500">
                  Privacy Policy
                </a>
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full shadow-lg"
              loading={loading}
              disabled={loading}
            >
              Create Member Account
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-2">
            <span>Need Coordinator or Pastor access?</span>
            <span className="text-gray-600 font-medium">Contact your Conference Administrator</span>
          </div>

          <p className="mt-4 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-500">
              Sign in here
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-300">
          &copy; 2026 Rwanda Union Mission. All rights reserved.
        </p>
      </div>
    </div>
  );
}
