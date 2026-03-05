"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { decodeState, encodeState, type CountdownState, type CountdownUnit, UNITS } from "../lib/countdown-state";

const UNIT_TO_MS: Record<CountdownUnit, number> = {
  seconds: 1000,
  minutes: 60_000,
  hours: 3_600_000,
  days: 86_400_000,
  weeks: 604_800_000,
  months: 2_629_800_000,
  years: 31_557_600_000
};

function formatCountdownValue(diffMs: number, unit: CountdownUnit): string {
  const value = Math.abs(diffMs) / UNIT_TO_MS[unit];
  if (value < 10) {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    });
  }
  return Math.floor(value).toLocaleString();
}

export default function HomePage() {
  const [state, setState] = useState<CountdownState>({
    title: "Countdown",
    date: "",
    unit: "weeks",
    note: "",
    link: ""
  });
  const [nowMs, setNowMs] = useState<number>(Date.now());
  const [copyMessage, setCopyMessage] = useState<string>("");

  const syncFromUrl = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    setState(decodeState(params));
  }, []);

  useEffect(() => {
    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, [syncFromUrl]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!copyMessage) {
      return;
    }
    const timeout = window.setTimeout(() => setCopyMessage(""), 1500);
    return () => window.clearTimeout(timeout);
  }, [copyMessage]);

  const targetMs = useMemo(() => {
    if (!state.date) {
      return null;
    }
    const parsed = new Date(state.date).getTime();
    return Number.isNaN(parsed) ? null : parsed;
  }, [state.date]);

  const diffMs = targetMs === null ? null : targetMs - nowMs;
  const isPast = diffMs !== null && diffMs < 0;
  const targetLabel = targetMs === null ? "" : new Date(targetMs).toLocaleString();

  const applyState = useCallback(
    (nextState: CountdownState) => {
      setState(nextState);
      const params = encodeState(nextState);
      const url = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState(null, "", url);
    },
    []
  );

  const onCopyLink = useCallback(async () => {
    const params = encodeState(state);
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    await navigator.clipboard.writeText(url);
    setCopyMessage("Link copied");
  }, [state]);

  return (
    <main>
      <h1>{state.title || "Countdown"}</h1>
      <p>URL-powered countdown. Edit values and copy a shareable link.</p>

      <section className="grid">
        <div className="card">
          {diffMs === null ? (
            <p>Set a date to start the countdown.</p>
          ) : (
            <>
              <p className="value">{formatCountdownValue(diffMs, state.unit)}</p>
              <p>{isPast ? `${state.unit} passed` : state.unit} remaining</p>
              <p>Target: {targetLabel}</p>
              {state.note ? <p>{state.note}</p> : null}
              {state.link ? (
                <p>
                  <a href={state.link} target="_blank" rel="noreferrer">
                    Learn more
                  </a>
                </p>
              ) : null}
            </>
          )}
        </div>

        <form
          className="card"
          onSubmit={(event) => {
            event.preventDefault();
            applyState(state);
          }}
        >
          <label htmlFor="title">Title</label>
          <input
            id="title"
            type="text"
            value={state.title}
            onChange={(event) => setState((prev) => ({ ...prev, title: event.target.value }))}
          />

          <label htmlFor="date">Target Date & Time</label>
          <input
            id="date"
            type="datetime-local"
            value={state.date}
            onChange={(event) => setState((prev) => ({ ...prev, date: event.target.value }))}
          />

          <label htmlFor="unit">Unit</label>
          <select
            id="unit"
            value={state.unit}
            onChange={(event) => setState((prev) => ({ ...prev, unit: event.target.value as CountdownUnit }))}
          >
            {UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>

          <label htmlFor="note">Note</label>
          <input
            id="note"
            type="text"
            value={state.note}
            onChange={(event) => setState((prev) => ({ ...prev, note: event.target.value }))}
          />

          <label htmlFor="link">Link</label>
          <input
            id="link"
            type="url"
            value={state.link}
            onChange={(event) => setState((prev) => ({ ...prev, link: event.target.value }))}
          />

          <button type="submit">Apply</button>
          <button type="button" onClick={onCopyLink}>
            Copy link
          </button>
          {copyMessage ? <p>{copyMessage}</p> : null}
        </form>
      </section>
    </main>
  );
}
