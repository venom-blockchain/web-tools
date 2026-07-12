import { ref, computed } from 'vue';

export interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  abi: string;
  address?: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedGas: string;
  lastUpdated: string;
  author: string;
  usage: number;
  isCustom?: boolean;
}

export interface WorkflowStep {
  id: string;
  type: 'contract_call' | 'condition' | 'delay' | 'notification';
  title: string;
  description: string;
  config: any;
  order: number;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  templateId?: string;
  created: string;
  lastUsed: string;
  usage: number;
  isCustom?: boolean;
}

// Default templates
const defaultTemplates: ContractTemplate[] = [
  {
    id: 'tip3-token',
    name: 'TIP3 Token Contract',
    description: 'Standard TIP3 token implementation with transfer, mint, and burn functionality',
    category: 'Tokens',
    abi: JSON.stringify({
      "ABI version": 2,
      "functions": [
        {
          "name": "transfer",
          "inputs": [
            {"name": "to", "type": "address"},
            {"name": "amount", "type": "uint128"}
          ],
          "outputs": []
        },
        {
          "name": "mint",
          "inputs": [
            {"name": "to", "type": "address"},
            {"name": "amount", "type": "uint128"}
          ],
          "outputs": []
        }
      ]
    }),
    tags: ['token', 'tip3', 'transfer'],
    difficulty: 'beginner',
    estimatedGas: '0.1',
    lastUpdated: '2024-01-15',
    author: 'Everscale Team',
    usage: 1250
  },
  {
    id: 'multisig-wallet',
    name: 'Multi-Signature Wallet',
    description: 'Secure multi-signature wallet requiring multiple approvals for transactions',
    category: 'Security',
    abi: JSON.stringify({
      "ABI version": 2,
      "functions": [
        {
          "name": "submitTransaction",
          "inputs": [
            {"name": "destination", "type": "address"},
            {"name": "value", "type": "uint128"},
            {"name": "data", "type": "cell"}
          ],
          "outputs": []
        },
        {
          "name": "confirmTransaction",
          "inputs": [
            {"name": "transactionId", "type": "uint32"}
          ],
          "outputs": []
        }
      ]
    }),
    tags: ['wallet', 'multisig', 'security'],
    difficulty: 'advanced',
    estimatedGas: '0.3',
    lastUpdated: '2024-01-10',
    author: 'Security Expert',
    usage: 450
  },
  {
    id: 'dao-governance',
    name: 'DAO Governance',
    description: 'Decentralized Autonomous Organization with voting and proposal management',
    category: 'Governance',
    abi: JSON.stringify({
      "ABI version": 2,
      "functions": [
        {
          "name": "createProposal",
          "inputs": [
            {"name": "description", "type": "string"},
            {"name": "target", "type": "address"}
          ],
          "outputs": []
        },
        {
          "name": "vote",
          "inputs": [
            {"name": "proposalId", "type": "uint32"},
            {"name": "support", "type": "bool"}
          ],
          "outputs": []
        }
      ]
    }),
    tags: ['dao', 'governance', 'voting'],
    difficulty: 'intermediate',
    estimatedGas: '0.2',
    lastUpdated: '2024-01-12',
    author: 'DAO Builder',
    usage: 780
  },
  {
    id: 'nft-marketplace',
    name: 'NFT Marketplace',
    description: 'Complete NFT marketplace with listing, bidding, and auction functionality',
    category: 'NFT',
    abi: JSON.stringify({
      "ABI version": 2,
      "functions": [
        {
          "name": "listNFT",
          "inputs": [
            {"name": "tokenId", "type": "uint256"},
            {"name": "price", "type": "uint128"}
          ],
          "outputs": []
        },
        {
          "name": "buyNFT",
          "inputs": [
            {"name": "tokenId", "type": "uint256"}
          ],
          "outputs": []
        }
      ]
    }),
    tags: ['nft', 'marketplace', 'auction'],
    difficulty: 'intermediate',
    estimatedGas: '0.25',
    lastUpdated: '2024-01-08',
    author: 'NFT Developer',
    usage: 920
  },
  {
    id: 'defi-lending',
    name: 'DeFi Lending Pool',
    description: 'Decentralized lending protocol with interest calculation and liquidation',
    category: 'DeFi',
    abi: JSON.stringify({
      "ABI version": 2,
      "functions": [
        {
          "name": "deposit",
          "inputs": [
            {"name": "amount", "type": "uint128"}
          ],
          "outputs": []
        },
        {
          "name": "borrow",
          "inputs": [
            {"name": "amount", "type": "uint128"},
            {"name": "collateral", "type": "uint128"}
          ],
          "outputs": []
        }
      ]
    }),
    tags: ['defi', 'lending', 'yield'],
    difficulty: 'advanced',
    estimatedGas: '0.4',
    lastUpdated: '2024-01-05',
    author: 'DeFi Architect',
    usage: 320
  }
];

