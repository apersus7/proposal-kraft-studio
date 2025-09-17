-- Add better, more diverse templates with different industries and styles

-- First, let's add more template categories and better templates
INSERT INTO public.templates (name, description, category, industry, is_public, template_data, preview_image_url) VALUES 

-- Modern Business Templates
('Modern Tech Startup Proposal', 'Clean, modern template perfect for tech startups and digital agencies', 'business', 'technology', true, '{
  "theme": "modern",
  "sections": [
    {"type": "header", "title": "Digital Innovation Proposal", "subtitle": "Transforming Ideas Into Digital Reality"},
    {"type": "executive_summary", "title": "Executive Summary", "content": "We specialize in cutting-edge digital solutions that drive innovation and growth. Our team combines technical expertise with strategic thinking to deliver exceptional results."},
    {"type": "scope_of_work", "title": "Project Scope", "items": ["Product strategy and roadmap", "UI/UX design and prototyping", "Full-stack development", "Cloud infrastructure setup", "Testing and quality assurance", "Launch and ongoing support"]},
    {"type": "timeline", "title": "Development Timeline", "phases": [
      {"phase": "Discovery & Strategy", "duration": "1-2 weeks", "description": "Requirements gathering and technical planning"},
      {"phase": "Design & Prototyping", "duration": "2-3 weeks", "description": "UI/UX design and interactive prototypes"},
      {"phase": "Development", "duration": "6-8 weeks", "description": "Core development and feature implementation"},
      {"phase": "Testing & Launch", "duration": "2 weeks", "description": "Quality assurance and production deployment"}
    ]},
    {"type": "investment", "title": "Investment", "total": "$25,000 - $50,000", "breakdown": [
      {"item": "Strategy & Planning", "cost": "$5,000"},
      {"item": "Design & UX", "cost": "$8,000"},
      {"item": "Development", "cost": "$25,000"},
      {"item": "Testing & Launch", "cost": "$7,000"}
    ], "payment_terms": "30% upfront, 40% at milestone, 30% on completion"}
  ]
}', 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=300&fit=crop'),

-- Creative Agency Template
('Creative Agency Portfolio', 'Vibrant template for creative agencies, design studios, and marketing firms', 'creative', 'marketing', true, '{
  "theme": "creative",
  "sections": [
    {"type": "header", "title": "Creative Campaign Proposal", "subtitle": "Where Creativity Meets Strategy"},
    {"type": "executive_summary", "title": "Creative Vision", "content": "We craft compelling brand experiences that resonate with your audience and drive meaningful engagement. Our creative approach combines artistic vision with data-driven insights."},
    {"type": "scope_of_work", "title": "Creative Services", "items": ["Brand strategy and positioning", "Visual identity design", "Marketing campaign development", "Content creation and copywriting", "Digital asset production", "Campaign performance tracking"]},
    {"type": "portfolio", "title": "Our Work", "projects": [
      {"name": "Brand Transformation", "description": "Complete rebrand for Fortune 500 company", "results": "40% increase in brand recognition"},
      {"name": "Digital Campaign", "description": "Multi-channel marketing campaign", "results": "250% ROI improvement"}
    ]},
    {"type": "timeline", "title": "Creative Process", "phases": [
      {"phase": "Creative Brief", "duration": "1 week", "description": "Understanding your vision and objectives"},
      {"phase": "Concept Development", "duration": "2 weeks", "description": "Initial concepts and creative direction"},
      {"phase": "Design & Production", "duration": "3-4 weeks", "description": "Final designs and asset creation"},
      {"phase": "Launch & Optimization", "duration": "1 week", "description": "Campaign launch and performance monitoring"}
    ]},
    {"type": "investment", "title": "Creative Investment", "total": "$15,000 - $35,000", "payment_terms": "50% to start, 50% on completion"}
  ]
}', 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=400&h=300&fit=crop'),

-- Consulting Template
('Professional Consulting', 'Sophisticated template for consultants, advisors, and professional services', 'consulting', 'professional', true, '{
  "theme": "professional",
  "sections": [
    {"type": "header", "title": "Strategic Consulting Proposal", "subtitle": "Expert Guidance for Strategic Growth"},
    {"type": "executive_summary", "title": "Executive Summary", "content": "Our consulting expertise helps organizations navigate complex challenges and achieve sustainable growth. We deliver actionable insights backed by industry expertise and proven methodologies."},
    {"type": "problem_analysis", "title": "Situation Analysis", "content": "We have identified key challenges and opportunities within your organization that require strategic intervention and expert guidance."},
    {"type": "approach", "title": "Our Approach", "methodology": ["Comprehensive assessment and analysis", "Strategic planning and roadmap development", "Implementation support and guidance", "Performance monitoring and optimization"]},
    {"type": "scope_of_work", "title": "Consulting Services", "items": ["Strategic assessment and analysis", "Business process optimization", "Change management support", "Performance measurement framework", "Executive coaching and training", "Implementation roadmap development"]},
    {"type": "timeline", "title": "Engagement Timeline", "phases": [
      {"phase": "Assessment", "duration": "2 weeks", "description": "Current state analysis and opportunity identification"},
      {"phase": "Strategy Development", "duration": "3 weeks", "description": "Strategic planning and roadmap creation"},
      {"phase": "Implementation Support", "duration": "8-12 weeks", "description": "Ongoing guidance and support"},
      {"phase": "Review & Optimization", "duration": "2 weeks", "description": "Performance review and recommendations"}
    ]},
    {"type": "investment", "title": "Professional Investment", "total": "$20,000 - $75,000", "payment_terms": "25% retainer, monthly billing thereafter"}
  ]
}', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop'),

