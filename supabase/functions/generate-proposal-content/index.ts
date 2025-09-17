import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple content templates for different sections
const contentTemplates = {
  'executive_summary': (context: string) => `
## Executive Summary

Based on your requirements for ${context}, we have developed a comprehensive solution that addresses your key business objectives. Our approach combines industry best practices with innovative strategies to deliver measurable results.

**Key Benefits:**
• Strategic alignment with your business goals
• Proven methodologies and frameworks
• Experienced team with relevant expertise
• Clear timeline and deliverables
• Competitive pricing with exceptional value

**Expected Outcomes:**
We anticipate significant improvements in efficiency, cost savings, and overall business performance. Our solution is designed to provide both immediate impact and long-term sustainable growth.
`,
  
  'scope_of_work': (context: string) => `
## Scope of Work

### Project Overview
This project focuses on ${context} and includes the following key components:

### Deliverables
1. **Analysis & Planning Phase**
   - Current state assessment
   - Requirements gathering
   - Strategic planning documentation

2. **Implementation Phase**
   - Solution development
   - Testing and quality assurance
   - Training and knowledge transfer

3. **Support & Optimization**
   - Post-implementation support
   - Performance monitoring
   - Continuous improvement recommendations

### Timeline
The project is structured in phases to ensure systematic progress and regular milestone reviews.
`,

  'pricing': (context: string) => `
## Investment & Pricing

### Professional Services Package

**Phase 1: Discovery & Planning**
- Comprehensive assessment: $5,000
- Strategic planning: $3,000
- Documentation: $2,000

**Phase 2: Implementation**
- Core development: $15,000
- Testing & QA: $5,000
- Training: $3,000

**Phase 3: Support & Optimization**
- 3-month support: $6,000
- Performance optimization: $4,000

### Total Investment: $43,000

**Payment Terms:**
- 25% upon contract signing
- 50% at project milestones
- 25% upon completion

*All pricing includes project management, regular reporting, and standard revisions.*
`,

  'about_us': (context: string) => `
## About Our Company

### Our Mission
We are dedicated to delivering exceptional results that drive business growth and success. With years of experience in ${context}, we understand the challenges and opportunities in your industry.

### Our Expertise
• **Proven Track Record:** Successfully completed 100+ projects
• **Industry Experience:** Deep knowledge in your sector
• **Expert Team:** Certified professionals with relevant expertise
• **Quality Commitment:** Rigorous quality assurance processes

### Why Choose Us
1. **Results-Driven Approach:** Focus on measurable outcomes
2. **Transparent Communication:** Regular updates and clear reporting
3. **Flexible Solutions:** Adaptable to your specific needs
4. **Ongoing Support:** Commitment beyond project completion

### Client Success Stories
Our clients have achieved an average of 30% improvement in efficiency and 25% cost reduction through our solutions.
`
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
      generatedContent = `
## ${section.charAt(0).toUpperCase() + section.slice(1).replace('_', ' ')}

Based on your requirements for ${context || 'this project'}, we have prepared the following information:

This section addresses the key aspects of ${section.replace('_', ' ')} relevant to your business objectives. Our approach ensures comprehensive coverage of all necessary components while maintaining focus on practical implementation and measurable results.

**Key Points:**
• Tailored to your specific requirements
• Industry best practices implementation
• Clear deliverables and timelines
• Ongoing support and optimization

We believe this approach will provide significant value and help achieve your desired outcomes.
`;
    }

    console.log('Generated content successfully');

    return new Response(JSON.stringify({ content: generatedContent.trim() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-proposal-content function:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate content', 
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});