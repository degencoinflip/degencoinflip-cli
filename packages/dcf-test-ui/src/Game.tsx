import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MAP, COLS, ROWS, TILE_SIZE, TILE_COLORS, TILE_LABELS, SPAWN, canWalk, adjacentTo, T } from './tilemap';
import { HUD } from './HUD';
import { FlipOverlay } from './FlipOverlay';
import { useDcf } from './provider';
import type { TileType } from './tilemap';

const W = COLS * TILE_SIZE;
const H = ROWS * TILE_SIZE;

// NPC definitions
const NPCS = [
  { x: 14, y: 4, label: '💀', name: 'Skull' },
  { x: 7, y: 9, label: '🧝', name: 'Elf' },
  { x: 16, y: 8, label: '🐉', name: 'Drake' },
];

export function Game() {
  const { disconnect } = useDcf();
  const [px, setPx] = useState(SPAWN.x);
  const [py, setPy] = useState(SPAWN.y);
  const [showFlip, setShowFlip] = useState(false);
  const [prompt, setPrompt] = useState('');
  const gameRef = useRef<HTMLDivElement>(null);

  // Check prompts based on position
  useEffect(() => {
    if (adjacentTo(px, py, T.COIN_TABLE)) {
      setPrompt('Press E to flip');
    } else if (adjacentTo(px, py, T.BARKEEP)) {
      setPrompt('Press E to talk');
    } else if (MAP[py]?.[px] === T.DOOR) {
      setPrompt('Press E to leave');
    } else {
      setPrompt('');
    }
  }, [px, py]);

  // Keyboard handler
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (showFlip) {
        if (e.key === 'Escape') setShowFlip(false);
        return;
      }

      let nx = px, ny = py;

      switch (e.key) {
        case 'w': case 'W': case 'ArrowUp':    ny = py - 1; break;
        case 's': case 'S': case 'ArrowDown':  ny = py + 1; break;
        case 'a': case 'A': case 'ArrowLeft':  nx = px - 1; break;
        case 'd': case 'D': case 'ArrowRight': nx = px + 1; break;
        case 'e': case 'E': case 'Enter':
          // Interact
          if (adjacentTo(px, py, T.COIN_TABLE)) {
            setShowFlip(true);
          } else if (MAP[py]?.[px] === T.DOOR) {
            disconnect();
          }
          return;
        default: return;
      }

      e.preventDefault();

      // Check NPC collision
      const npcBlocking = NPCS.some(npc => npc.x === nx && npc.y === ny);
      if (canWalk(nx, ny) && !npcBlocking) {
        setPx(nx);
        setPy(ny);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [px, py, showFlip, disconnect]);

  // Focus game div for keyboard
  useEffect(() => {
    gameRef.current?.focus();
  }, []);

  return (
    <div className="game-container" ref={gameRef} tabIndex={0}>
      <HUD />

      <div className="game-viewport">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          className="game-svg"
        >
          {/* Tile map */}
          {MAP.map((row, y) =>
            row.map((tile, x) => (
              <g key={`${x}-${y}`}>
                <rect
                  x={x * TILE_SIZE}
                  y={y * TILE_SIZE}
                  width={TILE_SIZE}
                  height={TILE_SIZE}
                  fill={TILE_COLORS[tile as TileType]}
                  stroke="#00000011"
                  strokeWidth={0.5}
                />
                {TILE_LABELS[tile as TileType] && (
                  <text
                    x={x * TILE_SIZE + TILE_SIZE / 2}
                    y={y * TILE_SIZE + TILE_SIZE / 2 + 2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={TILE_SIZE * 0.5}
                    style={{ pointerEvents: 'none' }}
                  >
                    {TILE_LABELS[tile as TileType]}
                  </text>
                )}
              </g>
            ))
          )}

          {/* Table labels */}
          <text
            x={5.5 * TILE_SIZE}
            y={5 * TILE_SIZE - 4}
            textAnchor="middle"
            fontSize={9}
            fill="#fff"
            fontFamily="'JetBrains Mono', monospace"
            fontWeight={600}
            letterSpacing="0.05em"
          >
            COIN FLIP
          </text>
          <text
            x={10.5 * TILE_SIZE}
            y={5 * TILE_SIZE - 4}
            textAnchor="middle"
            fontSize={9}
            fill="#fff8"
            fontFamily="'JetBrains Mono', monospace"
            fontWeight={400}
            letterSpacing="0.05em"
          >
            COMING SOON
          </text>

          {/* NPCs */}
          {NPCS.map((npc, i) => (
            <g key={`npc-${i}`}>
              <rect
                x={npc.x * TILE_SIZE + 4}
                y={npc.y * TILE_SIZE + 4}
                width={TILE_SIZE - 8}
                height={TILE_SIZE - 8}
                rx={4}
                fill="#c4a45a"
                stroke="#8B6914"
                strokeWidth={1}
              />
              <text
                x={npc.x * TILE_SIZE + TILE_SIZE / 2}
                y={npc.y * TILE_SIZE + TILE_SIZE / 2 + 2}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={TILE_SIZE * 0.45}
                style={{ pointerEvents: 'none' }}
              >
                {npc.label}
              </text>
            </g>
          ))}

          {/* Player */}
          <rect
            x={px * TILE_SIZE + 3}
            y={py * TILE_SIZE + 3}
            width={TILE_SIZE - 6}
            height={TILE_SIZE - 6}
            rx={6}
            fill="#3b82f6"
            stroke="#1d4ed8"
            strokeWidth={2}
          />
          <text
            x={px * TILE_SIZE + TILE_SIZE / 2}
            y={py * TILE_SIZE + TILE_SIZE / 2 + 1}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={14}
            fill="#fff"
            fontFamily="'JetBrains Mono', monospace"
            fontWeight={700}
            style={{ pointerEvents: 'none' }}
          >
            YOU
          </text>

          {/* Interaction highlight — glow adjacent coin table */}
          {adjacentTo(px, py, T.COIN_TABLE) && (
            <>
              {[{x:5,y:5},{x:6,y:5},{x:5,y:6},{x:6,y:6}].map(({x,y}) => (
                <rect
                  key={`glow-${x}-${y}`}
                  x={x * TILE_SIZE}
                  y={y * TILE_SIZE}
                  width={TILE_SIZE}
                  height={TILE_SIZE}
                  fill="none"
                  stroke="#facc15"
                  strokeWidth={2}
                  className="glow-pulse"
                />
              ))}
            </>
          )}
        </svg>
      </div>

      {/* Prompt bar */}
      {prompt && !showFlip && (
        <div className="game-prompt">
          {prompt}
        </div>
      )}

      {/* Movement hint */}
      {!prompt && !showFlip && (
        <div className="game-hint">
          WASD to move · E to interact
        </div>
      )}

      {/* Flip overlay */}
      {showFlip && <FlipOverlay onClose={() => setShowFlip(false)} />}
    </div>
  );
}
