export default function AffiliatePage() {
  return (
    <div className="section-container py-16 max-w-3xl mx-auto text-center">
      <h1 className="font-heading font-bold text-3xl text-navy mb-4">Affiliate Program</h1>
      <p className="text-muted-foreground mb-8">Earn Pi by referring new users to WorkπServ.</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        {[
          { icon: '🔗', title: 'Share your link', desc: 'Get your unique referral link from your profile' },
          { icon: '👥', title: 'Invite pioneers', desc: 'Share with Pi Network members worldwide' },
          { icon: '💰', title: 'Earn π', desc: 'Get 5% of every transaction your referrals make' },
        ].map((step, i) => (
          <div key={i} className="p-6 bg-brand-light rounded-xl">
            <div className="text-3xl mb-3">{step.icon}</div>
            <h3 className="font-bold text-navy mb-1">{step.title}</h3>
            <p className="text-muted-foreground text-sm">{step.desc}</p>
          </div>
        ))}
      </div>
      <p className="text-muted-foreground text-sm">Affiliate program launching soon. Stay tuned!</p>
    </div>
  );
}
