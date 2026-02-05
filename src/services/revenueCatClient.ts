import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';

export const configurePurchases = () => {
    const apiKey = Platform.select({
        ios: process.env.EXPO_PUBLIC_RC_IOS_API_KEY,
        android: process.env.EXPO_PUBLIC_RC_ANDROID_API_KEY,
    });

    if (apiKey) {
        Purchases.configure({ apiKey });
    }
};
