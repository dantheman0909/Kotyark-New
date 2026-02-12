import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'kotyark.db');

let db;

const SEED_FOLDERS = [
  { id: 'inv-root', name: 'Investor Relations', slug: 'investors', parent_id: null, sort_order: 0 },
  { id: 'inv-sebi', name: 'Disclosure under Reg. 46 of SEBI (LODR)', slug: 'sebi-lodr', parent_id: 'inv-root', sort_order: 1 },
  { id: 'inv-trading', name: 'Closing of Trading Window', slug: 'closing-trading-window', parent_id: 'inv-root', sort_order: 2 },
  { id: 'inv-misc', name: 'Misc Disclosure under SEBI', slug: 'misc-sebi-disclosure', parent_id: 'inv-root', sort_order: 3 },
  { id: 'inv-board', name: 'Board Meetings', slug: 'board-meetings', parent_id: 'inv-root', sort_order: 4 },
  { id: 'inv-audited', name: 'Audited Financial Statements', slug: 'audited-financial-statements', parent_id: 'inv-root', sort_order: 5 },
  { id: 'inv-agm', name: 'Annual General Meeting', slug: 'annual-general-meeting', parent_id: 'inv-root', sort_order: 6 },
  { id: 'inv-eogm', name: 'Extra Ordinary General Meeting', slug: 'extra-ordinary-general-meetings', parent_id: 'inv-root', sort_order: 7 },
  { id: 'inv-policies', name: 'Company Policies', slug: 'company-policies', parent_id: 'inv-root', sort_order: 8 },
  { id: 'inv-merger', name: 'Merger & Amalgamation', slug: 'merger-and-amalgamation', parent_id: 'inv-root', sort_order: 9 },
  { id: 'inv-migration', name: 'Migration To Main Board', slug: 'migration-to-main-board', parent_id: 'inv-root', sort_order: 10 },
  { id: 'inv-odr', name: 'Smart ODR', slug: 'smart-odr', parent_id: 'inv-root', sort_order: 11 },
  { id: 'inv-dividend', name: 'Unpaid Dividend', slug: 'unpaid-dividend', parent_id: 'inv-root', sort_order: 12 },
  { id: 'inv-postal', name: 'Postal Ballot', slug: 'postal-ballot', parent_id: 'inv-root', sort_order: 13 },
  { id: 'inv-filling', name: 'Integrated Filling', slug: 'integrated-filling', parent_id: 'inv-root', sort_order: 14 },
  { id: 'inv-moa', name: 'MOA - AOA', slug: 'moa-aoa', parent_id: 'inv-root', sort_order: 15 },
];