// Default workflows
const defaultWorkflows: Workflow[] = [
  {
    id: 'token-deployment',
    name: 'Token Deployment Workflow',
    description: 'Complete workflow for deploying and initializing a new token',
    steps: [
      {
        id: '1',
        type: 'contract_call',
        title: 'Deploy Token Contract',
        description: 'Deploy the TIP3 token contract with initial parameters',
        config: { contractId: 'tip3-token', method: 'constructor' },
        order: 1
      },
      {
        id: '2',
        type: 'condition',
        title: 'Check Deployment Success',
        description: 'Verify the contract was deployed successfully',
        config: { condition: 'contract_exists' },
        order: 2
      },
      {
        id: '3',
        type: 'contract_call',
        title: 'Initialize Token',
        description: 'Set initial token parameters and mint initial supply',
        config: { method: 'initialize', params: { initialSupply: '1000000' } },
        order: 3
      }
    ],
    templateId: 'tip3-token',
    created: '2024-01-15',
    lastUsed: '2024-01-20',
    usage: 45
  },
  {
    id: 'multisig-setup',
    name: 'Multi-Sig Setup Workflow',
    description: 'Setup and configure a multi-signature wallet',
    steps: [
      {
        id: '1',
        type: 'contract_call',
        title: 'Deploy Multi-Sig',
        description: 'Deploy the multi-signature wallet contract',
        config: { contractId: 'multisig-wallet', method: 'constructor' },
        order: 1
      },
      {
        id: '2',
        type: 'contract_call',
        title: 'Add Owners',
        description: 'Add initial owners to the multi-signature wallet',
        config: { method: 'addOwner', params: { owners: [] } },
        order: 2
      },
      {
        id: '3',
        type: 'contract_call',
        title: 'Set Threshold',
        description: 'Set the required number of confirmations',
        config: { method: 'setThreshold', params: { threshold: 2 } },
        order: 3
      }
    ],
    templateId: 'multisig-wallet',
    created: '2024-01-10',
    lastUsed: '2024-01-18',
    usage: 23
  }
];

// State management with localStorage persistence
const customTemplates = ref<ContractTemplate[]>([]);
const customWorkflows = ref<Workflow[]>([]);

// Load data from localStorage on initialization
function loadFromStorage() {
  try {
    const storedTemplates = localStorage.getItem('template-library-custom-templates');
    if (storedTemplates) {
      customTemplates.value = JSON.parse(storedTemplates);
    }
    
    const storedWorkflows = localStorage.getItem('template-library-custom-workflows');
    if (storedWorkflows) {
      customWorkflows.value = JSON.parse(storedWorkflows);
    }
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
  }
}

