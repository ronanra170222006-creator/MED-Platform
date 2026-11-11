import React, { useState } from 'react';
import { AlertTriangle, Calendar, CheckCircle2, Crown, TrendingUp } from 'lucide-react';
import { Modal, PageHeader } from '../components/Brand';
import { showToast } from '../components/Toast';
import { VIP_PLANS } from '../data/seed';
import { usePlatform } from '../store/alphaStore';
import { InvestmentPlan } from '../types';
import { formatAR } from '../utils/format';

export function PlanPage({ navigate }: { navigate: (path: string) => void }) {
  const { profile, investments, investInPlan } = usePlatform();
  const [selectedPlan, setSelectedPlan] = useState<InvestmentPlan | null>(null);

  const availableBalance = (profile?.balance ?? 0) - (profile?.reserved_balance ?? 0);
  const dailyRate = VIP_PLANS[0]?.daily_rate ?? 3.5;

  const handleConfirmInvest = async () => {
    if (!selectedPlan) return;
    if (availableBalance < selectedPlan.price) {
      showToast('Solde disponible insuffisant pour ce niveau VIP', 'error');
      setSelectedPlan(null);
      navigate('/deposit');
      return;
    }

    const res = await investInPlan(selectedPlan.id);
    if (!res.ok) {
      showToast(res.error || 'Erreur lors de l’investissement', 'error');
      return;
    }

    showToast(`Investissement ${selectedPlan.name} réussi !`, 'success');
    setSelectedPlan(null);
    navigate('/home');
  };

  return (
    <div>
      <PageHeader title="Plan VIP MED" onBack={() => navigate('/home')} />

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Disclaimer */}
        <div className="card p-4 mb-6 bg-amber-50/60 border-amber-100">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed">
              Les projections financières sont présentées à titre indicatif et ne constituent en aucun cas une garantie de rendement. Aucun contrat financier n’est activé sans vérification de son financement.
            </p>
          </div>
        </div>

        {/* Yield Overview */}
        <div className="card p-5 mb-6 bg-gradient-to-br from-med-forest via-med-deep to-med-emerald border-0 text-white">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-med-light" />
            <h3 className="font-bold">Rendement du plan</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/15 rounded-xl p-3">
              <span className="text-[10px] text-white/75 uppercase tracking-wide block mb-1">
                Revenu journalier
              </span>
              <p className="text-2xl font-extrabold text-med-light tabular-nums">
                {dailyRate} %
              </p>
            </div>
            <div className="bg-white/15 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Calendar className="w-3.5 h-3.5 text-med-light" />
                <span className="text-[10px] text-white/75 uppercase tracking-wide">
                  Durée
                </span>
              </div>
              <p className="text-2xl font-extrabold tabular-nums">150 jours</p>
            </div>
            <div className="bg-white/15 rounded-xl p-3">
              <span className="text-[10px] text-white/75 uppercase tracking-wide block mb-1">
                Projection mensuelle
              </span>
              <p className="text-lg font-bold tabular-nums">105 %</p>
            </div>
            <div className="bg-white/15 rounded-xl p-3">
              <span className="text-[10px] text-white/75 uppercase tracking-wide block mb-1">
                Solde disponible
              </span>
              <p className="text-lg font-bold text-med-light tabular-nums">
                {formatAR(availableBalance)}
              </p>
            </div>
          </div>
        </div>

        {/* All 15 VIP Plans */}
        <h3 className="font-bold text-gray-900 mb-3">
          Tous les niveaux VIP ({VIP_PLANS.length})
        </h3>
        <div className="space-y-3 mb-8">
          {VIP_PLANS.map((plan) => {
            const isOwned = investments.some(
              (inv) => inv.plan_id === plan.id && inv.status === 'active'
            );
            const totalReturn = plan.daily_task_reward * plan.duration_days;

            return (
              <div
                key={plan.id}
                className="card p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-med-deep to-med-forest flex items-center justify-center flex-shrink-0">
                      <Crown className="w-5 h-5 text-med-light" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-gray-900">{plan.name}</h4>
                        {isOwned && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" /> Actif
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{plan.description}</p>
                    </div>
                  </div>
                  <p className="text-base font-extrabold text-med-deep tabular-nums whitespace-nowrap">
                    {formatAR(plan.price)}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-med-soft rounded-xl p-2.5 text-center mb-3">
                  <div>
                    <p className="text-[10px] text-gray-500">Gain / tâche</p>
                    <p className="text-xs font-bold text-med-deep tabular-nums">
                      {formatAR(plan.daily_task_reward)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500">Durée</p>
                    <p className="text-xs font-bold text-gray-800 tabular-nums">
                      {plan.duration_days} j
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500">Total 150j</p>
                    <p className="text-xs font-bold text-med-forest tabular-nums">
                      {formatAR(totalReturn)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedPlan(plan)}
                  className="btn-primary w-full py-2.5 text-sm"
                >
                  {isOwned ? 'Souscrire à nouveau' : `Investir (${plan.name})`}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        open={Boolean(selectedPlan)}
        onClose={() => setSelectedPlan(null)}
        title={`Activer ${selectedPlan?.name ?? ''}`}
      >
        {selectedPlan && (
          <div className="space-y-4">
            <div className="bg-med-soft rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Montant du plan</span>
                <span className="font-bold text-med-forest tabular-nums">
                  {formatAR(selectedPlan.price)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Récompense quotidienne</span>
                <span className="font-bold text-med-deep tabular-nums">
                  +{formatAR(selectedPlan.daily_task_reward)} / jour
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Votre solde disponible</span>
                <span className="font-bold text-gray-900 tabular-nums">
                  {formatAR(availableBalance)}
                </span>
              </div>
            </div>

            {availableBalance < selectedPlan.price && (
              <p className="text-xs text-red-600 font-medium">
                Votre solde est insuffisant. En continuant, vous serez redirigé vers la page de dépôt Airtel Money.
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedPlan(null)}
                className="btn-outline flex-1 py-2.5 text-sm"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmInvest}
                className="btn-primary flex-1 py-2.5 text-sm"
              >
                {availableBalance < selectedPlan.price ? 'Déposer' : 'Confirmer'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
