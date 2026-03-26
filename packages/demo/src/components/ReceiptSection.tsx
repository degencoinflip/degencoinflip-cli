"use client";

import { FlipButton } from "./FlipButton";
import { CodeSnippet } from "./CodeSnippet";
import { useScrollReveal } from "../hooks/useScrollReveal";

const lineItems = [
  { name: "Chicken Burrito Bowl x1", price: "$12.99" },
  { name: "Chips & Guac", price: "$4.99" },
  { name: "Delivery Fee", price: "$3.99" },
];

const code = `const result = await dcf.play('H', 21.97);
if (result.result === 'WIN') refundOrder();`;

interface ReceiptSectionProps {
  dcf: any | null;
}

export function ReceiptSection({ dcf }: ReceiptSectionProps) {
  const revealRef = useScrollReveal<HTMLDivElement>();

  return (
    <section
      className="section-snap min-h-screen flex flex-col items-center justify-center px-4 py-16 sm:py-20"
      style={{ backgroundColor: "#F5F5F5" }}
    >
      <div ref={revealRef} className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* DoorDash red header bar */}
          <div
            className="px-6 py-4 flex items-center justify-between"
            style={{ backgroundColor: "#FF3008" }}
          >
            <span className="text-white font-bold text-lg tracking-tight">
              Order Complete
            </span>
            <span className="text-white text-xl">&#10003;</span>
          </div>

          {/* Green checkmark circle */}
          <div className="flex justify-center pt-6 pb-2">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          <p className="text-center text-gray-400 text-sm mb-4">
            Delivered 12 min ago
          </p>

          {/* Receipt line items */}
          <div className="px-6 pb-2">
            {lineItems.map((item, i) => (
              <div key={item.name}>
                <div className="flex items-center justify-between py-3">
                  <span className="text-gray-700 text-sm">{item.name}</span>
                  <span className="text-gray-900 text-sm font-medium tabular-nums">
                    {item.price}
                  </span>
                </div>
                {i < lineItems.length - 1 && (
                  <div className="border-b border-gray-100" />
                )}
              </div>
            ))}

            {/* Total row */}
            <div className="border-t-2 border-gray-200 mt-1 pt-3 pb-1">
              <div className="flex items-center justify-between">
                <span className="text-gray-900 font-bold text-base">Total</span>
                <span className="text-gray-900 font-bold text-lg tabular-nums">
                  $21.97
                </span>
              </div>
            </div>
          </div>

          {/* Flip CTA */}
          <div className="px-6 pb-6 pt-4">
            <FlipButton
              label="Double or Nothing — Get Your Order Free"
              amount={21.97}
              dcf={dcf}
              winMessage="YOU WON! Order refunded."
              loseMessage="Better luck next time"
              accentColor="#FF3008"
              accentHoverColor="#E02A06"
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
