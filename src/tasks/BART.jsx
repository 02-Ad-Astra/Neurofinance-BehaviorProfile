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

/********************* BART – Balloon Analogue Risk Task ************************/
export function BART({ modeDemo, onFinish }) {
  const totalBalloons = modeDemo ? 6 : 25;
  const maxBurst = 15;
  const [phase, setPhase] = useState("intro");
  const [idx, setIdx] = useState(0);
  const [pumps, setPumps] = useState(0);
  const [burstPoint, setBurstPoint] = useState(randInt(1, maxBurst));
  const [balloons, setBalloons] = useState([]); // {pumps, burst, banked}

  function start() {
    setPhase("run");
    setIdx(0);
    setPumps(0);
    setBurstPoint(randInt(1, maxBurst));
    setBalloons([]);
  }
  function pump() {
    const next = pumps + 1;
    if (next >= burstPoint) {
      setBalloons((b) => [
        ...b,
        { pumps: next, burst: true, banked: 0 },
      ]);
      nextBalloon();
    } else {
      setPumps(next);
    }
  }
  function bank() {
    setBalloons((b) => [
      ...b,
      { pumps, burst: false, banked: pumps },
    ]);
    nextBalloon();
  }
  function nextBalloon() {
    const ni = idx + 1;
    if (ni >= totalBalloons) {
      setPhase("done");
      onFinish && onFinish(computeBART(balloons.concat([])));
      return;
    }
    setIdx(ni);
    setPumps(0);
    setBurstPoint(randInt(1, maxBurst));
  }

  const metrics = useMemo(() => computeBART(balloons), [balloons]);
  const size = 40 + pumps * 6;

  return (
    <Card>
      <CardHeader>
        <CardTitle>BART – Risk Taking for Reward</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {phase === "intro" && (
          <div className="space-y-3">
            <p>
              Click <strong>Pump</strong> to inflate and earn points;{" "}
              <strong>Bank</strong> to save. If it bursts, you lose this
              balloon&apos;s points.
            </p>
            <Button onClick={start}>Start</Button>
          </div>
        )}
        {phase === "run" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                Balloon {idx + 1}/{totalBalloons}
              </div>
              <div>
                Total Banked:{" "}
                  <strong>
                    {balloons.reduce((s, b) => s + b.banked, 0)}
                  </strong>
              </div>
            </div>
            <div className="h-52 flex items-center justify-center">
              <div
                style={{
                  width: size,
                  height: size,
                  borderRadius: "50%",
                  background: "#f87171",
                }}
                title="balloon"
              />
            </div>
            <div className="flex justify-center gap-2">
              <Button onClick={pump}>Pump</Button>
              <Button variant="secondary" onClick={bank}>
                Bank
              </Button>
            </div>
            <LiveBARTStats balloons={balloons} currentPumps={pumps} />
          </div>
        )}
        {phase === "done" && (
          <div className="space-y-3">
            <p>Finished! Metrics sent to Dashboard.</p>
            <BARTSummary metrics={metrics} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
function randInt(a, b) {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}
export function computeBART(balloons) {
  if (!balloons.length) return null;
  const nonBurst = balloons.filter((b) => !b.burst);
  const avgPumpsNonBurst = nonBurst.length
    ? mean(nonBurst.map((b) => b.pumps))
    : NaN;
  const burstRate =
    balloons.filter((b) => b.burst).length / balloons.length;
  const totalEarnings = balloons.reduce((s, b) => s + b.banked, 0);
  if (balloons.length < 4)
    return {
      avgPumpsNonBurst,
      burstRate,
      slope: NaN,
      totalEarnings,
    };
  const half = Math.floor(balloons.length / 2);
  const early = mean(balloons.slice(0, half).map((b) => b.pumps));
  const late = mean(balloons.slice(half).map((b) => b.pumps));
  const slope = late - early;
  return { avgPumpsNonBurst, burstRate, slope, totalEarnings };
}
export function LiveBARTStats({ balloons, currentPumps }) {
  const nb = balloons.filter((b) => !b.burst);
  return (
    <div className="grid grid-cols-3 gap-3 text-sm">
      <div className="p-3 rounded-2xl bg-muted">
        <div className="font-semibold">Current</div>
        <div>
          Pumps:{" "}
          <span className="tabular-nums">
            {currentPumps}
          </span>
        </div>
      </div>
      <div className="p-3 rounded-2xl bg-muted">
        <div className="font-semibold">Non-burst avg pumps</div>
        <div className="tabular-nums">
          {Number.isFinite(mean(nb.map((b) => b.pumps)))
            ? mean(nb.map((b) => b.pumps)).toFixed(1)
            : "-"}
        </div>
      </div>
      <div className="p-3 rounded-2xl bg-muted">
        <div className="font-semibold">Burst rate</div>
        <div className="tabular-nums">
          {balloons.length
            ? Math.round(
                (balloons.filter((b) => b.burst).length /
                  balloons.length) *
                  100
              )
            : 0}
          %
        </div>
      </div>
    </div>
  );
}
export function BARTSummary({ metrics }) {
  if (!metrics) return null;
  const data = [
    {
      name: "Avg pumps (non-burst)",
      value: metrics.avgPumpsNonBurst || 0,
    },
    { name: "Burst rate", value: metrics.burstRate || 0 },
    { name: "Learning slope", value: metrics.slope || 0 },
  ];
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" />
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-2 text-sm">
        Total earnings: <strong>{metrics.totalEarnings}</strong>
      </div>
    </div>
  );
}