import { CreditService } from '@/services/creditService';
import { supabase } from '@/services/supabaseClient';
import { useUserStore } from '@/store/useStore';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import Purchases, { CustomerInfo, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';

export function useRevenueCat() {
    const [currentOffering, setCurrentOffering] = useState<PurchasesOffering | null>(null);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const { setTier, setCredits } = useUserStore();

    useEffect(() => {
        loadOfferings();
        syncSubscriptionStatus();
    }, []);

    const loadOfferings = async () => {
        try {
            const offerings = await Purchases.getOfferings();
            if (offerings.current) {
                setCurrentOffering(offerings.current);
            }
        } catch (e) {
            console.error('Error fetching offerings:', e);
        }
    };

    const syncSubscriptionStatus = async () => {
        try {
            const customerInfo = await Purchases.getCustomerInfo();
            await handleCustomerInfo(customerInfo);
        } catch (e) {
            console.error('Sync failed:', e);
        }
    };

    const handleCustomerInfo = async (info: CustomerInfo) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Check Entitlements
        // Assumes Entitlement identifiers: 'pro', 'basic'
        // Prioritize Pro
        let tier: 'free' | 'basic' | 'pro' = 'free';

        if (info.entitlements.active['pro']) {
            tier = 'pro';
        } else if (info.entitlements.active['basic']) {
            tier = 'basic';
        }

        // Check DB status to avoid redundant writes? 
        // Or just always write to ensure sync?
        // Let's check store state or DB first.
        const dbStatus = await CreditService.getCreditStatus(user.id);

        // If DB thinks free but RC thinks paid -> Upgrade
        // If DB thinks paid but RC thinks free -> Downgrade (expiration)
        if (dbStatus && dbStatus.tier !== tier) {
            console.log(`Syncing tier: ${dbStatus.tier} -> ${tier}`);
            await CreditService.updateSubscription(user.id, tier);

            // Update local store
            setTier(tier);
            // Refresh credits from DB after update (as updateSubscription resets them)
            const newStatus = await CreditService.getCreditStatus(user.id);
            if (newStatus) setCredits(newStatus.credits_remaining);
        }
    };

    const purchasePackage = async (pack: PurchasesPackage) => {
        setIsPurchasing(true);
        try {
            const { customerInfo } = await Purchases.purchasePackage(pack);

            // Handle Consumables (Booster)
            // If identifier contains 'booster', manually add credits.
            // RevenueCat doesn't automatically track "consumable count" in entitlements usually, 
            // unless configured as Non-Renewing Subscription or just Consumable IAP.
            // We rely on the transaction affecting us.
            if (pack.product.identifier.includes('booster')) {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    await CreditService.addCredits(user.id, 10);
                    const status = await CreditService.getCreditStatus(user.id);
                    if (status) setCredits(status.credits_remaining);
                    Alert.alert("Success", "10 credits added!");
                }
            } else {
                // Subscription
                await handleCustomerInfo(customerInfo);
            }

        } catch (e: any) {
            if (!e.userCancelled) {
                Alert.alert('Purchase Error', e.message);
            }
        } finally {
            setIsPurchasing(false);
        }
    };

    const restorePurchases = async () => {
        setIsPurchasing(true);
        try {
            const customerInfo = await Purchases.restorePurchases();
            await handleCustomerInfo(customerInfo);
            Alert.alert("Restore Successful", "Your purchases have been restored.");
        } catch (e: any) {
            Alert.alert('Restore Error', e.message);
        } finally {
            setIsPurchasing(false);
        }
    };

    return {
        currentOffering,
        purchasePackage,
        restorePurchases,
        isPurchasing
    };
}
