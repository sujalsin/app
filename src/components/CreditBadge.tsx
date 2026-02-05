import { useUserStore } from '@/store/useStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CreditBadge() {
    const { credits, tier } = useUserStore();
    const router = useRouter();

    const handlePress = () => {
        // Navigate to Paywall or Upgrade screen
        // Assuming we might have a route for it or modal.
        // For now, let's assume we navigate to a 'paywall' route or similar.
        // Ideally, we pass a prop or use a global modal manager.
        // Let's navigate to a modal screen.
        router.push('/paywall'); // We need to create this route!
    };

    const getBadgeColor = () => {
        if (tier === 'pro') return '#FFD700'; // Gold
        if (tier === 'basic') return '#C0C0C0'; // Silver
        return '#E0E0E0'; // Grey
    };

    return (
        <TouchableOpacity onPress={handlePress} style={[styles.container, { backgroundColor: getBadgeColor() }]}>
            <FontAwesome name="bolt" size={14} color="#333" />
            <Text style={styles.text}>{credits}</Text>
            {tier === 'free' && <View style={styles.plus}><FontAwesome name="plus" size={10} color="white" /></View>}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 16,
        gap: 12,
    },
    text: {
        fontWeight: 'bold',
        color: '#333',
        fontSize: 14,
        marginLeft: 4
    },
    plus: {
        backgroundColor: '#007AFF',
        borderRadius: 8,
        width: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 4
    }
});
