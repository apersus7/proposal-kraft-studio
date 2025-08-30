-- Insert default proposal templates
INSERT INTO public.templates (name, description, preview_image_url, template_data, is_public, created_by) VALUES
(
  'Business Proposal Template',
  'Professional business proposal with executive summary, scope of work, timeline, and pricing sections',
  'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=300&fit=crop',
  '{
    "sections": [
      {
        "type": "header",
        "title": "Business Proposal",
        "subtitle": "Professional Services Agreement"
      },
      {
        "type": "executive_summary",
        "title": "Executive Summary",
        "content": "We are pleased to present this comprehensive proposal outlining our professional services. Our team brings extensive experience and proven methodologies to deliver exceptional results for your organization."
      },
      {
        "type": "scope_of_work", 
        "title": "Scope of Work",
        "items": [
          "Initial consultation and requirements analysis",
          "Strategic planning and project roadmap development", 
          "Implementation and execution phase",
          "Testing, quality assurance, and optimization",
          "Training and knowledge transfer",
          "Ongoing support and maintenance"
        ]
      },
      {
        "type": "timeline",
        "title": "Project Timeline",
        "phases": [
          {"phase": "Discovery & Planning", "duration": "2 weeks", "description": "Requirements gathering and project planning"},
          {"phase": "Development", "duration": "6-8 weeks", "description": "Core implementation and development work"},
          {"phase": "Testing & Launch", "duration": "2 weeks", "description": "Quality assurance and deployment"},
          {"phase": "Support", "duration": "Ongoing", "description": "Post-launch support and maintenance"}
        ]
      },
      {
        "type": "investment",
        "title": "Investment", 
        "total": "$15,000",
        "breakdown": [
          {"item": "Discovery & Planning", "cost": "$3,000"},
          {"item": "Development", "cost": "$10,000"},
          {"item": "Testing & Launch", "cost": "$2,000"}
        ],
        "payment_terms": "50% upfront, 25% at milestone completion, 25% upon delivery"
      }
    ]
  }',
  true,
  null
),
(
  'Web Development Proposal',
  'Comprehensive web development proposal template with technical specifications and deliverables',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop',
  '{
    "sections": [
      {
        "type": "header",
        "title": "Web Development Proposal", 
        "subtitle": "Custom Website Development Services"
      },
      {
        "type": "executive_summary",
        "title": "Executive Summary",
        "content": "Our web development team specializes in creating custom, responsive, and performance-optimized websites that drive business growth. We leverage modern technologies and best practices to deliver exceptional digital experiences."
      },
      {
        "type": "scope_of_work",
        "title": "Scope of Work",
        "items": [
          "Custom website design and user experience planning",
          "Responsive front-end development (HTML, CSS, JavaScript)",
          "Content Management System (CMS) integration",
          "Search Engine Optimization (SEO) implementation", 
          "Performance optimization and security measures",
          "Cross-browser compatibility testing",
          "Mobile responsiveness testing",
          "Training and documentation delivery"
        ]
      },
      {
        "type": "timeline",
        "title": "Development Timeline",
        "phases": [
          {"phase": "Design & Planning", "duration": "1-2 weeks", "description": "UI/UX design and technical architecture"},
          {"phase": "Development", "duration": "4-6 weeks", "description": "Front-end and back-end development"},
          {"phase": "Testing & Launch", "duration": "1 week", "description": "Quality assurance and deployment"},
          {"phase": "Training & Handover", "duration": "1 week", "description": "Client training and project completion"}
        ]
      },
      {
        "type": "investment",
        "title": "Investment",
        "total": "$8,500",
        "breakdown": [
          {"item": "Design & Planning", "cost": "$1,500"},
          {"item": "Development", "cost": "$6,000"},
          {"item": "Testing & Launch", "cost": "$1,000"}
        ],
        "payment_terms": "40% upfront, 40% at development completion, 20% upon launch"
      }
    ]
  }',
  true,
  null
),
(
  'Marketing Consulting Proposal',
  'Strategic marketing consulting proposal with campaign planning and ROI projections',
  'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=300&fit=crop',
  '{
    "sections": [
      {
        "type": "header",
        "title": "Marketing Consulting Proposal",
        "subtitle": "Strategic Marketing & Growth Solutions"
      },
      {
        "type": "executive_summary",
        "title": "Executive Summary", 
        "content": "Our marketing consulting services are designed to accelerate your business growth through data-driven strategies, targeted campaigns, and measurable results. We combine industry expertise with innovative approaches to maximize your marketing ROI."
      },
      {
        "type": "scope_of_work",
        "title": "Scope of Work",
        "items": [
          "Market research and competitive analysis",
          "Brand positioning and messaging strategy",
          "Digital marketing campaign development",
          "Social media strategy and content planning",
          "SEO and content marketing optimization",
          "Performance tracking and analytics setup",
          "Monthly reporting and strategy adjustments",
          "Team training and best practices implementation"
        ]
      },
      {
        "type": "timeline",
        "title": "Campaign Timeline",
        "phases": [
          {"phase": "Research & Strategy", "duration": "2 weeks", "description": "Market analysis and strategy development"},
          {"phase": "Campaign Setup", "duration": "2 weeks", "description": "Campaign creation and asset development"},
          {"phase": "Launch & Optimization", "duration": "4 weeks", "description": "Campaign launch and performance optimization"},
          {"phase": "Reporting & Refinement", "duration": "Ongoing", "description": "Monthly performance reviews and strategy updates"}
        ]
      },
      {
        "type": "investment",
        "title": "Investment",
        "total": "$5,500/month",
        "breakdown": [
          {"item": "Strategy Development", "cost": "$2,000"},
          {"item": "Campaign Management", "cost": "$2,500"},
          {"item": "Reporting & Analysis", "cost": "$1,000"}
        ],
        "payment_terms": "Monthly retainer, billed in advance"
      }
    ]
  }',
  true,
  null
),
(
  'IT Support Proposal',
  'Comprehensive IT support and managed services proposal template',
  'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=300&fit=crop',
  '{
    "sections": [
      {
        "type": "header",
        "title": "IT Support Proposal",
        "subtitle": "Managed IT Services & Technical Support"
      },
      {
        "type": "executive_summary",
        "title": "Executive Summary",
        "content": "Our managed IT services provide comprehensive technical support, proactive monitoring, and strategic technology planning to ensure your business operations run smoothly and securely."
      },
      {
        "type": "scope_of_work",
        "title": "Scope of Work",
        "items": [
          "24/7 network monitoring and maintenance",
          "Help desk support and ticket management",
          "Security monitoring and threat protection",
          "Data backup and disaster recovery planning",
          "Software updates and patch management",
          "Hardware procurement and setup",
          "Strategic technology planning and consultation",
          "Monthly performance reports and recommendations"
        ]
      },
      {
        "type": "timeline",
        "title": "Implementation Timeline",
        "phases": [
          {"phase": "Assessment", "duration": "1 week", "description": "Current infrastructure evaluation"},
          {"phase": "Setup & Migration", "duration": "2 weeks", "description": "System setup and data migration"},
          {"phase": "Testing", "duration": "1 week", "description": "System testing and optimization"},
          {"phase": "Go Live", "duration": "Ongoing", "description": "Full service activation and support"}
        ]
      },
      {
        "type": "investment",
        "title": "Investment",
        "total": "$3,500/month",
        "breakdown": [
          {"item": "Monitoring & Maintenance", "cost": "$1,500"},
          {"item": "Help Desk Support", "cost": "$1,200"},
          {"item": "Security Services", "cost": "$800"}
        ],
        "payment_terms": "Monthly service agreement, billed monthly in advance"
      }
    ]
  }',
  true,
  null
);