import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import ClothingCard from '@/components/ClothingCard';
import { useCredits } from '@/hooks/useCredits';
import { useAuth } from '@/providers/AuthProvider';
import { NanoBananaApi } from '@/services/nanoBananaApi';
import { supabase } from '@/services/supabaseClient';
import { useUserStore } from '@/store/useStore';
import { Database } from '@/types/database.types';
import { useQuery } from '@tanstack/react-query';

type ClothingItem = Database['public']['Tables']['clothing_items']['Row'];

export default function TryOnScreen(): React.JSX.Element {
    const { useCredit, credits } = useCredits();
    const { user } = useAuth();
    const [userPhoto, setUserPhoto] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [status, setStatus] = useState<string | null>(null);
    const { tier } = useUserStore();

    const { data: items, isLoading } = useQuery({
        queryKey: ['clothing_items_tryon', user?.id],
        queryFn: async () => {
            if (!user) return [];
            const { data, error } = await supabase.from('clothing_items').select('*').eq('user_id', user.id);
            if (error) throw error;
            return data as ClothingItem[];
        },
        enabled: Boolean(user)
    });

    const pickUserPhoto = async () => {
        const { status: perm } = await ImagePicker.requestCameraPermissionsAsync();
        if (perm !== 'granted') {
            setStatus('Camera permission is required.');
            return;
        }
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8
        });
        if (result.canceled) return;
        setUserPhoto(result.assets[0].uri);
    };

    const generateTryOn = async () => {
        if (!userPhoto || !selectedItem) {
            setStatus('Select a selfie and a clothing item.');
            return;
        }
        setStatus('Generating...');
        const generated = await useCredit(async () => {
            return await NanoBananaApi.generateTryOn(userPhoto, selectedItem.id);
        }, 'tryon');
        if (generated) {
            setResultUrl(generated);
            setStatus('Ready');
        } else {
            setStatus('Failed to generate. Try again.');
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Virtual Try-On</Text>
            <Text style={styles.subtitle}>
                {tier === 'free' ? '3 lifetime credits' : `${credits} credits remaining`}
            </Text>

            <View style={styles.section}>
                <Text style={styles.label}>1. Capture a selfie</Text>
                <TouchableOpacity style={styles.capture} onPress={pickUserPhoto}>
                    <FontAwesome name="camera" size={20} color="white" />
                    <Text style={styles.captureText}>{userPhoto ? 'Retake Photo' : 'Capture Photo'}</Text>
                </TouchableOpacity>
                {userPhoto && <Image source={{ uri: userPhoto }} style={styles.preview} />}
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>2. Choose an item</Text>
                {isLoading ? (
                    <ActivityIndicator />
                ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                        {items?.map((item) => (
                            <TouchableOpacity key={item.id} onPress={() => setSelectedItem(item)}>
                                <ClothingCard item={item} width={140} />
                                {selectedItem?.id === item.id && <Text style={styles.selectedTag}>Selected</Text>}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>3. Generate</Text>
                <TouchableOpacity style={styles.generateBtn} onPress={generateTryOn}>
                    <Text style={styles.generateText}>Use 1 Credit</Text>
                </TouchableOpacity>
                {status && <Text style={styles.status}>{status}</Text>}
                {resultUrl && (
                    <View style={{ marginTop: 12 }}>
                        <Text style={styles.label}>Result</Text>
                        <Image source={{ uri: resultUrl }} style={styles.resultImage} />
                    </View>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 24,
        backgroundColor: '#F9F9F5',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 4,
        color: '#2D2D2D'
    },
    subtitle: {
        color: '#666',
        marginBottom: 16
    },
    section: {
        marginBottom: 24
    },
    label: {
        fontWeight: '700',
        marginBottom: 8,
        color: '#2D2D2D'
    },
    capture: {
        backgroundColor: '#2D2D2D',
        padding: 12,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        alignSelf: 'flex-start'
    },
    captureText: {
        color: '#fff',
        fontWeight: '600'
    },
    preview: {
        width: '100%',
        height: 220,
        borderRadius: 16,
        marginTop: 10
    },
    generateBtn: {
        backgroundColor: '#2D2D2D',
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center'
    },
    generateText: {
        color: '#fff',
        fontWeight: '700'
    },
    status: {
        marginTop: 8,
        color: '#666'
    },
    resultImage: {
        width: '100%',
        height: 260,
        borderRadius: 18,
        marginTop: 8
    },
    selectedTag: {
        textAlign: 'center',
        marginTop: 6,
        fontWeight: '600',
        color: '#2D2D2D'
    }
});
