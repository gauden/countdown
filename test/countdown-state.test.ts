import { describe, expect, it } from "vitest";
import { decodeState, encodeState, type CountdownState } from "../lib/countdown-state";

describe("countdown state URL helpers", () => {
  it("encodes a complete state into URLSearchParams", () => {
    const state: CountdownState = {
      title: "Launch Day",
      date: "2026-07-01T09:00",
      unit: "days",
      note: "Release countdown",
      link: "https://example.com/release"
    };

    const params = encodeState(state);

    expect(params.get("v")).toBe("1");
    expect(params.get("title")).toBe("Launch Day");
    expect(params.get("date")).toBe("2026-07-01T09:00");
    expect(params.get("unit")).toBe("days");
    expect(params.get("note")).toBe("Release countdown");
    expect(params.get("link")).toBe("https://example.com/release");
  });

  it("decodes URLSearchParams into state with defaults", () => {
    const params = new URLSearchParams("title=Test&date=2026-12-31T23:59");

    expect(decodeState(params)).toEqual({
      title: "Test",
      date: "2026-12-31T23:59",
      unit: "weeks",
      note: "",
      link: ""
    });
  });

  it("maps legacy params to v1 fields when v is absent", () => {
    const params = new URLSearchParams(
      "d=2026-01-01T10:00&u=hours&t=Legacy%20Timer&n=Legacy%20note&l=https%3A%2F%2Flegacy.example"
    );

    expect(decodeState(params)).toEqual({
      title: "Legacy Timer",
      date: "2026-01-01T10:00",
      unit: "hours",
      note: "Legacy note",
      link: "https://legacy.example"
    });
  });

  it("uses only canonical v1 names when v=1 is present", () => {
    const params = new URLSearchParams(
      "v=1&date=2026-01-01T11:00&unit=days&title=V1&note=V1%20note&link=https%3A%2F%2Fv1.example&d=2027-01-01T11:00&u=years&t=Legacy"
    );

    expect(decodeState(params)).toEqual({
      title: "V1",
      date: "2026-01-01T11:00",
      unit: "days",
      note: "V1 note",
      link: "https://v1.example"
    });
  });

  it("round-trips state through encode and decode", () => {
    const start: CountdownState = {
      title: "Roadmap",
      date: "2026-09-01T08:30",
      unit: "hours",
      note: "Milestone date",
      link: "https://example.com/roadmap"
    };

    const encoded = encodeState(start);
    const decoded = decodeState(encoded);

    expect(decoded).toEqual(start);
  });
});
