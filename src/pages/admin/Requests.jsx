import { PageHead } from "../../components/ui";
import { RequestsSection } from "./sections";

export default function Requests() {
  return (
    <>
      <PageHead title="Requests" sub="Everything clients have asked for. Update the status and the client sees it in their portal." />
      <RequestsSection orgId={null} title="All client requests" />
    </>
  );
}
