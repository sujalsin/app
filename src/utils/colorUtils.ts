// Basic color mapping for harmony calculations
// Normalizing colors to a standard palette
const COLOR_MAP: Record<string, string> = {
    // Neutrals
    black: 'neutral', white: 'neutral', grey: 'neutral', gray: 'neutral',
    beige: 'neutral', tan: 'neutral', khaki: 'neutral', cream: 'neutral',
    navy: 'neutral', denim: 'neutral', jean: 'neutral',

    // Reds
    red: 'red', burgundy: 'red', maroon: 'red', pink: 'red', rose: 'red',

    // Blues
    blue: 'blue', azure: 'blue', teal: 'blue', turquoise: 'blue',

    // Greens
    green: 'green', olive: 'green', forest: 'green', sage: 'green',

    // Yellows/Oranges
    yellow: 'yellow', gold: 'yellow', orange: 'orange', rust: 'orange', coral: 'orange',

    // Purples
    purple: 'purple', violet: 'purple', lavender: 'purple', lilac: 'purple'
};

const COMPLEMENTARY_PAIRS: Record<string, string> = {
    blue: 'orange',
    orange: 'blue',
    red: 'green',
    green: 'red',
    purple: 'yellow',
    yellow: 'purple',
};

export const normalizeColor = (color: string): string => {
    const lowered = color.toLowerCase().trim();
    return COLOR_MAP[lowered] || 'other';
};

export const checkColorHarmony = (colors1: string[], colors2: string[]): number => {
    if (!colors1.length || !colors2.length) return 5; // Neutral start if undefined

    let maxScore = 0;

    for (const c1 of colors1) {
        for (const c2 of colors2) {
            const norm1 = normalizeColor(c1);
            const norm2 = normalizeColor(c2);
            let pScore = 0;

            // 1. Monochromatic
            if (norm1 === norm2) pScore += 8;

            // 2. Neutrals
            if (norm1 === 'neutral' || norm2 === 'neutral') pScore += 6;

            // 3. Complementary
            if (COMPLEMENTARY_PAIRS[norm1] === norm2) pScore += 10;

            // Ensure we don't go over reasonable max per pair, but we take the best pair score
            maxScore = Math.max(maxScore, pScore);
        }
    }

    return maxScore;
};
