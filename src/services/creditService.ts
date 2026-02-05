import { supabase } from './supabaseClient';

type GenerationType = 'tryon' | 'outfit';

export const CreditService = {
    // Check if user has enough credits and return status
    async checkCredits(userId: string): Promise<boolean> {
        const { data, error } = await supabase
            .from('profiles')
            .select('credits_remaining')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error checking credits:', error);
            return false;
        }

        return (data?.credits_remaining ?? 0) > 0;
    },

    // Atomic-like deduction: Update Profile + Insert Log
    async deductCredit(userId: string, type: GenerationType): Promise<boolean> {
        // 1. Decrement profile credits safely
        // Note: We are optimistically relying on the hook check, but at DB level we should ideally have a check constraint or stored proc.
        // For simplicity/Supabase JS, we do a decremented update.

        // Using an RPC would be safer for race conditions, but standard update works for MVP if we check count approx.
        // Let's use an RPC if we had one, but we don't.
        // We will do a direct update decrement.

        try {
            // Fetch current to ensure > 0 (double check)
            const { data: profile, error: readError } = await supabase.from('profiles').select('credits_remaining').eq('id', userId).single();
            if (readError || !profile || profile.credits_remaining < 1) return false;

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ credits_remaining: profile.credits_remaining - 1 })
                .eq('id', userId);

            if (updateError) throw updateError;

            // Log the generation
            await supabase.from('generation_logs').insert({
                user_id: userId,
                type: type,
                cost_to_user: 1
            });

            return true;
        } catch (e) {
            console.error('Deduction failed:', e);
            return false;
        }
    },

    // Rollback in case of failure
    async refundCredit(userId: string, type: GenerationType): Promise<void> {
        try {
            const { data: profile } = await supabase.from('profiles').select('credits_remaining').eq('id', userId).single();
            if (profile) {
                await supabase
                    .from('profiles')
                    .update({ credits_remaining: profile.credits_remaining + 1 })
                    .eq('id', userId);

                // Allow logging the refund or deleting the log? 
                // Better to delete the latest log for this user/type if created recently, 
                // but for MVP we just increment credits back.
            }
        } catch (e) {
            console.error('Refund failed:', e);
        }
    },

    async getCreditStatus(userId: string) {
        const { data, error } = await supabase
            .from('profiles')
            .select('credits_remaining, tier, credits_reset_date')
            .eq('id', userId)
            .single();

        if (error) throw error;
        return data;
    },

    async addCredits(userId: string, amount: number): Promise<boolean> {
        try {
            const { data: profile } = await supabase.from('profiles').select('credits_remaining').eq('id', userId).single();
            if (!profile) return false;

            const { error } = await supabase
                .from('profiles')
                .update({ credits_remaining: profile.credits_remaining + amount })
                .eq('id', userId);

            if (error) throw error;
            return true;
        } catch (e) {
            console.error('Add credits failed:', e);
            return false;
        }
    },

    async updateSubscription(userId: string, tier: 'free' | 'basic' | 'pro'): Promise<boolean> {
        try {
            // Determine credit reset values
            let credits = 0;
            if (tier === 'basic') credits = 20;
            if (tier === 'pro') credits = 50;
            // If downgrading to free, we don't necessarily reset credits to 0 immediately unless expiration logic dictates. 
            // Usually we keep them until month end? 
            // "Subscription expiration -> downgrade to free tier" 
            // "On purchase: update ... immediately"

            // If upgrading/purchasing, we give the monthly allowance immediately.
            const updates: any = { tier };

            // If moving to paid tier, reset credits and date
            if (tier !== 'free') {
                updates.credits_remaining = credits;
                updates.credits_reset_date = new Date().toISOString();
                // We assume next reset is handled by cron looking at this date + 1 month
            }

            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', userId);

            if (error) throw error;
            return true;
        } catch (e) {
            console.error('Subscription update failed:', e);
            return false;
        }
    }
};
