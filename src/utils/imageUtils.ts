import { Buffer } from 'buffer';
import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import jpeg from 'jpeg-js';

const colorCache: Record<string, string[]> = {};
const DEFAULT_COLORS = ['#000000', '#FFFFFF', '#808080'];

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
    if (colorCache[uri]) return colorCache[uri];

    try {
        // Resize small to reduce processing cost
        const result = await ImageManipulator.manipulateAsync(
            uri,
            [{ resize: { width: 64, height: 64 } }],
            { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );

        const base64 = await FileSystem.readAsStringAsync(result.uri, { encoding: 'base64' });
        const bytes = Buffer.from(base64, 'base64');
        const decoded = jpeg.decode(bytes, { useTArray: true });

        if (!decoded || !decoded.data) {
            return DEFAULT_COLORS;
        }

        const colorCounts = new Map<string, number>();
        const step = Math.max(1, Math.floor((decoded.width * decoded.height) / 5000));

        for (let i = 0; i < decoded.data.length; i += 4 * step) {
            const r = decoded.data[i];
            const g = decoded.data[i + 1];
            const b = decoded.data[i + 2];

            // Simple quantization to reduce color noise
            const qr = Math.round(r / 32) * 32;
            const qg = Math.round(g / 32) * 32;
            const qb = Math.round(b / 32) * 32;
            const hex = `#${qr.toString(16).padStart(2, '0')}${qg.toString(16).padStart(2, '0')}${qb.toString(16).padStart(2, '0')}`;

            colorCounts.set(hex, (colorCounts.get(hex) || 0) + 1);
        }

        const palette = Array.from(colorCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([hex]) => hex);

        colorCache[uri] = palette.length ? palette : DEFAULT_COLORS;
        return colorCache[uri];
    } catch (error) {
        console.debug('Color extraction failed', error);
        return DEFAULT_COLORS;
    }
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
