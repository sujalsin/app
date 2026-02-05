import { Alert } from 'react-native';

// Not a visual component but a helper function to standardise the prompt
// Or could be a Modal context.
// For MVP, we'll export a helper function that triggers navigation.

export const showUpgradePrompt = (router: any) => {
    Alert.alert(
        "Out of Credits",
        "You've used all your credits! Upgrade to Pro for more, or buy a booster pack.",
        [
            { text: "Cancel", style: "cancel" },
            { text: "Get More", onPress: () => router.push('/paywall') }
        ]
    );
};
