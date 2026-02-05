import { supabase } from './supabaseClient';

type GenerationType = 'tryon' | 'outfit';

export const CreditService = {
    async maybeResetMonthlyCredits(userId: string): Promise<void> {
        const { data, error } = await supabase
            .from('profiles')
            .select('tier, credits_reset_date')
            .eq('id', userId)
            .single();

        if (error || !data) return;
        if (data.tier === 'free') return;

        const lastReset = new Date(data.credits_reset_date);
        const now = new Date();
        const monthDiff = (now.getFullYear() - lastReset.getFullYear()) * 12 + (now.getMonth() - lastReset.getMonth());
        if (monthDiff < 1) return;

        const credits = data.tier === 'basic' ? 20 : 50;
        await supabase
            .from('profiles')
            .update({ credits_remaining: credits, credits_reset_date: now.toISOString() })
            .eq('id', userId);
    },
    // Check if user has enough credits and return status
    async checkCredits(userId: string): Promise<boolean> {
        const { data, error } = await supabase
            .from('profiles')
            .select('credits_remaining')
            .eq('id', userId)
            .single();

        if (error) {
            console.debug('Error checking credits:', error);
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
            console.debug('Deduction failed:', e);
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
            console.debug('Refund failed:', e);
        }
    },

    async getCreditStatus(userId: string) {
        await this.maybeResetMonthlyCredits(userId);
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
            console.debug('Add credits failed:', e);
            return false;
        }
    },

    async updateSubscription(userId: string, tier: 'free' | 'basic' | 'pro'): Promise<boolean> {
        try {
            // Determine credit reset values
            let credits = 0;
            if (tier === 'basic') credits = 20;
            if (tier === 'pro') credits = 50;

            const updates: {
                tier: 'free' | 'basic' | 'pro';
                credits_remaining?: number;
                credits_reset_date?: string;
            } = { tier };

            if (tier !== 'free') {
                updates.credits_remaining = credits;
                updates.credits_reset_date = new Date().toISOString();
            }

            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', userId);

            if (error) throw error;
            return true;
        } catch (e) {
            console.debug('Subscription update failed:', e);
            return false;
        }
    }
};
