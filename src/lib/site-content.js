// Plain-text copy of the public marketing pages, shared by /llms.txt and /llms-full.txt (and any future
// machine-readable use). Source: the approved redesign. The current listing is NSE: KOTYARK. "BSE SME" appears only as listing history
// (the company listed on BSE SME, then migrated to the Main Board; owner confirmed 16 Oct 2026).
// Pure data, no imports: do not import page components here. Keep in step with the page copy.
import { COMPANY } from './seo';

// Board of Directors. Source: profiles supplied by the company (owner, 23 Oct 2026), copy-edited for grammar and
// house style at the owner's request ("format it right"); no facts added beyond the source, plus the June 2026
// World Book of Records recognition already published on this site. Used by the About cards, Person JSON-LD and
// llms-full.txt. `facts` render as a key/value list; `bio` paragraphs render in order.
export const BOARD = [
  {
    i: 'GS', img: '/images/board/gaurang-shah.jpg',
    n: 'Mr. Gaurang Shah', fullName: 'Gaurang Rameshchandra Shah', r: 'Chairman cum Managing Director',
    facts: [
      ['Status', 'Promoter of the Company'],
      ['Education', 'Commerce Graduate, The Maharaja Sayajirao University of Baroda'],
      ['Experience', '27+ years in vegetable oil trading and biofuels'],
      ['Recognition', 'Certificate of Excellence, World Book of Records, London (June 2026)'],
    ],
    alumniOf: 'The Maharaja Sayajirao University of Baroda',
    award: 'Certificate of Excellence, World Book of Records, London (26 June 2026)',
    bio: [
      'Mr. Gaurang Rameshchandra Shah is the Chairman cum Managing Director and a Promoter of the Company. A Commerce Graduate of The Maharaja Sayajirao University of Baroda, he brings over 27 years of experience in vegetable oil trading and biofuels.',
      'He is responsible for the overall management of the Company, from close day-to-day oversight and delegation to ensuring consistent, satisfactory output. He adapts quickly to change in the industry and makes operational adjustments promptly when they are needed.',
      'He leads the development of new products and services, and consistently works to exceed industry standards and client expectations. His research ability and quick grasp of new concepts are valuable assets to the Company. He is assertive yet considerate, passionate yet logical, persuasive and inspiring.',
    ],
  },
  {
    i: 'DS', img: '/images/board/dhruti-shah.jpg',
    n: 'Mrs. Dhruti Shah', fullName: 'Dhruti Mihir Shah', r: 'Whole Time Director & Chief Financial Officer',
    facts: [
      ['Education', 'Master of Commerce (M.Com); Master of Business Administration (MBA)'],
      ['Appointed', 'CFO and Key Managerial Personnel (KMP), 5 September 2024'],
      ['Experience', 'About 11 years in the industry'],
    ],
    bio: [
      'Mrs. Dhruti Mihir Shah is the Whole Time Director and Chief Financial Officer of the Company. She holds a Master of Commerce and a Master of Business Administration, and was appointed Chief Financial Officer (CFO) and Key Managerial Personnel (KMP) with effect from 5 September 2024.',
      'With approximately 11 years of experience in the industry, she has been involved in the business from conceptualisation to execution, including planning, monitoring and overseeing all operational activities.',
      'She brings extensive knowledge of the biofuel and related industries, strong accounting and commercial expertise, and the business acumen and experience that contribute to the Company’s growth and success.',
    ],
  },
  {
    i: 'BS', img: '/images/board/bhaviniben-shah.jpg',
    n: 'Mrs. Bhaviniben Gaurang Shah', fullName: 'Bhaviniben Gaurang Shah', r: 'Non-Executive Director',
    facts: [
      ['Education', 'Diploma in Mechanical Engineering'],
      ['Experience', 'About 10 years in biofuels'],
      ['Age', '49'],
    ],
    bio: [
      'Mrs. Bhaviniben Gaurang Shah, aged 49, is the Non-Executive Director of the Company. She holds a Diploma in Mechanical Engineering and has approximately 10 years of experience in the biofuels sector.',
    ],
  },
];

