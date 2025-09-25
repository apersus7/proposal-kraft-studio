import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple content templates for different sections
const contentTemplates = {
  'objective': (context: string) => `Our objective for ${context} is to deliver measurable value through:

• Clear understanding of your business challenges and requirements
• Strategic approach aligned with your organizational goals
• Implementation of proven solutions and industry best practices
• Delivery of specific, quantifiable outcomes and benefits
• Long-term partnership focused on sustainable success

This project will address your core needs while positioning your organization for continued growth and competitive advantage.`,
  
  'scope_of_work': (context: string) => `This project focuses on ${context} and includes:

• Current state assessment and requirements gathering
• Solution development with testing and quality assurance  
• Training and knowledge transfer
• Post-implementation support and optimization
• Performance monitoring and improvement recommendations

The project is structured in phases to ensure systematic progress and regular milestone reviews.`,

  'pricing': (context: string) => `Professional services breakdown:

• Discovery & Planning: Assessment, strategic planning, documentation
• Implementation: Core development, testing, training
• Support & Optimization: 3-month support, performance optimization

Payment terms typically include milestone-based payments with project management, reporting, and standard revisions included.`,

  'about_us': (context: string) => `We deliver exceptional results that drive business growth and success. With extensive experience in ${context}, we understand your industry challenges and opportunities:

• Proven track record with 100+ completed projects
• Deep industry knowledge and expertise
• Certified professionals with relevant skills
• Rigorous quality assurance processes
• Results-driven approach with transparent communication
• Flexible solutions adaptable to specific needs

Our clients typically achieve 30% efficiency improvements and 25% cost reductions through our solutions.`
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
      generatedContent = `Based on your requirements for ${context || 'this project'}, this ${section.replace('_', ' ')} section covers:

• Tailored approach to your specific requirements
• Industry best practices implementation  
• Clear deliverables and timelines
• Ongoing support and optimization

This approach provides significant value and helps achieve your desired outcomes.`;
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