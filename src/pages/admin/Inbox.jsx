import { useEffect, useState } from "react";
import { Empty } from "../../components/shared";
import { PageHead } from "../../components/ui";
import { ago, useOrgs, useTable } from "../../lib/useData";
import { ChatSection } from "./sections";

export default function Inbox() {
  const orgs = useOrgs().rows;
  const messages = useTable("messages", null).rows;
  const [cur, setCur] = useState(null);

  // conversations ordered by latest message
  const threads = orgs.map((o) => {
    const ms = messages.filter((m) => m.org_id === o.id);
    return { org: o, last: ms[0], count: ms.length };
  }).sort((a, b) => ((a.last?.created_at || "") < (b.last?.created_at || "") ? 1 : -1));
  useEffect(() => { if (!cur && threads[0]) setCur(threads[0].org.id); }, [threads, cur]);
  const active = orgs.find((o) => o.id === cur);

  return (
    <>
      <PageHead title="Messages" sub="Conversations with every client. Replies appear in their portal." />
      <div className="grid g-12">
        <div className="panel" style={{ padding: 0, maxHeight: 620, overflowY: "auto" }}>
          {threads.length ? threads.map(({ org, last }) => (
            <div key={org.id} className={`thread-item ${org.id === cur ? "active" : ""}`} onClick={() => setCur(org.id)}>
              <div className="flex"><div className="avatar sm">{org.name.slice(0, 2).toUpperCase()}</div>
                <div className="grow"><b>{org.name} {last?.sender_role === "client" && <span className="dot" style={{ color: "var(--red)" }} title="Waiting for reply" />}</b><small>{last ? ago(last.created_at) : "No messages yet"}</small></div></div>
              {last && <small style={{ display: "block", marginTop: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{last.sender_name}: {last.body}</small>}
            </div>
          )) : <Empty icon="chat" title="No clients yet" />}
        </div>
        {active ? <ChatSection key={active.id} orgId={active.id} orgLabel={active.name} /> : <div className="panel"><Empty icon="chat" title="Pick a conversation" /></div>}
      </div>
    </>
  );
}
