import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/services/supabaseClient';
import { Database } from '@/types/database.types';
import { generateOutfits, GeneratorConstraints } from '@/utils/outfitMatcher';
import { useQuery } from '@tanstack/react-query';

type ClothingItem = Database['public']['Tables']['clothing_items']['Row'];

export function useOutfitGenerator(constraints: GeneratorConstraints = {}) {
    const { user } = useAuth();
    // Fetch All Items
    const { data: inventory, isLoading, error } = useQuery({
        queryKey: ['clothing_items', user?.id],
        queryFn: async () => {
            if (!user) return [];
            const { data, error } = await supabase
                .from('clothing_items')
                .select('*')
                .eq('user_id', user.id);

            if (error) throw error;
            return data as ClothingItem[];
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        enabled: Boolean(user)
    });

    // Generate Suggestions
    // We memoize or just run generic logic. 
    // Since inventory can be large, might want to memoize calculation, 
    // but for <1000 items it's fast enough to run on render or useQuery select.

    // Let's use a derived query or just compute effectively.
    const suggestions = inventory
        ? generateOutfits(inventory, constraints)
        : [];

    return {
        suggestions,
        isLoading,
        error,
        inventoryCount: inventory?.length || 0
    };
}
