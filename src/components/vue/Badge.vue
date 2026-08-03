<script setup lang="ts">
withDefaults(defineProps<{ label: string; variant?: 'default' | 'accent' }>(), {
  variant: 'default',
});
</script>

<template>
  <span class="disc-badge" :class="{ 'disc-badge--accent': variant === 'accent' }">{{ label }}</span>
</template>

<style scoped>
.disc-badge {
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  white-space: nowrap;
  color: var(--color-ink-2);
  background: transparent;
  border: 1px solid var(--color-rule);
}

.disc-badge--accent {
  color: var(--color-accent);
  border-color: color-mix(in srgb, var(--color-accent) 45%, transparent);
}
</style>
