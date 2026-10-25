import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, Eye, EyeOff, Shield, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import Alert from '../../components/ui/Alert';
import sdaLogo from '../../assets/sda-logo.jpg';
import heroImage from '../../assets/hero.png';
import { useTranslation } from '../../contexts/LanguageContext';
import LanguageSwitcher from '../../components/ui/LanguageSwitcher';
import ThemeSwitcher from '../../components/ui/ThemeSwitcher';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useTranslation();

  // Staff/Leader Checkbox State (true = COORDINATOR_ADMIN, false = PARTICIPANT)
  const [isStaff, setIsStaff] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  const validate = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = t('auth.emailRequired', 'ID or Email address is required');
    } else if (!formData.email.includes('@') && formData.email.trim().length < 3) {
      newErrors.email = t('auth.emailInvalid', 'Please enter a valid email or ID');
    }

    if (!formData.password) {
      newErrors.password = t('auth.passwordRequired', 'Password is required');
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

    const portal = isStaff ? 'COORDINATOR_ADMIN' : 'PARTICIPANT';

    try {
      const result = await login(formData.email.trim(), formData.password, portal);

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
          message: result.message || t('auth.loginFailed', 'Login failed. Please check your credentials.')
        });
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || t('auth.unexpectedError', 'An unexpected error occurred. Please try again later.')
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen lg:h-screen items-center justify-center overflow-x-hidden overflow-y-auto lg:overflow-hidden bg-slate-950 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      
      {/* Background with Hero Photo */}
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
          <span>{t('common.home', 'Home')}</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <LanguageSwitcher />
        </div>
      </div>

      {/* Main EduLink Style Card Container */}
      <div className="relative z-10 w-full max-w-4xl my-auto pt-10 sm:pt-6">
        <div className="relative mx-auto flex flex-col items-stretch overflow-hidden rounded-3xl border border-white/20 bg-slate-900/40 backdrop-blur-xl shadow-2xl lg:flex-row lg:min-h-[470px]">
          
          {/* =========================================================================
              LEFT COLUMN: AUCA-Style Branding Hero with Photo Background
              ========================================================================= */}
          <div 
            className="relative hidden min-h-60 flex-1 items-center justify-center overflow-hidden border-r border-white/15 bg-cover bg-center lg:flex lg:rounded-l-3xl p-8 text-center"
            style={{
              backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.30), rgba(15, 23, 42, 0.45)), url(${heroImage})`,
              backgroundPosition: 'center',
              backgroundSize: 'cover'
            }}
          >
            {/* Subtle inner dark gradient for text readability */}
            <div className="absolute inset-0 bg-slate-950/25 pointer-events-none" />

            <div className="relative z-10 flex h-full w-full flex-col items-center justify-center text-center">
              
              {/* SDA Logo */}
              <img
                src={sdaLogo}
                alt="SDA Logo"
                className="h-24 md:h-28 w-auto object-contain mb-4 drop-shadow-lg"
              />

              {/* Title & Slogan */}
              <div className="mt-2 space-y-1.5">
                <h3 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-md">
                  CampCoordAI
                </h3>
                <p className="text-sm font-medium italic text-white/95 drop-shadow">
                  {t('auth.sloganMain', 'Adventist Camp & Conference')}{' '}
                  <span className="font-semibold text-amber-300">
                    {t('auth.sloganHighlight', 'Management System')}
                  </span>
                </p>
              </div>

              {/* Badges / Information */}
              <div className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-slate-950/60 backdrop-blur-md px-3.5 py-1 rounded-full border border-white/20 shadow-md">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{t('header.unionName', 'Rwanda Union Mission')}</span>
              </div>
            </div>
          </div>

          {/* =========================================================================
              RIGHT COLUMN: AUCA-Style Sign In Glass Card
              ========================================================================= */}
          <div className="flex-1 flex items-stretch">
            <div className="relative flex h-full w-full flex-col justify-center overflow-hidden rounded-3xl lg:rounded-l-none lg:rounded-r-3xl border border-slate-200/40 bg-white/95 p-6 sm:p-8 text-slate-900 shadow-xl dark:border-slate-800/80 dark:bg-slate-950/95 dark:text-slate-50">

              {/* Mobile Branding Header */}
              <div className="mb-3 flex flex-col items-center justify-center lg:hidden text-center">
                <img src={sdaLogo} alt="SDA Logo" className="h-14 w-auto object-contain mb-2" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">CampCoordAI</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('header.subtitle', 'Adventist Camp and Conference Management')}
                </p>
              </div>

              <div className="mx-auto w-full max-w-[420px]">
                {/* Top Divider */}
                <div className="mb-3 h-px bg-slate-200/80 dark:bg-slate-800" />

                {/* Form Title */}
                <div className="mb-3 text-center">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                    {t('auth.signIn', 'Sign In')}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {t('auth.accessPortal', 'Access your camp & conference portal')}
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

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* ID or Email Input */}
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-1.5 block text-sm font-semibold tracking-wide text-slate-800 dark:text-slate-100"
                    >
                      {t('auth.email', 'Email Address')}
                    </label>
                    <div className="relative flex items-center">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500 pointer-events-none" />
                      <input
                        id="email"
                        type="text"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder={
                          isStaff
                            ? t('auth.staffEmailPlaceholder', 'Enter leader email (e.g. president@rumadventist.org)')
                            : t('auth.enterEmail', 'Enter your email address')
                        }
                        required
                        autoComplete="username"
                        className="h-11 sm:h-12 w-full rounded-2xl border border-slate-300 bg-white pl-11 pr-4 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:border-primary-500 dark:focus:bg-slate-900"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-xs text-red-500 font-medium">{errors.email}</p>
                    )}
                  </div>

                  {/* Password Input with Eye Toggle */}
                  <div>
                    <label
                      htmlFor="password"
                      className="mb-1.5 block text-sm font-semibold tracking-wide text-slate-800 dark:text-slate-100"
                    >
                      {t('auth.password', 'Password')}
                    </label>
                    <div className="relative flex items-center">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500 pointer-events-none" />
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder={t('auth.enterPassword', 'Enter your password')}
                        required
                        autoComplete="current-password"
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

                  {/* "I am a Staff/Leader" Checkbox */}
                  <div className="pt-0.5">
                    <label
                      htmlFor="staff-leader-toggle"
                      className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer group"
                    >
                      <input
                        id="staff-leader-toggle"
                        type="checkbox"
                        checked={isStaff}
                        onChange={(e) => setIsStaff(e.target.checked)}
                        className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-slate-900 dark:bg-slate-800 dark:border-slate-700 cursor-pointer"
                      />
                      <div className="flex items-center gap-2 font-semibold text-sm text-slate-800 dark:text-slate-200 select-none">
                        <span>{t('auth.staffLeaderToggle', 'I am a Staff/Leader')}</span>
                        {isStaff && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                            <Shield className="w-3 h-3 mr-1" /> {t('auth.staffMode', 'Staff Mode')}
                          </span>
                        )}
                      </div>
                    </label>
                  </div>

                  {/* Options: Remember me & Forgot Password */}
                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-600 dark:text-slate-400">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-3.5 h-3.5 text-primary-600 rounded border-slate-300 focus:ring-primary-500 cursor-pointer"
                      />
                      <span>{t('auth.rememberMe', 'Remember me')}</span>
                    </label>

                    <Link
                      to="/forgot-password"
                      className="font-medium text-primary-600 hover:text-primary-700 hover:underline dark:text-sky-300 dark:hover:text-sky-200 transition-colors"
                    >
                      {t('auth.forgotPassword', 'Forgot password?')}
                    </Link>
                  </div>

                  {/* EduLink Gradient Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="group mt-1 w-full cursor-pointer rounded-2xl bg-gradient-to-r from-primary-600 to-primary-700 py-2.5 sm:py-3 px-4 font-semibold text-white shadow-lg shadow-primary-600/20 transition-all duration-200 hover:from-primary-500 hover:to-primary-600 hover:shadow-primary-600/30 disabled:cursor-not-allowed disabled:opacity-60 dark:shadow-primary-950/30 text-xs sm:text-sm"
                  >
                    <div className="flex items-center justify-center gap-2">
                      {loading ? (
                        <span>{t('auth.signingIn', 'Signing In...')}</span>
                      ) : (
                        <>
                          <span>
                            {isStaff ? t('auth.signInStaff', 'Sign In as Staff') : t('auth.signIn', 'Sign In')}
                          </span>
                          <ArrowRight className="lucide lucide-arrow-right h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </>
                      )}
                    </div>
                  </button>

                  {/* Register link */}
                  <div className="pt-1 text-center text-xs text-slate-600 dark:text-slate-300">
                    {!isStaff ? (
                      <p>
                        {t('auth.newHere', 'New here?')}{' '}
                        <Link
                          to="/register"
                          className="font-semibold text-primary-600 transition-colors hover:text-primary-700 hover:underline dark:text-sky-300 dark:hover:text-sky-200"
                        >
                          {t('auth.createAccount', 'Create an account')}
                        </Link>
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        {t('auth.staffAccountNote', 'Staff accounts are managed by Conference Administrators.')}
                      </p>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Copyright Notice */}
        <p className="mt-3 text-center text-xs text-slate-400 dark:text-slate-300">
          © 2026 CampCoordAI • {t('header.unionName', 'Rwanda Union Mission')} • {t('common.allRightsReserved', 'All rights reserved')}
        </p>
      </div>

    </div>
  );
}
