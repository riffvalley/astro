<script setup lang="ts">
import { onMounted, ref } from 'vue';

withDefaults(
  defineProps<{
    title: string;
    subtitle?: string;
    subtitleHref?: string;
    canGoBack?: boolean;
    platformIcon?: 'instagram' | 'telegram' | 'tiktok';
  }>(),
  { canGoBack: false },
);

const emit = defineEmits<{ ready: [HTMLElement]; back: [] }>();

const viewport = ref<HTMLElement | null>(null);

// El grid padre necesita el elemento con scroll interno como `root` de su
// IntersectionObserver para el scroll infinito — emitirlo en vez de exponerlo
// vía template ref evita depender de en qué orden exacto Vue resuelve los
// refs entre componente padre e hijo.
onMounted(() => {
  if (viewport.value) emit('ready', viewport.value);
});

function scrollToTop() {
  viewport.value?.scrollTo({ top: 0, behavior: 'smooth' });
}
</script>

<template>
  <div class="phone">
    <div class="phone-notch" aria-hidden="true"></div>
    <div class="phone-header">
      <span class="phone-title">{{ title }}</span>
      <a
        v-if="subtitle && subtitleHref"
        :href="subtitleHref"
        target="_blank"
        rel="noopener noreferrer"
        class="phone-subtitle phone-subtitle--link"
      >{{ subtitle }}</a>
      <span v-else-if="subtitle" class="phone-subtitle">{{ subtitle }}</span>
    </div>
    <div ref="viewport" class="phone-viewport">
      <slot />
    </div>
    <div class="phone-nav">
      <a
        v-if="subtitleHref"
        :href="subtitleHref"
        target="_blank"
        rel="noopener noreferrer"
        class="phone-nav-item"
        aria-label="Abrir perfil en la red social"
      >
        <svg v-if="platformIcon === 'telegram'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" />
        </svg>
        <svg v-else-if="platformIcon === 'tiktok'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 18V6a4 4 0 0 1 4-4h1a5 5 0 0 0 5 5v3a8 8 0 0 1-5-1.75V18a5 5 0 1 1-5-5" />
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
        </svg>
      </a>
      <span v-else></span>

      <button type="button" class="phone-nav-item" aria-label="Ir arriba del todo" @click="scrollToTop">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 11.5 12 4l9 7.5" /><path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
        </svg>
      </button>

      <button type="button" class="phone-nav-item" :disabled="!canGoBack" aria-label="Volver atrás" @click="$emit('back')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.phone {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 380px;
  margin: 0 auto;
  border: 10px solid var(--color-paper-3);
  border-radius: 2.25rem;
  background: var(--color-paper-2);
  box-shadow: 0 24px 48px -28px color-mix(in srgb, black 55%, transparent);
  overflow: hidden;
}

.phone-notch {
  flex-shrink: 0;
  width: 88px;
  height: 20px;
  margin: 0 auto;
  background: var(--color-paper-3);
  border-radius: 0 0 12px 12px;
}

.phone-header {
  flex-shrink: 0;
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--color-rule-2);
}

.phone-title {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 0.9375rem;
  letter-spacing: -0.01em;
  color: var(--color-ink);
}

.phone-subtitle {
  font-size: 0.75rem;
  color: var(--color-muted);
}

.phone-subtitle--link {
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: color 120ms var(--ease-out, ease), border-color 120ms var(--ease-out, ease);
}

.phone-subtitle--link:hover {
  color: var(--color-accent);
  border-color: var(--color-accent);
}

.phone-viewport {
  flex: 1;
  max-height: 32rem;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 0.5rem;
  scrollbar-width: thin;
  scrollbar-color: var(--color-rule) transparent;
}

.phone-viewport::-webkit-scrollbar {
  width: 6px;
}

.phone-viewport::-webkit-scrollbar-track {
  background: transparent;
}

.phone-viewport::-webkit-scrollbar-thumb {
  background-color: var(--color-rule);
  border-radius: 9999px;
}

.phone-viewport::-webkit-scrollbar-thumb:hover {
  background-color: var(--color-muted);
}

.phone-nav {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0.65rem 0.5rem;
  border-top: 1px solid var(--color-rule-2);
  background: var(--color-paper-2);
}

.phone-nav-item {
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  padding: 0.25rem;
  color: var(--color-ink-2);
  cursor: pointer;
  transition: color 120ms var(--ease-out, ease);
}

.phone-nav-item:hover:not(:disabled) {
  color: var(--color-ink);
}

.phone-nav-item:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.phone-nav-item svg {
  width: 20px;
  height: 20px;
}
</style>
