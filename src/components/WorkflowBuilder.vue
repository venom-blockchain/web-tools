<script setup lang="ts">
import { ref, computed } from 'vue';
import { WorkflowStep } from '../providers/useTemplateLibrary';

interface Props {
  modelValue: WorkflowStep[];
}

interface Emits {
  (e: 'update:modelValue', value: WorkflowStep[]): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const steps = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const showAddStepModal = ref(false);
const newStepType = ref<WorkflowStep['type']>('contract_call');
const newStepTitle = ref('');
const newStepDescription = ref('');

const stepTypes = [
  { value: 'contract_call', label: 'Contract Call', icon: 'fas fa-cube' },
  { value: 'condition', label: 'Condition', icon: 'fas fa-question-circle' },
  { value: 'delay', label: 'Delay', icon: 'fas fa-clock' },
  { value: 'notification', label: 'Notification', icon: 'fas fa-bell' }
];

function addStep() {
  if (!newStepTitle.value || !newStepDescription.value) return;
  
  const newStep: WorkflowStep = {
    id: `step-${Date.now()}`,
    type: newStepType.value,
    title: newStepTitle.value,
    description: newStepDescription.value,
    config: {},
    order: steps.value.length + 1
  };
  
  steps.value = [...steps.value, newStep];
  
  // Reset form
  newStepTitle.value = '';
  newStepDescription.value = '';
  showAddStepModal.value = false;
}

function removeStep(stepId: string) {
  steps.value = steps.value.filter(step => step.id !== stepId);
  // Reorder remaining steps
  steps.value = steps.value.map((step, index) => ({
    ...step,
    order: index + 1
  }));
}

function moveStep(stepId: string, direction: 'up' | 'down') {
  const currentIndex = steps.value.findIndex(step => step.id === stepId);
  if (currentIndex === -1) return;
  
  const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  if (newIndex < 0 || newIndex >= steps.value.length) return;
  
  const newSteps = [...steps.value];
  [newSteps[currentIndex], newSteps[newIndex]] = [newSteps[newIndex], newSteps[currentIndex]];
  
  // Update order
  newSteps.forEach((step, index) => {
    step.order = index + 1;
  });
  
  steps.value = newSteps;
}

function getStepIcon(type: WorkflowStep['type']) {
  const stepType = stepTypes.find(t => t.value === type);
  return stepType?.icon || 'fas fa-circle';
}

function getStepColor(type: WorkflowStep['type']) {
  switch (type) {
    case 'contract_call': return 'is-primary';
    case 'condition': return 'is-warning';
    case 'delay': return 'is-info';
    case 'notification': return 'is-success';
    default: return 'is-light';
  }
}
</script>

<template>
  <div class="workflow-builder">
    <div class="field">
      <label class="label">Workflow Steps</label>
      <div class="control">
        <button 
          @click="showAddStepModal = true"
          class="button is-primary is-small"
        >
          <span class="icon is-small">
            <i class="fas fa-plus"></i>
          </span>
          <span>Add Step</span>
        </button>
      </div>
    </div>

    <!-- Steps List -->
    <div class="steps-container">
      <div 
        v-for="(step, index) in steps" 
        :key="step.id" 
        class="step-item"
      >
        <div class="step-header">
          <div class="step-number">{{ step.order }}</div>
          <div class="step-content">
            <div class="step-title">
              <span :class="['tag', getStepColor(step.type)]">
                <span class="icon is-small">
                  <i :class="getStepIcon(step.type)"></i>
                </span>
                <span>{{ step.title }}</span>
              </span>
            </div>
            <div class="step-description">{{ step.description }}</div>
          </div>
          <div class="step-actions">
            <button 
              @click="moveStep(step.id, 'up')"
              :disabled="index === 0"
              class="button is-small"
            >
              <span class="icon is-small">
                <i class="fas fa-arrow-up"></i>
              </span>
            </button>
            <button 
              @click="moveStep(step.id, 'down')"
              :disabled="index === steps.length - 1"
              class="button is-small"
            >
              <span class="icon is-small">
                <i class="fas fa-arrow-down"></i>
              </span>
            </button>
            <button 
              @click="removeStep(step.id)"
              class="button is-small is-danger"
            >
              <span class="icon is-small">
                <i class="fas fa-trash"></i>
              </span>
            </button>
          </div>
        </div>
      </div>
      
