<script setup lang="ts">
import AppPage from './AppPage.vue'

const props = defineProps({
  api: { type: Object, default: () => ({}) },
  pluginId: { type: String, default: 'SeedCleaner' },
})
const emit = defineEmits(['action', 'switch', 'close'])
</script>

<template>
  <AppPage
    :api="props.api"
    :plugin-id="props.pluginId"
    @action="emit('action')"
    @switch="emit('switch')"
    @close="emit('close')"
  />
</template>
