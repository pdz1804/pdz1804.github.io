/* =============================================================================
   PORTFOLIO CONTENT — this is the only file you need to edit.
   =============================================================================

   Everything the site displays lives here. The markup, counts, numbering,
   animation timing and the "show more" buttons all derive from this object,
   so adding an entry never means touching HTML, CSS or a hard-coded number.

   HOW TO ADD THINGS
   -----------------
   New job .............. push a role onto the matching company's roles[].
                          Tenure ("1 yr 3 mos") recomputes from role dates.
   New company .......... push an object onto experience[].
   New project .......... push onto projects.professional[] or .academic[].
                          Card numbers and the hero project count follow.
                          Set featured:true to surface it on the landing page.
   New certification .... push onto certifications[]. The hero counter and the
                          "Show all N" button update themselves. A new issuer
                          needs one entry in certIssuers below.
   New degree ........... push onto education[].
   New skill ............ push onto the matching group's items[].
                          Bar width comes from `level`, never a magic number.

   DATE FORMAT
   -----------
   Machine dates are 'YYYY-MM'. `end: null` means "present" and is what makes
   a role count as current. `period` is the human label shown on screen — keep
   the two in step.

   Levels: 'advanced' | 'proficient' | 'intermediate' | 'familiar'
============================================================================= */

