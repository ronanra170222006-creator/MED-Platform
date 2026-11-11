import React, { useState } from 'react';
import { Check, Copy, Info, ShieldCheck, Upload } from 'lucide-react';
import { PageHeader, StatusBadge } from '../components/Brand';
import { showToast } from '../components/Toast';
import { DEPOSIT_METHODS } from '../data/seed';
import { usePlatform } from '../store/alphaStore';
import { formatAR, formatDateTime } from '../utils/format';

const MIN_DEPOSIT = 20000;
const PRESET_AMOUNTS = [20000, 50000, 100000, 200000, 500000];

export function DepositPage({ navigate }: { navigate: (path: string) => void }) {
  const { profile, deposits, submitDeposit } = usePlatform();
  const userDeposits = deposits.filter((d) => d.user_id === profile?.user_id);
  const airtelMethod = DEPOSIT_METHODS[0];

  const [amount, setAmount] = useState('');
  const [payerNumber, setPayerNumber] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [proofName, setProofName] = useState('');
  const [copiedNum, setCopiedNum] = useState(false);

  const handleCopyNumber = () => {
    if (!airtelMethod) return;
    navigator.clipboard?.writeText(airtelMethod.account_number.replace(/\s+/g, ''));
    setCopiedNum(true);
    showToast('Numéro marchand Airtel Money copié !', 'success');
    setTimeout(() => setCopiedNum(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < MIN_DEPOSIT) {
      showToast(`Le montant minimum de dépôt est de ${formatAR(MIN_DEPOSIT)}.`, 'error');
      return;
    }
    if (!payerNumber.trim()) {
      showToast('Veuillez saisir votre numéro Airtel Money utilisé pour le paiement', 'error');
      return;
    }

    const res = await submitDeposit({
      amount: numAmount,
      payment_method: 'Airtel Money',
      payment_operator: 'Airtel Money',
      payer_number: payerNumber.trim(),
      transaction_ref: transactionRef.trim() || undefined,
      proof_name: proofName || undefined,
    });

    if (!res.ok) {
      showToast(res.error || 'Erreur lors de la soumission', 'error');
      return;
    }

    showToast('Demande de dépôt Airtel Money soumise avec succès !', 'success');
    setAmount('');
    setPayerNumber('');
    setTransactionRef('');
    setProofName('');
  };

  return (
    <div>
      <PageHeader title="Dépôt Airtel Money" onBack={() => navigate('/home')} />

      <div className="max-w-md mx-auto px-4 py-6">
        <div className="card p-4 mb-6 bg-med-soft border-med-light/60">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-med-deep flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-700 leading-relaxed">
              Les dépôts sur <strong>MED</strong> s’effectuent exclusivement via{' '}
              <strong>Airtel Money</strong>. Transférez le montant souhaité vers le numéro marchand Airtel Money ci-dessous, puis validez le formulaire. Dépôt minimum :{' '}
              <strong className="text-med-forest">{formatAR(MIN_DEPOSIT)}</strong>.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="card p-5 space-y-5 mb-6">
          {/* Exclusive Airtel Money Badge */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Réseau de dépôt autorisé
            </label>
            <div className="p-3.5 rounded-xl border-2 border-med-emerald bg-med-soft flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white font-extrabold text-xs shadow-xs">
                  AM
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Airtel Money</p>
                  <p className="text-[11px] text-med-deep font-medium">
                    Seul canal de dépôt accepté
                  </p>
                </div>
              </div>
              <ShieldCheck className="w-5 h-5 text-med-deep" />
            </div>
          </div>

          {/* Merchant Info */}
          {airtelMethod && (
            <div className="rounded-xl bg-gray-50 border border-med-light/60 p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] text-gray-500">Titulaire Airtel Money officiel</p>
                <p className="text-xs font-bold text-med-forest truncate mt-0.5">
                  {airtelMethod.account_name}
                </p>
                <p className="text-lg font-extrabold text-gray-900 font-mono tracking-wide mt-1">
                  {airtelMethod.account_number}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyNumber}
                className="px-3.5 py-2 rounded-lg bg-white border border-med-light text-xs font-semibold text-med-deep flex items-center gap-1.5 hover:bg-med-soft cursor-pointer flex-shrink-0"
              >
                {copiedNum ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedNum ? 'Copié' : 'Copier le numéro'}</span>
              </button>
            </div>
          )}

          {/* Quick Presets */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Montant du dépôt (AR)
            </label>
            <div className="flex flex-wrap gap-2 mb-2.5">
              {PRESET_AMOUNTS.map((val) => (
                <button
                  type="button"
                  key={val}
                  onClick={() => setAmount(String(val))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer tabular-nums ${
                    amount === String(val)
                      ? 'bg-med-deep text-white border-med-deep'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-med-soft'
                  }`}
                >
                  {formatAR(val)}
                </button>
              ))}
            </div>
            <input
              type="number"
              required
              min={MIN_DEPOSIT}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input-field font-semibold tabular-nums"
              placeholder="Ex: 50000"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Votre numéro Airtel Money émetteur
            </label>
            <input
              type="tel"
              required
              value={payerNumber}
              onChange={(e) => setPayerNumber(e.target.value)}
              className="input-field"
              placeholder="033 12 345 67"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Référence de transaction Airtel Money (optionnel)
            </label>
            <input
              type="text"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              className="input-field font-mono"
              placeholder="Ex: AIR-982341"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Preuve de paiement (optionnel)
            </label>
            <label className="flex items-center justify-center gap-2 border-2 border-dashed border-med-light rounded-xl p-4 text-xs text-gray-500 hover:border-med-deep hover:text-med-deep transition-colors cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>{proofName || 'Joindre une capture d’écran Airtel Money'}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setProofName(e.target.files?.[0]?.name || '')}
              />
            </label>
          </div>

          <button type="submit" className="btn-primary w-full">
            Soumettre le dépôt Airtel Money
          </button>
        </form>

        {/* Deposit History */}
        <h3 className="font-bold text-gray-900 mb-3">Historique des dépôts</h3>
        {userDeposits.length === 0 ? (
          <div className="card p-6 text-center text-sm text-gray-400">
            Aucun dépôt effectué pour le moment
          </div>
        ) : (
          <div className="space-y-2.5 mb-8">
            {userDeposits.map((dep) => (
              <div key={dep.id} className="card p-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-900 text-sm tabular-nums">
                    {formatAR(dep.amount)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {dep.payment_method} • {dep.payer_number}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {formatDateTime(dep.created_at)}
                  </p>
                </div>
                <StatusBadge status={dep.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
