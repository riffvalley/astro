<script setup lang="ts">
withDefaults(defineProps<{
  label: string;
  countLabel: string;
  collapsible?: boolean;
  open?: boolean;
}>(), {
  collapsible: false,
  open: false,
});
</script>

<template>
  <details v-if="collapsible" class="release-group" :open="open">
    <summary class="release-summary">
      <span class="release-date">{{ label }}</span>
      <span class="release-count">{{ countLabel }}</span>
    </summary>
    <ul class="disc-list"><slot /></ul>
  </details>
  <div v-else class="release-group">
    <div class="release-summary">
      <span class="release-date">{{ label }}</span>
      <span class="release-count">{{ countLabel }}</span>
    </div>
    <ul class="disc-list"><slot /></ul>
  </div>
</template>

<style scoped>
.release-group {
  margin-bottom: var(--space-md, 1rem);
  border: 1px solid var(--color-rule);
  border-radius: 12px;
  overflow: hidden;
  background: var(--color-paper-2);
}

.release-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.9rem 1.1rem;
  border-bottom: 1px solid var(--color-rule-2);
  list-style: none;
}

.release-summary::-webkit-details-marker { display: none; }

summary.release-summary { cursor: pointer; }
summary.release-summary:hover { background: var(--color-paper-3); }

.release-date {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 0.9375rem;
  letter-spacing: -0.01em;
  color: var(--color-ink);
}

.release-count {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  color: var(--color-muted);
}

.disc-list {
  list-style: none;
  margin: 0;
  padding: 0 0.5rem 0.5rem;
}
</style>
