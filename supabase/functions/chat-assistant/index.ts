import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

const SYSTEM_PROMPT = `You are Craft Proposal's AI assistant. You help freelancers and agencies create professional business proposals and manage their company profile.

You have these capabilities:
1. CREATE PROPOSALS - When users want to create a proposal for a client
2. WRITE ABOUT US - Generate professional "About Us" content based on the company's services, industry, and values
3. WRITE CASE STUDIES - Generate compelling case study content based on the company's work and achievements
4. GENERAL CHAT - Answer questions about proposals, business, freelancing

IMPORTANT RULES FOR TOOL CALLING:
- When the user wants to create a proposal, call the "handle_intent" tool with intent "create_proposal". Extract the client name and project type from their message. In the "response" field, confirm what you understood and ask them to provide BOTH the timeline and pricing together in their next message. Example response: "I'll create a Web Design proposal for John! Please share the **timeline** and **pricing** for this project (e.g., '2 weeks, $2,500')."
- When they want help writing an About Us section, call "handle_intent" with intent "write_about_us". Use the company profile context to generate a compelling, professional About Us section in the "generated_content" field. Make it rich, specific to their services, and engaging.
- When they want help writing case studies, call "handle_intent" with intent "write_case_study". Use the company profile context to generate a detailed, results-driven case study in the "generated_content" field. Include challenges, solutions, and outcomes.
- For general conversation, call "handle_intent" with intent "general_chat" and put your helpful response in the "response" field
- ALWAYS use the tool call, never respond with plain text

Be friendly, professional, and concise. Use emojis sparingly.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, companyProfile } = await req.json();

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build context about the company
    let companyContext = '';
    if (companyProfile) {
      const p = companyProfile;
      companyContext = `\n\nCOMPANY PROFILE CONTEXT:
- Company Name: ${p.company_name || 'Not set'}
- Bio: ${p.bio || 'Not set'}
- Services: ${p.services || 'Not set'}
- Website: ${p.website || 'Not set'}
- Case Studies: ${p.case_studies || 'Not set'}`;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT + companyContext },
          ...messages,
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'handle_intent',
              description: 'Handle the user intent by classifying it and extracting relevant info',
              parameters: {
                type: 'object',
                properties: {
                  intent: {
                    type: 'string',
                    enum: ['create_proposal', 'write_about_us', 'write_case_study', 'general_chat'],
                    description: 'The detected user intent'
                  },
                  client_name: {
                    type: 'string',
                    description: 'Client name for the proposal (if create_proposal intent)'
                  },
                  project_type: {
                    type: 'string',
                    description: 'Type of project/service (if create_proposal intent)'
                  },
                  response: {
                    type: 'string',
                    description: 'The assistant response message to show the user'
                  },
                  generated_content: {
                    type: 'string',
                    description: 'Generated About Us or Case Study content (if write_about_us or write_case_study intent)'
                  }
                },
                required: ['intent', 'response'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'handle_intent' } },
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please wait a moment.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits depleted.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI Gateway responded with ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fallback if no tool call
    const content = data.choices?.[0]?.message?.content || '';
    return new Response(JSON.stringify({
      intent: 'general_chat',
      response: content || "I'm here to help! Tell me what you'd like to do."
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Chat assistant error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to process message',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
