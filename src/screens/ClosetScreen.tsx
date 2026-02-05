import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ClothingCard from '@/components/ClothingCard';
import ClothingImagePicker from '@/components/ClothingImagePicker';
import CreditBadge from '@/components/CreditBadge';
import OutfitSuggestionCard from '@/components/OutfitSuggestionCard';
import StatsCard from '@/components/StatsCard';

import { useOutfitGenerator } from '@/hooks/useOutfitGenerator';
import { supabase } from '@/services/supabaseClient';
import { useQueryClient } from '@tanstack/react-query';

export default function ClosetScreen() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [pickerVisible, setPickerVisible] = useState(false);

    // Existing Hooks
    const { suggestions, isLoading: loadingOutfits, inventoryCount, error, suggestions: outfitSuggestions } = useOutfitGenerator();

    const [inventory, setInventory] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    // Fetch Inventory
    // Using React Query "useQuery" directly here to share cache key 'clothing_items'
    // Simplified check:
    const { data: clothingItems, refetch } = {
        data: queryClient.getQueryData(['clothing_items']) as any[] | undefined || [],
        refetch: () => queryClient.invalidateQueries({ queryKey: ['clothing_items'] })
    };

    // Actually, I'll just use the `inventory` derived from a direct call for now.
    React.useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        const { data } = await supabase.from('clothing_items').select('*').order('created_at', { ascending: false });
        if (data) setInventory(data);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([refetch(), fetchInventory()]);
        setRefreshing(false);
    };

    const userId = "TODO_USER_ID"; // We need actual user ID.
    const [uid, setUid] = useState<string | null>(null);

    React.useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setUid(data.user?.id || null));
    }, []);

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

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Stats */}
                <StatsCard totalItems={inventory.length} totalOutfits={12} utilization={80} />

                {/* Suggestions */}
                {suggestions.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>For You</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
                            {suggestions.map((outfit, index) => (
                                <OutfitSuggestionCard key={index} suggestion={outfit} />
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
            <TouchableOpacity style={styles.fab} onPress={() => setPickerVisible(true)}>
                <FontAwesome name="plus" size={24} color="white" />
            </TouchableOpacity>

            {/* Upload Modal */}
            <Modal visible={pickerVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Add New Item</Text>
                        {uid && (
                            <ClothingImagePicker
                                userId={uid}
                                onImageSelected={() => { }}
                                onUploadComplete={async (res) => {
                                    // Determine category?
                                    // For now just insert generic.
                                    await supabase.from('clothing_items').insert({
                                        user_id: uid,
                                        image_url: res.publicUrl,
                                        colors: res.colors,
                                        category: 'top' // Default
                                    });
                                    setPickerVisible(false);
                                    onRefresh();
                                }}
                            />
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
    }
});