      <div v-if="steps.length === 0" class="empty-state">
        <div class="has-text-centered">
          <span class="icon is-large">
            <i class="fas fa-project-diagram"></i>
          </span>
          <p class="has-text-grey">No steps added yet. Click "Add Step" to get started.</p>
        </div>
      </div>
    </div>

    <!-- Add Step Modal -->
    <div v-if="showAddStepModal" class="modal is-active">
      <div class="modal-background" @click="showAddStepModal = false"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">Add Workflow Step</p>
          <button class="delete" @click="showAddStepModal = false"></button>
        </header>
        <section class="modal-card-body">
          <div class="field">
            <label class="label">Step Type</label>
            <div class="control">
              <div class="select is-fullwidth">
                <select v-model="newStepType">
                  <option 
                    v-for="type in stepTypes" 
                    :key="type.value" 
                    :value="type.value"
                  >
                    <span class="icon">
                      <i :class="type.icon"></i>
                    </span>
                    {{ type.label }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <div class="field">
            <label class="label">Step Title</label>
            <div class="control">
              <input 
                v-model="newStepTitle"
                class="input" 
                type="text" 
                placeholder="Enter step title"
              >
            </div>
          </div>

          <div class="field">
            <label class="label">Step Description</label>
            <div class="control">
              <textarea 
                v-model="newStepDescription"
                class="textarea" 
                placeholder="Describe what this step does"
                rows="3"
              ></textarea>
            </div>
          </div>

          <!-- Step Type Specific Configuration -->
          <div v-if="newStepType === 'contract_call'" class="field">
            <label class="label">Contract Configuration</label>
            <div class="control">
              <input class="input" type="text" placeholder="Contract method to call">
            </div>
          </div>

          <div v-if="newStepType === 'condition'" class="field">
            <label class="label">Condition</label>
            <div class="control">
              <div class="select is-fullwidth">
                <select>
                  <option>Check if contract exists</option>
                  <option>Check balance</option>
                  <option>Check transaction success</option>
                  <option>Custom condition</option>
                </select>
              </div>
            </div>
          </div>

          <div v-if="newStepType === 'delay'" class="field">
            <label class="label">Delay Duration</label>
            <div class="control">
              <div class="field has-addons">
                <div class="control">
                  <input class="input" type="number" placeholder="Duration" min="1">
                </div>
                <div class="control">
                  <div class="select">
                    <select>
                      <option>seconds</option>
                      <option>minutes</option>
                      <option>hours</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="newStepType === 'notification'" class="field">
            <label class="label">Notification Message</label>
            <div class="control">
              <textarea class="textarea" placeholder="Message to display"></textarea>
            </div>
          </div>
        </section>
        <footer class="modal-card-foot">
          <button class="button is-primary" @click="addStep">
            <span class="icon">
              <i class="fas fa-plus"></i>
            </span>
            <span>Add Step</span>
          </button>
          <button class="button" @click="showAddStepModal = false">Cancel</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<style scoped>
.workflow-builder {
  margin-bottom: 1rem;
}

.steps-container {
  margin-top: 1rem;
}

.step-item {
  border: 1px solid #dbdbdb;
  border-radius: 6px;
  margin-bottom: 0.5rem;
  background: #fafafa;
}

.step-header {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  gap: 0.75rem;
}

.step-number {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: #3273dc;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.875rem;
}

.step-content {
  flex: 1;
}

.step-title {
  margin-bottom: 0.25rem;
}

.step-description {
  font-size: 0.875rem;
  color: #666;
}

.step-actions {
  display: flex;
  gap: 0.25rem;
}

.empty-state {
  padding: 2rem;
  border: 2px dashed #dbdbdb;
  border-radius: 6px;
  background: #fafafa;
}

.empty-state .icon {
  color: #b5b5b5;
  margin-bottom: 1rem;
}

.step-item:hover {
  background: #f5f5f5;
  border-color: #b5b5b5;
}
</style> 