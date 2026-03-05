export const UNITS = [
  "seconds",
  "minutes",
  "hours",
  "days",
  "weeks",
  "months",
  "years"
] as const;

export type CountdownUnit = (typeof UNITS)[number];

export type CountdownState = {
  title: string;
  date: string;
  unit: CountdownUnit;
  note: string;
  link: string;
};

const DEFAULT_TITLE = "Countdown";
const DEFAULT_UNIT: CountdownUnit = "weeks";
const V1 = "1";

function isUnit(value: string | null): value is CountdownUnit {
  return value !== null && (UNITS as readonly string[]).includes(value);
}

function getMappedParam(
  searchParams: URLSearchParams,
  v1Name: string,
  legacyName: string,
  hasV1Version: boolean
): string {
  if (hasV1Version) {
    return searchParams.get(v1Name)?.trim() || "";
  }

  return searchParams.get(v1Name)?.trim() || searchParams.get(legacyName)?.trim() || "";
}

export function decodeState(searchParams: URLSearchParams): CountdownState {
  const hasV1Version = searchParams.get("v") === V1;
  const title = getMappedParam(searchParams, "title", "t", hasV1Version) || DEFAULT_TITLE;
  const date = getMappedParam(searchParams, "date", "d", hasV1Version);
  const unitParam = getMappedParam(searchParams, "unit", "u", hasV1Version);
  const unit = isUnit(unitParam) ? unitParam : DEFAULT_UNIT;
  const note = getMappedParam(searchParams, "note", "n", hasV1Version);
  const link = getMappedParam(searchParams, "link", "l", hasV1Version);

  return { title, date, unit, note, link };
}

export function encodeState(state: CountdownState): URLSearchParams {
  const params = new URLSearchParams();

  params.set("v", V1);
  if (state.title.trim()) {
    params.set("title", state.title.trim());
  }
  if (state.date.trim()) {
    params.set("date", state.date.trim());
  }
  params.set("unit", state.unit);
  if (state.note.trim()) {
    params.set("note", state.note.trim());
  }
  if (state.link.trim()) {
    params.set("link", state.link.trim());
  }

  return params;
}
