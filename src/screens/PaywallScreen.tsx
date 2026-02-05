import { useRevenueCat } from '@/hooks/useRevenueCat';
import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PurchasesPackage } from 'react-native-purchases';

export default function PaywallScreen() {
    const { currentOffering, purchasePackage, restorePurchases, isPurchasing } = useRevenueCat();
    const router = useRouter();

    const handlePurchase = async (pack: PurchasesPackage) => {
        await purchasePackage(pack);
        // On success, we could auto-close, but useRevenueCat handles logic.
        // Maybe we want to close if logic implies success?
        // For now, user can manually close.
    };

    if (!currentOffering) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <Text style={styles.title}>Upgrade Your Wardrobe</Text>
                <Text style={styles.subtitle}>Unlock detailed analytics, more generations, and premium features.</Text>
            </View>

            <View style={styles.packages}>
                {currentOffering.availablePackages.map((pack) => (
                    <TouchableOpacity key={pack.identifier} style={styles.card} onPress={() => handlePurchase(pack)} disabled={isPurchasing}>
                        <View>
                            <Text style={styles.packTitle}>{pack.product.title}</Text>
                            <Text style={styles.packDesc}>{pack.product.description}</Text>
                        </View>
                        <View style={styles.priceContainer}>
                            <Text style={styles.price}>{pack.product.priceString}</Text>
                            {/* Assuming monthly logic for simpler display */}
                            <Text style={styles.period}>{pack.product.subscriptionPeriod || 'One-time'}</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>

            <TouchableOpacity onPress={restorePurchases} style={styles.restoreBtn} disabled={isPurchasing}>
                <Text style={styles.restoreText}>Restore Purchases</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
                <Text style={styles.closeText}>Maybe Later</Text>
            </TouchableOpacity>

            {isPurchasing && (
                <View style={styles.overlay}>
                    <ActivityIndicator color="white" size="large" />
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    content: {
        padding: 24,
        paddingTop: 60
    },
    header: {
        marginBottom: 40,
        alignItems: 'center'
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 12
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24
    },
    packages: {
        gap: 16,
        marginBottom: 32
    },
    card: {
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 12,
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FAFAFA'
    },
    packTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4
    },
    packDesc: {
        fontSize: 14,
        color: '#666',
        maxWidth: 200
    },
    priceContainer: {
        alignItems: 'flex-end'
    },
    price: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#007AFF'
    },
    period: {
        fontSize: 12,
        color: '#999'
    },
    restoreBtn: {
        alignItems: 'center',
        marginBottom: 16
    },
    restoreText: {
        color: '#666',
        textDecorationLine: 'underline'
    },
    closeBtn: {
        alignItems: 'center'
    },
    closeText: {
        color: '#999',
        fontWeight: '500'
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center'
    }
});
