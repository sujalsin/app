import { Router } from 'expo-router';

export const showUpgradePrompt = (router: Router) => {
    router.push('/paywall');
};
