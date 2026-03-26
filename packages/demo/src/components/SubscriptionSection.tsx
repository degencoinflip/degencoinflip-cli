"use client";

import { FlipButton } from "./FlipButton";
import { CodeSnippet } from "./CodeSnippet";
import { useScrollReveal } from "../hooks/useScrollReveal";

const code = `const result = await dcf.play('H', 12.99);
if (result.result === 'WIN') skipBilling();`;

interface SubscriptionSectionProps {
  dcf: any | null;
}

export function SubscriptionSection({ dcf }: SubscriptionSectionProps) {
  const revealRef = useScrollReveal<HTMLDivElement>();

  return (
    <section
      className="section-snap min-h-screen flex flex-col items-center justify-center px-4 py-16 sm:py-20"
      style={{ backgroundColor: "#0A0A0A" }}
    >
      <div ref={revealRef} className="w-full max-w-sm">
        {/* Card */}
        <div
          className="rounded-2xl shadow-xl overflow-hidden"
          style={{
            backgroundColor: "#181818",
            border: "1px solid #282828",
          }}
        >
          <div className="px-6 pt-8 pb-4">
            {/* Premium badge pill */}
            <div className="mb-5">
              <span
                className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase px-3 py-1 rounded-full"
                style={{
                  backgroundColor: "rgba(29, 185, 84, 0.15)",
                  color: "#1DB954",
                }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: "#1DB954" }}
                />
                Premium
              </span>
            </div>

            {/* Price */}
            <p className="text-white text-4xl font-bold tracking-tight">
              $12.99
              <span className="text-gray-500 text-base font-normal">/mo</span>
            </p>
          </div>

          {/* Billing details */}
          <div className="px-6 py-3">
            <div
              className="flex items-center justify-between py-3"
              style={{ borderTop: "1px solid #282828" }}
            >
              <span className="text-gray-500 text-sm">Next billing</span>
              <span className="text-gray-300 text-sm font-medium">
                Apr 26, 2026
              </span>
            </div>
            <div
              className="flex items-center justify-between py-3"
              style={{ borderTop: "1px solid #282828" }}
            >
              <span className="text-gray-500 text-sm">Payment</span>
              <span className="text-gray-300 text-sm font-medium">
                Visa ****4242
              </span>
            </div>
          </div>

          {/* Flip CTA */}
          <div className="px-6 pb-6 pt-4">
            <FlipButton
              label="Flip for a Free Month"
              amount={12.99}
              dcf={dcf}
              winMessage="YOU WON! This month is on us."
              loseMessage="Better luck next time"
              accentColor="#1DB954"
              accentHoverColor="#1AA34A"
            />
          </div>

          {/* Footer */}
          <div className="px-6 py-3" style={{ borderTop: "1px solid #282828" }}>
            <p className="text-center text-gray-600 text-xs">
              Powered by @degencoinflip/sdk
            </p>
          </div>
        </div>

        {/* Code snippet */}
        <CodeSnippet code={code} />
      </div>
    </section>
  );
}
