import { useState } from "react";
import { Bar } from "react-chartjs-2";
import { PageHead, Panel, StatusBadge } from "../../components/ui";
import { useIsland } from "../../context/IslandContext";
import { usePortal } from "../../context/PortalContext";
import D from "../../data";
import { axes } from "../../lib/charts";
import { C } from "../../lib/utils";

export default function Surveys() {
  const { state, update } = usePortal();
  const island = useIsland();
  const R = state.survey;
  const [nps, setNps] = useState(null), [sat, setSat] = useState(null), [prio, setPrio] = useState(null), [comment, setComment] = useState(""), [err, setErr] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (R.submitted) return;
    if (nps == null || sat == null || !prio) return setErr("Please answer questions 1–3.");
    const responses = R.responses + 1;
    update("survey", {
      ...R, responses, submitted: true,
      satisfaction: R.satisfaction.map((v, i) => (i === sat - 1 ? v + 1 : v)),
      priorities: { ...R.priorities, [prio]: R.priorities[prio] + 1 },
      nps: Math.round(R.nps + ((nps >= 9 ? 100 : nps <= 6 ? -100 : 0) - R.nps) / responses),
      comment,
    });
    setErr(""); island.notify("Thank you! Your feedback was recorded", { icon: "survey" });
  };

  return (
    <>
      <PageHead title="Surveys" sub="Tell us how we're doing — results update live." />
      <div className="grid g-2">
        <Panel title={D.survey.title} sub="Takes about 1 minute" actions={<StatusBadge s={R.submitted ? "Submitted" : "Open"} />}>
          <form onSubmit={submit}>
            <div className="survey-q"><h4>1. How likely are you to recommend InboundPlus to a colleague? (0–10)</h4>
              <div className="stars" style={{ flexWrap: "wrap" }}>{Array.from({ length: 11 }, (_, i) => (
                <button type="button" key={i} className={nps === i ? "on" : ""} style={{ width: 36, height: 36 }} onClick={() => setNps(i)}>{i}</button>
              ))}</div></div>
            <div className="survey-q"><h4>2. Overall satisfaction this quarter</h4>
              <div className="stars">{[1, 2, 3, 4, 5].map((i) => <button type="button" key={i} className={sat >= i ? "on" : ""} onClick={() => setSat(i)}>{i}★</button>)}</div></div>
            <div className="survey-q"><h4>3. What should we prioritise next?</h4>
              {Object.keys(R.priorities).map((p) => <label className="opt" key={p}><input type="radio" name="prio" checked={prio === p} onChange={() => setPrio(p)} /> {p}</label>)}</div>
            <div className="survey-q"><h4>4. Anything else?</h4><textarea className="input" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Optional" /></div>
            <div className="form-error">{err}</div>
            <button className="btn btn-primary" disabled={R.submitted}>{R.submitted ? "Thanks — response recorded" : "Submit response"}</button>
          </form>
        </Panel>
        <Panel title="Live results" sub={`${R.responses} responses`}
          actions={<div style={{ textAlign: "right" }}><small className="muted">NPS</small><div style={{ fontSize: 30, fontWeight: 600, color: "var(--navy)" }}>{R.nps}</div></div>}>
          <div className="chart-box sm">
            <Bar data={{ labels: ["1★", "2★", "3★", "4★", "5★"], datasets: [{ label: "Responses", data: R.satisfaction, backgroundColor: [C.red, C.amber, C.gray, C.peach, C.orange], borderRadius: 5 }] }}
              options={{ plugins: { legend: { display: false }, title: { display: true, text: "Satisfaction" } }, scales: axes() }} />
          </div>
          <div className="chart-box sm" style={{ marginTop: 16 }}>
            <Bar data={{ labels: Object.keys(R.priorities), datasets: [{ data: Object.values(R.priorities), backgroundColor: C.purple, borderRadius: 5 }] }}
              options={{ indexAxis: "y", plugins: { legend: { display: false }, title: { display: true, text: "Priorities" } }, scales: { x: { grid: { color: C.grid } }, y: { grid: { display: false } } } }} />
          </div>
        </Panel>
      </div>
    </>
  );
}
