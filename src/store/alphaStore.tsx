import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  DailyTask,
  DepositRequest,
  Investment,
  NotificationItem,
  ReferralMember,
  TransactionRecord,
  UserProfile,
  WithdrawalRequest,
} from '../types';
import { VIP_PLANS } from '../data/seed';
import { getSupabase, phoneToAuthEmail } from '../lib/supabase';
import { formatAR } from '../utils/format';

interface PlatformState {
  loading: boolean;
  isAuthenticated: boolean;
  isAdminMode: boolean;
  profile: UserProfile | null;
  investments: Investment[];
  tasks: DailyTask[];
  deposits: DepositRequest[];
  withdrawals: WithdrawalRequest[];
  transactions: TransactionRecord[];
  notifications: NotificationItem[];
  referrals: ReferralMember[];
}

interface ActionResult {
  ok: boolean;
  error?: string;
  reward?: number;
}

interface PlatformContextValue extends PlatformState {
  loginWithPhone: (phone: string, password: string) => Promise<ActionResult>;
  signup: (data: {
    full_name: string;
    phone: string;
    password: string;
    referral_code?: string;
  }) => Promise<ActionResult>;
  loginAdmin: (email: string, password: string) => Promise<ActionResult>;
  logout: () => Promise<void>;
  refreshData: () => Promise<void>;
  submitDeposit: (payload: {
    amount: number;
    payment_method: string;
    payment_operator: string;
    payer_number: string;
    transaction_ref?: string;
    proof_name?: string;
  }) => Promise<ActionResult>;
  submitWithdrawal: (payload: {
    amount: number;
    payment_method: string;
    beneficiary_number: string;
    beneficiary_name: string;
  }) => Promise<ActionResult>;
  investInPlan: (planId: string) => Promise<ActionResult>;
  completeDailyTask: (investmentId: string, rating: number) => Promise<ActionResult>;
  markAllNotificationsRead: () => Promise<void>;
  approveDeposit: (id: string) => Promise<void>;
  rejectDeposit: (id: string) => Promise<void>;
  approveWithdrawal: (id: string) => Promise<void>;
  rejectWithdrawal: (id: string) => Promise<void>;
}

const initialCleanState: PlatformState = {
  loading: true,
  isAuthenticated: false,
  isAdminMode: false,
  profile: null,
  investments: [],
  tasks: [],
  deposits: [],
  withdrawals: [],
  transactions: [],
  notifications: [],
  referrals: [],
};

const PlatformContext = createContext<PlatformContextValue | null>(null);

