import { Database } from '@/types/database.types';
import React from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type ClothingItem = Database['public']['Tables']['clothing_items']['Row'];

interface Props {
    item: ClothingItem;
    onPress?: () => void;
    onLongPress?: () => void;
    width?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_WIDTH = (SCREEN_WIDTH - 48) / 2; // 2 cols with padding

export default function ClothingCard({ item, onPress, onLongPress, width = COLUMN_WIDTH }: Props) {
    const imageUrl = item.image_url || 'https://via.placeholder.com/150';

    // Cost per wear display
    const cost = item.cost_per_wear ? `$${item.cost_per_wear.toFixed(2)}` : '-';

    return (
        <TouchableOpacity
            style={[styles.container, { width }]}
            onPress={onPress}
            onLongPress={onLongPress}
            activeOpacity={0.8}
        >
            <View style={styles.imageContainer}>
                <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />

                {/* Color Dots Overlay */}
                <View style={styles.colorsContainer}>
                    {item.colors && item.colors.slice(0, 3).map((color, index) => (
                        <View key={index} style={[styles.colorDot, { backgroundColor: color, borderColor: 'white', borderWidth: 1 }]} />
                    ))}
                </View>
            </View>

            <View style={styles.info}>
                <Text style={styles.category}>{item.category || 'Item'}</Text>
                <Text style={styles.cpw}>CPW: {cost}</Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        overflow: 'hidden'
    },
    imageContainer: {
        width: '100%',
        aspectRatio: 3 / 4,
        backgroundColor: '#F5F5F5',
        position: 'relative'
    },
    image: {
        width: '100%',
        height: '100%'
    },
    colorsContainer: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        flexDirection: 'row',
        gap: -6 // Overlap slightly
    },
    colorDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    info: {
        padding: 10
    },
    category: {
        fontSize: 12,
        color: '#666',
        textTransform: 'capitalize',
        marginBottom: 2
    },
    cpw: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333'
    }
});
