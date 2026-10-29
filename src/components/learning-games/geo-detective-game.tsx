"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Clock3, Compass, Lightbulb,
  MapPin, RotateCcw, ShieldCheck, Sparkles, Target, Trophy, XCircle,
} from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GEO_DETECTIVE_MISSIONS, scoreGeoAnswer, type GeoMission } from "@/lib/learning-games/geo-detective";
import { GEO_FEATURE_ANCHORS, INDIA_MAP_VIEWBOX, projectIndiaCoordinate } from "@/lib/learning-games/india-state-map";

type Mode = "practice" | "challenge";
type AnswerState = "idle" | "wrong" | "correct";
const BEST_KEY = "eacharya.geo-detective.best.v2";
const MISSION_COUNT = GEO_DETECTIVE_MISSIONS.length;
const MAX_POSSIBLE_SCORE = GEO_DETECTIVE_MISSIONS.reduce(
  (total, _mission, index) => total + 100 + Math.min(20, index * 5),
  0,
);

function formatTime(seconds: number) {
  const min = Math.floor(Math.max(0, seconds) / 60);
  const sec = Math.max(0, seconds) % 60;
  return `${min}:${String(sec).padStart(2, "0")}`;
}

function IndiaStateMap({ mission, selectedId, onSelect, answerState }: {
  mission: GeoMission;
  selectedId: string | null;
  onSelect: (id: string) => void;
  answerState: AnswerState;
}) {
  const projected = mission.choices.map((choice, index) => {
    const [longitude, latitude] = GEO_FEATURE_ANCHORS[choice.id] ?? [78, 20];
    const point = projectIndiaCoordinate(longitude, latitude);
    return { choice, index, ...point };
  });
  const crowded = new Set<number>();
  for (let i = 0; i < projected.length; i += 1) {
    for (let j = i + 1; j < projected.length; j += 1) {
      const first = projected[i];
      const second = projected[j];
      if (!first || !second) continue;
      const dx = first.x - second.x;
      const dy = first.y - second.y;
      if (Math.hypot(dx, dy) < 23) {
        crowded.add(i);
        crowded.add(j);
      }
    }
  }
  const offsets = [[-10, -10], [10, -10], [10, 10], [-10, 10]] as const;
  const markers = projected.map((point, index) => {
    const offset = offsets[index % offsets.length] ?? [0, 0];
    return {
      ...point,
      x: point.x + (crowded.has(index) ? offset[0] : 0),
      y: point.y + (crowded.has(index) ? offset[1] : 0),
    };
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-sage-200 bg-[#edf5f4]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sage-200 bg-white/90 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-bold text-forest-900">
          <MapPin className="h-4 w-4 text-brand-700" aria-hidden /> India state map
        </div>
        <span className="rounded-full bg-sage-100 px-2 py-1 text-[11px] font-semibold text-forest-700">28 STATES · 8 UNION TERRITORIES</span>
      </div>
      <div className="p-2 sm:p-4">
        <svg
          viewBox={INDIA_MAP_VIEWBOX}
          role="group"
          aria-label="Map of India with state and union territory boundaries. Select a lettered marker to choose a geographical feature."
          className="mx-auto block h-auto w-full max-w-[460px]"
        >
          <desc>India state and union territory outlines. Lettered markers show representative locations for the current mission&apos;s answer choices.</desc>
          <image
            href="/maps/india-state-boundaries.svg"
            x="0"
            y="0"
            width="460"
            height="540"
            preserveAspectRatio="xMidYMid meet"
            pointerEvents="none"
          />
          {markers.map(({ choice, index, x, y }) => {
            const active = selectedId === choice.id;
            const correct = answerState === "correct" && choice.id === mission.answerId;
            const wrong = answerState === "wrong" && active;
            const fill = correct ? "#157347" : wrong ? "#bf3434" : active ? "#0b6b4a" : "#ffffff";
            const stroke = correct ? "#0b5d38" : wrong ? "#982626" : "#0b6b4a";
            return (
              <g
                key={`${choice.id}-${index}`}
                role="button"
                tabIndex={0}
                aria-label={`Option ${String.fromCharCode(65 + index)}: ${choice.label}`}
                aria-pressed={active}
                onClick={() => onSelect(choice.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect(choice.id);
                  }
                }}
                className="cursor-pointer outline-none"
              >
                <circle cx={x} cy={y} r="15" fill="transparent" />
                <circle cx={x} cy={y} r={active ? 10.8 : 9.2} fill={fill} stroke={stroke} strokeWidth={active ? 2.5 : 1.7} />
                <text x={x} y={y + 3.4} textAnchor="middle" fontSize="9.5" fontWeight="800" fill={active || correct || wrong ? "#ffffff" : "#0b6b4a"} pointerEvents="none">
                  {String.fromCharCode(65 + index)}
                </text>
                <title>{choice.label} — representative location</title>
              </g>
            );
          })}
          <text x="14" y="520" fontSize="9.5" fill="#547363">Simplified state/UT boundaries · geography markers are approximate</text>
        </svg>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {mission.choices.map((choice, index) => (
            <button
              type="button"
              key={choice.id}
              onClick={() => onSelect(choice.id)}
              aria-pressed={selectedId === choice.id}
              className={`flex min-h-10 items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${selectedId === choice.id ? "border-brand-700 bg-brand-50 text-brand-800" : "border-sage-200 bg-white text-forest-800 hover:border-brand-300"}`}
            >
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] ${selectedId === choice.id ? "bg-brand-700 text-white" : "bg-sage-100 text-forest-800"}`}>{String.fromCharCode(65 + index)}</span>
              <span>{choice.label}</span>
            </button>
          ))}
        </div>
        <p className="mt-3 text-[11px] leading-4 text-forest-600">
          Boundary geometry: <a className="font-semibold underline underline-offset-2" href="https://simplemaps.com" target="_blank" rel="noreferrer">SimpleMaps</a> (provided dataset), simplified for display. Markers indicate representative positions, not exact feature extents.
        </p>
      </div>
    </div>
  );
}
function LaunchPanel({ mode, setMode, onStart, bestScore }: {
  mode: Mode; setMode: (mode: Mode) => void; onStart: () => void; bestScore: number;
}) {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-[#0b4936] via-[#0d6749] to-[#17805c] text-white shadow-lift">
          <CardBody className="flex h-full flex-col p-6 sm:p-8">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-100"><Compass className="h-4 w-4" /> GEOLAB FIELD MISSION 01</div>
            <h2 className="mt-5 max-w-lg text-3xl font-extrabold tracking-tight sm:text-4xl">Can you solve the geography mystery?</h2>
            <p className="mt-4 max-w-xl leading-7 text-emerald-50">Read the clues, investigate India’s state-boundary map, choose the right geographical feature and unlock the reasoning behind each answer.</p>
            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-white/15 bg-white/10 p-3"><div className="text-2xl font-extrabold">{MISSION_COUNT}</div><div className="mt-1 text-xs text-emerald-100">Missions</div></div>
              <div className="rounded-xl border border-white/15 bg-white/10 p-3"><div className="text-2xl font-extrabold">{MAX_POSSIBLE_SCORE.toLocaleString()}</div><div className="mt-1 text-xs text-emerald-100">Max points</div></div>
              <div className="rounded-xl border border-white/15 bg-white/10 p-3"><div className="text-2xl font-extrabold">4</div><div className="mt-1 text-xs text-emerald-100">Map choices</div></div>
            </div>
            <div className="mt-auto pt-7 text-sm text-emerald-100">Topics: physical features, drainage, climate, population distribution, density, migration and urbanisation.</div>
          </CardBody>
        </Card>
        <Card><CardBody className="space-y-5 p-6 sm:p-8">
          <div>
            <h3 className="text-xl font-extrabold">Choose your mode</h3>
            <p className="mt-1 text-sm text-forest-600">Learn first, then test your speed.</p>
          </div>
          <button type="button" onClick={() => setMode("practice")} aria-pressed={mode === "practice"} className={`w-full rounded-2xl border p-4 text-left transition ${mode === "practice" ? "border-brand-600 bg-brand-50 ring-1 ring-brand-600" : "border-sage-200 hover:bg-sage-50"}`}>
            <div className="flex items-center justify-between"><span className="font-bold text-forest-950">Practice mode</span><BookOpen className="h-5 w-5 text-brand-700" /></div>
            <p className="mt-2 text-sm leading-6 text-forest-600">No timer. Reveal clues, retry answers and focus on understanding.</p>
          </button>
          <button type="button" onClick={() => setMode("challenge")} aria-pressed={mode === "challenge"} className={`w-full rounded-2xl border p-4 text-left transition ${mode === "challenge" ? "border-brand-600 bg-brand-50 ring-1 ring-brand-600" : "border-sage-200 hover:bg-sage-50"}`}>
            <div className="flex items-center justify-between"><span className="font-bold text-forest-950">Challenge mode</span><Clock3 className="h-5 w-5 text-brand-700" /></div>
            <p className="mt-2 text-sm leading-6 text-forest-600">Solve as many missions as possible in 3 minutes. Hints remain available but reduce points.</p>
          </button>
          <div className="flex items-center gap-3 rounded-xl bg-sand-50 p-3"><Trophy className="h-5 w-5 text-amber-600"/><div><div className="text-xs text-forest-600">Best score on this device</div><div className="font-extrabold text-forest-950">{bestScore.toLocaleString()} XP</div></div></div>
          <Button onClick={onStart} className="w-full" size="lg">Start Geo Detective <ArrowRight className="h-4 w-4" /></Button>
          <p className="text-xs leading-5 text-forest-500">Your score is stored in this browser on this device. It is not yet synced to teacher reports.</p>
        </CardBody></Card>
      </div>
    </div>
  );
}

export function GeoDetectiveGame() {
  const [mode, setMode] = useState<Mode>("practice");
  const [started, setStarted] = useState(false);
  const [missionIndex, setMissionIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>("idle");
  const [attempts, setAttempts] = useState(0);
  const [hintLevel, setHintLevel] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [solved, setSolved] = useState(0);
  const [firstTryCorrect, setFirstTryCorrect] = useState(0);
  const [earnedForCurrent, setEarnedForCurrent] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(180);
  const [finished, setFinished] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [bestScore, setBestScore] = useState(0);
  const [showNotebook, setShowNotebook] = useState(false);
  const mission = GEO_DETECTIVE_MISSIONS[missionIndex]!;

  useEffect(() => {
    try { setBestScore(Number(window.localStorage.getItem(BEST_KEY) ?? 0) || 0); } catch { /* storage may be unavailable */ }
  }, []);

  useEffect(() => {
    if (!started || mode !== "challenge" || finished || timedOut) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [started, mode, finished, timedOut]);

  useEffect(() => {
    if (started && mode === "challenge" && secondsLeft <= 0 && !finished) setTimedOut(true);
  }, [started, mode, secondsLeft, finished]);

  useEffect(() => {
    if (!finished && !timedOut) return;
    if (score > bestScore) {
      setBestScore(score);
      try { window.localStorage.setItem(BEST_KEY, String(score)); } catch { /* storage may be unavailable */ }
    }
  }, [finished, timedOut, score, bestScore]);

  const startGame = useCallback(() => {
    setStarted(true); setMissionIndex(0); setSelectedId(null); setAnswerState("idle"); setAttempts(0); setHintLevel(0); setScore(0); setStreak(0); setSolved(0); setFirstTryCorrect(0); setEarnedForCurrent(0); setSecondsLeft(180); setFinished(false); setTimedOut(false); setShowNotebook(false);
  }, []);

  const progressPercent = Math.round(((missionIndex + 1) / MISSION_COUNT) * 100);

  const submitAnswer = () => {
    if (!selectedId || answerState !== "idle") return;
    if (selectedId !== mission.answerId) {
      setAttempts((count) => count + 1);
      setAnswerState("wrong");
      setStreak(0);
      return;
    }
    const awarded = scoreGeoAnswer({ usedHint: hintLevel, previousWrongAttempt: attempts > 0, streak });
    setScore((value) => value + awarded);
    setEarnedForCurrent(awarded);
    setSolved((value) => value + 1);
    if (attempts === 0 && hintLevel === 0) setFirstTryCorrect((value) => value + 1);
    setStreak((value) => value + 1);
    setAnswerState("correct");
  };

  const revealHint = () => {
    if (hintLevel < 2 && answerState === "idle") setHintLevel((value) => value + 1);
  };

  const nextMission = () => {
    if (missionIndex >= GEO_DETECTIVE_MISSIONS.length - 1) { setFinished(true); return; }
    setMissionIndex((value) => value + 1); setSelectedId(null); setAnswerState("idle"); setAttempts(0); setHintLevel(0); setEarnedForCurrent(0); setShowNotebook(false);
  };

  const resetAfterWrong = () => { setAnswerState("idle"); setSelectedId(null); };
  const isComplete = finished || timedOut;

  return (
    <div className="min-h-[70vh] bg-sand-50 pb-12">
      <section className="border-b border-sage-200 bg-white">
        <div className="container-page py-6 sm:py-8">
          <Link href="/geography-lab" className="inline-flex items-center gap-2 text-sm font-semibold text-forest-600 hover:text-brand-700"><ArrowLeft className="h-4 w-4"/> Back to Geography Lab</Link>
          <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-brand-700"><Compass className="h-4 w-4"/> GeoLab · Interactive Game</div>
              <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Geo Detective</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-forest-600 sm:text-base">Investigate geographical clues on an India map with state boundaries and build your field notebook.</p>
            </div>
            {started && !isComplete && <div className="flex items-center gap-2 rounded-xl border border-sage-200 bg-sand-50 px-4 py-2.5"><Trophy className="h-5 w-5 text-amber-600"/><div><div className="text-[11px] font-semibold uppercase tracking-wide text-forest-500">Mission score</div><div className="text-lg font-extrabold tabular-nums text-forest-950">{score.toLocaleString()} XP</div></div></div>}
          </div>
        </div>
      </section>

      <div className="container-page pt-6 sm:pt-8">
        {!started ? (
          <LaunchPanel mode={mode} setMode={setMode} onStart={startGame} bestScore={bestScore}/>
        ) : isComplete ? (
          <div className="mx-auto max-w-3xl">
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-brand-800 to-brand-600 p-7 text-white sm:p-10">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15"><Trophy className="h-8 w-8"/></div>
                <h2 className="mt-5 text-3xl font-extrabold">{finished ? "Case file complete" : "Time is up, detective"}</h2>
                <p className="mt-2 text-emerald-50">{finished ? `You have investigated all ${MISSION_COUNT} missions. Review your score and takeaways.` : `You reached mission ${missionIndex + 1} of ${MISSION_COUNT}. Practice mode is always available for the remaining cases.`}</p>
              </div>
              <CardBody className="space-y-6 p-6 sm:p-8">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[{label:"XP earned", value:score.toLocaleString()},{label:"Cases solved", value:`${solved}/${MISSION_COUNT}`},{label:"First try", value:String(firstTryCorrect)},{label:"Best on device", value:bestScore.toLocaleString()}].map((item) => <div key={item.label} className="rounded-xl bg-sage-50 p-4"><div className="text-xs text-forest-600">{item.label}</div><div className="mt-1 text-2xl font-extrabold text-forest-950">{item.value}</div></div>)}
                </div>
                <div className="rounded-xl border border-sage-200 p-4"><h3 className="font-bold">What you practised</h3><p className="mt-2 text-sm leading-6 text-forest-600">Physical features of India, river systems, rainfall, monsoon, population density and distribution, migration and urbanisation.</p></div>
                <div className="flex flex-wrap gap-3"><Button onClick={startGame}><RotateCcw className="h-4 w-4"/> Play again</Button><Link href="/geography-lab" className="inline-flex h-11 items-center justify-center rounded-xl border border-sage-300 bg-white px-5 text-sm font-semibold text-forest-900 hover:bg-sage-50">Return to GeoLab</Link></div>
                <p className="text-xs text-forest-500">Progress is saved on this device only. Teacher reporting and cross-device sync are not enabled in this version.</p>
              </CardBody>
            </Card>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-sage-200 bg-white p-4"><div className="text-xs font-semibold uppercase tracking-wide text-forest-500">Mission</div><div className="mt-1 flex items-end justify-between"><span className="text-2xl font-extrabold">{String(missionIndex + 1).padStart(2,"0")}<span className="text-base text-forest-500"> / {MISSION_COUNT}</span></span><Target className="h-5 w-5 text-brand-700"/></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-sage-100"><div className="h-full rounded-full bg-brand-600 transition-all" style={{width:`${progressPercent}%`}}/></div></div>
              <div className="rounded-2xl border border-sage-200 bg-white p-4"><div className="text-xs font-semibold uppercase tracking-wide text-forest-500">Current points</div><div className="mt-1 text-2xl font-extrabold tabular-nums">{score.toLocaleString()}<span className="text-base text-forest-500"> XP</span></div><div className="mt-1 text-xs text-forest-500">Best: {bestScore.toLocaleString()} XP</div></div>
              <div className="rounded-2xl border border-sage-200 bg-white p-4"><div className="text-xs font-semibold uppercase tracking-wide text-forest-500">Solved</div><div className="mt-1 text-2xl font-extrabold">{solved}<span className="text-base text-forest-500"> / {MISSION_COUNT}</span></div><div className="mt-1 text-xs text-forest-500">{firstTryCorrect} solved on first try</div></div>
              <div className={`rounded-2xl border p-4 ${mode === "challenge" ? "border-amber-200 bg-amber-50" : "border-sage-200 bg-white"}`}><div className="text-xs font-semibold uppercase tracking-wide text-forest-500">{mode === "challenge" ? "Time left" : "Streak"}</div><div className="mt-1 flex items-center gap-2 text-2xl font-extrabold tabular-nums">{mode === "challenge" ? formatTime(secondsLeft) : `${streak}×`}{mode === "challenge" ? <Clock3 className="h-5 w-5 text-amber-700"/> : <Sparkles className="h-5 w-5 text-amber-600"/>}</div><div className="mt-1 text-xs text-forest-500">{mode === "challenge" ? "3 minute challenge" : "Consecutive correct answers"}</div></div>
            </div>

            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(340px,.92fr)]">
              <div className="space-y-5">
                <Card><CardBody className="p-5 sm:p-6">
                  <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-800">CASE {String(missionIndex + 1).padStart(2,"0")}</span><span className="rounded-full bg-sand-100 px-3 py-1 text-xs font-semibold text-forest-700">{mission.chapter}</span><span className="rounded-full bg-sage-100 px-3 py-1 text-xs font-semibold text-forest-700">{mission.difficulty}</span></div>
                  <h2 className="mt-4 text-2xl font-extrabold">{mission.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-forest-600">Learning objective: {mission.objective}</p>
                  <div className="mt-5 rounded-2xl border border-sage-200 bg-sand-50 p-4 sm:p-5">
                    <div className="flex items-center gap-2 text-sm font-bold text-forest-900"><MapPin className="h-4 w-4 text-brand-700"/> Field notes</div>
                    <p className="mt-3 leading-7 text-forest-900">{mission.clues[0]}</p>
                    {hintLevel >= 1 && <p className="mt-3 border-l-2 border-brand-500 pl-3 leading-7 text-forest-800"><span className="text-xs font-bold uppercase tracking-wide text-brand-700">Hint 1</span><br/>{mission.clues[1]}</p>}
                    {hintLevel >= 2 && <p className="mt-3 border-l-2 border-amber-500 pl-3 leading-7 text-forest-800"><span className="text-xs font-bold uppercase tracking-wide text-amber-700">Hint 2</span><br/>{mission.clues[2]}</p>}
                    {answerState === "idle" && hintLevel < 2 && <Button variant="secondary" size="sm" className="mt-4" onClick={revealHint}><Lightbulb className="h-4 w-4 text-amber-600"/> Reveal hint <span className="text-xs text-forest-500">−10 points</span></Button>}
                  </div>
                  <div className="mt-5">
                    <h3 className="font-bold">Where is the mystery feature?</h3>
                    <p className="mt-1 text-sm text-forest-600">Select an option on the map or use the accessible choice list.</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {mission.choices.map((choice,index) => {
                        const selected = selectedId === choice.id;
                        const correct = answerState === "correct" && choice.id === mission.answerId;
                        const wrong = answerState === "wrong" && selected;
                        return <button type="button" key={choice.id} onClick={() => { if (answerState === "idle") setSelectedId(choice.id); }} disabled={answerState !== "idle"} aria-pressed={selected} className={`flex min-h-[62px] items-center gap-3 rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-default ${correct ? "border-emerald-500 bg-emerald-50" : wrong ? "border-red-300 bg-red-50" : selected ? "border-brand-600 bg-brand-50 ring-1 ring-brand-600" : "border-sage-200 bg-white hover:border-brand-300 hover:bg-sage-50"}`}>
                          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-extrabold ${correct ? "bg-emerald-600 text-white" : wrong ? "bg-red-600 text-white" : selected ? "bg-brand-700 text-white" : "bg-sage-100 text-forest-800"}`}>{String.fromCharCode(65+index)}</span><span className="flex-1 text-sm font-semibold">{choice.label}</span>{correct && <CheckCircle2 className="h-5 w-5 text-emerald-700"/>}{wrong && <XCircle className="h-5 w-5 text-red-700"/>}
                        </button>;
                      })}
                    </div>
                  </div>
                  {answerState === "wrong" && <div role="status" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4"><div className="flex items-center gap-2 font-bold text-red-800"><XCircle className="h-5 w-5"/> Not quite — investigate again</div><p className="mt-1 text-sm leading-6 text-red-800">That location does not match all the clues. Re-read the field notes or reveal another hint, then try another option. Your mission is not over.</p><Button variant="secondary" size="sm" className="mt-3" onClick={resetAfterWrong}>Try another answer</Button></div>}
                  {answerState === "correct" && <div role="status" className="mt-4 space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2 font-bold text-emerald-900"><CheckCircle2 className="h-5 w-5"/> Mystery solved!</div><span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-extrabold text-emerald-800">+{earnedForCurrent} XP</span></div><p className="text-sm leading-6 text-emerald-950">{mission.explanation}</p><div className="rounded-lg bg-white/80 p-3"><div className="text-xs font-bold uppercase tracking-wide text-emerald-800">Remember this</div><p className="mt-1 text-sm leading-6 text-forest-800">{mission.takeaway}</p></div><Button onClick={nextMission} className="w-full sm:w-auto">{missionIndex === GEO_DETECTIVE_MISSIONS.length - 1 ? "Complete case file" : "Next mystery"}<ArrowRight className="h-4 w-4"/></Button></div>}
                  {answerState === "idle" && <Button onClick={submitAnswer} disabled={!selectedId} className="mt-5 w-full sm:w-auto">Check location <ArrowRight className="h-4 w-4"/></Button>}
                </CardBody></Card>
              </div>

              <div className="space-y-5 xl:sticky xl:top-4">
                <IndiaStateMap mission={mission} selectedId={selectedId} answerState={answerState} onSelect={(id) => { if (answerState === "idle") setSelectedId(id); }}/>
                <Card><CardBody className="p-5">
                  <div className="flex items-center justify-between gap-3"><div><div className="text-xs font-bold uppercase tracking-wide text-forest-500">Detective notebook</div><h3 className="mt-1 text-lg font-extrabold">Your field notes</h3></div><BookOpen className="h-5 w-5 text-brand-700"/></div>
                  <p className="mt-2 text-sm leading-6 text-forest-600">Keep the key fact from each case close. The complete explanation unlocks after you solve the mystery.</p>
                  <button type="button" onClick={() => setShowNotebook((value) => !value)} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl border border-sage-300 px-3 text-sm font-semibold text-forest-800 hover:bg-sage-50">{showNotebook ? "Hide mission reference" : "View mission reference"}<ArrowRight className={`h-4 w-4 transition-transform ${showNotebook ? "rotate-90" : ""}`}/></button>
                  {showNotebook && <div className="mt-3 rounded-xl bg-sand-50 p-3 text-sm leading-6 text-forest-800"><div className="font-bold">{mission.chapter}</div><div className="mt-1">{answerState === "correct" ? mission.takeaway : "Use the clues to connect location, physical features and geographical processes. A detailed note unlocks after the answer."}</div></div>}
                </CardBody></Card>
                <div className="flex items-start gap-3 rounded-xl border border-sage-200 bg-white p-4 text-xs leading-5 text-forest-600"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-700"/><p><strong className="text-forest-900">Learning note:</strong> State and union-territory outlines are simplified from the supplied boundary dataset. Lettered markers show approximate positions of geographical features, not their exact boundaries; do not use this game map for measurement or navigation.</p></div>
                <button type="button" onClick={() => { if (window.confirm("Restart this game? Your current unsaved round score will be cleared.")) { setStarted(false); setFinished(false); setTimedOut(false); } }} className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-forest-500 hover:text-forest-900"><RotateCcw className="h-4 w-4"/> Restart game</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
