<template>
  <div class="area-selector">
    <el-tree
      ref="treeRef"
      :data="treeData"
      show-checkbox
      node-key="id"
      :props="treeProps"
      :default-expand-all="false"
      :expand-on-click-node="false"
      :check-on-click-node="true"
      @check="handleCheck"
      class="area-tree"
    >
      <template #default="{ node, data }">
        <span class="custom-tree-node">
          <span class="node-label">{{ data.label }}</span>
          <span v-if="data.count" class="node-count">({{ data.count }})</span>
        </span>
      </template>
    </el-tree>

    <div class="tree-actions">
      <el-button size="small" @click="selectAll">Select All</el-button>
      <el-button size="small" @click="clearAll">Clear All</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { AREA_HIERARCHY, VENUE_NAMES } from '@/utils/areaConfig'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

const treeRef = ref(null)

const treeProps = {
  label: 'label',
  children: 'children'
}

// Build tree data structure
const treeData = computed(() => {
  return Object.entries(AREA_HIERARCHY).map(([areaKey, area]) => ({
    id: areaKey,
    label: area.title,
    color: area.color,
    children: Object.entries(area.subareas).map(([subareaKey, subarea]) => ({
      id: subareaKey,
      label: subarea.title,
      children: subarea.venues.map(venue => ({
        id: venue,
        label: VENUE_NAMES[venue] || venue.toUpperCase(),
        isVenue: true
      }))
    }))
  }))
})

// Handle checkbox change
function handleCheck(data, checked) {
  const checkedKeys = treeRef.value.getCheckedKeys()
  const checkedNodes = treeRef.value.getCheckedNodes()
  
  // Extract only venue IDs (leaf nodes)
  const venueIds = checkedNodes
    .filter(node => node.isVenue)
    .map(node => node.id)
  
  emit('update:modelValue', venueIds)
}

// Select all venues
function selectAll() {
  const allKeys = []
  
  for (const area of treeData.value) {
    allKeys.push(area.id)
    for (const subarea of area.children) {
      allKeys.push(subarea.id)
      for (const venue of subarea.children) {
        allKeys.push(venue.id)
      }
    }
  }
  
  treeRef.value.setCheckedKeys(allKeys)
  handleCheck()
}

// Clear all selections
function clearAll() {
  treeRef.value.setCheckedKeys([])
  handleCheck()
}

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
  if (treeRef.value && newValue) {
    treeRef.value.setCheckedKeys(newValue)
  }
}, { immediate: true })
</script>

<style scoped>
.area-selector {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.area-tree {
  flex: 1;
  overflow-y: auto;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  padding: 8px;
  background: white;
}

.custom-tree-node {
  display: flex;
  align-items: center;
  font-size: 14px;
}

.node-label {
  margin-right: 4px;
}

.node-count {
  color: var(--el-color-info);
  font-size: 12px;
}

.tree-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
}

:deep(.el-tree-node__content) {
  height: 32px;
}

:deep(.el-tree-node__label) {
  font-size: 14px;
}
</style>

