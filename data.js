// Seed content for vision.footprint-intelligence.com.
// Footprint has no "quote for the future" field in Notion yet, so the stream starts with the
// sessions of the Footprint Leaders Summer Conferences (Munich, footprint-intelligence.com/conference
// and /conference-july-2025). kind:"session" cards print the session title without quotation marks.
// Replace a card's `quote` and drop `kind` as soon as a leader sends a real line.
// `post` names the speaker-card visual in assets/img/posts/ (the image used in the social posts).
window.VOICES = [
  // ---- Summer Conference 2026 ----
  {name:"Dr. Saskia Juretzek",role:"Advisor, Futurewoman",city:"Munich 2026",kind:"session",quote:"Sustainability Leadership: how to manage teams and drive organizational change in 2026"},
  {name:"Alexander von Brevern",role:"Head of Sustainability, Builtech Holding",city:"Munich 2026",kind:"session",quote:"Sustainability Leadership: how to manage teams and drive organizational change in 2026"},
  {name:"Markéta Miltenberger",role:"Managing Director, Eightyards",city:"Munich 2026",kind:"session",quote:"From surplus materials to scalable business value: building circular business models across industries"},
  {name:"Laura Much",role:"Advocacy Specialist, UNICEF Germany",city:"Munich 2026",kind:"session",quote:"Global perspectives on sustainability compliance & strategies"},
  {name:"Svenja Teepe",role:"Senior Manager, Lead EY Digital Sustainability Services, EY",city:"Munich 2026",kind:"session",quote:"Global perspectives on sustainability compliance & strategies"},
  {name:"Jose Alcocer",role:"Head of SDG Acceleration, United Nations World Food Programme",city:"Munich 2026",kind:"session",quote:"Global perspectives on sustainability compliance & strategies"},
  {name:"Daniel Scholz",role:"Managing Director, Footprint Intelligence",city:"Munich 2026",img:"daniel-scholz",kind:"session",quote:"How does AI change the future of corporate sustainability?"},
  {name:"Vanya Boneva",role:"Sustainability Lead, Essity",city:"Munich 2026",kind:"session",quote:"Leveraging AI for EmpCo compliance: managing green claims and regulatory complexity"},
  {name:"Jens Weymann",role:"Head of Sustainability, Cushman & Wakefield",city:"Munich 2026",img:"jens-weymann",kind:"session",quote:"Transition, trust, transparency: managing investment decisions beyond CSRD compliance"},
  {name:"Dr. Susanne Pankove",role:"Global Head of Sustainability, TÜV SÜD",city:"Munich 2026",img:"susanne-pankove",kind:"session",quote:"Circular economy as a competitive advantage: building resilient and resource-secure businesses"},
  {name:"Rebecca Hummelsberger",role:"Senior Manager Sustainability & DEI, ProSiebenSat.1 Media SE",city:"Munich 2026",kind:"session",quote:"Sustainability in media & digital industries: how to connect insights with impact and communication"},
  {name:"Irina Bolgari",role:"Head of Sustainability, La Prairie",city:"Munich 2026",img:"irina-bolgari",kind:"session",quote:"Supply chain, connecting the dots: managing sustainable supply chains & driving impact"},
  {name:"Marko Tschürtz",role:"Vice President Global Supply Chain Management, Bender",city:"Munich 2026",kind:"session",quote:"Supply chain, connecting the dots: managing sustainable supply chains & driving impact"},
  {name:"Sylvie Kwiek",role:"Senior Strategic Procurement Manager, Reviderm AG",city:"Munich 2026",img:"sylvie-kwiek",kind:"session",quote:"Supply chain, connecting the dots: managing sustainable supply chains & driving impact"},
  {name:"Kirstin Frenzel",role:"Head of Corporate Sustainability, Serviceplan Group",city:"Munich 2026",img:"kirstin-frenzel",kind:"session",quote:"Cyber security meets ESG"},
  {name:"Laura Markowski",role:"Sustainability Manager, IMG",city:"Munich 2026",kind:"session",quote:"Closing the Scope 3 gap: internal alignment, supplier engagement and reliable data"},
  {name:"Birgit Berthold-Kremser",role:"Boards & Strategic Advisor",city:"Munich 2026",kind:"session",quote:"Make it real: product sustainability between regulation, data and market success"},
  {name:"Wolfgang Steiner",role:"Founder, Ecoviator",city:"Munich 2026",img:"wolfgang-steiner",kind:"session",quote:"DPP Pathfinder: a 360° compass to Digital Product Passport readiness"},
  {name:"Lina Kindermann",role:"LCA & Ecodesign Specialist, Greensysco",city:"Munich 2026",img:"lina-kindermann",kind:"session",quote:"Designing with data: how LCA and PCF can shape competitive products"},
  {name:"Ghislain Vathelot",role:"Managing Partner, Accentis",city:"Munich 2026",kind:"session",quote:"Make it real: product sustainability between regulation, data and market success"},
  {name:"Tatiana Captari",role:"Retail Operations Manager, Triumph International",city:"Munich 2026",kind:"session",quote:"Make it real: product sustainability between regulation, data and market success"},
  {name:"Emilia Sutton",role:"Founder, Sutton Consulting",city:"Munich 2026",img:"emilia-sutton",kind:"session",quote:"ESG as a driver for long-term value creation"},
  {name:"Antje Späth",role:"Lead ESG Development & Transformation, UniCredit",city:"Munich 2026",kind:"session",quote:"Sustainability in finance: how can the sector turn data, risk and regulation into strategic action?"},
  {name:"Marco Berger",role:"Head of Sustainability Coordination, meine Volksbank Raiffeisenbank eG",city:"Munich 2026",kind:"session",quote:"Die doppelte Wesentlichkeitsanalyse: Berichts- oder Steuerungsinstrument? Perspektive einer Genossenschaftsbank"},
  {name:"Dr. Felix Klimm",role:"Global Sustainability Manager, Siemens",city:"Munich 2026",img:"felix-klimm",kind:"session",quote:"Exchange & learnings on climate scenarios & forecasting"},
  {name:"Alexander Walz",role:"Global Head of Sustainability, Innomotics",city:"Munich 2026",kind:"session",quote:"How can we go beyond reporting? Driving revenue, opportunity & growth through sustainability"},
  {name:"Dr. Markus Sardison",role:"Head of ESG Strategy & Environment, Telefónica Germany",city:"Munich 2026",kind:"session",quote:"How can we go beyond reporting? Driving revenue, opportunity & growth through sustainability"},
  {name:"Martina Klein",role:"Product Manager Sustainability, Webasto",city:"Munich 2026",kind:"session",quote:"How can we go beyond reporting? Driving revenue, opportunity & growth through sustainability"},
  // ---- Summer Conference 2025 ----
  {name:"Rainer Karcher",role:"Founder & CEO, Heartprint",city:"Munich 2025",img:"rainer-karcher",kind:"session",quote:"Corporate sustainability leadership, lessons learned: how to navigate corporate sustainability in dynamic times"},
  {name:"Chris Dawes",role:"Global Sustainability Partnerships Manager, Amazon Web Services",city:"Munich 2025",kind:"session",quote:"GenAI is enabling innovations"},
  {name:"Stephanie Hackenholt",role:"Senior Manager Sustainability, KPMG",city:"Munich 2025",img:"stephanie-hackenholt",kind:"session",quote:"Market intelligence: approaches for transformative ESG management"},
  {name:"Frank Plaschka",role:"Ex-GE, IONITY, Hyundai",city:"Munich 2025",kind:"session",quote:"Corporate sustainability leadership & communication"},
  {name:"Sandra Klackenborn",role:"Arelion",city:"Munich 2025",img:"sandra-klackenborn",kind:"session",quote:"Corporate sustainability leadership & communication"},
  {name:"Jael Lizbed Perez L.",role:"Sustainability Expert, United Nations",city:"Munich 2025",img:"jael-perez",kind:"session",quote:"A new climate narrative: strategy and vision in a world of uncertainty & opportunity"},
  {name:"Ina Seng",role:"BSH Home Appliances",city:"Munich 2025",kind:"session",quote:"Making twin transformation work across teams and value chains"},
  {name:"Jonas Bialk",role:"KSB",city:"Munich 2025",kind:"session",quote:"Making twin transformation work across teams and value chains"},
  {name:"Nina Stolle",role:"Metafinanz",city:"Munich 2025",kind:"session",quote:"CO₂ Parcours: making emissions tangible"},
  {name:"Katharina Boxberg",role:"Metafinanz",city:"Munich 2025",img:"katharina-boxberg",kind:"session",quote:"CO₂ Parcours: making emissions tangible"},
  {name:"Ciprian Parvanescu",role:"ESG & Sustainability Reporting Consultant",city:"Munich 2025",img:"ciprian-parvanescu",kind:"session",quote:"ESG reporting governance pyramid"},
  {name:"Yannik Woserau",role:"CHG-MERIDIAN",city:"Munich 2025",img:"yannik-woserau",kind:"session",quote:"Compliance meets corporate sustainability: current dynamics & opportunities"},
  {name:"Kai Karolin Wunsch",role:"Munich Re Risk Management Partners",city:"Munich 2025",kind:"session",quote:"Compliance meets corporate sustainability: current dynamics & opportunities"},
  {name:"Nico Irrgang",role:"PwC",city:"Munich 2025",img:"nico-irrgang",kind:"session",quote:"Compliance meets corporate sustainability: current dynamics & opportunities"},
  {name:"Prof. Dr. Holger Hoppe",role:"Technische Hochschule Ingolstadt",city:"Munich 2025",img:"holger-hoppe",kind:"session",quote:"The future of sustainability strategy, engagement & education"},
  {name:"Dr. Anita Panov",role:"Ex-Schaeffler",city:"Munich 2025",kind:"session",quote:"The future of sustainability strategy, engagement & education"},
  {name:"Sophia Ritter",role:"Landeshauptstadt München",city:"Munich 2025",kind:"session",quote:"Sustainable citizen experience: KlimaTaler"},
  {name:"Fernando Aguilera",role:"Tom Tailor",city:"Munich 2025",img:"fernando-aguilera",kind:"session",quote:"CSRD & double materiality: roundtable"}
];
