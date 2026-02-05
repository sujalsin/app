import { useImageUpload } from '@/hooks/useImageUpload';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import React from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
    onImageSelected: (uri: string) => void;
    onUploadComplete: (result: { publicUrl: string, colors: string[], hash: string }) => void;
    userId: string;
}

export default function ClothingImagePicker({ onImageSelected, onUploadComplete, userId }: Props) {
    const { selectImage, uploadImage, uploading, localUri, reset, errorMessage } = useImageUpload();

    const handlePick = async () => {
        const uri = await selectImage();
        if (uri) {
            onImageSelected(uri);
        }
    };

    const handleUpload = async () => {
        if (!localUri) return;
        const result = await uploadImage(localUri, userId);
        if (result) {
            onUploadComplete(result);
            reset(); // Optional: reset local state if parent handles display
        }
    };

    return (
        <View style={styles.container}>
            {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}
            {!localUri ? (
                <TouchableOpacity style={styles.button} onPress={handlePick}>
                    <FontAwesome name="camera" size={24} color="white" />
                    <Text style={styles.text}>Add Photo</Text>
                </TouchableOpacity>
            ) : (
                <View style={styles.previewContainer}>
                    <Image source={{ uri: localUri }} style={styles.image} />
                    {uploading ? (
                        <View style={styles.overlay}>
                            <ActivityIndicator color="white" size="large" />
                        </View>
                    ) : (
                        <View style={styles.actions}>
                            <TouchableOpacity style={[styles.actionBtn, styles.cancelBtn]} onPress={reset}>
                                <FontAwesome name="times" size={20} color="white" />
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionBtn, styles.confirmBtn]} onPress={handleUpload}>
                                <FontAwesome name="check" size={20} color="white" />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginVertical: 10
    },
    error: {
        color: '#B00020',
        marginBottom: 10,
        fontWeight: '600',
        textAlign: 'center'
    },
    button: {
        backgroundColor: '#333',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10
    },
    text: {
        color: 'white',
        fontWeight: 'bold'
    },
    previewContainer: {
        width: 200,
        height: 200,
        borderRadius: 10,
        overflow: 'hidden',
        position: 'relative'
    },
    image: {
        width: '100%',
        height: '100%'
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    actions: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        flexDirection: 'row',
        gap: 10
    },
    actionBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center'
    },
    confirmBtn: {
        backgroundColor: '#4CAF50'
    },
    cancelBtn: {
        backgroundColor: '#F44336'
    }
});
