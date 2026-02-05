import { useAuth } from '@/providers/AuthProvider';
import { useUserStore } from '@/store/useStore';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen(): React.JSX.Element {
    const { credits, tier } = useUserStore();
    const { signOut, user } = useAuth();

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Profile</Text>
            <View style={styles.separator} />
            <Text>Email: {user?.email}</Text>
            <Text>Credits: {credits}</Text>
            <Text>Status: {tier.toUpperCase()}</Text>
            <TouchableOpacity style={styles.signOut} onPress={signOut}>
                <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
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
    signOut: {
        marginTop: 24,
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#2D2D2D',
        borderRadius: 12,
    },
    signOutText: {
        color: '#fff',
        fontWeight: '600'
    }
});
