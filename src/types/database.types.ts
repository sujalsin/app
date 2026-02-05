export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    email: string | null
                    tier: 'free' | 'basic' | 'pro'
                    credits_remaining: number
                    credits_reset_date: string
                    total_generations: number
                    updated_at: string
                }
                Insert: {
                    id: string
                    email?: string | null
                    tier?: 'free' | 'basic' | 'pro'
                    credits_remaining?: number
                    credits_reset_date?: string
                    total_generations?: number
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string | null
                    tier?: 'free' | 'basic' | 'pro'
                    credits_remaining?: number
                    credits_reset_date?: string
                    total_generations?: number
                    updated_at?: string
                }
            }
            clothing_items: {
                Row: {
                    id: string
                    user_id: string
                    image_url: string
                    category: 'top' | 'bottom' | 'dress' | 'shoes' | 'accessory'
                    colors: string[]
                    tags: string[]
                    occasions: string[]
                    last_worn: string | null
                    cost_per_wear: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    image_url: string
                    category: 'top' | 'bottom' | 'dress' | 'shoes' | 'accessory'
                    colors?: string[]
                    tags?: string[]
                    occasions?: string[]
                    last_worn?: string | null
                    cost_per_wear?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    image_url?: string
                    category?: 'top' | 'bottom' | 'dress' | 'shoes' | 'accessory'
                    colors?: string[]
                    tags?: string[]
                    occasions?: string[]
                    last_worn?: string | null
                    cost_per_wear?: number
                    created_at?: string
                }
            }
            outfits: {
                Row: {
                    id: string
                    user_id: string
                    items: string[]
                    occasion: string | null
                    worn_count: number
                    rating: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    items: string[]
                    occasion?: string | null
                    worn_count?: number
                    rating?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    items?: string[]
                    occasion?: string | null
                    worn_count?: number
                    rating?: number
                    created_at?: string
                }
            }
            generation_logs: {
                Row: {
                    id: string
                    user_id: string
                    type: 'tryon' | 'outfit'
                    cost_to_user: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    type: 'tryon' | 'outfit'
                    cost_to_user?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    type?: 'tryon' | 'outfit'
                    cost_to_user?: number
                    created_at?: string
                }
            }
        }
    }
}
