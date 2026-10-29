"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft, ArrowRight, BarChart3, CheckCircle2, Clock3, Coins,
  Lightbulb, RotateCcw, ShieldCheck, ShoppingBasket, TrendingUp,
  Trophy, Wallet, Wheat, XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import {
  calculateTrade, formatMoney, getMarketEquilibrium, getMarketPoint,
  MARKET_SCENARIOS, type MarketRole, type MarketScenario, type MarketTradeResult,
} from "@/lib/learning-games/market-master";

type Mode = "practice" | "challenge";
const BEST_KEY = "eacharya.market-master.best.v1";
const CONTRACT_QUANTITY = 20;

function formatTime(seconds: number) {
  return `${Math.floor(Math.max(0, seconds) / 60)}:${String(Math.max(0, seconds) % 60).padStart(2, "0")}`;
}

function MarketGraph({ scenario }: { scenario: MarketScenario }) {
  const W = 520; const H = 310; const M = { left: 54, right: 20, top: 18, bottom: 43 };
  const plotW = W - M.left - M.right; const plotH = H - M.top - M.bottom;
  const qMax = 130; const pMax = 60;
  const x = (quantity: number) => M.left + Math.max(0, Math.min(qMax, quantity)) / qMax * plotW;
  const y = (price: number) => M.top + plotH - Math.max(0, Math.min(pMax, price)) / pMax * plotH;
  const pathFor = (kind: "demand" | "supply") => {
    const points: string[] = [];
    for (let p = 0; p <= pMax; p += 2) {
      const point = getMarketPoint(scenario, p);
      const q = kind === "demand" ? point.quantityDemanded : point.quantitySupplied;
      points.push(`${points.length === 0 ? "M" : "L"}${x(q).toFixed(1)} ${y(p).toFixed(1)}`);
    }
    return points.join(" ");
  };
  const equilibrium = getMarketEquilibrium(scenario);
  return (
    <div className="rounded-2xl border border-sage-200 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h3 className="font-extrabold text-forest-950">Live market model</h3><p className="mt-1 text-xs text-forest-600">Illustrative model values, not real market data</p></div>
        <div className="flex flex-wrap gap-3 text-xs font-semibold"><span className="flex items-center gap-1.5 text-brand-700"><span className="h-2 w-5 rounded-full bg-brand-600"/>Demand</span><span className="flex items-center gap-1.5 text-forest-900"><span className="h-2 w-5 rounded-full bg-forest-900"/>Supply</span></div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Supply and demand chart for ${scenario.title}. The model equilibrium is ${equilibrium ? `${formatMoney(equilibrium.price, 2)} and ${equilibrium.quantity.toFixed(1)} units` : "not defined"}.`} className="mt-3 h-auto w-full">
        {[0, 15, 30, 45, 60].map((p) => <g key={`p-${p}`}><line x1={M.left} x2={W-M.right} y1={y(p)} y2={y(p)} stroke="#e1ebe3" strokeWidth="1"/><text x={M.left-9} y={y(p)+4} textAnchor="end" fontSize="11" fill="#486255">{p}</text></g>)}
        {[0, 25, 50, 75, 100, 125].map((q) => <g key={`q-${q}`}><line x1={x(q)} x2={x(q)} y1={M.top} y2={H-M.bottom} stroke="#eef3ef" strokeWidth="1"/><text x={x(q)} y={H-M.bottom+17} textAnchor="middle" fontSize="11" fill="#486255">{q}</text></g>)}
        <line x1={M.left} x2={W-M.right} y1={H-M.bottom} y2={H-M.bottom} stroke="#486255" strokeWidth="1.5"/>
        <line x1={M.left} x2={M.left} y1={M.top} y2={H-M.bottom} stroke="#486255" strokeWidth="1.5"/>
        <path d={pathFor("demand")} fill="none" stroke="#0b6b4a" strokeWidth="3.5" strokeLinecap="round"/>
        <path d={pathFor("supply")} fill="none" stroke="#18382b" strokeWidth="3.5" strokeLinecap="round"/>
        {equilibrium && <>
          <line x1={M.left} x2={x(equilibrium.quantity)} y1={y(equilibrium.price)} y2={y(equilibrium.price)} stroke="#d97706" strokeWidth="1.7" strokeDasharray="5 4"/>
          <line x1={x(equilibrium.quantity)} x2={x(equilibrium.quantity)} y1={y(equilibrium.price)} y2={H-M.bottom} stroke="#d97706" strokeWidth="1.7" strokeDasharray="5 4"/>
          <circle cx={x(equilibrium.quantity)} cy={y(equilibrium.price)} r="6" fill="#d97706" stroke="#ffffff" strokeWidth="2"/>
        </>}
        <text x={M.left+4} y={M.top-5} fontSize="11" fill="#486255">Price (₹/kg)</text>
        <text x={M.left+plotW/2} y={H-5} textAnchor="middle" fontSize="12" fontWeight="600" fill="#294637">Quantity (kg-equivalent units)</text>
      </svg>
      {equilibrium && <div className="mt-2 grid grid-cols-2 gap-2"><div className="rounded-xl bg-amber-50 p-3"><div className="text-xs text-amber-800">Model equilibrium price</div><div className="mt-1 text-lg font-extrabold text-forest-950">{formatMoney(equilibrium.price, 2)}</div></div><div className="rounded-xl bg-sage-50 p-3"><div className="text-xs text-forest-600">Equilibrium quantity</div><div className="mt-1 text-lg font-extrabold text-forest-950">{equilibrium.quantity.toFixed(1)} units</div></div></div>}
      <p className="mt-3 text-xs leading-5 text-forest-500">Model schedules: Qd = max(0, 100 + demand shift − 2P); Qs = max(0, supply intercept + P). The curves are simplified for practice.</p>
    </div>
  );
}

function LaunchPanel({ mode, setMode, role, setRole, onStart, bestScore }: {
  mode: Mode; setMode: (mode: Mode) => void; role: MarketRole; setRole: (role: MarketRole) => void; onStart: () => void; bestScore: number;
}) {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="grid gap-6 lg:grid-cols-[1.08fr_.92fr]">
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-forest-900 via-brand-800 to-brand-600 text-white shadow-lift">
          <CardBody className="flex h-full flex-col p-6 sm:p-8">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-100"><TrendingUp className="h-4 w-4"/> ECOLAB MARKET SIMULATION 01</div>
            <h2 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">Welcome to the wheat market.</h2>
            <p className="mt-4 max-w-xl leading-7 text-emerald-50">Negotiate with a simulated market participant, manage your financial limits, complete trades and watch the supply-and-demand model respond to economic events.</p>
            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-white/15 bg-white/10 p-3"><div className="text-2xl font-extrabold">5</div><div className="mt-1 text-xs text-emerald-100">Market rounds</div></div>
              <div className="rounded-xl border border-white/15 bg-white/10 p-3"><div className="text-2xl font-extrabold">20 kg</div><div className="mt-1 text-xs text-emerald-100">Contract size</div></div>
              <div className="rounded-xl border border-white/15 bg-white/10 p-3"><div className="text-2xl font-extrabold">₹10–50</div><div className="mt-1 text-xs text-emerald-100">Offer range/kg</div></div>
            </div>
            <div className="mt-auto pt-7 text-sm text-emerald-100">Learn: price, costs, buyer surplus, seller profit, demand, supply and equilibrium.</div>
          </CardBody>
        </Card>
        <Card><CardBody className="space-y-5 p-6 sm:p-8">
          <div><h3 className="text-xl font-extrabold">Set up your session</h3><p className="mt-1 text-sm text-forest-600">Choose a role and a learning pace.</p></div>
          <div><label className="mb-2 block text-sm font-bold text-forest-900">Your role</label><div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setRole("buyer")} aria-pressed={role === "buyer"} className={`rounded-xl border p-4 text-left ${role === "buyer" ? "border-brand-600 bg-brand-50 ring-1 ring-brand-600" : "border-sage-200 hover:bg-sage-50"}`}><ShoppingBasket className="h-5 w-5 text-brand-700"/><div className="mt-2 font-bold text-forest-950">Buyer</div><p className="mt-1 text-xs leading-5 text-forest-600">Stay within a ₹1,000 budget and your willingness to pay.</p></button>
            <button type="button" onClick={() => setRole("seller")} aria-pressed={role === "seller"} className={`rounded-xl border p-4 text-left ${role === "seller" ? "border-brand-600 bg-brand-50 ring-1 ring-brand-600" : "border-sage-200 hover:bg-sage-50"}`}><Wheat className="h-5 w-5 text-brand-700"/><div className="mt-2 font-bold text-forest-950">Seller</div><p className="mt-1 text-xs leading-5 text-forest-600">Set an asking price that covers unit costs and makes a profit.</p></button>
          </div></div>
          <div><label className="mb-2 block text-sm font-bold text-forest-900">Game mode</label><div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setMode("practice")} aria-pressed={mode === "practice"} className={`rounded-xl border p-3 text-left ${mode === "practice" ? "border-brand-600 bg-brand-50" : "border-sage-200 hover:bg-sage-50"}`}><div className="font-bold text-forest-950">Practice</div><div className="mt-1 text-xs text-forest-600">No timer, detailed feedback</div></button>
            <button type="button" onClick={() => setMode("challenge")} aria-pressed={mode === "challenge"} className={`rounded-xl border p-3 text-left ${mode === "challenge" ? "border-brand-600 bg-brand-50" : "border-sage-200 hover:bg-sage-50"}`}><div className="font-bold text-forest-950">Challenge</div><div className="mt-1 text-xs text-forest-600">5 minutes for 5 rounds</div></button>
          </div></div>
          <div className="flex items-center gap-3 rounded-xl bg-sand-50 p-3"><Trophy className="h-5 w-5 text-amber-600"/><div><div className="text-xs text-forest-600">Best score on this device</div><div className="font-extrabold text-forest-950">{bestScore.toLocaleString()} XP</div></div></div>
          <Button onClick={onStart} className="w-full" size="lg">Enter the market <ArrowRight className="h-4 w-4"/></Button>
          <p className="text-xs leading-5 text-forest-500">All market values are illustrative classroom-model data. Best score is stored in this browser only and is not synced to the teacher dashboard.</p>
        </CardBody></Card>
      </div>
    </div>
  );
}

function EventCard({ scenario }: { scenario: MarketScenario }) {
  return <div className="flex gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-700"><Lightbulb className="h-5 w-5"/></span><div><div className="text-xs font-bold uppercase tracking-wide text-brand-800">Market event</div><h3 className="mt-1 font-extrabold text-forest-950">{scenario.title}</h3><p className="mt-1 text-sm leading-6 text-forest-700">{scenario.subtitle}</p></div></div>;
}

export function MarketMasterGame() {
  const [mode, setMode] = useState<Mode>("practice");
  const [role, setRole] = useState<MarketRole>("buyer");
  const [started, setStarted] = useState(false);
  const [roundIndex, setRoundIndex] = useState(0);
  const [offer, setOffer] = useState(30);
  const [lastResult, setLastResult] = useState<MarketTradeResult | null>(null);
  const [roundLocked, setRoundLocked] = useState(false);
  const [score, setScore] = useState(0);
  const [successfulTrades, setSuccessfulTrades] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const [tradeLog, setTradeLog] = useState<Array<{ round: number; scenario: string; price: number; score: number; value: number }>>([]);
  const [secondsLeft, setSecondsLeft] = useState(300);
  const [finished, setFinished] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [bestScore, setBestScore] = useState(0);
  const scenario = MARKET_SCENARIOS[roundIndex]!;
  const progressPercent = Math.round((roundIndex / MARKET_SCENARIOS.length) * 100);
  const isComplete = finished || timedOut;

  useEffect(() => { try { setBestScore(Number(window.localStorage.getItem(BEST_KEY) ?? 0) || 0); } catch { /* storage may be unavailable */ } }, []);
  useEffect(() => {
    if (!started || mode !== "challenge" || finished || timedOut) return;
    const timer = window.setInterval(() => setSecondsLeft((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [started, mode, finished, timedOut]);
  useEffect(() => {
    if (started && mode === "challenge" && secondsLeft <= 0 && !finished) setTimedOut(true);
  }, [started, mode, secondsLeft, finished]);
  useEffect(() => {
    if (!finished && !timedOut) return;
    if (score > bestScore) { setBestScore(score); try { window.localStorage.setItem(BEST_KEY, String(score)); } catch { /* storage may be unavailable */ } }
  }, [finished, timedOut, score, bestScore]);

  const startGame = useCallback(() => {
    setStarted(true); setRoundIndex(0); setOffer(30); setLastResult(null); setRoundLocked(false); setScore(0); setSuccessfulTrades(0); setTotalValue(0); setTradeLog([]); setSecondsLeft(300); setFinished(false); setTimedOut(false);
  }, []);

  const submitOffer = () => {
    if (roundLocked || isComplete) return;
    const result = calculateTrade(role, offer, scenario, CONTRACT_QUANTITY);
    setLastResult(result);
    if (result.accepted) {
      setRoundLocked(true);
      setScore((value) => value + result.score);
      setSuccessfulTrades((value) => value + 1);
      const economicValue = role === "buyer" ? result.surplus : result.profit;
      setTotalValue((value) => value + economicValue);
      setTradeLog((entries) => [...entries, { round: roundIndex + 1, scenario: scenario.title, price: result.price, score: result.score, value: economicValue }]);
    }
  };

  const nextRound = () => {
    if (roundIndex >= MARKET_SCENARIOS.length - 1) { setFinished(true); return; }
    setRoundIndex((value) => value + 1); setOffer(30); setLastResult(null); setRoundLocked(false);
  };

  const useCounterOffer = () => {
    if (lastResult && !lastResult.accepted && lastResult.counterPrice !== null) { setOffer(lastResult.counterPrice); setLastResult(null); }
  };

  return (
    <div className="min-h-[70vh] bg-sand-50 pb-12">
      <section className="border-b border-sage-200 bg-white"><div className="container-page py-6 sm:py-8">
        <Link href="/economics-lab" className="inline-flex items-center gap-2 text-sm font-semibold text-forest-600 hover:text-brand-700"><ArrowLeft className="h-4 w-4"/> Back to Economics Lab</Link>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-4"><div><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-brand-700"><TrendingUp className="h-4 w-4"/> EcoLab · Interactive Game</div><h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Market Master</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-forest-600 sm:text-base">Negotiate a wheat contract, manage your role&apos;s constraints and see how market shocks shift the supply-and-demand model.</p></div>{started && !isComplete && <div className="flex items-center gap-2 rounded-xl border border-sage-200 bg-sand-50 px-4 py-2.5"><Trophy className="h-5 w-5 text-amber-600"/><div><div className="text-[11px] font-semibold uppercase tracking-wide text-forest-500">Session score</div><div className="text-lg font-extrabold tabular-nums text-forest-950">{score.toLocaleString()} XP</div></div></div>}</div>
      </div></section>
      <div className="container-page pt-6 sm:pt-8">
        {!started ? <LaunchPanel mode={mode} setMode={setMode} role={role} setRole={setRole} onStart={startGame} bestScore={bestScore}/> : isComplete ? (
          <div className="mx-auto max-w-4xl"><Card className="overflow-hidden"><div className="bg-gradient-to-r from-forest-900 to-brand-700 p-7 text-white sm:p-10"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15"><Trophy className="h-8 w-8"/></div><h2 className="mt-5 text-3xl font-extrabold">{finished ? "Market session complete" : "Market closed for this challenge"}</h2><p className="mt-2 max-w-2xl text-emerald-50">{finished ? "Review your trading outcomes and what the market model taught you." : `Your challenge ended after ${roundIndex + 1} of ${MARKET_SCENARIOS.length} rounds.`}</p></div><CardBody className="space-y-6 p-6 sm:p-8">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[{label:"XP earned",value:score.toLocaleString()},{label:"Successful trades",value:`${successfulTrades}/5`},{label:role === "buyer" ? "Buyer surplus" : "Seller profit",value:formatMoney(totalValue)},{label:"Best on device",value:bestScore.toLocaleString()}].map((item) => <div key={item.label} className="rounded-xl bg-sage-50 p-4"><div className="text-xs text-forest-600">{item.label}</div><div className="mt-1 text-2xl font-extrabold text-forest-950">{item.value}</div></div>)}</div>
            <div><h3 className="text-lg font-extrabold">Your trade log</h3>{tradeLog.length === 0 ? <p className="mt-2 text-sm text-forest-600">No contracts were completed this session. Replay in practice mode to test different offers.</p> : <div className="mt-3 overflow-x-auto rounded-xl border border-sage-200"><table className="w-full min-w-[520px] text-left text-sm"><thead className="bg-sage-50 text-xs uppercase tracking-wide text-forest-600"><tr><th className="px-4 py-3">Round</th><th className="px-4 py-3">Market event</th><th className="px-4 py-3">Agreed price/kg</th><th className="px-4 py-3">{role === "buyer" ? "Buyer surplus" : "Seller profit"}</th><th className="px-4 py-3">XP</th></tr></thead><tbody>{tradeLog.map((entry) => <tr key={entry.round} className="border-t border-sage-100"><td className="px-4 py-3 font-bold">{entry.round}</td><td className="px-4 py-3">{entry.scenario}</td><td className="px-4 py-3">{formatMoney(entry.price)}</td><td className="px-4 py-3">{formatMoney(entry.value)}</td><td className="px-4 py-3">{entry.score}</td></tr>)}</tbody></table></div>}</div>
            <div className="rounded-xl border border-brand-200 bg-brand-50 p-4"><h3 className="font-bold text-forest-950">Key learning</h3><p className="mt-1 text-sm leading-6 text-forest-700">A market transaction can benefit both sides when a buyer&apos;s willingness to pay is at least as high as the seller&apos;s minimum acceptable price. The demand-and-supply graph models the wider market; a single negotiated contract does not set the entire market equilibrium by itself.</p></div>
            <div className="flex flex-wrap gap-3"><Button onClick={startGame}><RotateCcw className="h-4 w-4"/> Play again</Button><Link href="/economics-lab" className="inline-flex h-11 items-center justify-center rounded-xl border border-sage-300 bg-white px-5 text-sm font-semibold text-forest-900 hover:bg-sage-50">Return to EcoLab</Link></div><p className="text-xs text-forest-500">Score and best result are stored on this device only. No Supabase schema or teacher reporting has been changed.</p>
          </CardBody></Card></div>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-sage-200 bg-white p-4"><div className="text-xs font-semibold uppercase tracking-wide text-forest-500">Market round</div><div className="mt-1 flex items-end justify-between"><span className="text-2xl font-extrabold">{String(roundIndex+1).padStart(2,"0")}<span className="text-base text-forest-500"> / 05</span></span><BarChart3 className="h-5 w-5 text-brand-700"/></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-sage-100"><div className="h-full rounded-full bg-brand-600 transition-all" style={{width:`${progressPercent}%`}}/></div></div>
              <div className="rounded-2xl border border-sage-200 bg-white p-4"><div className="text-xs font-semibold uppercase tracking-wide text-forest-500">Session score</div><div className="mt-1 text-2xl font-extrabold tabular-nums">{score.toLocaleString()}<span className="text-base text-forest-500"> XP</span></div><div className="mt-1 text-xs text-forest-500">Best: {bestScore.toLocaleString()} XP</div></div>
              <div className="rounded-2xl border border-sage-200 bg-white p-4"><div className="text-xs font-semibold uppercase tracking-wide text-forest-500">Role</div><div className="mt-1 flex items-center gap-2 text-2xl font-extrabold capitalize">{role}<span className="rounded-lg bg-brand-50 p-2 text-brand-700">{role === "buyer" ? <ShoppingBasket className="h-4 w-4"/> : <Wheat className="h-4 w-4"/>}</span></div><div className="mt-1 text-xs text-forest-500">{role === "buyer" ? "Budget ₹1,000 / contract" : `Unit cost ${formatMoney(scenario.sellerCost)}/kg`}</div></div>
              <div className={`rounded-2xl border p-4 ${mode === "challenge" ? "border-amber-200 bg-amber-50" : "border-sage-200 bg-white"}`}><div className="text-xs font-semibold uppercase tracking-wide text-forest-500">{mode === "challenge" ? "Time left" : "Successful trades"}</div><div className="mt-1 flex items-center gap-2 text-2xl font-extrabold tabular-nums">{mode === "challenge" ? formatTime(secondsLeft) : `${successfulTrades}/5`}{mode === "challenge" ? <Clock3 className="h-5 w-5 text-amber-700"/> : <CheckCircle2 className="h-5 w-5 text-emerald-700"/>}</div><div className="mt-1 text-xs text-forest-500">{mode === "challenge" ? "5 minute challenge" : "Complete each contract"}</div></div>
            </div>
            <EventCard scenario={scenario}/>
            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,.92fr)_minmax(0,1.08fr)]">
              <div className="space-y-5">
                <Card><CardBody className="space-y-5 p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-xs font-bold uppercase tracking-wide text-brand-700">Round {roundIndex+1} negotiation</div><h2 className="mt-1 text-2xl font-extrabold">{role === "buyer" ? "Make a buying offer" : "Set your asking price"}</h2></div><span className="rounded-full bg-sage-100 px-3 py-1 text-xs font-bold text-forest-800">{CONTRACT_QUANTITY} kg wheat</span></div>
                  <p className="text-sm leading-6 text-forest-600">{role === "buyer" ? `You have ₹1,000 for this contract. The market's simulated seller has a minimum viable price of ${formatMoney(scenario.sellerCost)} per kg, while your willingness-to-pay limit is ${formatMoney(scenario.buyerMax)}.` : `You have ${CONTRACT_QUANTITY} kg available. Your simulated unit cost is ${formatMoney(scenario.sellerCost)} and the buyer's willingness-to-pay limit is ${formatMoney(scenario.buyerMax)} per kg.`}</p>
                  <div className="rounded-2xl bg-brand-50 p-4"><div className="flex items-start justify-between gap-3"><div><div className="text-xs font-bold uppercase tracking-wide text-brand-800">Your offer</div><div className="mt-1 text-3xl font-extrabold text-forest-950">{formatMoney(offer)}<span className="text-base font-semibold text-forest-600"> / kg</span></div></div><div className="rounded-xl bg-white p-3 text-right"><div className="text-xs text-forest-600">Contract total</div><div className="mt-1 text-lg font-extrabold text-forest-950">{formatMoney(offer * CONTRACT_QUANTITY)}</div></div></div>
                    <label htmlFor="market-price" className="mt-4 block text-sm font-semibold text-forest-800">Adjust price per kilogram</label><input id="market-price" type="range" min={10} max={50} step={1} value={offer} onChange={(event) => { setOffer(Number(event.target.value)); if (!roundLocked) setLastResult(null); }} disabled={roundLocked} className="mt-3 w-full accent-brand-700" aria-valuetext={`${formatMoney(offer)} per kilogram`}/><div className="mt-1 flex justify-between text-xs text-forest-600"><span>₹10 / kg</span><span>₹30 reference</span><span>₹50 / kg</span></div>
                    <div className="mt-3 flex flex-wrap gap-2">{[20,25,30,35,40].map((value) => <button type="button" key={value} onClick={() => {setOffer(value); if (!roundLocked) setLastResult(null);}} disabled={roundLocked} className={`min-h-10 rounded-lg border px-3 text-sm font-semibold disabled:opacity-50 ${offer === value ? "border-brand-700 bg-brand-700 text-white" : "border-sage-300 bg-white text-forest-800 hover:bg-sage-50"}`}>{formatMoney(value)}</button>)}</div>
                    <div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-xl border border-white bg-white p-3"><div className="text-xs text-forest-600">{role === "buyer" ? "Budget remaining if accepted" : "Revenue if accepted"}</div><div className="mt-1 font-extrabold text-forest-950">{role === "buyer" ? formatMoney(Math.max(0,1000-offer*CONTRACT_QUANTITY)) : formatMoney(offer*CONTRACT_QUANTITY)}</div></div><div className="rounded-xl border border-white bg-white p-3"><div className="text-xs text-forest-600">{role === "buyer" ? "Buyer surplus if accepted" : "Seller profit if accepted"}</div><div className="mt-1 font-extrabold text-forest-950">{role === "buyer" ? formatMoney((scenario.buyerMax-offer)*CONTRACT_QUANTITY) : formatMoney((offer-scenario.sellerCost)*CONTRACT_QUANTITY)}</div></div></div>
                  </div>
                  {!roundLocked && <Button onClick={submitOffer} className="w-full" size="lg">Submit offer <ArrowRight className="h-4 w-4"/></Button>}
                  {lastResult && !lastResult.accepted && <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4"><div className="flex items-start gap-2"><XCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700"/><div><div className="font-bold text-forest-950">Offer not accepted</div><p className="mt-1 text-sm leading-6 text-forest-700">{lastResult.reason}</p>{lastResult.counterPrice !== null && <Button variant="secondary" size="sm" className="mt-3" onClick={useCounterOffer}>Try counter-offer at {formatMoney(lastResult.counterPrice)}/kg</Button>}</div></div></div>}
                  {lastResult?.accepted && <div role="status" className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4"><div className="flex items-center gap-2 font-bold text-emerald-900"><CheckCircle2 className="h-5 w-5"/> Contract accepted <span className="ml-auto text-sm font-extrabold">+{lastResult.score} XP</span></div><p className="text-sm leading-6 text-emerald-900">{lastResult.reason}</p><div className="rounded-lg bg-white/80 p-3"><div className="text-xs font-bold uppercase tracking-wide text-emerald-800">Your outcome</div>{role === "buyer" ? <p className="mt-1 text-sm text-forest-800">Purchase cost: {formatMoney(lastResult.cost)}. Value at your willingness-to-pay limit: {formatMoney(scenario.buyerMax*CONTRACT_QUANTITY)}. Buyer surplus: <strong>{formatMoney(lastResult.surplus)}</strong>.</p> : <p className="mt-1 text-sm text-forest-800">Revenue: {formatMoney(lastResult.revenue)}. Total unit cost: {formatMoney(lastResult.cost)}. Trading profit: <strong>{formatMoney(lastResult.profit)}</strong>.</p>}</div><p className="text-sm leading-6 text-emerald-900">{scenario.explanation}</p><Button onClick={nextRound} className="w-full">{roundIndex === MARKET_SCENARIOS.length-1 ? "Finish market session" : "Next market round"}<ArrowRight className="h-4 w-4"/></Button></div>}
                </CardBody></Card>
                <Card><CardBody className="p-5"><div className="flex items-center gap-2"><Wallet className="h-5 w-5 text-brand-700"/><h3 className="font-extrabold">Market rules</h3></div><ul className="mt-3 space-y-2 text-sm leading-6 text-forest-700"><li className="flex gap-2"><span className="font-extrabold text-brand-700">01</span><span>Buyer offer must fit the available budget and willingness-to-pay limit.</span></li><li className="flex gap-2"><span className="font-extrabold text-brand-700">02</span><span>Seller asking price must cover the unit cost to avoid a loss in this starter mode.</span></li><li className="flex gap-2"><span className="font-extrabold text-brand-700">03</span><span>A contract is accepted only when both sides can agree within their limits. A counter-offer does not automatically complete a trade.</span></li></ul></CardBody></Card>
              </div>
              <div className="space-y-5 xl:sticky xl:top-4"><MarketGraph scenario={scenario}/>
                <Card><CardBody className="p-5"><div className="flex items-center gap-2"><Coins className="h-5 w-5 text-brand-700"/><h3 className="font-extrabold">Economics field guide</h3></div><div className="mt-3 space-y-3 text-sm leading-6 text-forest-700"><div><strong className="text-forest-950">Demand:</strong> at a lower price, quantity demanded is generally higher, other things equal.</div><div><strong className="text-forest-950">Supply:</strong> at a higher price, quantity supplied is generally higher, other things equal.</div><div><strong className="text-forest-950">Equilibrium:</strong> in this model, it is the price where quantity demanded equals quantity supplied.</div><div><strong className="text-forest-950">Surplus vs profit:</strong> buyer surplus compares willingness to pay with purchase price; seller profit compares revenue with cost.</div></div></CardBody></Card>
                <div className="flex items-start gap-3 rounded-xl border border-sage-200 bg-white p-4 text-xs leading-5 text-forest-600"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-700"/><p><strong className="text-forest-900">Model disclaimer:</strong> prices, costs and market schedules are fictional values designed for learning. Real markets contain more buyers, sellers, uncertainty and institutional conditions than this simple negotiation.</p></div>
                <button type="button" onClick={() => { if (window.confirm("Restart the market session? Your current unsaved score will be cleared.")) { setStarted(false); setFinished(false); setTimedOut(false); } }} className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-forest-500 hover:text-forest-900"><RotateCcw className="h-4 w-4"/> Restart session</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
