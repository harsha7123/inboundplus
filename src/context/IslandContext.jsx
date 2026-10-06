import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import Icon from "../components/Icon";

/* Dynamic Island notifications.
   const island = useIsland();
   island.notify("Saved");                                   // simple message
   const job = island.notify("Deploying…", { icon: "rocket", progress: true, persist: true });
   job.update("Testing…", 60); job.done("Live!");            // progress flow */

const IslandCtx = createContext(null);

export function IslandProvider({ children }) {
  const [st, setSt] = useState({ show: false, open: false, text: "", icon: "check", progress: false, pct: 0 });
  const timer = useRef();

  const close = useCallback((ms) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setSt((s) => ({ ...s, open: false }));
      timer.current = setTimeout(() => setSt((s) => ({ ...s, show: false, progress: false })), 450);
    }, ms);
  }, []);

  const notify = useCallback((text, opts = {}) => {
    clearTimeout(timer.current);
    setSt({ show: true, open: false, text, icon: opts.icon || "check", progress: !!opts.progress, pct: opts.pct || 0 });
    setTimeout(() => setSt((s) => (s.show ? { ...s, open: true } : s)), 30); // let the collapsed pill paint first, then expand
    if (!opts.persist) close(2600);
    return {
      update: (t, pct) => { clearTimeout(timer.current); setSt((s) => ({ ...s, text: t ?? s.text, pct: pct ?? s.pct })); },
      done: (t) => {
        setSt((s) => ({ ...s, text: t ?? s.text, pct: 100, icon: "check" }));
        setTimeout(() => setSt((s) => ({ ...s, progress: false })), 400);
        close(2200);
      },
    };
  }, [close]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const cls = ["island", st.show && "show", st.open && "open", st.progress && "progress"].filter(Boolean).join(" ");
  return (
    <IslandCtx.Provider value={{ notify }}>
      {children}
      <div className={cls} role="status" aria-live="polite">
        <span className="i-ico"><Icon name={st.icon} /></span>
        <span className="i-text">{st.text}</span>
        {!st.progress && <span className="i-dot" />}
        <span className="i-bar"><div style={{ width: `${st.pct}%` }} /></span>
      </div>
    </IslandCtx.Provider>
  );
}

export const useIsland = () => useContext(IslandCtx);
