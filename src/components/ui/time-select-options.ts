export type TimeSelectOption = {
  value: string;
  disabled: boolean;
};

export type TimeSelectOptionsConfig = {
  start?: string;
  end?: string;
  step?: string;
  minTime?: string;
  maxTime?: string;
};

const MAX_TIME_OPTIONS = 1_440;

function parseClockMinutes(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const match = /^(\d{1,2}):([0-5]\d)$/.exec(value.trim());
  if (!match) return undefined;
  const hour = Number(match[1]);
  if (hour > 23) return undefined;
  return hour * 60 + Number(match[2]);
}

function parseStepMinutes(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const match = /^(\d{1,2}):([0-5]\d)$/.exec(value.trim());
  if (!match) return undefined;
  const minutes = Number(match[1]) * 60 + Number(match[2]);
  return minutes > 0 && minutes < 24 * 60 ? minutes : undefined;
}

function formatClockMinutes(minutes: number): string {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function generateTimeSelectOptions({
  start = "09:00",
  end = "18:00",
  step = "00:30",
  minTime,
  maxTime,
}: TimeSelectOptionsConfig = {}): TimeSelectOption[] {
  const startMinutes = parseClockMinutes(start);
  const endMinutes = parseClockMinutes(end);
  const stepMinutes = parseStepMinutes(step);
  const minimum = parseClockMinutes(minTime);
  const maximum = parseClockMinutes(maxTime);

  if (
    startMinutes === undefined ||
    endMinutes === undefined ||
    stepMinutes === undefined ||
    endMinutes < startMinutes
  ) {
    return [];
  }

  const options: TimeSelectOption[] = [];
  for (
    let current = startMinutes;
    current <= endMinutes && options.length < MAX_TIME_OPTIONS;
    current += stepMinutes
  ) {
    options.push({
      value: formatClockMinutes(current),
      disabled:
        (minimum !== undefined && current <= minimum) ||
        (maximum !== undefined && current >= maximum),
    });
  }

  return options;
}
