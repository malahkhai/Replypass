import { CREATOR_SHARE_PERCENT, PLATFORM_FEE_PERCENT, splitPayment } from "@/lib/payments/fees";
import s from "./compact-landing-sections.module.css";

export function CompactLandingSections() {
  const replies = 20;
  const priceCents = 1500;
  const paidEuros = replies * priceCents / 100;
  const creatorEuros = replies * splitPayment(priceCents).creatorCents / 100;

  return <>
    <section className={s.section} id="offers" aria-labelledby="new-offers-title">
      <div className={s.inner}>
        <header className={s.heading}>
          <p className={s.eyebrow}>WHAT YOU CAN OFFER</p>
          <h2 className={s.title} id="new-offers-title">Two ways for<br/>fans to get closer.</h2>
        </header>
        <div className={s.offers}>
          <article className={`${s.offerCard} ${s.replyCard}`}>
            <h3>Guaranteed Replies</h3>
            <p>When a fan asks, their card is temporarily authorized. You earn once you send a qualifying reply before the deadline.</p>
            <p className={s.offerNote}>If you decline, or the deadline passes, the hold is released and the fan isn’t charged.</p>
          </article>
          <article className={`${s.offerCard} ${s.vipCard}`}>
            <h3>VIP memberships</h3>
            <p>Share private posts and updates with subscribers at a monthly price you set.</p>
            <p className={s.offerNote}>Memberships renew each month until the fan cancels. Optional, so you can start with replies alone.</p>
          </article>
        </div>
      </div>
    </section>
    <section className={`${s.section} ${s.earnings}`} id="fees" aria-labelledby="new-earnings-title">
      <div className={s.inner}>
        <header className={s.heading}>
          <p className={s.eyebrow}>YOUR EARNINGS</p>
          <h2 className={s.title} id="new-earnings-title">Set your price.<br/>Keep your share.</h2>
        </header>
        <div className={s.stats}>
          <div className={s.stat}><strong>{CREATOR_SHARE_PERCENT}%</strong><p>goes to you on every completed paid reply and VIP payment</p></div>
          <div className={s.stat}><strong>{PLATFORM_FEE_PERCENT}%</strong><p>is what ReplyPass keeps</p></div>
          <div className={s.stat}><strong>€0</strong><p>to create your page. No card needed to start</p></div>
        </div>
        <div className={s.example}>
          <div className={s.exampleCopy}><span>Example</span><p>{replies} fans × €{priceCents / 100} Guaranteed Reply, all completed. €{paidEuros} paid.</p></div>
          <div className={s.exampleShare}><span>You keep</span><strong>€{creatorEuros}</strong></div>
        </div>
        <p className={s.fine}>{CREATOR_SHARE_PERCENT}% is before Stripe processing costs, refunds and other adjustments. Payout timing follows Stripe’s schedule and requires verification.</p>
      </div>
    </section>
  </>;
}
