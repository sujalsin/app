import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
    try {
        const now = new Date().toISOString();

        // 1. Fetch profiles due for reset
        const { data: profiles, error: fetchError } = await supabase
            .from('profiles')
            .select('id, tier, credits_reset_date')
            .lt('credits_reset_date', now);

        if (fetchError) throw fetchError;

        if (!profiles || profiles.length === 0) {
            return new Response(JSON.stringify({ message: 'No profiles to reset' }), {
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const updates = profiles.map((profile) => {
            let newCredits = 0;
            if (profile.tier === 'basic') newCredits = 20;
            if (profile.tier === 'pro') newCredits = 50;
            // Free tier gets 0 credits, or maybe we keep it 0.

            // Calculate next reset date (one month from now)
            const nextReset = new Date();
            nextReset.setMonth(nextReset.getMonth() + 1);

            return {
                id: profile.id,
                credits_remaining: newCredits,
                credits_reset_date: nextReset.toISOString(),
            };
        });

        // 2. Perform bulk update (using upsert matching on ID)
        const { error: updateError } = await supabase
            .from('profiles')
            .upsert(updates);

        if (updateError) throw updateError;

        return new Response(
            JSON.stringify({
                message: `Reset credits for ${profiles.length} users`,
                profiles_updated: profiles.map(p => p.id),
            }),
            { headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
});
