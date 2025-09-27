import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple content templates for different sections
const contentTemplates = {
  'objective': (context: string) => `Transform ${context} to achieve:

• Enhanced performance and user experience
• Streamlined operations and improved efficiency
• Modern technology implementation
• Measurable business outcomes

Focused on delivering immediate value and long-term success.`,
  
  'scope_of_work': (context: string) => `${context} project includes:

• Requirements analysis and planning
• Design and development implementation
• Testing and quality assurance
• Training and deployment
• Post-launch support

Structured approach with clear milestones and deliverables.`,

  'pricing': (context: string) => `Investment breakdown:

• Planning & Strategy: Research, planning, documentation
• Implementation: Development, testing, deployment
• Support: Training, optimization, ongoing support

Milestone-based payments with transparent pricing and no hidden costs.`,

  'about_us': (context: string) => `Expert team specializing in ${context} with proven results:

• 5+ years industry experience
• 50+ successful projects delivered
• Certified professionals and specialists
• Quality-first approach
• Transparent communication
• Results-driven methodology

Helping businesses achieve 40% efficiency gains and measurable ROI.`
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { section, context } = await req.json();

    console.log(`Generating content for section: ${section}`);
    console.log(`Context: ${context}`);

    // Get the appropriate template or use a default one
    const templateFunction = contentTemplates[section as keyof typeof contentTemplates];
    
    let generatedContent;
    if (templateFunction) {
      generatedContent = templateFunction(context || 'your business needs');
    } else {
      // Default content for unknown sections
      generatedContent = `${section.replace('_', ' ').toUpperCase()} for ${context || 'this project'}:

• Customized solution approach
• Industry-standard practices
• Clear deliverables and timelines
• Comprehensive support

Designed to maximize value and achieve your goals.`;
    }

    console.log('Generated content successfully');

    return new Response(JSON.stringify({ content: generatedContent.trim() }), {
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