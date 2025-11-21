// src/dashboard/Dashboard.jsx
import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui";

import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from "recharts";

// import per-task summary components
import { GoNoGoSummary } from "../tasks/GoNoGo";
import { StroopSummary } from "../tasks/Stroop";
import { FramingSummary } from "../tasks/Framing";
import { MIDSummary } from "../tasks/MID";
import { BARTSummary } from "../tasks/BART";
import { DelaySummary } from "../tasks/DelayDiscounting";
import { ProbabilitySummary } from "../tasks/ProbabilityWeighting";
import { CalibrationSummary } from "../tasks/ConfidenceCalibration";
import { AnchoringSummary } from "../tasks/AnchoringRecall";


/* norm tool; scale every indicator value to 0–1, then *100 for radar chart */
function norm(value, maxAbs) {
  if (!Number.isFinite(value)) return 0;
  if (!Number.isFinite(maxAbs) || maxAbs <= 0) return 0;
  const v = value / maxAbs;
  return Math.max(0, Math.min(1, v));
}
function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

// helper: weighted average ignoring missing values
function weightedAverage(pairs) {
  let num = 0;
  let den = 0;
  for (const { value, weight } of pairs) {
    if (typeof value === "number" && Number.isFinite(value)) {
      num += value * weight;
      den += weight;
    }
  }
  return den > 0 ? num / den : 0;
}

