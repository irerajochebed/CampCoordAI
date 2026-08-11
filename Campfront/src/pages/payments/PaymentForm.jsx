import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { paymentApi, registrationApi } from '../../api';
import { 
  ArrowLeft,
  Save,
  DollarSign,
  Upload,
  CreditCard,
  FileText,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Alert from '../../components/ui/Alert';
import { PageSpinner } from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';

export default function PaymentForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [registrations, setRegistrations] = useState([]);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  
  const [formData, setFormData] = useState({
    registrationId: '',
    amount: '',
    paymentMethod: 'MOBILE_MONEY',
    transactionReference: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchPendingRegistrations();
  }, []);

  const fetchPendingRegistrations = async () => {
    try {
      setLoading(true);
      // Get user's registrations that need payment
      const response = await registrationApi.getMyRegistrations();
      if (response.data.success) {
        // Filter registrations that are PENDING or PAYMENT_SUBMITTED (need payment or resubmission)
        const needsPayment = (response.data.data || []).filter(reg => 
          reg.status === 'PENDING' || reg.status === 'PAYMENT_SUBMITTED'
        );
        setRegistrations(needsPayment);
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
      setAlert({
        type: 'error',
        message: 'Failed to fetch your registrations'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrationChange = (e) => {
    const regId = e.target.value;
    setFormData(prev => ({ ...prev, registrationId: regId }));
    
    // Find and set selected registration
    const registration = registrations.find(r => r.id.toString() === regId);
    setSelectedRegistration(registration || null);
    
    // Auto-fill amount with registration fee
    if (registration?.event?.registrationFee) {
      setFormData(prev => ({ ...prev, amount: registration.event.registrationFee.toString() }));
    }
    
    // Clear registration error
    if (errors.registrationId) {
      setErrors(prev => ({ ...prev, registrationId: '' }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        setAlert({ 
          type: 'error', 
          message: 'Please upload a valid image (JPEG, PNG, GIF) or PDF file' 
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setAlert({ 
          type: 'error', 
          message: 'File size must be less than 5MB' 
        });
        return;
      }

      setReceiptFile(file);
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setReceiptPreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setReceiptPreview(null);
      }
      
      // Clear file error
      if (errors.receiptFile) {
        setErrors(prev => ({ ...prev, receiptFile: '' }));
      }
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.registrationId) {
      newErrors.registrationId = 'Please select a registration';
    }

    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else if (parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than zero';
    }

    if (!formData.transactionReference.trim()) {
      newErrors.transactionReference = 'Transaction reference is required';
    }

    if (!receiptFile) {
      newErrors.receiptFile = 'Please upload a payment receipt';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      setAlert({ type: 'error', message: 'Please fill in all required fields correctly' });
      return;
    }

    setSubmitting(true);
    try {
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('registrationId', formData.registrationId);
      submitData.append('amount', formData.amount);
      submitData.append('paymentMethod', formData.paymentMethod);
      submitData.append('transactionReference', formData.transactionReference.trim());
      if (formData.notes.trim()) {
        submitData.append('notes', formData.notes.trim());
      }
      if (receiptFile) {
        submitData.append('receipt', receiptFile);
      }

      const response = await paymentApi.submit(submitData);

      if (response.data.success) {
        setAlert({
          type: 'success',
          message: 'Payment submitted successfully! Your payment will be verified by the event coordinator.'
        });
        
        // Redirect to payment detail after 2 seconds
        setTimeout(() => {
          navigate(`/payments/${response.data.data.id}`);
        }, 2000);
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to submit payment'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const paymentMethodOptions = [
    { value: 'MOBILE_MONEY', label: 'Mobile Money (MTN/Airtel)' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
    { value: 'CASH', label: 'Cash' },
    { value: 'CREDIT_CARD', label: 'Credit/Debit Card' },
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  if (loading) {
    return <PageSpinner message="Loading registrations..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          icon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => navigate('/registrations')}
          className="mb-4"
        >
          Back to Registrations
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Submit Payment</h1>
        <p className="text-gray-600 mt-1">
          Submit proof of payment for your event registration
        </p>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* No Pending Registrations */}
      {registrations.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<DollarSign className="w-12 h-12" />}
              title="No pending payments"
              description="You don't have any registrations that require payment at this time"
              action={
                <Button
                  variant="primary"
                  onClick={() => navigate('/registrations')}
                >
                  View Registrations
                </Button>
              }
            />
          </CardBody>
        </Card>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form - Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Registration Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Select Registration</CardTitle>
                </CardHeader>
                <CardBody>
                  <Select
                    label="Registration"
                    name="registrationId"
                    value={formData.registrationId}
                    onChange={handleRegistrationChange}
                    options={[
                      { value: '', label: 'Select a registration...' },
                      ...registrations.map(reg => ({
                        value: reg.id.toString(),
                        label: `${reg.event.name} - ${formatCurrency(reg.event.registrationFee)}`
                      }))
                    ]}
                    error={errors.registrationId}
                    required
                  />

                  {selectedRegistration && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-2">
                      <div>
                        <p className="text-sm text-gray-600">Event</p>
                        <p className="font-semibold text-gray-900">{selectedRegistration.event.name}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Dates</p>
                          <p className="text-sm text-gray-900">
                            {new Date(selectedRegistration.event.startDate).toLocaleDateString()} - {new Date(selectedRegistration.event.endDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Registration Fee</p>
                          <p className="text-lg font-bold text-gray-900">
                            {formatCurrency(selectedRegistration.event.registrationFee)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Payment Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Details</CardTitle>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    <Input
                      label="Amount (RWF)"
                      name="amount"
                      type="number"
                      value={formData.amount}
                      onChange={handleChange}
                      error={errors.amount}
                      required
                      placeholder="Enter amount in Rwandan Francs"
                      min="0"
                      step="100"
                      icon={<DollarSign className="w-5 h-5" />}
                    />

                    <Select
                      label="Payment Method"
                      name="paymentMethod"
                      value={formData.paymentMethod}
                      onChange={handleChange}
                      options={paymentMethodOptions}
                      required
                      icon={<CreditCard className="w-5 h-5" />}
                    />

                    <Input
                      label="Transaction Reference"
                      name="transactionReference"
                      value={formData.transactionReference}
                      onChange={handleChange}
                      error={errors.transactionReference}
                      required
                      placeholder="e.g., MTN-123456789, Bank Ref, Receipt No"
                      icon={<FileText className="w-5 h-5" />}
                    />

                    <Textarea
                      label="Additional Notes (Optional)"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Any additional information about your payment..."
                    />
                  </div>
                </CardBody>
              </Card>

              {/* Receipt Upload */}
              <Card>
                <CardHeader>
                  <CardTitle>Upload Receipt</CardTitle>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Receipt <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-2 text-gray-400" />
                            <p className="mb-2 text-sm text-gray-500">
                              <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-gray-500">PNG, JPG, GIF or PDF (MAX. 5MB)</p>
                          </div>
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*,.pdf"
                            onChange={handleFileChange}
                          />
                        </label>
                      </div>
                      {errors.receiptFile && (
                        <p className="text-sm text-red-600 mt-1">{errors.receiptFile}</p>
                      )}
                    </div>

                    {receiptFile && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{receiptFile.name}</p>
                              <p className="text-xs text-gray-500">
                                {(receiptFile.size / 1024).toFixed(2)} KB
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setReceiptFile(null);
                              setReceiptPreview(null);
                            }}
                          >
                            Remove
                          </Button>
                        </div>

                        {receiptPreview && (
                          <div className="mt-3">
                            <img 
                              src={receiptPreview} 
                              alt="Receipt preview" 
                              className="w-full h-auto rounded border border-gray-200"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-900">Important</p>
                          <p className="text-xs text-blue-700 mt-1">
                            Please ensure your receipt clearly shows the transaction reference, amount, 
                            and date. This will help us verify your payment quickly.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate('/registrations')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  icon={<Save className="w-4 h-4" />}
                  loading={submitting}
                  disabled={!formData.registrationId}
                >
                  Submit Payment
                </Button>
              </div>
            </div>

            {/* Sidebar - Right Column */}
            <div className="space-y-6">
              {/* Payment Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Instructions</CardTitle>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                        1
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Make Payment</p>
                        <p className="text-sm text-gray-600">
                          Pay using your preferred method (Mobile Money, Bank, Cash)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                        2
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Get Receipt</p>
                        <p className="text-sm text-gray-600">
                          Take a screenshot or photo of your payment confirmation
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                        3
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Submit Details</p>
                        <p className="text-sm text-gray-600">
                          Fill in the form with your payment information and upload receipt
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                        4
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Wait for Verification</p>
                        <p className="text-sm text-gray-600">
                          Event coordinators will verify your payment within 24-48 hours
                        </p>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Important Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Important Notes</CardTitle>
                </CardHeader>
                <CardBody>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-700">
                        All amounts are in Rwandan Francs (RWF)
                      </p>
                    </div>

                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-700">
                        Upload a clear image of your payment receipt
                      </p>
                    </div>

                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-700">
                        Include the transaction reference number
                      </p>
                    </div>

                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-700">
                        Payment verification may take 24-48 hours
                      </p>
                    </div>

                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-700">
                        You'll receive a notification once verified
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
