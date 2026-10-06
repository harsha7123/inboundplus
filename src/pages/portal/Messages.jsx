import { useEffect, useRef, useState } from "react";
import { PageHead } from "../../components/ui";
import { usePortal } from "../../context/PortalContext";

export default function Messages() {
  const { state, update } = usePortal();
  const [cur, setCur] = useState(state.threads[0].id);
  const [text, setText] = useState("");
  const log = useRef(null);
  const thread = state.threads.find((t) => t.id === cur);

  const patch = (id, fn) => update("threads", (ts) => ts.map((t) => (t.id === id ? fn(t) : t)));
  useEffect(() => { if (thread.unread) patch(cur, (t) => ({ ...t, unread: false })); }, [cur]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (log.current) log.current.scrollTop = 1e6; }, [thread.msgs.length, cur]);

  const send = (e) => {
    e.preventDefault();
    const t = text.trim(); if (!t) return;
    const id = cur;
    patch(id, (th) => ({ ...th, msgs: [...th.msgs, { me: true, t, at: "now" }] }));
    setText("");
    setTimeout(() => patch(id, (th) => ({ ...th, msgs: [...th.msgs, { me: false, t: "Thanks! I've got it and will get back to you shortly. 👍", at: "now" }] })), 1400);
  };

  return (
    <>
      <PageHead title="Messages" sub="Talk to your InboundPlus team." />
      <div className="panel" style={{ padding: 0 }}>
        <div className="thread">
          <div className="thread-list">
            {state.threads.map((t) => (
              <div key={t.id} className={`thread-item ${t.id === cur ? "active" : ""}`} onClick={() => setCur(t.id)}>
                <div className="flex"><div className={`avatar sm ${t.initials === "IP" ? "" : "blue"}`}>{t.initials}</div>
                  <div className="grow"><b>{t.with} {t.unread && <span className="dot" style={{ color: "var(--red)" }} />}</b><small>{t.role}</small></div></div>
                <small style={{ display: "block", marginTop: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.msgs[t.msgs.length - 1].t}</small>
              </div>
            ))}
          </div>
          <div className="thread-main chat" style={{ paddingRight: 18, paddingTop: 16, height: "100%" }}>
            <div className="chat-log" ref={log}>
              {thread.msgs.map((m, i) => <div key={i} className={`msg ${m.me ? "me" : "bot"}`}>{m.t}<small>{m.me ? "You" : thread.with} · {m.at}</small></div>)}
            </div>
            <form className="chat-input" onSubmit={send} style={{ paddingBottom: 16 }}>
              <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message…" autoComplete="off" />
              <button className="btn btn-primary">Send</button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
