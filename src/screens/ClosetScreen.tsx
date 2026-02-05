import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ClothingCard from '@/components/ClothingCard';
import ClothingImagePicker from '@/components/ClothingImagePicker';
import CreditBadge from '@/components/CreditBadge';
import OutfitSuggestionCard from '@/components/OutfitSuggestionCard';
import StatsCard from '@/components/StatsCard';

import { useOutfitGenerator } from '@/hooks/useOutfitGenerator';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/services/supabaseClient';
import { useUserStore } from '@/store/useStore';
import { Database } from '@/types/database.types';
import { OutfitSuggestion } from '@/utils/outfitMatcher';
import { getTagValue, incrementTagInt, parseMoneyUSD } from '@/utils/tagUtils';
import { useQueryClient } from '@tanstack/react-query';

type ClothingItem = Database['public']['Tables']['clothing_items']['Row'];

export default function ClosetScreen(): React.JSX.Element {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [pickerVisible, setPickerVisible] = useState(false);
    const { user } = useAuth();
    const { tier } = useUserStore();
    const [category, setCategory] = useState<ClothingItem['category']>('top');
    const [price, setPrice] = useState<string>('');
    const [size, setSize] = useState<string>('');
    const [colorPreview, setColorPreview] = useState<string[]>([]);
    const [limitMessage, setLimitMessage] = useState<string | null>(null);
    const [totalOutfits, setTotalOutfits] = useState<number>(0);
    const [utilization, setUtilization] = useState<number>(0);

    // Existing Hooks
    const { suggestions, isLoading: loadingOutfits, inventoryCount, error, suggestions: outfitSuggestions } = useOutfitGenerator();

    const [inventory, setInventory] = useState<ClothingItem[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    // Fetch Inventory
    // Using React Query "useQuery" directly here to share cache key 'clothing_items'
    // Simplified check:
    const { data: clothingItems, refetch } = {
        data: queryClient.getQueryData(['clothing_items']) as ClothingItem[] | undefined || [],
        refetch: () => queryClient.invalidateQueries({ queryKey: ['clothing_items'] })
    };

    // Actually, I'll just use the `inventory` derived from a direct call for now.
    React.useEffect(() => {
        fetchInventory();
    }, [user]);

    const fetchInventory = async () => {
        if (!user) return;
        const { data, error: fetchError } = await supabase
            .from('clothing_items')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
        if (fetchError) {
            console.debug('Failed to load closet', fetchError);
            return;
        }
        if (data) setInventory(data);

        // Stats: outfits count
        const outfitsRes = await supabase
            .from('outfits')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id);
        setTotalOutfits(outfitsRes.count ?? 0);

        // Stats: utilization (% worn in last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const wornRecently = (data ?? []).filter((i) => i.last_worn && new Date(i.last_worn) > thirtyDaysAgo).length;
        const util = (data ?? []).length > 0 ? Math.round((wornRecently / (data ?? []).length) * 100) : 0;
        setUtilization(util);
    };

    const wearSuggestion = async (suggestion: OutfitSuggestion) => {
        if (!user) return;
        const now = new Date().toISOString();
        await Promise.all(
            suggestion.items.map(async (item) => {
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
        await onRefresh();
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([refetch(), fetchInventory()]);
        setRefreshing(false);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.logo}>Capsule</Text>
                    <Text style={styles.greeting}>Good Morning</Text>
                </View>
                <View style={styles.headerRight}>
                    <CreditBadge />
                    <TouchableOpacity onPress={() => router.push('/profile')}>
                        <View style={styles.avatarPlaceholder} />
                    </TouchableOpacity>
                </View>
            </View>

            {limitMessage && (
                <View style={{ backgroundColor: '#FFF4E5', padding: 12, marginHorizontal: 24, borderRadius: 12, marginTop: 8 }}>
                    <Text style={{ color: '#8C5600', fontWeight: '600' }}>{limitMessage}</Text>
                </View>
            )}

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Stats */}
                <StatsCard totalItems={inventory.length} totalOutfits={totalOutfits} utilization={utilization} />

                {/* Suggestions */}
                {suggestions.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>For You</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
                            {suggestions.map((outfit, index) => (
                                <OutfitSuggestionCard key={index} suggestion={outfit} onPress={() => wearSuggestion(outfit)} />
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Grid */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Your Closet</Text>
                    {inventory.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>Start your capsule wardrobe.</Text>
                            <Text style={styles.emptySub}>Add your first 5 items.</Text>
                        </View>
                    ) : (
                        <View style={styles.grid}>
                            {inventory.map((item) => (
                                <ClothingCard key={item.id} item={item} />
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* FAB */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => {
                    if (tier === 'free' && inventory.length >= 30) {
                        setLimitMessage('Free tier limit reached (30 items). Upgrade to add more.');
                        return;
                    }
                    setPickerVisible(true);
                }}
            >
                <FontAwesome name="plus" size={24} color="white" />
            </TouchableOpacity>

            {/* Upload Modal */}
            <Modal visible={pickerVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Add New Item</Text>
                        {user && (
                            <ClothingImagePicker
                                userId={user.id}
                                onImageSelected={() => { }}
                                onUploadComplete={async (res) => {
                                    setColorPreview(res.colors);
                                    const tags: string[] = [];
                                    if (size) tags.push(`size:${size}`);
                                    const priceUSD = parseMoneyUSD(price);
                                    if (priceUSD !== null) tags.push(`price:${priceUSD}`);
                                    tags.push('wears:0');

                                    await supabase.from('clothing_items').insert({
                                        user_id: user.id,
                                        image_url: res.publicUrl,
                                        colors: res.colors,
                                        category,
                                        tags,
                                        cost_per_wear: 0
                                    });
                                    setPickerVisible(false);
                                    setCategory('top');
                                    setPrice('');
                                    setSize('');
                                    setColorPreview([]);
                                    onRefresh();
                                }}
                            />
                        )}
                        <View style={{ marginTop: 16 }}>
                            <Text style={{ fontWeight: '600', marginBottom: 8 }}>Category</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                                {['top', 'bottom', 'dress', 'shoes', 'accessory'].map((cat) => (
                                    <TouchableOpacity
                                        key={cat}
                                        style={[
                                            styles.chip,
                                            category === cat ? styles.chipActive : styles.chipInactive
                                        ]}
                                        onPress={() => setCategory(cat as ClothingItem['category'])}
                                    >
                                        <Text style={category === cat ? styles.chipTextActive : styles.chipTextInactive}>
                                            {cat}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={{ marginTop: 16 }}>
                            <Text style={{ fontWeight: '600', marginBottom: 8 }}>Metadata</Text>
                            <TextInput
                                placeholder="Size (e.g., S/M/L or 27)"
                                value={size}
                                onChangeText={setSize}
                                style={styles.input}
                            />
                            <TextInput
                                placeholder="Price paid (USD)"
                                value={price}
                                onChangeText={setPrice}
                                keyboardType="numeric"
                                style={styles.input}
                            />
                        </View>

                        {colorPreview.length > 0 && (
                            <View style={{ marginTop: 12 }}>
                                <Text style={{ fontWeight: '600', marginBottom: 8 }}>Detected Colors</Text>
                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                    {colorPreview.map((c) => (
                                        <View key={c} style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: c, borderWidth: 1, borderColor: '#ddd' }} />
                                    ))}
                                </View>
                            </View>
                        )}
                        <TouchableOpacity style={styles.closeBtn} onPress={() => setPickerVisible(false)}>
                            <Text>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9F9F5', // Cream
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    logo: {
        fontSize: 24,
        fontWeight: 'bold',
        fontFamily: 'serif',
        color: '#2D2D2D'
    },
    greeting: {
        fontSize: 14,
        color: '#888'
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    avatarPlaceholder: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#E0E0E0'
    },
    scrollContent: {
        paddingBottom: 100
    },
    section: {
        marginBottom: 32,
        paddingHorizontal: 24
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
        color: '#2D2D2D'
    },
    carousel: {
        paddingRight: 24
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between'
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#E0E0E0',
        borderStyle: 'dashed',
        borderRadius: 16
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4
    },
    emptySub: {
        color: '#888'
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#2D2D2D',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end'
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        minHeight: 300
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 24,
        textAlign: 'center'
    },
    closeBtn: {
        marginTop: 24,
        alignItems: 'center',
        padding: 12
    },
    chip: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 16,
        borderWidth: 1
    },
    chipActive: {
        backgroundColor: '#2D2D2D',
        borderColor: '#2D2D2D',
    },
    chipInactive: {
        backgroundColor: '#fff',
        borderColor: '#E0E0E0'
    },
    chipTextActive: {
        color: '#fff',
        fontWeight: '600'
    },
    chipTextInactive: {
        color: '#2D2D2D',
        fontWeight: '500'
    },
    input: {
        backgroundColor: '#F4F4F0',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        marginBottom: 8
    }
});
