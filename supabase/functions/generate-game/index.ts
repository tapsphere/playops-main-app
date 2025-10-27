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
    const { templatePrompt, primaryColor, secondaryColor, logoUrl, customizationId, previewMode, subCompetencies } = await req.json();
    
    console.log('Generating game with params:', { templatePrompt, primaryColor, secondaryColor, logoUrl, customizationId, previewMode, subCompetencies });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Create the prompt for game generation
    let scoringInstructions = '';
    if (subCompetencies && subCompetencies.length > 0) {
      scoringInstructions = `

SCORING INTEGRATION (CRITICAL):
The game must capture these metrics and send them to the backend at the end:

${subCompetencies.map((sc: any, index: number) => `
Sub-Competency ${index + 1}: ${sc.statement}
Required Metrics: ${JSON.stringify(sc.backend_data_captured || [])}
Scoring Logic: ${JSON.stringify(sc.scoring_logic || {})}
`).join('\n')}

CRITICAL: At the moment the game ends and the final score is displayed, you MUST automatically call the submitScore function. This is not optional. The user should not have to click anything to submit their score.

\`\`\`javascript
async function submitScore(metrics) {
  const response = await fetch('${Deno.env.get('SUPABASE_URL')}/functions/v1/submit-score', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + (localStorage.getItem('supabase.auth.token') || '')
    },
    body: JSON.stringify({
      templateId: '${customizationId}',
      customizationId: '${customizationId}',
      competencyId: '${subCompetencies[0]?.competency_id || ''}',
      subCompetencyId: '${subCompetencies[0]?.id || ''}',
      scoringMetrics: metrics,
      gameplayData: { /* optional extra data */ }
    })
  });
  const result = await response.json();
  console.log('Score submitted:', result);
  return result;
}
\`\`\`

The metrics object MUST include all required fields from backend_data_captured.
`;
    }

    let logoInstructions = '';
    if (logoUrl) {
      logoInstructions = `

BRAND LOGO INTEGRATION (REQUIRED):
The brand's logo MUST be displayed in the game UI.
Logo URL: ${logoUrl}

Include this HTML in the game:
\`\`\`html
<div style="position: fixed; top: 10px; right: 10px; z-index: 9999; background: white; padding: 8px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
  <img src="${logoUrl}" alt="Brand Logo" style="height: 40px; width: auto; display: block;" />
</div>
\`\`\`
`;
    }

    const systemPrompt = `You are an expert game developer. Generate a complete, playable HTML5 game based on the template description and brand customization.

CRITICAL REQUIREMENTS:
1. Return ONLY valid HTML - a complete, self-contained HTML file
2. Include ALL JavaScript and CSS inline within the HTML
3. The game must be fully functional and playable
4. Use the brand colors provided: primary=${primaryColor}, secondary=${secondaryColor}
5. Make it responsive and mobile-friendly
6. Include clear instructions for the player
7. Add scoring/feedback mechanisms
8. Use modern, clean design
${scoringInstructions}
${logoInstructions}

OUTPUT FORMAT:
Return ONLY the HTML code, nothing else. No markdown, no explanations, just pure HTML.`;

    const userPrompt = `Create a game based on this template:
${templatePrompt}

Brand Customization:
- Primary Color: ${primaryColor}
- Secondary Color: ${secondaryColor}
${logoUrl ? `- Brand Logo: ${logoUrl}` : ''}

Generate a complete, playable HTML5 game that matches this description and uses these brand colors.`;

    console.log('Calling Lovable AI...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 1.0,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error(`AI generation failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('AI response received');
    
    let generatedHtml = data.choices[0].message.content;

    // Clean up the response - remove markdown code blocks if present
    generatedHtml = generatedHtml.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();

    console.log('Generated HTML length:', generatedHtml.length);

    // If preview mode, return HTML without saving
    if (previewMode) {
      console.log('Preview mode - returning HTML without saving');
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Game preview generated',
          html: generatedHtml
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Save the generated HTML to the database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Saving to database...');

    const { error: updateError } = await supabase
      .from('brand_customizations')
      .update({ generated_game_html: generatedHtml })
      .eq('id', customizationId);

    if (updateError) {
      console.error('Database update error:', updateError);
      throw updateError;
    }

    console.log('Game generated successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Game generated successfully',
        htmlLength: generatedHtml.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in generate-game function:', error);
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
