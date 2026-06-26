// Route /affiliate — repurposed as the "Our Story" page.
// Component name kept as AffiliatePage so the import in App.tsx stays unchanged.
export default function AffiliatePage() {
  const values = [
    { icon: '🌍', title: 'Built for the underbanked', desc: 'A platform where human skills generate real income in Pi — especially where banking access is limited.' },
    { icon: '🛡️', title: 'People’s money is sacred', desc: 'Every payment is protected by Escrow. Funds are only released when the work is approved.' },
    { icon: '🤝', title: 'Trust first', desc: 'A transparent 10% fee, shown clearly before you pay. No hidden charges, ever.' },
  ];

  return (
    <div className="section-container py-16 max-w-3xl mx-auto">
      <h1 className="font-heading font-bold text-3xl text-navy mb-4">Our Story</h1>

      <p className="text-muted-foreground leading-relaxed mb-4">
        WorkπServ began as one Pioneer’s idea: that the Pi ecosystem needs real,
        everyday utility — not promises, but a place where people can actually
        <span className="text-foreground"> use </span> Pi for something meaningful.
      </p>

      <p className="text-muted-foreground leading-relaxed mb-4">
        It’s built by a solo founder from Tunisia who started with no formal coding
        background — just patience, a belief in the project, and a conviction that
        talented people everywhere deserve a fair, borderless way to trade their
        skills. Every feature here was built step by step, with one goal: a platform
        people can trust.
      </p>

      <p className="text-muted-foreground leading-relaxed mb-10">
        We’re currently in an open testing phase on Pi Testnet, growing carefully and
        listening to the community at every step. This is just the beginning.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        {values.map((v, i) => (
          <div key={i} className="p-6 bg-brand-light rounded-xl">
            <div className="text-3xl mb-3">{v.icon}</div>
            <h3 className="font-bold text-dark mb-1">{v.title}</h3>
            <p className="text-dark/70 text-sm">{v.desc}</p>
          </div>
        ))}
      </div>

      <div className="text-center">
        <p className="text-muted-foreground mb-4">
          Have a skill to share, or feedback to give? We’d love to hear from you.
        </p>
        <a href="mailto:support@workpiserv.com" className="btn-primary inline-block">
          Get in touch
        </a>
      </div>
    </div>
  );
}
