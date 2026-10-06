import { useEffect, useRef, useState } from "react";
import { Bar } from "react-chartjs-2";
import { useLocation, useNavigate } from "react-router-dom";
import Icon from "../../components/Icon";
import { PageHead, Panel, Switch, Tilt } from "../../components/ui";
import { useIsland } from "../../context/IslandContext";
import { usePortal } from "../../context/PortalContext";
import D from "../../data";
import { C, pct } from "../../lib/utils";

/* Scripted demo replies. Replace `reply()` with a call to your agent backend (e.g. Claude API via a serverless function). */
const A = D.analytics, n = A.revenue.length;
const ST = { rev: pct(A.revenue[n - 1], A.revenue[n - 2]).toFixed(1), ord: pct(A.orders[n - 1], A.orders[n - 2]).toFixed(0), conv: A.convRate[n - 1] };
const REPLIES = {
  a1: [[/order|pedido|where/i, "I can check that! Order #A-48213 shipped yesterday and should arrive in Lima on Thursday. Want the tracking link?"],
       [/return|devol|exchange/i, "No problem — returns are free within 30 days. I've started a return for you; you'll get a prepaid label by email in a few minutes."],
       [/size|talla/i, "The Trail Runner X2 fits true to size. If you're between sizes, most customers go half a size up."],
       [/./, "Hi! I'm Sofía, Andes Outdoor's assistant. I can help with orders, returns, sizing and product questions."]],
  a2: [[/./, "Here are 3 ad variants for Trail Runner X2:\n\n1. “Built for the Andes. Ready for your weekend.” — CTA: Shop now\n2. “Grip that doesn't quit, from Lima to Cusco.” — CTA: Find your size\n3. “Free shipping today on your next trail shoe.” — CTA: Get yours\n\nVariant 2 matches your best-performing angle (local pride)."]],
  a3: [[/revenue|sales|ventas/i, `Revenue this month is up ${ST.rev}% vs September, driven mainly by organic search and Meta retargeting (ROAS 6.9×). Mobile conversion is still well below desktop — the one-page checkout test should close part of that gap.`],
       [/seo|rank/i, "SEO is trending well: 5 of 8 tracked keywords improved. “zapatillas trail running” moved from #7 to #3. The biggest open issue is 14 product pages missing meta descriptions."],
       [/ads|roas|campaign/i, "Blended ROAS is 4.6×. I'd pause TikTok Awareness (1.8×) and move ~$800 to Meta Retargeting, which is under-funded at 6.9×."],
       [/./, `Weekly summary: revenue +${ST.rev}%, orders +${ST.ord}%, conversion ${ST.conv}%. Top product: Trail Runner X2. Recommended focus: mobile checkout UX and Black Friday prep. Ask me about revenue, SEO or ads.`]],
  a4: [[/./, "Draft reply to a 4★ review: “Thanks so much, María! We're glad the hoodie keeps you warm. Sorry the delivery took longer than expected — we've added a new courier for Arequipa to speed things up.”"]],
};
const SUGGEST = { a1: ["Where is my order?", "I want to return shoes", "What size should I get?"], a2: ["Write ads for Trail Runner X2"], a3: ["How is revenue doing?", "How is SEO trending?", "What should we do with ads?"], a4: ["Reply to latest review"] };
const reply = (id, text) => REPLIES[id].find(([re]) => re.test(text))[1];
const greet = (id) => REPLIES[id][REPLIES[id].length - 1][1];

export default function Agents() {
  const { state, update } = usePortal();
  const island = useIsland();
  const nav = useNavigate();
  const loc = useLocation();
  const [cur, setCur] = useState(loc.state?.agent || "a3");
  const [msgs, setMsgs] = useState([]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const log = useRef(null), timer = useRef();

  useEffect(() => { setMsgs([{ me: false, t: greet(cur) }]); setTyping(false); clearTimeout(timer.current); }, [cur]);
  useEffect(() => { if (log.current) log.current.scrollTop = 1e6; }, [msgs, typing]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const send = (text) => {
    if (!text.trim()) return;
    setMsgs((m) => [...m, { me: true, t: text }]); setInput(""); setTyping(true);
    timer.current = setTimeout(() => { setTyping(false); setMsgs((m) => [...m, { me: false, t: reply(cur, text) }]); }, 900 + Math.random() * 600);
  };
  const toggle = (a, on) => {
    update("agents", (as) => as.map((x) => (x.id === a.id ? { ...x, active: on } : x)));
    island.notify(`${a.name} ${on ? "activated" : "paused"}`, { icon: "bot" });
  };
  const agent = state.agents.find((a) => a.id === cur);

  return (
    <>
      <PageHead title="AI agents" sub="Claude-powered agents working for your brand — monitor them and test them live.">
        <button className="btn btn-ghost" onClick={() => nav("/portal/software")}><Icon name="plus" size={16} /> Add an agent</button>
      </PageHead>
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))" }}>
        {state.agents.map((a) => (
          <Tilt key={a.id} className={`panel agent-card ${a.id === cur ? "selected" : ""}`} onClick={() => setCur(a.id)}>
            <div className="flex between"><div className={`avatar ${a.active ? "green" : ""}`}><Icon name="bot" size={18} /></div><Switch checked={a.active} onChange={(on) => toggle(a, on)} title="Enable / pause" /></div>
            <div><b>{a.name}</b><br /><small className="muted">{a.channel}</small></div>
            <div className="agent-stats"><div><b>{a.convos.toLocaleString()}</b>chats</div><div><b>{a.resolved}%</b>resolved</div><div><b>{a.csat}★</b>CSAT</div></div>
          </Tilt>
        ))}
      </div>
      <div className="grid g-12">
        <Panel title="Conversations this week" sub="All agents">
          <div className="chart-box">
            <Bar data={{ labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], datasets: [
              { label: "Resolved by AI", data: [212, 240, 228, 260, 301, 342, 259], backgroundColor: C.orange, borderRadius: 4 },
              { label: "Handed to team", data: [28, 31, 25, 33, 36, 40, 30], backgroundColor: C.peach, borderRadius: 4 },
            ] }} options={{ scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, grid: { color: C.grid } } } }} />
          </div>
          <div className="list" style={{ marginTop: 8 }}>
            <div className="list-item"><span className="grow">Avg. first response</span><b>4 sec</b></div>
            <div className="list-item"><span className="grow">Handed off to humans</span><b>11%</b></div>
            <div className="list-item"><span className="grow">Abandoned carts recovered</span><b>142</b></div>
          </div>
        </Panel>
        <Panel title={`Chat with ${agent.name}`} sub="Test your agent with sample questions" className="chat">
          <div className="suggests">{SUGGEST[cur].map((s) => <button key={s} className="chip" type="button" onClick={() => send(s)}>{s}</button>)}</div>
          <div className="chat-log" ref={log}>
            {msgs.map((m, i) => <div key={i} className={`msg ${m.me ? "me" : "bot"}`}>{m.t}<small>{m.me ? "You" : "Agent"} · now</small></div>)}
            {typing && <div className="msg bot"><span className="typing"><i /><i /><i /></span></div>}
          </div>
          <form className="chat-input" onSubmit={(e) => { e.preventDefault(); send(input); }}>
            <input className="input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message…" autoComplete="off" />
            <button className="btn btn-primary" aria-label="Send"><Icon name="send" size={18} /></button>
          </form>
        </Panel>
      </div>
    </>
  );
}
