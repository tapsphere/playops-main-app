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
    
    console.log('Calculated passed:', passed);

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
        gameplay_data: gameplayData || {}
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting result:', insertError);
      throw insertError;
    }

    console.log('Result saved successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        result,
        passed,
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

// Calculate pass/fail based on black-and-white scoring logic
function calculatePass(metrics: any, scoringLogic: any): boolean {
  if (!scoringLogic || !scoringLogic.rules) {
    // Fallback: if no scoring logic, require 80% accuracy
    return (metrics.accuracy || 0) >= 80;
  }

  // Example scoring logic structure:
  // {
  //   "rules": [
  //     { "metric": "constraints_met", "operator": ">=", "threshold": 0.9, "type": "percentage" },
  //     { "metric": "solve_time_ms", "operator": "<=", "threshold": 90000 }
  //   ],
  //   "logic": "AND" // or "OR"
  // }

  const { rules, logic = 'AND' } = scoringLogic;

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
