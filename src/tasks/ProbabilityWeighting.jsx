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

/********************* Probability Weighting ************************/
const probabilityItemsBase = [
  { id: 1, p: 0.01, sure: 0.5, reward: 100 },
  { id: 2, p: 0.05, sure: 3, reward: 100 },
  { id: 3, p: 0.1, sure: 7, reward: 100 },
  { id: 4, p: 0.2, sure: 16, reward: 100 },
  { id: 5, p: 0.5, sure: 45, reward: 100 },
  { id: 6, p: 0.8, sure: 70, reward: 100 },
  { id: 7, p: 0.95, sure: 85, reward: 100 },
];

export function ProbabilityWeightingTask({ onFinish }) {
  const items = probabilityItemsBase;
  const [idx, setIdx] = useState(0);
  const [log, setLog] = useState([]); // {id,p,choice}
  const [done, setDone] = useState(false);

  function restart() {
    setIdx(0);
    setLog([]);
    setDone(false);
  }

  function choose(choice) {
    const item = items[idx];
    const newLog = [...log, { id: item.id, p: item.p, choice }];
    setLog(newLog);
    const next = idx + 1;
    if (next >= items.length) {
      const metrics = computeProbabilityWeighting(newLog);
      setDone(true);
      onFinish && onFinish(metrics);
    } else {
      setIdx(next);
    }
  }

  const metrics = useMemo(
    () => computeProbabilityWeighting(log),
    [log]
  );
  const item = items[idx];

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Probability Weighting – Small vs Large Probabilities
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {!done && (
          <>
            <p className="opacity-80">
              Choose between a lottery and a sure amount. All lotteries
              pay <strong>$100</strong> if they win.
            </p>
            <div className="opacity-80">
              Item {idx + 1} / {items.length}
            </div>
            {item && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button
                    className="h-20 text-base"
                    onClick={() => choose("lottery")}
                  >
                    Lottery: {Math.round(item.p * 100)}% chance to win $
                    {item.reward}, else $0
                  </Button>
                  <Button
                    className="h-20 text-base"
                    variant="secondary"
                    onClick={() => choose("sure")}
                  >
                    Sure: ${item.sure}
                  </Button>
                </div>
              </div>
            )}
            <Button variant="secondary" onClick={restart}>
              Restart Task
            </Button>
          </>
        )}
        {done && (
          <>
            <p>Finished! Metrics sent to Dashboard.</p>
            <ProbabilitySummary metrics={metrics} />
            <Button variant="secondary" onClick={restart}>
              Restart Task
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function computeProbabilityWeighting(log) {
  if (!log.length) return null;
  const small = log.filter((r) => r.p <= 0.1);
  const medium = log.filter((r) => r.p > 0.1 && r.p < 0.8);
  const large = log.filter((r) => r.p >= 0.8);

  const lotteryRate = (list) => {
    const n = list.length || 1;
    const k = list.filter((r) => r.choice === "lottery").length;
    return k / n;
  };

  const smallRate = lotteryRate(small);
  const mediumRate = lotteryRate(medium);
  const largeRate = lotteryRate(large);

  const smallAmplification = smallRate - mediumRate;
  const largeUnderweight = mediumRate - largeRate;

  return {
    smallRate,
    mediumRate,
    largeRate,
    smallAmplification,
    largeUnderweight,
    n: log.length,
  };
}

export function ProbabilitySummary({ metrics }) {
  if (!metrics) return null;
  const data = [
    { name: "Small p (≤10%)", value: metrics.smallRate || 0 },
    {
      name: "Medium p (10–80%)",
      value: metrics.mediumRate || 0,
    },
    { name: "Large p (≥80%)", value: metrics.largeRate || 0 },
  ];
  return (
    <div className="space-y-4 text-sm">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip
              formatter={(v) =>
                `${Math.round((v || 0) * 100)}%`
              }
            />
            <Bar dataKey="value" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div>
        Small-probability amplification (lottery% small − medium):{" "}
        <strong>
          {Number.isFinite(metrics.smallAmplification)
            ? (metrics.smallAmplification * 100).toFixed(1) + "%"
            : "-"}
        </strong>
        <br />
        Large-probability underweight (lottery% medium − large):{" "}
        <strong>
          {Number.isFinite(metrics.largeUnderweight)
            ? (metrics.largeUnderweight * 100).toFixed(1) + "%"
            : "-"}
        </strong>
      </div>
    </div>
  );
}