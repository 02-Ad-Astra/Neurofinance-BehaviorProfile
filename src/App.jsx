// src/App.jsx
import React, { useState } from "react";

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
} from "./components/ui";

import { GoNoGo } from "./tasks/GoNoGo";
import { Stroop } from "./tasks/Stroop";
import { Framing } from "./tasks/Framing";

import { MID } from "./tasks/MID";
import { BART } from "./tasks/BART";
import { DelayDiscounting } from "./tasks/DelayDiscounting";

import { ProbabilityWeightingTask } from "./tasks/ProbabilityWeighting";
import { CalibrationTask } from "./tasks/ConfidenceCalibration";
import { AnchoringTask } from "./tasks/AnchoringRecall";

import Dashboard from "./dashboard/Dashboard";

export default function App() {
  const [tab, setTab] = useState("cog");
  const [modeDemo, setModeDemo] = useState(true);

  const [results, setResults] = useState({
    go: null,
    stroop: null,
    framing: null,
    mid: null,
    bart: null,
    delay: null,
    probability: null,
    calibration: null,
    anchoring: null,
  });

  // restart keys for forcing remount
  const [goKey, setGoKey] = useState(0);
  const [stroopKey, setStroopKey] = useState(0);
  const [framingKey, setFramingKey] = useState(0);
  const [midKey, setMidKey] = useState(0);
  const [bartKey, setBartKey] = useState(0);
  const [delayKey, setDelayKey] = useState(0);
  const [probKey, setProbKey] = useState(0);
  const [calibKey, setCalibKey] = useState(0);
  const [anchorKey, setAnchorKey] = useState(0);

  const restartGo = () => {
    setGoKey((k) => k + 1);
    setResults((r) => ({ ...r, go: null }));
  };
  const restartStroop = () => {
    setStroopKey((k) => k + 1);
    setResults((r) => ({ ...r, stroop: null }));
  };
  const restartFraming = () => {
    setFramingKey((k) => k + 1);
    setResults((r) => ({ ...r, framing: null }));
  };
  const restartMID = () => {
    setMidKey((k) => k + 1);
    setResults((r) => ({ ...r, mid: null }));
  };
  const restartBART = () => {
    setBartKey((k) => k + 1);
    setResults((r) => ({ ...r, bart: null }));
  };
  const restartDelay = () => {
    setDelayKey((k) => k + 1);
    setResults((r) => ({ ...r, delay: null }));
  };
  const restartProb = () => {
    setProbKey((k) => k + 1);
    setResults((r) => ({ ...r, probability: null }));
  };
  const restartCalib = () => {
    setCalibKey((k) => k + 1);
    setResults((r) => ({ ...r, calibration: null }));
  };
  const restartAnchor = () => {
    setAnchorKey((k) => k + 1);
    setResults((r) => ({ ...r, anchoring: null }));
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">
          Investor Cognition & Reward–Risk Profile – Demo
        </h1>
        <p className="text-sm opacity-80">
          Cognitive control (Go/No-Go, Stroop, Framing), Reward sensitivity
          (MID, BART, Delay), and Risk perception & biases (probability
          weighting, calibration, anchoring).
        </p>
        <div className="flex items-center gap-3">
          <Switch checked={modeDemo} onCheckedChange={setModeDemo} id="mode" />
          <Label htmlFor="mode">
            Demo mode ({modeDemo ? "short" : "full"})
          </Label>
        </div>
      </header>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger key="tab-cog" value="cog">
            Cognitive Control
          </TabsTrigger>
          <TabsTrigger key="tab-reward" value="reward">
            Reward Sensitivity
          </TabsTrigger>
          <TabsTrigger key="tab-risk" value="risk">
            Risk Perception & Biases
          </TabsTrigger>
          <TabsTrigger key="tab-dashboard" value="dashboard">
            Dashboard
          </TabsTrigger>
        </TabsList>

        {/* Cognitive control: Go/No-Go, Stroop, Framing */}
        <TabsContent key="content-cog" value="cog">
          <Card>
            <CardHeader>
              <CardTitle>Cognitive Control Tasks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Go/No-Go */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Button variant="secondary" onClick={restartGo}>
                  Restart Go/No-Go
                </Button>
              </div>
              <GoNoGo
                key={goKey}
                modeDemo={modeDemo}
                onFinish={(r) => setResults((prev) => ({ ...prev, go: r }))}
              />

              {/* Stroop */}
              <div
                style={{
                  marginTop: "16px",
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <Button variant="secondary" onClick={restartStroop}>
                  Restart Stroop
                </Button>
              </div>
              <Stroop
                key={stroopKey}
                modeDemo={modeDemo}
                onFinish={(r) =>
                  setResults((prev) => ({ ...prev, stroop: r }))
                }
              />

              {/* Framing */}
              <div
                style={{
                  marginTop: "16px",
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <Button variant="secondary" onClick={restartFraming}>
                  Restart Framing
                </Button>
              </div>
              <Framing
                key={framingKey}
                modeDemo={modeDemo}
                onFinish={(r) =>
                  setResults((prev) => ({ ...prev, framing: r }))
                }
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reward sensitivity: MID, BART, Delay Discounting */}
        <TabsContent key="content-reward" value="reward">
          <Card>
            <CardHeader>
              <CardTitle>Reward Sensitivity Tasks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* MID */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Button variant="secondary" onClick={restartMID}>
                  Restart MID
                </Button>
              </div>
              <MID
                key={midKey}
                modeDemo={modeDemo}
                onFinish={(r) => setResults((prev) => ({ ...prev, mid: r }))}
              />

              {/* BART */}
              <div
                style={{
                  marginTop: "16px",
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <Button variant="secondary" onClick={restartBART}>
                  Restart BART
                </Button>
              </div>
              <BART
                key={bartKey}
                modeDemo={modeDemo}
                onFinish={(r) => setResults((prev) => ({ ...prev, bart: r }))}
              />

              {/* Delay Discounting */}
              <div
                style={{
                  marginTop: "16px",
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <Button variant="secondary" onClick={restartDelay}>
                  Restart Delay
                </Button>
              </div>
              <DelayDiscounting
                key={delayKey}
                modeDemo={modeDemo}
                onFinish={(r) =>
                  setResults((prev) => ({ ...prev, delay: r }))
                }
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk perception & biases: Probability weighting, Calibration, Anchoring */}
        <TabsContent key="content-risk" value="risk">
          <Card>
            <CardHeader>
              <CardTitle>Risk Perception & Bias Tasks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Probability weighting */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Button variant="secondary" onClick={restartProb}>
                  Restart Probability
                </Button>
              </div>
              <ProbabilityWeightingTask
                key={probKey}
                onFinish={(r) =>
                  setResults((prev) => ({ ...prev, probability: r }))
                }
              />

              {/* Confidence calibration */}
              <div
                style={{
                  marginTop: "16px",
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <Button variant="secondary" onClick={restartCalib}>
                  Restart Calibration
                </Button>
              </div>
              <CalibrationTask
                key={calibKey}
                onFinish={(r) =>
                  setResults((prev) => ({ ...prev, calibration: r }))
                }
              />

              {/* Anchoring */}
              <div
                style={{
                  marginTop: "16px",
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <Button variant="secondary" onClick={restartAnchor}>
                  Restart Anchoring
                </Button>
              </div>
              <AnchoringTask
                key={anchorKey}
                onFinish={(r) =>
                  setResults((prev) => ({ ...prev, anchoring: r }))
                }
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dashboard */}
        <TabsContent key="content-dashboard" value="dashboard">
          <Dashboard results={results} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
