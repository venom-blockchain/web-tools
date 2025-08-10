<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useTvmConnect } from '../providers/useTvmConnect';
import { useTemplateLibrary } from '../providers/useTemplateLibrary';

interface ContractTemplate {
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
}

interface WorkflowStep {
  id: string;
  type: 'contract_call' | 'condition' | 'delay' | 'notification';
  title: string;
  description: string;
  config: any;
  order: number;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  templateId?: string;
  created: string;
  lastUsed: string;
  usage: number;
}

const router = useRouter();
const { tvmConnectState } = useTvmConnect();
const { 
  allTemplates, 
  allWorkflows, 
  addCustomTemplate, 
  addCustomWorkflow, 
  incrementUsage,
  exportTemplates,
  exportWorkflows,
  importTemplates,
  importWorkflows
} = useTemplateLibrary();

// State
const activeTab = ref<'templates' | 'workflows' | 'create'>('templates');
const searchQuery = ref('');
const selectedCategory = ref<string>('all');
const selectedDifficulty = ref<string>('all');
const showCreateModal = ref(false);
const showWorkflowModal = ref(false);
const selectedTemplate = ref<ContractTemplate | null>(null);
const selectedWorkflow = ref<Workflow | null>(null);

// Use templates and workflows from provider
const templates = allTemplates;
const workflows = allWorkflows;

// Computed properties
const filteredTemplates = computed(() => {
  let filtered = templates.value;
  
  if (searchQuery.value) {
    filtered = filtered.filter(template => 
      template.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchQuery.value.toLowerCase()))
    );
  }
  
  if (selectedCategory.value !== 'all') {
    filtered = filtered.filter(template => template.category === selectedCategory.value);
  }
  
  if (selectedDifficulty.value !== 'all') {
    filtered = filtered.filter(template => template.difficulty === selectedDifficulty.value);
  }
  
  return filtered;
});

const categories = computed(() => {
  const cats = ['all', ...new Set(templates.value.map(t => t.category))];
  return cats;
});

const filteredWorkflows = computed(() => {
  if (searchQuery.value) {
    return workflows.value.filter(workflow => 
      workflow.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      workflow.description.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  }
  return workflows.value;
});

// Methods
function useTemplate(template: ContractTemplate) {
  selectedTemplate.value = template;
  showCreateModal.value = true;
}

function createWorkflow(template: ContractTemplate) {
  const newWorkflow = addCustomWorkflow({
    name: `${template.name} Workflow`,
    description: `Custom workflow for ${template.name}`,
    steps: [
      {
        id: '1',
        type: 'contract_call',
        title: 'Deploy Contract',
        description: 'Deploy the contract',
        config: { contractId: template.id, method: 'constructor' },
        order: 1
      }
    ],
    templateId: template.id
  });
  
  selectedWorkflow.value = newWorkflow;
  showWorkflowModal.value = true;
}

function executeWorkflow(workflow: Workflow) {
  // Navigate to executor with workflow configuration
  router.push({
    path: '/executor',
    query: { 
      workflow: workflow.id,
      template: workflow.templateId 
    }
  });
}

function exportWorkflow(workflow: Workflow) {
  const dataStr = JSON.stringify(workflow, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${workflow.name.replace(/\s+/g, '-')}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

async function importWorkflow(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    try {
      await importWorkflows(file);
    } catch (error) {
      console.error('Failed to import workflow:', error);
    }
  }
}

function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case 'beginner': return 'is-success';
    case 'intermediate': return 'is-warning';
    case 'advanced': return 'is-danger';
    default: return 'is-light';
  }
}

function getDifficultyIcon(difficulty: string) {
  switch (difficulty) {
    case 'beginner': return 'fas fa-seedling';
    case 'intermediate': return 'fas fa-tree';
    case 'advanced': return 'fas fa-rocket';
    default: return 'fas fa-circle';
  }
}
</script>

