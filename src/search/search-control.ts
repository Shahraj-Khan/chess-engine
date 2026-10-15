
export interface SearchControl {
  deadline?: number;
  shouldStop?: () => boolean;
}

export function isSearchStopped(
  control?: SearchControl
): boolean {
  if (!control) {
    return false;
  }

  if (control.shouldStop?.()) {
    return true;
  }

  return (
    control.deadline !== undefined &&
    Date.now() >= control.deadline
  );
}


export class SearchStoppedError extends Error {
  constructor() {
    super("Search stopped");
    this.name = "SearchStoppedError";
  }
}
