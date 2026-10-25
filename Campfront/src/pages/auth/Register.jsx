import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, User, Phone, Eye, EyeOff, ArrowLeft, ArrowRight, Sparkles, Building2, QrCode } from 'lucide-react';
import Alert from '../../components/ui/Alert';
import Select from '../../components/ui/Select';
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

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    gender: '',
    dateOfBirth: ''
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
    if (!formData.email.trim()) newErrors.email = 'Email address is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Please enter a valid email address';
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (formData.dateOfBirth) {
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      if (dob > today) {
        newErrors.dateOfBirth = 'Date of birth cannot be in the future';
      }
    }
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
        email: rawRegisterData.email.trim(),
        role: 'PARTICIPANT', // Strict church member role
        position: null,
        dateOfBirth: rawRegisterData.dateOfBirth || null,
        organizationUnitId: rawRegisterData.organizationUnitId ? parseInt(rawRegisterData.organizationUnitId, 10) : null,
        districtId: rawRegisterData.districtId ? parseInt(rawRegisterData.districtId, 10) : null,
        customChurchName: rawRegisterData.customChurchName ? rawRegisterData.customChurchName.trim() : null,
        preferredLanguage: language || localStorage.getItem('app_language') || 'en'
      };

      const result = await register(registerData);

      if (result.success) {
        setAlert({ type: 'success', message: 'Registration successful! Redirecting to sign in...' });
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
    <div className="relative flex min-h-screen items-center justify-center overflow-x-hidden bg-slate-950 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

      {/* Background with Full-Screen Hero Photo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${heroImage})`
          }}
        />
        <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[0.5px]" />
      </div>

      {/* Top Header Navigation: Back Link, Theme Switcher & Language Switcher */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between max-w-5xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-800 dark:text-white/90 hover:text-slate-900 dark:hover:text-white bg-white/80 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-full transition-all border border-slate-200 dark:border-white/20 shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Home</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <LanguageSwitcher />
        </div>
      </div>

      {/* Main EduLink Style Card Container */}
      <div className="relative z-10 w-full max-w-5xl my-auto pt-10 sm:pt-6">
        <div className="relative mx-auto flex flex-col items-stretch overflow-hidden rounded-3xl border border-white/20 bg-slate-900/40 backdrop-blur-xl shadow-2xl lg:flex-row">

          {/* =========================================================================
              LEFT COLUMN: AUCA-Style Branding Hero with Photo Background
              ========================================================================= */}
          <div
            className="relative hidden min-h-[500px] lg:w-5/12 items-center justify-center overflow-hidden border-r border-white/15 bg-cover bg-center lg:flex lg:rounded-l-3xl p-8 text-center"
            style={{
              backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.30), rgba(15, 23, 42, 0.45)), url(${heroImage})`,
              backgroundPosition: 'center',
              backgroundSize: 'cover'
            }}
          >
            {/* Subtle inner dark gradient */}
            <div className="absolute inset-0 bg-slate-950/25 pointer-events-none" />

            <div className="relative z-10 flex h-full w-full flex-col items-center justify-between text-center py-6">
              <div className="flex flex-col items-center">
                {/* SDA Logo */}
                <img
                  src={sdaLogo}
                  alt="SDA Logo"
                  className="h-24 w-auto object-contain mb-4 drop-shadow-lg"
                />

                {/* Title & Slogan */}
                <h3 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-md">
                  CampCoordAI
                </h3>
                <p className="mt-1.5 text-sm font-medium italic text-white/95 drop-shadow">
                  Adventist Camp & Conference <span className="font-semibold text-amber-300">Management System</span>
                </p>

                <div className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-slate-950/60 backdrop-blur-md px-3.5 py-1 rounded-full border border-white/20 shadow-md">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Rwanda Union Mission</span>
                </div>
              </div>

              {/* Feature Highlights */}
              {/*<div className="space-y-3 w-full max-w-xs text-left my-6">
                <div className="flex items-center gap-3 bg-slate-950/50 backdrop-blur-md border border-white/10 rounded-2xl p-3">
                  <QrCode className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div className="text-xs">
                    <p className="font-semibold text-white">Digital Member Pass</p>
                    <p className="text-slate-300 text-[11px]">Instant QR Check-in for Camps</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-slate-950/50 backdrop-blur-md border border-white/10 rounded-2xl p-3">
                  <Building2 className="w-5 h-5 text-amber-400 shrink-0" />
                  <div className="text-xs">
                    <p className="font-semibold text-white">Official SDA Hierarchy</p>
                    <p className="text-slate-300 text-[11px]">Union, Field, District & Church</p>
                  </div>
                </div>
              </div>*/}

              <p className="text-xs text-slate-300">
                &copy; 2026 Rwanda Union Mission.
              </p>
            </div>
          </div>

          {/* =========================================================================
              RIGHT COLUMN: AUCA-Style Sign Up Glass Card
              ========================================================================= */}
          <div className="flex-1 flex items-stretch">
            <div className="relative flex h-full w-full flex-col justify-center overflow-hidden rounded-3xl lg:rounded-l-none lg:rounded-r-3xl border border-slate-200/40 bg-white/95 p-6 sm:p-8 text-slate-900 shadow-xl dark:border-slate-800/80 dark:bg-slate-950/95 dark:text-slate-50">

              {/* Mobile Branding Header */}
              <div className="mb-3 flex flex-col items-center justify-center lg:hidden text-center">
                <img src={sdaLogo} alt="SDA Logo" className="h-14 w-auto object-contain mb-2" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">CampCoordAI</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Adventist Camp and Conference Management</p>
              </div>

              <div className="mx-auto w-full">
                {/* Top Divider */}
                <div className="mb-3 h-px bg-slate-200/80 dark:bg-slate-800" />

                {/* Form Title */}
                <div className="mb-3 text-center">
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                    Create Member Account
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Register your Adventist membership to participate in camps and events
                  </p>
                </div>

                {/* Bottom Divider */}
                <div className="mb-4 h-px bg-slate-200/80 dark:bg-slate-800" />

                {alert && (
                  <Alert
                    type={alert.type}
                    message={alert.message}
                    onClose={() => setAlert(null)}
                    className="mb-3 text-xs"
                  />
                )}

                <form onSubmit={handleSubmit} className="space-y-3.5">
                  {/* Name Fields (First Name & Last Name) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="firstName"
                        className="mb-1 block text-sm font-semibold tracking-wide text-slate-800 dark:text-slate-100"
                      >
                        First Name
                      </label>
                      <div className="relative flex items-center">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500 pointer-events-none" />
                        <input
                          id="firstName"
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          placeholder="jochebed"
                          required
                          className="h-11 sm:h-12 w-full rounded-2xl border border-slate-300 bg-white pl-11 pr-4 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:border-primary-500 dark:focus:bg-slate-900"
                        />
                      </div>
                      {errors.firstName && (
                        <p className="mt-1 text-xs text-red-500 font-medium">{errors.firstName}</p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="lastName"
                        className="mb-1 block text-sm font-semibold tracking-wide text-slate-800 dark:text-slate-100"
                      >
                        Last Name
                      </label>
                      <div className="relative flex items-center">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500 pointer-events-none" />
                        <input
                          id="lastName"
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          placeholder="ire"
                          required
                          className="h-11 sm:h-12 w-full rounded-2xl border border-slate-300 bg-white pl-11 pr-4 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:border-primary-500 dark:focus:bg-slate-900"
                        />
                      </div>
                      {errors.lastName && (
                        <p className="mt-1 text-xs text-red-500 font-medium">{errors.lastName}</p>
                      )}
                    </div>
                  </div>

                  {/* Email & Phone Number */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="email"
                        className="mb-1 block text-sm font-semibold tracking-wide text-slate-800 dark:text-slate-100"
                      >
                        Email Address
                      </label>
                      <div className="relative flex items-center">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500 pointer-events-none" />
                        <input
                          id="email"
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="jochebed.ire@example.com"
                          required
                          autoComplete="email"
                          className="h-11 sm:h-12 w-full rounded-2xl border border-slate-300 bg-white pl-11 pr-4 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:border-primary-500 dark:focus:bg-slate-900"
                        />
                      </div>
                      {errors.email && (
                        <p className="mt-1 text-xs text-red-500 font-medium">{errors.email}</p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="phoneNumber"
                        className="mb-1 block text-sm font-semibold tracking-wide text-slate-800 dark:text-slate-100"
                      >
                        Phone Number
                      </label>
                      <div className="relative flex items-center">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500 pointer-events-none" />
                        <input
                          id="phoneNumber"
                          type="tel"
                          name="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={handleChange}
                          placeholder="+250788123456"
                          required
                          autoComplete="tel"
                          className="h-11 sm:h-12 w-full rounded-2xl border border-slate-300 bg-white pl-11 pr-4 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:border-primary-500 dark:focus:bg-slate-900"
                        />
                      </div>
                      {errors.phoneNumber && (
                        <p className="mt-1 text-xs text-red-500 font-medium">{errors.phoneNumber}</p>
                      )}
                    </div>
                  </div>

                  {/* Gender & Date of Birth */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="gender"
                        className="mb-1 block text-sm font-semibold tracking-wide text-slate-800 dark:text-slate-100"
                      >
                        Gender <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="gender"
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        required
                        className="h-11 sm:h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-900 shadow-sm transition-all focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-50 dark:focus:border-primary-500 dark:focus:bg-slate-900"
                      >
                        <option value="">Select gender</option>
                        {genderOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      {errors.gender && (
                        <p className="mt-1 text-xs text-red-500 font-medium">{errors.gender}</p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="dateOfBirth"
                        className="mb-1 block text-sm font-semibold tracking-wide text-slate-800 dark:text-slate-100"
                      >
                        Date of Birth
                      </label>
                      <input
                        id="dateOfBirth"
                        type="date"
                        name="dateOfBirth"
                        max={new Date().toISOString().split('T')[0]}
                        value={formData.dateOfBirth}
                        onChange={handleChange}
                        className="h-11 sm:h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-900 shadow-sm transition-all focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-50 dark:focus:border-primary-500 dark:focus:bg-slate-900"
                      />
                      {errors.dateOfBirth && (
                        <p className="mt-1 text-xs text-red-500 font-medium">{errors.dateOfBirth}</p>
                      )}
                    </div>
                  </div>

                  {/* Organization Unit Selector (District & Church) */}
                  <div>
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
                  </div>

                  {/* Password & Confirm Password with Eye Toggles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="password"
                        className="mb-1 block text-sm font-semibold tracking-wide text-slate-800 dark:text-slate-100"
                      >
                        Password
                      </label>
                      <div className="relative flex items-center">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500 pointer-events-none" />
                        <input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="At least 8 characters"
                          required
                          autoComplete="new-password"
                          className="h-11 sm:h-12 w-full rounded-2xl border border-slate-300 bg-white pl-11 pr-11 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:border-primary-500 dark:focus:bg-slate-900"
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setShowPassword(prev => !prev)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-100 transition-colors p-1 rounded-lg"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="mt-1 text-xs text-red-500 font-medium">{errors.password}</p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="confirmPassword"
                        className="mb-1 block text-sm font-semibold tracking-wide text-slate-800 dark:text-slate-100"
                      >
                        Confirm Password
                      </label>
                      <div className="relative flex items-center">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500 pointer-events-none" />
                        <input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="Re-enter password"
                          required
                          autoComplete="new-password"
                          className="h-11 sm:h-12 w-full rounded-2xl border border-slate-300 bg-white pl-11 pr-11 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:border-primary-500 dark:focus:bg-slate-900"
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setShowConfirmPassword(prev => !prev)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-100 transition-colors p-1 rounded-lg"
                          aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="mt-1 text-xs text-red-500 font-medium">{errors.confirmPassword}</p>
                      )}
                    </div>
                  </div>

                  {/* Terms & Privacy Checkbox */}
                  <div className="flex items-start pt-1">
                    <input
                      id="terms"
                      name="terms"
                      type="checkbox"
                      required
                      className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-slate-900 dark:bg-slate-800 dark:border-slate-700 cursor-pointer mt-0.5"
                    />
                    <label htmlFor="terms" className="ml-2.5 block text-xs text-slate-600 dark:text-slate-300">
                      I agree to the{' '}
                      <span className="font-medium text-primary-600 dark:text-sky-300">Terms of Service</span>
                      {' '}and{' '}
                      <span className="font-medium text-primary-600 dark:text-sky-300">Privacy Policy</span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="group mt-2 w-full cursor-pointer rounded-2xl bg-gradient-to-r from-primary-600 to-primary-700 py-3 px-4 font-semibold text-white shadow-lg shadow-primary-600/20 transition-all duration-200 hover:from-primary-500 hover:to-primary-600 hover:shadow-primary-600/30 disabled:cursor-not-allowed disabled:opacity-60 dark:shadow-primary-950/30 text-sm"
                  >
                    <div className="flex items-center justify-center gap-2">
                      {loading ? (
                        <span>Creating Account...</span>
                      ) : (
                        <>
                          <span>Create Member Account</span>
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </>
                      )}
                    </div>
                  </button>

                  {/* Sign In Link */}
                  <div className="pt-2 text-center text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    Already have an account?{' '}
                    <Link
                      to="/login"
                      className="font-semibold text-primary-600 transition-colors hover:text-primary-700 hover:underline dark:text-sky-300 dark:hover:text-sky-200"
                    >
                      Sign in here
                    </Link>
                  </div>
                </form>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Copyright Notice */}
        <p className="mt-4 text-center text-xs text-slate-400 dark:text-slate-300">
          © 2026 CampCoordAI • Rwanda Union Mission • All rights reserved
        </p>
      </div>

    </div>
  );
}
