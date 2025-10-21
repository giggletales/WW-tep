import { supabase } from '../lib/supabase';

export interface SignUpData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  plan_type: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export const authService = {
  async signUp(data: SignUpData) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('User creation failed');

      const uniqueId = Math.floor(100000 + Math.random() * 900000).toString();

      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: authData.user.id,
          unique_id: uniqueId,
          account_type: 'personal',
          risk_tolerance: 'moderate',
          setup_complete: false,
          timezone: 'UTC'
        });

      if (profileError) throw profileError;

      const planDetails = this.getPlanDetails(data.plan_type);

      const { error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: user.id,
          plan_type: data.plan_type,
          plan_name: planDetails.name,
          price: planDetails.price,
          period: planDetails.period,
          status: 'pending',
          features: planDetails.features
        });

      if (subscriptionError) throw subscriptionError;

      return {
        success: true,
        user: {
          id: authData.user.id,
          email: authData.user.email!,
          first_name: data.firstName,
          last_name: data.lastName,
          unique_id: uniqueId,
          plan_type: data.plan_type
        }
      };
    } catch (error: any) {
      console.error('Signup error:', error);
      return {
        success: false,
        error: error.message || 'Registration failed'
      };
    }
  },

  async signIn(data: SignInData) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) throw authError;
      if (!authData.user) {
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', authData.user.id)
        .maybeSingle();

      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', authData.user.id)
        .eq('status', 'active')
        .maybeSingle();

      return {
        success: true,
        user: {
          id: authData.user.id,
          email: authData.user.email!,
          first_name: authData.user.user_metadata?.first_name || '',
          last_name: authData.user.user_metadata?.last_name || '',
          role: 'user',
          profile,
          subscription
        }
      };
    } catch (error: any) {
      console.error('Signin error:', error);
      return {
        success: false,
        error: error.message || 'Login failed'
      };
    }
  },

  async getUserProfile(userId: string) {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) throw userError;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      return {
        success: true,
        user,
        profile,
        subscription
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
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
