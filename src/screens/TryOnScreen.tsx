import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function TryOnScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Virtual Try-On</Text>
            <View style={styles.separator} />
            <Text>See how clothes look on you.</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    separator: {
        marginVertical: 30,
        height: 1,
        width: '80%',
        backgroundColor: '#eee',
    },
});
