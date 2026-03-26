"use client";

import { FlipButton } from "./FlipButton";
import { CodeSnippet } from "./CodeSnippet";
import { useScrollReveal } from "../hooks/useScrollReveal";

const code = `const result = await dcf.play('H', 25.00);
if (result.result === 'WIN') refundPayment();`;

interface PaymentSectionProps {
  dcf: any | null;
}

export function PaymentSection({ dcf }: PaymentSectionProps) {
  const revealRef = useScrollReveal<HTMLDivElement>();

  return (
    <section
      className="section-snap min-h-screen flex flex-col items-center justify-center px-4 py-16 sm:py-20"
      style={{ backgroundColor: "#FFFFFF" }}
    >
      <div ref={revealRef} className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          {/* Venmo blue gradient header */}
          <div
            className="pt-10 pb-8 flex flex-col items-center"
            style={{
              background: "linear-gradient(180deg, #008CFF 0%, #009AFF 60%, #FFFFFF 100%)",
            }}
          >
            {/* Blue circle with white checkmark */}
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-4 shadow-lg"
              style={{ backgroundColor: "#008CFF" }}
            >
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          {/* Payment details */}
          <div className="px-6 pb-4 flex flex-col items-center text-center -mt-2">
            {/* Avatar */}
            <img
              src="https://demo.dashboardpack.com/architectui-html-pro/assets/images/avatars/2.jpg"
              alt="Alex"
              className="w-12 h-12 rounded-full object-cover mb-4"
            />

            <h2 className="text-gray-900 font-bold text-xl tracking-tight">
              You paid Alex
            </h2>
            <p className="text-gray-900 text-4xl font-bold tracking-tight mt-2 mb-1">
              $25.00
            </p>
            <p className="text-gray-400 text-sm mt-1">
              for dinner last night <span role="img" aria-label="pizza">&#127829;</span>
            </p>
          </div>

          {/* Flip CTA */}
          <div className="px-6 pb-6 pt-4">
            <FlipButton
              label="Double or Nothing?"
              amount={25.0}
              dcf={dcf}
              winMessage="YOU WON! $25.00 refunded."
              loseMessage="Better luck next time"
              accentColor="#008CFF"
              accentHoverColor="#0070D6"
            />
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 px-6 py-3">
            <p className="text-center text-gray-300 text-xs">
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
