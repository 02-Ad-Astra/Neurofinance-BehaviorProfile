import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, Button, Progress } from "../components/ui";
import { mean, shuffle } from "../utils/stats";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

/********************* Stroop ************************/
const COLORS = ["RED", "GREEN", "BLUE", "YELLOW"];
const COLOR_MAP = {
  RED: "text-red-600",
  GREEN: "text-green-600",
  BLUE: "text-blue-600",
  YELLOW: "text-yellow-500",
};

export function Stroop({ modeDemo, onFinish }) {
  const totalTrials = modeDemo ? 24 : 120;
  const [phase, setPhase] = useState("intro");
  const [i, setI] = useState(0);
  const [trial, setTrial] = useState(null);
  const [log, setLog] = useState([]);

  const trialRef = useRef(null);
  const acceptAfterRef = useRef(0);
  const missTimerRef = useRef(null);

  function makeTrial() {
    const word = COLORS[Math.floor(Math.random() * COLORS.length)];
    const congruent = Math.random() < 0.5;
    const color = congruent ? word : shuffle(COLORS.filter((c) => c !== word))[0];
    const start = performance.now();
    const deadline = start + (modeDemo ? 2000 : 1500);
    const t = { word, color, congruent, start, deadline };
    trialRef.current = t;
    setTrial(t);
    acceptAfterRef.current = start + 120;
    clearTimeout(missTimerRef.current);
    missTimerRef.current = setTimeout(() => {
      if (trialRef.current === t) {
        setLog((l) => [
          ...l,
          {
            word: t.word,
            color: t.color,
            congruent: t.congruent,
            rt: null,
            correct: false,
          },
        ]);
        trialRef.current = null;
        setTrial(null);
        setI((x) => Math.min(x + 1, totalTrials));
      }
    }, deadline - start);
  }

  function commitResponse(answerColor, now = performance.now()) {
    const t = trialRef.current;
    if (!t) return;
    if (now < acceptAfterRef.current || now > t.deadline) return;
    const rt = now - t.start;
    const correct = answerColor === t.color;
    clearTimeout(missTimerRef.current);
    setLog((l) => [
      ...l,
      {
        word: t.word,
        color: t.color,
        congruent: t.congruent,
        rt,
        correct,
      },
    ]);
    trialRef.current = null;
    setTrial(null);
    setI((x) => Math.min(x + 1, totalTrials));
  }

  useEffect(() => {
    if (phase !== "run") return;
    if (i >= totalTrials) {
      clearTimeout(missTimerRef.current);
      setPhase("done");
      onFinish && onFinish(computeStroop(log));
      return;
    }
    const isi = 250;
    const t = setTimeout(() => makeTrial(), isi);
    return () => clearTimeout(t);
  }, [phase, i, totalTrials, modeDemo, log, onFinish]);

  useEffect(() => {
    function onVis() {
      if (document.hidden) {
        clearTimeout(missTimerRef.current);
        trialRef.current = null;
        setTrial(null);
      } else {
        if (phase === "run" && i < totalTrials) {
          const isi = 250;
          setTimeout(() => makeTrial(), isi);
        }
      }
    }
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [phase, i, totalTrials]);

  const metrics = useMemo(() => computeStroop(log), [log]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stroop – Interference Control</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {phase === "intro" && (
          <div className="space-y-3">
            <p>
              Click the buttons for the <strong>ink color</strong>, ignoring the word.
            </p>
            <Button onClick={() => setPhase("run")}>Start</Button>
          </div>
        )}

        {phase === "run" && (
          <div className="space-y-4">
            <div className="text-center h-52 flex items-center justify-center">
              {(() => {
                const word = trial?.word ?? "";
                const color = trial?.color ?? null;
                const cls = color ? COLOR_MAP[color] ?? "" : "";
                return color ? (
                  <div className={`text-6xl font-bold ${cls}`}>{word}</div>
                ) : (
                  <div className="opacity-40">+</div>
                );
              })()}
            </div>
            <ColorButtons onPick={(c) => commitResponse(c)} />
            <LiveStroopStats log={log} i={i} total={totalTrials} />
          </div>
        )}

        {phase === "done" && (
          <div className="space-y-3">
            <p>Finished! Metrics sent to Dashboard.</p>
            <StroopSummary metrics={metrics} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ColorButtons({ onPick }) {
  const order = ["RED", "GREEN", "BLUE", "YELLOW"];
  return (
    <div className="flex gap-3 justify-center">
      {order.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onPick(c)}
          className={`px-3 py-2 rounded-lg border text-sm font-medium ${COLOR_MAP[c]}`}
          aria-label={`choose ${c}`}
        >
          {c}
        </button>
      ))}
    </div>
  );
}

export function computeStroop(log) {
  if (!log || !log.length) return null;
  const c = log.filter((t) => t.congruent && t.rt != null && t.correct);
  const ic = log.filter((t) => !t.congruent && t.rt != null && t.correct);
  const cMean = mean(c.map((x) => x.rt));
  const icMean = mean(ic.map((x) => x.rt));
  const cErr =
    1 - c.length / Math.max(1, log.filter((t) => t.congruent).length);
  const icErr =
    1 - ic.length / Math.max(1, log.filter((t) => !t.congruent).length);
  const costRT = icMean - cMean;
  const costErr = icErr - cErr;
  return { cMean, icMean, costRT, cErr, icErr, costErr };
}

function LiveStroopStats({ log, i, total }) {
  const c = log.filter((t) => t.congruent && t.rt != null && t.correct);
  const ic = log.filter((t) => !t.congruent && t.rt != null && t.correct);
  return (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div className="p-3 rounded-2xl bg-muted">
        <div className="font-semibold">Progress</div>
        <div className="mt-2 flex items-center gap-3">
          <Progress value={100 * (i / total)} className="w-full" />
          <div className="tabular-nums">
            {i}/{total}
          </div>
        </div>
      </div>
      <div className="p-3 rounded-2xl bg-muted">
        <div className="font-semibold">RT (ms)</div>
        <div className="grid grid-cols-2 gap-x-4 mt-2">
          <div>Congruent</div>
          <div className="text-right tabular-nums">
            {Number.isFinite(mean(c.map((x) => x.rt)))
              ? Math.round(mean(c.map((x) => x.rt)))
              : "-"}
          </div>
          <div>Incongruent</div>
          <div className="text-right tabular-nums">
            {Number.isFinite(mean(ic.map((x) => x.rt)))
              ? Math.round(mean(ic.map((x) => x.rt)))
              : "-"}
          </div>
        </div>
      </div>
    </div>
  );
}

export function StroopSummary({ metrics }) {
  if (!metrics) return null;
  const data = [
    { name: "Interference cost (RT ms)", value: metrics.costRT || 0 },
    { name: "Error diff (IC - C)", value: metrics.costErr || 0 },
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
