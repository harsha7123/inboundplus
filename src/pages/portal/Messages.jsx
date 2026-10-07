import { useEffect } from "react";
import { ChatThread } from "../../components/shared";
import { PageHead } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { useIsland } from "../../context/IslandContext";
import D from "../../data";
import { useDb, useTable } from "../../lib/useData";
import { store } from "../../lib/utils";

export default function Messages() {
  const { session } = useAuth();
  const db = useDb();
  const island = useIsland();
  const orgId = session.orgId || undefined;
  const { rows } = useTable("messages", orgId);

  // mark conversation as read
  useEffect(() => { if (orgId) store.set(`seen_${orgId}`, new Date().toISOString()); }, [orgId, rows.length]);

  const send = async (body) => {
    if (!orgId) return island.notify("Your workspace is not set up yet", { icon: "x" });
    try { await db.insert("messages", { org_id: orgId, sender_role: "client", sender_name: session.name, body }); }
    catch (e) { island.notify("Message not sent: " + e.message, { icon: "x" }); }
  };

  return (
    <>
      <PageHead title="Messages" sub="Talk to your InboundPlus team. Replies appear here." />
      <div className="panel">
        <div className="flex" style={{ marginBottom: 12 }}>
          <div className="avatar sm blue">{D.client.manager.initials}</div>
          <div><b>InboundPlus team</b><small className="muted" style={{ display: "block" }}>Account management, strategy and delivery</small></div>
        </div>
        <ChatThread messages={rows} me="client" onSend={send} />
      </div>
    </>
  );
}
