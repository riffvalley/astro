import { effectScope } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../api/agendaClient', () => ({
  fetchAgendaMonth: vi.fn(),
}));

import { fetchAgendaMonth } from '../api/agendaClient';
import { useAgendaMonthEvents } from '../composables/useAgendaMonthEvents';
import type { CalendarEvent } from '../model/agenda.types';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function event(id: string): CalendarEvent {
  return {
    id,
    title: id,
    start: '2026-01-01',
    end: '2026-01-02',
    allDay: true,
    location: null,
    htmlLink: `https://example.com/${id}`,
    calendarName: 'Cantabria',
    calendarColor: '#DDCC77',
  };
}

function setup(initialEvents: CalendarEvent[] = []) {
  const scope = effectScope();
  const result = scope.run(() => useAgendaMonthEvents(initialEvents));
  if (!result) throw new Error('Agenda month events scope was not created');
  return { scope, ...result };
}

afterEach(() => {
  vi.resetAllMocks();
});

describe('useAgendaMonthEvents', () => {
  it('loads a month while exposing the existing events and loading state', async () => {
    const pending = deferred<CalendarEvent[]>();
    vi.mocked(fetchAgendaMonth).mockReturnValueOnce(pending.promise);
    const state = setup([event('initial')]);

    const load = state.loadMonth({ year: 2026, month: 8 });

    expect(state.loading.value).toBe(true);
    expect(state.events.value.map(({ id }) => id)).toEqual(['initial']);
    expect(fetchAgendaMonth).toHaveBeenCalledWith(
      { year: 2026, month: 8 },
      { signal: expect.any(AbortSignal) }
    );

    pending.resolve([event('august')]);
    await load;

    expect(state.events.value.map(({ id }) => id)).toEqual(['august']);
    expect(state.loading.value).toBe(false);
    state.scope.stop();
  });

  it('preserves the current empty fallback for a real request failure', async () => {
    vi.mocked(fetchAgendaMonth).mockRejectedValueOnce(new Error('network failure'));
    const state = setup([event('initial')]);

    await state.loadMonth({ year: 2026, month: 8 });

    expect(state.events.value).toEqual([]);
    expect(state.loading.value).toBe(false);
    state.scope.stop();
  });

  it('keeps the latest result when monthly responses resolve out of order', async () => {
    const january = deferred<CalendarEvent[]>();
    const february = deferred<CalendarEvent[]>();
    vi.mocked(fetchAgendaMonth)
      .mockReturnValueOnce(january.promise)
      .mockReturnValueOnce(february.promise);
    const state = setup([event('initial')]);

    const januaryLoad = state.loadMonth({ year: 2026, month: 1 });
    const januarySignal = vi.mocked(fetchAgendaMonth).mock.calls[0][1]?.signal;
    const februaryLoad = state.loadMonth({ year: 2026, month: 2 });

    expect(januarySignal?.aborted).toBe(true);
    february.resolve([event('february')]);
    await februaryLoad;
    january.resolve([event('january')]);
    await januaryLoad;

    expect(state.events.value.map(({ id }) => id)).toEqual(['february']);
    expect(state.loading.value).toBe(false);
    state.scope.stop();
  });

  it('does not settle current loading when an obsolete request rejects', async () => {
    const january = deferred<CalendarEvent[]>();
    const february = deferred<CalendarEvent[]>();
    vi.mocked(fetchAgendaMonth)
      .mockReturnValueOnce(january.promise)
      .mockReturnValueOnce(february.promise);
    const state = setup([event('initial')]);

    const januaryLoad = state.loadMonth({ year: 2026, month: 1 });
    const februaryLoad = state.loadMonth({ year: 2026, month: 2 });
    january.reject(new DOMException('The operation was aborted', 'AbortError'));
    await januaryLoad;

    expect(state.events.value.map(({ id }) => id)).toEqual(['initial']);
    expect(state.loading.value).toBe(true);

    february.resolve([event('february')]);
    await februaryLoad;

    expect(state.events.value.map(({ id }) => id)).toEqual(['february']);
    expect(state.loading.value).toBe(false);
    state.scope.stop();
  });

  it('cancels the active request when its reactive scope is disposed', async () => {
    const pending = deferred<CalendarEvent[]>();
    vi.mocked(fetchAgendaMonth).mockReturnValueOnce(pending.promise);
    const state = setup();

    const load = state.loadMonth({ year: 2026, month: 8 });
    const signal = vi.mocked(fetchAgendaMonth).mock.calls[0][1]?.signal;

    state.scope.stop();

    expect(signal?.aborted).toBe(true);
    pending.reject(new DOMException('The operation was aborted', 'AbortError'));
    await load;
  });
});
