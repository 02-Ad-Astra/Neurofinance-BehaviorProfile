import { useEffect, useMemo, useRef, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Progress,
} from "../components/ui";
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
/********************* Delay Discounting ************************/
export function DelayDiscounting({ modeDemo, onFinish }) {
  const laterAmount = 100;
  const delayDays = 14;
  const trials = modeDemo ? 6 : 12;

  const [phase, setPhase] = useState("intro");
  const [i, setI] = useState(0);
  const [nowAmt, setNowAmt] = useState(50);
  const [hist, setHist] = useState([]); // {now, later, delay, pick}

  function start() {
    setPhase("run");
    setI(0);
    setNowAmt(50);
    setHist([]);
  }
  function choose(pick) {
    const rec = {
      now: nowAmt,
      later: laterAmount,
      delay: delayDays,
      pick,
    };
    const newHist = hist.concat([rec]);
    setHist(newHist);
    if (i + 1 >= trials) {
      const metrics = computeDelay(newHist);
      setPhase("done");
      onFinish && onFinish(metrics);
      return;
    }
    const step = Math.max(
      2,
      Math.round(
        Math.abs(
          nowAmt - laterAmount / (1 + 0.2 * delayDays)
        ) / 3
      )
    );
    const nextNow =
      pick === "later"
        ? Math.min(laterAmount - 1, nowAmt + step)
        : Math.max(1, nowAmt - step);
    setNowAmt(nextNow);
    setI((x) => x + 1);
  }

  const metrics = useMemo(() => computeDelay(hist), [hist]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Delay Discounting – Preference for Immediate Reward
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {phase === "intro" && (
          <div className="space-y-3">
            <p>
              Choose between receiving <strong>${laterAmount}</strong> in{" "}
              <strong>{delayDays} days</strong> or a smaller amount{" "}
              <strong>today</strong>. The today amount will adapt.
            </p>
            <Button onClick={start}>Start</Button>
          </div>
        )}
        {phase === "run" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                Question {i + 1}/{trials}
              </div>
              <Progress value={100 * (i / trials)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button
                className="h-20 text-base"
                onClick={() => choose("now")}
              >
                ${nowAmt}{" "}
                <span className="opacity-70">today</span>
              </Button>
              <Button
                className="h-20 text-base"
                variant="secondary"
                onClick={() => choose("later")}
              >
                ${laterAmount}{" "}
                <span className="opacity-70">
                  in {delayDays} days
                </span>
              </Button>
            </div>
            <LiveDelayStats hist={hist} />
          </div>
        )}
        {phase === "done" && (
          <div className="space-y-3">
            <p>Finished! Metrics sent to Dashboard.</p>
            <DelaySummary metrics={metrics} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
export function computeDelay(hist) {
  if (!hist.length) return null;
  const later = hist[0]?.later ?? 100;
  const delay = hist[0]?.delay ?? 14;
  const lastNow = hist[hist.length - 1].now;
  const A = later;
  const NowStar = lastNow;
  const k = Math.max(
    0,
    (A / Math.max(1, NowStar) - 1) / Math.max(1, delay)
  );
  const choiceNowPct =
    hist.filter((h) => h.pick === "now").length / hist.length;
  let switches = 0;
  for (let i = 1; i < hist.length; i++) {
    if (hist[i].pick !== hist[i - 1].pick) switches++;
  }
  const consistency =
    1 - switches / (hist.length - 1 || 1);
  return { k, choiceNowPct, consistency, NowStar, A, D: delay };
}
export function LiveDelayStats({ hist }) {
  const nowPct = hist.length
    ? Math.round(
        (100 *
          hist.filter((h) => h.pick === "now").length) /
          hist.length
      )
    : 0;
  return (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div className="p-3 rounded-2xl bg-muted">
        <div className="font-semibold">Now choices</div>
        <div className="tabular-nums">{nowPct}%</div>
      </div>
      <div className="p-3 rounded-2xl bg-muted">
        <div className="font-semibold">Questions answered</div>
        <div className="tabular-nums">
          {hist.length}
        </div>
      </div>
    </div>
  );
}
export function DelaySummary({ metrics }) {
  if (!metrics) return null;
  const data = [
    { name: "k (hyperbolic)", value: metrics.k || 0 },
    {
      name: "Now choice %",
      value: metrics.choiceNowPct || 0,
    },
  ];
  return (
    <div className="space-y-3">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="text-sm">
        Consistency:{" "}
        <strong>
          {Number.isFinite(metrics.consistency)
            ? (metrics.consistency * 100).toFixed(0) + "%"
            : "-"}
        </strong>
      </div>
    </div>
  );
}