export const PAGES = [
  { path: '/', name: 'Home', desc: 'Overview: B100 biodiesel from non-edible oils, 480,000 KL annual capacity, two zero-discharge plants, investor snapshot.' },
  { path: '/products', name: 'Products', desc: 'Biodiesel (B100) and crude glycerin: one trans-esterification process, two products.' },
  { path: '/products/biodiesel', name: 'Biodiesel (B100)', desc: 'Specifications, blend guidance (B5 to B100) and applications for transport, industrial power and agriculture.' },
  { path: '/products/crude-glycerin', name: 'Crude Glycerin', desc: 'Co-product of trans-esterification supplied to food, pharmaceutical, cosmetic and industrial buyers.' },
  { path: '/about', name: 'About', desc: 'Vision, mission, board of directors, milestones and the two manufacturing plants.' },
  { path: '/investors', name: 'Investors', desc: 'Investor relations: every regulatory filing, policy and disclosure, organised by section.' },
  { path: '/contact', name: 'Contact', desc: 'Bulk biodiesel supply, crude glycerin, partnerships, investor relations and media enquiries.' },
];

export const SUMMARY =
  `${COMPANY.legalName} (${COMPANY.ticker}; CIN ${COMPANY.cin}) manufactures B100 biodiesel from non-edible vegetable oils in India: ` +
  '480,000 KL of annual capacity (210 KL per day) across two zero-discharge plants at Sirohi, Rajasthan and Anand, Gujarat. ' +
  'Its biodiesel cuts greenhouse-gas emissions by 86% against petroleum diesel and is approved by the Bio-Fuel Authority, ' +
  'Rural Development & Panchayati Raj Department, Government of Rajasthan.';

export const KEY_FACTS = [
  'Product: B100 biodiesel (mono alkyl ester, FAME) and crude glycerin (co-product)',
  'Feedstock: non-edible vegetable oils; process: trans-esterification',
  'Capacity: 480,000 KL per year; 210 KL per day',
  'Plants: Sirohi, Rajasthan (Plant I) and Anand, Gujarat (Plant II), both zero-discharge',
  'GHG reduction: 86% versus petroleum diesel',
  'Approval: Bio-Fuel Authority, Govt. of Rajasthan',
  `Listing: ${COMPANY.ticker}`,
  `CIN: ${COMPANY.cin}`,
  `Registered office: ${COMPANY.address.streetAddress}, ${COMPANY.address.addressLocality}, ${COMPANY.address.addressRegion} ${COMPANY.address.postalCode}, India`,
  `Email: ${COMPANY.email}`,
  `Formerly known as ${COMPANY.formerName}`,
];

const H = (t) => `## ${t}`;

