import { supabase } from '@/services/supabaseClient';
import { calculateHash, compressImage, extractColors, validateImage } from '@/utils/imageUtils';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert } from 'react-native';

export interface UploadResult {
    publicUrl: string;
    colors: string[];
    hash: string;
}

export function useImageUpload() {
    const [uploading, setUploading] = useState(false);
    const [localUri, setLocalUri] = useState<string | null>(null);

    const selectImage = async () => {
        // 1. Permissions
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to make this work!');
            return null;
        }

        // 2. Pick
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 1, // We compress manually later to be safe
        });

        if (result.canceled) return null;

        const uri = result.assets[0].uri;

        // 3. Validation
        if (!validateImage(uri)) {
            Alert.alert("Invalid File", "Please select a JPG or PNG image.");
            return null;
        }

        setLocalUri(uri);
        return uri;
    };

    const uploadImage = async (uri: string, userId: string): Promise<UploadResult | null> => {
        setUploading(true);
        try {
            // 1. Process
            const compressed = await compressImage(uri);
            const hash = await calculateHash(compressed.uri);
            const colors = await extractColors(compressed.uri);

            // 2. Upload to Supabase Storage
            // Path: {userId}/{hash}.jpg to prevent dupes naturally or strictly unique?
            // Proposal: user_id/timestamp_hash.jpg
            const filename = `${Date.now()}_${hash.substring(0, 8)}.jpg`;
            const path = `${userId}/${filename}`;

            // Read binary for upload
            // In Expo/RN, FormData works with uri/type/name
            const formData = new FormData();
            formData.append('file', {
                uri: compressed.uri,
                name: filename,
                type: 'image/jpeg',
            } as any);

            const { data, error } = await supabase.storage
                .from('clothing_items') // Ensure bucket exists! (Manual step usually, but code assumes it)
                .upload(path, formData, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) throw error;

            // 3. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('clothing_items')
                .getPublicUrl(path);

            return { publicUrl, colors, hash };

        } catch (error) {
            console.error("Upload failed:", error);
            Alert.alert("Upload Failed", "Could not upload image. Please try again.");
            return null;
        } finally {
            setUploading(false);
        }
    };

    return {
        selectImage,
        uploadImage,
        uploading,
        localUri,
        reset: () => setLocalUri(null)
    };
}