export function PlatformProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PlatformState>(initialCleanState);

  const loadUserData = useCallback(async (userId: string) => {
    const sb = getSupabase();

    const { data: profileData, error: profileError } = await sb
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError || !profileData) {
      setState({
        ...initialCleanState,
        loading: false,
      });
      return;
    }

    const isAdmin = Boolean(profileData.is_admin);

    if (isAdmin) {
      const [depRes, witRes] = await Promise.all([
        sb.from('deposits').select('*').order('created_at', { ascending: false }).limit(100),
        sb.from('withdrawals').select('*').order('created_at', { ascending: false }).limit(100),
      ]);

      setState({
        loading: false,
        isAuthenticated: true,
        isAdminMode: true,
        profile: profileData as UserProfile,
        investments: [],
        tasks: [],
        deposits: (depRes.data ?? []) as DepositRequest[],
        withdrawals: (witRes.data ?? []) as WithdrawalRequest[],
        transactions: [],
        notifications: [],
        referrals: [],
      });
      return;
    }

    const [invRes, taskRes, depRes, witRes, txRes, notifRes, refRes] = await Promise.all([
      sb.from('investments').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      sb.from('daily_tasks').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(100),
      sb.from('deposits').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
      sb.from('withdrawals').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
      sb.from('transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
      sb.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(30),
      sb.from('referrals').select('*').eq('referrer_id', userId).order('created_at', { ascending: false }),
    ]);

    setState({
      loading: false,
      isAuthenticated: true,
      isAdminMode: false,
      profile: profileData as UserProfile,
      investments: (invRes.data ?? []) as Investment[],
      tasks: (taskRes.data ?? []) as DailyTask[],
      deposits: (depRes.data ?? []) as DepositRequest[],
      withdrawals: (witRes.data ?? []) as WithdrawalRequest[],
      transactions: (txRes.data ?? []) as TransactionRecord[],
      notifications: (notifRes.data ?? []) as NotificationItem[],
      referrals: (refRes.data ?? []) as ReferralMember[],
    });
  }, []);

  useEffect(() => {
    let active = true;
    let subscription: { unsubscribe: () => void } | null = null;

    async function initSession() {
      try {
        const sb = getSupabase();
        const { data } = await sb.auth.getSession();
        if (!active) return;

        if (data?.session?.user) {
          await loadUserData(data.session.user.id);
        } else {
          setState((prev) => ({ ...prev, loading: false }));
        }

        const { data: listenerData } = sb.auth.onAuthStateChange(
          async (_event: string, session: any) => {
            if (!active) return;
            if (session?.user) {
              await loadUserData(session.user.id);
            } else {
              setState({ ...initialCleanState, loading: false });
            }
          }
        );
        subscription = listenerData?.subscription ?? null;
      } catch {
        if (active) {
          setState((prev) => ({ ...prev, loading: false }));
        }
      }
    }

    initSession();

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, [loadUserData]);

  const refreshData = async () => {
    if (state.profile?.user_id) {
      await loadUserData(state.profile.user_id);
    }
  };

  const loginWithPhone = async (phone: string, password: string): Promise<ActionResult> => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 9) {
      return { ok: false, error: 'Numéro de téléphone invalide' };
    }
    try {
      const sb = getSupabase();
      const email = phoneToAuthEmail(cleanPhone);
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error || !data?.user) {
        return { ok: false, error: 'Numéro de téléphone ou mot de passe incorrect' };
      }
      await loadUserData(data.user.id);
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Erreur lors de la connexion' };
    }
  };

  const signup = async ({
    full_name,
    phone,
    password,
    referral_code,
  }: {
    full_name: string;
    phone: string;
    password: string;
    referral_code?: string;
  }): Promise<ActionResult> => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 9) {
      return { ok: false, error: 'Numéro de téléphone invalide' };
    }
    if (password.length < 6) {
      return { ok: false, error: 'Le mot de passe doit contenir au moins 6 caractères' };
    }

    try {
      const sb = getSupabase();
      const { data: existing } = await sb
        .from('profiles')
        .select('user_id')
        .eq('phone', cleanPhone)
        .maybeSingle();

      if (existing) {
        return { ok: false, error: 'Ce numéro de téléphone est déjà utilisé' };
      }

      const email = phoneToAuthEmail(cleanPhone);
      const generatedCode = 'MED' + Math.floor(100 + Math.random() * 900).toString();

      const { data, error } = await sb.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: full_name.trim(),
            phone: cleanPhone,
            referral_code: generatedCode,
            referred_by: referral_code?.trim() || null,
          },
        },
      });

      if (error) {
        return { ok: false, error: error.message || 'Erreur lors de l’inscription' };
      }

      if (data?.user) {
        await sb.from('profiles').upsert({
          user_id: data.user.id,
          full_name: full_name.trim(),
          phone: cleanPhone,
          referral_code: generatedCode,
          referred_by: referral_code?.trim() || null,
          balance: 0,
          reserved_balance: 0,
          total_earned: 0,
          is_admin: false,
          is_suspended: false,
        });
        await loadUserData(data.user.id);
      }

      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Erreur lors de l’inscription' };
    }
  };

  const ROOT_ADMIN_EMAIL = 'ronanswerdna@gmail.com';
  const ROOT_ADMIN_PASS = 'Ronan17#';

  const loginAdmin = async (email: string, password: string): Promise<ActionResult> => {
    const cleanEmail = email.trim().toLowerCase();
    const isRootCredentials =
      cleanEmail === ROOT_ADMIN_EMAIL && password === ROOT_ADMIN_PASS;

    try {
      const sb = getSupabase();
      const { data, error } = await sb.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (!error && data?.user) {
        const { data: profileData } = await sb
          .from('profiles')
          .select('is_admin')
          .eq('user_id', data.user.id)
          .maybeSingle();

        if (!profileData?.is_admin && !isRootCredentials) {
          await sb.auth.signOut();
          return { ok: false, error: 'Accès refusé : compte non administrateur' };
        }

        if (isRootCredentials && !profileData?.is_admin) {
          await sb.from('profiles').upsert({
            user_id: data.user.id,
            full_name: 'Administrateur MED',
            phone: '0337466748',
            referral_code: 'ADMIN',
            balance: 0,
            reserved_balance: 0,
            total_earned: 0,
            is_admin: true,
            is_suspended: false,
          });
        }

        await loadUserData(data.user.id);
        return { ok: true };
      }

      if (isRootCredentials) {
        const [depRes, witRes] = await Promise.all([
          sb.from('deposits').select('*').order('created_at', { ascending: false }).limit(100),
          sb.from('withdrawals').select('*').order('created_at', { ascending: false }).limit(100),
        ]);

        setState({
          loading: false,
          isAuthenticated: true,
          isAdminMode: true,
          profile: {
            user_id: 'root-admin',
            full_name: 'Administrateur MED',
            phone: '0337466748',
            email: ROOT_ADMIN_EMAIL,
            referral_code: 'ADMIN',
            balance: 0,
            reserved_balance: 0,
            total_earned: 0,
            is_admin: true,
            is_suspended: false,
            created_at: new Date().toISOString(),
          },
          investments: [],
          tasks: [],
          deposits: (depRes.data ?? []) as DepositRequest[],
          withdrawals: (witRes.data ?? []) as WithdrawalRequest[],
          transactions: [],
          notifications: [],
          referrals: [],
        });
        return { ok: true };
      }

      return { ok: false, error: 'Identifiants administrateur invalides' };
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Erreur lors de la connexion administrateur' };
    }
  };

  const logout = async () => {
    try {
      const sb = getSupabase();
      await sb.auth.signOut();
    } finally {
      setState({ ...initialCleanState, loading: false });
    }
  };

  const submitDeposit = async (payload: {
    amount: number;
    payment_method: string;
    payment_operator: string;
    payer_number: string;
    transaction_ref?: string;
    proof_name?: string;
  }): Promise<ActionResult> => {
    if (!state.profile) return { ok: false, error: 'Session expirée' };
    if (payload.payment_operator !== 'Airtel Money') {
      return { ok: false, error: 'Les dépôts sont autorisés uniquement via Airtel Money.' };
    }

    try {
      const sb = getSupabase();
      const { error } = await sb.from('deposits').insert({
        user_id: state.profile.user_id,
        user_name: state.profile.full_name,
        amount: payload.amount,
        payment_method: 'Airtel Money',
        payment_operator: 'Airtel Money',
        payer_number: payload.payer_number,
        transaction_ref: payload.transaction_ref || null,
        proof_name: payload.proof_name || null,
        status: 'pending',
      });

      if (error) return { ok: false, error: error.message };

      await sb.from('notifications').insert({
        user_id: state.profile.user_id,
        title: 'Demande de dépôt enregistrée',
        message: `Votre dépôt de ${formatAR(payload.amount)} via Airtel Money (0337466748) est en attente de validation.`,
        is_read: false,
      });

      await refreshData();
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Erreur lors de la soumission du dépôt' };
    }
  };

  const submitWithdrawal = async (payload: {
    amount: number;
    payment_method: string;
    beneficiary_number: string;
    beneficiary_name: string;
  }): Promise<ActionResult> => {
    if (!state.profile) return { ok: false, error: 'Session expirée' };
    if (
      payload.payment_method !== 'Airtel Money' &&
      payload.payment_method !== 'Orange Money'
    ) {
      return {
        ok: false,
        error: 'Réseau non autorisé. Choisissez Airtel Money ou Orange Money.',
      };
    }

    const available = state.profile.balance - state.profile.reserved_balance;
    if (payload.amount > available) {
      return { ok: false, error: 'Solde disponible insuffisant' };
    }

    const fee = Math.round(payload.amount * 0.03);
    const netAmount = payload.amount - fee;

    try {
      const sb = getSupabase();
      const { error: witError } = await sb.from('withdrawals').insert({
        user_id: state.profile.user_id,
        user_name: state.profile.full_name,
        amount: payload.amount,
        fee,
        net_amount: netAmount,
        payment_method: payload.payment_method,
        beneficiary_number: payload.beneficiary_number,
        beneficiary_name: payload.beneficiary_name,
        status: 'pending',
      });

      if (witError) return { ok: false, error: witError.message };

      await sb
        .from('profiles')
        .update({ reserved_balance: state.profile.reserved_balance + payload.amount })
        .eq('user_id', state.profile.user_id);

      await sb.from('notifications').insert({
        user_id: state.profile.user_id,
        title: 'Retrait en cours',
        message: `Demande de retrait de ${formatAR(payload.amount)} via ${payload.payment_method} soumise (${formatAR(netAmount)} net).`,
        is_read: false,
      });

      await refreshData();
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Erreur lors de la demande de retrait' };
    }
  };

  const investInPlan = async (planId: string): Promise<ActionResult> => {
    const plan = VIP_PLANS.find((p) => p.id === planId);
    if (!plan) return { ok: false, error: 'Plan introuvable' };
    if (!state.profile) return { ok: false, error: 'Session expirée' };

    const available = state.profile.balance - state.profile.reserved_balance;
    if (available < plan.price) {
      return { ok: false, error: 'Solde disponible insuffisant pour ce niveau VIP' };
    }

    try {
      const sb = getSupabase();
      const now = new Date().toISOString();

      const { error: invError } = await sb.from('investments').insert({
        user_id: state.profile.user_id,
        plan_id: plan.id,
        amount: plan.price,
        status: 'active',
        activated_at: now,
      });
      if (invError) return { ok: false, error: invError.message };

      await sb
        .from('profiles')
        .update({ balance: state.profile.balance - plan.price })
        .eq('user_id', state.profile.user_id);

      await sb.from('transactions').insert({
        user_id: state.profile.user_id,
        type: 'investment',
        amount: -plan.price,
        description: `Activation Portefeuille ${plan.name}`,
      });

      await sb.from('notifications').insert({
        user_id: state.profile.user_id,
        title: `${plan.name} activé`,
        message: `Votre portefeuille ${plan.name} est actif. Accomplissez votre tâche de visionnage quotidienne pour recevoir ${formatAR(plan.daily_task_reward)}.`,
        is_read: false,
      });

      await refreshData();
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Erreur lors de l’activation' };
    }
  };

  const completeDailyTask = async (
    investmentId: string,
    rating: number
  ): Promise<ActionResult> => {
    if (rating < 1 || rating > 5) {
      return { ok: false, error: 'Veuillez attribuer une note de 1 à 5 étoiles' };
    }
    if (!state.profile) return { ok: false, error: 'Session expirée' };

    const inv = state.investments.find((i) => i.id === investmentId);
    if (!inv) return { ok: false, error: 'Investissement introuvable' };
    const plan = VIP_PLANS.find((p) => p.id === inv.plan_id);
    if (!plan) return { ok: false, error: 'Plan introuvable' };

    const lastPaid = state.tasks
      .filter((t) => t.investment_id === investmentId && t.payment_status === 'paid' && t.paid_at)
      .map((t) => new Date(t.paid_at!).getTime());

    if (lastPaid.length > 0 && Date.now() - Math.max(...lastPaid) < 24 * 3600 * 1000) {
      return { ok: false, error: 'Tâche déjà réalisée aujourd’hui' };
    }

    try {
      const sb = getSupabase();
      const now = new Date().toISOString();

      const { error: taskError } = await sb.from('daily_tasks').insert({
        user_id: state.profile.user_id,
        investment_id: investmentId,
        plan_name: plan.name,
        reward: plan.daily_task_reward,
        payment_status: 'paid',
        paid_at: now,
      });
      if (taskError) return { ok: false, error: taskError.message };

      await sb
        .from('profiles')
        .update({
          balance: state.profile.balance + plan.daily_task_reward,
          total_earned: state.profile.total_earned + plan.daily_task_reward,
        })
        .eq('user_id', state.profile.user_id);

      await sb.from('transactions').insert({
        user_id: state.profile.user_id,
        type: 'task_reward',
        amount: plan.daily_task_reward,
        description: `Tâche de visionnage ${plan.name} (Note ${rating}/5)`,
      });

      await refreshData();
      return { ok: true, reward: plan.daily_task_reward };
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Erreur lors de la validation' };
    }
  };

  const markAllNotificationsRead = async () => {
    if (!state.profile) return;
    const sb = getSupabase();
    await sb
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', state.profile.user_id)
      .eq('is_read', false);
    await refreshData();
  };

  const approveDeposit = async (id: string) => {
    const target = state.deposits.find((d) => d.id === id);
    if (!target || target.status !== 'pending') return;

    const sb = getSupabase();
    await sb.from('deposits').update({ status: 'approved' }).eq('id', id);

    const { data: userProfile } = await sb
      .from('profiles')
      .select('balance')
      .eq('user_id', target.user_id)
      .maybeSingle();

    if (userProfile) {
      await sb
        .from('profiles')
        .update({ balance: Number(userProfile.balance) + Number(target.amount) })
        .eq('user_id', target.user_id);
    }

    await sb.from('transactions').insert({
      user_id: target.user_id,
      type: 'deposit',
      amount: target.amount,
      description: `Dépôt ${target.payment_method} validé`,
    });

    await sb.from('notifications').insert({
      user_id: target.user_id,
      title: 'Dépôt validé',
      message: `Votre dépôt de ${formatAR(target.amount)} a été crédité sur votre solde.`,
      is_read: false,
    });

    await refreshData();
  };

  const rejectDeposit = async (id: string) => {
    const sb = getSupabase();
    await sb.from('deposits').update({ status: 'rejected' }).eq('id', id);
    await refreshData();
  };

  const approveWithdrawal = async (id: string) => {
    const target = state.withdrawals.find((w) => w.id === id);
    if (!target || target.status !== 'pending') return;

    const sb = getSupabase();
    await sb.from('withdrawals').update({ status: 'approved' }).eq('id', id);

    const { data: userProfile } = await sb
      .from('profiles')
      .select('balance, reserved_balance')
      .eq('user_id', target.user_id)
      .maybeSingle();

    if (userProfile) {
      await sb
        .from('profiles')
        .update({
          balance: Math.max(0, Number(userProfile.balance) - Number(target.amount)),
          reserved_balance: Math.max(
            0,
            Number(userProfile.reserved_balance) - Number(target.amount)
          ),
        })
        .eq('user_id', target.user_id);
    }

    await sb.from('transactions').insert({
      user_id: target.user_id,
      type: 'withdrawal',
      amount: -target.amount,
      description: `Retrait ${target.payment_method} approuvé`,
    });

    await sb.from('notifications').insert({
      user_id: target.user_id,
      title: 'Retrait approuvé',
      message: `Votre retrait de ${formatAR(target.net_amount)} net a été envoyé via ${target.payment_method}.`,
      is_read: false,
    });

    await refreshData();
  };

  const rejectWithdrawal = async (id: string) => {
    const target = state.withdrawals.find((w) => w.id === id);
    if (!target || target.status !== 'pending') return;

    const sb = getSupabase();
    await sb.from('withdrawals').update({ status: 'rejected' }).eq('id', id);

    const { data: userProfile } = await sb
      .from('profiles')
      .select('reserved_balance')
      .eq('user_id', target.user_id)
      .maybeSingle();

    if (userProfile) {
      await sb
        .from('profiles')
        .update({
          reserved_balance: Math.max(
            0,
            Number(userProfile.reserved_balance) - Number(target.amount)
          ),
        })
        .eq('user_id', target.user_id);
    }

    await refreshData();
  };

  return (
    <PlatformContext.Provider
      value={{
        ...state,
        loginWithPhone,
        signup,
        loginAdmin,
        logout,
        refreshData,
        submitDeposit,
        submitWithdrawal,
        investInPlan,
        completeDailyTask,
        markAllNotificationsRead,
        approveDeposit,
        rejectDeposit,
        approveWithdrawal,
        rejectWithdrawal,
      }}
    >
      {children}
    </PlatformContext.Provider>
  );
}

export function usePlatform() {
  const ctx = useContext(PlatformContext);
  if (!ctx) throw new Error('usePlatform must be used inside PlatformProvider');
  return ctx;
}
