import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const templates = [
      {
        name: 'Modern Digital Agency',
        description: 'Professional digital marketing proposal with comprehensive sections for SEO, social media, and content strategy',
        category: 'business',
        industry: 'marketing',
        tags: ['digital', 'marketing', 'social-media', 'seo'],
        preview_color: 'from-blue-500 via-indigo-500 to-purple-600',
        is_public: true,
        template_data: {
          primaryColor: '#3b82f6',
          secondaryColor: '#6366f1',
          backgroundColor: '#ffffff',
          textColor: '#1f2937',
          headingColor: '#111827',
          selectedFont: 'Inter',
          sections: [
            { type: 'cover_page', title: 'Digital Marketing Proposal', tagline: 'Transform Your Online Presence', company_name: '[Your Agency]' },
            { type: 'objective', content: 'Comprehensive digital marketing strategy to increase brand visibility and drive conversions' },
            { type: 'proposed_solution', content: 'Multi-channel digital marketing campaign', approach: 'Data-driven strategy', tools: ['Google Analytics', 'SEMrush', 'Hootsuite'], why_fits: 'Proven track record with similar clients' },
            { type: 'scope_of_work', deliverables: ['SEO Optimization', 'Social Media Management', 'Content Creation', 'Email Campaigns'], timeline: [{ phase: 'Strategy', duration: '2 weeks' }, { phase: 'Execution', duration: '3 months' }], included: ['Monthly reporting', 'Strategy sessions', 'Content calendar'], excluded: ['Print advertising', 'Event management'] },
            { type: 'pricing', packages: [{ name: 'Essential', price: '$2,500/mo', features: ['SEO', 'Social Media', 'Monthly Report'] }, { name: 'Professional', price: '$5,000/mo', features: ['Everything in Essential', 'Content Creation', 'Email Marketing', 'Weekly Reports'] }], payment_terms: 'Net 30', total: 'Starting at $2,500/month' }
          ]
        }
      },
      {
        name: 'Tech Startup Pitch',
        description: 'Modern template perfect for SaaS companies and tech startups seeking investment or partnerships',
        category: 'business',
        industry: 'technology',
        tags: ['tech', 'startup', 'saas', 'software'],
        preview_color: 'from-cyan-400 via-blue-500 to-indigo-600',
        is_public: true,
        template_data: {
          primaryColor: '#06b6d4',
          secondaryColor: '#3b82f6',
          backgroundColor: '#ffffff',
          textColor: '#1f2937',
          headingColor: '#111827',
          selectedFont: 'Poppins',
          sections: [
            { type: 'cover_page', title: 'Software Development Proposal', tagline: 'Building Tomorrow\'s Solutions Today', company_name: '[Your Company]' },
            { type: 'objective', content: 'Custom software solution to streamline operations and enhance user experience' },
            { type: 'proposed_solution', content: 'Cloud-based platform with modern architecture', approach: 'Agile development methodology', tools: ['React', 'Node.js', 'AWS', 'PostgreSQL'], why_fits: 'Scalable and maintainable solution' },
            { type: 'scope_of_work', deliverables: ['Web Application', 'Mobile App', 'Admin Dashboard', 'API Integration'], timeline: [{ phase: 'Discovery', duration: '2 weeks' }, { phase: 'Development', duration: '12 weeks' }, { phase: 'Testing', duration: '2 weeks' }], included: ['Source code', 'Documentation', '6 months support'], excluded: ['Hardware costs', 'Third-party licenses'] },
            { type: 'pricing', packages: [{ name: 'MVP', price: '$45,000', features: ['Core features', 'Web app', 'Basic admin'] }, { name: 'Full Platform', price: '$85,000', features: ['All MVP features', 'Mobile apps', 'Advanced analytics', 'Integrations'] }], payment_terms: '30% upfront, 40% at milestone, 30% at delivery', total: 'Starting at $45,000' }
          ]
        }
      },
      {
        name: 'Corporate Consulting',
        description: 'Sophisticated template for business consulting firms offering strategic advisory services',
        category: 'business',
        industry: 'consulting',
        tags: ['consulting', 'strategy', 'corporate', 'advisory'],
        preview_color: 'from-slate-700 via-gray-800 to-zinc-900',
        is_public: true,
        template_data: {
          primaryColor: '#475569',
          secondaryColor: '#64748b',
          backgroundColor: '#ffffff',
          textColor: '#1f2937',
          headingColor: '#0f172a',
          selectedFont: 'Merriweather',
          sections: [
            { type: 'cover_page', title: 'Strategic Consulting Proposal', tagline: 'Transforming Business Through Strategic Excellence', company_name: '[Consulting Firm]' },
            { type: 'objective', content: 'Comprehensive business transformation strategy to achieve operational excellence' },
            { type: 'proposed_solution', content: 'End-to-end consulting engagement', approach: 'Proven methodology with measurable outcomes', tools: ['Market analysis', 'Financial modeling', 'Change management'], why_fits: '15+ years industry experience' },
            { type: 'scope_of_work', deliverables: ['Market Assessment', 'Strategic Roadmap', 'Implementation Plan', 'Change Management'], timeline: [{ phase: 'Assessment', duration: '4 weeks' }, { phase: 'Strategy', duration: '6 weeks' }, { phase: 'Implementation Support', duration: '12 weeks' }], included: ['Executive workshops', 'Detailed reports', 'Ongoing support'], excluded: ['Technology implementation', 'Staff training'] },
            { type: 'pricing', packages: [{ name: 'Strategy Only', price: '$75,000', features: ['Assessment', 'Strategic plan', 'Recommendations'] }, { name: 'Full Engagement', price: '$150,000', features: ['Everything in Strategy', 'Implementation support', 'Change management', '6-month follow-up'] }], payment_terms: '40% upfront, 30% at milestone, 30% at completion', total: 'Starting at $75,000' }
          ]
        }
      },
      {
        name: 'Creative Design Studio',
        description: 'Vibrant template for design agencies offering branding, UI/UX, and creative services',
        category: 'creative',
        industry: 'design',
        tags: ['design', 'branding', 'creative', 'ui-ux'],
        preview_color: 'from-pink-500 via-purple-500 to-indigo-500',
        is_public: true,
        template_data: {
          primaryColor: '#ec4899',
          secondaryColor: '#a855f7',
          backgroundColor: '#ffffff',
          textColor: '#1f2937',
          headingColor: '#831843',
          selectedFont: 'Montserrat',
          sections: [
            { type: 'cover_page', title: 'Brand & Design Proposal', tagline: 'Where Creativity Meets Strategy', company_name: '[Design Studio]' },
            { type: 'objective', content: 'Complete brand identity system with modern design language' },
            { type: 'proposed_solution', content: 'Full-service creative package', approach: 'User-centered design thinking', tools: ['Figma', 'Adobe Creative Suite', 'Miro'], why_fits: 'Award-winning design team' },
            { type: 'scope_of_work', deliverables: ['Logo Design', 'Brand Guidelines', 'Website Design', 'Marketing Materials'], timeline: [{ phase: 'Discovery', duration: '1 week' }, { phase: 'Concept Development', duration: '2 weeks' }, { phase: 'Design', duration: '4 weeks' }], included: ['3 revision rounds', 'Source files', 'Brand style guide'], excluded: ['Website development', 'Printing services'] },
            { type: 'pricing', packages: [{ name: 'Brand Essentials', price: '$8,000', features: ['Logo design', 'Color palette', 'Typography', 'Basic guidelines'] }, { name: 'Complete Brand', price: '$18,000', features: ['Everything in Essentials', 'Website design', 'Marketing templates', 'Social media kit'] }], payment_terms: '50% upfront, 50% on completion', total: 'Starting at $8,000' }
          ]
        }
      },
      {
        name: 'Real Estate Development',
        description: 'Professional template for real estate projects, property management, and development proposals',
        category: 'business',
        industry: 'real-estate',
        tags: ['real-estate', 'property', 'development', 'investment'],
        preview_color: 'from-emerald-500 via-teal-600 to-cyan-700',
        is_public: true,
        template_data: {
          primaryColor: '#10b981',
          secondaryColor: '#0d9488',
          backgroundColor: '#ffffff',
          textColor: '#1f2937',
          headingColor: '#064e3b',
          selectedFont: 'Lato',
          sections: [
            { type: 'cover_page', title: 'Real Estate Development Proposal', tagline: 'Building Your Vision', company_name: '[Development Company]' },
            { type: 'objective', content: 'Comprehensive property development and management services' },
            { type: 'proposed_solution', content: 'Full-cycle development services', approach: 'Sustainable and profitable development', tools: ['Market analysis', 'Financial modeling', 'Project management'], why_fits: '50+ successful projects delivered' },
            { type: 'scope_of_work', deliverables: ['Site Analysis', 'Development Plan', 'Financial Projections', 'Project Management'], timeline: [{ phase: 'Planning', duration: '8 weeks' }, { phase: 'Permitting', duration: '12 weeks' }, { phase: 'Construction', duration: '52 weeks' }], included: ['Architectural plans', 'Budget management', 'Progress reporting'], excluded: ['Land acquisition', 'Legal fees'] },
            { type: 'pricing', packages: [{ name: 'Consulting', price: '$25,000', features: ['Feasibility study', 'Market analysis', 'Recommendations'] }, { name: 'Full Development', price: '5% of project cost', features: ['Complete project management', 'Design coordination', 'Construction oversight', 'Quality control'] }], payment_terms: 'Milestone-based payments', total: 'Based on project scope' }
          ]
        }
      }
    ];

    // Delete existing templates to avoid duplicates
    await supabase.from('templates').delete().eq('is_public', true);

    // Insert new templates
    const { error } = await supabase.from('templates').insert(templates);

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, message: `${templates.length} templates seeded successfully` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error seeding templates:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
