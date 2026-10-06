import { useState } from "react";
import Icon from "../../components/Icon";
import { Chips, PageHead, Tilt } from "../../components/ui";
import D from "../../data";

const CATS = ["All", ...new Set(D.blog.map((b) => b.cat))];

export default function Blog() {
  const [cat, setCat] = useState("All");
  return (
    <>
      <PageHead title="Blog & insights" sub="Articles and ebooks from the InboundPlus team." />
      <Chips options={CATS} value={cat} onChange={setCat} align="flex-start" />
      <div className="grid g-3">
        {D.blog.filter((b) => cat === "All" || b.cat === cat).map((b) => (
          <Tilt as="a" key={b.id} className="card blog-card fade-in" href={b.url} target="_blank" rel="noopener noreferrer" style={{ color: "inherit" }}>
            <div className="blog-thumb"><Icon name={b.icon} /></div>
            <div className="blog-body">
              <div className="blog-meta"><span className="badge gray">{b.cat}</span><span>{b.lang}</span><span>inboundplus.agency ↗</span></div>
              <h3>{b.title}</h3><p>{b.excerpt}</p>
            </div>
          </Tilt>
        ))}
      </div>
    </>
  );
}