<template>
  <div class="template-library">
    <!-- Header -->
    <section class="hero is-primary is-bold">
      <div class="hero-body">
        <div class="container">
          <h1 class="title">
            <span class="icon-text">
              <span class="icon">
                <i class="fas fa-layer-group"></i>
              </span>
              <span>Smart Contract Template Library</span>
            </span>
          </h1>
          <h2 class="subtitle">
            Discover, create, and manage smart contract templates and workflows
          </h2>
        </div>
      </div>
    </section>

    <!-- Navigation Tabs -->
    <div class="tabs is-centered is-boxed">
      <ul>
        <li :class="{ 'is-active': activeTab === 'templates' }">
          <a @click="activeTab = 'templates'">
            <span class="icon"><i class="fas fa-cube"></i></span>
            <span>Templates</span>
          </a>
        </li>
        <li :class="{ 'is-active': activeTab === 'workflows' }">
          <a @click="activeTab = 'workflows'">
            <span class="icon"><i class="fas fa-project-diagram"></i></span>
            <span>Workflows</span>
          </a>
        </li>
        <li :class="{ 'is-active': activeTab === 'create' }">
          <a @click="activeTab = 'create'">
            <span class="icon"><i class="fas fa-plus"></i></span>
            <span>Create</span>
          </a>
        </li>
      </ul>
    </div>

    <!-- Templates Tab -->
    <div v-if="activeTab === 'templates'" class="section">
      <div class="container">
        <!-- Search and Filters -->
        <div class="columns mb-4">
          <div class="column is-8">
            <div class="field">
              <div class="control has-icons-left">
                <input 
                  v-model="searchQuery"
                  class="input is-medium" 
                  type="text" 
                  placeholder="Search templates..."
                >
                <span class="icon is-left">
                  <i class="fas fa-search"></i>
                </span>
              </div>
            </div>
          </div>
          <div class="column is-2">
            <div class="field">
              <div class="control">
                <div class="select is-medium is-fullwidth">
                  <select v-model="selectedCategory">
                    <option v-for="category in categories" :key="category" :value="category">
                      {{ category === 'all' ? 'All Categories' : category }}
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div class="column is-2">
            <div class="field">
              <div class="control">
                <div class="select is-medium is-fullwidth">
                  <select v-model="selectedDifficulty">
                    <option value="all">All Levels</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Templates Grid -->
        <div class="columns is-multiline">
          <div 
            v-for="template in filteredTemplates" 
            :key="template.id" 
            class="column is-4"
          >
            <div class="card">
              <div class="card-content">
                <div class="media">
                  <div class="media-content">
                    <p class="title is-4">{{ template.name }}</p>
                    <p class="subtitle is-6">
                      <span :class="['tag', getDifficultyColor(template.difficulty)]">
                        <span class="icon is-small">
                          <i :class="getDifficultyIcon(template.difficulty)"></i>
                        </span>
                        <span>{{ template.difficulty }}</span>
                      </span>
                    </p>
                  </div>
                </div>

                <div class="content">
                  <p>{{ template.description }}</p>
                  
                  <div class="tags mb-3">
                    <span 
                      v-for="tag in template.tags" 
                      :key="tag" 
                      class="tag is-info is-light"
                    >
                      {{ tag }}
                    </span>
                  </div>

                  <div class="level">
                    <div class="level-left">
                      <div class="level-item">
                        <div class="field has-addons">
                          <p class="control">
                            <span class="button is-small is-static">
                              <span class="icon is-small">
                                <i class="fas fa-fire"></i>
                              </span>
                              <span>{{ template.estimatedGas }} EVER</span>
                            </span>
                          </p>
                          <p class="control">
                            <span class="button is-small is-static">
                              <span class="icon is-small">
                                <i class="fas fa-download"></i>
                              </span>
                              <span>{{ template.usage }}</span>
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="buttons">
                    <button 
                      @click="useTemplate(template)"
                      class="button is-primary is-small"
                    >
                      <span class="icon is-small">
                        <i class="fas fa-play"></i>
                      </span>
                      <span>Use Template</span>
                    </button>
                    <button 
                      @click="createWorkflow(template)"
                      class="button is-info is-small"
                    >
                      <span class="icon is-small">
                        <i class="fas fa-project-diagram"></i>
                      </span>
                      <span>Create Workflow</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Workflows Tab -->
    <div v-if="activeTab === 'workflows'" class="section">
      <div class="container">
        <!-- Workflow Actions -->
        <div class="columns mb-4">
          <div class="column is-8">
            <div class="field">
              <div class="control has-icons-left">
                <input 
                  v-model="searchQuery"
                  class="input is-medium" 
                  type="text" 
                  placeholder="Search workflows..."
                >
                <span class="icon is-left">
                  <i class="fas fa-search"></i>
                </span>
              </div>
            </div>
          </div>
          <div class="column is-4">
            <div class="buttons">
              <button class="button is-info">
                <span class="icon">
                  <i class="fas fa-upload"></i>
                </span>
                <span>Import Workflow</span>
                <input 
                  type="file" 
                  accept=".json" 
                  @change="importWorkflow" 
                  style="position: absolute; opacity: 0; width: 100%; height: 100%; cursor: pointer;"
                >
              </button>
            </div>
          </div>
        </div>

        <!-- Workflows List -->
        <div class="columns is-multiline">
          <div 
            v-for="workflow in filteredWorkflows" 
            :key="workflow.id" 
            class="column is-6"
          >
            <div class="card">
              <div class="card-content">
                <div class="media">
                  <div class="media-content">
                    <p class="title is-4">{{ workflow.name }}</p>
                    <p class="subtitle is-6">
                      <span class="tag is-info">
                        <span class="icon is-small">
                          <i class="fas fa-steps"></i>
                        </span>
                        <span>{{ workflow.steps.length }} steps</span>
                      </span>
                    </p>
                  </div>
                </div>

                <div class="content">
                  <p>{{ workflow.description }}</p>
                  
                  <div class="level">
                    <div class="level-left">
                      <div class="level-item">
                        <div class="field has-addons">
                          <p class="control">
                            <span class="button is-small is-static">
                              <span class="icon is-small">
                                <i class="fas fa-calendar"></i>
                              </span>
                              <span>{{ workflow.created }}</span>
                            </span>
                          </p>
                          <p class="control">
                            <span class="button is-small is-static">
                              <span class="icon is-small">
                                <i class="fas fa-play"></i>
                              </span>
                              <span>{{ workflow.usage }}</span>
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="buttons">
                    <button 
                      @click="executeWorkflow(workflow)"
                      class="button is-primary is-small"
                    >
                      <span class="icon is-small">
                        <i class="fas fa-play"></i>
                      </span>
                      <span>Execute</span>
                    </button>
                    <button 
                      @click="exportWorkflow(workflow)"
                      class="button is-info is-small"
                    >
                      <span class="icon is-small">
                        <i class="fas fa-download"></i>
                      </span>
                      <span>Export</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Tab -->
    <div v-if="activeTab === 'create'" class="section">
      <div class="container">
        <div class="columns">
          <div class="column is-8 is-offset-2">
            <div class="card">
              <div class="card-content">
                <h3 class="title is-4">Create New Template</h3>
                <p class="subtitle is-6">Build your own smart contract template</p>
                
                <div class="field">
                  <label class="label">Template Name</label>
                  <div class="control">
                    <input class="input" type="text" placeholder="Enter template name">
                  </div>
                </div>

                <div class="field">
                  <label class="label">Description</label>
                  <div class="control">
                    <textarea class="textarea" placeholder="Describe your template"></textarea>
                  </div>
                </div>

                <div class="field">
                  <label class="label">Category</label>
                  <div class="control">
                    <div class="select is-fullwidth">
                      <select>
                        <option>Tokens</option>
                        <option>Security</option>
                        <option>Governance</option>
                        <option>NFT</option>
                        <option>DeFi</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div class="field">
                  <label class="label">Difficulty Level</label>
                  <div class="control">
                    <div class="select is-fullwidth">
                      <select>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div class="field">
                  <label class="label">ABI JSON</label>
                  <div class="control">
                    <textarea class="textarea" rows="10" placeholder="Paste your ABI JSON here"></textarea>
                  </div>
                </div>

                <div class="field">
                  <label class="label">Tags</label>
                  <div class="control">
                    <input class="input" type="text" placeholder="Enter tags separated by commas">
                  </div>
                </div>

                <div class="field">
                  <div class="control">
                    <button class="button is-primary">
                      <span class="icon">
                        <i class="fas fa-save"></i>
                      </span>
                      <span>Create Template</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Template Usage Modal -->
    <div v-if="showCreateModal" class="modal is-active">
      <div class="modal-background" @click="showCreateModal = false"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">Use Template: {{ selectedTemplate?.name }}</p>
          <button class="delete" @click="showCreateModal = false"></button>
        </header>
        <section class="modal-card-body">
          <p>{{ selectedTemplate?.description }}</p>
          <div class="field">
            <label class="label">Contract Address (Optional)</label>
            <div class="control">
              <input class="input" type="text" placeholder="Enter contract address if already deployed">
            </div>
          </div>
        </section>
        <footer class="modal-card-foot">
          <button class="button is-primary" @click="showCreateModal = false">
            <span class="icon">
              <i class="fas fa-external-link-alt"></i>
            </span>
            <span>Open in Executor</span>
          </button>
          <button class="button" @click="showCreateModal = false">Cancel</button>
        </footer>
      </div>
    </div>

    <!-- Workflow Modal -->
    <div v-if="showWorkflowModal" class="modal is-active">
      <div class="modal-background" @click="showWorkflowModal = false"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">Workflow: {{ selectedWorkflow?.name }}</p>
          <button class="delete" @click="showWorkflowModal = false"></button>
        </header>
        <section class="modal-card-body">
          <p>{{ selectedWorkflow?.description }}</p>
          <div class="content">
            <h4>Steps:</h4>
            <ol>
              <li v-for="step in selectedWorkflow?.steps" :key="step.id">
                <strong>{{ step.title }}</strong>: {{ step.description }}
              </li>
            </ol>
          </div>
        </section>
        <footer class="modal-card-foot">
          <button class="button is-primary" @click="showWorkflowModal = false">
            <span class="icon">
              <i class="fas fa-edit"></i>
            </span>
            <span>Edit Workflow</span>
          </button>
          <button class="button is-info" @click="showWorkflowModal = false">
            <span class="icon">
              <i class="fas fa-play"></i>
            </span>
            <span>Execute</span>
          </button>
          <button class="button" @click="showWorkflowModal = false">Cancel</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<style scoped>
.template-library {
  min-height: 100vh;
}

.tabs a {
  cursor: pointer;
}

.card {
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.buttons input[type="file"] {
  position: absolute;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.level-item .field.has-addons {
  margin-bottom: 0;
}

.tag .icon {
  margin-right: 0.25rem;
}
</style> 