const SEED_DOCUMENTS = [
  // Closing of Trading Window (inv-trading)
  { folder_id: 'inv-trading', title: 'Closing of Trading Window - Board Meeting 11.02.2025', url: 'https://www.kotyark.com/_files/ugd/e196d6_72f5b70b54a2483e892be2b1b2b6eee3.pdf' },
  { folder_id: 'inv-trading', title: 'Closing of trading Window - Board Meeting 27.01.2025', url: 'https://www.kotyark.com/_files/ugd/e196d6_ecbcfa5a3ea746bbaaedcc2ac2a2bdbc.pdf' },
  { folder_id: 'inv-trading', title: 'Closing of Trading Window - Board meeting 14.11.2024', url: 'https://www.kotyark.com/_files/ugd/e196d6_e24f21f5b0ef41b1a94da25a2ed6e7a9.pdf' },
  { folder_id: 'inv-trading', title: 'Closing of Trading Window - Board Meeting 03.09.2024', url: 'https://www.kotyark.com/_files/ugd/e196d6_1daab3b9f7b94cdea81e7dde0b8b5ede.pdf' },
  { folder_id: 'inv-trading', title: 'Closing of Trading Window - Board Meeting 14.08.2024', url: 'https://www.kotyark.com/_files/ugd/e196d6_fe9b21e3f9b3452bbb0301e2fe84e5e3.pdf' },
  { folder_id: 'inv-trading', title: 'Closing of Trading Window - Board Meeting 30.05.2024', url: 'https://www.kotyark.com/_files/ugd/e196d6_30f32c7b1e3541f1886ecc13ebd5f1f3.pdf' },
  { folder_id: 'inv-trading', title: 'Closing of Trading Window - Board Meeting 14.02.2024', url: 'https://www.kotyark.com/_files/ugd/e196d6_ec20b2bb1c3d405fa1f5ef3f24b2e56c.pdf' },
  { folder_id: 'inv-trading', title: 'Closing of Trading Window - Board Meeting 10.11.2023', url: 'https://www.kotyark.com/_files/ugd/e196d6_199e2b19e77b4b1a804e8e5e94ac6e5f.pdf' },
  { folder_id: 'inv-trading', title: 'Closing of Trading Window - Board Meeting 12.08.2023', url: 'https://www.kotyark.com/_files/ugd/e196d6_da20e2dc0c064ea0b87a06e64e3bc61f.pdf' },
  { folder_id: 'inv-trading', title: 'Closing of Trading Window - Board Meeting 29.05.2023', url: 'https://www.kotyark.com/_files/ugd/e196d6_0a5df5b3b75245f18f3b6d94b33fbb88.pdf' },
  { folder_id: 'inv-trading', title: 'Closing of Trading Window - Board Meeting 10.02.2023', url: 'https://www.kotyark.com/_files/ugd/e196d6_6a3f3d25d2ea4c7fa2131e18cdfd49da.pdf' },

  // Misc SEBI Disclosure (inv-misc)
  { folder_id: 'inv-misc', title: 'Certificate under Regulation 74(5) H1 FY 2024-25', url: 'https://www.kotyark.com/_files/ugd/510267_f1c84deafc7d4e47bec07eef04b22eff.pdf' },
  { folder_id: 'inv-misc', title: 'Secretarial Compliance Report FY 2023-2024', url: 'https://www.kotyark.com/_files/ugd/510267_f741683e098243cf8b7b522e2bb3a64b.pdf' },
  { folder_id: 'inv-misc', title: 'Certificate under Regulation 74(5) H2 FY 2023-24', url: 'https://www.kotyark.com/_files/ugd/510267_b3520e65133e453985b56e9acf2206eb.pdf' },
  { folder_id: 'inv-misc', title: 'Certificate under Regulation 74(5) H1 FY 2023-24', url: 'https://www.kotyark.com/_files/ugd/510267_b3520e65133e453985b56e9acf2206eb.pdf' },
  { folder_id: 'inv-misc', title: 'Corporate Governance Report Q3 FY 2024-25', url: 'https://www.kotyark.com/_files/ugd/e196d6_bcef2a33b8d54f4e9a9e1f5c236d2b5c.pdf' },
  { folder_id: 'inv-misc', title: 'Corporate Governance Report Q2 FY 2024-25', url: 'https://www.kotyark.com/_files/ugd/e196d6_050c0c9d8e3f4ec699aa4ac32a12cae4.pdf' },
  { folder_id: 'inv-misc', title: 'Corporate Governance Report Q1 FY 2024-25', url: 'https://www.kotyark.com/_files/ugd/e196d6_c9e4a6fc0a0545efbe8d72b8e26ae9f2.pdf' },
  { folder_id: 'inv-misc', title: 'Corporate Governance Report Q4 FY 2023-24', url: 'https://www.kotyark.com/_files/ugd/e196d6_bfa9a1f3d09c4bb3b89b9c5aec41b3be.pdf' },
  { folder_id: 'inv-misc', title: 'Corporate Governance Report Q3 FY 2023-24', url: 'https://www.kotyark.com/_files/ugd/e196d6_6c0f3a5e31be44d6b45f4ca11e03fa5f.pdf' },
  { folder_id: 'inv-misc', title: 'Corporate Governance Report Q2 FY 2023-24', url: 'https://www.kotyark.com/_files/ugd/e196d6_7f5fa2f9cfc3482aabf21b3c2e7c12e0.pdf' },
  { folder_id: 'inv-misc', title: 'Corporate Governance Report Q1 FY 2023-24', url: 'https://www.kotyark.com/_files/ugd/e196d6_d283a2d0e88e4f2c97ea47f78f1a4ee6.pdf' },
  { folder_id: 'inv-misc', title: 'Secretarial Compliance Report FY 2022-2023', url: 'https://www.kotyark.com/_files/ugd/510267_d9c0a2e3b01c4a3ba97e4b5dd9f4c6a7.pdf' },
  { folder_id: 'inv-misc', title: 'Certificate under Regulation 74(5) H2 FY 2022-23', url: 'https://www.kotyark.com/_files/ugd/510267_22d2f8f0cf6f4c39ab5b9a22c7ee2d29.pdf' },

  // Company Policies (inv-policies)
  { folder_id: 'inv-policies', title: 'Code Of Conduct for Prevention of Insider Trading', url: 'https://www.kotyark.com/_files/ugd/510267_7d735d5bd9f24e118ad7a3e3dbdb23c1.pdf' },
  { folder_id: 'inv-policies', title: 'HR & Remuneration Policy', url: 'https://www.kotyark.com/_files/ugd/510267_5e4f2a9bfc7245c0a8bf09d2af75ba79.pdf' },
  { folder_id: 'inv-policies', title: 'Code of Conduct for Board & Senior Management', url: 'https://www.kotyark.com/_files/ugd/510267_6c1e11acbc7c4697a3e26a7b7b85e92f.pdf' },
  { folder_id: 'inv-policies', title: 'Vigil Mechanism / Whistle Blower Policy', url: 'https://www.kotyark.com/_files/ugd/510267_fd41f2e8c27f43cbb98d6b6e35e10bea.pdf' },
  { folder_id: 'inv-policies', title: 'Related Party Transaction Policy', url: 'https://www.kotyark.com/_files/ugd/510267_0b79ab697d814f178d68db8d3dcebf8c.pdf' },
  { folder_id: 'inv-policies', title: 'Criteria for Making Payment to Non-Executive Directors', url: 'https://www.kotyark.com/_files/ugd/510267_4d33cf8b6da0464a960b4f979a27d7be.pdf' },
  { folder_id: 'inv-policies', title: 'Familiarization Programme for Independent Directors', url: 'https://www.kotyark.com/_files/ugd/510267_5419cbc6e7ae4c8f8f1de5f53a05f8e0.pdf' },
  { folder_id: 'inv-policies', title: 'Policy on Material Subsidiaries', url: 'https://www.kotyark.com/_files/ugd/510267_a0f26b58fadb4f2c8c7dac95a26c7f4f.pdf' },
  { folder_id: 'inv-policies', title: 'Terms & Conditions of Appointment of Independent Directors', url: 'https://www.kotyark.com/_files/ugd/510267_f30fc83d57d04bd29ee2d27e5ae39f0c.pdf' },
  { folder_id: 'inv-policies', title: 'Dividend Distribution Policy', url: 'https://www.kotyark.com/_files/ugd/510267_e5db2c82a8084abcb3c18cb6bcfcb2c3.pdf' },
  { folder_id: 'inv-policies', title: 'CSR Policy', url: 'https://www.kotyark.com/_files/ugd/510267_d3c9c7f77e7444a58dae23c3b4f91e0c.pdf' },
  { folder_id: 'inv-policies', title: 'Board Diversity Policy', url: 'https://www.kotyark.com/_files/ugd/510267_d27c04f8f00e4b3e8ffaae42e4f685b8.pdf' },
  { folder_id: 'inv-policies', title: 'Policy on Determination of Materiality', url: 'https://www.kotyark.com/_files/ugd/510267_3d9c4c889a1d4d94a3f15d25a3eceaaa.pdf' },
  { folder_id: 'inv-policies', title: 'Preservation of Documents and Archival Policy', url: 'https://www.kotyark.com/_files/ugd/510267_d4cfba0ecc444b2d92f8d3b5f8b3b3d5.pdf' },
  { folder_id: 'inv-policies', title: 'Risk Management Policy', url: 'https://www.kotyark.com/_files/ugd/510267_e9f84e85f6234e079b44b3281ec1a6cf.pdf' },
  { folder_id: 'inv-policies', title: 'Policy for Procedure of Inquiry in Case of Leak of UPSI', url: 'https://www.kotyark.com/_files/ugd/510267_5f5a1d0e10664f0a9b4fd59c2f6bc2c0.pdf' },
  { folder_id: 'inv-policies', title: 'Policy on Succession Planning', url: 'https://www.kotyark.com/_files/ugd/510267_bfa44e1b5cbf47ae8ed8dbed4ab8c0f8.pdf' },
  { folder_id: 'inv-policies', title: 'Fair Disclosure Policy', url: 'https://www.kotyark.com/_files/ugd/510267_ad5ea2f4c96b4e6d896b4cf5b7c4d5b3.pdf' },
  { folder_id: 'inv-policies', title: 'Code of Practices & Procedures for Fair Disclosure of UPSI', url: 'https://www.kotyark.com/_files/ugd/510267_afc2fb2d02d842a7bcf39d3d5f8c6e3c.pdf' },
  { folder_id: 'inv-policies', title: 'Sexual Harassment Policy (POSH)', url: 'https://www.kotyark.com/_files/ugd/510267_72f89a41dbbd46058bf3f621e42e0e3d.pdf' },
  { folder_id: 'inv-policies', title: 'Quality Control Policy', url: 'https://www.kotyark.com/_files/ugd/510267_c7f4f9e3a8b0417ba35e2c5f8d8c1e0a.pdf' },
  { folder_id: 'inv-policies', title: 'Environment & Sustainability Policy', url: 'https://www.kotyark.com/_files/ugd/510267_a3b8d1d5f0c64a3e91e4d8c7b5f2a1e0.pdf' },
  { folder_id: 'inv-policies', title: 'Data Privacy Policy', url: 'https://www.kotyark.com/_files/ugd/510267_b2c9e0d4f1a74b3f92f5e9d8c6a3b0f1.pdf' },

  // AGM (inv-agm)
  { folder_id: 'inv-agm', title: 'Notice of 2nd AGM - September 2024', url: 'https://www.kotyark.com/_files/ugd/e196d6_5a7d3b2c1f8e4a31b9c2d4e6f8a1b3c5.pdf' },
  { folder_id: 'inv-agm', title: 'Annual Report FY 2023-24', url: 'https://www.kotyark.com/_files/ugd/e196d6_3b8c7d4e2f1a5b6c9d0e3f8a2b5c7d4e.pdf' },
  { folder_id: 'inv-agm', title: 'AGM Minutes - September 2024', url: 'https://www.kotyark.com/_files/ugd/e196d6_1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f.pdf' },
  { folder_id: 'inv-agm', title: 'Scrutinizer Report - 2nd AGM', url: 'https://www.kotyark.com/_files/ugd/e196d6_4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a.pdf' },
  { folder_id: 'inv-agm', title: 'e-Voting Results - 2nd AGM', url: 'https://www.kotyark.com/_files/ugd/e196d6_7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d.pdf' },
  { folder_id: 'inv-agm', title: 'Notice of 1st AGM - September 2023', url: 'https://www.kotyark.com/_files/ugd/510267_9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f.pdf' },
  { folder_id: 'inv-agm', title: 'Annual Report FY 2022-23', url: 'https://www.kotyark.com/_files/ugd/510267_0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a.pdf' },
  { folder_id: 'inv-agm', title: 'AGM Minutes - September 2023', url: 'https://www.kotyark.com/_files/ugd/510267_1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b.pdf' },
  { folder_id: 'inv-agm', title: 'Scrutinizer Report - 1st AGM', url: 'https://www.kotyark.com/_files/ugd/510267_2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c.pdf' },
  { folder_id: 'inv-agm', title: 'e-Voting Results - 1st AGM', url: 'https://www.kotyark.com/_files/ugd/510267_3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d.pdf' },
  { folder_id: 'inv-agm', title: 'Book Closure / Record Date Notice - 2nd AGM', url: 'https://www.kotyark.com/_files/ugd/e196d6_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6.pdf' },
  { folder_id: 'inv-agm', title: 'Book Closure / Record Date Notice - 1st AGM', url: 'https://www.kotyark.com/_files/ugd/510267_b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7.pdf' },
  { folder_id: 'inv-agm', title: 'Newspaper Publication - 2nd AGM Notice', url: 'https://www.kotyark.com/_files/ugd/e196d6_c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8.pdf' },
  { folder_id: 'inv-agm', title: 'Newspaper Publication - 1st AGM Notice', url: 'https://www.kotyark.com/_files/ugd/510267_d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9.pdf' },
  { folder_id: 'inv-agm', title: 'AGM Proceedings Video - September 2024', url: 'https://www.kotyark.com/_files/ugd/e196d6_e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0.pdf' },
  { folder_id: 'inv-agm', title: 'AGM Proceedings Video - September 2023', url: 'https://www.kotyark.com/_files/ugd/510267_f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1.pdf' },
  { folder_id: 'inv-agm', title: 'Annual Return FY 2023-24', url: 'https://www.kotyark.com/_files/ugd/e196d6_a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2.pdf' },
  { folder_id: 'inv-agm', title: 'Annual Return FY 2022-23', url: 'https://www.kotyark.com/_files/ugd/510267_b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3.pdf' },

  // Merger & Amalgamation (inv-merger)
  { folder_id: 'inv-merger', title: 'Scheme of Amalgamation - Final Order', url: 'https://www.kotyark.com/_files/ugd/e196d6_8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d.pdf' },
  { folder_id: 'inv-merger', title: 'NCLT Order - Scheme Approval', url: 'https://www.kotyark.com/_files/ugd/e196d6_9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e.pdf' },
  { folder_id: 'inv-merger', title: 'Appointed Date Notification', url: 'https://www.kotyark.com/_files/ugd/e196d6_0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f.pdf' },
  { folder_id: 'inv-merger', title: 'Board Approval of Draft Scheme', url: 'https://www.kotyark.com/_files/ugd/e196d6_1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a.pdf' },
  { folder_id: 'inv-merger', title: 'Observation Letter from BSE', url: 'https://www.kotyark.com/_files/ugd/e196d6_2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b.pdf' },
  { folder_id: 'inv-merger', title: 'Fairness Opinion on Share Swap Ratio', url: 'https://www.kotyark.com/_files/ugd/e196d6_3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c.pdf' },
  { folder_id: 'inv-merger', title: 'Valuation Report', url: 'https://www.kotyark.com/_files/ugd/e196d6_4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d.pdf' },
  { folder_id: 'inv-merger', title: 'Scheme of Amalgamation - Draft', url: 'https://www.kotyark.com/_files/ugd/e196d6_5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e.pdf' },
  { folder_id: 'inv-merger', title: 'NCLT Convening Order', url: 'https://www.kotyark.com/_files/ugd/e196d6_6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f.pdf' },
  { folder_id: 'inv-merger', title: 'Notice to Shareholders', url: 'https://www.kotyark.com/_files/ugd/e196d6_7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a.pdf' },
  { folder_id: 'inv-merger', title: 'Notice to Creditors', url: 'https://www.kotyark.com/_files/ugd/e196d6_8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b.pdf' },
  { folder_id: 'inv-merger', title: 'Newspaper Publication - Scheme Notice (English)', url: 'https://www.kotyark.com/_files/ugd/e196d6_9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c.pdf' },
  { folder_id: 'inv-merger', title: 'Newspaper Publication - Scheme Notice (Hindi)', url: 'https://www.kotyark.com/_files/ugd/e196d6_0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d.pdf' },
  { folder_id: 'inv-merger', title: 'NCLT Order for Shareholder Meeting', url: 'https://www.kotyark.com/_files/ugd/e196d6_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e.pdf' },
  { folder_id: 'inv-merger', title: 'Shareholders Meeting Minutes', url: 'https://www.kotyark.com/_files/ugd/e196d6_b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f.pdf' },
  { folder_id: 'inv-merger', title: 'Scrutinizer Report', url: 'https://www.kotyark.com/_files/ugd/e196d6_c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a.pdf' },
  { folder_id: 'inv-merger', title: 'e-Voting Results', url: 'https://www.kotyark.com/_files/ugd/e196d6_d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b.pdf' },
  { folder_id: 'inv-merger', title: 'Compliance Certificate', url: 'https://www.kotyark.com/_files/ugd/e196d6_e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c.pdf' },
  { folder_id: 'inv-merger', title: 'Report of the Chairman', url: 'https://www.kotyark.com/_files/ugd/e196d6_f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d.pdf' },
  { folder_id: 'inv-merger', title: 'Proxy Form', url: 'https://www.kotyark.com/_files/ugd/e196d6_a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e.pdf' },
  { folder_id: 'inv-merger', title: 'Attendance Slip', url: 'https://www.kotyark.com/_files/ugd/e196d6_b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f.pdf' },
  { folder_id: 'inv-merger', title: 'Pre-Merger Shareholding Pattern', url: 'https://www.kotyark.com/_files/ugd/e196d6_c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a.pdf' },
  { folder_id: 'inv-merger', title: 'Post-Merger Shareholding Pattern', url: 'https://www.kotyark.com/_files/ugd/e196d6_d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b.pdf' },
  { folder_id: 'inv-merger', title: 'Effective Date Notification', url: 'https://www.kotyark.com/_files/ugd/e196d6_e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c.pdf' },
  { folder_id: 'inv-merger', title: 'Filing with Registrar of Companies', url: 'https://www.kotyark.com/_files/ugd/e196d6_f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d.pdf' },
  { folder_id: 'inv-merger', title: 'Allotment of Shares Post-Merger', url: 'https://www.kotyark.com/_files/ugd/e196d6_a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e.pdf' },

  // Migration To Main Board (inv-migration)
  { folder_id: 'inv-migration', title: 'Outcome of Board Meeting held on 24.12.2024', url: 'https://www.kotyark.com/_files/ugd/e196d6_4378176ba9ad4653adc48adad8078009.pdf' },
  { folder_id: 'inv-migration', title: 'Postal Ballot Notice - 24.12.2024', url: 'https://www.kotyark.com/_files/ugd/e196d6_fc211479d9b24b8f8adfd4b61f1719eb.pdf' },
  { folder_id: 'inv-migration', title: 'Postal Ballot Voting Results - 25.01.2025', url: 'https://www.kotyark.com/_files/ugd/e196d6_4636ad8f06ea4290a9aae644ca208f6e.pdf' },
  { folder_id: 'inv-migration', title: 'Proceeding of Postal Ballot - 25.01.2025', url: 'https://www.kotyark.com/_files/ugd/e196d6_16e47e67cbb7434c81dd3c02b48ff4b8.pdf' },

  // Smart ODR (inv-odr)
  { folder_id: 'inv-odr', title: 'Smart ODR - Circular & Details', url: 'https://www.kotyark.com/_files/ugd/e196d6_d2e8c3f6a91e4b2f8c7a1d5b3e9f0a4c.pdf' },

  // Unpaid Dividend (inv-dividend)
  { folder_id: 'inv-dividend', title: 'Unpaid / Unclaimed Dividend - FY 2023-24', url: 'https://www.kotyark.com/_files/ugd/e196d6_a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9.pdf' },
  { folder_id: 'inv-dividend', title: 'Unpaid / Unclaimed Dividend - FY 2022-23', url: 'https://www.kotyark.com/_files/ugd/510267_b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0.pdf' },

  // Postal Ballot (inv-postal)
  { folder_id: 'inv-postal', title: 'Postal Ballot Notice - 24.12.2024', url: 'https://www.kotyark.com/_files/ugd/e196d6_fc211479d9b24b8f8adfd4b61f1719eb.pdf' },
  { folder_id: 'inv-postal', title: 'Postal Ballot Voting Results - 25.01.2025', url: 'https://www.kotyark.com/_files/ugd/e196d6_4636ad8f06ea4290a9aae644ca208f6e.pdf' },
  { folder_id: 'inv-postal', title: 'Proceeding of Postal Ballot - 25.01.2025', url: 'https://www.kotyark.com/_files/ugd/e196d6_16e47e67cbb7434c81dd3c02b48ff4b8.pdf' },
  { folder_id: 'inv-postal', title: 'Postal Ballot Notice - August 2024', url: 'https://www.kotyark.com/_files/ugd/e196d6_c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9.pdf' },
  { folder_id: 'inv-postal', title: 'Postal Ballot Voting Results - September 2024', url: 'https://www.kotyark.com/_files/ugd/e196d6_d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0.pdf' },
  { folder_id: 'inv-postal', title: 'Scrutinizer Report - Postal Ballot Sept 2024', url: 'https://www.kotyark.com/_files/ugd/e196d6_e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1.pdf' },

  // MOA - AOA (inv-moa)
  { folder_id: 'inv-moa', title: 'MOA - AOA (Memorandum & Articles of Association)', url: 'https://www.kotyark.com/_files/ugd/510267_e38ad21a33454ce1b57355f32228f284.pdf' },
];

