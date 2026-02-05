import { OutfitSuggestion } from '@/utils/outfitMatcher';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
    suggestion: OutfitSuggestion;
    onPress?: () => void;
    onSave?: () => void;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.75;

export default function OutfitSuggestionCard({ suggestion, onPress, onSave }: Props) {
    const { items, reason, score } = suggestion;

    return (
        <TouchableOpacity style={styles.container} activeOpacity={0.9} onPress={onPress}>
            <View style={styles.header}>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>Match Score: {score}</Text>
                </View>
                <Text style={styles.reason} numberOfLines={1}>{reason}</Text>
            </View>

            <View style={styles.itemsContainer}>
                {items.slice(0, 3).map((item, index) => (
                    <View key={item.id} style={[styles.imageWrapper, { zIndex: 3 - index, left: index * 40 }]}>
                        <Image source={{ uri: item.image_url || '' }} style={styles.image} />
                    </View>
                ))}
            </View>

            <View style={styles.footer}>
                <Text style={styles.cta}>Wear Today</Text>
                <View style={styles.actions}>
                    <TouchableOpacity style={styles.secondaryBtn} onPress={onSave}>
                        <Text style={styles.secondaryText}>Save</Text>
                    </TouchableOpacity>
                    <View style={styles.circleButton}>
                        <FontAwesome name="arrow-right" size={12} color="white" />
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        width: CARD_WIDTH,
        backgroundColor: '#F3F0EA', // Beige accent
        borderRadius: 20,
        padding: 16,
        marginRight: 16,
        height: 180,
        justifyContent: 'space-between'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    badge: {
        backgroundColor: 'white',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#2D2D2D'
    },
    reason: {
        flex: 1,
        fontSize: 12,
        color: '#666',
        marginLeft: 8,
        textAlign: 'right'
    },
    itemsContainer: {
        flexDirection: 'row',
        height: 80,
        alignItems: 'center',
        paddingLeft: 10
    },
    imageWrapper: {
        width: 60,
        height: 80,
        borderRadius: 8,
        backgroundColor: 'white',
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#F3F0EA',
        position: 'absolute',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    image: {
        width: '100%',
        height: '100%'
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    cta: {
        fontWeight: '600',
        color: '#2D2D2D'
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    circleButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#2D2D2D',
        justifyContent: 'center',
        alignItems: 'center'
    },
    secondaryBtn: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12
    },
    secondaryText: {
        color: '#2D2D2D',
        fontWeight: '600',
        fontSize: 12
    }
});