function Dashboard({ results }) {
  const [expandedKey, setExpandedKey] = React.useState(null);
  const [isMobile, setIsMobile] = React.useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  React.useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const {
    go,
    stroop,
    framing,
    mid,
    bart,
    delay,
    probability,
    calibration,
    anchoring,
  } = results || {};

  const ready =
    go ||
    stroop ||
    framing ||
    mid ||
    bart ||
    delay ||
    probability ||
    calibration ||
    anchoring;

  // ---------- advisory cards ----------
  const advisory = [];
  if (go) {
    advisory.push({
      title: "Impulsivity",
      explanation:
        "Higher scores indicates more likely to make fast, emotion-driven actions.",
      tip: "Use preset rules and avoid emotional trades.",
      flag: go.inhErrRate > 0.15 || go.cv > 0.35 || go.fatigue > 0.05,
    });
  }
  if (stroop) {
    advisory.push({
      title: "Distraction Sensitivity",
      explanation:
        "Higher scores reflect more difficulty staying focused when irrelevant information appears (interference control)",
      tip: "Rely on clear data before acting on fast-moving signals.",
      flag: (stroop.costRT || 0) > 120 || (stroop.costErr || 0) > 0.05,
    });
  }
  if (framing) {
    advisory.push({
      title: "Framing Sensitivity",
      explanation:
        "Higher scores reflect greater influence from how information is worded or presented (framing effect).",
      tip: "Standardize scales and wording to reduce shifts driven by presentation.",
      flag:
        (framing.amplitude || 0) > 0.2 ||
        (1 - (framing.consistency || 1)) > 0.25,
    });
  }
  if (mid) {
    advisory.push({
      title: "Reward Sensitivity",
      explanation:
        "Higher scores reflect being more driven by attractive rewards.",
      tip: "Use ranges and scenarios instead of focusing on single short-term outcomes.",
      flag: (mid.deltaRT || 0) < -60 || (mid.deltaErr || 0) < -0.03,
    });
  }
  if (bart) {
    advisory.push({
      title: "Risk Appetite",
      explanation:
        "Higher scores reflect greater willingness to take chances for bigger payoffs (risk preference).",
      tip: "Set limits and size positions carefully to keep risk within plan.",
      flag:
        (bart.avgPumpsNonBurst || 0) > 8 &&
        (bart.burstRate || 0) > 0.35 &&
        (!Number.isFinite(bart.slope) || bart.slope <= 0),
    });
  }
  if (delay) {
    advisory.push({
      title: "Short-Term Preference",
      explanation:
        "Higher scores reflect stronger pull toward immediate outcomes (present bias).",
      tip: "Match holdings to short-, mid-, and long-term goals in separate buckets.",
      flag: (delay.k || 0) > 0.02 || (delay.choiceNowPct || 0) > 0.5,
    });
  }
  if (probability) {
    advisory.push({
      title: "Probability Bias",
      explanation:
        "Higher scores reflect uneven weighting of small vs. large probabilities.",
      tip: "Compare outcomes across probability ranges, not only best-case scenarios.",
      flag:
        (probability.smallAmplification || 0) > 0.15 ||
        (probability.largeUnderweight || 0) > 0.15,
    });
  }
  if (calibration) {
    advisory.push({
      title: "Confidence Bias",
      explanation:
        "Higher scores reflect a gap between confidence and accuracy (overconfidence).",
      tip: "Check views against long-run history to avoid overconfidence or underconfidence.",
      flag:
        (calibration.overconfidence || 0) > 0.15 ||
        (calibration.hitRate || 0) < 0.6,
    });
  }
  if (anchoring) {
    advisory.push({
      title: "Memory Bias",
      explanation:
        "Higher scores reflect stronger influence from memorable past events (anchoring).",
      tip: "Base plans on broad historical patterns rather than a few standout years.",
      flag: (anchoring.rigidity || 0) < 0.3,
    });
  }


  // ---------- radar chart dimensions ----------
  const radarData = [];

  if (go) {
    const inh = norm(go.inhErrRate || 0, 0.3);
    const omiss = norm(go.omissRate || 0, 0.3);
    const cv = norm(go.cv || 0, 0.6);
    const fatigue = norm((go.fatigue || 0) + 0.2, 0.4);
    const score = clamp01((inh + omiss + cv + fatigue) / 4) * 100;
    radarData.push({ dimension: "Impulsivity", value: score });
  }
  if (stroop) {
    const costRT = norm(Math.max(stroop.costRT || 0, 0), 300);
    const costErr = norm(stroop.costErr || 0, 0.2);
    const score = clamp01((costRT + costErr) / 2) * 100;
    radarData.push({ dimension: "Distraction Sensitivity", value: score });
  }
  if (framing) {
    const amp = norm(Math.abs(framing.amplitude || 0), 0.5);
    const instab = norm(1 - (framing.consistency || 1), 0.5);
    const score = clamp01(0.7 * amp + 0.3 * instab) * 100;
    radarData.push({ dimension: "Framing Sensitivity", value: score });
  }
  if (mid) {
    const rtBoost = norm(Math.max(-(mid.deltaRT || 0), 0), 150);
    const errBoost = norm(Math.max(-(mid.deltaErr || 0), 0), 0.1);
    const score = clamp01((rtBoost + errBoost) / 2) * 100;
    radarData.push({ dimension: "Reward Sensitivity", value: score });
  }
  if (bart) {
    const avgPumps = norm(bart.avgPumpsNonBurst || 0, 10);
    const burst = norm(bart.burstRate || 0, 0.6);
    const noLearning = norm(Math.max(-(bart.slope || 0), 0), 4);
    const score = clamp01((avgPumps + burst + noLearning) / 3) * 100;
    radarData.push({ dimension: "Risk Appetite", value: score });
  }
  if (delay) {
    const kScore = norm(delay.k || 0, 0.03);
    const nowScore = delay.choiceNowPct || 0;
    const score = clamp01(0.6 * kScore + 0.4 * nowScore) * 100;
    radarData.push({ dimension: "Short-Term Preference", value: score });
  }
  if (probability) {
    const smallAmp = norm(
      Math.abs(probability.smallAmplification || 0),
      0.4
    );
    const largeUnder = norm(
      Math.abs(probability.largeUnderweight || 0),
      0.4
    );
    const score = clamp01((smallAmp + largeUnder) / 2) * 100;
    radarData.push({ dimension: "Probability Bias", value: score });
  }
  if (calibration || anchoring) {
    const over = calibration ? norm(calibration.overconfidence || 0, 0.3) : 0;
    const hitGap = calibration
      ? norm(0.9 - (calibration.hitRate || 0), 0.3)
      : 0;
    const rigidGap = anchoring
      ? norm(1 - (anchoring.rigidity || 0), 0.7)
      : 0;
    const score = clamp01((over + hitGap + rigidGap) / 3) * 100;
    radarData.push({
      dimension: "Confidence & Memory Bias",
      value: score,
    });
  }

  // ---------- derive psychological scores (0–1) ----------
  let riskTaking = null;
  let timeHorizon = null;
  let rewardSeeking = null;
  let impulseControl = null;
  let biasAdjustment = null;

  // RiskTaking from BART
  if (bart) {
    const avgPumps = norm(bart.avgPumpsNonBurst || 0, 10);
    const burst = norm(bart.burstRate || 0, 0.6);
    const noLearning = norm(Math.max(-(bart.slope || 0), 0), 4);
    riskTaking = clamp01((avgPumps + burst + noLearning) / 3);
  }

  // TimeHorizon from Present Bias (Delay) – opposite
  if (delay) {
    const kScore = norm(delay.k || 0, 0.03);
    const nowScore = delay.choiceNowPct || 0;
    const presentBias = clamp01(0.6 * kScore + 0.4 * nowScore);
    timeHorizon = clamp01(1 - presentBias);
  }

  // RewardSeeking from MID
  if (mid) {
    const rtBoost = norm(Math.max(-(mid.deltaRT || 0), 0), 150);
    const errBoost = norm(Math.max(-(mid.deltaErr || 0), 0), 0.1);
    rewardSeeking = clamp01((rtBoost + errBoost) / 2);
  }

  // ImpulseControl from Go/No-Go – opposite “Impulse Control Load”
  if (go) {
    const inh = norm(go.inhErrRate || 0, 0.3);
    const omiss = norm(go.omissRate || 0, 0.3);
    const cv = norm(go.cv || 0, 0.6);
    const fatigue = norm((go.fatigue || 0) + 0.2, 0.4);
    const load = clamp01((inh + omiss + cv + fatigue) / 4);
    impulseControl = clamp01(1 - load);
  }

  // BiasAdjustment from Overconfidence / Anchoring – opposite
  if (calibration || anchoring) {
    const over = calibration ? norm(calibration.overconfidence || 0, 0.3) : 0;
    const hitGap = calibration
      ? norm(0.9 - (calibration.hitRate || 0), 0.3)
      : 0;
    const rigidGap = anchoring
      ? norm(1 - (anchoring.rigidity || 0), 0.7)
      : 0;
    const oaLoad = clamp01((over + hitGap + rigidGap) / 3);
    biasAdjustment = clamp01(1 - oaLoad);
  }

  // ---------- map to Income / Preservation / Growth ----------

  // Growth
  const growthRaw = weightedAverage([
    { value: riskTaking, weight: 0.4 },
    { value: timeHorizon, weight: 0.3 },
    { value: rewardSeeking, weight: 0.2 },
    { value: biasAdjustment, weight: 0.1 },
  ]);
  const impulseFactor =
    typeof impulseControl === "number" && Number.isFinite(impulseControl)
      ? 0.7 + 0.3 * impulseControl
      : 1;
  const growthScore = clamp01(growthRaw * impulseFactor);

  // Preservation
  const preservationRaw = weightedAverage([
    {
      value:
        typeof riskTaking === "number" && Number.isFinite(riskTaking)
          ? 1 - riskTaking
          : null,
      weight: 0.5,
    },
    {
      value:
        typeof rewardSeeking === "number" && Number.isFinite(rewardSeeking)
          ? 1 - rewardSeeking
          : null,
      weight: 0.3,
    },
    {
      value:
        typeof biasAdjustment === "number" && Number.isFinite(biasAdjustment)
          ? 1 - biasAdjustment
          : null,
      weight: 0.2,
    },
  ]);
  const preservationScore = clamp01(preservationRaw);

  // Income
  let centeredRisk = null;
  if (typeof riskTaking === "number" && Number.isFinite(riskTaking)) {
    centeredRisk = 1 - Math.min(1, Math.abs(riskTaking - 0.5) / 0.5);
  }
  const incomeRaw = weightedAverage([
    { value: centeredRisk, weight: 0.4 },
    { value: impulseControl, weight: 0.3 },
    { value: biasAdjustment, weight: 0.3 },
  ]);
  const incomeScore = clamp01(incomeRaw);

  const totalScore = growthScore + preservationScore + incomeScore;
  let incomePct = 0;
  let preservationPct = 0;
  let growthPct = 0;
  let tiltAvailable = false;

  if (totalScore > 0) {
    tiltAvailable = true;
    incomePct = (incomeScore / totalScore) * 100;
    preservationPct = (preservationScore / totalScore) * 100;
    growthPct = (growthScore / totalScore) * 100;
  }

  const styleRanking = tiltAvailable
    ? [
        { key: "income", label: "Income", value: incomePct },
        { key: "preservation", label: "Preservation", value: preservationPct },
        { key: "growth", label: "Growth", value: growthPct },
      ].sort((a, b) => b.value - a.value)
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Results Dashboard</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!ready && <p className="opacity-70">Run any task to see results.</p>}

        {ready && (
          <>

            {/* 1. Behavior-based portfolio tilt (stacked bar) */}
            {tiltAvailable && (
              <div className="mt-8 space-y-3">
                <h3 className="text-base md:text-lg font-semibold mb-2">
                  Behavior-based Portfolio Tilt (Income / Preservation / Growth)
                </h3>
                <p className="text-sm opacity-70">
                  Not investment advice. This tilt reflects how your task
                  profile leans across capital preservation, regular income, and
                  growth-oriented risk taking.
                </p>
                {/* stacked bar */}
                <div
                  className="w-full h-6 rounded-full overflow-hidden border"
                  style={{ borderColor: "#e5e7eb" }}
                >
                  <div
                    style={{
                      width: `${incomePct.toFixed(1)}%`,
                      background: "#e5e7eb",
                      height: "100%",
                      float: "left",
                    }}
                    title={`Income ${incomePct.toFixed(1)}%`}
                  />
                  <div
                    style={{
                      width: `${preservationPct.toFixed(1)}%`,
                      background: "#bfdbfe",
                      height: "100%",
                      float: "left",
                    }}
                    title={`Preservation ${preservationPct.toFixed(1)}%`}
                  />
                  <div
                    style={{
                      width: `${growthPct.toFixed(1)}%`,
                      background: "#93c5fd",
                      height: "100%",
                      float: "left",
                    }}
                    title={`Growth ${growthPct.toFixed(1)}%`}
                  />
                </div>
                {/* numeric + ranking */}
                <div className="flex flex-wrap gap-4 text-sm mt-1">
                  <div>
                    <span className="font-semibold">Income:</span>{" "}
                    {incomePct.toFixed(1)}%
                  </div>
                  <div>
                    <span className="font-semibold">Preservation:</span>{" "}
                    {preservationPct.toFixed(1)}%
                  </div>
                  <div>
                    <span className="font-semibold">Growth:</span>{" "}
                    {growthPct.toFixed(1)}%
                  </div>
                </div>
                <div className="text-sm opacity-80">
                  Preference ranking:{" "}
                  {styleRanking.map((s, idx) => (
                    <span key={s.key}>
                      {idx > 0 && " > "}
                      {s.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Radar Chart */}
            {radarData.length > 0 && (
              <div className="mt-8">
                <h3 className="text-base md:text-lg font-semibold mb-2">
                  Client Behavioral Profile Radar Chart
                </h3>
                <div className="h-[26rem] md:h-[30rem]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="dimension" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Radar name="Profile" dataKey="value" fillOpacity={0.5} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* 3. Advisory cards */}
            {advisory.length > 0 && (
              <div className="grid md:grid-cols-3 gap-3">
                {advisory.map((a) => {
                  const mobileOpen = expandedKey === a.title;
                  const isOpen = isMobile ? mobileOpen : true; // >md always open

                  return (
                    <div
                      key={a.title}
                      className={`p-4 rounded-2xl border ${a.flag
                          ? "bg-amber-50 border-amber-200"
                          : "bg-slate-50 border-slate-200"
                        } ${isMobile ? "cursor-pointer" : ""}`}
                      onClick={() => {
                        if (!isMobile) return;
                        setExpandedKey(isOpen ? null : a.title);
                      }}
                    >
                      {/* keyword */}
                      <div className="text-base font-semibold tracking-wide">
                        {a.title}
                      </div>

                      {/* explanation (fold on small screen) */}
                      {isOpen && a.explanation && (
                        <div className="text-xs italic text-gray-600 mt-1 leading-snug">
                          {a.explanation}
                        </div>
                      )}

                      {/* tip */}
                      {isOpen && a.tip && (
                        <div className="text-sm font-medium text-gray-900 mt-3">
                          • {a.tip}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}




            {/* 4. Per-task summaries */}
            <div className="space-y-8 mt-20">
              {go && (
                <section>
                  <h3 className="font-semibold mb-2">
                    Go/No-Go – Impulse Inhibition
                  </h3>
                  <GoNoGoSummary metrics={go} />
                </section>
              )}

              {stroop && (
                <section>
                  <h3 className="font-semibold mb-2">
                    Stroop – Interference Control
                  </h3>
                  <StroopSummary metrics={stroop} />
                </section>
              )}

              {framing && (
                <section>
                  <h3 className="font-semibold mb-2">
                    Framing – Gain vs Loss Framing
                  </h3>
                  <FramingSummary metrics={framing} />
                </section>
              )}

              {mid && (
                <section>
                  <h3 className="font-semibold mb-2">
                    MID – Reward Reactivity
                  </h3>
                  <MIDSummary metrics={mid} />
                </section>
              )}

              {bart && (
                <section>
                  <h3 className="font-semibold mb-2">
                    BART – Balloon Analogue Risk Task
                  </h3>
                  <BARTSummary metrics={bart} />
                </section>
              )}

              {delay && (
                <section>
                  <h3 className="font-semibold mb-2">
                    Delay Discounting – Present Bias
                  </h3>
                  <DelaySummary metrics={delay} />
                </section>
              )}

              {probability && (
                <section>
                  <h3 className="font-semibold mb-2">
                    Probability Weighting – Small vs Large p
                  </h3>
                  <ProbabilitySummary metrics={probability} />
                </section>
              )}

              {calibration && (
                <section>
                  <h3 className="font-semibold mb-2">
                    Confidence Calibration – 90% Intervals
                  </h3>
                  <CalibrationSummary metrics={calibration} />
                </section>
              )}

              {anchoring && (
                <section>
                  <h3 className="font-semibold mb-2">
                    Anchoring & Experience Recall
                  </h3>
                  <AnchoringSummary
                    round1={anchoring.round1}
                    round2={anchoring.round2}
                    metrics={anchoring}
                  />
                </section>
              )}
            </div>

            {/* 5. Raw JSON at the very end */}
            <RawJSON results={results} />
          </>
        )}
      </CardContent>
    </Card>
  );
}

function RawJSON({ results }) {
  const json = JSON.stringify(results, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  return (
    <div className="text-sm mt-6">
      <div className="font-semibold mb-2">
        Raw results (downloadable)
      </div>
      <a
        className="underline"
        href={url}
        download={`cognitive_results_${Date.now()}.json`}
      >
        Download JSON
      </a>
    </div>
  );
}

export default Dashboard;