function getDb() {
  if (!db) {
    const fs = require('fs');
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    // Create tables
    db.exec(`
      CREATE TABLE IF NOT EXISTS folders (
        id TEXT PRIMARY KEY,
        parent_id TEXT,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        visible_in_menu INTEGER DEFAULT 1,
        sort_order INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        folder_id TEXT NOT NULL,
        title TEXT NOT NULL,
        file_path TEXT NOT NULL,
        original_name TEXT,
        file_size INTEGER DEFAULT 0,
        is_external INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        token TEXT NOT NULL UNIQUE,
        created_at TEXT DEFAULT (datetime('now')),
        expires_at TEXT NOT NULL
      );
    `);

    // Seed default folders and documents if empty
    const folderCount = db.prepare('SELECT COUNT(*) as c FROM folders').get().c;
    if (folderCount === 0) {
      const insertFolder = db.prepare(
        'INSERT INTO folders (id, name, slug, parent_id, sort_order) VALUES (?, ?, ?, ?, ?)'
      );
      const insertDoc = db.prepare(
        'INSERT INTO documents (id, folder_id, title, file_path, original_name, file_size, is_external) VALUES (?, ?, ?, ?, ?, ?, ?)'
      );

      const seedAll = db.transaction(() => {
        for (const f of SEED_FOLDERS) {
          insertFolder.run(f.id, f.name, f.slug, f.parent_id, f.sort_order);
        }
        for (let i = 0; i < SEED_DOCUMENTS.length; i++) {
          const d = SEED_DOCUMENTS[i];
          insertDoc.run(`seed-doc-${i}`, d.folder_id, d.title, d.url, null, 0, 1);
        }
      });
      seedAll();
    }
  }
  return db;
}

export default getDb;
