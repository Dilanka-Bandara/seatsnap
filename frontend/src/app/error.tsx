"use client";
export default function ErrorPage({ reset }: { reset: () => void }) { return <main className="wrap" style={{paddingTop:80}}><h1>Something went wrong.</h1><p>Please try loading the page again.</p><button className="primary-button" onClick={reset}>Try again</button></main>; }
