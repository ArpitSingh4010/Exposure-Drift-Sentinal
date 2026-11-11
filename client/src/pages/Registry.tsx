import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  fetchCompanies,
  matchCompany,
  type CompanyRecord,
  type CompanyMatchResult,
} from '@/api/client';
import { useUserStore } from '@/hooks/useUserStore';

const PRESET_TEST_CASES = [
  {
    label: 'Case 1: Exact Match (ICICI Lombard)',
    name: 'ICICI Lombard General Insurance Company Limited',
    address: 'ICICI Lombard House, 414 Veer Savarkar Marg, Near Siddhivinayak Temple, Prabhadevi, Mumbai, Maharashtra',
    pin: '400025',
    expected: 'Score >= 0.90 -> High confidence',
  },
  {
    label: 'Case 2: Minor Typo / Abbreviation (Bajaj Allianz)',
    name: 'Bajaj Allianz Gen Ins Co Ltd',
    address: 'Bajaj Allianz House, Airport Rd, Yerwada, Pune, Maharashtra',
    pin: '411006',
    expected: 'Score >= 0.75 -> Probable match',
  },
  {
    label: 'Case 3: Registered vs HQ (Tata AIG - Mumbai Reg Office)',
    name: 'Tata AIG General Insurance Company Limited',
    address: 'Peninsula Business Park, Tower A, 15th Floor, G.K. Marg, Lower Parel, Mumbai, Maharashtra',
    pin: '400013',
    expected: 'Matches Registered Office -> High confidence',
  },
  {
    label: 'Case 4: Headquarters (Tata AIG - Mumbai HQ)',
    name: 'Tata AIG General Insurance Company Limited',
    address: 'Peninsula Business Park, Tower A, 15th Floor, G.K. Marg, Lower Parel, Mumbai, Maharashtra',
    pin: '400013',
    expected: 'Matches Headquarters -> High confidence',
  },
  {
    label: 'Case 5: Missing PIN Code (HDFC ERGO)',
    name: 'HDFC ERGO General Insurance Company Limited',
    address: '1st Floor, HDFC House, 165-166 Backbay Reclamation, H.T. Parekh Marg, Churchgate, Mumbai, Maharashtra',
    pin: '',
    expected: 'PIN score 0.0, Name + Address matches -> Probable match',
  },
  {
    label: 'Case 6: Missing Address (SBI General)',
    name: 'SBI General Insurance Company Limited',
    address: '',
    pin: '400069',
    expected: 'Name + PIN only -> Verification Required (< 0.75)',
  },
  {
    label: 'Case 7: Non-Guidewire PSU (The New India Assurance)',
    name: 'The New India Assurance Company Limited',
    address: '87 M.G. Road, Fort, Mumbai, Maharashtra',
    pin: '400001',
    expected: 'PSU uses TCS BaNCS (CWISS). Excluded from Guidewire registry.',
  },
  {
    label: 'Case 8: Fictional Company (Bharat National Risk Insurers)',
    name: 'Bharat National Risk Insurers Ltd',
    address: '12 Connaught Place, New Delhi',
    pin: '110001',
    expected: 'Fictional -> Score < 0.75 -> Verification Required / Rejected',
  },
  {
    label: 'Case 9: Parent Bank vs Insurer (ICICI Bank Ltd)',
    name: 'ICICI Bank Limited',
    address: 'ICICI Bank Towers, Bandra-Kurla Complex, Mumbai, Maharashtra',
    pin: '400051',
    expected: 'Commercial bank, not general insurer -> Low confidence (< 0.75)',
  },
  {
    label: 'Case 10: Invalid PIN Format (Royal Sundaram 5 digits)',
    name: 'Royal Sundaram General Insurance Co. Limited',
    address: 'Vishranthi Melaram Towers, No. 2/319, Rajiv Gandhi Salai (OMR), Karapakkam, Chennai, Tamil Nadu',
    pin: '60009',
    expected: 'Invalid PIN -> PIN score 0.0 -> Verification handled transparently',
  },
];

