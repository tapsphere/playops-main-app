import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();
    
    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user (optional - can work without auth for demo)
    let userId = null;
    let userContext = '';
    
    if (token) {
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        userId = user.id;
        
        // Fetch user profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        const { data: skills } = await supabase
          .from('user_skills')
          .select('*')
          .eq('user_id', user.id);

        const { data: preferences } = await supabase
          .from('work_preferences')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        // Build context for ARIA
        userContext = `
User Profile:
- Name: ${profile?.full_name || 'Nitin'}
- Location: ${profile?.location || 'Not specified'}
- Bio: ${profile?.bio || 'Not specified'}

Skills & Competencies:
${skills && skills.length > 0 
  ? skills.map(s => `- ${s.skill_name} (${s.skill_level}) - Earned from: ${s.earned_from}, XP: ${s.xp_earned}`).join('\n')
  : '- No skills recorded yet. Suggest earning skills from brand stores and programs.'}

Work Preferences:
- Work Type: ${preferences?.work_type?.join(', ') || 'remote, in-person, hybrid'}
- Preferred Industries: ${preferences?.preferred_industries?.join(', ') || 'Not specified'}
- Preferred Locations: ${preferences?.preferred_locations?.join(', ') || 'Flexible'}
- Salary Range: ${preferences?.min_salary && preferences?.max_salary 
  ? `$${preferences.min_salary} - $${preferences.max_salary}` 
  : 'Not specified'}
`;
      }
    }
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Voice chat request:", message);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: `You are ARIA (Advanced Response Intelligence Assistant), an AI survival companion helping users build their human-proof profiles in a post-AI world.

${userContext}

Your capabilities:
1. **Job Recommendations**: Based on user skills, experience, and preferences, suggest 2-3 specific job opportunities. Include:
   - Job title and company (can be realistic examples)
   - Why it matches their profile
   - Remote/in-person/hybrid status
   - Estimated salary range if relevant

2. **Skill Development**: Suggest which brand stores or programs they should explore to gain skills

3. **Career Guidance**: Provide strategic advice on building their profile

When the user asks about jobs or career opportunities:
- Analyze their current skills and preferences
- Recommend specific positions that match
- Explain the reasoning behind each recommendation
- Be encouraging but realistic

Keep responses conversational and under 150 words unless they ask for more detail. Address the user as Nitin. Be professional, calm, and supportive.`
          },
          { role: "user", content: message }
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("AI gateway error:", response.status, error);
      throw new Error(`AI gateway error: ${error}`);
    }

    const data = await response.json();
    const aiMessage = data.choices[0].message.content;
    
    console.log("AI response:", aiMessage);

    // Store conversation in database if user is authenticated
    if (userId) {
      await supabase.from('aria_conversations').insert([
        { user_id: userId, message_role: 'user', message_content: message },
        { user_id: userId, message_role: 'assistant', message_content: aiMessage }
      ]);
    }

    return new Response(
      JSON.stringify({ message: aiMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error in voice-chat function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
