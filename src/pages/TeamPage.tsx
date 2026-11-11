import React, { useState } from 'react';
import { Check, Copy, Share2, Users } from 'lucide-react';
import { PageHeader } from '../components/Brand';
import { showToast } from '../components/Toast';
import { usePlatform } from '../store/alphaStore';
import { formatAR, formatDateTime } from '../utils/format';

export function TeamPage({ navigate }: { navigate: (path: string) => void }) {
  const { profile, referrals } = usePlatform();
  const [selectedLevel, setSelectedLevel] = useState<1 | 2 | 3>(1);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const referralCode = profile?.referral_code ?? 'MED842';
  const inviteLink = `${window.location.origin}/#/auth?mode=signup&ref=${referralCode}`;

  const directCount = referrals.filter((r) => r.level === 1).length;
  const activeCount = referrals.filter((r) => r.level === 1 && !r.is_suspended).length;
  const totalBonus = referrals.reduce((sum, r) => sum + r.bonus_earned, 0);

  const filteredMembers = referrals.filter((r) => r.level === selectedLevel);
  const levelRates: Record<1 | 2 | 3, string> = { 1: '10%', 2: '5%', 3: '2%' };

  const copyCode = () => {
    navigator.clipboard?.writeText(referralCode);
    setCopiedCode(true);
    showToast('Code copié !', 'success');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyLink = () => {
    navigator.clipboard?.writeText(inviteLink);
    setCopiedLink(true);
    showToast('Lien d’invitation copié !', 'success');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'MED',
          text: `Rejoignez MED avec mon code de parrainage : ${referralCode}`,
          url: inviteLink,
        });
        return;
      } catch {
        // fallback to copy
      }
    }
    copyLink();
  };

  return (
    <div>
      <PageHeader title="Équipe & Parrainage" onBack={() => navigate('/home')} />

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Referral Card */}
        <div className="card p-5 mb-6 bg-gradient-to-br from-med-forest via-med-deep to-med-emerald border-0 text-white">
          <p className="text-xs text-white/75 mb-1">Votre code de parrainage</p>
          <div className="flex items-center justify-between bg-white/15 rounded-xl px-4 py-3 mb-4">
            <span className="font-mono text-lg font-extrabold text-med-light tracking-wider">
              {referralCode}
            </span>
            <button
              onClick={copyCode}
              className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copier</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={copyLink}
              className="py-2.5 px-3 rounded-xl bg-white text-med-forest text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-med-soft transition-colors cursor-pointer"
            >
              {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>Copier le lien</span>
            </button>
            <button
              onClick={handleShare}
              className="py-2.5 px-3 rounded-xl bg-med-light text-med-forest text-xs font-bold flex items-center justify-center gap-1.5 hover:brightness-105 transition-all cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Partager</span>
            </button>
          </div>
        </div>

        {/* Team Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="card p-3.5 text-center">
            <p className="text-xl font-extrabold text-med-deep tabular-nums">
              {directCount}
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">Filleuls directs</p>
          </div>
          <div className="card p-3.5 text-center">
            <p className="text-xl font-extrabold text-med-emerald tabular-nums">
              {activeCount}
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">Actifs</p>
          </div>
          <div className="card p-3.5 text-center">
            <p className="text-base font-extrabold text-med-forest tabular-nums">
              {formatAR(totalBonus)}
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">Bonus total</p>
          </div>
        </div>

        {/* 3-Level Tabs */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-med-soft rounded-xl mb-4">
          {([1, 2, 3] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSelectedLevel(lvl)}
              className={`py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                selectedLevel === lvl
                  ? 'bg-white text-med-deep shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Niv. {lvl} ({levelRates[lvl]})
            </button>
          ))}
        </div>

        {filteredMembers.length === 0 ? (
          <div className="card p-8 text-center">
            <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">
              Aucun filleul au Niveau {selectedLevel} pour le moment
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 mb-8">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                className="card p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-gray-900 text-sm">{member.full_name}</p>
                  <p className="text-xs text-gray-500">{member.phone}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Inscrit le {formatDateTime(member.joined_at)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Commission</p>
                  <p className="text-sm font-extrabold text-med-deep tabular-nums">
                    +{formatAR(member.bonus_earned)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
