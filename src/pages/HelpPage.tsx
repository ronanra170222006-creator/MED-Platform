import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Mail, MessageCircle, Phone } from 'lucide-react';
import { PageHeader } from '../components/Brand';
import { FAQ_ITEMS } from '../data/seed';

export function HelpPage({ navigate }: { navigate: (path: string) => void }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div>
      <PageHeader title="Centre d'aide" onBack={() => navigate('/home')} />

      <div className="max-w-md mx-auto px-4 py-6">
        <div className="card p-6 mb-6 bg-gradient-to-br from-med-forest via-med-deep to-med-emerald border-0 text-center text-white">
          <HelpCircle className="w-12 h-12 text-med-light mx-auto mb-3" />
          <h2 className="text-lg font-bold mb-1">Besoin d’aide ?</h2>
          <p className="text-white/80 text-sm">
            Trouvez les réponses aux questions les plus fréquentes
          </p>
        </div>

        <h3 className="font-bold text-gray-900 mb-3">Questions fréquentes</h3>
        <div className="space-y-2 mb-6">
          {FAQ_ITEMS.map((item, idx) => (
            <div key={idx} className="card overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full p-4 flex items-center justify-between text-left cursor-pointer"
              >
                <span className="font-semibold text-sm text-gray-900 pr-2">
                  {item.q}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
                    openIndex === idx ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openIndex === idx && (
                <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed animate-slide-down">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>

        <h3 className="font-bold text-gray-900 mb-3">Nous contacter</h3>
        <div className="space-y-2 mb-8">
          <a
            href="tel:+261330000000"
            className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 rounded-xl bg-med-soft flex items-center justify-center">
              <Phone className="w-5 h-5 text-med-deep" />
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-900">Support Téléphonique</p>
              <p className="text-xs text-gray-500">+261 33 00 000 00</p>
            </div>
          </a>

          <a
            href="mailto:support@med-invest.mg"
            className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 rounded-xl bg-med-soft flex items-center justify-center">
              <Mail className="w-5 h-5 text-med-deep" />
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-900">Email Support</p>
              <p className="text-xs text-gray-500">support@med-invest.mg</p>
            </div>
          </a>

          <div className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-900">Service Client 7j/7</p>
              <p className="text-xs text-gray-500">Disponible de 08h00 à 20h00</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
