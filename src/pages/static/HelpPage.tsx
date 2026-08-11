export default function HelpPage() {
  const faqs = [
    { q: 'How does WorkPiServ work?', a: 'Browse services, select a freelancer, pay securely with Pi — your payment is held in escrow until you approve the delivery.' },
    { q: 'Is my Pi safe?', a: 'Yes. All payments go through our Escrow system. Your Pi is only released when you confirm the work is done.' },
    { q: 'How do I become a freelancer?', a: 'Simply login with Pi Browser — all users are both client and freelancer by default. Create your first service to start earning.' },
    { q: 'What if I have a dispute?', a: 'Our dispute resolution team reviews all cases within 48 hours. You can report an issue directly from your order page.' },
    { q: 'What fees does WorkPiServ charge?', a: 'WorkPiServ takes a 10% platform fee from completed orders. Freelancers receive 90% of the agreed price.' },
  ];
  return (
    <div className="section-container py-16 max-w-3xl mx-auto">
      <h1 className="font-heading font-bold text-3xl text-navy mb-8">Help Center</h1>
      <div className="space-y-6">
        {faqs.map((faq, i) => (
          <div key={i} className="border border-border rounded-xl p-6">
            <h3 className="font-semibold text-navy mb-2">{faq.q}</h3>
            <p className="text-muted-foreground text-sm">{faq.a}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 p-6 bg-brand-light rounded-xl text-center">
        <p className="text-muted-foreground mb-2">Still need help?</p>
        <a href="mailto:support@workpiserv.com" className="btn-primary inline-block">Contact Support</a>
      </div>
    </div>
  );
}
