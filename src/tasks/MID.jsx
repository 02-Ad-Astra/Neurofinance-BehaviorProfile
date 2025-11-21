// src/tasks/MID.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Progress,
} from "../components/ui";
import { mean } from "../utils/stats";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

/********************* MID – Monetary Incentive Delay ************************/
export function MID({ modeDemo, onFinish }) {
  const totalTrials = modeDemo ? 16 : 60; // demo 更短
  const [phase, setPhase] = useState("intro");
  const [i, setI] = useState(0);
  const [trial, setTrial] = useState(null); // {cond, stage, startTime, deadline}
  const [log, setLog] = useState([]); // {cond, rt, hit}

  const trialRef = useRef(null);
  const timers = useRef([]);

  function clearTimers() {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  }

  useEffect(
    () => () => {
      clearTimers();
    },
    []
  );

  function scheduleNext() {
    if (i >= totalTrials) {
      setPhase("done");
      onFinish && onFinish(computeMID(log));
      return;
    }
    const cond = Math.random() < 0.5 ? "REWARD" : "NEUTRAL";
    const cueStart = performance.now();
    const cue = {
      cond,
      stage: "cue",
      startTime: cueStart,
      deadline: cueStart + 600,
    };
    trialRef.current = cue;
    setTrial(cue);

    timers.current.push(
      setTimeout(() => {
        const isi = 300 + Math.random() * 200;
        const t2 = setTimeout(() => {
          const targetStart = performance.now();
          const window = modeDemo ? 1400 : 1000;
          const target = {
            cond,
            stage: "target",
            startTime: targetStart,
            deadline: targetStart + window,
          };
          trialRef.current = target;
          setTrial(target);

          const missTimer = setTimeout(() => {
            if (trialRef.current === target) {
              setLog((l) => [...l, { cond, rt: null, hit: false }]);
              trialRef.current = null;
              setTrial(null);
              setI((x) => x + 1);
              scheduleNext();
            }
          }, window + 10);
          timers.current.push(missTimer);
        }, isi);
        timers.current.push(t2);
      }, 600)
    );
  }

  function commit(now = performance.now()) {
    const t = trialRef.current;
    if (!t || t.stage !== "target") return;
    if (now > t.deadline) return;
    const rt = now - t.startTime;
    setLog((l) => [...l, { cond: t.cond, rt, hit: true }]);
    clearTimers();
    trialRef.current = null;
    setTrial(null);
    setI((x) => x + 1);
    scheduleNext();
  }

  const metrics = useMemo(() => computeMID(log), [log]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>MID – Reward Reactivity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {phase === "intro" && (
          <div className="space-y-3">
            <p>
              You&apos;ll see a cue (<strong>REWARD</strong> or{" "}
              <strong>NEUTRAL</strong>). When the target appears,{" "}
              <strong>click</strong> as fast as you can.
            </p>
            <Button
              onClick={() => {
                setPhase("run");
                setI(0);
                setLog([]);
                scheduleNext();
              }}
            >
              Start
            </Button>
          </div>
        )}

        {phase === "run" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                Trial {i + 1}/{totalTrials}
              </div>
              <Progress value={100 * (i / totalTrials)} />
            </div>
            <div
              className="h-52 flex items-center justify-center select-none"
              onClick={() => commit()}
            >
              {!trial ? (
                <div className="opacity-40">+</div>
              ) : trial.stage === "cue" ? (
                <div
                  className={`text-4xl font-bold ${
                    trial.cond === "REWARD" ? "text-green-600" : ""
                  }`}
                >
                  {trial.cond}
                </div>
              ) : (
                <div
                  className="w-16 h-16 rounded-full bg-black/80"
                  title="Click now"
                />
              )}
            </div>
            <LiveMIDStats log={log} />
          </div>
        )}

        {phase === "done" && (
          <div className="space-y-3">
            <p>Finished! Metrics sent to Dashboard.</p>
            <MIDSummary metrics={metrics} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function computeMID(log) {
  const r = log.filter((x) => x.cond === "REWARD");
  const n = log.filter((x) => x.cond === "NEUTRAL");
  const rRT = mean(
    r.filter((x) => x.hit && Number.isFinite(x.rt)).map((x) => x.rt)
  );
  const nRT = mean(
    n.filter((x) => x.hit && Number.isFinite(x.rt)).map((x) => x.rt)
  );
  const deltaRT = rRT - nRT; // negative = faster under reward
  const rErr = 1 - r.filter((x) => x.hit).length / Math.max(1, r.length);
  const nErr = 1 - n.filter((x) => x.hit).length / Math.max(1, n.length);
  const deltaErr = rErr - nErr; // negative = fewer errors under reward
  const hitRateReward =
    r.filter((x) => x.hit).length / Math.max(1, r.length);
  return {
    rtReward: rRT,
    rtNeutral: nRT,
    deltaRT,
    errReward: rErr,
    errNeutral: nErr,
    deltaErr,
    hitRateReward,
  };
}

export function LiveMIDStats({ log }) {
  const r = log.filter((x) => x.cond === "REWARD");
  const n = log.filter((x) => x.cond === "NEUTRAL");
  return (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div className="p-3 rounded-2xl bg-muted">
        <div className="font-semibold">Hit rate</div>
        <div className="grid grid-cols-2 gap-x-4 mt-2">
          <div>Reward</div>
          <div className="text-right tabular-nums">
            {r.length
              ? Math.round(
                  (r.filter((x) => x.hit).length /
                    Math.max(1, r.length)) *
                    100
                )
              : 0}
            %
          </div>
          <div>Neutral</div>
          <div className="text-right tabular-nums">
            {n.length
              ? Math.round(
                  (n.filter((x) => x.hit).length /
                    Math.max(1, n.length)) *
                    100
                )
              : 0}
            %
          </div>
        </div>
      </div>
      <div className="p-3 rounded-2xl bg-muted">
        <div className="font-semibold">RT (ms, hits)</div>
        <div className="grid grid-cols-2 gap-x-4 mt-2">
          <div>Reward</div>
          <div className="text-right tabular-nums">
            {Number.isFinite(
              mean(r.filter((x) => x.hit).map((x) => x.rt))
            )
              ? Math.round(
                  mean(r.filter((x) => x.hit).map((x) => x.rt))
                )
              : "-"}
          </div>
          <div>Neutral</div>
          <div className="text-right tabular-nums">
            {Number.isFinite(
              mean(n.filter((x) => x.hit).map((x) => x.rt))
            )
              ? Math.round(
                  mean(n.filter((x) => x.hit).map((x) => x.rt))
                )
              : "-"}
          </div>
        </div>
      </div>
    </div>
  );
}

export function MIDSummary({ metrics }) {
  if (!metrics) return null;
  const data = [
    {
      name: "ΔRT (Reward-Neutral)",
      value: metrics.deltaRT || 0,
    },
    { name: "ΔErr (Reward-Neutral)", value: metrics.deltaErr || 0 },
  ];
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="name" hide />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
