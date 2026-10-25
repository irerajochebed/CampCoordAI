import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { getUserDisplayRole, getImageUrl } from '../../utils/userRoleHelper';
import { userApi, authApi } from '../../api';
import {
  User,
  Mail,
  Phone,
  Lock,
  Building2,
  ShieldCheck,
  Calendar,
  Globe,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Save,
  KeyRound,
  MapPin,
  Layers,
  Camera,
  Upload,
  Trash2
} from 'lucide-react';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';

export default function UserProfile() {
  const { user, updateUser } = useAuth();
  const { t, language, setLanguage } = useTranslation();
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'security' | 'organization'
  const [initialLoading, setInitialLoading] = useState(true);

  // Profile Form State (populated directly from DB)
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    gender: '',
    dateOfBirth: '',
    preferredLanguage: 'en',
    governmentDistrict: '',
    sdaDistrict: '',
    profileImageUrl: ''
  });

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');

  // Password Form State
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState('');
  const [passwordErrorMsg, setPasswordErrorMsg] = useState('');

  // 1. Fetch fresh user details directly from database on mount
  useEffect(() => {
    const fetchLatestProfileFromDb = async () => {
      setInitialLoading(true);
      try {
        const res = await authApi.getCurrentUser();
        const dbUser = res.data?.data || res.data;
        if (dbUser) {
          updateUser(dbUser);
          setProfileForm({
            firstName: dbUser.firstName || '',
            lastName: dbUser.lastName || '',
            email: dbUser.email || '',
            phoneNumber: dbUser.phoneNumber || '',
            gender: dbUser.gender || '',
            dateOfBirth: dbUser.dateOfBirth || '',
            preferredLanguage: dbUser.preferredLanguage || language || 'en',
            governmentDistrict: dbUser.governmentDistrict || '',
            sdaDistrict: dbUser.sdaDistrict || '',
            profileImageUrl: dbUser.profileImageUrl || ''
          });
        }
      } catch (err) {
        console.error('Failed to fetch user from DB:', err);
        // Fallback to auth context if network fails
        if (user) {
          setProfileForm({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
            phoneNumber: user.phoneNumber || '',
            gender: user.gender || '',
            dateOfBirth: user.dateOfBirth || '',
            preferredLanguage: user.preferredLanguage || language || 'en',
            governmentDistrict: user.governmentDistrict || '',
            sdaDistrict: user.sdaDistrict || '',
            profileImageUrl: user.profileImageUrl || ''
          });
        }
      } finally {
        setInitialLoading(false);
      }
    };

    fetchLatestProfileFromDb();
  }, []);

  const displayRole = getUserDisplayRole(user, t);
  const fullName = [profileForm.firstName, profileForm.lastName].filter(Boolean).join(' ') || user?.email || 'User';
  const cardAvatarUrl = getImageUrl(profileForm.profileImageUrl || user?.profileImageUrl);

  // Handle Image File Selection from PC Folder (Auto-save & Instant Preview)
  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProfileErrorMsg('Please select a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setProfileErrorMsg('Image size should be less than 10MB.');
      return;
    }

    // 1. Instant local preview
    const previewBlobUrl = URL.createObjectURL(file);
    setProfileForm((prev) => ({ ...prev, profileImageUrl: previewBlobUrl }));
    updateUser({ profileImageUrl: previewBlobUrl });

    // 2. Upload file via multipart/form-data to server
    const formData = new FormData();
    formData.append('file', file);

    const userId = user?.id || user?.userId;

    try {
      const res = await userApi.uploadAvatar(formData, userId);
      const updatedUser = res.data?.data || res.data;
      if (updatedUser?.profileImageUrl) {
        const fullServerUrl = getImageUrl(updatedUser.profileImageUrl);
        setProfileForm((prev) => ({ ...prev, profileImageUrl: fullServerUrl }));
        updateUser({ ...updatedUser, profileImageUrl: fullServerUrl });
      }
      setProfileSuccessMsg('Profile picture updated and saved automatically!');
      setTimeout(() => setProfileSuccessMsg(''), 4000);
    } catch (uploadErr) {
      console.warn('Multipart upload failed, falling back to base64 canvas:', uploadErr);
      // Fallback to canvas base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const maxDim = 250;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const base64 = canvas.toDataURL('image/jpeg', 0.8);
          setProfileForm((prev) => ({ ...prev, profileImageUrl: base64 }));
          updateUser({ profileImageUrl: base64 });

          try {
            if (userId) {
              await userApi.update(userId, { profileImageUrl: base64 });
            } else {
              await userApi.updateMyProfile({ profileImageUrl: base64 });
            }
            setProfileSuccessMsg('Profile picture updated successfully!');
          } catch (e2) {
            console.error('Base64 save failed:', e2);
          }
          setTimeout(() => setProfileSuccessMsg(''), 4000);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = async () => {
    setProfileForm((prev) => ({ ...prev, profileImageUrl: '' }));
    updateUser({ profileImageUrl: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    try {
      const userId = user?.id || user?.userId;
      if (userId) {
        await userApi.update(userId, { profileImageUrl: '' });
      } else {
        await userApi.updateMyProfile({ profileImageUrl: '' });
      }
      setProfileSuccessMsg('Profile picture removed.');
    } catch (e) {}
    setTimeout(() => setProfileSuccessMsg(''), 4000);
  };

  // Handle Profile Form Submit
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoadingProfile(true);
    if (profileForm.dateOfBirth) {
      const dob = new Date(profileForm.dateOfBirth);
      const today = new Date();
      if (dob > today) {
        setProfileErrorMsg(t('profile.dateOfBirthFuture', 'Date of birth cannot be in the future.'));
        setLoadingProfile(false);
        return;
      }
    }

    try {
      const payload = {
        firstName: profileForm.firstName.trim(),
        lastName: profileForm.lastName.trim(),
        email: profileForm.email.trim(),
        phoneNumber: profileForm.phoneNumber ? profileForm.phoneNumber.trim() : null,
        gender: profileForm.gender || null,
        dateOfBirth: profileForm.dateOfBirth || null,
        preferredLanguage: profileForm.preferredLanguage || 'en',
        governmentDistrict: profileForm.governmentDistrict || null,
        sdaDistrict: profileForm.sdaDistrict || null,
        profileImageUrl: profileForm.profileImageUrl || null
      };

      const userId = user?.id || user?.userId;
      let res;
      if (userId) {
        res = await userApi.update(userId, payload);
      } else {
        res = await userApi.updateMyProfile(payload);
      }
      const updatedData = res.data?.data || payload;

      // Sync updated user data into AuthContext and localStorage
      updateUser({ ...updatedData, profileImageUrl: payload.profileImageUrl });

      // If preferred language changed, update active language
      if (payload.preferredLanguage && payload.preferredLanguage !== language) {
        setLanguage(payload.preferredLanguage);
      }

      setProfileSuccessMsg(t('profile.profileUpdatedSuccess', 'Profile updated successfully!'));
      setTimeout(() => setProfileSuccessMsg(''), 5000);
    } catch (err) {
      console.error('Failed to update profile:', err);
      const errorMsg =
        err.response?.data?.message ||
        t('profile.profileUpdatedError', 'Failed to update profile. Please check your inputs.');
      setProfileErrorMsg(errorMsg);
    } finally {
      setLoadingProfile(false);
    }
  };

  // Handle Password Change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordSuccessMsg('');
    setPasswordErrorMsg('');

    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordErrorMsg(t('profile.passwordEmpty', 'Please fill in all password fields.'));
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordErrorMsg(t('profile.passwordRequirements', 'New password must be at least 6 characters long.'));
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordErrorMsg(t('profile.passwordMismatch', 'New passwords do not match.'));
      return;
    }

    setLoadingPassword(true);

    try {
      await authApi.changePassword({
        userId: user?.id,
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      });

      setPasswordSuccessMsg(t('profile.passwordChangedSuccess', 'Password updated successfully!'));
      setPasswordForm({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setTimeout(() => setPasswordSuccessMsg(''), 5000);
    } catch (err) {
      console.error('Failed to change password:', err);
      const msg =
        err.response?.data?.message ||
        t('profile.passwordChangedError', 'Failed to change password. Verify your current password.');
      setPasswordErrorMsg(msg);
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Hidden File Input for PC Image Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageFileChange}
        accept="image/png,image/jpeg,image/jpg,image/webp"
        className="hidden"
      />

      {/* Top Header Card - Clean, Human, Professional */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-gray-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar with Click-to-Upload & Camera Badge */}
          <div className="relative group shrink-0">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-slate-800 dark:bg-slate-700 text-white font-bold text-2xl flex items-center justify-center overflow-hidden border-2 border-gray-200 dark:border-slate-700 cursor-pointer shadow-sm relative transition hover:opacity-90"
              title="Click to choose picture from your computer"
            >
              {cardAvatarUrl ? (
                <img
                  key={cardAvatarUrl}
                  src={cardAvatarUrl}
                  alt={fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                fullName.charAt(0).toUpperCase() || 'U'
              )}

              {/* Hover overlay with Camera icon */}
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-5 h-5 text-white" />
                <span className="text-[10px] text-white font-medium mt-0.5">Upload</span>
              </div>
            </div>

            {/* Quick action badges below avatar */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-md border-2 border-white dark:border-slate-900 transition"
              title="Choose photo from computer"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* User Info */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {fullName}
              </h1>
              <Badge variant="success" size="sm">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                {t('profile.active', 'Active & Verified')}
              </Badge>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center sm:justify-start gap-1.5">
              <Mail className="w-4 h-4 text-gray-400" />
              <span>{profileForm.email || user?.email}</span>
            </p>

            {/* Badges & Photo Actions */}
            <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <Badge variant="info" size="sm">
                {displayRole}
              </Badge>

              {(user?.organizationUnitName || user?.organization) && (
                <Badge variant="default" size="sm">
                  <Building2 className="w-3 h-3 mr-1 text-gray-500 dark:text-gray-400" />
                  {user?.organizationUnitName || user?.organization}
                </Badge>
              )}

              {user?.departmentName && (
                <Badge variant="default" size="sm">
                  <Layers className="w-3 h-3 mr-1 text-gray-500 dark:text-gray-400" />
                  {user?.departmentName}
                </Badge>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline ml-1"
              >
                <Upload className="w-3 h-3 mr-1" />
                Change Picture
              </button>

              {(profileForm.profileImageUrl || user?.profileImageUrl) && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="inline-flex items-center text-xs font-semibold text-red-500 hover:underline ml-1"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation - Clean Border Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 px-4 shadow-sm">
        <div className="flex space-x-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex items-center gap-2 py-4 font-semibold text-sm border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'details'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>{t('profile.personalDetails', 'Personal Details')}</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 py-4 font-semibold text-sm border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'security'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>{t('profile.security', 'Security & Password')}</span>
          </button>

          <button
            onClick={() => setActiveTab('organization')}
            className={`flex items-center gap-2 py-4 font-semibold text-sm border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'organization'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>{t('profile.organizationDetails', 'Organization & Role')}</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Personal Details */}
      {activeTab === 'details' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 p-6 sm:p-7 space-y-6">
          <div className="border-b border-gray-100 dark:border-slate-800 pb-4">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              {t('profile.personalDetails', 'Personal Information')}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {t('profile.personalDetailsDesc', 'Update your personal details, email address, and preferences')}
            </p>
          </div>

          {profileSuccessMsg && (
            <Alert variant="success" dismissible onDismiss={() => setProfileSuccessMsg('')}>
              {profileSuccessMsg}
            </Alert>
          )}

          {profileErrorMsg && (
            <Alert variant="danger" dismissible onDismiss={() => setProfileErrorMsg('')}>
              {profileErrorMsg}
            </Alert>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* First Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('profile.firstName', 'First Name')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.firstName}
                  onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('profile.lastName', 'Last Name')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.lastName}
                  onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('profile.email', 'Email Address')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  {t('profile.emailHelp', 'Used for system sign-in and notifications.')}
                </p>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('profile.phoneNumber', 'Phone Number')}
                </label>
                <input
                  type="tel"
                  placeholder="0788123456"
                  value={profileForm.phoneNumber}
                  onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('profile.gender', 'Gender')}
                </label>
                <select
                  value={profileForm.gender}
                  onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                >
                  <option value="">-- Select Gender --</option>
                  <option value="MALE">{t('profile.male', 'Male')}</option>
                  <option value="FEMALE">{t('profile.female', 'Female')}</option>
                </select>
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('profile.dateOfBirth', 'Date of Birth')}
                </label>
                <input
                  type="date"
                  max={new Date().toISOString().split('T')[0]}
                  value={profileForm.dateOfBirth}
                  onChange={(e) => setProfileForm({ ...profileForm, dateOfBirth: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
              </div>

              {/* Preferred Language */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('profile.preferredLanguage', 'Preferred Language')}
                </label>
                <select
                  value={profileForm.preferredLanguage}
                  onChange={(e) => setProfileForm({ ...profileForm, preferredLanguage: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                >
                  <option value="en">English (Official)</option>
                  <option value="rw">Kinyarwanda (Ikinyarwanda)</option>
                  <option value="fr">Français (French)</option>
                </select>
              </div>

              {/* SDA District / Zone */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('profile.sdaDistrict', 'SDA District')}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Musanze District, Bukamba District (NRF)"
                  value={profileForm.sdaDistrict}
                  onChange={(e) => setProfileForm({ ...profileForm, sdaDistrict: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <Button type="submit" variant="primary" loading={loadingProfile} className="px-5 py-2 text-sm font-semibold">
                <Save className="w-4 h-4 mr-1.5" />
                {t('profile.saveChanges', 'Save Changes')}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Security & Password */}
      {activeTab === 'security' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 p-6 sm:p-7 space-y-6">
          <div className="border-b border-gray-100 dark:border-slate-800 pb-4">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              {t('profile.security', 'Security & Password Update')}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {t('profile.securityDesc', 'Ensure your account is using a strong and secure password')}
            </p>
          </div>

          {passwordSuccessMsg && (
            <Alert variant="success" dismissible onDismiss={() => setPasswordSuccessMsg('')}>
              {passwordSuccessMsg}
            </Alert>
          )}

          {passwordErrorMsg && (
            <Alert variant="danger" dismissible onDismiss={() => setPasswordErrorMsg('')}>
              {passwordErrorMsg}
            </Alert>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-5 max-w-lg">
            {/* Old Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                {t('profile.currentPassword', 'Current Password')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showOldPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter current password"
                  value={passwordForm.oldPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                  className="w-full px-3.5 pr-10 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                {t('profile.newPassword', 'New Password')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  placeholder="At least 6 characters"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full px-3.5 pr-10 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordForm.newPassword && (
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex-1 h-1 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        passwordForm.newPassword.length < 6
                          ? 'w-1/3 bg-red-500'
                          : passwordForm.newPassword.length < 10
                          ? 'w-2/3 bg-amber-500'
                          : 'w-full bg-emerald-500'
                      }`}
                    ></div>
                  </div>
                  <span className="text-[10px] font-medium text-gray-400">
                    {passwordForm.newPassword.length < 6
                      ? 'Weak'
                      : passwordForm.newPassword.length < 10
                      ? 'Moderate'
                      : 'Strong'}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                {t('profile.confirmNewPassword', 'Confirm New Password')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="Re-type new password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-3.5 pr-10 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">{t('profile.passwordMismatch', 'Passwords do not match')}</p>
              )}
            </div>

            <div className="pt-2">
              <Button type="submit" variant="primary" loading={loadingPassword} className="px-5 py-2 text-sm font-semibold">
                <Lock className="w-4 h-4 mr-1.5" />
                {t('profile.changePassword', 'Update Password')}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 3: Organization & Role Hierarchy */}
      {activeTab === 'organization' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 p-6 sm:p-7 space-y-6">
          <div className="border-b border-gray-100 dark:border-slate-800 pb-4">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              {t('profile.organizationDetails', 'Church Jurisdiction & Roles')}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {t('profile.organizationDetailsDesc', 'Overview of your assigned position and church jurisdiction')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Organization Unit Card */}
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/60 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>{t('profile.orgUnit', 'Organization Unit')}</span>
              </div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {user?.organizationUnitName || user?.organization || 'Rwanda Union Mission (RUM)'}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <Badge variant="default" size="sm">
                  {user?.organizationLevel || 'UNION / FIELD'}
                </Badge>
              </div>
            </div>

            {/* Department Card */}
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/60 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>{t('profile.department', 'Ministry / Department')}</span>
              </div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {user?.departmentName || t('profile.noDepartment', 'General Church Administration')}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user?.departmentName ? 'Assigned Leadership Scope' : 'Direct Church Administration'}
              </p>
            </div>

            {/* Specific Position / Designation */}
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/60 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>{t('profile.position', 'Specific Designation')}</span>
              </div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{displayRole}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Determines specific responsibilities and workflow authority.
              </p>
            </div>

            {/* System Security Role */}
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/60 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>{t('profile.role', 'System Security Role')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="info" size="sm">
                  {t(`roles.${user?.role}`, user?.role || 'User')}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Authorized for {user?.role === 'ADMINISTRATOR' ? 'Full System Governance' : user?.role === 'COORDINATOR' ? 'Event & Proposal Management' : 'Member Registrations & Event Attendance'}.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
