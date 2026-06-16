export default function AboutPage() {
  return (
    <div className="section-container py-16 max-w-3xl mx-auto">
      <h1 className="font-heading font-bold text-3xl text-navy mb-4">About WorkπServ</h1>
      <p className="text-muted-foreground mb-6">WorkπServ is the first global secure freelance marketplace powered by Pi Network. We connect talented freelancers with clients worldwide, enabling secure transactions through our smart Escrow system.</p>
      <h2 className="font-heading font-bold text-xl text-navy mb-3">Our Mission</h2>
      <p className="text-muted-foreground mb-6">To empower underbanked communities globally by providing a trusted platform where human skills — that AI cannot replace — can generate real income in Pi cryptocurrency.</p>
      <h2 className="font-heading font-bold text-xl text-navy mb-3">Our Values</h2>
      <ul className="space-y-2 text-muted-foreground">
        <li>🛡️ <strong>Security</strong> — Every payment is protected by our Escrow system</li>
        <li>🌍 <strong>Inclusivity</strong> — Built for everyone, especially underserved communities</li>
        <li>⚡ <strong>Speed</strong> — Fast Pi Network transactions, no banking delays</li>
        <li>🤝 <strong>Trust</strong> — Verified users, transparent reviews</li>
      </ul>
    </div>
  );
}
