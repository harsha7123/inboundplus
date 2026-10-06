import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/Icon";
import { BarScene, Chips, Tilt } from "../components/ui";
import D from "../data";
import { PALETTE_HEX } from "../lib/utils";

const SITE = "https://inboundplus.agency/";
const unique = (arr) => ["All", ...new Set(arr)];

function SoftwareCard({ s }) {
  return (
    <Tilt className="card sw-card fade-in">
      <div className="sw-top"><span className="badge blue">{s.cat}</span>{s.status && <span className={`badge ${s.status === "New" ? "green" : "amber"}`}>{s.status}</span>}</div>
      <h3>{s.name}</h3><p>{s.desc}</p>
      <ul>{s.bullets.map((b) => <li key={b}>{b}</li>)}</ul>
      <div className="flex between" style={{ marginTop: "auto", paddingTop: 10 }}>
        <b style={{ color: "var(--navy)", fontSize: 14 }}>{s.price}</b>
        <Link className="btn btn-sm btn-ghost" to="/login">Request</Link>
      </div>
    </Tilt>
  );
}

export default function Home() {
  const [navOpen, setNavOpen] = useState(false);
  const [swCat, setSwCat] = useState("All");
  const [blogCat, setBlogCat] = useState("All");
  useEffect(() => { document.title = "InboundPlus Client Hub"; }, []);
  const m6 = D.months.slice(-6);

  return (
    <>
      <nav className={`site-nav ${navOpen ? "open" : ""}`}>
        <div className="wrap">
          <Link className="brand" to="/"><img className="brand-logo" src="/img/logo.png" alt="InboundPlus" /><span className="brand-sub">Client Hub</span></Link>
          <button className="menu-toggle" aria-label="Open menu" onClick={() => setNavOpen(!navOpen)}><Icon name="menu" size={20} /></button>
          <div className="site-links" onClick={() => setNavOpen(false)}>
            <a href="#services">Services</a><a href="#method">Methodology</a><a href="#software">AI &amp; Software</a>
            <a href="#stories">Success stories</a><a href="#blog">Blog</a><a href="#contact">Contact</a>
          </div>
          <div className="site-actions">
            <Link className="btn btn-ghost" to="/login">Log in</Link>
            <Link className="btn btn-primary" to="/login?mode=register">Register</Link>
          </div>
        </div>
      </nav>

      <header className="hero">
        <div className="wrap">
          <div className="fade-in">
            <span className="eyebrow"><span className="dot" /> Ecommerce Growth Partner</span>
            <h1>We scale your e-commerce sales with <em>growth systems + AI</em></h1>
            <p className="lead">We implement systems and strategies that increase sales, optimise your ROAS and organise your digital operation — now with a client portal to follow every result.</p>
            <div className="hero-cta">
              <Link className="btn btn-primary" to="/login">Client login</Link>
              <a className="btn btn-ghost" href={`${SITE}auditoria-express-gratis-para-ecommerce/`} target="_blank" rel="noopener noreferrer">Evaluate my e-commerce growth</a>
            </div>
            <div className="hero-stats">
              <div><b>+50</b><span>brands in LATAM scaling with our systems</span></div>
              <div><b>+40%</b><span>e-commerce sales — Pekokis</span></div>
              <div><b>+100%</b><span>sales growth — Olympikus</span></div>
            </div>
            <div className="partners">
              <span>Official partners</span>
              <img src="/img/partner-google.png" alt="Google Partner" />
              <img src="/img/partner-meta.png" alt="Meta Business Partner" />
              <img src="/img/partner-hubspot.png" alt="HubSpot Partner" />
            </div>
          </div>
          <BarScene className="scene-box" height={480} values={D.analytics.channelMonthly.slice(0, 4)} colors={PALETTE_HEX.slice(0, 3).concat(0xfdc9ad)} radius={15}
            tooltip={(r, c, v) => `${D.analytics.channels.labels[r]} · ${m6[c]}: <b>$${v}k</b> <small>(sample)</small>`}>
            <div className="scene-float" style={{ top: 18, right: 18 }}>Client portal preview<b>Revenue by channel</b><span className="sample-pill">Sample data</span></div>
            <span className="scene-hint">Drag to rotate · hover a bar</span>
          </BarScene>
        </div>
      </header>

      <section className="block" id="services">
        <div className="wrap">
          <div className="section-head">
            <h2>Our systems to scale your e-commerce</h2>
            <p>Three services designed to increase sales, improve profitability and optimise the digital operation of brands with an e-commerce channel.</p>
          </div>
          <div className="grid-3">
            {D.plans.map((p, i) => (
              <Tilt key={p.name} className={`card plan-card ${i === 2 ? "featured" : ""}`}>
                <span className={`badge ${i === 2 ? "blue" : "gray"}`} style={{ alignSelf: "flex-start" }}>{p.term}</span>
                <h3>{p.name}</h3><p>{p.tagline}</p>
                <div className="amount">{p.price}<small>{p.billing}</small></div>
                <p><b style={{ color: "var(--navy)" }}>Ideal for:</b> {p.idealFor}</p>
                <ul>{p.includes.map((x) => <li key={x}>{x}</li>)}</ul>
                <a className={`btn ${i === 2 ? "btn-primary" : "btn-ghost"}`} style={{ marginTop: "auto" }} href={p.cta} target="_blank" rel="noopener noreferrer">{p.ctaText}</a>
              </Tilt>
            ))}
          </div>
        </div>
      </section>

      <section className="block alt" id="method">
        <div className="wrap">
          <div className="section-head">
            <h2>How we work to scale your sales</h2>
            <p>A four-step method to design, activate and optimise growth systems based on data and artificial intelligence.</p>
          </div>
          <div className="grid-4">
            {D.methodology.map((s, i) => (
              <Tilt key={s.title} className="card step"><div className="pop"><div className="num-badge">0{i + 1}</div><h3 style={{ fontSize: 16 }}>{s.title}</h3><p>{s.text}</p></div></Tilt>
            ))}
          </div>
        </div>
      </section>

      <section className="block" id="software">
        <div className="wrap">
          <div className="section-head">
            <span className="sample-pill">Proposed with Synchronous Consulting</span>
            <h2 style={{ marginTop: 12 }}>AI &amp; software solutions</h2>
            <p>Technology add-ons that can be delivered through the portal — AI agents, Claude skills, integrations, store development and SEO tooling.</p>
          </div>
          <Chips options={unique(D.software.map((s) => s.cat))} value={swCat} onChange={setSwCat} />
          <div className="grid-3">{D.software.filter((s) => swCat === "All" || s.cat === swCat).map((s) => <SoftwareCard key={s.id} s={s} />)}</div>
        </div>
      </section>

      <section className="block alt" id="stories">
        <div className="wrap">
          <div className="section-head">
            <h2>Growth stories</h2>
            <p>Results shared by marketing, sales and general managers who work with InboundPlus.</p>
          </div>
          <div className="grid-3">
            {D.stories.map((q) => (
              <Tilt key={q.brand} className="card quote">
                <img src={q.logo} alt={q.brand} style={{ height: 40, marginBottom: 12 }} />
                <b>{q.result}</b>{q.text}
                <p style={{ marginTop: 10, fontSize: 13 }}>— {q.person}, {q.brand}</p>
              </Tilt>
            ))}
          </div>
          <div className="logo-strip" style={{ marginTop: 34 }}>
            {D.clientLogos.map((l) => <div key={l.name}><img src={`/img/clients/${l.file}`} alt={l.name} title={l.name} /></div>)}
          </div>
          <p style={{ textAlign: "center", marginTop: 22 }}><a href={`${SITE}testimonios/`} target="_blank" rel="noopener noreferrer">See all testimonials on inboundplus.agency →</a></p>
        </div>
      </section>

      <section className="block" id="blog">
        <div className="wrap">
          <div className="section-head"><h2>Blog &amp; ebooks</h2><p>Latest articles and free ebooks from the InboundPlus team.</p></div>
          <Chips options={unique(D.blog.map((b) => b.cat))} value={blogCat} onChange={setBlogCat} />
          <div className="grid-3">
            {D.blog.filter((b) => blogCat === "All" || b.cat === blogCat).map((b) => (
              <Tilt as="a" key={b.id} className="card blog-card fade-in" href={b.url} target="_blank" rel="noopener noreferrer" style={{ color: "inherit" }}>
                <div className="blog-thumb"><Icon name={b.icon} /></div>
                <div className="blog-body"><div className="blog-meta"><span className="badge gray">{b.cat}</span><span>{b.lang}</span></div><h3>{b.title}</h3><p>{b.excerpt}</p></div>
              </Tilt>
            ))}
          </div>
        </div>
      </section>

      <section className="block alt" id="contact">
        <div className="wrap">
          <div className="cta-band">
            <div><h2>Let's talk about your goals</h2><p>Book a free strategic session with a specialist, or log in to your client portal.</p></div>
            <div className="flex wrap-gap">
              <a className="btn btn-ghost" href={`${SITE}consultoria-estrategica/`} target="_blank" rel="noopener noreferrer">Book a session</a>
              <Link className="btn btn-primary" to="/login">Client login</Link>
            </div>
          </div>
          <div className="grid-3" style={{ marginTop: 24 }}>
            <div className="card"><h3>Lima, Perú</h3><p>+51 930 724 378<br /><a href="mailto:hola@inboundplus.agency">hola@inboundplus.agency</a></p></div>
            <div className="card"><h3>Florida, United States</h3><p>+1 561 817 6659<br /><a href="mailto:hello@inboundplus.us">hello@inboundplus.us</a></p></div>
            <div className="card"><h3>Website</h3><p><a href={SITE} target="_blank" rel="noopener noreferrer">inboundplus.agency</a><br />Services · Methodology · FAQ</p></div>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="wrap">
          <span>©2026 InboundPlus | Ecommerce Growth Partner</span>
          <span>Client portal prototype by Synchronous Consulting · portal dashboards show sample data</span>
        </div>
      </footer>
    </>
  );
}
