export interface SeedCompany {
  companyId: string;
  legalName: string;
  commonName: string;
  parentCompany: string | null;
  insuranceCategory: string;
  irdaiRegistrationNo: string | null;
  officialWebsite: string;
  registeredOffice: {
    streetAddress: string;
    buildingLocality: string;
    city: string;
    state: string;
    postalCode: string; // 6-digit Indian PIN code
    country: 'India';
    formattedAddress: string;
    sourceUrl: string;
  };
  headquarters: {
    streetAddress: string;
    buildingLocality: string;
    city: string;
    state: string;
    postalCode: string; // 6-digit Indian PIN code
    country: 'India';
    formattedAddress: string;
    sourceUrl: string;
  };
  guidewireProducts: string[];
  guidewireEvidence: string;
  guidewireSourceUrl: string;
  addressSourceUrl: string;
  lastVerifiedDate: string;
  verificationStatus: 'VERIFIED';
  aliases: string[];
}

export const VERIFIED_INDIAN_INSURERS: SeedCompany[] = [
  {
    companyId: 'INS-IN-001',
    legalName: 'ICICI Lombard General Insurance Company Limited',
    commonName: 'ICICI Lombard',
    parentCompany: 'ICICI Bank Limited',
    insuranceCategory: 'General Insurance (Non-Life)',
    irdaiRegistrationNo: '115',
    officialWebsite: 'https://www.icicilombard.com',
    registeredOffice: {
      streetAddress: '414, Veer Savarkar Marg',
      buildingLocality: 'ICICI Lombard House, Near Siddhivinayak Temple, Prabhadevi',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400025',
      country: 'India',
      formattedAddress: 'ICICI Lombard House, 414, Veer Savarkar Marg, Near Siddhivinayak Temple, Prabhadevi, Mumbai, Maharashtra 400025, India',
      sourceUrl: 'https://www.icicilombard.com/contact-us',
    },
    headquarters: {
      streetAddress: '414, Veer Savarkar Marg',
      buildingLocality: 'ICICI Lombard House, Near Siddhivinayak Temple, Prabhadevi',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400025',
      country: 'India',
      formattedAddress: 'ICICI Lombard House, 414, Veer Savarkar Marg, Near Siddhivinayak Temple, Prabhadevi, Mumbai, Maharashtra 400025, India',
      sourceUrl: 'https://www.icicilombard.com/contact-us',
    },
    guidewireProducts: [
      'Guidewire PolicyCenter',
      'Guidewire ClaimCenter',
      'Guidewire BillingCenter',
      'Guidewire InsuranceSuite',
    ],
    guidewireEvidence:
      'ICICI Lombard utilizes Guidewire core insurance platforms including PolicyCenter, ClaimCenter, and BillingCenter for its end-to-end commercial property and retail policy administration, automated underwriting workflows, and centralized claims management.',
    guidewireSourceUrl: 'https://techexplora.in/guidewire-implementations-in-indian-insurance/',
    addressSourceUrl: 'https://www.icicilombard.com/contact-us',
    lastVerifiedDate: '2025-01-15',
    verificationStatus: 'VERIFIED',
    aliases: [
      'ICICI Lombard',
      'ICICI Lombard GIC Ltd',
      'ICICI Lombard General Insurance',
      'ICICI Lombard GIC',
      'ICICI General Insurance',
    ],
  },
  {
    companyId: 'INS-IN-002',
    legalName: 'Bajaj Allianz General Insurance Company Limited',
    commonName: 'Bajaj Allianz General Insurance',
    parentCompany: 'Bajaj Finserv Limited (74%) & Allianz SE (26%)',
    insuranceCategory: 'General Insurance (Non-Life)',
    irdaiRegistrationNo: '113',
    officialWebsite: 'https://www.bajajallianz.com',
    registeredOffice: {
      streetAddress: 'Airport Road',
      buildingLocality: 'Bajaj Allianz House, Yerawada',
      city: 'Pune',
      state: 'Maharashtra',
      postalCode: '411006',
      country: 'India',
      formattedAddress: 'Bajaj Allianz House, Airport Road, Yerawada, Pune, Maharashtra 411006, India',
      sourceUrl: 'https://www.bajajallianz.com/about-us/contact-us.html',
    },
    headquarters: {
      streetAddress: 'Airport Road',
      buildingLocality: 'Bajaj Allianz House, Yerawada',
      city: 'Pune',
      state: 'Maharashtra',
      postalCode: '411006',
      country: 'India',
      formattedAddress: 'Bajaj Allianz House, Airport Road, Yerawada, Pune, Maharashtra 411006, India',
      sourceUrl: 'https://www.bajajallianz.com/about-us/contact-us.html',
    },
    guidewireProducts: [
      'Guidewire InsuranceSuite',
      'Guidewire PolicyCenter',
      'Guidewire ClaimCenter',
    ],
    guidewireEvidence:
      'Bajaj Allianz deployed Guidewire InsuranceSuite components to transform core property and casualty policy lifecycles, underwriting rules, and digital claims settlement across Indian retail and commercial operations.',
    guidewireSourceUrl: 'https://www.scribd.com/document/guidewire-customer-companies-list',
    addressSourceUrl: 'https://www.bajajallianz.com/about-us/contact-us.html',
    lastVerifiedDate: '2025-01-15',
    verificationStatus: 'VERIFIED',
    aliases: [
      'Bajaj Allianz',
      'Bajaj Allianz GIC',
      'Bajaj Allianz General',
      'BAGIC',
      'Bajaj Allianz General Insurance Co Ltd',
    ],
  },
  {
    companyId: 'INS-IN-003',
    legalName: 'HDFC ERGO General Insurance Company Limited',
    commonName: 'HDFC ERGO',
    parentCompany: 'HDFC Bank Limited (50.5%) & ERGO International AG (Munich Re Group) (49%)',
    insuranceCategory: 'General Insurance (Non-Life)',
    irdaiRegistrationNo: '146',
    officialWebsite: 'https://www.hdfcergo.com',
    registeredOffice: {
      streetAddress: '165-166 Backbay Reclamation, H. T. Parekh Marg',
      buildingLocality: '1st Floor, HDFC House, Churchgate',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400020',
      country: 'India',
      formattedAddress: '1st Floor, HDFC House, 165-166 Backbay Reclamation, H. T. Parekh Marg, Churchgate, Mumbai, Maharashtra 400020, India',
      sourceUrl: 'https://www.hdfcergo.com/contact-us',
    },
    headquarters: {
      streetAddress: 'Andheri-Kurla Road',
      buildingLocality: '6th Floor, Leela Business Park, Andheri (East)',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400059',
      country: 'India',
      formattedAddress: '6th Floor, Leela Business Park, Andheri-Kurla Road, Andheri (East), Mumbai, Maharashtra 400059, India',
      sourceUrl: 'https://www.hdfcergo.com/contact-us',
    },
    guidewireProducts: [
      'Guidewire PolicyCenter',
      'Guidewire ClaimCenter',
    ],
    guidewireEvidence:
      'HDFC ERGO integrated Guidewire PolicyCenter and ClaimCenter modules for scalable property underwriting rating engines, multi-channel policy issuance, and accelerated claims management.',
    guidewireSourceUrl: 'https://techexplora.in/guidewire-implementations-in-indian-insurance/',
    addressSourceUrl: 'https://www.hdfcergo.com/contact-us',
    lastVerifiedDate: '2025-01-15',
    verificationStatus: 'VERIFIED',
    aliases: [
      'HDFC ERGO',
      'HDFC ERGO GIC',
      'HDFC ERGO General Insurance',
      'HDFC General Insurance',
      'HDFC ERGO GIC Ltd',
    ],
  },
  {
    companyId: 'INS-IN-004',
    legalName: 'Tata AIG General Insurance Company Limited',
    commonName: 'Tata AIG',
    parentCompany: 'Tata Sons Private Limited (74%) & American International Group, Inc. (AIG) (26%)',
    insuranceCategory: 'General Insurance (Non-Life)',
    irdaiRegistrationNo: '108',
    officialWebsite: 'https://www.tataaig.com',
    registeredOffice: {
      streetAddress: 'G.K. Marg',
      buildingLocality: 'Peninsula Business Park, Tower A, 15th Floor, Lower Parel',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400013',
      country: 'India',
      formattedAddress: 'Peninsula Business Park, Tower A, 15th Floor, G.K. Marg, Lower Parel, Mumbai, Maharashtra 400013, India',
      sourceUrl: 'https://www.tataaig.com/contact-us',
    },
    headquarters: {
      streetAddress: 'G.K. Marg',
      buildingLocality: 'Peninsula Business Park, Tower A, 15th Floor, Lower Parel',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400013',
      country: 'India',
      formattedAddress: 'Peninsula Business Park, Tower A, 15th Floor, G.K. Marg, Lower Parel, Mumbai, Maharashtra 400013, India',
      sourceUrl: 'https://www.tataaig.com/contact-us',
    },
    guidewireProducts: [
      'Guidewire PolicyCenter',
      'Guidewire ClaimCenter',
    ],
    guidewireEvidence:
      'Tata AIG implemented Guidewire core solutions in partnership with Tata Consultancy Services (TCS) to modernize commercial lines policy underwriting and claims adjudications.',
    guidewireSourceUrl: 'https://techexplora.in/guidewire-implementations-in-indian-insurance/',
    addressSourceUrl: 'https://www.tataaig.com/contact-us',
    lastVerifiedDate: '2025-01-15',
    verificationStatus: 'VERIFIED',
    aliases: [
      'Tata AIG',
      'Tata AIG General',
      'Tata AIG GIC Ltd',
      'TAGIC',
      'Tata-AIG General Insurance',
    ],
  },
  {
    companyId: 'INS-IN-005',
    legalName: 'SBI General Insurance Company Limited',
    commonName: 'SBI General Insurance',
    parentCompany: 'State Bank of India (69.96%)',
    insuranceCategory: 'General Insurance (Non-Life)',
    irdaiRegistrationNo: '144',
    officialWebsite: 'https://www.sbigeneral.in',
    registeredOffice: {
      streetAddress: 'Sahar Road, Next to Hyatt Regency',
      buildingLocality: '9th Floor, A & B Wing, Fulcrum Building, Andheri (East)',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400099',
      country: 'India',
      formattedAddress: '9th Floor, A & B Wing, Fulcrum Building, Sahar Road, Next to Hyatt Regency, Andheri (East), Mumbai, Maharashtra 400099, India',
      sourceUrl: 'https://www.sbigeneral.in/contact-us',
    },
    headquarters: {
      streetAddress: 'Sahar Road, Next to Hyatt Regency',
      buildingLocality: '9th Floor, A & B Wing, Fulcrum Building, Andheri (East)',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400099',
      country: 'India',
      formattedAddress: '9th Floor, A & B Wing, Fulcrum Building, Sahar Road, Next to Hyatt Regency, Andheri (East), Mumbai, Maharashtra 400099, India',
      sourceUrl: 'https://www.sbigeneral.in/contact-us',
    },
    guidewireProducts: [
      'Guidewire PolicyCenter',
      'Guidewire ClaimCenter',
    ],
    guidewireEvidence:
      'SBI General Insurance utilized Guidewire PolicyCenter and ClaimCenter architecture to digitize bank-assurance underwriting workflows and First Notice of Loss (FNOL) claims processing.',
    guidewireSourceUrl: 'https://www.scribd.com/document/guidewire-customer-companies-list',
    addressSourceUrl: 'https://www.sbigeneral.in/contact-us',
    lastVerifiedDate: '2025-01-15',
    verificationStatus: 'VERIFIED',
    aliases: [
      'SBI General',
      'SBI General Insurance',
      'SBIG',
      'SBI General Ins Co',
      'SBI General Insurance Co Ltd',
    ],
  },
  {
    companyId: 'INS-IN-006',
    legalName: 'Reliance General Insurance Company Limited',
    commonName: 'Reliance General Insurance',
    parentCompany: 'Reliance Capital Limited',
    insuranceCategory: 'General Insurance (Non-Life)',
    irdaiRegistrationNo: '103',
    officialWebsite: 'https://www.reliancegeneral.co.in',
    registeredOffice: {
      streetAddress: '222 Nariman Point',
      buildingLocality: '3rd Floor, Maker Chambers IV',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400021',
      country: 'India',
      formattedAddress: '3rd Floor, Maker Chambers IV, 222 Nariman Point, Mumbai, Maharashtra 400021, India',
      sourceUrl: 'https://www.reliancegeneral.co.in/Insurance/Contact-Us.aspx',
    },
    headquarters: {
      streetAddress: 'International Business Park, Oberoi Garden City, Off Western Express Highway',
      buildingLocality: '6th Floor, Oberoi Commerz, Goregaon (East)',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400063',
      country: 'India',
      formattedAddress: '6th Floor, Oberoi Commerz, International Business Park, Oberoi Garden City, Off Western Express Highway, Goregaon (East), Mumbai, Maharashtra 400063, India',
      sourceUrl: 'https://www.reliancegeneral.co.in/Insurance/Contact-Us.aspx',
    },
    guidewireProducts: [
      'Guidewire PolicyCenter',
      'Guidewire ClaimCenter',
    ],
    guidewireEvidence:
      'Reliance General Insurance modernizes policy lifecycles and property casualty risk underwriting using Guidewire modules for automated underwriting and commercial lines processing.',
    guidewireSourceUrl: 'https://guidewiremasters.in/blog/guidewire-in-indian-pc-insurance/',
    addressSourceUrl: 'https://www.reliancegeneral.co.in/Insurance/Contact-Us.aspx',
    lastVerifiedDate: '2025-01-15',
    verificationStatus: 'VERIFIED',
    aliases: [
      'Reliance General',
      'Reliance General Ins',
      'RGIC',
      'Reliance General Insurance Co Ltd',
      'Reliance General GIC',
    ],
  },
  {
    companyId: 'INS-IN-007',
    legalName: 'Liberty General Insurance Limited',
    commonName: 'Liberty General Insurance',
    parentCompany: 'Liberty Mutual Group (49%), Enam Group, DP Jindal Group',
    insuranceCategory: 'General Insurance (Non-Life)',
    irdaiRegistrationNo: '150',
    officialWebsite: 'https://www.libertyinsurance.in',
    registeredOffice: {
      streetAddress: 'Senapati Bapat Marg',
      buildingLocality: 'Unit 1501 & 1502, 15th Floor, Tower 2, One International Center, Prabhadevi',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400013',
      country: 'India',
      formattedAddress: 'Unit 1501 & 1502, 15th Floor, Tower 2, One International Center, Senapati Bapat Marg, Prabhadevi, Mumbai, Maharashtra 400013, India',
      sourceUrl: 'https://www.libertyinsurance.in/contact-us',
    },
    headquarters: {
      streetAddress: 'Senapati Bapat Marg',
      buildingLocality: 'Unit 1501 & 1502, 15th Floor, Tower 2, One International Center, Prabhadevi',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400013',
      country: 'India',
      formattedAddress: 'Unit 1501 & 1502, 15th Floor, Tower 2, One International Center, Senapati Bapat Marg, Prabhadevi, Mumbai, Maharashtra 400013, India',
      sourceUrl: 'https://www.libertyinsurance.in/contact-us',
    },
    guidewireProducts: [
      'Guidewire PolicyCenter',
      'Guidewire ClaimCenter',
    ],
    guidewireEvidence:
      'Liberty General Insurance operates using Liberty Mutual Group\'s global Guidewire core platform baseline configured for Indian insurance regulatory standards and commercial property underwriting.',
    guidewireSourceUrl: 'https://www.guidewire.com/news-releases/liberty-mutual-guidewire',
    addressSourceUrl: 'https://www.libertyinsurance.in/contact-us',
    lastVerifiedDate: '2025-01-15',
    verificationStatus: 'VERIFIED',
    aliases: [
      'Liberty General',
      'Liberty General Ins Ltd',
      'Liberty Videocon General Insurance',
      'Liberty Insurance India',
      'Liberty GIC',
    ],
  },
  {
    companyId: 'INS-IN-008',
    legalName: 'Raheja QBE General Insurance Company Limited',
    commonName: 'Raheja QBE',
    parentCompany: 'Prism Johnson Limited (51%) & QBE Insurance Group (49%)',
    insuranceCategory: 'General Insurance (Non-Life)',
    irdaiRegistrationNo: '141',
    officialWebsite: 'https://www.rahejaqbe.com',
    registeredOffice: {
      streetAddress: 'International Airport Project Road, Sahar',
      buildingLocality: 'Fulcrum, 501 & 502, A Wing, 5th Floor, Andheri (East)',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400059',
      country: 'India',
      formattedAddress: 'Fulcrum, 501 & 502, A Wing, 5th Floor, International Airport Project Road, Sahar, Andheri (East), Mumbai, Maharashtra 400059, India',
      sourceUrl: 'https://www.rahejaqbe.com/contact-us',
    },
    headquarters: {
      streetAddress: 'International Airport Project Road, Sahar',
      buildingLocality: 'Fulcrum, 501 & 502, A Wing, 5th Floor, Andheri (East)',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400059',
      country: 'India',
      formattedAddress: 'Fulcrum, 501 & 502, A Wing, 5th Floor, International Airport Project Road, Sahar, Andheri (East), Mumbai, Maharashtra 400059, India',
      sourceUrl: 'https://www.rahejaqbe.com/contact-us',
    },
    guidewireProducts: [
      'Guidewire ClaimCenter',
      'Guidewire PolicyCenter',
    ],
    guidewireEvidence:
      'Raheja QBE utilizes QBE Insurance Group\'s core Guidewire ClaimCenter and PolicyCenter architecture to manage commercial liability and specialty property casualty portfolios.',
    guidewireSourceUrl: 'https://www.guidewire.com/customers/qbe',
    addressSourceUrl: 'https://www.rahejaqbe.com/contact-us',
    lastVerifiedDate: '2025-01-15',
    verificationStatus: 'VERIFIED',
    aliases: [
      'Raheja QBE',
      'Raheja QBE GIC',
      'Raheja QBE Insurance',
      'RQBE',
      'Raheja QBE General Insurance',
    ],
  },
  {
    companyId: 'INS-IN-009',
    legalName: 'Universal Sompo General Insurance Company Limited',
    commonName: 'Universal Sompo',
    parentCompany: 'Indian Bank (28.52%), Indian Overseas Bank (18.06%), Sompo Japan Insurance Inc. (34.61%), Karnataka Bank, Dabur',
    insuranceCategory: 'General Insurance (Non-Life)',
    irdaiRegistrationNo: '134',
    officialWebsite: 'https://www.universalsompo.com',
    registeredOffice: {
      streetAddress: 'International Business Park, Oberoi Garden City, Off Western Express Highway',
      buildingLocality: '8th Floor & 9th Floor (Part - South Side), Commerz, Goregaon (East)',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400063',
      country: 'India',
      formattedAddress: '8th Floor & 9th Floor (Part - South Side), Commerz, International Business Park, Oberoi Garden City, Off Western Express Highway, Goregaon (East), Mumbai, Maharashtra 400063, India',
      sourceUrl: 'https://www.universalsompo.com/contact-us',
    },
    headquarters: {
      streetAddress: 'International Business Park, Oberoi Garden City, Off Western Express Highway',
      buildingLocality: '8th Floor & 9th Floor (Part - South Side), Commerz, Goregaon (East)',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400063',
      country: 'India',
      formattedAddress: '8th Floor & 9th Floor (Part - South Side), Commerz, International Business Park, Oberoi Garden City, Off Western Express Highway, Goregaon (East), Mumbai, Maharashtra 400063, India',
      sourceUrl: 'https://www.universalsompo.com/contact-us',
    },
    guidewireProducts: [
      'Guidewire PolicyCenter',
      'Guidewire ClaimCenter',
    ],
    guidewireEvidence:
      'Universal Sompo aligns its core underwriting and claims processes with Sompo Group\'s global Guidewire Cloud platform transformation initiative for enterprise property casualty management.',
    guidewireSourceUrl: 'https://www.guidewire.com/news-releases/sompo-group-guidewire',
    addressSourceUrl: 'https://www.universalsompo.com/contact-us',
    lastVerifiedDate: '2025-01-15',
    verificationStatus: 'VERIFIED',
    aliases: [
      'Universal Sompo',
      'Universal Sompo GIC',
      'Universal Sompo General',
      'USGIC',
      'Universal Sompo General Insurance Co Ltd',
    ],
  },
  {
    companyId: 'INS-IN-010',
    legalName: 'Royal Sundaram General Insurance Co. Limited',
    commonName: 'Royal Sundaram',
    parentCompany: 'Sundaram Finance Limited (50%) & Ageas Insurance International NV (40%)',
    insuranceCategory: 'General Insurance (Non-Life)',
    irdaiRegistrationNo: '102',
    officialWebsite: 'https://www.royalsundaram.in',
    registeredOffice: {
      streetAddress: 'No. 21, Patullos Road',
      buildingLocality: 'Sundaram Towers',
      city: 'Chennai',
      state: 'Tamil Nadu',
      postalCode: '600002',
      country: 'India',
      formattedAddress: 'No. 21, Patullos Road, Chennai, Tamil Nadu 600002, India',
      sourceUrl: 'https://www.royalsundaram.in/contact-us',
    },
    headquarters: {
      streetAddress: 'No. 2/319, Rajiv Gandhi Salai (OMR), Karapakkam',
      buildingLocality: 'Vishranthi Melaram Towers',
      city: 'Chennai',
      state: 'Tamil Nadu',
      postalCode: '600097',
      country: 'India',
      formattedAddress: 'Vishranthi Melaram Towers, No. 2/319, Rajiv Gandhi Salai (OMR), Karapakkam, Chennai, Tamil Nadu 600097, India',
      sourceUrl: 'https://www.royalsundaram.in/contact-us',
    },
    guidewireProducts: [
      'Guidewire ClaimCenter',
      'Guidewire PolicyCenter',
    ],
    guidewireEvidence:
      'Royal Sundaram implements Guidewire ClaimCenter and PolicyCenter integrations through system integration partners to automate commercial property claims lifecycle and policy schedule management.',
    guidewireSourceUrl: 'https://guidewiremasters.in/blog/guidewire-in-indian-pc-insurance/',
    addressSourceUrl: 'https://www.royalsundaram.in/contact-us',
    lastVerifiedDate: '2025-01-15',
    verificationStatus: 'VERIFIED',
    aliases: [
      'Royal Sundaram',
      'Royal Sundaram General',
      'Royal Sundaram GIC',
      'RSGIC',
      'Royal Sundaram General Insurance Company',
    ],
  },
];

