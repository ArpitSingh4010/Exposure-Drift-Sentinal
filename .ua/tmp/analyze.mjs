import fs from 'fs';
import path from 'path';

const PROJECT_ROOT = process.cwd();
const UA_DIR = path.join(PROJECT_ROOT, '.ua');

// Collect all relevant files
function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (['node_modules', 'dist', 'build', 'coverage', '.git', '.ua', '.understand-anything', 'mongo-data'].includes(file)) {
      continue;
    }
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath, fileList);
    } else {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const allFiles = walk(PROJECT_ROOT);
const relativeFiles = allFiles.map(f => path.relative(PROJECT_ROOT, f).replace(/\\/g, '/'));

// Filter key source files
const sourceFiles = relativeFiles.filter(f => 
  (f.startsWith('server/src/') || f.startsWith('client/src/')) &&
  (f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.yaml') || f.endsWith('.json'))
);

console.log(`Found ${sourceFiles.length} source files to map.`);

const nodes = [];
const edges = [];

// Helper to create node
function addNode(id, label, type, filePath, summary, lineRange = null) {
  nodes.push({
    id,
    label,
    type,
    filePath,
    summary,
    lineRange
  });
}

// Helper to create edge
function addEdge(source, target, relationship) {
  edges.push({
    source,
    target,
    relationship
  });
}

// 1. Files & Modules mapping
sourceFiles.forEach(file => {
  const isServer = file.startsWith('server/');
  const isClient = file.startsWith('client/');
  const content = fs.readFileSync(path.join(PROJECT_ROOT, file), 'utf8');
  const lines = content.split('\n').length;
  
  let type = 'file';
  let summary = `Source module with ${lines} lines of code.`;
  
  if (file.includes('routes/')) {
    type = 'route';
    summary = `Express API route controller for ${path.basename(file, '.ts')}.`;
  } else if (file.includes('models/')) {
    type = 'model';
    summary = `MongoDB Mongoose schema and persistence model for ${path.basename(file, '.ts')}.`;
  } else if (file.includes('services/')) {
    type = 'service';
    summary = `Core underwriting and integration service logic in ${path.basename(file, '.ts')}.`;
  } else if (file.includes('pages/')) {
    type = 'component';
    summary = `Top-level React application page view for ${path.basename(file, '.tsx')}.`;
  } else if (file.includes('components/')) {
    type = 'component';
    summary = `Reusable React UI component for ${path.basename(file, '.tsx')}.`;
  }
  
  addNode(file, path.basename(file), type, file, summary, [1, lines]);
});

// Specific key architectural components
addNode('comp:entity-resolution', 'Weighted Entity Resolution Engine', 'algorithm', 'server/src/services/resolution/index.ts', 'Calculates 0.6*Name + 0.3*Address + 0.1*PIN weighted match confidence against verified Indian Guidewire insurers.');
addNode('comp:rules-engine', 'Deterministic Detection Rules Engine', 'engine', 'server/src/services/rules/detection.ts', 'Evaluates R1 (TIV drift), R2 (Score jump), R3 (High band entry), R4 (Peril worsening), and R5 (Portfolio limit breach).');
addNode('comp:portfolio-engine', 'Portfolio Concentration Engine', 'engine', 'server/src/services/portfolio/index.ts', 'Calculates $300M accumulation book risk and enforces the 20% South-East flood cap.');
addNode('comp:gw-adapter', 'Guidewire PolicyCenter Mock Adapter', 'adapter', 'server/src/services/guidewire/mockAdapter.ts', 'Manages PolicyCenter activity dispatch and underwriter review lifecycle.');
addNode('comp:mercury-ui', 'Mercury Design System Shell', 'ui-system', 'client/src/index.css', 'Refined off-white layout (#F8F8F5), forest green accents, 1px borders, and tabular data tables.');
addNode('comp:indian-registry', 'Indian Guidewire Insurer Registry', 'registry', 'server/src/models/Company.ts', 'Canonical directory of 10 verified Indian general insurance companies using Guidewire products.');

// Connect key edges
addEdge('server/src/routes/signals.ts', 'comp:entity-resolution', 'delegates_matching');
addEdge('server/src/routes/signals.ts', 'comp:rules-engine', 'triggers_evaluation');
addEdge('comp:rules-engine', 'comp:portfolio-engine', 'queries_accumulation_limits');
addEdge('comp:rules-engine', 'comp:gw-adapter', 'dispatches_activities');
addEdge('comp:entity-resolution', 'comp:indian-registry', 'matches_against');
addEdge('server/src/routes/companies.ts', 'comp:indian-registry', 'exposes_directory');
addEdge('client/src/pages/Registry.tsx', 'server/src/routes/companies.ts', 'consumes_api');
addEdge('client/src/pages/Simulator.tsx', 'server/src/routes/simulator.ts', 'triggers_scenarios');
addEdge('client/src/pages/Desktop.tsx', 'server/src/routes/activities.ts', 'manages_queue');
addEdge('client/src/pages/EventDetail.tsx', 'server/src/routes/events.ts', 'inspects_decisions');
addEdge('client/src/pages/Portfolio.tsx', 'server/src/routes/portfolio.ts', 'renders_risk_analytics');

// Layers definition
const layers = [
  {
    id: 'layer-presentation',
    name: 'Presentation & UI Layer',
    description: 'Mercury-inspired React frontend featuring Review Queue, Event Investigation Workspace, Simulator, and Indian Insurer Registry.',
    nodeIds: sourceFiles.filter(f => f.startsWith('client/src/'))
  },
  {
    id: 'layer-api',
    name: 'API & Gateway Layer',
    description: 'Express.js HTTP endpoints handling external signals, policy queries, insurer matching, and scenario simulation.',
    nodeIds: sourceFiles.filter(f => f.includes('server/src/routes/'))
  },
  {
    id: 'layer-business-logic',
    name: 'Business Logic & Rules Engine',
    description: 'Deterministic underwriting evaluation (R1-R5), multi-hazard severity scoring, and weighted confidence entity resolution.',
    nodeIds: [
      ...sourceFiles.filter(f => f.includes('server/src/services/')),
      'comp:entity-resolution',
      'comp:rules-engine',
      'comp:portfolio-engine'
    ]
  },
  {
    id: 'layer-integration',
    name: 'Guidewire Integration & Registry',
    description: 'Guidewire PolicyCenter adapter for activity sync, and verified Indian general insurer records.',
    nodeIds: [
      'comp:gw-adapter',
      'comp:indian-registry',
      'server/src/seed/indianInsurersData.ts',
      'server/src/services/guidewire/mockAdapter.ts'
    ]
  },
  {
    id: 'layer-persistence',
    name: 'Persistence & Data Layer',
    description: 'MongoDB Mongoose models with replica-set change streams and partial unique indexes.',
    nodeIds: sourceFiles.filter(f => f.includes('server/src/models/'))
  }
];

// Interactive Guided Tour
const tour = [
  {
    order: 1,
    title: 'External Signal Intake & Idempotency',
    description: 'External environmental alerts and location updates hit POST /signals. Partial unique indexes ensure duplicate alerts merge into open events without duplicate tickets.',
    nodeIds: ['server/src/routes/signals.ts', 'server/src/models/Event.ts']
  },
  {
    order: 2,
    title: 'Indian Guidewire Insurer Entity Resolution',
    description: 'Incoming signals are matched using the 0.6*Name + 0.3*Address + 0.1*PIN formula against verified Indian general insurers. Confidence below 0.75 triggers a verification gate.',
    nodeIds: ['comp:entity-resolution', 'comp:indian-registry', 'client/src/pages/Registry.tsx']
  },
  {
    order: 3,
    title: 'Deterministic Rules & Multi-Hazard Evaluation',
    description: 'The engine evaluates 5 rules (R1-R5) against monitored peril policies across 8 natural perils (Earthquake, Flood, Cyclone, Wildfire, etc.).',
    nodeIds: ['comp:rules-engine', 'server/src/services/hazards/index.ts', 'server/src/services/rules/detection.ts']
  },
  {
    order: 4,
    title: 'Portfolio Concentration & Accumulation Cap',
    description: 'Simulates $300M total insured value. When a facility in Savannah GA adds $1.4M flood exposure, it breaches the 20% South-East regional cap (20.07%).',
    nodeIds: ['comp:portfolio-engine', 'client/src/pages/Portfolio.tsx']
  },
  {
    order: 5,
    title: 'PolicyCenter Activity Workflow & Audit Trail',
    description: 'High-severity breaches generate activities in Guidewire PolicyCenter. Underwriters review, accept, or decline changes, writing every action to an immutable audit ledger.',
    nodeIds: ['comp:gw-adapter', 'client/src/pages/Desktop.tsx', 'client/src/pages/Audit.tsx']
  }
];

const knowledgeGraph = {
  version: '1.0.0',
  project: {
    name: 'exposure-drift-sentinel',
    languages: ['TypeScript', 'JavaScript', 'HTML', 'CSS', 'YAML'],
    frameworks: ['React', 'Express', 'Vite', 'Tailwind CSS', 'Mongoose', 'TanStack Query', 'Recharts'],
    description: 'Continuous commercial property underwriting exposure and risk intelligence platform integrating with Guidewire InsuranceSuite and external hazard feeds.',
    analyzedAt: new Date().toISOString(),
    gitCommitHash: '4f1b92cfce9d824bf0464b121b8100c0eb8fbe98'
  },
  nodes,
  edges,
  layers,
  tour
};

fs.writeFileSync(path.join(UA_DIR, 'knowledge-graph.json'), JSON.stringify(knowledgeGraph, null, 2), 'utf8');
fs.writeFileSync(path.join(UA_DIR, 'meta.json'), JSON.stringify({
  version: '1.0.0',
  gitCommitHash: '4f1b92cfce9d824bf0464b121b8100c0eb8fbe98',
  analyzedAt: new Date().toISOString(),
  nodesCount: nodes.length,
  edgesCount: edges.length,
  layersCount: layers.length,
  tourStepsCount: tour.length
}, null, 2), 'utf8');

console.log(`Knowledge graph successfully generated: ${nodes.length} nodes, ${edges.length} edges, ${layers.length} layers, ${tour.length} tour steps.`);

