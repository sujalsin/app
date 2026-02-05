import { Database } from '@/types/database.types';
import { checkColorHarmony } from './colorUtils';

type ClothingItem = Database['public']['Tables']['clothing_items']['Row'];

export interface OutfitSuggestion {
    items: ClothingItem[];
    score: number;
    reason: string;
}

export interface GeneratorConstraints {
    occasion?: string;
    minTemp?: number;
    maxTemp?: number;
}

export const generateOutfits = (
    allInventory: ClothingItem[],
    constraints: GeneratorConstraints = {}
): OutfitSuggestion[] => {
    // 1. Separate by Category
    const tops = allInventory.filter(i => i.category === 'top' || i.category === 'dress');
    const bottoms = allInventory.filter(i => i.category === 'bottom');
    const shoes = allInventory.filter(i => i.category === 'shoes');
    // Accessories optional for now, can add later

    const suggestions: OutfitSuggestion[] = [];

    // 2. Iterate Combinations
    // A. Tops + Bottoms + Shoes
    // B. Dresses + Shoes

    // Helper to score a combination
    const scoreCombination = (comboItems: ClothingItem[]): OutfitSuggestion => {
        let score = 0;
        const reasons: string[] = [];

        // --- Rules ---

        // 1. Rotation Check (Exclude worn in last 3 days)
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        const recentlyWorn = comboItems.some(i => i.last_worn && new Date(i.last_worn) > threeDaysAgo);

        if (recentlyWorn) {
            score -= 10;
            reasons.push("Recently worn");
        }

        // 2. Color Harmony
        // Top <-> Bottom
        // Top <-> Shoes
        // Bottom <-> Shoes
        let colorScore = 0;
        if (comboItems.length >= 2) {
            // Just pairwise check for simplicity
            const c1 = checkColorHarmony(comboItems[0].colors || [], comboItems[1].colors || []);
            colorScore += c1;

            if (comboItems.length > 2) {
                const c2 = checkColorHarmony(comboItems[1].colors || [], comboItems[2].colors || []);
                colorScore += c2;
            }
        }

        if (colorScore > 10) {
            score += 10;
            reasons.push("Great color harmony");
        } else if (colorScore > 5) {
            score += 5;
        }

        // 3. Occasion Matching
        if (constraints.occasion) {
            const matchCount = comboItems.filter(i => i.occasions?.includes(constraints.occasion!)).length;
            if (matchCount === comboItems.length) {
                score += 5;
                reasons.push(`Perfect for ${constraints.occasion}`);
            } else if (matchCount > 0) {
                score += 2;
            }
        }

        // 4. Silhouette Balance (Tag based)
        // loose top + fitted bottom = good
        // crop top + high waist = good
        const top = comboItems.find(i => i.category === 'top');
        const bottom = comboItems.find(i => i.category === 'bottom');

        if (top && bottom) {
            const topTags = top.tags || [];
            const botTags = bottom.tags || [];

            if (topTags.includes('oversized') && botTags.includes('fitted')) {
                score += 5;
                reasons.push("Balanced silhouette (Volume + Fitted)");
            }
            if (topTags.includes('cropped') && botTags.includes('high-waist')) {
                score += 5;
                reasons.push("Modern proportions (Crop + High Waist)");
            }
        }

        // Final Touch
        return {
            items: comboItems,
            score,
            reason: reasons.join('. ') || "Good classic combo"
        };
    };

    // Generate Permutations

    // A. Top + Bottom + Shoes
    tops.forEach(top => {
        if (top.category === 'dress') return; // Handled separately

        bottoms.forEach(bottom => {
            shoes.forEach(shoe => {
                suggestions.push(scoreCombination([top, bottom, shoe]));
            });
        });
    });

    // B. Dresses + Shoes
    tops.filter(t => t.category === 'dress').forEach(dress => {
        shoes.forEach(shoe => {
            suggestions.push(scoreCombination([dress, shoe]));
        });
    });

    // 3. Sort & Filter
    return suggestions
        .sort((a, b) => b.score - a.score)
        .slice(0, 5); // Return top 5
};
