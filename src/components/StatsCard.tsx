import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
    totalItems: number;
    totalOutfits?: number;
    utilization?: number;
}

export default function StatsCard({ totalItems, totalOutfits = 0, utilization = 0 }: Props) {
    return (
        <View style={styles.container}>
            <View style={styles.stat}>
                <Text style={styles.value}>{totalItems}</Text>
                <Text style={styles.label}>Items</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.stat}>
                <Text style={styles.value}>{totalOutfits}</Text>
                <Text style={styles.label}>Outfits</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.stat}>
                <Text style={styles.value}>{utilization}%</Text>
                <Text style={styles.label}>Utilized</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    stat: {
        alignItems: 'center',
        flex: 1
    },
    divider: {
        width: 1,
        height: 24,
        backgroundColor: '#EEEEEE'
    },
    value: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2D2D2D',
        marginBottom: 4
    },
    label: {
        fontSize: 12,
        color: '#888',
        letterSpacing: 0.5
    }
});
