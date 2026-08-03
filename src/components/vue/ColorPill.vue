<script setup lang="ts">
withDefaults(defineProps<{ label: string; color: string; textColor?: string }>(), {
  textColor: '#ffffff',
});
</script>

<template>
  <span class="pill" :style="{ '--pill-color': color, '--pill-text': textColor }">{{ label }}</span>
</template>

<style scoped>
.pill {
  padding: 0.2rem 0.65rem;
  border-radius: 9999px;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  white-space: nowrap;
  color: var(--pill-text, #fff);
  background: var(--pill-color, var(--color-accent));
}
</style>
