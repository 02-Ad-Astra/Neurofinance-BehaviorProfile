import React, { useState, useMemo, useEffect, useRef } from "react";
import {   
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Switch,
  Label,
  Progress } from "../components/ui";
import { mean, std, shuffle } from "../utils/stats";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

/********************* Confidence Calibration ************************/
// Helper to safely convert to number or NaN
const safeNumber = (x) => {
  const v = Number(x);
  return Number.isFinite(v) ? v : NaN;
};

const calibrationItemsBase = [
  {
    id: 1,
    label: "S&P 500 total return in 2024 (%)",
    trueValue: 25,
    unit: "%",
    hint: "e.g. -20 to +40",
  },
  {
    id: 2,
    label: "US CPI inflation in 2024 (%)",
    trueValue: 3,
    unit: "%",
    hint: "e.g. 0 to 8",
  },
  {
    id: 3,
    label: "US 10Y Treasury yield at end of 2024 (%)",
    trueValue: 4,
    unit: "%",
    hint: "e.g. 1 to 8",
  },
  {
    id: 4,
    label: "S&P 500 total return in 2022 (%)",
    trueValue: -18,
    unit: "%",
    hint: "e.g. -40 to +20",
  },
];

export function CalibrationTask({ onFinish }) {
  const items = calibrationItemsBase;
  const [answers, setAnswers] = useState(() =>
    items.reduce(
      (acc, it) => ({
        ...acc,
        [it.id]: { lower: "", upper: "" },
      }),
      {}
    )
  );
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setAnswers(
      items.reduce(
        (acc, it) => ({
          ...acc,
          [it.id]: { lower: "", upper: "" },
        }),
        {}
      )
    );
    setSubmitted(false);
  }, [items]);

  function handleChange(id, field, value) {
    setAnswers((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  }

  function restart() {
    setAnswers(
      items.reduce(
        (acc, it) => ({
          ...acc,
          [it.id]: { lower: "", upper: "" },
        }),
        {}
      )
    );
    setSubmitted(false);
  }

  function handleSubmit() {
    const metrics = computeCalibration(items, answers);
    setSubmitted(true);
    onFinish && onFinish(metrics);
  }

  const metrics = useMemo(
    () => computeCalibration(items, answers),
    [items, answers]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Confidence Calibration – 90% Intervals</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p>
          For each question, give a{" "}
          <strong>90% confidence interval</strong>. Intervals can be
          wide; goal is that about 90% contain the true value.
        </p>
        <div className="space-y-3">
          {items.map((it) => (
            <div
              key={it.id}
              style={{
                padding: "10px",
                borderRadius: "8px",
                background: "#f9fafb",
              }}
            >
              <div className="mb-1 font-medium">{it.label}</div>
              <div className="mb-1 text-xs opacity-70">
                Hint: {it.hint}
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  alignItems: "center",
                }}
              >
                <span>Lower:</span>
                <input
                  type="number"
                  value={answers[it.id]?.lower ?? ""}
                  onChange={(e) =>
                    handleChange(it.id, "lower", e.target.value)
                  }
                  style={{
                    width: "80px",
                    padding: "4px 6px",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                  }}
                />
                <span>{it.unit}</span>
                <span style={{ marginLeft: "12px" }}>Upper:</span>
                <input
                  type="number"
                  value={answers[it.id]?.upper ?? ""}
                  onChange={(e) =>
                    handleChange(it.id, "upper", e.target.value)
                  }
                  style={{
                    width: "80px",
                    padding: "4px 6px",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                  }}
                />
                <span>{it.unit}</span>
                {submitted && (
                  <span
                    style={{
                      marginLeft: "12px",
                      fontSize: "12px",
                      opacity: 0.8,
                    }}
                  >
                    True: {it.trueValue}
                    {it.unit}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        {!submitted && (
          <div style={{ display: "flex", gap: "8px" }}>
            <Button onClick={handleSubmit}>Submit</Button>
            <Button variant="secondary" onClick={restart}>
              Restart Task
            </Button>
          </div>
        )}
        {submitted && (
          <>
            <CalibrationSummary metrics={metrics} />
            <div
              style={{
                display: "flex",
                gap: "8px",
                marginTop: "8px",
              }}
            >
              <Button variant="secondary" onClick={restart}>
                Restart Task
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function computeCalibration(items, answers) {
  if (!items.length) return null;
  const perItem = items.map((it) => {
    const ans = answers[it.id] || {};
    const lower = safeNumber(ans.lower);
    const upper = safeNumber(ans.upper);
    const tv = it.trueValue;
    const width =
      Number.isFinite(lower) && Number.isFinite(upper)
        ? Math.abs(upper - lower)
        : NaN;
    const hit =
      Number.isFinite(lower) &&
      Number.isFinite(upper) &&
      lower <= tv &&
      tv <= upper;
    return {
      id: it.id,
      label: it.label,
      lower,
      upper,
      trueValue: tv,
      width,
      hit,
    };
  });
  const valid = perItem.filter(
    (x) => Number.isFinite(x.lower) && Number.isFinite(x.upper)
  );
  const n = valid.length || 1;
  const hits = valid.filter((x) => x.hit).length;
  const hitRate = hits / n;
  const meanWidth = mean(valid.map((x) => x.width));
  const overconfidence = 0.9 - hitRate;
  return { perItem, hitRate, meanWidth, overconfidence };
}

export function CalibrationSummary({ metrics }) {
  if (!metrics) return null;
  const { hitRate, meanWidth, overconfidence } = metrics;
  return (
    <div className="space-y-2 text-sm mt-4">
      <div>
        Hit rate (true inside your 90% intervals):{" "}
        <strong>
          {Number.isFinite(hitRate)
            ? (hitRate * 100).toFixed(1) + "%"
            : "-"}
        </strong>
      </div>
      <div>
        Overconfidence index (90% − hit rate):{" "}
        <strong>
          {Number.isFinite(overconfidence)
            ? (overconfidence * 100).toFixed(1) + " pp"
            : "-"}
        </strong>
      </div>
      <div>
        Average interval width:{" "}
        <strong>
          {Number.isFinite(meanWidth)
            ? meanWidth.toFixed(1)
            : "-"}
        </strong>
      </div>
    </div>
  );
}