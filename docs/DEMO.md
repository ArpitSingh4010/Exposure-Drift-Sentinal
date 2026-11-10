# Exposure Drift Sentinel (EDS) — 5-Minute Multi-Hazard Demo Script

> **Disclaimer**: Illustrative products modelled on the concepts of Guidewire PolicyCenter's product model; not official Guidewire products. Synthetic demo data only. Band names and hazard scores are illustrative and do not reflect official government data.

---

## ⏱️ Overview (5 Minutes)

This walk-through demonstrates how Exposure Drift Sentinel protects commercial property portfolios across **8 hazards** and **9 policy products** using deterministic rules, zero LLM guesswork, and human-in-the-loop Guidewire PolicyCenter activities.

---

## Act 1: The Baseline Portfolio (Minute 1)
1. **Login & Persona**:
   - Open [http://localhost:5173/login](http://localhost:5173/login).
   - Select **Marcus Williams** (Senior Underwriter).
   - Observe the top bar: clean enterprise theme, active user chip, and current rules hash.
2. **Review Portfolio Exposure**:
   - Navigate to **Portfolio** in the navigation bar.
   - Observe the 8 hazard tabs (`Flood`, `Earthquake`, `Tsunami`, `Cyclone`, `Wildfire`, `Landslide`, `Tornado`, `Severe Storm`).
   - Click the **Flood** tab: South-East sits at exactly **19.70%** ($59.1M / $300M total TIV), with healthy green headroom below the **20.00%** appetite cap.
   - Click the **Earthquake** tab: West sits below the **25.00%** appetite cap.
   - Click the **Cyclone** tab: South-East sits below the **20.00%** appetite cap.

---

## Act 2: Policy Catalogue & Product Model (Minute 2)
1. **Explore Products**:
   - Navigate to **Products** (or Guidewire PolicyCenter Product Definitions at `/pc/product-definitions`).
   - Notice the **9 Commercial Property products**:
     - `CP-BASE`: Commercial Property Base All-Risk (monitors all 8 hazards).
     - `CP-FLD`: Commercial Flood Coverage (monitors flood, 30-day waiting period).
     - `CP-EQ`: Commercial Earthquake Coverage (monitors earthquake, 5% TIV deductible).
     - `CP-TSU`, `CP-WND`, `CP-WLD`, `CP-LSL`, `CP-TOR`, `CP-SCS`.
2. **Explore Policies**:
   - Navigate to **Policies**.
   - Search `POL-200101` (Fault Line Foods, `CP-EQ`).
   - Notice that each policy explicitly displays its Guidewire product code, region, and monitored hazards.

---

## Act 3: Multi-Hazard Signal Ingestion & Materiality Scoring (Minute 3)
1. **Open Simulator**:
   - Navigate to **Simulator** in the top navigation.
2. **Run Earthquake Scenario**:
   - Choose scenario **"Hazard Update (Earthquake)"**.
   - Target policy defaults to `POL-200101` (Fault Line Foods).
   - Click **Run Scenario**.
   - **Observe**:
     - Submits `HAZARD_UPDATE` signal with `hazard: earthquake`, band: `very_high`, score: `8`.
     - Rule R3 fires (+5 pts) as the location entered high-risk earthquake band.
     - Rule R4 fires (+3 pts) as seismic score increased by $\ge 2$ points.
     - Event created with **HIGH Severity** (8 points).
     - Guidewire Activity `ACT-...` generated with 2 business day SLA assigned to an underwriter.

---

## Act 4: The Benchmark Flood Breach (Minute 4)
1. **Trigger Benchmark Demo Event**:
   - In **Simulator**, select scenario **"New Facility Discovered"** on `POL-100245` (Acme Distribution).
   - Click **Run Scenario**.
   - **Observe the Combined Rules**:
     - R1: TIV increased by +40.6% (+5 pts).
     - R2: New building discovered in Savannah, GA (+3 pts).
     - R3: Building mapped to high-risk flood Zone AE (+5 pts).
     - R5: Combined escalation forces **HIGH Severity** unconditionally.
     - Total score = **13 points**.
2. **Portfolio Breach**:
   - Adding this $1.4M facility pushes South-East flood exposure from **$59,100,000 (19.70%)** to **$60,500,000 (20.07%)**, crossing the **20.00% appetite cap**!
   - A bold red **Portfolio Appetite Breach** banner immediately appears across the desktop and event screen.

---

## Act 5: Underwriter Review & Immutable Audit Trail (Minute 5)
1. **Underwriter Review & Decision**:
   - Click the event link to navigate to the **Event Detail** screen.
   - Inspect the side-by-side diff comparing the bound baseline snapshot against the real-world candidate state.
   - Inspect the exact point-by-point rule receipt explaining every single point scored.
   - Click **"Open & Start Review"**.
   - Click **"Accept Exposure (Create Snapshot)"**, enter an underwriting rationale (*"Inspected construction docs; building meets coastal flood elevation standards. Bound endorsement."*), and confirm.
2. **Audit Trail Verification**:
   - Navigate to **Audit Trail**.
   - Verify the immutable append-only record capturing the actor, exact timestamp, snapshot creation, and Guidewire activity completion.

