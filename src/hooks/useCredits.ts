import { CreditService } from '@/services/creditService';
import { supabase } from '@/services/supabaseClient';
import { useUserStore } from '@/store/useStore';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';

type GenerationType = 'tryon' | 'outfit';

export function useCredits() {
    const { credits, tier, setCredits, setTier, incrementCredits, decrementCredits } = useUserStore();
    const [isProcessing, setIsProcessing] = useState(false);
    const [lastMessage, setLastMessage] = useState<string | null>(null);
    const router = useRouter();

    // Sync with DB
    const refreshCredits = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        try {
            const data = await CreditService.getCreditStatus(user.id);
            if (data) {
                setCredits(data.credits_remaining);
                setTier(data.tier);
            }
        } catch (error) {
            console.debug('Failed to refresh credits:', error);
        }
    }, [setCredits, setTier]);

    // Main Action Executor
    const useCredit = useCallback(async <T>(
        task: () => Promise<T>,
        type: GenerationType
    ): Promise<T | null> => {
        // 1. Double-click protection
        if (isProcessing) return null;

        // 2. Check Local State First
        if (credits <= 0) {
            setLastMessage("Out of credits. Upgrade to continue.");
            router.push('/paywall');
            return null;
        }

        setIsProcessing(true);

        // 3. Optimistic Deduction
        decrementCredits(1);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setIsProcessing(false);
            incrementCredits(1); // Revert
            return null;
        }

        try {
            // 4. Server Deduction
            const success = await CreditService.deductCredit(user.id, type);
            if (!success) {
                throw new Error("Failed to deduct credit on server");
            }

            // 5. Run the actual task
            const result = await task();
            return result;

        } catch (error) {
            console.debug("Task failed, rolling back credit:", error);

            // 6. Rollback
            incrementCredits(1); // Local Revert
            await CreditService.refundCredit(user.id, type); // Server Revert
            setLastMessage("Something went wrong. Your credit was refunded.");
            return null; // OR throw error depending on desired UX
        } finally {
            setIsProcessing(false);
        }
    }, [credits, isProcessing, decrementCredits, incrementCredits, router]);

    return {
        credits,
        tier,
        isProcessing,
        lastMessage,
        refreshCredits,
        useCredit
    };
}
