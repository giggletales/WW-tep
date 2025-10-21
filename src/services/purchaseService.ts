import { supabase } from '../lib/supabase';
import emailService from './emailService';

export interface CreatePurchaseData {
  userId: string;
  planType: string;
  planName: string;
  amount: number;
  paymentMethod: 'stripe' | 'paypal' | 'crypto';
  transactionId?: string;
  paymentDetails?: Record<string, any>;
}

export const purchaseService = {
  async createPurchase(data: CreatePurchaseData) {
    try {
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          user_id: data.userId,
          plan_type: data.planType,
          plan_name: data.planName,
          amount: data.amount,
          currency: 'USD',
          payment_method: data.paymentMethod,
          payment_status: 'completed',
          transaction_id: data.transactionId,
          payment_details: data.paymentDetails,
          completed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      return { success: true, purchase };
    } catch (error: any) {
      console.error('Create purchase error:', error);
      return { success: false, error: error.message };
    }
  },

  async activateSubscription(userId: string, planType: string) {
    try {
      const planDetails = this.getPlanDetails(planType);

      const expiresAt = new Date();
      if (planType === 'enterprise') {
        expiresAt.setMonth(expiresAt.getMonth() + 3);
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      }

      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'active',
          started_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString()
        })
        .eq('user_id', userId)
        .eq('plan_type', planType);

      if (updateError) throw updateError;

      return { success: true };
    } catch (error: any) {
      console.error('Activate subscription error:', error);
      return { success: false, error: error.message };
    }
  },

  async processPurchaseAndNotify(data: CreatePurchaseData & {
    userEmail: string;
    userName: string;
    features: string[];
  }) {
    try {
      const purchaseResult = await this.createPurchase(data);
      if (!purchaseResult.success) {
        return purchaseResult;
      }

      await this.activateSubscription(data.userId, data.planType);

      await emailService.sendPaymentSuccessEmail(
        data.userEmail,
        data.userName,
        data.amount,
        data.planName,
        data.transactionId || 'N/A',
        data.userId,
        data.features
      );

      return { success: true, purchase: purchaseResult.purchase };
    } catch (error: any) {
      console.error('Process purchase error:', error);
      return { success: false, error: error.message };
    }
  },

  async getAdminNotifications(includeRead: boolean = false) {
    try {
      let query = supabase
        .from('admin_notifications')
        .select(`
          *,
          users:related_user_id (
            email,
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false });

      if (!includeRead) {
        query = query.eq('is_read', false);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, notifications: data };
    } catch (error: any) {
      console.error('Get notifications error:', error);
      return { success: false, error: error.message };
    }
  },

  async markNotificationAsRead(notificationId: string) {
    try {
      const { error } = await supabase
        .from('admin_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Mark notification as read error:', error);
      return { success: false, error: error.message };
    }
  },

  getPlanDetails(planType: string) {
    const plans: Record<string, any> = {
      kickstarter: {
        name: 'Kickstarter',
        price: 0,
        period: 'month',
        features: [
          'Risk management plan for 1 month',
          'Trading signals for 1 week',
          'Standard risk management calculator',
          'Phase tracking dashboard',
          '3 prop firm rule analyzer'
        ]
      },
      starter: {
        name: 'Starter',
        price: 99,
        period: 'month',
        features: [
          'Risk management plan for 1 month',
          'Trading signals for 1 month',
          'Standard risk management calculator',
          'Phase tracking dashboard',
          '5 prop firm rule analyzer',
          'Email support',
          'Auto lot size calculator'
        ]
      },
      pro: {
        name: 'Pro',
        price: 199,
        period: 'month',
        features: [
          'Risk management plan for 1 month',
          'Trading signals for 1 month',
          'Standard risk management calculator',
          'Phase tracking dashboard',
          '15 prop firm rule analyzer',
          'Priority chat and email support',
          'Auto lot size calculator',
          'Access to private community',
          'Multi account tracker',
          'Advanced trading journal',
          'Backtesting tools'
        ]
      },
      enterprise: {
        name: 'Enterprise',
        price: 499,
        period: '3 months',
        features: [
          'Risk management plan for 3 months',
          'Trading signals for 3 months',
          'Standard risk management calculator',
          'Phase tracking dashboard',
          '15 prop firm rule analyzer',
          '24/7 priority support',
          'Auto lot size calculator',
          'Access to private community',
          'Multi account tracker',
          'Advanced trading journal',
          'Professional backtesting suite',
          'Chart analysis tools'
        ]
      }
    };

    return plans[planType] || plans.starter;
  }
};

export default purchaseService;
