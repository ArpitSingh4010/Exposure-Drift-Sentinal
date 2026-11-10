# Multi-Hazard Specification & Product Model Brief
> **Disclaimer**: Illustrative products modelled on the concepts of Guidewire PolicyCenter's product model (line of business, coverages, coverage terms, deductibles, limits); not official Guidewire products. Synthetic demo data only. Band names are illustrative, not official hazard agency data.

---

## 1. Project Overview & Hard Rules

**PROJECT**: Exposure Drift Sentinel (EDS) — Multi-hazard expansion and Guidewire PolicyCenter product model catalogue.

### Hard Rules
1. **Never auto-reprice, no LLM decisions, no live external APIs**: Humans (licensed underwriters) make all underwriting decisions.
2. **Deterministic & Explainable**: All thresholds live strictly in `server/rules.yaml`. No magic numbers in code.
3. **Preserve Existing Tests & Signatures**: Existing tests must never be deleted or weakened. Do not change existing public function signatures; add new functions or optional parameters.
4. **Seed Invariants**:
   - Total portfolio TIV is exactly **$300,000,000**.
   - South-East flood-zone TIV is exactly **$59,100,000** (19.70%).
   - Baseline demo policy `POL-100245` unchanged.
   - Demo scenario ("New Facility Discovered") yields HIGH severity (score 13) and breaches SE flood appetite cap (19.70% -> 20.07%).
5. **Exact Collection Count**: 15 MongoDB collections:
   `accounts`, `activities`, `auditlogs`, `decisions`, `driftevents`, `floodlookups`, `hazardlookups`, `locations`, `policies`, `portfolioconfigs`, `products`, `risksnapshots`, `ruleversions`, `signals`, `users`.

---

## 2. 8 Hazards Registry

| Hazard ID | Display Label | Ordered Bands (Low to High) | High-Risk Bands | Appetite Cap | Regional Concentration Focus |
| :--- | :--- | :--- | :--- | :---: | :--- |
| `flood` | Flood | `X`, `B`, `A`, `AE`, `V` | `A`, `AE`, `V` | 20.00% | South-East, coastal |
| `earthquake` | Earthquake | `low`, `moderate`, `high`, `very_high` | `high`, `very_high` | 25.00% | West |
| `tsunami` | Tsunami | `none`, `low`, `moderate`, `high` | `high` | 10.00% | West coast, South-East coast |
| `cyclone` | Cyclone / Hurricane | `low`, `moderate`, `high`, `extreme` | `high`, `extreme` | 20.00% | South-East, Gulf |
| `wildfire` | Wildfire | `low`, `moderate`, `high`, `very_high` | `high`, `very_high` | 15.00% | West |
| `landslide` | Landslide | `low`, `moderate`, `high` | `high` | 10.00% | West, North-East |
| `tornado` | Tornado | `low`, `moderate`, `high` | `high` | 15.00% | Midwest |
| `severe_storm` | Severe Storm | `low`, `moderate`, `high` | `high` | 25.00% | Midwest, South-East |

### Unified Reading Helper: `getHazardReading(location, hazardId)`
- For `flood`: reads legacy `location.floodZone` and `location.floodScore`.
- For other hazards: reads `location.hazards[hazardId] = { band, score }`.
- Rule and detection engines interact with hazards purely through this helper.

---

## 3. Product Catalogue (9 Products)

Modelled on Guidewire PolicyCenter's product model concepts (Line of Business: Commercial Property). Each policy has a `productCode` determining which hazards trigger underwriting reviews.

| Product Code | Product Name | Monitored Hazards | Primary Coverage / Terms | Deductible |
| :--- | :--- | :--- | :--- | :--- |
| `CP-BASE` | Commercial Property, Base All-Risk | All 8 hazards | Building, Contents, Business Income | $25,000 flat |
| `CP-FLD` | Commercial Flood Coverage | `flood` | Building, Contents (30-day waiting period) | $25,000 flat |
| `CP-EQ` | Commercial Earthquake Coverage | `earthquake` | Building, Contents, Sprinkler leakage | 5% TIV |
| `CP-TSU` | Tsunami and Coastal Inundation Extension | `tsunami` | Inundation Building & Contents | 5% TIV |
| `CP-WND` | Named Storm and Hurricane Coverage | `cyclone` | Windstorm, Surge, Business Income | 3% TIV |
| `CP-WLD` | Wildfire Coverage | `wildfire` | Flame, Smoke, Defensible space warranty | $50,000 flat |
| `CP-LSL` | Earth Movement and Landslide Extension | `landslide` | Landslide, Slope failure, Mudflow | 5% TIV |
| `CP-TOR` | Tornado and Windstorm Coverage | `tornado` | Direct tornado wind & hail impact | $25,000 flat |
| `CP-SCS` | Severe Convective Storm Coverage | `severe_storm` | Hail, Straight-line convective winds | 1% TIV |

---

## 4. Signal Architecture (Exactly 2 Signals)

1. **Signal 1: `PROPERTY_CHANGE`**
   - Applies to all products unconditionally.
   - Triggers on `NEW_LOCATION` or `TIV_CHANGE`.
2. **Signal 2: `HAZARD_UPDATE`**
   - Ingests `{ hazard, locationId | (addressLine + postalCode), band?, score? }`.
   - Backward-compatible alias `FLOOD_UPDATE` automatically maps to `hazard: 'flood'`.
   - Filtered by policy product: if the policy's product does not monitor the hazard, returns 200 with `{ event: null, reason: 'hazard_not_monitored_by_product' }`.

---

## 5. Underwriting Rules (server/rules.yaml)

- **R1 (`R1_TIV_INCREASE`)**: TIV increase +10% to +25% (3 pts); +25% or more (5 pts).
- **R2 (`R2_NEW_LOCATION`)**: New location discovered on policy (3 pts).
- **R3 (`R3_HIGH_FLOOD_ZONE` / Hazard Band Entry)**: Any monitored hazard enters high-risk band (5 pts per hazard).
- **R4 (`R4_FLOOD_SCORE_WORSENED` / Hazard Score Jump)**: Any monitored hazard score worsens by $\ge 2$ points (3 pts).
- **R5 (`R5_COMBINED_ESCALATION`)**: New location AND high-risk hazard entry forces **HIGH severity** unconditionally.
- **R6 (`R6_PORTFOLIO_BREACH`)**: Regional exposure in high-risk band exceeds hazard appetite cap $\rightarrow$ Portfolio breach flag.

