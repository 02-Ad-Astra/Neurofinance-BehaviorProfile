import { useMemo, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
} from "../components/ui";
import { shuffle } from "../utils/stats";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

/********************* Framing ************************/
const framingItemsBase = [
  {
    id: 1,
    p: 0.5,
    sureGain: 50,
    gambleGain: 100,
    sureLoss: -50,
    gambleLoss: -100,
  },
  {
    id: 2,
    p: 0.25,
    sureGain: 25,
    gambleGain: 100,
    sureLoss: -25,
    gambleLoss: -100,
  },
  {
    id: 3,
    p: 0.75,
    sureGain: 75,
    gambleGain: 100,
    sureLoss: -75,
    gambleLoss: -100,
  },
  {
    id: 4,
    p: 0.6,
    sureGain: 60,
    gambleGain: 100,
    sureLoss: -60,
    gambleLoss: -100,
  },
  {
    id: 5,
    p: 0.4,
    sureGain: 40,
    gambleGain: 100,
    sureLoss: -40,
    gambleLoss: -100,
  },
  {
    id: 6,
    p: 0.9,
    sureGain: 90,
    gambleGain: 100,
    sureLoss: -90,
    gambleLoss: -100,
  },
];

export function Framing({ modeDemo, onFinish }) {
  const [phase, setPhase] = useState("intro");
  const [queue, setQueue] = useState([]);
  const [idx, setIdx] = useState(0);
  const [log, setLog] = useState([]);

  function start() {
    const gains = framingItemsBase.map((x) => ({
      ...x,
      frame: "gain",
    }));
    const losses = framingItemsBase.map((x) => ({
      ...x,
      frame: "loss",
    }));
    const set1 = shuffle([...gains, ...losses]);
    const set2 = shuffle([...gains, ...losses]);
    const seq = shuffle([...set1, ...set2]);
    // demo 模式用少一点题
    const finalSeq = modeDemo ? seq.slice(0, 8) : seq;
    setQueue(finalSeq);
    setIdx(0);
    setLog([]);
    setPhase("run");
  }

  function choose(choice) {
    const item = queue[idx];
    const newLog = [...log, { id: item.id, frame: item.frame, choice }];
    setLog(newLog);
    const next = idx + 1;
    if (next >= queue.length) {
      setPhase("done");
      onFinish && onFinish(computeFraming(newLog));
    } else {
      setIdx(next);
    }
  }

  const item = queue[idx];
  const metrics = useMemo(() => computeFraming(log), [log]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Framing Stability – Consistency</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {phase === "intro" && (
          <div className="space-y-3">
            <p>
              Choose between a sure option and a probabilistic option.
              Gains vs losses with equal expected value; items repeat later.
            </p>
            <Button onClick={start}>Start</Button>
          </div>
        )}

        {phase === "run" && item && (
          <div className="space-y-4">
            <div className="text-sm opacity-80">
              Item {idx + 1} / {queue.length}
            </div>
            {item.frame === "gain" ? (
              <div className="space-y-3">
                <div>
                  You can <strong>gain</strong>:
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button
                    className="h-20 text-base"
                    onClick={() => choose("sure")}
                  >
                    Sure: +{item.sureGain}
                  </Button>
                  <Button
                    className="h-20 text-base"
                    variant="secondary"
                    onClick={() => choose("gamble")}
                  >
                    Gamble: {Math.round(item.p * 100)}% chance to +
                    {item.gambleGain}, else 0
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  You may <strong>lose</strong>:
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button
                    className="h-20 text-base"
                    onClick={() => choose("sure")}
                  >
                    Sure: {item.sureLoss}
                  </Button>
                  <Button
                    className="h-20 text-base"
                    variant="secondary"
                    onClick={() => choose("gamble")}
                  >
                    Gamble: {Math.round(item.p * 100)}% chance to{" "}
                    {item.gambleLoss}, else 0
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {phase === "done" && (
          <div className="space-y-3">
            <p>Finished! Metrics sent to Dashboard.</p>
            <FramingSummary metrics={metrics} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function computeFraming(log) {
  if (!log.length) return null;
  const byKey = (l) =>
    l.reduce((m, r) => {
      const k = `${r.frame}-${r.id}`;
      (m[k] = m[k] || []).push(r);
      return m;
    }, {});
  const grouped = byKey(log);
  let agree = 0;
  let totalPairs = 0;

  Object.values(grouped).forEach((arr) => {
    if (arr.length >= 2) {
      totalPairs++;
      if (arr[0].choice === arr[1].choice) agree++;
    }
  });

  const consistency = totalPairs ? agree / totalPairs : NaN;
  const gainRisks = log.filter(
    (r) => r.frame === "gain" && r.choice === "gamble"
  ).length;
  const lossRisks = log.filter(
    (r) => r.frame === "loss" && r.choice === "gamble"
  ).length;
  const gainTotal = log.filter((r) => r.frame === "gain").length || 1;
  const lossTotal = log.filter((r) => r.frame === "loss").length || 1;
  const propRiskGain = gainRisks / gainTotal;
  const propRiskLoss = lossRisks / lossTotal;
  const amplitude = propRiskLoss - propRiskGain;

  return { consistency, propRiskGain, propRiskLoss, amplitude };
}

export function FramingSummary({ metrics }) {
  if (!metrics) return null;
  const data = [
    {
      name: "Risky choice % (Gain)",
      value: Math.round((metrics.propRiskGain || 0) * 100),
    },
    {
      name: "Risky choice % (Loss)",
      value: Math.round((metrics.propRiskLoss || 0) * 100),
    },
  ];
  return (
    <div className="space-y-4">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" name="%" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="text-sm">
        Framing amplitude (Loss − Gain risky %):{" "}
        <span className="font-semibold">
          {Number.isFinite(metrics.amplitude)
            ? (metrics.amplitude * 100).toFixed(1) + "%"
            : "-"}
        </span>
        <br />
        Retest consistency:{" "}
        <span className="font-semibold">
          {Number.isFinite(metrics.consistency)
            ? (metrics.consistency * 100).toFixed(1) + "%"
            : "-"}
        </span>
      </div>
    </div>
  );
}
