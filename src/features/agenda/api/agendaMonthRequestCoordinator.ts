export function createAgendaMonthRequestCoordinator() {
  let activeRequest: { controller: AbortController } | null = null;

  return {
    start() {
      activeRequest?.controller.abort();

      const request = { controller: new AbortController() };
      activeRequest = request;

      return {
        signal: request.controller.signal,
        isCurrent: () => activeRequest === request,
        settle: () => {
          if (activeRequest !== request) return false;
          activeRequest = null;
          return true;
        },
      };
    },
    cancel() {
      const request = activeRequest;
      activeRequest = null;
      request?.controller.abort();
    },
  };
}
