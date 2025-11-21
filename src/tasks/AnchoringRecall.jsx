import { useEffect, useMemo, useRef, useState } from "react";
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
/********************* Anchoring & Experience Recall ************************/

// Helper to safely convert to number or NaN
const safeNumber = (x) => {
  const v = Number(x);
  return Number.isFinite(v) ? v : NaN;
};

const ANCHOR_TRUE = {
  best: 37,
  worst: -37,
  avg: 11,
};

export function AnchoringTask({ onFinish }) {
  const [phase, setPhase] = useState("intro");
  const [round1, setRound1] = useState({
    best: "",
    worst: "",
    avg: "",
  });
  const [round2, setRound2] = useState({
    best: "",
    worst: "",
    avg: "",
  });

  function restart() {
    setPhase("intro");
    setRound1({ best: "", worst: "", avg: "" });
    setRound2({ best: "", worst: "", avg: "" });
  }

  function finishRound2() {
    const m = computeAnchoringMetrics(round1, round2, ANCHOR_TRUE);
    setPhase("done");
    onFinish && onFinish(m);
  }

  const metrics = useMemo(
    () => computeAnchoringMetrics(round1, round2, ANCHOR_TRUE),
    [round1, round2]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Anchoring & Experience Recall</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {phase === "intro" && (
          <>
            <p>
              First, report the best/worst/average stock market years
              you remember. Then we show approximate history and ask
              again. We measure how strongly memories anchor your
              expectations.
            </p>
            <Button onClick={() => setPhase("round1")}>
              Start Round 1
            </Button>
          </>
        )}

        {phase === "round1" && (
          <>
            <p className="opacity-80">
              Based on your own memory (no need to be precise):
            </p>
            <AnchoringRoundInputs
              title="Round 1 – Memory"
              state={round1}
              setState={setRound1}
            />
            <div style={{ display: "flex", gap: "8px" }}>
              <Button onClick={() => setPhase("info")}>
                Next
              </Button>
              <Button variant="secondary" onClick={restart}>
                Restart
              </Button>
            </div>
          </>
        )}

        {phase === "info" && (
          <>
            <p className="opacity-80">
              Approximate S&amp;P 500 annual total returns (last ~50
              years):
            </p>
            <ul className="list-disc pl-4">
              <li>Best year: about +37%</li>
              <li>Worst year: about -37%</li>
              <li>Most years fall between -10% and +20%</li>
              <li>Long-term average: about 11% per year</li>
            </ul>
            <div style={{ marginTop: "8px" }}>
              <img
                src="/sp500_hist.png"
                alt="Historical S&P 500 returns"
                style={{
                  maxWidth: "100%",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                }}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                gap: "8px",
                marginTop: "12px",
              }}
            >
              <Button onClick={() => setPhase("round2")}>
                Continue to Round 2
              </Button>
              <Button variant="secondary" onClick={restart}>
                Restart
              </Button>
            </div>
          </>
        )}

        {phase === "round2" && (
          <>
            <p className="opacity-80">
              Now, after seeing the historical range, how would you set
              these planning anchors?
            </p>
            <AnchoringRoundInputs
              title="Round 2 – Planning Anchor"
              state={round2}
              setState={setRound2}
            />
            <div style={{ display: "flex", gap: "8px" }}>
              <Button onClick={finishRound2}>Finish</Button>
              <Button variant="secondary" onClick={restart}>
                Restart
              </Button>
            </div>
          </>
        )}

        {phase === "done" && (
          <>
            <p>Finished! Metrics sent to Dashboard.</p>
            <AnchoringSummary
              round1={round1}
              round2={round2}
              metrics={metrics}
            />
            <div style={{ marginTop: "8px" }}>
              <Button variant="secondary" onClick={restart}>
                Restart
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function AnchoringRoundInputs({ title, state, setState }) {
  function change(field, value) {
    setState((prev) => ({ ...prev, [field]: value }));
  }
  return (
    <div
      style={{
        padding: "10px",
        borderRadius: "8px",
        background: "#f9fafb",
        marginTop: "6px",
      }}
    >
      <div className="font-semibold mb-2">{title}</div>
      <div className="space-y-2">
        <AnchoringInputRow
          label="Best year return you remember (%)"
          value={state.best}
          onChange={(v) => change("best", v)}
        />
        <AnchoringInputRow
          label="Worst year return you remember (%)"
          value={state.worst}
          onChange={(v) => change("worst", v)}
        />
        <AnchoringInputRow
          label="Average annual return you believe (%)"
          value={state.avg}
          onChange={(v) => change("avg", v)}
        />
      </div>
    </div>
  );
}

export function AnchoringInputRow({ label, value, onChange }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "8px",
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <span style={{ minWidth: "200px" }}>{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "80px",
          padding: "4px 6px",
          borderRadius: "6px",
          border: "1px solid #ccc",
        }}
      />
      <span>%</span>
    </div>
  );
}

