import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { paymentApi, registrationApi } from '../../api';
import { 
  ArrowLeft,
  DollarSign,
  Upload,
  CreditCard,
  FileText,
  AlertCircle,
  CheckCircle,
  Smartphone,
  ShieldCheck,
  QrCode,
  ArrowRight,
  Lock,
  Sparkles,
  RefreshCw,
  Building2,
  Calendar,
  User,
  CheckCircle2,
  X
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Alert from '../../components/ui/Alert';
import Badge from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';

export default function PaymentForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paramRegId = searchParams.get('registrationId');
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('momo'); // 'momo' | 'manual'
  const [registrations, setRegistrations] = useState([]);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);

  // Mobile Money State
  const [momoPhone, setMomoPhone] = useState(user?.phoneNumber || user?.phone || '');
  const [momoProvider, setMomoProvider] = useState('MTN');
  const [momoStep, setMomoStep] = useState('INIT'); // 'INIT' | 'USSD_PROMPT' | 'SUCCESS'
  const [momoPin, setMomoPin] = useState('');
  const [momoInitiateData, setMomoInitiateData] = useState(null);
  const [verifiedPaymentData, setVerifiedPaymentData] = useState(null);

  // Manual Receipt State
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [manualFormData, setManualFormData] = useState({
    amount: '',
    paymentMethod: 'BANK_TRANSFER',
    transactionReference: '',
    notes: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchPendingRegistrations();
  }, []);

  // Detect Mobile Network Operator from Rwandan phone number
  useEffect(() => {
    const clean = momoPhone.replace(/[^0-9]/g, '');
    if (clean.includes('78') || clean.includes('79') || clean.startsWith('078') || clean.startsWith('079')) {
      setMomoProvider('MTN');
    } else if (clean.includes('72') || clean.includes('73') || clean.startsWith('072') || clean.startsWith('073')) {
      setMomoProvider('AIRTEL');
    }
  }, [momoPhone]);

  const fetchPendingRegistrations = async () => {
    try {
      setLoading(true);
      const response = await registrationApi.getMyRegistrations();
      let list = [];
      if (response.data.success) {
        list = (response.data.data || []).filter(reg => 
          reg.status === 'PENDING' || reg.status === 'PAYMENT_SUBMITTED'
        );
      }

      // If paramRegId is specified and not in the list, fetch it directly
      if (paramRegId && !list.some(r => r.id.toString() === paramRegId.toString())) {
        try {
          const directRes = await registrationApi.getById(paramRegId);
          if (directRes.data.success) {
            list.unshift(directRes.data.data);
          }
        } catch (e) {
          console.error('Error fetching direct registration:', e);
        }
      }

      setRegistrations(list);

      // Auto-select if paramRegId exists or default to first
      const target = paramRegId 
        ? list.find(r => r.id.toString() === paramRegId.toString())
        : (list.length > 0 ? list[0] : null);

      if (target) {
        setSelectedRegistration(target);
        const fee = target.event?.registrationFee || target.eventRegistrationFee || 0;
        setManualFormData(prev => ({
          ...prev,
          amount: fee ? fee.toString() : ''
        }));
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
      setAlert({
        type: 'error',
        message: 'Failed to fetch your event registrations.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrationSelect = (regId) => {
    const reg = registrations.find(r => r.id.toString() === regId.toString());
    setSelectedRegistration(reg || null);
    setMomoStep('INIT');
    setMomoInitiateData(null);
    setAlert(null);

    const fee = reg?.event?.registrationFee || reg?.eventRegistrationFee || 0;
    setManualFormData(prev => ({
      ...prev,
      amount: fee ? fee.toString() : ''
    }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  // ========================================================
  // 1. FREE MOBILE MONEY PAYMENT FLOW (MTN MoMo & Airtel)
  // ========================================================
  const handleInitiateMomo = async (e) => {
    e?.preventDefault();
    if (!selectedRegistration) {
      setAlert({ type: 'error', message: 'Please select an event registration first.' });
      return;
    }

    const cleanPhone = momoPhone.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 9) {
      setAlert({ type: 'error', message: 'Please enter a valid Rwandan phone number (e.g. 0788123456).' });
      return;
    }

    const fee = selectedRegistration.event?.registrationFee || selectedRegistration.eventRegistrationFee || 0;
    if (fee <= 0) {
      setAlert({ type: 'info', message: 'This is a free event. No payment is required.' });
      return;
    }

    setSubmitting(true);
    setAlert(null);

    try {
      const payload = {
        registrationId: selectedRegistration.id,
        phoneNumber: cleanPhone,
        amount: parseFloat(fee),
        provider: momoProvider,
        paymentMethod: 'MOBILE_MONEY'
      };

      const response = await paymentApi.initiateMomo(payload);
      if (response.data.success) {
        setMomoInitiateData(response.data.data);
        setMomoStep('USSD_PROMPT');
      } else {
        setAlert({
          type: 'error',
          message: response.data.message || 'Failed to initiate Mobile Money request.'
        });
      }
    } catch (err) {
      console.error('MoMo Initiate Error:', err);
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Failed to connect to Mobile Money Gateway.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmMomoPayment = async () => {
    if (!momoInitiateData) return;

    setSubmitting(true);
    setAlert(null);

    try {
      const payload = {
        transactionReference: momoInitiateData.transactionReference,
        momoPin: momoPin.trim() || '1234',
        approved: true
      };

      const response = await paymentApi.verifyMomo(payload);
      if (response.data.success) {
        setVerifiedPaymentData(response.data.data);
        setMomoStep('SUCCESS');
      } else {
        setAlert({
          type: 'error',
          message: response.data.message || 'Mobile Money payment authorization was rejected.'
        });
      }
    } catch (err) {
      console.error('MoMo Verification Error:', err);
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Payment confirmation failed. Please try again.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ========================================================
  // 2. MANUAL RECEIPT / BANK SLIP UPLOAD FLOW
  // ========================================================
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        setAlert({ type: 'error', message: 'Please upload a valid image (JPEG, PNG, WEBP) or PDF file.' });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setAlert({ type: 'error', message: 'Receipt file size must be less than 5MB.' });
        return;
      }

      setReceiptFile(file);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setReceiptPreview(reader.result);
        reader.readAsDataURL(file);
      } else {
        setReceiptPreview(null);
      }
      if (errors.receiptFile) {
        setErrors(prev => ({ ...prev, receiptFile: '' }));
      }
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRegistration) {
      setAlert({ type: 'error', message: 'Please select an event registration.' });
      return;
    }
    if (!manualFormData.transactionReference.trim()) {
      setErrors(prev => ({ ...prev, transactionReference: 'Transaction / Receipt reference is required.' }));
      return;
    }

    setSubmitting(true);
    setAlert(null);

    try {
      const payload = {
        registrationId: selectedRegistration.id,
        amount: parseFloat(manualFormData.amount),
        paymentMethod: manualFormData.paymentMethod,
        transactionReference: manualFormData.transactionReference.trim(),
        notes: manualFormData.notes.trim() || null,
        receiptUrl: receiptPreview || null
      };

      const response = await paymentApi.submit(payload);
      if (response.data.success) {
        setAlert({
          type: 'success',
          message: 'Payment proof submitted successfully! The event coordinator will review and confirm your registration.'
        });
        setTimeout(() => {
          navigate(`/app/registrations/${selectedRegistration.id}`);
        }, 1800);
      }
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Failed to submit payment receipt.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <PageSpinner message="Loading payment portal..." />;
  }

  const currentFee = selectedRegistration?.event?.registrationFee || selectedRegistration?.eventRegistrationFee || 0;
  const currentEventName = selectedRegistration?.event?.name || selectedRegistration?.eventName || 'Selected Event';

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Button
            variant="ghost"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate('/app/registrations')}
            className="mb-2"
          >
            Back to Registrations
          </Button>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <DollarSign className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            Registration Payment & Ticket Confirmation
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Complete your camp meeting registration payment to instantly receive your official entry QR ticket.
          </p>
        </div>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {registrations.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<CheckCircle className="w-12 h-12 text-emerald-500" />}
              title="No pending payments found"
              description="All your event registrations are up to date or already confirmed."
              action={
                <Button
                  variant="primary"
                  onClick={() => navigate('/app/registrations')}
                >
                  View My Registrations
                </Button>
              }
            />
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Payment Container (Left 2 Columns) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Step 1: Select Event Registration Card */}
            <div className="card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary-600 text-white text-xs flex items-center justify-center font-bold">1</span>
                  Select Event Registration
                </h3>
                {selectedRegistration && (
                  <Badge variant={selectedRegistration.status === 'PENDING' ? 'warning' : 'info'}>
                    Status: {selectedRegistration.status}
                  </Badge>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Registered Event & Fee <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedRegistration?.id || ''}
                  onChange={(e) => handleRegistrationSelect(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-primary-500 shadow-xs"
                >
                  {registrations.map((reg) => {
                    const fee = reg.event?.registrationFee || reg.eventRegistrationFee || 0;
                    return (
                      <option key={reg.id} value={reg.id}>
                        {reg.event?.name || reg.eventName} &mdash; {fee > 0 ? formatCurrency(fee) : 'Free'} (Ref: {reg.registrationNumber || `#${reg.id}`})
                      </option>
                    );
                  })}
                </select>
              </div>

              {selectedRegistration && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white text-base">
                        {currentEventName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(selectedRegistration.event?.startDate || selectedRegistration.eventStartDate).toLocaleDateString()} &rarr; {new Date(selectedRegistration.event?.endDate || selectedRegistration.eventEndDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Required Fee</p>
                      <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(currentFee)}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-slate-200/80 dark:border-slate-700 pt-2 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                    <span>Participant: <strong>{selectedRegistration.participantName || user?.firstName + ' ' + user?.lastName}</strong></span>
                    <span className="font-mono">Reg #: <strong>{selectedRegistration.registrationNumber || `#${selectedRegistration.id}`}</strong></span>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Payment Gateway Options */}
            <div className="card overflow-hidden">
              {/* Payment Method Selector Tabs */}
              <div className="grid grid-cols-2 border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/40 p-1.5 gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('momo')}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                    activeTab === 'momo'
                      ? 'bg-white dark:bg-slate-900 text-primary-700 dark:text-primary-400 shadow-sm border border-slate-200/60 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Instant Mobile Money (MoMo)</span>
                  <span className="hidden sm:inline-block text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                    Fast & Free
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('manual')}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                    activeTab === 'manual'
                      ? 'bg-white dark:bg-slate-900 text-primary-700 dark:text-primary-400 shadow-sm border border-slate-200/60 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Upload className="w-4 h-4 text-slate-500" />
                  <span>Upload Bank Slip / Receipt</span>
                </button>
              </div>

              <div className="p-6">
                {/* ----------------- TAB A: FREE MOBILE MONEY (MTN & AIRTEL) ----------------- */}
                {activeTab === 'momo' && (
                  <div className="space-y-6">
                    {/* STATE 1: PHONE INPUT & REVIEW */}
                    {momoStep === 'INIT' && (
                      <form onSubmit={handleInitiateMomo} className="space-y-5">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                          <div>
                            <h4 className="font-bold text-slate-900 dark:text-white text-base">
                              Pay with Mobile Money (MTN / Airtel Rwanda)
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              Enter your registered Mobile Money phone number to receive an automated payment prompt.
                            </p>
                          </div>
                          {/* Operator Badge */}
                          <div className={`px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase flex items-center gap-1.5 ${
                            momoProvider === 'MTN'
                              ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                              : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                          }`}>
                            <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
                            {momoProvider} MoMo
                          </div>
                        </div>

                        {/* Phone Number Input */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                            Mobile Money Phone Number <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="tel"
                              required
                              value={momoPhone}
                              onChange={(e) => setMomoPhone(e.target.value)}
                              placeholder="0788123456 or 0738123456"
                              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-xl text-base font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-xs outline-none transition"
                            />
                            <Smartphone className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            Supported: MTN Mobile Money (078/079) & Airtel Money (072/073).
                          </p>
                        </div>

                        {/* Summary Box */}
                        <div className="bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/40 rounded-xl p-4 flex items-center justify-between">
                          <div className="space-y-0.5">
                            <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">Total Charge to Phone</p>
                            <p className="text-xs text-emerald-700/80 dark:text-emerald-400">0% Gateway Fee (Free MoMo Integration)</p>
                          </div>
                          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                            {formatCurrency(currentFee)}
                          </p>
                        </div>

                        <Button
                          type="submit"
                          variant="primary"
                          loading={submitting}
                          disabled={submitting || !selectedRegistration}
                          className="w-full py-3 text-base font-bold shadow-md bg-emerald-600 hover:bg-emerald-700 text-white"
                          icon={<ArrowRight className="w-5 h-5" />}
                        >
                          Send MoMo Payment Prompt
                        </Button>
                      </form>
                    )}

                    {/* STATE 2: INTERACTIVE USSD PUSH SIMULATOR */}
                    {momoStep === 'USSD_PROMPT' && momoInitiateData && (
                      <div className="space-y-6 animate-scaleUp">
                        {/* Simulated Phone Notification Modal Screen */}
                        <div className="bg-slate-900 text-white rounded-2xl p-6 border-2 border-slate-700 shadow-xl space-y-5 relative overflow-hidden">
                          {/* Top Glow */}
                          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 via-emerald-400 to-primary-500"></div>

                          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                            <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></span>
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                                {momoInitiateData.provider} MoMo Payment Request
                              </span>
                            </div>
                            <span className="text-xs font-mono text-slate-400">
                              Ref: {momoInitiateData.transactionReference}
                            </span>
                          </div>

                          <div className="text-center py-2 space-y-2">
                            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center font-bold">
                              <Smartphone className="w-6 h-6 animate-bounce" />
                            </div>
                            <h3 className="text-lg font-extrabold text-white">
                              Confirming Payment to Rwanda Union Mission
                            </h3>
                            <p className="text-xs text-slate-300 max-w-md mx-auto">
                              Prompt sent to <strong className="text-white font-mono">{momoInitiateData.phoneNumber}</strong> for <strong className="text-emerald-400">{formatCurrency(momoInitiateData.amount)}</strong>.
                            </p>
                          </div>

                          {/* USSD Box */}
                          <div className="bg-slate-800/90 rounded-xl p-4 border border-slate-700 space-y-3">
                            <div className="flex items-center justify-between text-xs text-slate-400">
                              <span>Event: <strong className="text-white">{momoInitiateData.eventName}</strong></span>
                              <span>Dial: <strong className="text-amber-400 font-mono">{momoInitiateData.ussdInstruction}</strong></span>
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                                Enter MoMo PIN (Sandbox Simulation)
                              </label>
                              <div className="relative">
                                <input
                                  type="password"
                                  maxLength={4}
                                  value={momoPin}
                                  onChange={(e) => setMomoPin(e.target.value)}
                                  placeholder="•••• (e.g. 1234)"
                                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white font-mono tracking-widest text-center text-lg focus:border-emerald-500 outline-none"
                                />
                                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 pt-2">
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => setMomoStep('INIT')}
                              disabled={submitting}
                              className="text-slate-400 hover:text-white"
                            >
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              variant="primary"
                              loading={submitting}
                              onClick={handleConfirmMomoPayment}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 shadow-lg"
                              icon={<CheckCircle2 className="w-4 h-4" />}
                            >
                              Authorize & Confirm Payment
                            </Button>
                          </div>
                        </div>

                        <p className="text-xs text-center text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-emerald-600" />
                          Testing with Free Developer Sandbox Mode. Click "Authorize" to simulate instant payment verification.
                        </p>
                      </div>
                    )}

                    {/* STATE 3: SUCCESS & TICKET UNLOCKED */}
                    {momoStep === 'SUCCESS' && (
                      <div className="bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500 rounded-2xl p-6 text-center space-y-4 animate-scaleUp">
                        <div className="w-16 h-16 rounded-full bg-emerald-600 text-white mx-auto flex items-center justify-center shadow-lg">
                          <CheckCircle2 className="w-9 h-9" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-emerald-950 dark:text-emerald-200">
                            Payment Verified & Registration Confirmed!
                          </h3>
                          <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-1 max-w-md mx-auto">
                            Your payment of <strong>{formatCurrency(currentFee)}</strong> has been verified successfully. Your official entrance QR code ticket is now ready.
                          </p>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-emerald-200 dark:border-emerald-800 text-xs font-mono text-slate-700 dark:text-slate-300 max-w-sm mx-auto space-y-1">
                          <div>Transaction Ref: <strong>{verifiedPaymentData?.transactionReference || momoInitiateData?.transactionReference}</strong></div>
                          <div>Status: <strong className="text-emerald-600">CONFIRMED (VERIFIED)</strong></div>
                        </div>

                        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                          <Button
                            variant="primary"
                            icon={<QrCode className="w-4 h-4" />}
                            onClick={() => navigate(`/app/registrations/${selectedRegistration.id}`)}
                            className="w-full sm:w-auto px-6 py-2.5 font-bold shadow-md"
                          >
                            View & Download QR Ticket
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => navigate('/app/registrations')}
                            className="w-full sm:w-auto"
                          >
                            Go to My Registrations
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ----------------- TAB B: MANUAL RECEIPT UPLOAD ----------------- */}
                {activeTab === 'manual' && (
                  <form onSubmit={handleManualSubmit} className="space-y-4">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-base">
                        Submit Bank Deposit or Cash Slip
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        If you paid via Bank Transfer (e.g. Bank of Kigali, Equity) or cash at church, upload the receipt for verification.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Amount (RWF)"
                        name="amount"
                        type="number"
                        value={manualFormData.amount}
                        onChange={(e) => setManualFormData({ ...manualFormData, amount: e.target.value })}
                        required
                        icon={<DollarSign className="w-4 h-4" />}
                      />

                      <Select
                        label="Payment Method"
                        name="paymentMethod"
                        value={manualFormData.paymentMethod}
                        onChange={(e) => setManualFormData({ ...manualFormData, paymentMethod: e.target.value })}
                        options={[
                          { value: 'BANK_TRANSFER', label: 'Bank Transfer / Deposit' },
                          { value: 'CASH', label: 'Cash at Local Church / Office' },
                          { value: 'CHURCH_COLLECTION', label: 'Church Group Collection' }
                        ]}
                        required
                      />
                    </div>

                    <Input
                      label="Transaction / Bank Reference Number"
                      name="transactionReference"
                      value={manualFormData.transactionReference}
                      onChange={(e) => {
                        setManualFormData({ ...manualFormData, transactionReference: e.target.value });
                        if (errors.transactionReference) setErrors(prev => ({ ...prev, transactionReference: '' }));
                      }}
                      error={errors.transactionReference}
                      required
                      placeholder="e.g. BK-DEP-12345678, SLIP-9876"
                      icon={<FileText className="w-4 h-4" />}
                    />

                    {/* Receipt Upload Box */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Upload Receipt Proof (Image or PDF)
                      </label>
                      <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-slate-300 dark:border-slate-700 border-dashed rounded-xl cursor-pointer bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                          <div className="flex flex-col items-center justify-center pt-3 pb-4">
                            <Upload className="w-6 h-6 mb-1.5 text-slate-400" />
                            <p className="text-xs text-slate-600 dark:text-slate-300">
                              <span className="font-semibold text-primary-600 dark:text-primary-400">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-[11px] text-slate-400">JPG, PNG, WEBP, or PDF (Max 5MB)</p>
                          </div>
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*,.pdf"
                            onChange={handleFileChange}
                          />
                        </label>
                      </div>

                      {receiptFile && (
                        <div className="mt-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-800 dark:text-slate-200">{receiptFile.name}</span>
                          <button
                            type="button"
                            onClick={() => { setReceiptFile(null); setReceiptPreview(null); }}
                            className="text-rose-500 hover:underline font-semibold"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>

                    <Textarea
                      label="Additional Notes (Optional)"
                      name="notes"
                      value={manualFormData.notes}
                      onChange={(e) => setManualFormData({ ...manualFormData, notes: e.target.value })}
                      rows={2}
                      placeholder="Any relevant deposit details or remarks..."
                    />

                    <Button
                      type="submit"
                      variant="primary"
                      loading={submitting}
                      disabled={submitting || !selectedRegistration}
                      className="w-full py-2.5 font-bold"
                    >
                      Submit Receipt for Review
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar: Instructions & Trust Badges */}
          <div className="space-y-6">
            {/* Quick Process Card */}
            <div className="card p-5 space-y-4">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                How It Works
              </h4>

              <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center shrink-0">1</span>
                  <span>Select your event registration and verify the registration fee.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center shrink-0">2</span>
                  <span>Enter your MTN or Airtel Mobile Money phone number.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center shrink-0">3</span>
                  <span>Confirm the automated USSD push prompt on your phone by entering your PIN.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center shrink-0">4</span>
                  <span>Your registration is instantly <strong>CONFIRMED</strong> and your entrance <strong>QR Code Badge</strong> is generated!</span>
                </div>
              </div>
            </div>

            {/* Official Rwanda Adventist Network */}
            <div className="card p-5 bg-primary-50/50 dark:bg-primary-950/20 border-primary-200 dark:border-primary-800/60 space-y-3 text-xs">
              <div className="flex items-center gap-2 font-bold text-primary-900 dark:text-primary-300">
                <Building2 className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                <span>Rwanda Union Mission (RUM)</span>
              </div>
              <p className="text-primary-800/80 dark:text-primary-300/80 leading-relaxed">
                Official camp event collections are securely routed to the Seventh-day Adventist Church conference treasury across all 8 fields.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
