import React, { useState } from 'react';
import { X, AlertCircle, Loader } from 'lucide-react';
import { upgradeSubscription, SubscriptionPlan, createPayment } from '../services/subscriptionService';

interface SubscriptionUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  plan: SubscriptionPlan;
  onSuccess?: () => void;
}

const SubscriptionUpgradeModal: React.FC<SubscriptionUpgradeModalProps> = ({
  isOpen,
  onClose,
  userId,
  plan,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [durationMonths, setDurationMonths] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [step, setStep] = useState<'plan' | 'payment'>('plan');

  const durationDays = durationMonths * 30;
  const totalPrice = plan.price_per_month * durationMonths;

  const handleUpgrade = async () => {
    if (!userId || !plan) {
      setError('Data tidak lengkap');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Buat payment record terlebih dahulu
      const paymentResult = await createPayment(
        userId,
        '',
        totalPrice,
        paymentMethod
      );

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Gagal membuat payment');
      }

      // Upgrade subscription
      const result = await upgradeSubscription(
        userId,
        plan.plan_name,
        durationDays,
        totalPrice
      );

      if (!result.success) {
        throw new Error(result.error || 'Gagal upgrade subscription');
      }

      // Success
      setTimeout(() => {
        onClose();
        onSuccess?.();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Upgrade ke {plan.display_name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'plan' ? (
            <>
              {/* Plan Summary */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">{plan.display_name}</h3>
                <p className="text-sm text-gray-600 mb-3">{plan.description}</p>

                <div className="space-y-2 text-sm text-gray-700">
                  <p>• Max {plan.max_projects} proyek</p>
                  <p>• {plan.max_images_per_chapter} gambar per chapter</p>
                  <p>• {plan.max_chapters} chapter maksimal</p>
                  <p>• {plan.storage_gb} GB storage</p>
                  {plan.priority_support && <p>• Priority support</p>}
                </div>
              </div>

              {/* Duration Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  Durasi Langganan
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 3, 6].map((months) => (
                    <button
                      key={months}
                      onClick={() => setDurationMonths(months)}
                      className={`px-3 py-2 rounded border transition-colors text-sm font-medium ${
                        durationMonths === months
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-700 hover:border-blue-300'
                      }`}
                    >
                      {months} bulan
                    </button>
                  ))}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {durationMonths === 3 && '• Hemat 5% dibanding 1 bulan'}
                  {durationMonths === 6 && '• Hemat 10% dibanding 1 bulan'}
                </div>
              </div>

              {/* Price Summary */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Harga per bulan:</span>
                  <span className="font-medium text-gray-900">
                    Rp {plan.price_per_month.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-200">
                  <span className="text-gray-600">Durasi:</span>
                  <span className="font-medium text-gray-900">{durationMonths} bulan</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Total:</span>
                  <span className="text-xl font-bold text-blue-600">
                    Rp {totalPrice.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-red-800">{error}</span>
                </div>
              )}

              {/* Button */}
              <button
                onClick={() => setStep('payment')}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Lanjut ke Pembayaran
              </button>
            </>
          ) : (
            <>
              {/* Payment Step */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  Metode Pembayaran
                </label>
                <div className="space-y-2">
                  {[
                    { id: 'card', label: 'Kartu Kredit/Debit', icon: '💳' },
                    { id: 'transfer', label: 'Transfer Bank', icon: '🏦' },
                    { id: 'ewallet', label: 'E-Wallet (GCash, Gopay, OVO)', icon: '📱' }
                  ].map((method) => (
                    <label key={method.id} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name="payment"
                        value={method.id}
                        checked={paymentMethod === method.id}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-4 h-4"
                      />
                      <span className="ml-3 mr-2 text-xl">{method.icon}</span>
                      <span className="text-gray-700 font-medium">{method.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Confirmation */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-gray-700 mb-2">
                  Anda akan dikenakan biaya sebesar:
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  Rp {totalPrice.toLocaleString('id-ID')}
                </p>
                <p className="text-xs text-gray-600 mt-2">
                  untuk {durationMonths} bulan akses ke paket {plan.display_name}
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-red-800">{error}</span>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('plan')}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Kembali
                </button>
                <button
                  onClick={handleUpgrade}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {loading && <Loader className="w-4 h-4 animate-spin" />}
                  {loading ? 'Memproses...' : 'Bayar Sekarang'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionUpgradeModal;