const PORTFOLIO = {

  /* ─── Identity & contact ────────────────────────────────────────────── */
  profile: {
    fullName:    'Nguyen Quang Phu',
    displayName: 'Phu Nguyen',
    heroName:    { first: 'Phu', last: 'Nguyen' },
    title:       'AI Engineer',
    company:     'FPT Software AI Center',
    companySince:'Nov 2025',
    location:    'Ho Chi Minh City, Vietnam',

    email:    'quangphunguyen1804@gmail.com',
    github:   'https://github.com/pdz1804',
    linkedin: 'https://www.linkedin.com/in/quangphunguyen/',

    // Drives the "Yrs Experience" stat — first research role, matching the CV's
    // "2 years of experience". Recomputes on its own; never edit the number.
    careerStart: '2024-06',

    gpa: '3.8',

    tagline: 'Building the frontier of AI — from LLM-powered multi-agent systems ' +
             'and RAG architectures to secure, MCP-based enterprise integrations ' +
             'deployed at scale on AWS and Azure.',

    typedRoles: [
      'AI Engineer',
      'LLM & Agent Specialist',
      'RAG System Architect',
      'MCP Integration Engineer',
      'ML Engineer',
    ],

    availability: 'Currently @ FPT Software AI Center',

    languages: [
      { flag: '🇻🇳', name: 'Vietnamese', level: 'Native' },
      { flag: '🇬🇧', name: 'English',    level: 'IELTS 6.5' },
    ],

    // Set enabled:false to hide the download button everywhere.
    resume: {
      enabled: true,
      path:    'assets/cv/Nguyen_Quang_Phu_CV.pdf',
      label:   'Download CV',
    },
  },

  /* ─── About ─────────────────────────────────────────────────────────── */
  about: {
    photo: 'images/PDZ.jpg',
    paragraphs: [
      'I\'m <strong>Nguyen Quang Phu</strong>, an <strong>AI Engineer</strong> at FPT Software AI Center ' +
      'with two years of experience building and deploying AI-powered applications — specialising in ' +
      '<strong>Large Language Models (LLMs)</strong>, <strong>Retrieval-Augmented Generation (RAG)</strong>, ' +
      'and <strong>Agentic AI systems</strong>.',

      'I design end-to-end ML solutions that bridge model training, backend engineering, cloud deployment ' +
      'and production support. Most of my current work sits on the integration side: layering agents onto ' +
      'existing enterprise systems through <strong>centralised MCP connectors</strong> with OAuth and ' +
      'permission-aware access, so every action stays authorised and traceable.',

      'I enjoy hard problems at the intersection of research and real-world enterprise impact — ' +
      'production-grade pipelines on <strong>AWS Bedrock</strong> and <strong>Azure AI Services</strong>, ' +
      'and the monitoring and evaluation systems that let a team ship them with confidence.',
    ],
    specialties: [
      { icon: 'agents',      title: 'LLM & Agents',        desc: 'AWS Bedrock AgentCore, multi-agent orchestration, prompt engineering' },
      { icon: 'rag',         title: 'RAG Systems',         desc: 'Semantic search, vector databases, document intelligence pipelines' },
      { icon: 'integration', title: 'Secure Integration',  desc: 'MCP connectors, OAuth 2.0, permission-aware access and audit logging' },
      { icon: 'cloud',       title: 'Cloud AI',            desc: 'AWS Bedrock, Azure AI Services, production deployments on ECS & Lambda' },
      { icon: 'ml',          title: 'ML Engineering',      desc: 'Model fine-tuning, hyperparameter optimisation, transformer architectures' },
      { icon: 'eval',        title: 'Agent Evaluation',    desc: 'LLM-as-a-Judge, rule validation, quality gates and latency monitoring' },
    ],
  },

  /* ─── Work experience ───────────────────────────────────────────────── */
  experience: [
    {
      company:   'FPT Software AI Center',
      location:  'Ho Chi Minh City, Vietnam · On-site',
      logoDark:  'images/fpt-logo-white.png',
      logoLight: 'images/fpt-logo-dark.png',
      roles: [
        {
          title:      'Associate AI Engineer',
          type:       'Full-time',
          period:     'Nov 2025 – Present',
          start:      '2025-11',
          end:        null,
          supervisor: 'Dr. Nguyen Duy Khuong (Principal Data Scientist), FPT Software AI Center',
          bullets: [
            '<strong>Agentic ERP Platform</strong> — building AI applications that layer agents on top of enterprise ERP systems (Odoo, NetSuite and others), extending existing business processes with agentic workflows instead of replacing them',
            'Implemented <strong>centralised MCP-based integrations</strong> — Google Workspace, Slack, Confluence, Jira, GitHub, Notion and more — behind a single integration layer, with a shared <strong>query pushdown</strong> mechanism applied uniformly across every integration rather than re-implemented per connector',
            'Owned assigned connectors end to end: per-vendor <strong>OAuth</strong> flows, credential and secret handling, <strong>permission-aware</strong> calls, rate-limit and error semantics, automated test coverage, and audit-friendly logging so every action is authorised and traceable',
            'Delivered the <strong>Prysm Portal</strong> — prompt, knowledge and guardrail management with change history, plus real-time monitoring dashboards, automated testing and enterprise audit logging — so AI behaviour can be adjusted through configuration instead of an engineering release',
            'Led the technical transition of a <strong>healthcare agentic chatbot</strong> from Proof of Concept to production; architected the multi-agent design (Product Recommendation, Health &amp; Lifestyle, Product Education) on <strong>AWS Bedrock AgentCore</strong>, reaching <strong>&gt;90% end-to-end accuracy</strong> while reducing latency through shared component reuse',
            'Built an <strong>automated LLM-based testing system</strong> for the Smart Product Recommendation project — enterprise rule validation, regulatory compliance checks, latency monitoring and quality gates — so releases are approved on measured evidence rather than intuition',
            'Presented three internal <strong>AI4ALL</strong> knowledge-sharing sessions and mentored an intern alongside senior engineers',
          ],
          awards: [
            '"Best Team" Award — FPT Americas (ST25): recognised for excellence in delivery, innovation, quality and progress',
          ],
        },
        {
          title:      'AI Engineer Intern',
          type:       'Internship',
          period:     'Jun – Oct 2025',
          start:      '2025-06',
          end:        '2025-10',
          supervisor: 'Dr. Nguyen Duy Khuong (FPT Software AI Center) &amp; Prof. Kazuyuki Motohashi (The University of Tokyo)',
          bullets: [
            'Built a <strong>Blog System with AI-powered Search &amp; Recommendation</strong> in a four-member team using Azure AI Search, Azure Cosmos DB (NoSQL), Azure Cache for Redis and Azure OpenAI',
            'Designed and implemented <strong>M3ARAG</strong>, a <strong>Multi-Agent RAG</strong> system for document understanding — locally deployable with GPU acceleration — answering questions over PDFs, HTML, Office documents and plain text',
            'Developed a <strong>Dual Attention Model</strong> extracting technical and firm-related keywords from company websites, and a Transformation Matrix aligning Company and Patent datasets for the end-to-end <strong>Innovation Discovery</strong> pipeline',
          ],
          awards: [],
        },
      ],
    },
    {
      company:   'Ho Chi Minh City University of Technology',
      location:  'Ho Chi Minh City, Vietnam · On-site',
      logoDark:  'images/hcmut-logo.png',
      logoLight: 'images/hcmut-logo.png',
      roles: [
        {
          title:      'Research Assistant',
          type:       'Part-time',
          period:     'Jun – Dec 2024',
          start:      '2024-06',
          end:        '2024-12',
          supervisor: 'Mr. Bui Cong Tuan (PhD Candidate), HCMUT',
          bullets: [
            'Designed an unsupervised framework to construct a <strong>Knowledge Graph</strong> with minimal domain-expert input, reducing manual labelling and curation effort',
            'Evaluated SOTA <strong>LLMs</strong> for entity and intent extraction on raw Vietnamese documents',
            'Researched embedding, dimensionality-reduction and clustering techniques to reduce bias in abstract entity representations',
          ],
          awards: [],
        },
      ],
    },
  ],

  /* ─── Skills ────────────────────────────────────────────────────────── */
  skills: [
    {
      name: 'Programming Languages',
      icon: 'code',
      items: [
        { name: 'Python',                 level: 'advanced',     years: 4 },
        { name: 'JavaScript / TypeScript', level: 'intermediate', years: 2 },
        { name: 'C / C++',                level: 'intermediate', years: 2 },
        { name: 'SQL',                    level: 'intermediate', years: 2 },
        { name: 'R',                      level: 'familiar',     years: 1 },
      ],
    },
    {
      name: 'LLM & Agents',
      icon: 'hex',
      items: [
        { name: 'RAG Systems',                    level: 'advanced',     years: 2 },
        { name: 'MCP (Model Context Protocol)',   level: 'proficient',   years: 1 },
        { name: 'LangChain & Agent Frameworks',   level: 'intermediate', years: 2 },
        { name: 'AWS Strands',                    level: 'intermediate', years: 2 },
        { name: 'Agent Eval / LLM-as-a-Judge',    level: 'intermediate', years: 1 },
        { name: 'vLLM & Cohere Rerank',           level: 'intermediate', years: 1 },
      ],
    },
    {
      name: 'ML & Deep Learning',
      icon: 'brain',
      items: [
        { name: 'LLMs',                   level: 'advanced',     years: 2 },
        { name: 'PyTorch',                level: 'intermediate', years: 2 },
        { name: 'Transformers / BERT',    level: 'intermediate', years: 2 },
        { name: 'TensorFlow / Keras',     level: 'intermediate', years: 2 },
        { name: 'XGBoost & Scikit-learn', level: 'intermediate', years: 2 },
      ],
    },
    {
      name: 'Cloud & DevOps',
      icon: 'cloud',
      items: [
        { name: 'AWS (Bedrock AgentCore, ECS, Lambda…)', level: 'proficient',   years: 2 },
        { name: 'Azure (AI Search, OpenAI, Cosmos DB…)', level: 'intermediate', years: 2 },
        { name: 'Docker',                                level: 'intermediate', years: 2 },
        { name: 'OAuth 2.0 / RBAC',                      level: 'intermediate', years: 1 },
        { name: 'CI / CD',                               level: 'intermediate', years: 1 },
        { name: 'Kubernetes & Terraform',                level: 'familiar',     years: 1 },
      ],
    },
    {
      name: 'Databases',
      icon: 'db',
      items: [
        { name: 'PostgreSQL / MySQL',   level: 'intermediate', years: 2 },
        { name: 'MongoDB',              level: 'intermediate', years: 2 },
        { name: 'Azure Cosmos DB',      level: 'intermediate', years: 2 },
        { name: 'Redis',                level: 'intermediate', years: 2 },
        { name: 'Qdrant (Vector DB)',   level: 'intermediate', years: 2 },
      ],
    },
    {
      name: 'Backend, Frontend & Tools',
      icon: 'tools',
      items: [
        { name: 'FastAPI & Pydantic',            level: 'proficient',   years: 2 },
        { name: 'ReactJS / TypeScript',          level: 'intermediate', years: 2 },
        { name: 'Git / GitHub / GitLab / DevOps', level: 'intermediate', years: 2 },
        { name: 'Playwright / Selenium',         level: 'intermediate', years: 1 },
        { name: 'Streamlit / Linux / Nginx',     level: 'intermediate', years: 2 },
      ],
    },
    {
      name: 'Data & Analytics',
      icon: 'chart',
      items: [
        { name: 'NumPy & Pandas',        level: 'proficient',   years: 3 },
        { name: 'Polars',                level: 'intermediate', years: 1 },
        { name: 'Matplotlib & Seaborn',  level: 'intermediate', years: 3 },
        { name: 'SciPy',                 level: 'intermediate', years: 3 },
      ],
    },
  ],

  /* ─── Education ─────────────────────────────────────────────────────── */
  education: [
    {
      institution: 'Ho Chi Minh City University of Technology (HCMUT)',
      degree:      'B.Sc. Computer Science — Applied Artificial Intelligence',
      period:      'Sep 2022 – 2026',
      location:    'Ho Chi Minh City, Vietnam',
      status:      'Graduated — Excellent classification',
      details: [
        'Academic Incentive Scholarship (4 of 8 semesters)',
        'OISP Scholarship (3 of 8 semesters)',
        'Consolidation Prize, Bach Khoa Innovation Contest — June 2023',
      ],
      gpa: { value: '3.8', scale: '/ 4.0', label: 'Cumulative GPA' },
    },
    {
      institution: 'Le Hong Phong High School For The Gifted',
      degree:      'Mathematics Honours Class',
      period:      '2019 – 2022',
      location:    'Ho Chi Minh City, Vietnam',
      status:      null,
      details: [
        'Elite mathematics specialisation programme',
        'Strong foundation in analytical & quantitative reasoning',
      ],
      gpa: null,
    },
  ],

  /* ─── Projects ──────────────────────────────────────────────────────── */
  projects: {

    // Delivered at work. featured:true → also shown on the landing page.
    professional: [
      {
        title:    'Agentic ERP Platform',
        badge:    'Agentic AI',
        period:   'Jun 2026 – Present',
        org:      'FPT Software AI Center',
        team:     null,
        role:     'Associate AI Engineer',
        featured: true,
        link:     null,
        bullets: [
          'Building AI agent applications on top of enterprise ERP systems (Odoo, NetSuite and others), extending existing business processes with agentic workflows rather than replacing them',
          'Implemented centralised <strong>MCP-based integrations</strong> — Google Workspace, Slack, Confluence, Jira, GitHub, Notion — behind one integration layer, with a shared query pushdown mechanism applied uniformly across every connector',
          'Owned assigned connectors end to end: per-vendor OAuth and permission models, credential and secret management, rate limits and error semantics, automated tests, RBAC-enforced access and audit-friendly logging',
        ],
        tags: ['MCP', 'OAuth 2.0', 'FastAPI', 'PostgreSQL', 'Python'],
      },
      {
        title:    'Healthcare Agentic Chatbot & Management Portal',
        badge:    'Agentic AI',
        period:   'Nov 2025 – Present',
        org:      'FPT Software AI Center',
        team:     'Team of 10',
        role:     'Associate AI Engineer',
        featured: true,
        link:     null,
        bullets: [
          'Architected and deployed an agentic chatbot for healthcare products on <strong>AWS Bedrock AgentCore</strong> — Product Recommendation, Health &amp; Lifestyle, and Product Education agents',
          'Engineered the <strong>Prysm Portal</strong>: knowledge, prompt and guardrail management with change history, real-time monitoring dashboards, automated testing and enterprise audit logging',
          'Led the technical transition from Proof of Concept to production-ready system; achieved end-to-end accuracy <strong>&gt;90%</strong>',
          'Optimised agent design for maximum component reuse and minimal latency',
        ],
        tags: ['AWS Bedrock AgentCore', 'Agentic AI', 'LLMs', 'FastAPI', 'Python'],
        award: '"Best Team" Award — FPT Americas (ST25)',
      },
      {
        title:    'M3ARAG — Multi-Agent RAG for Document Understanding',
        badge:    'RAG',
        period:   'Aug – Oct 2025',
        org:      'FPT Software AI Center',
        team:     'Team of 2',
        role:     'AI Engineer Intern',
        featured: true,
        link:     'https://github.com/pdz1804/M3ARAG',
        supervisor: 'Dr. Nguyen Duy Khuong (Principal Data Scientist), FPT Software AI Center',
        bullets: [
          'Designed and implemented a Multi-Agent RAG system for document intelligence supporting PDFs, HTML, Office documents and plain text',
          'Locally deployable with GPU acceleration via Docling — zero cloud dependency, on-premises ready',
          'Architected the multi-agent pipeline combining semantic search and generation',
        ],
        tags: ['LangChain', 'vLLM', 'Docling', 'PyTorch', 'Multi-Agent'],
      },
      {
        title:    'Smart Product Recommendation System',
        badge:    'Recommendation',
        period:   'Oct – Nov 2025',
        org:      'FPT Software AI Center',
        team:     'Team of 10',
        role:     'Associate AI Engineer',
        featured: false,
        link:     null,
        bullets: [
          'Built an automated LLM-based testing system with enterprise rule validation and regulatory compliance checks',
          'Monitored latency and quality metrics; implemented quality gates gating production releases on measured evidence',
          'Verified system accuracy <strong>&gt;90%</strong> through rigorous testing and validation protocols',
        ],
        tags: ['LLMs', 'AWS', 'Testing Automation', 'LLM-as-a-Judge'],
      },
      {
        title:    'Blog System with AI Search & Recommendation',
        badge:    'Azure',
        period:   'Aug – Oct 2025',
        org:      'FPT Software AI Center',
        team:     'Team of 4',
        role:     'AI Engineer Intern',
        featured: false,
        link:     null,
        supervisor: 'Dr. Nguyen Duy Khuong (Principal Data Scientist), FPT Software AI Center',
        bullets: [
          'Designed and implemented a full-stack blog system with AI-powered semantic search and personalised recommendation',
          'Integrated Azure AI Search, Azure Cosmos DB (NoSQL), Azure Cache for Redis and Azure OpenAI',
          'Built the recommendation engine and a low-latency caching strategy for personalised content discovery',
        ],
        tags: ['Azure AI Search', 'Azure OpenAI', 'Cosmos DB', 'Redis', 'Python'],
      },
      {
        title:    'Dual Attention Model for Innovation Discovery',
        badge:    'Research',
        period:   'Jun – Jul 2025',
        org:      'FPT Software AI Center',
        team:     'Team of 2',
        role:     'AI Engineer Intern',
        featured: false,
        link:     'https://github.com/pdz1804/dual-attn-op-discovery',
        supervisor: 'Prof. Kazuyuki Motohashi (The University of Tokyo) &amp; Dr. Nguyen Duy Khuong (FPT Software AI Center)',
        bullets: [
          'Developed an attention-based deep learning model extracting technical and firm-related keywords from company websites, improving signal extraction for downstream innovation analysis',
          'Implemented a Transformation Matrix aligning Company and Patent datasets for cross-domain analysis',
          'Executed the end-to-end Innovation Discovery pipeline: web scraping, preprocessing, normalisation, training, evaluation and reporting',
        ],
        tags: ['Attention Mechanism', 'PyTorch', 'Deep Learning', 'NLP', 'Python'],
      },
      {
        title:    'Unsupervised Knowledge Graph Construction Framework',
        badge:    'Research',
        period:   'Jun – Dec 2024',
        org:      'HCMUT',
        team:     null,
        role:     'Research Assistant',
        featured: false,
        link:     null,
        supervisor: 'Mr. Bui Cong Tuan (PhD Candidate), HCMUT',
        bullets: [
          'Researched and designed an unsupervised framework for building Knowledge Graphs from scratch with minimal domain-expert involvement',
          'Analysed SOTA LLM performance in generating entities and intents from raw Vietnamese documents',
          'Investigated embedding, dimensionality-reduction and clustering techniques to reduce bias in abstract Knowledge Graph entities',
        ],
        tags: ['Knowledge Graph', 'LLMs', 'NLP', 'Clustering', 'Python'],
      },
    ],

    // Self-driven & academic.
    academic: [
      {
        title:  'Sentiment Analysis with Various Models',
        period: 'April 2025',
        meta:   'Team of 5 · Machine Learning Course',
        link:   'https://github.com/pdz1804/ML_LHPD2',
        desc:   'Implemented and compared multiple ML/DL models — Decision Trees, Naïve Bayes, SVM, XGBoost, Random Forest, MLP and Bi-LSTM. Focused on feature transformation, high-dimensional data handling, hyperparameter tuning and systematic model evaluation across architectures.',
        tags:   ['Python', 'Scikit-learn', 'Keras', 'PyTorch', 'Bi-LSTM'],
      },
      {
        title:  'Fine-tuning Language Models for NLP Tasks',
        period: 'April 2025',
        meta:   'Team of 5 · NLP Course',
        link:   'https://github.com/pdz1804/BTL_NLP',
        desc:   'Fine-tuned pre-trained language models for sentiment analysis, question answering and machine translation. Implemented and compared T5-Base, BART-Base and Flan-T5-Small — weighing accuracy against efficiency and resource cost, with a full GPU pipeline on Kaggle and Colab.',
        tags:   ['HuggingFace', 'T5', 'BART', 'Flan-T5', 'PyTorch'],
      },
      {
        title:  'Detect AI-generated Text',
        period: 'December 2024',
        meta:   'Team of 3 · Programming Integration Course',
        link:   null,
        desc:   'Compared classical models (SVM, Random Forest, XGBoost) against neural approaches (MLP, DistilBERT) for classifying AI-generated text in the educational domain. Analysed accuracy, generalisation and robustness across writing styles.',
        tags:   ['BERT', 'SVM', 'XGBoost', 'Scikit-learn', 'PyTorch'],
      },
    ],
  },

  /* ─── Certifications ────────────────────────────────────────────────────
     `issuer` must match a key in certIssuers below. `year` drives sorting;
     `date` is the label shown on the card.
     ─────────────────────────────────────────────────────────────────────── */
  certifications: [
    // Anthropic — AI-Native Engineer track
    { issuer: 'anthropic', name: 'Model Context Protocol: Advanced Topics', date: 'May 2026', year: 2026.05 },
    { issuer: 'anthropic', name: 'AI Fluency: Framework & Foundations',     date: 'May 2026', year: 2026.05 },
    { issuer: 'anthropic', name: 'Claude with Google Cloud\'s Vertex AI',   date: 'May 2026', year: 2026.05 },
    { issuer: 'anthropic', name: 'AI Fluency for Small Businesses',         date: 'May 2026', year: 2026.05 },
    { issuer: 'anthropic', name: 'Introduction to Subagents',               date: 'April 2026', year: 2026.04 },
    { issuer: 'anthropic', name: 'Claude 101',                              date: 'April 2026', year: 2026.04 },

    // Google
    { issuer: 'google', name: 'Prompting Essentials',                       date: 'June 2026', year: 2026.06 },
    { issuer: 'google', name: 'Use AI as a Creative or Expert Partner',     date: 'June 2026', year: 2026.06 },
    { issuer: 'google', name: 'Design Prompts for Everyday Work Tasks',     date: 'June 2026', year: 2026.06 },
    { issuer: 'google', name: 'Foundations of Data Science',                date: 'May 2026', year: 2026.05 },
    { issuer: 'google', name: 'Google AI Specialization',                   date: 'February 2026', year: 2026.02 },
    { issuer: 'google', name: 'AI Fundamentals',                            date: 'February 2026', year: 2026.02 },
    { issuer: 'google', name: 'AI for Data Analysis',                       date: 'February 2026', year: 2026.02 },
    { issuer: 'google', name: 'AI for App Building',                        date: 'February 2026', year: 2026.02 },
    { issuer: 'google', name: 'AI for Research and Insights',               date: 'February 2026', year: 2026.02 },
    { issuer: 'google', name: 'Gemini Certified University Student',        date: 'December 2025', year: 2025.12 },

    // Google Cloud
    { issuer: 'gcloud', name: 'Inspect Rich Documents with Gemini Multimodality & Multimodal RAG', date: '2025', year: 2025.5 },
    { issuer: 'gcloud', name: 'Develop Gen AI Apps with Gemini and Streamlit', date: '2025', year: 2025.5 },
    { issuer: 'gcloud', name: 'Prompt Design in Vertex AI',                    date: '2025', year: 2025.5 },
    { issuer: 'gcloud', name: 'Automate Data Capture at Scale with Document AI', date: '2025', year: 2025.5 },
    { issuer: 'gcloud', name: 'Gemini for Data Scientists and Analysts',       date: '2025', year: 2025.5 },
    { issuer: 'gcloud', name: 'Responsible AI for Developers: Privacy & Safety', date: '2025', year: 2025.5 },
    { issuer: 'gcloud', name: 'Intermediate ML: TensorFlow on Google Cloud',   date: '2025', year: 2025.5 },

    // DeepLearning.AI
    { issuer: 'dlai', name: 'Build AI Apps with MCP Server',                   date: '2025', year: 2025.4 },
    { issuer: 'dlai', name: 'Knowledge Graphs for AI Agents: API Discovery',   date: '2025', year: 2025.4 },
    { issuer: 'dlai', name: 'AI Agents in LangGraph',                          date: '2025', year: 2025.4 },
    { issuer: 'dlai', name: 'Functions, Tools and Agents with LangChain',      date: '2025', year: 2025.4 },
    { issuer: 'dlai', name: 'LangChain for LLM Application Development',       date: '2025', year: 2025.4 },
    { issuer: 'dlai', name: 'LangChain: Chat with Your Data',                  date: '2025', year: 2025.4 },
    { issuer: 'dlai', name: 'Reasoning with o1',                               date: '2025', year: 2025.4 },
    { issuer: 'dlai', name: 'ChatGPT Prompt Engineering for Developers',       date: '2025', year: 2025.4 },
    { issuer: 'dlai', name: 'Prompt Engineering with Llama 2 & 3',             date: '2025', year: 2025.4 },

    // Others
    { issuer: 'datacamp',  name: 'AI Engineer for Data Scientists Associate',  date: 'September 2025', year: 2025.09 },
    { issuer: 'hf',        name: 'AI Agents Fundamentals',                     date: 'June 2025', year: 2025.06 },
    { issuer: 'aws',       name: 'Cloud Technology and Services Concepts',     date: '2025', year: 2025.3 },
    { issuer: 'aws',       name: 'AWS Concepts',                               date: '2025', year: 2025.3 },
    { issuer: 'microsoft', name: 'Office Specialist: Excel, Word & PowerPoint', date: '2016 / 2022', year: 2016 },
  ],

  // How many certification cards show before the "Show all" toggle.
  certsVisible: 12,

  // Badge text + colour class per issuer. Adding an issuer? One entry here.
  certIssuers: {
    anthropic: { label: 'Anthropic',       badge: 'A',   cls: 'cert-ico-a'  },
    google:    { label: 'Google',          badge: 'G',   cls: 'cert-ico-g'  },
    gcloud:    { label: 'Google Cloud',    badge: 'GC',  cls: 'cert-ico-gc' },
    dlai:      { label: 'DeepLearning.AI', badge: 'D',   cls: 'cert-ico-d'  },
    hf:        { label: 'Hugging Face',    badge: 'HF',  cls: 'cert-ico-hf' },
    datacamp:  { label: 'DataCamp',        badge: 'DC',  cls: 'cert-ico-dc' },
    aws:       { label: 'AWS',             badge: 'AWS', cls: 'cert-ico-aws'},
    microsoft: { label: 'Microsoft',       badge: 'M',   cls: 'cert-ico-ms' },
  },

  /* ─── Navigation ────────────────────────────────────────────────────── */
  nav: [
    { label: 'About',      href: '#about' },
    { label: 'Experience', href: '#experience' },
    { label: 'Skills',     href: '#skills' },
    { label: 'Education',  href: '#education' },
    { label: 'Projects',   href: '#projects' },
    { label: 'Certs',      href: '#certifications' },
  ],

  /* ─── Hero floating tech badges (decorative) ────────────────────────── */
  floaters: ['Python', 'LLMs', 'AWS Bedrock', 'MCP', 'RAG', 'Multi-Agent', 'Azure AI', 'FastAPI'],
};

/* Bar width per level — change once, every bar follows. */
const SKILL_LEVELS = {
  advanced:     90,
  proficient:   76,
  intermediate: 63,
  familiar:     48,
};

/* Published for render.js. Top-level `const` does not attach to `window`,
   so the export has to be explicit. */
window.PORTFOLIO    = PORTFOLIO;
window.SKILL_LEVELS = SKILL_LEVELS;
