import React, { useState, useEffect } from 'react';
import { AlertCircle, Check, X, Calendar, Zap } from 'lucide-react';
import { getSubscriptionStatus, getSubscriptionPlans, getSubscription, upgradeSubscription, SubscriptionPlan, Subscription } from '../services/subscriptionService';

interface SubscriptionStatusCardProps {
  userId: string;
  onUpgrade?: (plan: SubscriptionPlan) => void;
}

const SubscriptionStatusCard: React.FC<SubscriptionStatusCardProps> = ({ userId, onUpgrade }) => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [status, setStatus] = useState<any>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPlans, setShowPlans] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subData, statusData, plansData] = await Promise.all([
          getSubscription(userId),
          getSubscriptionStatus(userId),
          getSubscriptionPlans()
        ]);
        setSubscription(subData);
        setStatus(statusData);
        setPlans(plansData);
      } catch (error) {
        console.error('Error fetching subscription data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchData();
  }, [userId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPlanColor = (planType: string) => {
    const colors: Record<string, string> = {
      free: 'bg-gray-50 border-gray-200',
      basic: 'bg-blue-50 border-blue-200',
      pro: 'bg-purple-50 border-purple-200',
      enterprise: 'bg-amber-50 border-amber-200'
    };
    return colors[planType] || colors.free;
  };

  const getPlanBadgeColor = (planType: string) => {
    const colors: Record<string, string> = {
      free: 'bg-gray-100 text-gray-800',
      basic: 'bg-blue-100 text-blue-800',
      pro: 'bg-purple-100 text-purple-800',
      enterprise: 'bg-amber-100 text-amber-800'
    };
    return colors[planType] || colors.free;
  };

  if (loading) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="text-center text-gray-600">Memuat status subscription...</div>
      </div>
    );
  }

  const planType = status?.plan_type || subscription?.plan_type || 'free';
  const isActive = status?.is_active ?? true;
  const endDate = status?.end_date || subscription?.end_date;
  const daysRemaining = status?.days_remaining;

  return (
    <div className={`border rounded-lg p-4 ${getPlanColor(planType)}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">Subscription</h3>
            <span className={`px-2 py-1 rounded text-sm font-medium ${getPlanBadgeColor(planType)}`}>
              {planType.toUpperCase()}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            {isActive ? 'Aktif' : 'Tidak Aktif'} • {formatDate(endDate || new Date().toISOString())}
          </p>
        </div>
        {isActive && (
          <Check className="w-5 h-5 text-green-600" />
        )}
      </div>

      {endDate && daysRemaining !== undefined && daysRemaining > 0 && (
        <div className="flex items-center gap-2 mb-4 p-2 bg-white bg-opacity-60 rounded">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span className="text-sm text-gray-700">
            {daysRemaining} hari lagi sampai habis
          </span>
        </div>
      )}

      {daysRemaining !== undefined && daysRemaining <= 7 && daysRemaining > 0 && (
        <div className="mb-4 p-2 bg-amber-100 border border-amber-300 rounded flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            Subscription Anda akan berakhir segera. Perpanjang sekarang untuk akses tanpa batas.
          </p>
        </div>
      )}

      <button
        onClick={() => setShowPlans(!showPlans)}
        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
      >
        <Zap className="w-4 h-4" />
        {planType === 'free' ? 'Upgrade Sekarang' : 'Ubah Plan'}
      </button>

      {showPlans && (
        <div className="mt-4 pt-4 border-t">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Pilih Plan</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`p-3 border rounded-lg cursor-pointer hover:shadow-md transition-all ${
                  plan.plan_name === planType
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h5 className="font-medium text-gray-900">{plan.display_name}</h5>
                    <p className="text-xs text-gray-600">{plan.description}</p>
                  </div>
                  {plan.plan_name === planType && (
                    <Check className="w-4 h-4 text-blue-600" />
                  )}
                </div>

                <div className="mb-2 text-sm text-gray-700">
                  <span className="font-bold text-blue-600">
                    Rp {plan.price_per_month.toLocaleString('id-ID')}
                  </span>
                  <span className="text-gray-600"> / bulan</span>
                </div>

                <ul className="text-xs text-gray-600 mb-3 space-y-1">
                  <li>• {plan.max_projects} proyek</li>
                  <li>• {plan.max_images_per_chapter} gambar/chapter</li>
                  <li>• {plan.storage_gb} GB storage</li>
                  {plan.priority_support && <li>• Priority Support</li>}
                </ul>

                <button
                  onClick={() => onUpgrade?.(plan)}
                  className={`w-full px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                    plan.plan_name === planType
                      ? 'bg-blue-600 text-white cursor-default opacity-50'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                  disabled={plan.plan_name === planType}
                >
                  {plan.plan_name === planType ? 'Plan Saat Ini' : 'Pilih'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionStatusCard;
