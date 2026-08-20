import { onScopeDispose, ref } from 'vue';

import { fetchAgendaMonth } from '../api/agendaClient';
import { createAgendaMonthRequestCoordinator } from '../api/agendaMonthRequestCoordinator';
import type { CalendarEvent } from '../model/agenda.types';
import type { AgendaMonthRequest } from '../model/agendaApi.types';

export function useAgendaMonthEvents(initialEvents: CalendarEvent[]) {
  const events = ref<CalendarEvent[]>(initialEvents);
  const loading = ref(false);
  const requests = createAgendaMonthRequestCoordinator();

  async function loadMonth(month: AgendaMonthRequest): Promise<void> {
    const request = requests.start();
    loading.value = true;

    try {
      const nextEvents = await fetchAgendaMonth(month, { signal: request.signal });
      if (!request.isCurrent()) return;
      events.value = nextEvents;
    } catch {
      if (!request.isCurrent()) return;
      events.value = [];
    } finally {
      if (request.settle()) loading.value = false;
    }
  }

  onScopeDispose(() => requests.cancel());

  return { events, loading, loadMonth };
}