/** Full marketing copy as markdown-ish plain text. */
export function marketingText() {
  const a = COMPANY.address;
  return [
    H('Home'),
    "India's next barrel is grown, not drilled.",
    'B100 biodiesel for fleets, gensets, tractors, boilers and pump sets.',
    'Kotyark Industries turns non-edible vegetable oils into B100 biodiesel. We run 480,000 KL of annual capacity across two zero-discharge plants in Rajasthan and Gujarat, and our fuel cuts greenhouse emissions by 86%.',
    '',
    'Scale: capacity that moves a national fuel mix. Every litre from our plants replaces petroleum diesel that India would otherwise import.',
    '- 4,80,000 KL per year: annual installed biodiesel capacity',
    '- 210 KL per day: daily production output',
    '- 86%: lower greenhouse-gas emissions than petroleum diesel',
    '- 2 plants: zero-discharge facilities in Sirohi and Anand',
    '',
    'Process: seed to B100 in four stages.',
    '1. Feedstock. Non-edible oils, sourced in India. We start with non-edible vegetable oils, so our feedstock does not compete with the food supply.',
    '2. Reaction. Trans-esterification rebuilds the molecule. Oils react to form mono alkyl esters (FAME). Crude glycerin separates out and is sold as a second product.',
    '3. B100. Neat biodiesel, made to standard. Premium B100 meeting BIS quality standards, approved by the Bio-Fuel Authority, Govt. of Rajasthan, with 86% lower GHG than petroleum diesel.',
    '4. Blend. From B5 to B100, no new engines. Blends up to B20 run in any diesel engine without modification, including fleets, gensets, boilers, tractors and pump sets.',
    '',
    'Products: one reaction, two revenue streams.',
    '- Biodiesel (B100): clean-burning, renewable replacement for High-Speed Diesel with higher cetane, superior lubricity and better mileage.',
    '- Crude Glycerin: recovered during trans-esterification and supplied to food processing, pharmaceutical, cosmetic and industrial buyers.',
    '',
    "Footprint: two plants on India's western fuel corridor. Sirohi and Anand sit between India's largest diesel-consuming states and its western ports, within short haul of fleets, industry and farms.",
    '',
    'Recognition: honoured at the UK Parliament. World Book of Records, London conferred its Certificate of Excellence on our Managing Director, Mr. Gaurang Rameshchandra Shah, for leadership and innovation in sustainable biofuel (House of Commons, Westminster, 26 June 2026).',
    '',
    `Investors: shareholder information. ${COMPANY.ticker}.`,
    '',
    H('Products'),
    'Two products. One closed loop.',
    'B100 biodiesel and crude glycerin, both produced by trans-esterification of non-edible vegetable oils at our Government-approved, zero-discharge plants.',
    '',
    H('Biodiesel (B100)'),
    'A renewable, clean-burning replacement for High-Speed Diesel. Chemically a mono alkyl ester, functionally equivalent to HSD, with higher cetane, superior lubricity and dramatically lower lifecycle emissions.',
    'Specifications:',
    '- Chemical type: Mono alkyl ester (FAME)',
    '- Feedstock: Non-edible vegetable oils',
    '- Process: Trans-esterification',
    '- GHG reduction: 86% vs. petroleum diesel',
    '- Blending range: B5 (5%) to B100 (neat)',
    '- Engine compatibility: All diesel engines; B5-B20 without modification',
    '- Cetane number: Higher than conventional HSD',
    '- Biodegradability: 100% biodegradable, non-toxic',
    '- Lubricity: Superior to petroleum diesel',
    '- Approval: Bio-Fuel Authority, Govt. of Rajasthan',
    'Where B100 goes to work:',
    '- Transport & logistics: commercial fleets, trucks and heavy vehicles. B5-B20 blends need no engine modification.',
    '- Industrial power: backup generators, boilers and industrial heating systems.',
    '- Agriculture: tractors, farm equipment and irrigation pump sets across rural India.',
    '',
    H('Crude Glycerin'),
    'Crude glycerin separates out during trans-esterification. We supply it to manufacturers in food, pharma, cosmetics and industry.',
    'Uses: food processing, pharmaceuticals, cosmetics, industrial applications.',
    '',
    H('About Kotyark'),
    'Built in India. Measured in kilolitres.',
    'Kotyark Industries Limited is an NSE-listed (NSE: KOTYARK) biodiesel manufacturer operating zero-discharge plants in Sirohi, Rajasthan and Anand, Gujarat. Our biodiesel is approved by the Bio-Fuel Authority, Rural Development & Panchayati Raj Department, Government of Rajasthan.',
    "Vision: to be India's most trusted producer of sustainable biofuels, leading the transition to carbon-neutral energy and reducing dependency on imported fossil fuels.",
    'Mission: to manufacture premium biodiesel that exceeds industry standards while maintaining zero-discharge operations, supporting rural employment, and delivering value to shareholders and communities.',
    'Board of Directors:',
    ...BOARD.map((b) => `- ${b.n} (${b.fullName}), ${b.r}. ${b.facts.map(([k, v]) => `${k}: ${v}`).join('; ')}. ${b.bio.join(' ')}`),
    'Milestones:',
    '- Heritage: vegetable-oil trading roots. Promoter experience spanning nearly three decades in vegetable oils and biofuels.',
    '- Plant I, Sirohi, Rajasthan: primary zero-discharge biodiesel facility at RIICO Industrial Area, Swaroopganj.',
    '- Listing: listed on BSE SME. Kotyark becomes a publicly listed biodiesel manufacturer.',
    `- 2023: Kotyark Industries Limited. Incorporated in Rajasthan as a public limited company (CIN ${COMPANY.cin}).`,
    '- Plant II, Anand, Gujarat: second facility expands capacity and western-India reach.',
    `- Main Board: migration to the Main Board, moving from the SME platform. Today the shares trade as ${COMPANY.ticker}.`,
    '- Jun 2026: Certificate of Excellence, UK Parliament. World Book of Records, London honours MD Gaurang Shah for innovation in sustainable biofuel.',
    'Manufacturing plants:',
    '- Plant I, Sirohi, Rajasthan: primary facility at F-20, RIICO Industrial Area, Swaroopganj, with advanced trans-esterification and zero-discharge systems.',
    '- Plant II, Anand, Gujarat: second facility extending capacity and reach to clients across western India.',
    '',
    H('Investors'),
    'Every filing, in the open.',
    `Kotyark Industries Ltd (${COMPANY.ticker}). Shareholder queries go straight to our compliance team. Disputes can also be raised through SEBI's Smart ODR portal.`,
    '',
    H('Contact'),
    'Talk to the people who make the fuel.',
    'Topics: bulk biodiesel supply, crude glycerin, partnership / distribution, investor relations, media, other. We reply within one business day.',
    `Email: ${COMPANY.email}`,
    `Registered office: ${a.streetAddress}, ${a.addressLocality}, ${a.addressRegion} ${a.postalCode}`,
    `CIN: ${COMPANY.cin}`,
    `Formerly known as ${COMPANY.formerName}.`,
  ].join('\n');
}
