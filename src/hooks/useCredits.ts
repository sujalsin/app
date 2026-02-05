import { CreditService } from '@/services/creditService';
import { supabase } from '@/services/supabaseClient';
import { useUserStore } from '@/store/useStore';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

type GenerationType = 'tryon' | 'outfit';

export function useCredits() {
    const { credits, tier, setCredits, setTier, incrementCredits, decrementCredits } = useUserStore();
    const [isProcessing, setIsProcessing] = useState(false);

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
            console.error('Failed to refresh credits:', error);
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
            // Trigger Upgrade Flow
            Alert.alert(
                "Out of Credits",
                "You have used all your generation credits. Upgrade to Pro for more!",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Upgrade", onPress: () => console.log('Navigate to subscription') } // TODO: Navigation
                ]
            );
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
            console.error("Task failed, rolling back credit:", error);

            // 6. Rollback
            incrementCredits(1); // Local Revert
            await CreditService.refundCredit(user.id, type); // Server Revert

            Alert.alert("Error", "Something went wrong. Your credit has been refunded.");
            return null; // OR throw error depending on desired UX
        } finally {
            setIsProcessing(false);
        }
    }, [credits, isProcessing, decrementCredits, incrementCredits]);

    return {
        credits,
        tier,
        isProcessing,
        refreshCredits,
        useCredit
    };
}
