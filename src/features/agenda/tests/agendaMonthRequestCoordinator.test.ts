import { describe, expect, it } from 'vitest';

import type { CalendarEvent } from '../model/agenda.types';
import { createAgendaMonthRequestCoordinator } from '../api/agendaMonthRequestCoordinator';

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

describe('createAgendaMonthRequestCoordinator', () => {
  it('keeps a single request current until that request settles', () => {
    const coordinator = createAgendaMonthRequestCoordinator();
    const request = coordinator.start();

    expect(request.signal.aborted).toBe(false);
    expect(request.isCurrent()).toBe(true);
    expect(request.settle()).toBe(true);
    expect(request.isCurrent()).toBe(false);
  });

  it('accepts only the newest result when monthly requests resolve out of order', async () => {
    const coordinator = createAgendaMonthRequestCoordinator();
    const january = deferred<CalendarEvent[]>();
    const february = deferred<CalendarEvent[]>();
    const march = deferred<CalendarEvent[]>();
    let currentEvents: CalendarEvent[] = [];

    const run = async (
      request: ReturnType<ReturnType<typeof createAgendaMonthRequestCoordinator>['start']>,
      result: Promise<CalendarEvent[]>
    ) => {
      const events = await result;
      if (request.isCurrent()) currentEvents = events;
      request.settle();
    };

    const januaryRequest = coordinator.start();
    const januaryRun = run(januaryRequest, january.promise);
    const februaryRequest = coordinator.start();
    const februaryRun = run(februaryRequest, february.promise);
    const marchRequest = coordinator.start();
    const marchRun = run(marchRequest, march.promise);

    expect(januaryRequest.signal.aborted).toBe(true);
    expect(februaryRequest.signal.aborted).toBe(true);
    expect(marchRequest.signal.aborted).toBe(false);

    march.resolve([event('march')]);
    await marchRun;
    january.resolve([event('january')]);
    february.resolve([event('february')]);
    await Promise.all([januaryRun, februaryRun]);

    expect(currentEvents.map(({ id }) => id)).toEqual(['march']);
  });

  it('does not settle loading when an obsolete request rejects after cancellation', async () => {
    const coordinator = createAgendaMonthRequestCoordinator();
    const january = deferred<CalendarEvent[]>();
    const february = deferred<CalendarEvent[]>();
    let loading = true;
    let errors = 0;
    let currentEvents = [event('initial')];

    const finish = async (
      request: ReturnType<ReturnType<typeof createAgendaMonthRequestCoordinator>['start']>,
      result: Promise<CalendarEvent[]>
    ) => {
      try {
        const events = await result;
        if (request.isCurrent()) currentEvents = events;
      } catch {
        if (request.isCurrent()) {
          errors += 1;
          currentEvents = [];
        }
      } finally {
        if (request.settle()) loading = false;
      }
    };

    const januaryRequest = coordinator.start();
    const januaryRun = finish(januaryRequest, january.promise);
    const februaryRequest = coordinator.start();
    const februaryRun = finish(februaryRequest, february.promise);

    january.reject(new DOMException('The operation was aborted', 'AbortError'));
    await januaryRun;

    expect(januaryRequest.signal.aborted).toBe(true);
    expect(errors).toBe(0);
    expect(currentEvents.map(({ id }) => id)).toEqual(['initial']);
    expect(loading).toBe(true);

    february.resolve([event('february')]);
    await februaryRun;

    expect(currentEvents.map(({ id }) => id)).toEqual(['february']);
    expect(loading).toBe(false);
  });

  it('invalidates and aborts the active request when cancelled', () => {
    const coordinator = createAgendaMonthRequestCoordinator();
    const request = coordinator.start();

    coordinator.cancel();

    expect(request.signal.aborted).toBe(true);
    expect(request.isCurrent()).toBe(false);
    expect(request.settle()).toBe(false);
  });
});
