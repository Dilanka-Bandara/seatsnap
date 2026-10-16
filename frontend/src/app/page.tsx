import { ArrowDown, ArrowUpRight, AudioLines, MapPin, Ticket, Sparkles, ShieldCheck, Radio } from "lucide-react";
import { BackendStatus } from "@/components/backend-status";
import { Button } from "@/components/ui/button";
import Link from "next/link";
const steps = [
  { icon: Sparkles, number: "01", title: "Find your kind of night", text: "Discover music, theatre, sport, and more. All in one place." },
  { icon: Radio, number: "02", title: "Make yourself a space", text: "Choose your view with a live seat map and a ten-minute hold." },
  { icon: ShieldCheck, number: "03", title: "Less waiting. More living.", text: "Pay securely, keep your QR ticket close, and enjoy the moment." },
];
export default function Home() {
  return <>
    <header className="nav wrap">
      <Link href="/" className="brand" aria-label="SeatSnap home"><span className="brand-icon"><Ticket size={23} /></span>seat<span>snap</span><sup>®</sup></Link>
      <nav aria-label="Main navigation"><a href="#discover">Discover</a><a href="#how-it-works">How it works</a></nav>
      <span className="preview-tag"><span /> Foundation preview</span>
    </header>
    <main>
      <section className="hero wrap">
        <div className="hero-copy">
          <p className="eyebrow"><span className="little-line" /> GOOD TIMES START HERE</p>
          <h1>Some moments<br />deserve a<br /><em>front-row seat.</em></h1>
          <p className="intro">The music. The crowd. The feeling.<br />Find your next unforgettable experience in Sri Lanka.</p>
          <Button asChild><a href="#discover">Explore what’s coming <ArrowUpRight size={18} /></a></Button>
          <div className="hero-foot"><MapPin size={15} /><span>Made for moments across Sri Lanka</span></div>
        </div>
        <div className="hero-art" role="img" aria-label="Illustrated concert stage with warm spotlights and a crowd">
          <div className="art-grain" /><div className="light light-one" /><div className="light light-two" /><div className="light light-three" />
          <div className="art-top"><span>TURN IT UP.<br />TAKE IT IN.</span><AudioLines size={36}/></div>
          <div className="stage-ring ring-one" /><div className="stage-ring ring-two" />
          <div className="stage-label">LIVE<br /><span>IN THE MOMENT</span></div>
          <div className="crowd">{Array.from({length: 22}, (_, i) => <i key={i} style={{"--i": i} as React.CSSProperties} />)}</div>
          <div className="art-bottom"><span>YOUR NEXT “I WAS THERE”</span><ArrowUpRight size={26}/></div>
          <div className="ticket-stub"><Ticket size={22}/><span>GREAT MEMORIES.<br /><strong>ONE SEAT AWAY.</strong></span><span className="stub-code">|||| ||| ||||</span></div>
        </div>
      </section>
      <div className="ticker" aria-hidden="true"><span>MUSIC</span>✳<span>THEATRE</span>✳<span>SPORTS</span>✳<span>COMEDY</span>✳<span>CONFERENCES</span>✳<span>GOOD TIMES</span></div>
      <section id="discover" className="discover wrap">
        <div className="section-heading"><div><p className="eyebrow">THE NEXT CHAPTER</p><h2>A little anticipation.<br />A lot to look forward to.</h2></div><ArrowDown size={32}/></div>
        <div className="empty-card"><div className="empty-icon"><Ticket size={30}/></div><div><h3>Our first events are on the way.</h3><p>This is the SeatSnap foundation. Event listings, accounts, and reservations will arrive in the next build stages.</p></div><span className="soon">COMING SOON</span></div>
      </section>
      <section id="how-it-works" className="how wrap"><p className="eyebrow">LESS PLANNING. MORE BEING THERE.</p><h2>Your next great story starts here.</h2><div className="steps">{steps.map(step => <article key={step.number}><div className="step-top"><step.icon size={25}/><span>{step.number}</span></div><h3>{step.title}</h3><p>{step.text}</p><small>Planned feature</small></article>)}</div></section>
      <section className="build-note wrap"><div><span className="eyebrow">BUILT WITH INTENTION</span><p>A learning project. A real-world ambition.</p></div><BackendStatus /></section>
    </main>
    <footer className="wrap"><Link href="/" className="brand">seat<span>snap</span><sup>®</sup></Link><p>Be there for the moment.</p><span>Made in Sri Lanka ↗</span></footer>
  </>;
}
