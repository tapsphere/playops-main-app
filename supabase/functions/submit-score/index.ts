import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      templateId, 
      customizationId, 
      competencyId, 
      subCompetencyId,
      scoringMetrics,
      gameplayData 
    } = await req.json();

    console.log('Score submission received:', { 
      templateId, 
      customizationId, 
      competencyId, 
      subCompetencyId 
    });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get user from JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      throw new Error('Unauthorized');
    }

    console.log('User authenticated:', user.id);

    // Fetch scoring logic from sub_competency
    const { data: subCompetency, error: subError } = await supabase
      .from('sub_competencies')
      .select('scoring_logic')
      .eq('id', subCompetencyId)
      .single();

    if (subError) {
      console.error('Error fetching sub-competency:', subError);
      throw new Error('Sub-competency not found');
    }

    console.log('Scoring logic:', subCompetency.scoring_logic);

    // Calculate pass/fail based on scoring logic
    const passed = calculatePass(scoringMetrics, subCompetency.scoring_logic);
    const proficiency_level = calculateProficiencyLevel(scoringMetrics, passed);
    
    console.log('Calculated passed:', passed);
    console.log('Calculated proficiency level:', proficiency_level);

    // Insert game result
    const { data: result, error: insertError } = await supabase
      .from('game_results')
      .insert({
        user_id: user.id,
        template_id: templateId,
        customization_id: customizationId,
        competency_id: competencyId,
        sub_competency_id: subCompetencyId,
        scoring_metrics: scoringMetrics,
        passed,
        proficiency_level,
        gameplay_data: gameplayData || {}
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting result:', insertError);
      throw insertError;
    }

    console.log('Result saved successfully');

    let xpToAward = 0;
    let plyoToAward = 0; // Initialize PLYO to award

    if (passed) {
      console.log('Game passed, attempting to award XP and PLYO.');
      plyoToAward = 10; // Award 10 PLYO for a pass

      const { data: competencyData, error: competencyError } = await supabase
        .from('template_competencies')
        .select('competency_name, xp_values')
        .eq('template_id', templateId);

      if (competencyError) {
        console.error('Could not fetch competency for XP award:', competencyError.message);
        xpToAward = 50; // Default to 50 XP on error
      } else if (competencyData && competencyData.length > 0) {
        const firstCompetency = competencyData[0];
        console.log('Fetched competency data for XP award:', firstCompetency);
        if (firstCompetency && firstCompetency.xp_values) {
          xpToAward = (firstCompetency.xp_values as any).pass || 50;
        } else {
          xpToAward = 50;
        }
      } else {
        xpToAward = 50; // Default to 50 XP if no competency is found
      }

      // Now, update the user's profile with the new XP and PLYO
      try {
        // Fetch the user's profile
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('total_xp, total_plyo')
            .eq('user_id', user.id)
            .single();

        // If the profile doesn't exist (PostgREST error code for "Not Found"), create it.
        if (profileError && profileError.code === 'PGRST116') { 
            console.log(`No profile found for user ${user.id}. Creating one.`);
            const { error: createProfileError } = await supabase
                .from('profiles')
                .insert({
                    user_id: user.id,
                    total_xp: xpToAward,
                    total_plyo: plyoToAward
                });

            if (createProfileError) {
                console.error('Failed to create user profile:', createProfileError);
            } else {
                console.log(`Profile created for user ${user.id} with initial points.`);
            }
        } 
        // If the profile exists, update it with the new points.
        else if (profileData) {
            const newTotalXp = (profileData.total_xp || 0) + xpToAward;
            const newTotalPlyo = (profileData.total_plyo || 0) + plyoToAward;

            const { error: updateProfileError } = await supabase
                .from('profiles')
                .update({ total_xp: newTotalXp, total_plyo: newTotalPlyo })
                .eq('user_id', user.id);

            if (updateProfileError) {
                console.error('Failed to update user profile with new totals:', updateProfileError);
            } else {
                console.log(`Profile updated for user ${user.id}. New total_xp: ${newTotalXp}, New total_plyo: ${newTotalPlyo}`);
            }
        } 
        // If there was some other, unexpected error fetching the profile
        else if (profileError) {
            console.error('Failed to fetch user profile for update:', profileError);
        }

      } catch (profileUpdateError) {
        console.error('An error occurred during profile update:', profileUpdateError);
      }

    }

    return new Response(
      JSON.stringify({ 
        success: true,
        result,
        passed,
        xpAwarded: xpToAward,
        message: passed ? 'Great job! You passed this sub-competency!' : 'Keep practicing to improve your score.'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in submit-score function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Calculate proficiency level based on accuracy
function calculateProficiencyLevel(metrics: any, passed: boolean): string {
  if (!passed) {
    return 'needs_work';
  }

  const accuracy = metrics.accuracy || 0;

  if (accuracy >= 95) {
    return 'mastery';
  } else if (accuracy >= 60) { // Grouping intermediate and advanced into proficient
    return 'proficient';
  } else {
    return 'needs_work';
  }
}

// Calculate pass/fail based on black-and-white scoring logic
function calculatePass(metrics: any, scoringLogic: any): boolean {
  if (!scoringLogic || !scoringLogic.rules || scoringLogic.rules.length === 0) {
    // Fallback: if no scoring logic, require 80% accuracy
    console.log('Using fallback scoring logic based on accuracy.');
    return (metrics.accuracy || 0) >= 80;
  }

  const { rules, logic = 'AND' } = scoringLogic;

  // Check if all required metrics for the rules exist in the submitted metrics
  const requiredMetricsExist = rules.every((rule: any) => metrics.hasOwnProperty(rule.metric));
  if (!requiredMetricsExist) {
    console.warn('Scoring logic metrics mismatch. Falling back to accuracy-based scoring.');
    return (metrics.accuracy || 0) >= 80;
  }

  const results = rules.map((rule: any) => {
    const { metric, operator, threshold, type, relativeMetric } = rule;
    let value = metrics[metric];

    // Handle percentage type
    if (type === 'percentage' && relativeMetric) {
      const total = metrics[relativeMetric] || 1;
      value = total > 0 ? value / total : 0;
    }

    // Apply operator
    switch (operator) {
      case '>=':
        return value >= threshold;
      case '<=':
        return value <= threshold;
      case '>':
        return value > threshold;
      case '<':
        return value < threshold;
      case '==':
      case '===':
        return value === threshold;
      default:
        console.warn(`Unknown operator: ${operator}`);
        return false;
    }
  });

  // Combine results based on logic
  return logic === 'OR' 
    ? results.some((r: boolean) => r)
    : results.every((r: boolean) => r);
}
