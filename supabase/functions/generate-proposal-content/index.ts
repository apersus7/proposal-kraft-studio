import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

// Enhanced prompts that think deeply about the client and project
const generateSystemPrompt = (section: string) => {
  const basePrompt = `You are an expert proposal writer who creates compelling, personalized business proposals. 
Your writing is professional, persuasive, and tailored to the specific client and project.

CRITICAL FORMATTING RULES:
- NEVER use markdown headers (##, ###, etc.)
- NEVER use bold/italic markdown formatting (**text**, *text*)
- Write in plain text with natural paragraph breaks
- Use simple bullet points with • or - (not markdown bullets)
- Keep sentences short and conversational
- Write like a human, not a robot

IMPORTANT GUIDELINES:
- Always personalize content using the client's name and project details
- Think about the client's business needs and pain points
- Use specific, concrete language instead of generic statements
- Focus on value and outcomes for THIS specific client
- Keep tone professional but warm and engaging
- Avoid overly salesy or cliché language
- Be specific about deliverables and benefits
- Write concisely - every word should add value`;

  const sectionPrompts = {
    'objective': `${basePrompt}

For the PROJECT OBJECTIVE section:
- Clearly articulate what the client wants to achieve
- Connect to their business goals and challenges
- Explain the "why" behind the project
- Set clear, measurable objectives
- Show you understand their specific situation`,

    'proposed_solution': `${basePrompt}

For the PROPOSED SOLUTION section:
- Explain your approach and methodology clearly
- Show why your solution is perfect for THIS client
- Highlight unique aspects of your approach
- Connect solution features to client benefits
- Be specific about tools, processes, and deliverables`,

    'scope_of_work': `${basePrompt}

For the SCOPE OF WORK section:
- Break down deliverables in detail
- Provide clear, organized structure
- Specify what's included and excluded
- Show the logical flow of work
- Make it easy to understand what they're getting`,

    'call_to_action': `${basePrompt}

For the NEXT STEPS section:
- Create a clear path forward
- Make it easy for the client to proceed
- Include specific action items
- Provide contact information
- Create a sense of momentum and urgency (without being pushy)`
  };

  return sectionPrompts[section as keyof typeof sectionPrompts] || basePrompt;
};

const generateUserPrompt = (context: any) => {
  const {
    section,
    clientName,
    projectName,
    proposalTitle,
    projectWorth,
    currency,
    existingObjective,
    existingSolution,
    existingScopeOfWork,
    contextHint
  } = context;

  let prompt = `Generate compelling content for the "${section.replace(/_/g, ' ')}" section of a business proposal.

CLIENT & PROJECT DETAILS:
- Client Name: ${clientName || 'Not specified'}
- Project Name: ${projectName || 'Not specified'}
- Proposal Title: ${proposalTitle || 'Not specified'}
- Project Value: ${projectWorth ? `${currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$'}${projectWorth}` : 'Not specified'}`;

  if (existingObjective) {
    prompt += `\n- Project Objective (for context): ${existingObjective.substring(0, 200)}...`;
  }

  if (existingSolution) {
    prompt += `\n- Proposed Solution (for context): ${existingSolution.substring(0, 200)}...`;
  }

  if (existingScopeOfWork) {
    prompt += `\n- Scope of Work (for context): ${existingScopeOfWork.substring(0, 200)}...`;
  }

  if (contextHint) {
    prompt += `\n- Additional Context: ${contextHint}`;
  }

  prompt += `\n\nGenerate ${section === 'scope_of_work' ? '60-80' : '50-70'} words MAXIMUM of personalized, compelling content.

CRITICAL REQUIREMENTS:
- KEEP IT SHORT - Maximum ${section === 'scope_of_work' ? '80' : '70'} words
- Write in plain text only (NO markdown formatting like ##, **, etc.)
- Be concise and conversational
- Make it specific to ${clientName}'s ${projectName} project
- Focus on key value points only
- Sound natural and human, not robotic
- Every sentence must add clear value`;

  return prompt;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const context = await req.json();
    const { section } = context;

    console.log(`Generating AI content for section: ${section}`);
    console.log(`Client: ${context.clientName}, Project: ${context.projectName}`);

    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(JSON.stringify({ 
        error: 'AI service not configured properly' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Call Lovable AI Gateway with enhanced context
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: generateSystemPrompt(section)
          },
          {
            role: 'user',
            content: generateUserPrompt(context)
          }
        ],
        temperature: 0.7,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded. Please wait a moment and try again.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'AI credits depleted. Please add credits to your Lovable workspace.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      throw new Error(`AI Gateway responded with ${response.status}`);
    }

    const data = await response.json();
    let generatedContent = data.choices?.[0]?.message?.content;

    if (!generatedContent) {
      throw new Error('No content generated from AI');
    }

    // Clean up markdown formatting to ensure plain text
    generatedContent = generatedContent
      .replace(/^#+\s+/gm, '')           // Remove markdown headers (##, ###)
      .replace(/\*\*(.+?)\*\*/g, '$1')   // Remove bold formatting
      .replace(/\*(.+?)\*/g, '$1')       // Remove italic formatting
      .replace(/`(.+?)`/g, '$1')         // Remove inline code formatting
      .replace(/^\s*[-*]\s+/gm, '• ')    // Normalize bullet points to •
      .trim();

    console.log('AI content generated and cleaned successfully');

    return new Response(JSON.stringify({ 
      content: generatedContent 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-proposal-content function:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate content', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
