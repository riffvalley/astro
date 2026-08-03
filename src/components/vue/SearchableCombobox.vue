<script setup lang="ts">
import { computed, ref, watch } from 'vue';

interface ComboOption {
  id: string;
  name: string;
}

const props = defineProps<{
  modelValue: string;
  options: ComboOption[];
  label: string;
  placeholder: string;
  fieldId: string;
}>();

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>();

const inputValue = ref('');
const selected = ref<ComboOption | null>(null);
const open = ref(false);
const activeIndex = ref(-1);

const inputRef = ref<HTMLInputElement | null>(null);
const listboxRef = ref<HTMLUListElement | null>(null);

function normalize(str: string) {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

const sortedOptions = computed(() => props.options.slice().sort((a, b) => a.name.localeCompare(b.name, 'es')));

const filtered = computed(() => {
  const q = normalize(inputValue.value.trim());
  return q ? sortedOptions.value.filter((o) => normalize(o.name).includes(q)) : sortedOptions.value;
});

const listboxId = computed(() => `${props.fieldId}-listbox`);

// Si el padre limpia el filtro desde fuera (p.ej. "Quitar filtros"), refleja
// el estado limpio también en el texto mostrado.
watch(
  () => props.modelValue,
  (val) => {
    if (val === '' && selected.value) {
      selected.value = null;
      inputValue.value = '';
    }
  },
);

function openList() {
  open.value = true;
  activeIndex.value = filtered.value.length ? 0 : -1;
}

function closeList() {
  open.value = false;
  activeIndex.value = -1;
}

function selectOption(opt: ComboOption | null) {
  selected.value = opt;
  inputValue.value = opt ? opt.name : '';
  closeList();
  emit('update:modelValue', opt ? opt.id : '');
}

function onInput() {
  if (selected.value && inputValue.value !== selected.value.name) {
    selected.value = null;
    emit('update:modelValue', '');
  }
  openList();
}

function onFocus() {
  openList();
}

function onBlur() {
  // pequeño margen para que el mousedown de la lista se procese antes de cerrar
  setTimeout(() => {
    closeList();
    if (!selected.value) inputValue.value = '';
  }, 120);
}

function scrollActiveIntoView() {
  listboxRef.value?.querySelector('.is-active')?.scrollIntoView({ block: 'nearest' });
}

function onKeydown(e: KeyboardEvent) {
  if (!open.value && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
    openList();
    return;
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    activeIndex.value = Math.min(activeIndex.value + 1, filtered.value.length - 1);
    scrollActiveIntoView();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    activeIndex.value = Math.max(activeIndex.value - 1, 0);
    scrollActiveIntoView();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (activeIndex.value >= 0 && filtered.value[activeIndex.value]) selectOption(filtered.value[activeIndex.value]);
  } else if (e.key === 'Escape') {
    closeList();
  }
}

function onOptionMousedown(e: MouseEvent, opt: ComboOption) {
  e.preventDefault(); // evita el blur del input antes de procesar el click
  selectOption(opt);
}

function clear() {
  selectOption(null);
  inputRef.value?.focus();
}
</script>

<template>
  <div class="filters-field combobox">
    <label :for="`${fieldId}-input`" class="filters-label">{{ label }}</label>
    <div class="combobox-control">
      <svg class="combobox-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M18 10.5a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z" />
      </svg>
      <input
        :id="`${fieldId}-input`"
        ref="inputRef"
        v-model="inputValue"
        type="text"
        class="filters-input"
        role="combobox"
        :aria-expanded="open"
        aria-autocomplete="list"
        :aria-controls="listboxId"
        :aria-activedescendant="activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined"
        autocomplete="off"
        :placeholder="placeholder"
        @input="onInput"
        @focus="onFocus"
        @blur="onBlur"
        @keydown="onKeydown"
      />
      <button
        v-if="selected"
        type="button"
        class="combobox-clear"
        :aria-label="`Quitar filtro de ${label.toLowerCase()}`"
        @click="clear"
      >×</button>
      <svg v-else class="combobox-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6" />
      </svg>
    </div>
    <ul v-show="open" :id="listboxId" ref="listboxRef" class="combobox-listbox" role="listbox">
      <li v-if="filtered.length === 0" class="combobox-empty" role="presentation">Sin resultados</li>
      <li
        v-for="(opt, i) in filtered"
        :id="`${listboxId}-opt-${i}`"
        :key="opt.id"
        role="option"
        :aria-selected="selected?.id === opt.id"
        class="combobox-option"
        :class="{ 'is-active': i === activeIndex, 'is-selected': selected?.id === opt.id }"
        @mousedown="onOptionMousedown($event, opt)"
      >{{ opt.name }}</li>
    </ul>
  </div>
</template>

<style scoped>
.filters-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  position: relative;
}

.filters-label {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-muted);
}

.combobox-control {
  position: relative;
  display: flex;
  align-items: center;
  min-width: 14rem;
  border-radius: 9999px;
  border: 1px solid var(--color-rule);
  background: var(--color-paper-2);
  transition: border-color 160ms var(--ease-out, ease), background 160ms var(--ease-out, ease);
}

.combobox-control:focus-within {
  border-color: var(--color-accent);
  background: var(--color-paper-3);
}

.combobox-icon {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-left: 0.85rem;
  color: var(--color-muted);
}

.combobox-control:focus-within .combobox-icon { color: var(--color-accent); }

.filters-input {
  width: 100%;
  padding: 0.6rem 0.5rem;
  border: none;
  border-radius: 9999px;
  background: transparent;
  color: var(--color-ink);
  font-size: 0.9375rem;
}

.filters-input::placeholder { color: var(--color-muted); }
.filters-input:focus { outline: none; }
.filters-input:focus-visible { outline: none; }

.combobox-chevron {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-right: 0.85rem;
  color: var(--color-muted);
  pointer-events: none;
  transition: transform 160ms var(--ease-out, ease);
}

.combobox-control:focus-within .combobox-chevron { transform: rotate(180deg); }

.combobox-clear {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin-right: 0.5rem;
  border: none;
  border-radius: 9999px;
  background: none;
  color: var(--color-muted);
  font-size: 1.1rem;
  line-height: 1;
  cursor: pointer;
}

.combobox-clear:hover { background: var(--color-paper); color: var(--color-accent); }

.combobox-listbox {
  position: absolute;
  top: calc(100% + 0.4rem);
  left: 0;
  right: 0;
  z-index: var(--z-dropdown, 100);
  max-height: 15rem;
  overflow-y: auto;
  margin: 0;
  padding: 0.4rem;
  list-style: none;
  border-radius: 12px;
  border: 1px solid var(--color-rule);
  background: var(--color-paper-2);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.45);
}

.combobox-option {
  padding: 0.55rem 0.75rem;
  border-radius: 8px;
  font-size: 0.875rem;
  color: var(--color-ink-2);
  cursor: pointer;
  transition: background 100ms var(--ease-out, ease);
}

.combobox-option.is-active { background: var(--color-paper-3); color: var(--color-ink); }
.combobox-option.is-selected { color: var(--color-accent); font-weight: 600; }

.combobox-empty {
  padding: 0.55rem 0.75rem;
  font-size: 0.8125rem;
  color: var(--color-muted);
}
</style>
