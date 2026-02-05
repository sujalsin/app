import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

export const validateImage = (uri: string): boolean => {
    const validExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    const ext = uri.split('.').pop()?.toLowerCase();

    if (!ext || !validExtensions.includes(ext)) {
        return false;
    }
    return true;
};

export const compressImage = async (uri: string): Promise<ImageManipulator.ImageResult> => {
    return await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1024 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );
};

export const calculateHash = async (uri: string): Promise<string> => {
    // Read file as Base64 then hash it. 
    // Ideally stream it but Expo Crypto helper DigestStringAsync works on string.
    const content = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
    const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, content);
    return hash;
};

export const extractColors = async (uri: string): Promise<string[]> => {
    // Resize to tiny thumbnail
    const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 50, height: 50 } }],
        { base64: true, format: ImageManipulator.SaveFormat.JPEG }
    );

    // Simplistic extraction: Just return 3 placeholder colors or randoms if we can't parse pixels easily in JS without a canvas.
    // Real implementation requires pixel access.
    // We will return mock colors deterministically based on hash for now, OR simplistic logic if we had pixel access.
    // Since we don't have Canvas in standard RN without WebView, let's mock the "extraction" 
    // or assume we use a library like 'react-native-image-colors' in a real app.
    // For this constraint, I'll return a stub.

    return ['#000000', '#FFFFFF', '#808080'];
};

export const convertImageToBase64 = async (uri: string): Promise<string> => {
    // Check if remote or local
    if (uri.startsWith('http')) {
        const response = await fetch(uri);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                const base64Data = base64.split(',')[1];
                resolve(base64Data);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } else {
        return await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
    }
};
