import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

const SYSTEM_PROMPT = `You are Craft Proposal's AI assistant. You help freelancers and agencies create professional business proposals and manage their company profile.

You have these capabilities:
1. CREATE PROPOSALS - When users want to create a proposal for a client
2. WRITE ABOUT US - Generate a professional "About Us" section based on the company's website content and profile
3. WRITE CASE STUDIES - Generate a compelling case study based on the company's website content and achievements
4. GENERAL CHAT - Answer questions about proposals, business, freelancing

IMPORTANT RULES FOR TOOL CALLING:
- When the user wants to create a proposal, call the "handle_intent" tool with intent "create_proposal". Extract the client name and project type from their message. In the "response" field, confirm what you understood and ask them to provide BOTH the timeline and pricing together in their next message. Example response: "I'll create a Web Design proposal for John! Please share the **timeline** and **pricing** for this project (e.g., '2 weeks, $2,500')."
- When they want help writing an About Us section, call "handle_intent" with intent "write_about_us". Use the WEBSITE CONTENT and company profile context to generate a concise, professional About Us section in the "generated_content" field. Keep it to 2-3 SHORT paragraphs (max 150 words total). Focus on what makes the company unique — no filler or generic statements. Do NOT use markdown headings or excessive formatting. Just clean, compelling prose.
- When they want help writing case studies, call "handle_intent" with intent "write_case_study". Use the WEBSITE CONTENT and company profile context to generate ONE focused case study in the "generated_content" field. Keep it under 200 words. Include: challenge, solution, and result. Do NOT use markdown headings. Use simple prose with bold for key metrics only.
- For general conversation, call "handle_intent" with intent "general_chat" and put your helpful response in the "response" field
- ALWAYS use the tool call, never respond with plain text
- If website content is provided, you MUST use it as the primary source of truth for generating About Us and Case Study content.
- Keep all responses concise. Do NOT use ### headings in any responses.

Be friendly, professional, and concise. Use emojis sparingly.`;

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
    // Strip HTML tags, scripts, styles to get text content
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
    // Limit to ~3000 chars to keep token usage reasonable
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

    // Check if this is a content generation request - fetch website if so
    const lastMessage = messages?.[messages.length - 1]?.content?.toLowerCase() || '';
    const needsWebsite = lastMessage.includes('about us') || lastMessage.includes('about section') ||
      lastMessage.includes('case study') || lastMessage.includes('case studies') ||
      lastMessage.includes('write about') || lastMessage.includes('generate about') ||
      lastMessage.includes('write case') || lastMessage.includes('generate case');

    let websiteContent = '';
    if (needsWebsite && companyProfile?.website) {
      websiteContent = await fetchWebsiteContent(companyProfile.website);
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
