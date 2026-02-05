import { create } from 'zustand';

interface UserState {
    credits: number;
    tier: 'free' | 'basic' | 'pro';
    isLoading: boolean;
    setCredits: (credits: number) => void;
    incrementCredits: (amount: number) => void;
    decrementCredits: (amount: number) => void;
    setTier: (tier: 'free' | 'basic' | 'pro') => void;
    setIsLoading: (loading: boolean) => void;
}

export const useUserStore = create<UserState>((set) => ({
    credits: 0,
    tier: 'free',
    isLoading: false,
    setCredits: (credits) => set({ credits }),
    incrementCredits: (amount) => set((state) => ({ credits: state.credits + amount })),
    decrementCredits: (amount) => set((state) => ({ credits: state.credits - amount })),
    setTier: (tier) => set({ tier }),
    setIsLoading: (isLoading) => set({ isLoading }),
}));
