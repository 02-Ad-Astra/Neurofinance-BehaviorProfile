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
  Progress,
} from "../components/ui.jsx";

import { mean, std } from "../utils/stats";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";


/********************* Go/No-Go ************************/
export function GoNoGo({ modeDemo, onFinish }) {
  const NUM_BLOCKS = modeDemo ? 3 : 4;
  const practiceSec = modeDemo ? 5 : 15;
  const blockSec = modeDemo ? 10 : 60;

  const [phase, setPhase] = useState("intro");
  const [blockIdx, setBlockIdx] = useState(-1);
  const [timeLeft, setTimeLeft] = useState(0);
  const [stim, setStim] = useState(null);
  const [log, setLog] = useState([]);
  const timerRef = useRef(null);
  const stimRef = useRef(null);
  const runningRef = useRef(false);

  function handleClick() {
    if (!runningRef.current) return;
    const s = stimRef.current;
    if (!s) return;
    const now = performance.now();
    if (now > s.deadline) return;
    const rt = now - s.start;
    const isGo = s.color === "green";
    const type = isGo ? "hit" : "commission";
    setLog((l) => [
      ...l,
      {
        t: now,
        block: blockIdx,
        color: s.color,
        responded: true,
        rt,
        correct: isGo,
        type,
      },
    ]);
    stimRef.current = null;
    setStim(null);
  }

  function startPhase(which) {
    setLog([]);
    setBlockIdx(which === "practice" ? -1 : 0);
    const dur = which === "practice" ? practiceSec : blockSec;
    setTimeLeft(dur);
    setPhase(which);
    runningRef.current = true;
    scheduleStimulus();
    timerRef.current && clearInterval(timerRef.current);
    const t0 = performance.now();
    timerRef.current = setInterval(() => {
      const elapsed = (performance.now() - t0) / 1000;
      const rem =
        (which === "practice" ? practiceSec : blockSec) - elapsed;
      setTimeLeft(Math.max(0, rem));
      if (rem <= 0) {
        clearInterval(timerRef.current);
        runningRef.current = false;
        if (which === "practice") {
          setPhase("preblocks");
        } else {
          if (blockIdx < NUM_BLOCKS - 1) {
            setPhase("interval");
          } else {
            setPhase("done");
            onFinish && onFinish(computeGoNoGo(log));
          }
        }
      }
    }, 50);
  }

  function nextBlock() {
    const next = blockIdx + 1;
    setBlockIdx(next);
    setPhase("block");
    runningRef.current = true;
    setTimeLeft(blockSec);
    scheduleStimulus();
    timerRef.current && clearInterval(timerRef.current);
    const t0 = performance.now();
    timerRef.current = setInterval(() => {
      const elapsed = (performance.now() - t0) / 1000;
      const rem = blockSec - elapsed;
      setTimeLeft(Math.max(0, rem));
      if (rem <= 0) {
        clearInterval(timerRef.current);
        runningRef.current = false;
        if (next < NUM_BLOCKS - 1) {
          setPhase("interval");
        } else {
          setPhase("done");
          onFinish && onFinish(computeGoNoGo(log));
        }
      }
    }, 50);
  }

  function scheduleStimulus() {
    function loop() {
      if (!runningRef.current) return;
      const delay = 800 + Math.random() * 500;
      setTimeout(() => {
        if (!runningRef.current) return;
        const color = Math.random() < 0.75 ? "green" : "red";
        const now = performance.now();
        const visMs = 600 + Math.random() * 300;
        const stimObj = { color, start: now, deadline: now + visMs };
        stimRef.current = stimObj;
        setStim(stimObj);
        setTimeout(() => {
          if (stimRef.current === stimObj) {
            setLog((l) => [
              ...l,
              {
                t: performance.now(),
                block: blockIdx,
                color,
                responded: false,
                rt: null,
                correct: color === "red",
                type:
                  color === "green"
                    ? "omission"
                    : "correct-withhold",
              },
            ]);
            stimRef.current = null;
            setStim(null);
          }
          loop();
        }, visMs);
      }, delay);
    }
    loop();
  }

  useEffect(
    () => () => {
      timerRef.current && clearInterval(timerRef.current);
      runningRef.current = false;
    },
    []
  );

  const metrics = useMemo(() => computeGoNoGo(log), [log]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Go/No-Go – Impulse Inhibition</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {phase === "intro" && (
          <div className="space-y-3">
            <p>
              <span className="font-semibold">Click</span> for{" "}
              <span className="font-semibold text-green-600">green</span>{" "}
              circle (Go). Do not click for{" "}
              <span className="font-semibold text-red-600">red</span>{" "}
              circle (No-Go).
            </p>
            <p>
              Flow: practice → {NUM_BLOCKS} blocks of {blockSec}s.
            </p>
            <Button onClick={() => startPhase("practice")}>
              Start Practice
            </Button>
          </div>
        )}

        {phase === "preblocks" && (
          <div className="space-y-3">
            <p>Ready for the blocks?</p>
            <Button onClick={nextBlock}>
              Start Block 1/{NUM_BLOCKS}
            </Button>
          </div>
        )}

        {["block", "interval", "practice"].includes(phase) && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                {phase === "practice"
                  ? "Practice"
                  : `Block ${blockIdx + 1} / ${NUM_BLOCKS}`}
              </div>
              <div className="w-1/2">
                <Progress
                  value={
                    100 *
                    (timeLeft /
                      (phase === "practice" ? practiceSec : blockSec))
                  }
                />
              </div>
              <div className="tabular-nums">
                {timeLeft.toFixed(1)}s
              </div>
            </div>
            {phase === "interval" ? (
              <div className="space-y-3">
                <p>Short break.</p>
                <Button onClick={nextBlock}>Start next block</Button>
              </div>
            ) : (
              <div
                className="h-56 flex items-center justify-center cursor-pointer select-none"
                onClick={handleClick}
                role="button"
                aria-label="Stimulus area – click when green"
                title="Click when the circle is green"
              >
                {stim ? (
                  <div
                    className={`w-24 h-24 rounded-full ${
                      stim.color === "green" ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                ) : (
                  <div className="opacity-40">+</div>
                )}
              </div>
            )}
            <LiveGoNoGoStats log={log} />
          </div>
        )}

        {phase === "done" && (
          <div className="space-y-4">
            <p>Finished! Metrics sent to Dashboard.</p>
            <GoNoGoSummary metrics={metrics} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function LiveGoNoGoStats({ log }) {
  const go = log.filter((r) => r.color === "green");
  const red = log.filter((r) => r.color === "red");
  const hits = go.filter((r) => r.type === "hit");
  const omissions = go.filter((r) => r.type === "omission");
  const commissions = red.filter((r) => r.type === "commission");
  const rt = hits.map((r) => r.rt);
  return (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div className="p-3 rounded-2xl bg-muted">
        <div className="font-semibold">Running counts</div>
        <div className="grid grid-cols-2 gap-x-4 mt-2">
          <div>Go trials</div>
          <div className="text-right tabular-nums">{go.length}</div>
          <div>Hits</div>
          <div className="text-right tabular-nums">{hits.length}</div>
          <div>Omissions</div>
          <div className="text-right tabular-nums">
            {omissions.length}
          </div>
          <div>Commissions</div>
          <div className="text-right tabular-nums">
            {commissions.length}
          </div>
        </div>
      </div>
      <div className="p-3 rounded-2xl bg-muted">
        <div className="font-semibold">RT (correct Go)</div>
        <div className="grid grid-cols-2 gap-x-4 mt-2">
          <div>Mean</div>
          <div className="text-right tabular-nums">
            {Number.isFinite(mean(rt)) ? Math.round(mean(rt)) : "-"} ms
          </div>
          <div>Std</div>
          <div className="text-right tabular-nums">
            {Number.isFinite(std(rt)) ? Math.round(std(rt)) : "-"} ms
          </div>
          <div>CV</div>
          <div className="text-right tabular-nums">
            {Number.isFinite(std(rt) / mean(rt))
              ? (std(rt) / mean(rt)).toFixed(2)
              : "-"}
          </div>
        </div>
      </div>
    </div>
  );
}

export function computeGoNoGo(log) {
  if (!log || !log.length) return null;

  const blockIds = Array.from(
    new Set(log.map((r) => r.block).filter((b) => b >= 0))
  ).sort((a, b) => a - b);
  const blocks = blockIds.map((b) => log.filter((r) => r.block === b));

  const go = log.filter((r) => r.color === "green");
  const red = log.filter((r) => r.color === "red");
  const hits = go.filter((r) => r.type === "hit");
  const omissions = go.filter((r) => r.type === "omission");
  const commissions = red.filter((r) => r.type === "commission");
  const rt = hits.map((r) => r.rt).filter(Number.isFinite);
  const rtMean = mean(rt);
  const rtStd = std(rt);
  const cv = rtStd / rtMean;
  const inhErrRate = commissions.length / (red.length || 1);
  const omissRate = omissions.length / (go.length || 1);
  const blockErrs = blocks.map(
    (b) =>
      b.filter(
        (r) => r.type === "commission" || r.type === "omission"
      ).length / (b.length || 1)
  );
  const fatigue =
    blockErrs.length >= 2
      ? (blockErrs[blockErrs.length - 1] ?? 0) - (blockErrs[0] ?? 0)
      : 0;
  return {
    rtMean,
    rtStd,
    cv,
    inhErrRate,
    omissRate,
    blockErrs,
    fatigue,
    counts: {
      go: go.length,
      red: red.length,
      hits: hits.length,
      omissions: omissions.length,
      commissions: commissions.length,
    },
  };
}

export function GoNoGoSummary({ metrics }) {
  if (!metrics) return null;
  const data = [
    { name: "Inhibition error rate", value: metrics.inhErrRate },
    { name: "Omission error rate", value: metrics.omissRate },
    { name: "RT CV", value: metrics.cv },
    { name: "Fatigue drift", value: metrics.fatigue },
  ];
  const blockData = metrics.blockErrs.map((e, i) => ({
    block: `B${i + 1}`,
    errors: e,
  }));
  return (
    <div className="space-y-4">
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
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={blockData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="block" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="errors" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
