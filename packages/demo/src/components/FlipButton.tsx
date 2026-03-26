"use client";

import { useState, useCallback, useId } from "react";

type FlipState = "idle" | "flipping" | "won" | "lost" | "error" | "no-wallet";

interface FlipButtonProps {
  label: string;
  amount: number;
  dcf: any | null;
  winMessage?: string;
  loseMessage?: string;
  accentColor: string;
  accentHoverColor: string;
  className?: string;
}

export function FlipButton({
  label,
  amount,
  dcf,
  winMessage = "YOU WON!",
  loseMessage = "Better luck next time",
  accentColor,
  accentHoverColor,
  className,
}: FlipButtonProps) {
  const [state, setState] = useState<FlipState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [tx, setTx] = useState<string | null>(null);
  const styleId = useId();

  const handleFlip = useCallback(async () => {
    if (state === "flipping") return;

    // Resolve the DCF instance: supports both a ref object and a direct instance
    const instance = dcf && typeof dcf === "object" && "current" in dcf ? dcf.current : dcf;

    if (!instance) {
      setState("no-wallet");
      return;
    }

    setState("flipping");
    setErrorMessage("");
    setTx(null);

    try {
      const result = await instance.play("H", 0.001); // Always bet 0.001 SOL for demo
      const won = result.result === "WIN";
      setTx(result.tx ?? null);
      setState(won ? "won" : "lost");
    } catch (err: any) {
      const message =
        err?.message || "Something went wrong. Please try again.";
      setErrorMessage(message);
      setState("error");
    }
  }, [state, dcf]);

  const handleReset = useCallback(() => {
    setState("idle");
    setErrorMessage("");
    setTx(null);
  }, []);

  // ---------------------------------------------------------------------------
  // Inline keyframes — scoped by sanitized useId to avoid collisions
  // ---------------------------------------------------------------------------
  const safeId = styleId.replace(/[^a-zA-Z0-9-_]/g, '');
  const keyframes = `
    @keyframes coinFlip-${safeId} {
      0% { transform: rotateY(0deg); }
      100% { transform: rotateY(1800deg); }
    }
    @keyframes confettiFall-${safeId} {
      0%   { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
      50%  { transform: translateY(-150px) rotate(360deg) scale(1); opacity: 1; }
      100% { transform: translateY(100px) rotate(720deg) scale(0); opacity: 0; }
    }
    @keyframes shake-${safeId} {
      0%, 100% { transform: translateX(0); }
      25%      { transform: translateX(-5px); }
      75%      { transform: translateX(5px); }
    }
  `;

  const confettiColors = ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4"];

  // ---------------------------------------------------------------------------
  // Idle
  // ---------------------------------------------------------------------------
  if (state === "idle") {
    return (
      <button
        onClick={handleFlip}
        className={[
          "w-full py-4 px-8 rounded-xl text-white font-semibold text-lg tracking-tight",
          "transition-all duration-200 transform hover:scale-[1.02] active:scale-95 cursor-pointer",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        style={{
          backgroundColor: accentColor,
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = accentHoverColor)
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = accentColor)
        }
      >
        {label}
      </button>
    );
  }

  // ---------------------------------------------------------------------------
  // No-wallet
  // ---------------------------------------------------------------------------
  if (state === "no-wallet") {
    return (
      <div className="animate-fade-in-up">
        <div className="w-full py-4 px-8 rounded-xl text-center bg-amber-50 border border-amber-200">
          <p className="text-lg font-semibold text-amber-600">
            Connect wallet first
          </p>
        </div>
        <button
          onClick={handleReset}
          className="w-full mt-3 py-2 px-4 text-sm text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
        >
          Try again
        </button>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Flipping — 3D coin spin
  // ---------------------------------------------------------------------------
  if (state === "flipping") {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: keyframes }} />
        <div className="w-full py-4 px-8 rounded-xl bg-gray-100 flex flex-col items-center justify-center gap-3">
          <div style={{ perspective: "600px" }}>
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #FFD700, #FFA500, #FFD700)",
                boxShadow: "0 0 20px rgba(255, 215, 0, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                fontWeight: "bold",
                color: "#8B6914",
                animation: `coinFlip-${safeId} 1.5s ease-out`,
                transformStyle: "preserve-3d",
              }}
            >
              H
            </div>
          </div>
          <span className="text-gray-500 text-sm font-medium tracking-wide animate-pulse">
            Flipping...
          </span>
        </div>
      </>
    );
  }

  // ---------------------------------------------------------------------------
  // Error
  // ---------------------------------------------------------------------------
  if (state === "error") {
    return (
      <div className="animate-fade-in-up">
        <div className="w-full py-4 px-8 rounded-xl text-center bg-red-50 border border-red-200">
          <p className="text-lg font-semibold text-red-600">Flip failed</p>
          <p className="text-sm text-red-400 mt-1">{errorMessage}</p>
        </div>
        <button
          onClick={handleReset}
          className="w-full mt-3 py-2 px-4 text-sm text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
        >
          Try again
        </button>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Result — won / lost
  // ---------------------------------------------------------------------------
  const won = state === "won";

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: keyframes }} />
      <div className="animate-fade-in-up" style={{ position: "relative", overflow: "visible" }}>
        {/* Confetti burst on win */}
        {won && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              overflow: "visible",
            }}
          >
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  width: "8px",
                  height: "8px",
                  background: confettiColors[i % confettiColors.length],
                  left: `${10 + Math.random() * 80}%`,
                  top: "50%",
                  animation: `confettiFall-${safeId} ${1 + Math.random() * 0.5}s ease-out forwards`,
                  animationDelay: `${Math.random() * 0.3}s`,
                  borderRadius: Math.random() > 0.5 ? "50%" : "0",
                  opacity: 0,
                }}
              />
            ))}
          </div>
        )}

        <div
          className="w-full py-5 px-8 rounded-xl text-center"
          style={{
            backgroundColor: won ? '#ecfdf5' : `${accentColor}10`,
            border: won ? '1px solid #a7f3d0' : `1px solid ${accentColor}30`,
            ...(won ? {} : { animation: `shake-${safeId} 0.4s ease-in-out` }),
          }}
        >
          <p
            className="text-xl font-bold"
            style={{ color: won ? '#059669' : accentColor }}
          >
            {won ? winMessage : loseMessage}
          </p>

          {/* Solscan link when an on-chain tx is available */}
          {tx && (
            <a
              href={`https://solscan.io/tx/${tx}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 text-xs hover:opacity-80 transition-opacity"
              style={{ color: won ? '#059669' : accentColor, opacity: 0.6 }}
            >
              verified on-chain →
            </a>
          )}
        </div>
        <button
          onClick={handleReset}
          className="w-full mt-3 py-2 px-4 text-sm text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
        >
          Try again
        </button>
      </div>
    </>
  );
}
