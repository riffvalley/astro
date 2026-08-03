<script setup lang="ts">
import { reactive, ref } from 'vue';
import { submitNationalReleases, type DiscType, type NationalReleaseProposal } from '../../lib/nationalReleases';

interface FormRow {
  id: number;
  discName: string;
  discType: DiscType;
  genre: string;
  releaseDay: string;
  publishAt: string;
  link: string;
}

let rowCounter = 0;
function createRow(): FormRow {
  rowCounter += 1;
  return { id: rowCounter, discName: '', discType: 'single', genre: '', releaseDay: '', publishAt: '', link: '' };
}

const formEl = ref<HTMLFormElement | null>(null);
const artistName = ref('');
const rows = reactive<FormRow[]>([createRow()]);
const submitting = ref(false);
const statusText = ref('');
const statusVariant = ref<'ok' | 'error' | ''>('');

function addRow() {
  rows.push(createRow());
}

function removeRow(id: number) {
  if (rows.length <= 1) return;
  const idx = rows.findIndex((r) => r.id === id);
  if (idx !== -1) rows.splice(idx, 1);
}

async function handleSubmit() {
  if (submitting.value) return;
  if (!formEl.value?.reportValidity()) return;

  submitting.value = true;
  statusVariant.value = '';
  statusText.value = 'Enviando…';

  const payload: NationalReleaseProposal[] = rows.map((row) => {
    const item: NationalReleaseProposal = {
      artistName: artistName.value.trim(),
      discName: row.discName.trim(),
      discType: row.discType,
      genre: row.genre.trim(),
      releaseDay: row.releaseDay,
    };
    if (row.publishAt) item.publishAt = row.publishAt;
    if (row.link.trim()) item.link = row.link.trim();
    return item;
  });

  try {
    await submitNationalReleases(payload);
    artistName.value = '';
    rows.splice(0, rows.length, createRow());
    statusVariant.value = 'ok';
    statusText.value =
      payload.length > 1
        ? `Enviadas ${payload.length} propuestas — quedan pendientes de revisión por un administrador antes de publicarse.`
        : 'Enviado — queda pendiente de revisión por un administrador antes de publicarse.';
  } catch (err) {
    statusVariant.value = 'error';
    statusText.value =
      err instanceof Error && err.message === 'THROTTLED'
        ? 'Demasiados envíos seguidos — espera un minuto antes de volver a intentarlo.'
        : `No se ha podido enviar: ${err instanceof Error && err.message ? err.message : 'inténtalo de nuevo más tarde.'}`;
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <form ref="formEl" class="national-form" @submit.prevent="handleSubmit">
    <div class="filters-field national-form-artist">
      <label for="nf-artist" class="filters-label">Artista</label>
      <input id="nf-artist" v-model="artistName" type="text" required maxlength="100" class="plain-input" />
    </div>

    <div class="national-rows">
      <div v-for="row in rows" :key="row.id" class="national-row">
        <button
          type="button"
          class="national-row-remove"
          :hidden="rows.length <= 1"
          aria-label="Quitar este lanzamiento"
          @click="removeRow(row.id)"
        >×</button>

        <div class="national-row-fields">
          <div class="filters-field">
            <label :for="`nf-disc-${row.id}`" class="filters-label">Disco / canción</label>
            <input :id="`nf-disc-${row.id}`" v-model="row.discName" type="text" required maxlength="100" class="plain-input" />
          </div>
          <div class="filters-field">
            <label :for="`nf-type-${row.id}`" class="filters-label">Tipo</label>
            <select :id="`nf-type-${row.id}`" v-model="row.discType" required class="plain-input">
              <option value="single">Single</option>
              <option value="ep">EP</option>
              <option value="album">Álbum</option>
            </select>
          </div>
          <div class="filters-field">
            <label :for="`nf-genre-${row.id}`" class="filters-label">Género</label>
            <input :id="`nf-genre-${row.id}`" v-model="row.genre" type="text" required maxlength="100" class="plain-input" />
          </div>
          <div class="filters-field">
            <label :for="`nf-date-${row.id}`" class="filters-label">Fecha de lanzamiento</label>
            <input :id="`nf-date-${row.id}`" v-model="row.releaseDay" type="date" required class="plain-input" />
          </div>
          <div class="filters-field">
            <label :for="`nf-publish-${row.id}`" class="filters-label">Publicar desde (opcional)</label>
            <input :id="`nf-publish-${row.id}`" v-model="row.publishAt" type="date" class="plain-input" />
          </div>
          <div class="filters-field national-row-link">
            <label :for="`nf-link-${row.id}`" class="filters-label">Enlace (opcional)</label>
            <input
              :id="`nf-link-${row.id}`"
              v-model="row.link"
              type="url"
              placeholder="https://open.spotify.com/…"
              class="plain-input"
            />
          </div>
        </div>
      </div>
    </div>

    <button type="button" class="national-add-row" @click="addRow">+ Añadir otro lanzamiento</button>

    <button type="submit" class="filters-submit national-form-submit" :disabled="submitting">Enviar propuesta(s)</button>
  </form>

  <p v-if="statusText" class="national-form-status" :class="statusVariant ? `national-form-status--${statusVariant}` : ''" role="status">
    {{ statusText }}
  </p>
</template>

<style scoped>
.national-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.national-form-artist {
  max-width: 26rem;
}

.national-rows {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.national-row {
  position: relative;
  padding: 1rem 1rem 1.1rem;
  border: 1px solid var(--color-rule);
  border-radius: 12px;
  background: var(--color-paper-2);
}

.national-row-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  align-items: end;
}

.national-row-link { grid-column: 1 / -1; }

@media (max-width: 30rem) {
  .national-row-fields { grid-template-columns: 1fr; }
  .national-row { padding-right: 2.75rem; }
}

.national-row-remove {
  position: absolute;
  top: 0.6rem;
  right: 0.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 9999px;
  border: 1px solid var(--color-rule);
  background: var(--color-paper);
  color: var(--color-muted);
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
  transition: border-color 120ms var(--ease-out, ease), color 120ms var(--ease-out, ease);
}

.national-row-remove:hover { border-color: var(--color-accent); color: var(--color-accent); }
.national-row-remove[hidden] { display: none; }

.national-add-row {
  align-self: flex-start;
  padding: 0.55rem 1.1rem;
  border-radius: 9999px;
  border: 1px dashed var(--color-rule);
  background: transparent;
  color: var(--color-ink-2);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 120ms var(--ease-out, ease), color 120ms var(--ease-out, ease);
}

.national-add-row:hover { border-color: var(--color-accent); color: var(--color-accent); }

.filters-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.filters-label {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-muted);
}

.plain-input {
  width: 100%;
  padding: 0.6rem 0.8rem;
  border-radius: 8px;
  border: 1px solid var(--color-rule);
  background: var(--color-paper-2);
  color: var(--color-ink);
  font-size: 0.9375rem;
}

.plain-input:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 1px; }

.national-form-submit {
  align-self: flex-start;
  padding: 0.7rem 1.6rem;
  border-radius: 9999px;
  border: 1px solid var(--color-accent);
  background: var(--color-accent);
  color: var(--color-accent-ink, #161616);
  font-size: 0.9375rem;
  font-weight: 700;
  cursor: pointer;
  transition: filter 120ms var(--ease-out, ease);
}

.national-form-submit:hover { filter: brightness(1.06); }
.national-form-submit:disabled { opacity: 0.6; cursor: not-allowed; }

.national-form-status {
  margin-top: 1rem;
  font-size: 0.875rem;
  color: var(--color-ink-2);
}

.national-form-status--ok { color: var(--color-accent); }
.national-form-status--error { color: #ff8a8a; }
</style>