// Save data to localStorage
function saveToStorage() {
  try {
    localStorage.setItem('template-library-custom-templates', JSON.stringify(customTemplates.value));
    localStorage.setItem('template-library-custom-workflows', JSON.stringify(customWorkflows.value));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

// Initialize storage
loadFromStorage();

// Computed properties
const allTemplates = computed(() => [...defaultTemplates, ...customTemplates.value]);
const allWorkflows = computed(() => [...defaultWorkflows, ...customWorkflows.value]);

// Methods
function addCustomTemplate(template: Omit<ContractTemplate, 'id' | 'lastUpdated' | 'usage'>) {
  const newTemplate: ContractTemplate = {
    ...template,
    id: `custom-${Date.now()}`,
    lastUpdated: new Date().toISOString().split('T')[0],
    usage: 0,
    isCustom: true
  };
  customTemplates.value.push(newTemplate);
  saveToStorage();
  return newTemplate;
}

function updateTemplate(id: string, updates: Partial<ContractTemplate>) {
  const template = allTemplates.value.find(t => t.id === id);
  if (template && template.isCustom) {
    const index = customTemplates.value.findIndex(t => t.id === id);
    if (index !== -1) {
      customTemplates.value[index] = { ...template, ...updates };
      saveToStorage();
    }
  }
}

function deleteTemplate(id: string) {
  const index = customTemplates.value.findIndex(t => t.id === id);
  if (index !== -1) {
    customTemplates.value.splice(index, 1);
    saveToStorage();
  }
}

function addCustomWorkflow(workflow: Omit<Workflow, 'id' | 'created' | 'lastUsed' | 'usage'>) {
  const newWorkflow: Workflow = {
    ...workflow,
    id: `workflow-${Date.now()}`,
    created: new Date().toISOString().split('T')[0],
    lastUsed: new Date().toISOString().split('T')[0],
    usage: 0,
    isCustom: true
  };
  customWorkflows.value.push(newWorkflow);
  saveToStorage();
  return newWorkflow;
}

function updateWorkflow(id: string, updates: Partial<Workflow>) {
  const workflow = allWorkflows.value.find(w => w.id === id);
  if (workflow && workflow.isCustom) {
    const index = customWorkflows.value.findIndex(w => w.id === id);
    if (index !== -1) {
      customWorkflows.value[index] = { ...workflow, ...updates };
      saveToStorage();
    }
  }
}

function deleteWorkflow(id: string) {
  const index = customWorkflows.value.findIndex(w => w.id === id);
  if (index !== -1) {
    customWorkflows.value.splice(index, 1);
    saveToStorage();
  }
}

function incrementUsage(id: string, type: 'template' | 'workflow') {
  if (type === 'template') {
    const template = allTemplates.value.find(t => t.id === id);
    if (template && template.isCustom) {
      const index = customTemplates.value.findIndex(t => t.id === id);
      if (index !== -1) {
        customTemplates.value[index].usage++;
        customTemplates.value[index].lastUpdated = new Date().toISOString().split('T')[0];
        saveToStorage();
      }
    }
  } else {
    const workflow = allWorkflows.value.find(w => w.id === id);
    if (workflow && workflow.isCustom) {
      const index = customWorkflows.value.findIndex(w => w.id === id);
      if (index !== -1) {
        customWorkflows.value[index].usage++;
        customWorkflows.value[index].lastUsed = new Date().toISOString().split('T')[0];
        saveToStorage();
      }
    }
  }
}

function exportTemplates() {
  const dataStr = JSON.stringify(customTemplates.value, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'custom-templates.json';
  link.click();
  URL.revokeObjectURL(url);
}

function exportWorkflows() {
  const dataStr = JSON.stringify(customWorkflows.value, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'custom-workflows.json';
  link.click();
  URL.revokeObjectURL(url);
}

function importTemplates(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const templates = JSON.parse(e.target?.result as string);
        if (Array.isArray(templates)) {
          templates.forEach(template => {
            if (template.id && template.name) {
              template.id = `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              template.isCustom = true;
              template.lastUpdated = new Date().toISOString().split('T')[0];
              template.usage = 0;
              customTemplates.value.push(template);
            }
          });
          saveToStorage();
          resolve();
        } else {
          reject(new Error('Invalid template file format'));
        }
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

function importWorkflows(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workflows = JSON.parse(e.target?.result as string);
        if (Array.isArray(workflows)) {
          workflows.forEach(workflow => {
            if (workflow.id && workflow.name) {
              workflow.id = `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              workflow.isCustom = true;
              workflow.created = new Date().toISOString().split('T')[0];
              workflow.lastUsed = new Date().toISOString().split('T')[0];
              workflow.usage = 0;
              customWorkflows.value.push(workflow);
            }
          });
          saveToStorage();
          resolve();
        } else {
          reject(new Error('Invalid workflow file format'));
        }
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

export function useTemplateLibrary() {
  return {
    // State
    allTemplates,
    allWorkflows,
    customTemplates,
    customWorkflows,
    
    // Methods
    addCustomTemplate,
    updateTemplate,
    deleteTemplate,
    addCustomWorkflow,
    updateWorkflow,
    deleteWorkflow,
    incrementUsage,
    exportTemplates,
    exportWorkflows,
    importTemplates,
    importWorkflows
  };
} 