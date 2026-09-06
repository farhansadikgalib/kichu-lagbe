import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { BRAND, CONTACT, SERVICE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${BRAND.name} collects, uses, and protects your information when you order late-night delivery in ${SERVICE.area}.`,
  alternates: { canonical: "/privacy" },
};

const EFFECTIVE_DATE = "6 September 2026";

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-24 space-y-3">
      <h2 id={`${id}-heading`} className="text-xl font-bold sm:text-2xl">
        {title}
      </h2>
      {children}
    </section>
  );
}

const SECTIONS = [
  { id: "what-we-collect", title: "What we collect" },
  { id: "how-we-use-it", title: "How we use it" },
  { id: "who-sees-it", title: "Who can see it" },
  { id: "cookies", title: "Cookies and on-device storage" },
  { id: "retention", title: "How long we keep it" },
  { id: "your-choices", title: "Your choices and rights" },
  { id: "security", title: "Security" },
  { id: "age", title: "Age requirement" },
  { id: "changes", title: "Changes to this policy" },
  { id: "contact", title: "Contact" },
] as const;

export default function PrivacyPolicyPage() {
  const contactLink = (
    <a href={`mailto:${CONTACT.email}`} className="text-primary underline-offset-4 hover:underline">
      {CONTACT.email}
    </a>
  );

  return (
    <article className="container-page max-w-3xl space-y-12 py-12 md:py-16">
      <header className="space-y-4">
        <p className="text-sm font-semibold tracking-wide text-primary uppercase">Legal</p>
        <h1 className="text-4xl font-bold text-balance sm:text-5xl">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">Effective {EFFECTIVE_DATE}</p>
        <p className="text-muted-foreground text-pretty">
          {BRAND.name} (&ldquo;we&rdquo;, &ldquo;us&rdquo;) is a late-night home delivery service
          operating in {SERVICE.area}, Bangladesh. This policy explains what information we
          collect when you use kichulagbe.vercel.app or the installed app, why we collect it, and
          the choices you have. We keep it short and specific — there is no tracking or advertising
          on this site.
        </p>
      </header>

      <nav aria-label="On this page" className="rounded-xl border border-border/60 bg-card p-5">
        <p className="mb-3 text-sm font-semibold">On this page</p>
        <ol className="grid gap-1.5 text-sm text-muted-foreground sm:grid-cols-2">
          {SECTIONS.map((section, index) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className="transition-colors hover:text-foreground"
              >
                {index + 1}. {section.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="space-y-12 text-pretty leading-relaxed [&_li]:pl-1 [&_p]:text-foreground/90 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
        <Section id="what-we-collect" title="1. What we collect">
          <p>We only collect what is needed to take and deliver your order.</p>
          <ul>
            <li>
              <strong>Account details.</strong> Your name, email address, phone number, and a
              password. Passwords are stored only as a one-way hash — we never see or store the
              password itself.
            </li>
            <li>
              <strong>Google sign-in.</strong> If you sign in with Google, Google shares your
              name, email address, whether that email is verified, and your profile picture. We
              use Firebase Authentication only to verify the sign-in; we do not access anything
              else in your Google account.
            </li>
            <li>
              <strong>Orders.</strong> The delivery name, phone number, and address you enter,
              any note to the rider, the items ordered, prices, and any coupon code used. All
              orders are cash on delivery — we do not collect card or bank details.
            </li>
            <li>
              <strong>Location (optional).</strong> At checkout you can share your device&rsquo;s
              location to pin your door. If you do, we store the coordinates and their accuracy
              with that order so the rider can find you, and we send the coordinates (nothing
              else) to OpenStreetMap&rsquo;s Nominatim service to suggest a street address. Saying
              no simply leaves the address field to you.
            </li>
            <li>
              <strong>Push notifications (optional).</strong> If you turn on order updates, we
              store the push subscription your browser issues (an endpoint and encryption keys)
              and your browser&rsquo;s user-agent string so we can send updates to that device.
            </li>
            <li>
              <strong>Bot protection.</strong> Login and registration are protected by
              Cloudflare Turnstile, which checks that you are a person. Cloudflare processes
              technical signals from your browser for that check under its own privacy policy.
            </li>
            <li>
              <strong>Technical logs.</strong> Like any website, our hosting provider records
              standard request information (IP address, browser type, pages requested) for
              security and reliability.
            </li>
          </ul>
          <p>
            We do not use analytics, advertising, or social-media trackers, and we do not build
            profiles of you for marketing.
          </p>
        </Section>

        <Section id="how-we-use-it" title="2. How we use it">
          <ul>
            <li>To prepare, deliver, and confirm your orders, and to contact you about them.</li>
            <li>To keep you signed in and to pre-fill checkout with your saved details.</li>
            <li>To send order status updates you have opted into (in-app or push).</li>
            <li>To prevent fraud, abuse, and automated sign-ups.</li>
            <li>
              To understand how the service is doing — our team sees aggregate figures such as
              orders per day and popular items, not marketing profiles.
            </li>
          </ul>
        </Section>

        <Section id="who-sees-it" title="3. Who can see it">
          <p>
            <strong>Our team.</strong> Staff who manage orders can see order and contact details.
            The rider assigned to your order sees only what they need to deliver it: your name,
            phone number, address, pinned location, and note.
          </p>
          <p>
            <strong>Service providers</strong> that process data on our behalf, each bound by
            their own privacy terms:
          </p>
          <ul>
            <li>Vercel — hosts the website and app.</li>
            <li>Aiven — hosts our database (PostgreSQL).</li>
            <li>Google Firebase — verifies Google sign-ins only.</li>
            <li>Cloudflare — bot protection on login and registration.</li>
            <li>OpenStreetMap (Nominatim) — turns shared coordinates into an address suggestion.</li>
            <li>
              Your browser&rsquo;s push service (Apple, Google, or Mozilla) — relays order
              notifications if you enable them.
            </li>
          </ul>
          <p>
            We do not sell your information, and we do not share it with anyone else unless the
            law requires it or you ask us to.
          </p>
        </Section>

        <Section id="cookies" title="4. Cookies and on-device storage">
          <ul>
            <li>
              <strong>Session cookie</strong> (<code>dl_session</code>). Set when you sign in and
              kept for seven days so you stay signed in. It is HTTP-only and cannot be read by
              scripts.
            </li>
            <li>
              <strong>Cart.</strong> Items you add before checking out are kept in your
              browser&rsquo;s local storage, on your device only, so your cart survives a refresh.
            </li>
            <li>
              <strong>Offline cache.</strong> If you install the app, a service worker caches
              pages and product listings on your device so it opens quickly and works offline.
            </li>
            <li>
              <strong>Cloudflare Turnstile</strong> may set its own cookie while verifying you on
              the sign-in and sign-up pages.
            </li>
          </ul>
          <p>
            There are no advertising or analytics cookies. Clearing your browser data removes all
            of the above.
          </p>
        </Section>

        <Section id="retention" title="5. How long we keep it">
          <ul>
            <li>Account details: for as long as your account exists.</li>
            <li>
              Orders: kept as part of our business records so you can view your history and we
              can resolve any dispute.
            </li>
            <li>
              Push subscriptions: until you turn notifications off, or the subscription is no
              longer valid.
            </li>
            <li>Location pins: stored with the order they belong to and kept with that order.</li>
          </ul>
        </Section>

        <Section id="your-choices" title="6. Your choices and rights">
          <ul>
            <li>
              <strong>Update your details</strong> any time from your{" "}
              <Link href="/profile" className="text-primary underline-offset-4 hover:underline">
                profile
              </Link>
              .
            </li>
            <li>
              <strong>Location and notifications</strong> are optional. You can decline them at
              the prompt or turn them off later in your browser or device settings.
            </li>
            <li>
              <strong>Delete your account</strong> or ask for a copy of your data by emailing{" "}
              {contactLink} from the address on the account. We will confirm and act within 30
              days. Order records needed for legal or accounting purposes may be retained after
              the account is closed.
            </li>
          </ul>
        </Section>

        <Section id="security" title="7. Security">
          <p>
            All traffic is encrypted with HTTPS, passwords are hashed, and access to customer
            data is restricted by role — riders and staff only see what their job requires. No
            system is perfectly secure, but we take reasonable steps to protect your information
            and will tell you if we learn of a breach that affects you.
          </p>
        </Section>

        <Section id="age" title="8. Age requirement">
          <p>
            {BRAND.name} sells tobacco products and is intended for adults aged 18 and over. We
            do not knowingly collect information from anyone under 18. If you believe a minor has
            created an account, contact us and we will remove it.
          </p>
        </Section>

        <Section id="changes" title="9. Changes to this policy">
          <p>
            If we change how we handle your information, we will update this page and the
            effective date at the top. Significant changes will also be announced in the app.
          </p>
        </Section>

        <Section id="contact" title="10. Contact">
          <p>
            Questions or requests about your data: {contactLink}
            <br />
            {BRAND.name}, {CONTACT.address}
          </p>
        </Section>
      </div>
    </article>
  );
}
