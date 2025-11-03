import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', 
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CRITIQUE_CHECKS = [
  { name: "endGame() called", regex: /endGame\s*\(\s*\)/, negate: false },
  { name: "submitScore() called", regex: /submitScore\s*\(/, negate: false },
  { name: "metrics object with accuracy", regex: /(?:const|let|var)\s+metrics\s*=\s*{[^}]*accuracy/i, negate: false },
  { name: "metrics object with time_taken", regex: /(?:const|let|var)\s+metrics\s*=\s*{[^}]*time_taken/i, negate: false },
  { name: "metrics object with final_score", regex: /(?:const|let|var)\s+metrics\s*=\s*{[^}]*final_score/i, negate: false },
  { name: "gameplayData object created", regex: /(?:const|let|var)\s+gameplayData\s*=\s*{/i, negate: false },
  { name: "submit button with id=submit-btn", regex: /id\s*=\s*["']submit-btn["']/i, negate: false },
  { name: "NO replay/restart logic", regex: /(play\s+again|restart|replay)\s*(?:button|btn|game)/i, negate: true },
  { name: "NO submitScore function definition", regex: /function\s+submitScore\s*\(|(?:const|let|var)\s+submitScore\s*=\s*function/i, negate: true }
];

const SUBMISSION_SCRIPT = `
  // Injected submission function - DO NOT EDIT
  function submitScore(metrics, gameplayData, level) {
    const payload = {
      type: "gameSubmit",
      payload: {
        scoringMetrics: metrics,
        gameplayData: gameplayData || {}
      }
    };
    window.parent.postMessage(payload, "*");
    
    const overlay = document.createElement("div");
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.9);display:flex;align-items:center;justify-content:center;z-index:9999;";
    overlay.innerHTML = "<div style='padding:2rem;background:#111;border:2px solid #00A3FF;color:#fff;border-radius:12px;font-size:1.2rem;'>Submitting…</div>";
    document.body.appendChild(overlay);
  }
`;

function validateGeneratedGame(html: string): { passed: boolean; failedChecks: string[] } {
  const failedChecks: string[] = [];
  
  for (const check of CRITIQUE_CHECKS) {
    const matches = check.regex.test(html);
    const shouldPass = check.negate ? !matches : matches;
    
    if (!shouldPass) {
      failedChecks.push(check.name);
    }
  }
  
  return {
    passed: failedChecks.length === 0,
    failedChecks
  };
}

function injectSubmissionScript(html: string): string {
  // Find the closing </script> tag before </body> or the last </script>
  const scriptClosePattern = /<\/script>/g;
  const matches = [...html.matchAll(scriptClosePattern)];
  
  if (matches.length === 0) {
    // No script tag found, append before </body>
    return html.replace(/<\/body>/i, `${SUBMISSION_SCRIPT}\n</body>`);
  }
  
  // Inject before the last </script> tag
  const lastMatch = matches[matches.length - 1];
  const insertIndex = lastMatch.index! + lastMatch[0].length;
  
  return html.slice(0, insertIndex) + SUBMISSION_SCRIPT + html.slice(insertIndex);
}

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

At game completion, you MUST:
1. Create a \`metrics\` object with these EXACT fields:
   - accuracy: number (percentage 0-100)
   - time_taken: number (seconds)
   - final_score: number
   
2. Create a \`gameplayData\` object with any additional game state data (can be empty object {} if no extra data)

3. Calculate proficiency level (e.g., 'beginner', 'intermediate', 'proficient', 'mastery') based on metrics

4. Call submitScore(metrics, gameplayData, proficiencyLevel) 
   - DO NOT define submitScore function - it will be injected automatically
   - The function signature is: submitScore(metrics, gameplayData, level)

5. Include a button with id="submit-btn" that triggers the submission

6. In your endGame() function, show an end screen with the submit button

Example structure:
\`\`\`javascript
function endGame() {
  // Calculate metrics
  const metrics = {
    accuracy: (correct / total) * 100,
    time_taken: elapsedSeconds,
    final_score: currentScore
  };
  
  const gameplayData = {
    // Your game-specific data here
  };
  
  // Show end screen with submit button
  // Button click: submitScore(metrics, gameplayData, 'proficient');
}
\`\`\`

CRITICAL: Never define submitScore yourself. Only call it. The function will be automatically injected.

The metrics object MUST include all required fields from backend_data_captured.
    }

    let logoInstructions = '';
    if (logoUrl) {
      logoInstructions = `

BRAND LOGO INTEGRATION (REQUIRED):
The brand's logo MUST be displayed in the game UI.
Logo URL: ${logoUrl}

Include this HTML in the game:
    
      <div style="position: fixed; top: 10px; right: 10px; z-index: 9999; background: white; padding: 8px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
        <img src="${logoUrl}" alt="Brand Logo" style="height: 40px; width: auto; display: block;" />
      </div>
    
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

    // Generation loop with validation and auto-regeneration
    const MAX_ATTEMPTS = 2;
    let generatedHtml = '';
    let attempt = 0;
    let validationResult = { passed: false, failedChecks: [] as string[] };

    while (attempt < MAX_ATTEMPTS && !validationResult.passed) {
      attempt++;
      console.log(`Generation attempt ${attempt}/${MAX_ATTEMPTS}`);
      
      // Build prompt with corrective feedback if this is a retry
      let currentSystemPrompt = systemPrompt;
      let currentUserPrompt = userPrompt;
      
      if (attempt > 1) {
        const failedList = validationResult.failedChecks.join(', ');
        const correctiveMessage = `

CRITICAL FIX REQUIRED:
Your previous game failed these validation checks: ${failedList}

You MUST fix these issues:
${validationResult.failedChecks.map(check => `- ${check}`).join('\n')}

CRITICAL REQUIREMENTS:
- endGame() must create \`metrics\` object with: accuracy, time_taken, final_score
- endGame() must create \`gameplayData\` object
- endGame() must call submitScore(metrics, gameplayData, level)
- Include a button with id="submit-btn" that triggers submitScore
- submitScore function will handle postMessage automatically (do not call postMessage directly)
- DO NOT define submitScore function (only call it)
- NO "Play Again", "Restart", or replay buttons/logic

Return ONLY the corrected HTML.`;

        currentSystemPrompt = systemPrompt + correctiveMessage;
        currentUserPrompt = userPrompt + correctiveMessage;
      }

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
            { role: 'system', content: currentSystemPrompt },
            { role: 'user', content: currentUserPrompt }
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
      console.log(`AI response received (attempt ${attempt})`);
    
      generatedHtml = data.choices[0].message.content;

    // Clean up the response - remove markdown code blocks if present
    generatedHtml = generatedHtml.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();

      console.log(`Generated HTML length: ${generatedHtml.length}`);
      
      // Validate
      validationResult = validateGeneratedGame(generatedHtml);
      console.log(`Validation attempt ${attempt}:`, validationResult.passed ? 'PASSED' : 'FAILED', validationResult.failedChecks);
    }

    // If validation failed after max attempts, throw error
    if (!validationResult.passed) {
      const failedList = validationResult.failedChecks.join(', ');
      throw new Error(`Game generation failed validation after ${MAX_ATTEMPTS} attempts. Failed checks: ${failedList}`);
    }

    // Inject submitScore function
    generatedHtml = injectSubmissionScript(generatedHtml);
    console.log('submitScore function injected successfully');

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
