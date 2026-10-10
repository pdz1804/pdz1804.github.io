/* =============================================================================
   PORTFOLIO CONTENT — this is the only file you need to edit.
   =============================================================================

   Everything the site displays lives here. The markup, counts, numbering,
   animation timing and the "show more" buttons all derive from this object,
   so adding an entry never means touching HTML, CSS or a hard-coded number.

   CONTENT SOURCE OF TRUTH
   ----------------------
   D:\Personal\CV — `input/profile_context_2026_09_10.md` plus the two derived
   CVs (`CV_full/`, `CV_2page/`). Last synced 30 Sep 2026.

   NEVER name the four clients / products listed in D:\Personal\CV\CV_README.md
   anywhere on the site. Use "Agentic ERP Platform", "wellness enterprise
   client", "Management Portal". tools/verify-browser.js enforces this.

   HOW TO ADD THINGS
   -----------------
   New job .............. push a role onto the matching company's roles[].
                          Tenure ("2 yrs 3 mos") recomputes from role dates.
   New company .......... push an object onto experience[].
   New project .......... push onto projects.professional[] or .academic[].
                          Card numbers and the hero project count follow.
                          Set featured:true to surface it on the landing page.
   New certification .... push onto certifications[]. The hero counter and the
                          "Show all N" button update themselves. A new issuer
                          needs one entry in certIssuers below.
   New honor / award .... push onto honors[] with an `evidence` image in
                          images/evidence/. A role can carry `evidence` too.
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

    tagline: 'Taking agentic AI to production — agent runtimes, a default-deny ' +
             'permission layer and multi-tenant administration, deployed across ' +
             'AWS, Azure and Google Cloud.',

    typedRoles: [
      'AI Engineer',
      'Agentic AI Engineer',
      'LLM & RAG Engineer',
      'Agent Platform Engineer',
      'ML Engineer',
    ],

    availability: 'Currently @ FPT Software AI Center',

    languages: [
      { flag: '🇻🇳', code: 'VN', name: 'Vietnamese', level: 'Native' },
      { flag: '🇬🇧', code: 'EN', name: 'English',    level: 'IELTS 6.5' },
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
      '<strong>Large Language Models (LLMs)</strong>, <strong>Retrieval-Augmented Generation (RAG)</strong> ' +
      'and <strong>Agentic AI systems</strong>.',

      'Most of my current work is taking agentic systems to production: the <strong>agent runtime</strong>, a ' +
      '<strong>default-deny permission layer</strong> enforced at runtime, multi-tenant administration with a ' +
      'full audit trail, and usage and cost reporting — so an organisation can let autonomous agents act ' +
      'inside its own business systems safely.',

      'I work full-stack across <strong>FastAPI</strong> backends and <strong>React / TypeScript</strong> portals, ' +
      'deploy on <strong>AWS, Azure and Google Cloud</strong>, and operate services through a modern ' +
      'observability stack. I care about disciplined practice — forward-only migrations, staged releases and ' +
      'layered testing through agent-behaviour evaluations.',
    ],
    specialties: [
      { icon: 'agents',      title: 'Agentic Systems',          desc: 'Agent runtimes, tool-use orchestration, user-authored skills and scheduled automations' },
      { icon: 'integration', title: 'Permissions & Governance', desc: 'Default-deny permission layer, multi-tenant administration, audit trail, usage & cost reporting' },
      { icon: 'rag',         title: 'RAG Systems',              desc: 'Hybrid retrieval, vector databases and document-intelligence pipelines' },
      { icon: 'cloud',       title: 'Cloud & Platform',         desc: 'AWS Bedrock, Azure AI, Google Cloud (GKE); Temporal, ArgoCD, containerised delivery' },
      { icon: 'eval',        title: 'Observability & Quality',  desc: 'OpenTelemetry, Prometheus, Sentry, Arize Phoenix; SonarQube and architecture gates in CI' },
      { icon: 'ml',          title: 'ML Engineering',           desc: 'Fine-tuning with PEFT / LoRA, transformer architectures, hyperparameter optimisation' },
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
          title:      'AI Engineer',
          type:       'Full-time',
          period:     'Nov 2025 – Present',
          start:      '2025-11',
          end:        null,
          supervisor: 'Dr. Nguyen Duy Khuong (Principal Data Scientist), FPT Software AI Center',
          bullets: [
            'Full-stack engineer on an <strong>Agentic ERP Platform</strong> (team of 15, stealth mode, <strong>~1,000 users / ~100 daily active</strong>) — an enterprise AI workspace where agents act inside a company\'s business systems. Development centres on the <strong>agent core</strong> (agents, harness, tools, integrations, prompts, memory, Skills) and stays open to user experience, data intelligence, and trust and governance',
            'Built the runtime <strong>permission layer</strong> that decides which tools an agent may use under a <strong>default-deny</strong> model, plus per-customer administrator controls with a full <strong>audit trail</strong> and <strong>usage and cost reporting</strong>; authored the permission-model specification through many review rounds',
            'Shipped the first release of <strong>user-authored Skills</strong> and extended team sharing across agents, skills and artifacts; consolidated user and group management onto one source of truth and migrated legacy permission data onto it',
            'Built a <strong>third-party integration</strong> from scratch, implemented queued messaging, and improved streaming chat with conversation search and a composer usable while replies stream',
            'Operate services through <strong>OpenTelemetry</strong>, <strong>Prometheus</strong>, <strong>Sentry</strong> and <strong>Arize Phoenix</strong>, work daily inside CI with quality and architecture gates, and review peers on architecture boundaries, permission correctness and migration safety',
            'Built the core <strong>agent harness</strong> of a healthcare agentic chatbot (~100 users) on <strong>AWS Bedrock AgentCore</strong> from day one: <strong>&gt;90%</strong> accuracy on a golden dataset curated by the tester, BA and PM, and typical response latency cut <strong>30s → 15s → 8s</strong>; also solo-built its Management Portal',
            'Presented three internal <strong>AI4ALL</strong> knowledge-sharing sessions and mentored an intern alongside senior engineers',
          ],
          awards: [
            '"Best Team" Award — FPT Americas (ST25): recognised for excellence in delivery, innovation, quality and progress',
            'AI1 Young Talent — Certificate of Recognition Level 3 (FSOFT), Great Job medal and 1,500 Gold from Mr. Tam Nguyen Thanh, Vice Business Unit Leader of AI1 SDU',
          ],
          // Proof shown under the role. Files live in images/evidence/.
          evidence: [
            {
              src:     'images/evidence/ai1-young-talent-certificate.jpg',
              alt:     'FPT Software AI1 Young Talent Certificate of Recognition Level 3, with the Great Job medal and 1,500 Gold',
              caption: 'AI1 Young Talent — Certificate of Recognition Level 3 (FSOFT)',
            },
            {
              src:     'images/evidence/best-team-certificate.jpg',
              alt:     'FPT Software Certificate of Recognition: complete project with outstanding quality and progress',
              caption: 'Certificate of Recognition — outstanding quality and progress (Dec 2025)',
            },
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
            'Built a <strong>Blog System with AI-powered Search &amp; Recommendation</strong> on Azure AI Search, Cosmos DB (NoSQL), Redis and Azure OpenAI, using <strong>hybrid retrieval</strong> — BM25 + vector + semantic + freshness scoring',
            'Designed and implemented <strong>M3ARAG</strong>, a locally deployable, GPU-accelerated <strong>Multi-Agent RAG</strong> system answering questions over PDFs, HTML, Office documents and plain text',
            'Developed a <strong>Dual Attention Model</strong> extracting technical keywords from company websites, and a Transformation Matrix aligning Company and Patent datasets for the end-to-end <strong>Innovation Discovery</strong> pipeline',
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
        { name: 'Python',                  level: 'advanced',     years: 4 },
        { name: 'JavaScript / TypeScript', level: 'intermediate', years: 2 },
        { name: 'C / C++',                 level: 'intermediate', years: 2 },
        { name: 'SQL',                     level: 'intermediate', years: 2 },
        { name: 'R',                       level: 'familiar',     years: 1 },
      ],
    },
    {
      name: 'LLM & Agents',
      icon: 'hex',
      items: [
        { name: 'RAG Systems',                    level: 'advanced',     years: 2 },
        { name: 'LangChain',                      level: 'intermediate', years: 2 },
        { name: 'LangGraph',                      level: 'intermediate', years: 1 },
        { name: 'AWS Strands',                    level: 'intermediate', years: 2 },
        { name: 'MCP (Model Context Protocol)',   level: 'proficient',   years: 1 },
        { name: 'Agent Eval / LLM-as-a-Judge',    level: 'intermediate', years: 1 },
        { name: 'OpenAI API & Google Gemini',     level: 'intermediate', years: 2 },
        { name: 'Docling & ColPali',              level: 'familiar',     years: 1 },
      ],
    },
    {
      name: 'ML & Deep Learning',
      icon: 'brain',
      items: [
        { name: 'PyTorch',                       level: 'intermediate', years: 2 },
        { name: 'TensorFlow / Keras',            level: 'intermediate', years: 2 },
        { name: 'Hugging Face Transformers',     level: 'intermediate', years: 2 },
        { name: 'Sentence-Transformers',         level: 'intermediate', years: 2 },
        { name: 'PEFT / LoRA fine-tuning',       level: 'familiar',     years: 1 },
        { name: 'spaCy / NLTK / Gensim',         level: 'intermediate', years: 2 },
        { name: 'XGBoost & Scikit-learn',        level: 'intermediate', years: 2 },
      ],
    },
    {
      name: 'Cloud & DevOps',
      icon: 'cloud',
      items: [
        { name: 'AWS (Bedrock AgentCore, Lambda, ECS…)',         level: 'proficient',   years: 2 },
        { name: 'Azure (AI Search, OpenAI, Cosmos DB)',          level: 'intermediate', years: 2 },
        { name: 'Google Cloud (GKE, Cloud SQL, Artifact Reg.)',  level: 'familiar',     years: 1 },
        { name: 'Docker & Kubernetes',                           level: 'intermediate', years: 2 },
        { name: 'Terraform',                                     level: 'intermediate', years: 2 },
        { name: 'CI/CD & ArgoCD',                                level: 'intermediate', years: 2 },
      ],
    },
    {
      name: 'Databases',
      icon: 'db',
      items: [
        { name: 'PostgreSQL / MySQL',                       level: 'intermediate', years: 2 },
        { name: 'MongoDB',                                  level: 'intermediate', years: 2 },
        { name: 'Redis',                                    level: 'intermediate', years: 2 },
        { name: 'Temporal',                                 level: 'familiar',     years: 1 },
        { name: 'Vector DBs (Qdrant, ChromaDB, OpenSearch)', level: 'intermediate', years: 2 },
        { name: 'Azure Cosmos DB',                          level: 'intermediate', years: 2 },
      ],
    },
    {
      name: 'Backend, Frontend & Tools',
      icon: 'tools',
      items: [
        { name: 'FastAPI & Pydantic',            level: 'proficient',   years: 2 },
        { name: 'SQLAlchemy / Alembic',          level: 'familiar',     years: 1 },
        { name: 'React / TypeScript / Tailwind', level: 'intermediate', years: 2 },
        { name: 'Git / GitHub / GitLab',         level: 'intermediate', years: 2 },
        { name: 'Playwright / Selenium',         level: 'intermediate', years: 3 },
        { name: 'Streamlit / Linux / Nginx',     level: 'intermediate', years: 2 },
      ],
    },
    {
      name: 'Observability & Quality',
      icon: 'eval',
      items: [
        { name: 'OpenTelemetry & Prometheus', level: 'familiar', years: 1 },
        { name: 'Sentry',                     level: 'familiar', years: 1 },
        { name: 'Arize Phoenix',              level: 'familiar', years: 1 },
        { name: 'SonarQube',                  level: 'familiar', years: 1 },
        { name: 'Backstage',                  level: 'familiar', years: 1 },
        { name: 'Weights & Biases',           level: 'familiar', years: 1 },
      ],
    },
    {
      name: 'Data & Analytics',
      icon: 'chart',
      items: [
        { name: 'NumPy & Pandas',       level: 'proficient',   years: 3 },
        { name: 'Polars',               level: 'intermediate', years: 1 },
        { name: 'Matplotlib & Seaborn', level: 'intermediate', years: 3 },
        { name: 'SciPy',                level: 'intermediate', years: 3 },
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
        'Honorable Mention, 2023 ICPC Vietnam Northern Provincial Programming Contest',
      ],
      gpa: { value: '3.8', scale: '/ 4.0', label: 'Cumulative GPA' },
      // Official transcript, 3 pages. Student ID, date of birth and document number are blacked out
      // and the file is image-only, so nothing sits under the boxes (this site is crawlable).
      docs: [
        { href: 'assets/docs/academic-transcript-hcmut.pdf', label: 'Academic transcript (PDF, identifiers redacted)' },
      ],
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

  /* ─── Honors & awards ───────────────────────────────────────────────────
     Professional and competition recognition, each with its evidence image
     (files in images/evidence/). `sortKey` is an integer YYYYMM, newest first.
     Keep client and product names out of every text field. Exception, by the
     owner's explicit decision on 2026-09-30: best-team-certificate.jpg shows a
     client name on its face; its file name, alt text and caption do not. */
  honors: [
    {
      title:   'Top 10 — AI Riser Vietnam 2026',
      issuer:  'Google for Developers · #BuildwithGoogleAI',
      date:    'Oct 2026',
      sortKey: 202610,
      description:
        'Selected as one of the Top 10 outstanding projects for <strong>Sách Của Em</strong>, a teacher studio that ' +
        'turns photos of textbook pages into printable, curriculum-cited lessons for Vietnamese primary-school ' +
        'teachers, built end to end on Google technology. Presented live at the AI Riser Demo Day at GEM Center, ' +
        'Ho Chi Minh City (08/10/2026), where it ranked <strong>4th of 10</strong> in the audience-favourite poll ' +
        '(26% of the vote).',
      evidence: [
        {
          src:     'images/evidence/demo-day-phu-and-nhu-khanh.jpg',
          alt:     'Nguyễn Quang Phú in a black T-shirt giving a thumbs-up, holding a bouquet of white and blue roses next to his girlfriend Như Khánh, in a white dress, at the AI Riser Vietnam 2026 Demo Day backdrop',
          caption: 'With Như Khánh at the Demo Day',
        },
        {
          src:     'images/evidence/ai-riser-vietnam-2026-top-10.jpg',
          alt:     'Google for Developers AI Riser Vietnam 2026 Top 10 Certificate of Completion',
          caption: 'AI Riser Vietnam 2026 — Top 10 Certificate of Completion',
        },
        {
          src:     'images/evidence/top-10-trophy-certificate-gifts.jpg',
          alt:     'Crystal trophy engraved "Top 10 Outstanding AI Riser Vietnam Projects, Sách Của Em, Nguyễn Quang Phú", a framed Certificate of Completion, a bouquet, a Google Cloud tote bag, a keyboard and mouse combo, a charging-cable set and a plush toy',
          caption: 'Top 10 trophy, certificate and Google gifts',
        },
        {
          src:     'images/evidence/demo-day-top-10-on-stage-wide.jpg',
          alt:     'The Top 10 project presenters and the organisers lined up on the AI Riser Vietnam 2026 Demo Day stage, each holding a crystal trophy and a certificate, under the banner "Chung vai Vươn mình cùng Google AI"',
          caption: 'Top 10 presenters with the organisers',
        },
        {
          src:     'images/evidence/demo-day-top-10-on-stage-group.jpg',
          alt:     'The Top 10 project presenters and the organisers standing in a row on the Demo Day stage, holding trophies and certificates, with the Google for Developers and Google Cloud logos above them',
          caption: 'Top 10 group photo on stage',
        },
        {
          src:     'images/evidence/demo-day-finalists-on-stage.jpg',
          alt:     'The Top 10 finalists and organisers in a row on the AI Riser Vietnam 2026 Demo Day stage, each holding a crystal trophy and a certificate',
          caption: 'The Top 10 finalists on stage',
        },
        {
          src:     'images/evidence/top-10-finalists-slide.jpg',
          alt:     'Demo Day screen titled "Top 10 dự án xuất sắc nhất" showing ten finalist portraits in two rows of five, with Nguyễn Quang Phú and Sách của Em first in the top row',
          caption: 'The Top 10 outstanding projects',
        },
        {
          src:     'images/evidence/demo-day-audience-poll.jpg',
          alt:     'Slido poll "3 Dự án bạn yêu thích nhất": Sách Của Em placed 4th of 10 with 26% of the vote, behind Đúng Nơi 34%, InnoVerse 31% and SightBridge AI 27%',
          caption: 'Demo Day audience poll — 4th of 10 (26%)',
        },
        {
          src:     'images/evidence/demo-day-sach-cua-em-title-slide.jpg',
          alt:     'Nguyễn Quang Phú on the AI Riser Vietnam 2026 Demo Day stage holding a microphone; the screen reads "Dự án: Sách Của Em, Đại diện trình bày: Nguyễn Quang Phú"',
          caption: 'On stage with the Sách Của Em title slide',
        },
        {
          src:     'images/evidence/demo-day-pitch-closeup.jpg',
          alt:     'Close-up of Nguyễn Quang Phú in a black Gemini T-shirt speaking into a microphone in front of the "Dự án: Sách Của Em" slide at the AI Riser Vietnam 2026 Demo Day',
          caption: 'Pitching on stage',
        },
        {
          src:     'images/evidence/demo-day-stage-presentation.jpg',
          alt:     'Nguyễn Quang Phú on stage at the AI Riser Vietnam 2026 Demo Day presenting Sách Của Em; the screen reads "Dự án: Sách Của Em, Đại diện trình bày: Nguyễn Quang Phú"',
          caption: 'Presenting Sách Của Em at the Demo Day',
        },
        {
          src:     'images/evidence/demo-day-stage-skyline-backdrop.jpg',
          alt:     'Nguyễn Quang Phú holding a microphone and a clicker on stage in front of the screen "Chung vai Vươn mình cùng Google AI — AI Riser Vietnam 2026 Demo Day" with a Ho Chi Minh City skyline',
          caption: 'On stage at the Demo Day',
        },
        {
          src:     'images/evidence/demo-day-architecture-slide-audience.jpg',
          alt:     'Wide view of the Demo Day hall: Nguyễn Quang Phú presents Sách Của Em on the central stage while two side screens show the "Solution architecture" slide, with the audience seated in the foreground',
          caption: 'Solution architecture slide in front of the audience',
        },
        {
          src:     'images/evidence/demo-day-hall-light-beams.jpg',
          alt:     'The Demo Day hall seen from the back: a packed audience, beams of stage light, and side screens showing the Sách Của Em project card with the presenter\'s portrait and a QR code',
          caption: 'Sách Của Em on the big screens',
        },
        {
          src:     'images/evidence/demo-day-camera-screen.jpg',
          alt:     'Hands holding a mirrorless camera whose screen shows Nguyễn Quang Phú presenting on stage, with the words "Chung vai Vươn mình" and "AI Riser Viet" on the slide behind him',
          caption: 'Seen through a photographer\'s camera',
        },
        {
          src:     'images/evidence/demo-day-standing-applause.jpg',
          alt:     'Nguyễn Quang Phú in a black Gemini T-shirt standing up with a smile among seated attendees who are clapping, a bouquet of white roses on the table in front of him',
          caption: 'Standing among the applauding audience',
        },
        {
          src:     'images/evidence/demo-day-watching-presentations.jpg',
          alt:     'Nguyễn Quang Phú in glasses and a black Gemini T-shirt seated in the darkened Demo Day audience',
          caption: 'In the audience',
        },
        {
          src:     'images/evidence/demo-day-laughing-over-phone.jpg',
          alt:     'Nguyễn Quang Phú, laughing, and a woman in a white blouse looking at her phone together in their seats at the AI Riser Vietnam 2026 Demo Day, with a "Build with Google AI — AI Riser Vietnam" sticker on his laptop',
          caption: 'Sharing a laugh in the audience',
        },
        {
          src:     'images/evidence/demo-day-high-five.jpg',
          alt:     'Nguyễn Quang Phú and a woman in a white blouse laughing and high-fiving in the audience at the AI Riser Vietnam 2026 Demo Day',
          caption: 'High-five in the audience',
        },
        {
          src:     'images/evidence/demo-day-photo-booth-bouquet.jpg',
          alt:     'Nguyễn Quang Phú giving a thumbs-up with a bouquet of white and blue flowers, standing next to a woman in a white dress at the Demo Day photo wall listing Google for Developers, Google Cloud and the accompanying partners',
          caption: 'At the Demo Day photo wall',
        },
        {
          src:     'images/evidence/demo-day-everyone-group-photo.jpg',
          alt:     'Group photo of all Demo Day participants, organisers and guests on and in front of the stage, with side screens reading "Chung vai Vươn mình cùng Google AI — AI Riser Vietnam 2026 Demo Day"',
          caption: 'Everyone at the AI Riser Vietnam 2026 Demo Day',
        },
      ],
    },
    {
      title:   'AI1 Young Talent — Certificate of Recognition, Level 3 (FSOFT)',
      issuer:  'FPT Software',
      date:    'Sep 2026',
      sortKey: 202609,
      description:
        'Awarded by <strong>Mr. Tam Nguyen Thanh</strong>, Vice Business Unit Leader of AI1 SDU, with the Great Job ' +
        'medal and 1,500 Gold for achieving the quarterly business plan and for the positive attitude and team ' +
        'spirit brought to team activities.',
      evidence: [
        {
          src:     'images/evidence/ai1-young-talent-certificate.jpg',
          alt:     'FPT Software AI1 Young Talent Certificate of Recognition Level 3',
          caption: 'AI1 Young Talent — Certificate of Recognition Level 3 (FSOFT)',
        },
      ],
    },
    {
      title:   '"Best Team" Award — Certificate of Recognition',
      issuer:  'FPT Software · FPT Americas (ST25)',
      date:    'Dec 2025',
      sortKey: 202512,
      description:
        'Recognised with the team for <strong>completing the project with outstanding quality and progress</strong>: ' +
        'a healthcare agentic chatbot taken from Proof of Concept to production in six months. Digitally signed by ' +
        'Mr. Tam Nguyen Thanh, Vice Business Unit Leader of AI1 SDU.',
      evidence: [
        {
          src:     'images/evidence/best-team-certificate.jpg',
          alt:     'FPT Software Certificate of Recognition: complete project with outstanding quality and progress',
          caption: 'Certificate of Recognition — outstanding quality and progress (Dec 2025)',
        },
      ],
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
        team:     'Team of 15',
        role:     'AI Engineer',
        featured: true,
        link:     null,
        bullets: [
          'Enterprise AI workspace (stealth mode, ~1,000 users, ~100 daily active) where agents act inside a company\'s business systems — user-created and shared agents, Skills, versioned Artifacts, scheduled Automations and a plugin system for third-party software; development centres on the <strong>agent core</strong>, open to experience, data intelligence, trust and governance',
          'Built the runtime <strong>permission layer</strong> (default-deny, enforced at runtime), per-customer administrator controls with audit trail, usage and cost reporting, the first release of user-authored Skills, team sharing, and a from-scratch third-party integration',
          'Consolidated user and group management onto one source of truth and migrated legacy permission data onto it',
          'Operate services through OpenTelemetry tracing, Prometheus metrics, Sentry and Arize Phoenix; review peers on architecture boundaries, permission correctness and migration safety',
        ],
        tags: ['Python', 'FastAPI', 'Temporal', 'PostgreSQL', 'GKE', 'React'],
      },
      {
        title:    'Healthcare Agentic Chatbot & Management Portal',
        badge:    'Agentic AI',
        period:   'Nov 2025 – May 2026',
        org:      'FPT Software AI Center',
        team:     'Team of 10',
        role:     'AI Engineer',
        featured: true,
        link:     null,
        bullets: [
          'Built the core <strong>agent harness from day one</strong> of a multi-agent chatbot (~100 users) on <strong>AWS Bedrock AgentCore</strong> covering four domains — product recommendation, health &amp; lifestyle, product education and technical support; <strong>&gt;90%</strong> accuracy on a golden dataset the tester, BA and PM built from customer discussions',
          'Cut typical per-query response latency <strong>30s → 15s → 8s</strong>: first by benchmarking Claude Haiku 3.5, Sonnet 4 and Sonnet 4.5 on accuracy across all test cases against answer quality (conciseness, helpfulness, instruction following, correctness), then by replacing agent self-discovery with a search-and-rank step that narrows domain, use case, tools and context before the agent reasons',
          'Solo-built the <strong>Management Portal</strong> from the team lead\'s idea, beyond the contract scope — live dashboards (sessions, usage, uptime, latency), knowledge-file approval into the agent\'s knowledge base, prompt management, automated retrieval and scenario tests, audit log',
          'The portal helped the customer accept the move from POC to production about <strong>two weeks earlier</strong> than on the previous contract',
        ],
        tags: ['AWS Bedrock AgentCore', 'Strands Agents', 'FastAPI', 'React', 'Python'],
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
          'GPU-accelerated multi-agent RAG for local, cloud-free deployment, with an end-to-end document intelligence pipeline over PDFs, HTML, Office documents and text',
          'Combined <strong>LangGraph</strong> orchestration, <strong>Docling</strong> parsing and <strong>ColPali</strong> visual retrieval with quantized local inference and an OCR fallback',
          'Architected the multi-agent pipeline combining semantic search and generation',
        ],
        tags: ['LangGraph', 'LangChain', 'Docling', 'ColPali', 'ChromaDB'],
      },
      {
        title:    'Smart Product Recommendation System',
        badge:    'Recommendation',
        period:   'Oct – Nov 2025',
        org:      'FPT Software AI Center',
        team:     'Team of 10',
        role:     'AI Engineer',
        featured: false,
        link:     null,
        bullets: [
          'Joined on arrival, before the team moved on to the agentic chatbot; built a rule-based and LLM hybrid recommendation engine for a skin-health scanning device, combining customer data, scan scores, health goals, product catalog and market rules',
          'Ensured legal and regulatory compliance; monitored latency and model-performance indicators',
          'Implemented quality gates and automated testing workflows for production release',
        ],
        tags: ['Amazon Bedrock', 'Bedrock Guardrails', 'LLMs', 'Testing Automation', 'Python'],
      },
      {
        title:    'Blog System with AI Search & Recommendation',
        badge:    'Azure',
        period:   'Aug – Oct 2025',
        org:      'FPT Software AI Center',
        team:     'Team of 2',
        role:     'AI Engineer Intern',
        featured: false,
        link:     null,
        supervisor: 'Dr. Nguyen Duy Khuong (Principal Data Scientist), FPT Software AI Center',
        bullets: [
          'Designed and implemented a full-stack blog platform with AI-powered semantic search and a personalised recommendation engine',
          'Built <strong>hybrid retrieval</strong> — BM25 + vector + semantic + freshness / business scoring, with fuzzy author search',
          'Integrated Azure AI Search, Cosmos DB (NoSQL) and Azure OpenAI, with Redis caching for low-latency delivery',
        ],
        tags: ['Azure AI Search', 'Azure OpenAI', 'Cosmos DB', 'Redis', 'React'],
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
          'Developed an attention-based model extracting technical and firm-related keywords from company websites, improving signal extraction for downstream innovation analysis',
          'Implemented a Transformation Matrix aligning Company and Patent datasets for cross-domain analysis',
          'Executed the end-to-end Innovation Discovery pipeline: web scraping, preprocessing, normalisation, training, evaluation and reporting',
        ],
        tags: ['PyTorch', 'Sentence-Transformers', 'spaCy', 'ChromaDB', 'NLP'],
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

    // Self-driven & academic. Ordered strongest-first, matching the CV.
    academic: [
      {
        title:  'Tech News Mystery — AI Tech-News Workspace',
        period: 'May – Jun 2026',
        meta:   'Personal project · full-stack and cloud',
        link:   'https://github.com/pdz1804/tech-new-mystery',
        desc:   'AI technology-news workspace: crawls articles (Crawl4AI, NewsAPI, Tavily), embeds them into Qdrant, groups them into semantic topic clusters on a PCA embedding map, and answers through a streamed chat agent and a voice agent (ElevenLabs STT/TTS over LiveKit with talk-over interruption). Agent runtime on LangGraph and AWS Bedrock AgentCore, background work in Celery, infrastructure as Terraform on AWS with GitHub Actions CI/CD, Next.js front end.',
        tags:   ['LangGraph', 'AWS Bedrock AgentCore', 'FastAPI', 'Next.js', 'Qdrant', 'Celery', 'Terraform'],
      },
      {
        title:  'Fine-tuning Language Models for NLP Tasks',
        period: 'April 2025',
        meta:   'Team of 5 · NLP Course',
        link:   'https://github.com/pdz1804/BTL_NLP',
        desc:   'Fine-tuned and compared T5-Base, BART-Base and Flan-T5-Small across sentiment analysis, question answering and machine translation (SQuAD, IMDb, WMT En–De). Weighed full fine-tuning against LoRA and adapter tuning with FP16 and gradient accumulation on Kaggle / Colab T4 GPUs, tracked in Weights & Biases.',
        tags:   ['HF Transformers', 'PEFT / LoRA', 'T5', 'BART', 'Weights & Biases'],
      },
      {
        title:  'Sentiment Analysis with Various Models',
        period: 'April 2025',
        meta:   'Team of 5 · Machine Learning Course',
        link:   'https://github.com/pdz1804/ML_LHPD2',
        desc:   'Benchmarked Decision Trees, Naïve Bayes, SVM, XGBoost, Random Forest, MLP and Bi-LSTM over TF-IDF, Bag-of-Words and word-embedding features. Focused on feature transformation, high-dimensional data handling, architecture design and hyperparameter tuning.',
        tags:   ['Scikit-learn', 'XGBoost', 'Bi-LSTM', 'Word2Vec', 'PyTorch'],
      },
      {
        title:  'Detect AI-generated Text',
        period: 'December 2024',
        meta:   'Team of 3 · Programming Integration Course',
        link:   'https://github.com/Frankie2030/PIProject-detect-ai-essay',
        desc:   'Compared classical models (SVM, Random Forest, XGBoost) against neural approaches (feed-forward networks, DistilBERT) to classify LLM-generated essays in the educational domain.',
        tags:   ['DistilBERT', 'SVM', 'XGBoost', 'Scikit-learn', 'PyTorch'],
      },
    ],
  },

  /* ─── Certifications ────────────────────────────────────────────────────
     `issuer` must match a key in certIssuers below. `sortKey` drives ordering
     and is YYYYMM as an integer — a plain decimal breaks, because 2025.12 is
     numerically below 2025.5. For an undated credential use a mid-year month
     as the hint. `date` is the label shown on the card.
     ─────────────────────────────────────────────────────────────────────── */
  certifications: [
    // Anthropic — AI-Native Engineer track
    { issuer: 'anthropic', name: 'Model Context Protocol: Advanced Topics', date: 'May 2026', sortKey: 202605 },
    { issuer: 'anthropic', name: 'AI Fluency: Framework & Foundations',     date: 'May 2026', sortKey: 202605 },
    { issuer: 'anthropic', name: 'Claude with Google Cloud\'s Vertex AI',   date: 'May 2026', sortKey: 202605 },
    { issuer: 'anthropic', name: 'AI Fluency for Small Businesses',         date: 'May 2026', sortKey: 202605 },
    { issuer: 'anthropic', name: 'Introduction to Subagents',               date: 'April 2026', sortKey: 202604 },
    { issuer: 'anthropic', name: 'Claude 101',                              date: 'April 2026', sortKey: 202604 },

    // Google
    { issuer: 'google', name: 'Prompting Essentials',                       date: 'June 2026', sortKey: 202606 },
    { issuer: 'google', name: 'Use AI as a Creative or Expert Partner',     date: 'June 2026', sortKey: 202606 },
    { issuer: 'google', name: 'Design Prompts for Everyday Work Tasks',     date: 'June 2026', sortKey: 202606 },
    { issuer: 'google', name: 'Foundations of Data Science',                date: 'May 2026', sortKey: 202605 },
    { issuer: 'google', name: 'Google AI Specialization',                   date: 'February 2026', sortKey: 202602 },
    { issuer: 'google', name: 'AI Fundamentals',                            date: 'February 2026', sortKey: 202602 },
    { issuer: 'google', name: 'AI for Data Analysis',                       date: 'February 2026', sortKey: 202602 },
    { issuer: 'google', name: 'AI for App Building',                        date: 'February 2026', sortKey: 202602 },
    { issuer: 'google', name: 'AI for Research and Insights',               date: 'February 2026', sortKey: 202602 },
    { issuer: 'google', name: 'Gemini Certified University Student',        date: 'December 2025', sortKey: 202512 },

    // Google Cloud
    { issuer: 'gcloud', name: 'Inspect Rich Documents with Gemini Multimodality & Multimodal RAG', date: '2025', sortKey: 202505 },
    { issuer: 'gcloud', name: 'Develop Gen AI Apps with Gemini and Streamlit', date: '2025', sortKey: 202505 },
    { issuer: 'gcloud', name: 'Prompt Design in Vertex AI',                    date: '2025', sortKey: 202505 },
    { issuer: 'gcloud', name: 'Automate Data Capture at Scale with Document AI', date: '2025', sortKey: 202505 },
    { issuer: 'gcloud', name: 'Gemini for Data Scientists and Analysts',       date: '2025', sortKey: 202505 },
    { issuer: 'gcloud', name: 'Responsible AI for Developers: Privacy & Safety', date: '2025', sortKey: 202505 },
    { issuer: 'gcloud', name: 'Intermediate ML: TensorFlow on Google Cloud',   date: '2025', sortKey: 202505 },

    // DeepLearning.AI
    { issuer: 'dlai', name: 'Build AI Apps with MCP Server',                   date: '2025', sortKey: 202504 },
    { issuer: 'dlai', name: 'Knowledge Graphs for AI Agents: API Discovery',   date: '2025', sortKey: 202504 },
    { issuer: 'dlai', name: 'AI Agents in LangGraph',                          date: '2025', sortKey: 202504 },
    { issuer: 'dlai', name: 'Functions, Tools and Agents with LangChain',      date: '2025', sortKey: 202504 },
    { issuer: 'dlai', name: 'LangChain for LLM Application Development',       date: '2025', sortKey: 202504 },
    { issuer: 'dlai', name: 'LangChain: Chat with Your Data',                  date: '2025', sortKey: 202504 },
    { issuer: 'dlai', name: 'Reasoning with o1',                               date: '2025', sortKey: 202504 },
    { issuer: 'dlai', name: 'ChatGPT Prompt Engineering for Developers',       date: '2025', sortKey: 202504 },
    { issuer: 'dlai', name: 'Prompt Engineering with Llama 2 & 3',             date: '2025', sortKey: 202504 },

    // Others
    { issuer: 'datacamp',  name: 'AI Engineer for Data Scientists Associate',  date: 'September 2025', sortKey: 202509 },
    { issuer: 'hf',        name: 'AI Agents Fundamentals',                     date: 'June 2025', sortKey: 202506 },
    { issuer: 'aws',       name: 'Cloud Technology and Services Concepts',     date: '2025', sortKey: 202503 },
    { issuer: 'aws',       name: 'AWS Concepts',                               date: '2025', sortKey: 202503 },
    { issuer: 'microsoft', name: 'Office Specialist: Excel, Word & PowerPoint', date: '2016 / 2022', sortKey: 201601 },
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
    { label: 'Honors',     href: '#honors' },
    { label: 'Projects',   href: '#projects' },
    { label: 'Certs',      href: '#certifications' },
  ],

  /* ─── Hero floating tech badges (decorative) ────────────────────────── */
  floaters: ['Python', 'FastAPI', 'LangGraph', 'Agentic AI', 'RAG', 'Temporal', 'Kubernetes', 'AWS Bedrock'],

  /* ─── Site settings (not résumé content) ────────────────────────────── */
  site: {
    defaultDesign: 'classic',            // shown to first-time visitors
    // designs: ['classic', 'dossier'],   // optional allow-list and picker order; default is every design in designs/registry.js
    switcher: { enabled: true },        // the on-page design picker; ?switcher=1 / 0 overrides
    url: 'https://pdz1804.github.io/',   // canonical origin, used by tools/sync-meta.js and checks
    ogImage: 'images/PDZ.jpg',
    credit: 'Phu Nguyen — HCMC, VN',     // small line in the Dossier footer
  },
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