-- E-commerce Template
('E-commerce Development', 'Comprehensive template for online store and e-commerce development projects', 'business', 'retail', true, '{
  "theme": "ecommerce",
  "sections": [
    {"type": "header", "title": "E-commerce Development Proposal", "subtitle": "Building Your Digital Storefront"},
    {"type": "executive_summary", "title": "Executive Summary", "content": "Transform your business with a powerful e-commerce platform designed to drive sales and enhance customer experience. Our solution combines cutting-edge technology with proven e-commerce best practices."},
    {"type": "scope_of_work", "title": "Development Scope", "items": ["Custom e-commerce platform development", "Product catalog and inventory management", "Payment gateway integration", "Shipping and logistics setup", "Mobile-responsive design", "SEO optimization", "Security implementation", "Analytics and reporting setup"]},
    {"type": "features", "title": "Key Features", "items": ["User-friendly admin dashboard", "Multi-payment options", "Inventory tracking", "Customer accounts and wishlist", "Order management system", "Email marketing integration"]},
    {"type": "timeline", "title": "Development Timeline", "phases": [
      {"phase": "Planning & Design", "duration": "2 weeks", "description": "Requirements analysis and UI/UX design"},
      {"phase": "Core Development", "duration": "6-8 weeks", "description": "Platform development and feature implementation"},
      {"phase": "Integration & Testing", "duration": "2 weeks", "description": "Payment and shipping integration, testing"},
      {"phase": "Launch & Training", "duration": "1 week", "description": "Go-live support and team training"}
    ]},
    {"type": "investment", "title": "Development Investment", "total": "$18,000 - $45,000", "breakdown": [
      {"item": "Design & Planning", "cost": "$4,000"},
      {"item": "Platform Development", "cost": "$25,000"},
      {"item": "Integrations", "cost": "$8,000"},
      {"item": "Testing & Launch", "cost": "$5,000"}
    ]}
  ]
}', 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop'),

-- Healthcare Template
('Healthcare Solutions', 'Specialized template for healthcare providers and medical technology services', 'healthcare', 'healthcare', true, '{
  "theme": "healthcare",
  "sections": [
    {"type": "header", "title": "Healthcare Solutions Proposal", "subtitle": "Advancing Patient Care Through Innovation"},
    {"type": "executive_summary", "title": "Executive Summary", "content": "Our healthcare solutions are designed to improve patient outcomes while streamlining operational efficiency. We understand the unique challenges of healthcare delivery and compliance requirements."},
    {"type": "compliance", "title": "Compliance & Security", "standards": ["HIPAA compliance", "SOC 2 Type II certification", "FDA regulations adherence", "HL7 FHIR standards"]},
    {"type": "scope_of_work", "title": "Solution Scope", "items": ["Electronic Health Records integration", "Patient portal development", "Telemedicine platform setup", "Data security implementation", "Staff training and support", "Ongoing maintenance and updates"]},
    {"type": "timeline", "title": "Implementation Timeline", "phases": [
      {"phase": "Assessment & Planning", "duration": "2 weeks", "description": "Current system analysis and compliance review"},
      {"phase": "Development & Integration", "duration": "8-10 weeks", "description": "Solution development and system integration"},
      {"phase": "Testing & Validation", "duration": "3 weeks", "description": "Comprehensive testing and compliance validation"},
      {"phase": "Deployment & Training", "duration": "2 weeks", "description": "Go-live support and staff training"}
    ]},
    {"type": "investment", "title": "Healthcare Investment", "total": "$35,000 - $85,000", "payment_terms": "30% upfront, 40% at milestone, 30% on completion"}
  ]
}', 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop'),

-- Minimal Template
('Minimal & Clean', 'Simple, elegant template focusing on content and clarity', 'business', 'general', true, '{
  "theme": "minimal",
  "sections": [
    {"type": "header", "title": "Project Proposal", "subtitle": "Simple. Effective. Results."},
    {"type": "overview", "title": "Project Overview", "content": "A straightforward approach to delivering exceptional results. We focus on what matters most: your success."},
    {"type": "scope_of_work", "title": "What We Will Deliver", "items": ["Clear project objectives", "Detailed implementation plan", "Regular progress updates", "High-quality deliverables", "Ongoing support"]},
    {"type": "timeline", "title": "Timeline", "phases": [
      {"phase": "Start", "duration": "Week 1", "description": "Project kickoff and planning"},
      {"phase": "Execution", "duration": "Weeks 2-8", "description": "Core work and development"},
      {"phase": "Delivery", "duration": "Week 9", "description": "Final delivery and handover"}
    ]},
    {"type": "investment", "title": "Investment", "total": "Custom pricing based on scope"}
  ]
}', 'https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?w=400&h=300&fit=crop')

ON CONFLICT (id) DO NOTHING;