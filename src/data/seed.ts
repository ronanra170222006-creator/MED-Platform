import { InvestmentPlan, PaymentMethod } from '../types';

export const VIP_PLANS: InvestmentPlan[] = [
  { id: 'vip-1', level: 1, name: 'VIP 1', price: 20000, daily_rate: 3.5, daily_task_reward: 700, duration_days: 150, description: 'Idéal pour démarrer sur MED' },
  { id: 'vip-2', level: 2, name: 'VIP 2', price: 50000, daily_rate: 3.5, daily_task_reward: 1750, duration_days: 150, description: 'Portefeuille d’entrée à rendement régulier' },
  { id: 'vip-3', level: 3, name: 'VIP 3', price: 100000, daily_rate: 3.5, daily_task_reward: 3500, duration_days: 150, description: 'Équilibre optimal capital et tâches' },
  { id: 'vip-4', level: 4, name: 'VIP 4', price: 200000, daily_rate: 3.5, daily_task_reward: 7000, duration_days: 150, description: 'Accès prioritaire aux campagnes vidéo' },
  { id: 'vip-5', level: 5, name: 'VIP 5', price: 350000, daily_rate: 3.5, daily_task_reward: 12250, duration_days: 150, description: 'Niveau intermédiaire confirmé' },
  { id: 'vip-6', level: 6, name: 'VIP 6', price: 500000, daily_rate: 3.5, daily_task_reward: 17500, duration_days: 150, description: 'Performance quotidienne soutenue' },
  { id: 'vip-7', level: 7, name: 'VIP 7', price: 750000, daily_rate: 3.5, daily_task_reward: 26250, duration_days: 150, description: 'Portefeuille croissance accélérée' },
  { id: 'vip-8', level: 8, name: 'VIP 8', price: 1000000, daily_rate: 3.5, daily_task_reward: 35000, duration_days: 150, description: 'Club Millionnaire MED' },
  { id: 'vip-9', level: 9, name: 'VIP 9', price: 1500000, daily_rate: 3.5, daily_task_reward: 52500, duration_days: 150, description: 'Rendement élevé sur 150 jours' },
  { id: 'vip-10', level: 10, name: 'VIP 10', price: 2000000, daily_rate: 3.5, daily_task_reward: 70000, duration_days: 150, description: 'Partenaire stratégique premium' },
  { id: 'vip-11', level: 11, name: 'VIP 11', price: 3000000, daily_rate: 3.5, daily_task_reward: 105000, duration_days: 150, description: 'Gestion dédiée et retraits rapides' },
  { id: 'vip-12', level: 12, name: 'VIP 12', price: 4500000, daily_rate: 3.5, daily_task_reward: 157500, duration_days: 150, description: 'Cercle exécutif MED' },
  { id: 'vip-13', level: 13, name: 'VIP 13', price: 6000000, daily_rate: 3.5, daily_task_reward: 210000, duration_days: 150, description: 'Allocation institutionnelle' },
  { id: 'vip-14', level: 14, name: 'VIP 14', price: 8000000, daily_rate: 3.5, daily_task_reward: 280000, duration_days: 150, description: 'Prestige & commissions maximales' },
  { id: 'vip-15', level: 15, name: 'VIP 15', price: 10000000, daily_rate: 3.5, daily_task_reward: 350000, duration_days: 150, description: 'Sommet exclusif MED' },
];

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'pm-airtel',
    name: 'Airtel Money',
    operator: 'Airtel Money',
    account_number: '0337466748',
    account_name: 'EVINTSOA RAKOTONOMENJANAHARY',
    color: 'from-red-500 to-rose-600',
    allow_deposit: true,
    allow_withdraw: true,
  },
  {
    id: 'pm-orange',
    name: 'Orange Money',
    operator: 'Orange Money',
    account_number: '032 67 410 22',
    account_name: 'MED SARL',
    color: 'from-orange-500 to-amber-600',
    allow_deposit: false,
    allow_withdraw: true,
  },
];

export const DEPOSIT_METHODS = PAYMENT_METHODS.filter((m) => m.allow_deposit);
export const WITHDRAWAL_METHODS = PAYMENT_METHODS.filter((m) => m.allow_withdraw);

export const FAQ_ITEMS = [
  {
    q: 'Comment fonctionne MED ?',
    a: 'MED vous permet d’activer des portefeuilles VIP (de VIP 1 à VIP 15) et d’accomplir des tâches quotidiennes de visionnage pour recevoir une récompense directement créditée sur votre solde disponible en Ariary (AR).',
  },
  {
    q: 'Quels sont les moyens de dépôt et retrait ?',
    a: 'Les dépôts s’effectuent exclusivement via Airtel Money (minimum 20 000 AR). Les retraits sont disponibles via Airtel Money et Orange Money (minimum 3 000 AR) avec des frais de traitement de 3%.',
  },
  {
    q: 'Combien de temps dure un plan VIP ?',
    a: 'Chaque niveau VIP est actif pendant 150 jours calendaires avec un rendement journalier indicatif de 3,5% versé après validation de votre tâche de visionnage.',
  },
  {
    q: 'Comment gagner avec le parrainage ?',
    a: 'Partagez votre code ou lien d’invitation depuis l’onglet Équipe. Vous percevez 10% sur les dépôts de Niveau 1, 5% sur le Niveau 2 et 2% sur le Niveau 3.',
  },
];
