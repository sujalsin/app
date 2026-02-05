import OutfitSuggestionCard from '@/components/OutfitSuggestionCard';
import { useOutfitGenerator } from '@/hooks/useOutfitGenerator';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/services/supabaseClient';
import { GeneratorConstraints } from '@/utils/outfitMatcher';
import { getTagValue, incrementTagInt, parseMoneyUSD } from '@/utils/tagUtils';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function OutfitScreen(): React.JSX.Element {
    const [constraints, setConstraints] = useState<GeneratorConstraints>({});
    const [status, setStatus] = useState<string | null>(null);
    const { suggestions, isLoading } = useOutfitGenerator(constraints);
    const { user } = useAuth();

    const saveOutfit = async (index: number) => {
        if (!user) return;
        const outfit = suggestions[index];
        await supabase.from('outfits').insert({
            user_id: user.id,
            items: outfit.items.map(i => i.id),
            occasion: constraints.occasion ?? null
        });
        setStatus('Saved to your outfits.');
    };

    const wearToday = async (index: number) => {
        if (!user) return;
        const outfit = suggestions[index];
        const now = new Date().toISOString();
        await Promise.all(
            outfit.items.map(async (item) => {
                const { tags: nextTags, value: wears } = incrementTagInt(item.tags, 'wears', 1, 0);
                const priceStr = getTagValue(nextTags, 'price');
                const price = parseMoneyUSD(priceStr ?? null);
                const cpw = price !== null && wears > 0 ? Number((price / wears).toFixed(2)) : item.cost_per_wear ?? 0;

                await supabase
                    .from('clothing_items')
                    .update({ last_worn: now, tags: nextTags, cost_per_wear: cpw })
                    .eq('id', item.id);
            }),
        );
        setStatus('Marked as worn today.');
    };

    const setOccasion = (occasion: string | undefined) => {
        setConstraints((prev) => ({ ...prev, occasion }));
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Rule-Based Outfit Engine</Text>
            <Text style={styles.subtitle}>Color harmony + silhouette balance</Text>

            <View style={styles.filters}>
                {['casual', 'work', 'evening', undefined].map((occ) => (
                    <TouchableOpacity
                        key={occ ?? 'any'}
                        style={[
                            styles.filterChip,
                            constraints.occasion === occ ? styles.filterChipActive : styles.filterChipInactive
                        ]}
                        onPress={() => setOccasion(occ)}
                    >
                        <Text style={constraints.occasion === occ ? styles.filterTextActive : styles.filterText}>{occ ?? 'Any occasion'}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {isLoading ? (
                <ActivityIndicator />
            ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 16, gap: 16 }}>
                    {suggestions.map((suggestion, idx) => (
                        <OutfitSuggestionCard
                            key={idx}
                            suggestion={suggestion}
                            onPress={() => wearToday(idx)}
                            onSave={() => saveOutfit(idx)}
                        />
                    ))}
                </ScrollView>
            )}
            {status && <Text style={styles.status}>{status}</Text>}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 24,
        backgroundColor: '#F9F9F5'
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#2D2D2D'
    },
    subtitle: {
        color: '#666',
        marginBottom: 12
    },
    filters: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 8
    },
    filterChip: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1
    },
    filterChipActive: {
        backgroundColor: '#2D2D2D',
        borderColor: '#2D2D2D'
    },
    filterChipInactive: {
        backgroundColor: '#fff',
        borderColor: '#E0E0E0'
    },
    filterTextActive: {
        color: '#fff',
        fontWeight: '700'
    },
    filterText: {
        color: '#2D2D2D',
        fontWeight: '600'
    },
    status: {
        marginTop: 12,
        color: '#2D2D2D',
        fontWeight: '600'
    }
});