export function Registry(): React.ReactElement {
  const { userId } = useUserStore();

  // Directory filter state
  const [search, setSearch] = useState('');
  const [productFilter, setProductFilter] = useState<string>('ALL');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  // Match Sandbox state
  const [inputName, setInputName] = useState('');
  const [inputAddress, setInputAddress] = useState('');
  const [inputPin, setInputPin] = useState('');
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number | ''>('');

  const companiesQuery = useQuery({
    queryKey: ['companies', userId],
    queryFn: () => fetchCompanies(userId),
  });

  const matchMutation = useMutation({
    mutationFn: (input: { name?: string; address?: string; postalCode?: string }) =>
      matchCompany(input, userId),
  });

  const companies = companiesQuery.data ?? [];

  // Filter companies
  const filteredCompanies = companies.filter((c) => {
    const matchesSearch =
      search.trim() === '' ||
      c.legalName.toLowerCase().includes(search.toLowerCase()) ||
      c.commonName.toLowerCase().includes(search.toLowerCase()) ||
      c.registeredOffice.city.toLowerCase().includes(search.toLowerCase()) ||
      c.registeredOffice.state.toLowerCase().includes(search.toLowerCase()) ||
      (c.irdaiRegistrationNo && c.irdaiRegistrationNo.includes(search));

    const matchesProduct =
      productFilter === 'ALL' ||
      c.guidewireProducts.some((p) => p.toLowerCase().includes(productFilter.toLowerCase()));

    return matchesSearch && matchesProduct;
  });

  const selectedCompany = companies.find((c) => c.companyId === selectedCompanyId) ?? null;

  const handleSelectPreset = (index: number) => {
    setSelectedPresetIndex(index);
    const preset = PRESET_TEST_CASES[index];
    if (preset) {
      setInputName(preset.name);
      setInputAddress(preset.address);
      setInputPin(preset.pin);
      matchMutation.mutate({
        name: preset.name,
        address: preset.address,
        postalCode: preset.pin,
      });
    }
  };

  const handleRunMatch = (e: React.FormEvent) => {
    e.preventDefault();
    matchMutation.mutate({
      name: inputName.trim() || undefined,
      address: inputAddress.trim() || undefined,
      postalCode: inputPin.trim() || undefined,
    });
  };

  const handleResetMatch = () => {
    setInputName('');
    setInputAddress('');
    setInputPin('');
    setSelectedPresetIndex('');
    matchMutation.reset();
  };

  const matchResult: CompanyMatchResult | undefined = matchMutation.data;

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-[#E8E8E2]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold tracking-tight text-[#1A1A18]">
              Indian Guidewire Insurer Registry
            </h1>
            <span className="badge badge-low text-xs">
              {companies.length} Verified Insurers
            </span>
            <span className="badge badge-neutral text-xs">IRDAI Regulated</span>
          </div>
          <p className="text-xs text-[#7A7A74] mt-1">
            Verified Indian general insurance entities using Guidewire InsuranceSuite, PolicyCenter, or ClaimCenter. Includes weighted entity resolution sandbox (0.6x Name + 0.3x Address + 0.1x PIN).
          </p>
        </div>
      </div>

      {/* SECTION 1: Interactive Matching Sandbox */}
      <section className="panel bg-white p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#F2F1EE]">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-[#1A1A18]">
              Entity Resolution & Verification Sandbox
            </h2>
            <p className="text-xs text-[#7A7A74] mt-0.5">
              Test incoming signals against the verified registry using the weighted confidence formula.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#7A7A74]">Load Scenario Test Case:</span>
            <select
              value={selectedPresetIndex}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '') {
                  setSelectedPresetIndex('');
                } else {
                  handleSelectPreset(Number(val));
                }
              }}
              className="field-select text-xs py-1"
            >
              <option value="">Choose test case (1-10)...</option>
              {PRESET_TEST_CASES.map((t, idx) => (
                <option key={t.label} value={idx}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedPresetIndex !== '' && PRESET_TEST_CASES[Number(selectedPresetIndex)] && (
          <div className="p-2.5 rounded bg-[#F8F8F5] border border-[#E8E8E2] text-xs flex items-center justify-between">
            <span className="text-[#4A4A45]">
              <strong className="text-[#1A1A18]">Test Spec:</strong>{' '}
              {PRESET_TEST_CASES[Number(selectedPresetIndex)]?.expected}
            </span>
            <span className="text-[11px] text-[#7A7A74]">Automated via resolution engine</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleRunMatch} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-4">
            <label className="block text-xs font-medium text-[#4A4A45] mb-1">
              Incoming Insurer Name <span className="text-[#7A7A74] font-normal">(60% weight)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Bajaj Allianz Gen Ins Co Ltd"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              className="field-input w-full text-xs"
            />
          </div>

          <div className="md:col-span-5">
            <label className="block text-xs font-medium text-[#4A4A45] mb-1">
              Address Line / Locality <span className="text-[#7A7A74] font-normal">(30% weight)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Airport Rd, Yerwada, Pune, Maharashtra"
              value={inputAddress}
              onChange={(e) => setInputAddress(e.target.value)}
              className="field-input w-full text-xs"
            />
          </div>

          <div className="md:col-span-1.5">
            <label className="block text-xs font-medium text-[#4A4A45] mb-1">
              Indian PIN <span className="text-[#7A7A74] font-normal">(10%)</span>
            </label>
            <input
              type="text"
              maxLength={6}
              placeholder="411006"
              value={inputPin}
              onChange={(e) => setInputPin(e.target.value)}
              className="field-input w-full text-xs font-mono"
            />
          </div>

          <div className="md:col-span-1.5 flex items-center gap-2">
            <button
              type="submit"
              disabled={matchMutation.isPending || (!inputName && !inputAddress && !inputPin)}
              className="btn btn-primary text-xs w-full py-2"
            >
              {matchMutation.isPending ? 'Matching...' : 'Evaluate Match'}
            </button>
            <button
              type="button"
              onClick={handleResetMatch}
              className="btn btn-secondary text-xs px-2.5 py-2"
              title="Clear input"
            >
              Clear
            </button>
          </div>
        </form>

        {/* Match Result Display */}
        {matchResult && (
          <div
            className="p-4 rounded border mt-3 space-y-3"
            style={{
              backgroundColor:
                matchResult.classification === 'HIGH_CONFIDENCE'
                  ? 'var(--green-subtle)'
                  : matchResult.classification === 'PROBABLE_MATCH'
                  ? '#FFFBEB'
                  : 'var(--risk-high-bg)',
              borderColor:
                matchResult.classification === 'HIGH_CONFIDENCE'
                  ? 'var(--green-border)'
                  : matchResult.classification === 'PROBABLE_MATCH'
                  ? '#FDE68A'
                  : 'var(--risk-high-border)',
            }}
          >
            {/* Classification & Confidence Header */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span
                  className={`badge text-xs font-medium ${
                    matchResult.classification === 'HIGH_CONFIDENCE'
                      ? 'badge-low'
                      : matchResult.classification === 'PROBABLE_MATCH'
                      ? 'badge-med'
                      : 'badge-high'
                  }`}
                >
                  {matchResult.classification.replace('_', ' ')}
                </span>
                <span className="text-xs font-semibold text-[#1A1A18]">
                  Confidence: {(matchResult.scores.finalConfidence * 100).toFixed(1)}%
                </span>
                <span className="text-[11px] text-[#7A7A74]">
                  (Threshold: &gt;= 0.75 for automated intake)
                </span>
              </div>

              {matchResult.verificationRequired ? (
                <span className="badge badge-high text-[11px]">
                  MANUAL VERIFICATION REQUIRED (&lt; 0.75)
                </span>
              ) : (
                <span className="badge badge-low text-[11px]">
                  AUTOMATED INTAKE APPROVED (&gt;= 0.75)
                </span>
              )}
            </div>

            {/* Explanation */}
            <p className="text-xs text-[#4A4A45] leading-relaxed">
              {matchResult.explanation}
            </p>

            {/* Component Score Decomposition Grid */}
            <div
              className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded bg-white text-xs"
              style={{ border: '1px solid var(--border)' }}
            >
              <div>
                <span className="text-[10px] uppercase font-semibold text-[#7A7A74] tracking-wider block">
                  Name Similarity (60%)
                </span>
                <span className="text-sm font-semibold tabular-nums text-[#1A1A18]">
                  {(matchResult.scores.nameSimilarity * 100).toFixed(1)}%
                </span>
                <span className="text-[10px] text-[#7A7A74] block">
                  Contrib: +{(matchResult.scores.nameSimilarity * 0.6 * 100).toFixed(1)}%
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-semibold text-[#7A7A74] tracking-wider block">
                  Address Similarity (30%)
                </span>
                <span className="text-sm font-semibold tabular-nums text-[#1A1A18]">
                  {(matchResult.scores.addressSimilarity * 100).toFixed(1)}%
                </span>
                <span className="text-[10px] text-[#7A7A74] block">
                  Contrib: +{(matchResult.scores.addressSimilarity * 0.3 * 100).toFixed(1)}%
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-semibold text-[#7A7A74] tracking-wider block">
                  PIN-Code Match (10%)
                </span>
                <span className="text-sm font-semibold tabular-nums text-[#1A1A18]">
                  {matchResult.scores.postalCodeMatch === 1.0 ? '100% (Exact)' : '0% (Mismatch)'}
                </span>
                <span className="text-[10px] text-[#7A7A74] block">
                  Contrib: +{(matchResult.scores.postalCodeMatch * 0.1 * 100).toFixed(1)}%
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-semibold text-[#7A7A74] tracking-wider block">
                  Weighted Score
                </span>
                <span className="text-sm font-bold tabular-nums text-[#1A1A18]">
                  {(matchResult.scores.finalConfidence * 100).toFixed(1)}%
                </span>
                <span className="text-[10px] text-[#7A7A74] block">
                  0.6N + 0.3A + 0.1P
                </span>
              </div>
            </div>

            {/* Matched Company Comparison Card */}
            {matchResult.matchedCompany && (
              <div
                className="p-3.5 rounded bg-white space-y-2 text-xs"
                style={{ border: '1px solid var(--border)' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-[#7A7A74]">
                      {matchResult.matchedCompany.companyId}
                    </span>
                    <strong className="text-xs text-[#1A1A18]">
                      {matchResult.matchedCompany.legalName}
                    </strong>
                    <span className="badge badge-neutral text-[10px]">
                      IRDAI #{matchResult.matchedCompany.irdaiRegistrationNo ?? 'N/A'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCompanyId(matchResult.matchedCompany!.companyId)}
                    className="text-xs text-[#2D6A4F] hover:underline"
                  >
                    View in Registry →
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-[#F2F1EE]">
                  <div>
                    <span className="text-[10px] font-semibold text-[#7A7A74] uppercase block">
                      Canonical Registered Office:
                    </span>
                    <p className="text-[11px] text-[#4A4A45] mt-0.5">
                      {matchResult.matchedCompany.registeredOffice.formattedAddress} (PIN: {matchResult.matchedCompany.registeredOffice.postalCode})
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-[#7A7A74] uppercase block">
                      Guidewire Products:
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {matchResult.matchedCompany.guidewireProducts.map((p) => (
                        <span key={p} className="badge badge-neutral text-[10px]">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* SECTION 2: Verified Insurer Directory Table & Inspector Drawer */}
      <section className="space-y-4">
        {/* Directory Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-[#1A1A18]">
              Verified Guidewire Insurers Directory ({filteredCompanies.length})
            </h2>
            <p className="text-xs text-[#7A7A74]">
              Publicly verified Indian insurance entities with official Guidewire product implementations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Product Filter */}
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="field-select text-xs py-1"
            >
              <option value="ALL">All Guidewire Products</option>
              <option value="PolicyCenter">PolicyCenter</option>
              <option value="ClaimCenter">ClaimCenter</option>
              <option value="BillingCenter">BillingCenter</option>
              <option value="InsuranceSuite">InsuranceSuite</option>
            </select>

            {/* Search */}
            <div className="w-64 relative">
              <input
                type="text"
                placeholder="Search company, IRDAI, city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="field-input w-full text-xs pl-8"
              />
              <svg
                className="w-3.5 h-3.5 text-[#7A7A74] absolute left-2.5 top-2.5 pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Directory Grid: Table on Left, Details Drawer on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6 items-start">
          {/* Insurer Table */}
          <div className="panel bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr
                    className="border-b text-[11px] font-semibold text-[#7A7A74] uppercase tracking-wider"
                    style={{ backgroundColor: 'var(--surface-raised)', borderColor: 'var(--border)' }}
                  >
                    <th className="py-2.5 px-3">ID / Legal Name</th>
                    <th className="py-2.5 px-3">IRDAI Reg</th>
                    <th className="py-2.5 px-3">Location</th>
                    <th className="py-2.5 px-3">Guidewire Products</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {filteredCompanies.map((c) => {
                    const isSelected = selectedCompanyId === c.companyId;
                    return (
                      <tr
                        key={c.companyId}
                        onClick={() => setSelectedCompanyId(c.companyId)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-[#F2F6F3]' : 'hover:bg-[#FAFAF8]'
                        }`}
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] text-[#7A7A74]">
                              {c.companyId}
                            </span>
                            <span className="font-semibold text-[#1A1A18]">
                              {c.commonName}
                            </span>
                          </div>
                          <span className="text-[11px] text-[#7A7A74] block truncate max-w-xs mt-0.5">
                            {c.legalName}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="badge badge-neutral text-[10px] font-mono">
                            {c.irdaiRegistrationNo ?? 'N/A'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-[#4A4A45]">
                          <div>{c.registeredOffice.city}</div>
                          <span className="text-[10px] text-[#7A7A74]">{c.registeredOffice.state}</span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {c.guidewireProducts.map((p) => (
                              <span
                                key={p}
                                className="inline-block px-1.5 py-0.5 rounded text-[9px] font-medium bg-[#E8F0EC] text-[#2D6A4F]"
                              >
                                {p}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCompanyId(c.companyId);
                            }}
                            className="text-xs text-[#2D6A4F] hover:underline"
                          >
                            Inspect →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Details Inspector Panel */}
          <div className="panel bg-white p-5 space-y-4 sticky top-6">
            {!selectedCompany ? (
              <div className="p-12 text-center text-[#7A7A74] space-y-2">
                <div className="text-2xl text-[#A8A8A0]">🏢</div>
                <p className="text-xs font-medium text-[#4A4A45]">Select an insurer to inspect</p>
                <p className="text-[11px] text-[#7A7A74] max-w-xs mx-auto">
                  Click any row in the directory to inspect registered office vs. headquarters addresses, PIN codes, IRDAI credentials, and verified Guidewire source links.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Header */}
                <div className="border-b pb-3" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-[#7A7A74]">
                      {selectedCompany.companyId}
                    </span>
                    <span className="badge badge-low text-[10px]">
                      {selectedCompany.verificationStatus}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-[#1A1A18] mt-1">
                    {selectedCompany.legalName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-[#4A4A45]">Trading as: <strong>{selectedCompany.commonName}</strong></span>
                    {selectedCompany.parentCompany && (
                      <span className="text-[11px] text-[#7A7A74]">
                        • Parent: {selectedCompany.parentCompany}
                      </span>
                    )}
                  </div>
                </div>

                {/* Regulatory & Web */}
                <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded bg-[#F8F8F5] border border-[#E8E8E2]">
                  <div>
                    <span className="text-[10px] font-semibold text-[#7A7A74] uppercase block">
                      IRDAI Registration
                    </span>
                    <span className="font-mono font-semibold text-[#1A1A18]">
                      #{selectedCompany.irdaiRegistrationNo ?? 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-[#7A7A74] uppercase block">
                      Category / Jurisdiction
                    </span>
                    <span className="text-[#1A1A18]">
                      {selectedCompany.insuranceCategory} (India)
                    </span>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-[#E8E8E2]">
                    <span className="text-[10px] font-semibold text-[#7A7A74] uppercase block">
                      Official Portal
                    </span>
                    <a
                      href={selectedCompany.officialWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#2D6A4F] hover:underline truncate block"
                    >
                      {selectedCompany.officialWebsite} ↗
                    </a>
                  </div>
                </div>

                {/* Addresses: Registered Office vs. Headquarters */}
                <div className="space-y-3">
                  <div className="p-3 rounded border border-[#E8E8E2] bg-white">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-semibold text-[#2D6A4F] uppercase tracking-wider">
                        Registered Office
                      </span>
                      <span className="text-[10px] font-mono text-[#7A7A74]">
                        PIN: {selectedCompany.registeredOffice.postalCode}
                      </span>
                    </div>
                    <p className="text-xs text-[#4A4A45] leading-relaxed">
                      {selectedCompany.registeredOffice.formattedAddress}
                    </p>
                    <a
                      href={selectedCompany.registeredOffice.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-[#7A7A74] hover:text-[#2D6A4F] mt-1 block truncate"
                    >
                      Source: {selectedCompany.registeredOffice.sourceUrl} ↗
                    </a>
                  </div>

                  <div className="p-3 rounded border border-[#E8E8E2] bg-white">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-semibold text-[#2D6A4F] uppercase tracking-wider">
                        Headquarters Office
                      </span>
                      <span className="text-[10px] font-mono text-[#7A7A74]">
                        PIN: {selectedCompany.headquarters.postalCode}
                      </span>
                    </div>
                    <p className="text-xs text-[#4A4A45] leading-relaxed">
                      {selectedCompany.headquarters.formattedAddress}
                    </p>
                    <a
                      href={selectedCompany.headquarters.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-[#7A7A74] hover:text-[#2D6A4F] mt-1 block truncate"
                    >
                      Source: {selectedCompany.headquarters.sourceUrl} ↗
                    </a>
                  </div>
                </div>

                {/* Guidewire Products & Implementation Evidence */}
                <div className="p-3.5 rounded border border-[#D5E3D8] bg-[#F2F6F3] space-y-2">
                  <span className="text-[10px] font-semibold text-[#2D6A4F] uppercase tracking-wider block">
                    Guidewire Products Deployed
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCompany.guidewireProducts.map((p) => (
                      <span
                        key={p}
                        className="px-2 py-0.5 rounded text-xs font-medium bg-white text-[#2D6A4F] border border-[#C2D6C7]"
                      >
                        {p}
                      </span>
                    ))}
                  </div>

                  <span className="text-[10px] font-semibold text-[#2D6A4F] uppercase tracking-wider block pt-2">
                    Implementation Evidence
                  </span>
                  <p className="text-xs text-[#20231F] leading-relaxed bg-white p-2.5 rounded border border-[#C2D6C7]">
                    "{selectedCompany.guidewireEvidence}"
                  </p>

                  <div className="pt-1 flex items-center justify-between text-[11px] text-[#4A4A45]">
                    <a
                      href={selectedCompany.guidewireSourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#2D6A4F] font-medium hover:underline"
                    >
                      Official Proof Source ↗
                    </a>
                    <span className="text-[#7A7A74]">
                      Verified: {selectedCompany.lastVerifiedDate}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
