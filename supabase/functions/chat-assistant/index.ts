import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

const SYSTEM_PROMPT = `You are Craft Proposal's AI assistant — an expert proposal consultant for freelancers and agencies.

YOUR CAPABILITIES:
1. CREATE PROPOSALS — Help users build professional proposals through intelligent conversation
2. WRITE ABOUT US — Generate professional "About Us" content from company context/website
3. WRITE CASE STUDIES — Generate compelling case studies
4. GENERAL CHAT — Answer questions about proposals, business, freelancing

PROPOSAL CREATION — CONVERSATIONAL APPROACH:
When a user wants to create a proposal, DO NOT just accept minimal info. Act like a senior consultant:

1. First acknowledge what you understand (client name, project type)
2. Then ask smart, relevant follow-up questions ONE OR TWO at a time based on the project type. Examples:
   - For web design: "What pages do they need? Do they have existing branding/style guidelines?"
   - For app development: "Is this iOS, Android, or both? Do they need backend/API work?"
   - For marketing: "What channels are we focusing on? What's their current marketing situation?"
   - For consulting: "What's the engagement model — hourly, retainer, or project-based?"

3. As the conversation progresses, gather these key details (ask naturally, not as a checklist):
   - Scope & deliverables
   - Timeline expectations
   - Budget/pricing
   - Payment terms (milestone-based, upfront %, net terms)
   - Any special requirements or constraints

4. When you feel you have ENOUGH information to create a solid proposal, use the "generate_proposal" tool with ALL gathered details. You should have at minimum: client name, project type, deliverables, and pricing before generating.

5. If the user says something like "that's it" or "go ahead" or "create it" — generate with what you have, filling reasonable defaults.

IMPORTANT RULES:
- Ask 1-2 questions at a time, not a huge list
- Be conversational and natural, not robotic
- Use context from previous messages — don't re-ask things already answered
- If the user gives lots of detail upfront, skip to confirming and generating
- Keep responses concise (2-4 sentences max per turn)
- Do NOT use ### headings. Use **bold** sparingly.
- ALWAYS use tool calls, never respond with plain text

FOR ABOUT US / CASE STUDIES:
- About Us: 2-3 SHORT paragraphs (max 150 words). Use WEBSITE CONTENT as primary source. No headings, clean prose.
- Case Studies: Under 200 words. Challenge, solution, result. No headings. Bold key metrics only.
- If website content is provided, use it as primary source of truth.`;

async function fetchWebsiteContent(url: string): Promise<string> {
  try {
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }
    console.log('Fetching website:', formattedUrl);
    const res = await fetch(formattedUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CraftProposal/1.0)' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return '';
    const html = await res.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[\s\S]*?<\/header>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&[a-z]+;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return text.slice(0, 3000);
  } catch (err) {
    console.error('Failed to fetch website:', err);
    return '';
  }
}

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

    const lastMessage = messages?.[messages.length - 1]?.content?.toLowerCase() || '';
    const needsWebsite = lastMessage.includes('about us') || lastMessage.includes('about section') ||
      lastMessage.includes('case study') || lastMessage.includes('case studies') ||
      lastMessage.includes('write about') || lastMessage.includes('generate about') ||
      lastMessage.includes('write case') || lastMessage.includes('generate case');

    let websiteContent = '';
    if (needsWebsite && companyProfile?.website) {
      websiteContent = await fetchWebsiteContent(companyProfile.website);
    }

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

    if (websiteContent) {
      companyContext += `\n\nWEBSITE CONTENT (scraped from ${companyProfile.website}):\n${websiteContent}`;
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
              description: 'Handle conversational responses — asking questions, providing info, or acknowledging user input. Use this for ALL responses that are NOT generating a final proposal.',
              parameters: {
                type: 'object',
                properties: {
                  intent: {
                    type: 'string',
                    enum: ['create_proposal', 'write_about_us', 'write_case_study', 'general_chat'],
                    description: 'The detected user intent. Use create_proposal when the user first mentions wanting a proposal (to start the conversation). Use general_chat for follow-up questions during proposal gathering.'
                  },
                  client_name: {
                    type: 'string',
                    description: 'Client name extracted from message (if create_proposal)'
                  },
                  project_type: {
                    type: 'string',
                    description: 'Type of project/service (if create_proposal)'
                  },
                  response: {
                    type: 'string',
                    description: 'Your conversational response to the user'
                  },
                  generated_content: {
                    type: 'string',
                    description: 'Generated About Us or Case Study content'
                  }
                },
                required: ['intent', 'response'],
                additionalProperties: false
              }
            }
          },
          {
            type: 'function',
            function: {
              name: 'generate_proposal',
              description: 'Generate the final proposal when you have gathered enough information through conversation. Call this ONLY when you have sufficient details (at minimum: client name, project type, deliverables, and pricing).',
              parameters: {
                type: 'object',
                properties: {
                  client_name: {
                    type: 'string',
                    description: 'The client name'
                  },
                  project_type: {
                    type: 'string',
                    description: 'Type of project/service'
                  },
                  deliverables: {
                    type: 'string',
                    description: 'Detailed list of deliverables gathered from conversation'
                  },
                  timeline: {
                    type: 'string',
                    description: 'Project timeline'
                  },
                  pricing: {
                    type: 'string',
                    description: 'Total project price (e.g. "$2,500")'
                  },
                  payment_terms: {
                    type: 'string',
                    description: 'Payment structure (e.g. "50% upfront, 50% on delivery")'
                  },
                  special_requirements: {
                    type: 'string',
                    description: 'Any special notes or requirements'
                  },
                  response: {
                    type: 'string',
                    description: 'Confirmation message to show the user'
                  }
                },
                required: ['client_name', 'project_type', 'deliverables', 'pricing', 'response'],
                additionalProperties: false
              }
            }
          }
        ],
        temperature: 0.7,
        max_tokens: 1200,
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
    
    if (toolCall?.function?.name === 'generate_proposal') {
      const parsed = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify({
        intent: 'generate_proposal',
        ...parsed,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (toolCall?.function?.name === 'handle_intent') {
      const parsed = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fallback
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
