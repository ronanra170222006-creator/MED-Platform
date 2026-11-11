export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface UserProfile {
  user_id: string;
  full_name: string;
  phone: string;
  email?: string;
  referral_code: string;
  referred_by?: string;
  balance: number;
  reserved_balance: number;
  total_earned: number;
  is_admin: boolean;
  is_suspended: boolean;
  created_at: string;
}

export interface InvestmentPlan {
  id: string;
  level: number;
  name: string;
  price: number;
  daily_rate: number;
  daily_task_reward: number;
  duration_days: number;
  description: string;
}

export interface Investment {
  id: string;
  user_id: string;
  plan_id: string;
  amount: number;
  status: 'active' | 'pending_activation' | 'completed';
  created_at: string;
  activated_at?: string;
}

export interface DailyTask {
  id: string;
  user_id: string;
  investment_id: string;
  plan_name: string;
  reward: number;
  payment_status: 'pending' | 'paid';
  paid_at?: string;
  created_at: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  operator: 'Airtel Money' | 'Orange Money';
  account_number: string;
  account_name: string;
  color: string;
  allow_deposit: boolean;
  allow_withdraw: boolean;
}

export interface DepositRequest {
  id: string;
  user_id: string;
  user_name: string;
  amount: number;
  payment_method: string;
  payment_operator: string;
  payer_number: string;
  transaction_ref?: string;
  proof_name?: string;
  status: RequestStatus;
  created_at: string;
}

export interface WithdrawalRequest {
  id: string;
  user_id: string;
  user_name: string;
  amount: number;
  fee: number;
  net_amount: number;
  payment_method: string;
  beneficiary_number: string;
  beneficiary_name: string;
  status: RequestStatus;
  created_at: string;
}

export interface TransactionRecord {
  id: string;
  userId: string;
  user_id?: string;
  user_name?: string;
  telephone?: string;
  type:
    | 'DEPOT'
    | 'RETRAIT'
    | 'deposit'
    | 'withdrawal'
    | 'investment'
    | 'task_reward'
    | 'referral_bonus'
    | 'welcome_bonus';
  operateur?: string;
  montant: number;
  amount?: number;
  frais?: number;
  montant_net?: number;
  reference?: string;
  beneficiary_name?: string;
  statut?: 'EN_ATTENTE' | 'REUSSI' | 'REFUSE';
  description?: string;
  date: string;
  created_at?: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  read_by?: string[];
  created_at: string;
}

export interface GlobalAnnouncement {
  id: string;
  title: string;
  message: string;
  created_at: string;
}

export interface ReferralMember {
  id: string;
  full_name: string;
  phone: string;
  level: 1 | 2 | 3;
  total_deposit: number;
  bonus_earned: number;
  is_suspended: boolean;
  joined_at: string;
}
