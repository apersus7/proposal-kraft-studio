import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyName, companyWebsite } = await req.json();
    console.log('Researching company:', companyName, companyWebsite);

    if (!companyName) {
      return new Response(JSON.stringify({ error: 'Company name is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Simulate web research and analysis
    const researchData = await analyzeCompany(companyName, companyWebsite);

    return new Response(JSON.stringify({ research: researchData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error researching company:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function analyzeCompany(companyName: string, website?: string): Promise<any> {
  // Since we don't have access to real web scraping, we'll provide intelligent analysis
  // based on common business patterns and industry insights
  
  const industry = detectIndustry(companyName);
  const companySize = estimateCompanySize(companyName);
  
  const painPoints = generatePainPointsForIndustry(industry, companySize);
  const opportunities = generateOpportunities(industry, companySize);
  const challenges = generateChallenges(industry, companySize);

  return {
    companyName,
    website: website || `https://${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
    industry,
    estimatedSize: companySize,
    painPoints,
    opportunities,
    challenges,
    recommendations: generateRecommendations(painPoints, opportunities),
    lastUpdated: new Date().toISOString()
  };
}

function detectIndustry(companyName: string): string {
  const name = companyName.toLowerCase();
  
  if (name.includes('tech') || name.includes('software') || name.includes('digital')) return 'Technology';
  if (name.includes('health') || name.includes('medical') || name.includes('pharma')) return 'Healthcare';
  if (name.includes('finance') || name.includes('bank') || name.includes('capital')) return 'Finance';
  if (name.includes('retail') || name.includes('store') || name.includes('shop')) return 'Retail';
  if (name.includes('construction') || name.includes('building')) return 'Construction';
  if (name.includes('food') || name.includes('restaurant') || name.includes('catering')) return 'Food & Beverage';
  if (name.includes('education') || name.includes('school') || name.includes('university')) return 'Education';
  if (name.includes('consulting') || name.includes('advisory')) return 'Consulting';
  
  return 'General Business';
}

function estimateCompanySize(companyName: string): string {
  // Simple heuristics based on naming conventions
  const name = companyName.toLowerCase();
  
  if (name.includes('enterprise') || name.includes('global') || name.includes('international')) return 'Large (500+ employees)';
  if (name.includes('solutions') || name.includes('systems') || name.includes('group')) return 'Medium (50-500 employees)';
  if (name.includes('studio') || name.includes('boutique') || name.includes('local')) return 'Small (1-50 employees)';
  
  return 'Medium (50-500 employees)';
}

function generatePainPointsForIndustry(industry: string, size: string): string[] {
  const commonPainPoints = [
    'Manual processes consuming too much time',
    'Difficulty tracking and managing data',
    'Lack of real-time visibility into operations',
    'Inefficient communication between teams',
    'Compliance and reporting challenges'
  ];

  const industrySpecific: { [key: string]: string[] } = {
    'Technology': [
      'Scaling development processes',
      'Managing technical debt',
      'Keeping up with rapid technology changes',
      'Talent acquisition and retention',
      'Security and data protection concerns'
    ],
    'Healthcare': [
      'Patient data management and privacy',
      'Regulatory compliance requirements',
      'Appointment scheduling inefficiencies',
      'Insurance claim processing delays',
      'Staff coordination and communication'
    ],
    'Finance': [
      'Risk management and assessment',
      'Regulatory compliance burden',
      'Legacy system integration',
      'Customer onboarding processes',
      'Fraud detection and prevention'
    ],
    'Retail': [
      'Inventory management challenges',
      'Customer experience consistency',
      'Multi-channel sales coordination',
      'Supply chain visibility',
      'Seasonal demand forecasting'
    ],
    'Construction': [
      'Project timeline management',
      'Material cost fluctuations',
      'Safety compliance monitoring',
      'Subcontractor coordination',
      'Quality control documentation'
    ]
  };

  const sizeSpecific = size.includes('Small') 
    ? ['Limited resources for growth', 'Lack of specialized expertise']
    : size.includes('Large')
    ? ['Complex organizational structure', 'Siloed departments']
    : ['Scaling existing processes', 'Managing growth efficiently'];

  return [
    ...commonPainPoints.slice(0, 3),
    ...(industrySpecific[industry] || []).slice(0, 3),
    ...sizeSpecific.slice(0, 2)
  ];
}

function generateOpportunities(industry: string, size: string): string[] {
  const opportunities: { [key: string]: string[] } = {
    'Technology': [
      'Automation of development workflows',
      'AI/ML integration opportunities',
      'Cloud migration benefits',
      'API-first architecture adoption'
    ],
    'Healthcare': [
      'Telemedicine platform integration',
      'Patient portal improvements',
      'Automated billing systems',
      'Data analytics for better outcomes'
    ],
    'Finance': [
      'Digital transformation initiatives',
      'Automated risk assessment',
      'Customer self-service portals',
      'Real-time fraud monitoring'
    ],
    'Retail': [
      'E-commerce platform optimization',
      'Customer loyalty programs',
      'Inventory automation',
      'Personalized shopping experiences'
    ]
  };

  return opportunities[industry] || [
    'Process automation opportunities',
    'Digital transformation potential',
    'Customer experience improvements',
    'Operational efficiency gains'
  ];
}

function generateChallenges(industry: string, size: string): string[] {
  return [
    'Budget constraints for new initiatives',
    'Change management and user adoption',
    'Integration with existing systems',
    'Training staff on new processes',
    'Measuring ROI on technology investments'
  ];
}

function generateRecommendations(painPoints: string[], opportunities: string[]): string[] {
  return [
    'Implement automated workflow solutions to reduce manual processes',
    'Establish centralized data management system',
    'Create real-time dashboard for operational visibility',
    'Develop integrated communication platform',
    'Design scalable processes for future growth'
  ];
}