export function computeAnchoringMetrics(round1, round2, truth) {
  const r1 = {
    best: safeNumber(round1.best),
    worst: safeNumber(round1.worst),
    avg: safeNumber(round1.avg),
  };
  const r2 = {
    best: safeNumber(round2.best),
    worst: safeNumber(round2.worst),
    avg: safeNumber(round2.avg),
  };
  const t = truth || ANCHOR_TRUE;

  const bias = (v, tv) => (Number.isFinite(v) ? v - tv : NaN);

  const bias1 = {
    best: bias(r1.best, t.best),
    worst: bias(r1.worst, t.worst),
    avg: bias(r1.avg, t.avg),
  };
  const bias2 = {
    best: bias(r2.best, t.best),
    worst: bias(r2.worst, t.worst),
    avg: bias(r2.avg, t.avg),
  };
  const adjustment = {
    best:
      Number.isFinite(r1.best) && Number.isFinite(r2.best)
        ? r2.best - r1.best
        : NaN,
    worst:
      Number.isFinite(r1.worst) && Number.isFinite(r2.worst)
        ? r2.worst - r1.worst
        : NaN,
    avg:
      Number.isFinite(r1.avg) && Number.isFinite(r2.avg)
        ? r2.avg - r1.avg
        : NaN,
  };

  function rigidityComponent(r1v, r2v, tv) {
    if (!Number.isFinite(r1v) || !Number.isFinite(r2v)) return NaN;
    const d1 = Math.abs(r1v - tv);
    const d2 = Math.abs(r2v - tv);
    if (d1 === 0) return NaN;
    return 1 - d2 / d1;
  }

  const rigBest = rigidityComponent(r1.best, r2.best, t.best);
  const rigWorst = rigidityComponent(r1.worst, r2.worst, t.worst);
  const rigAvg = rigidityComponent(r1.avg, r2.avg, t.avg);
  const rigidity = mean(
    [rigBest, rigWorst, rigAvg].filter(Number.isFinite)
  );

  return {
    round1: r1,
    round2: r2,
    truth: t,
    biasRound1: bias1,
    biasRound2: bias2,
    adjustment,
    rigidity,
  };
}

export function AnchoringSummary({ round1, round2, metrics }) {
  if (!metrics) return null;
  const { truth, adjustment, rigidity } = metrics;
  const rows = [
    { key: "best", label: "Best year" },
    { key: "worst", label: "Worst year" },
    { key: "avg", label: "Average" },
  ];
  return (
    <div className="space-y-3 text-sm mt-3">
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "12px",
        }}
      >
        <thead>
          <tr>
            <th style={{ textAlign: "left" }}>Metric</th>
            <th>Round 1</th>
            <th>Round 2</th>
            <th>True</th>
            <th>Adjustment</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key}>
              <td>{r.label}</td>
              <td>
                {round1[r.key] !== "" ? `${round1[r.key]}%` : "-"}
              </td>
              <td>
                {round2[r.key] !== "" ? `${round2[r.key]}%` : "-"}
              </td>
              <td>{truth[r.key]}%</td>
              <td>
                {Number.isFinite(adjustment[r.key])
                  ? `${adjustment[r.key].toFixed(1)} pp`
                  : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div>
        Average movement toward historical truth (rigidity index):{" "}
        <strong>
          {Number.isFinite(rigidity)
            ? (rigidity * 100).toFixed(1) + " pp"
            : "-"}
        </strong>
      </div>
    </div>
  );
}
