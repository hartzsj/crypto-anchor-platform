'use client';

import { useTheme } from '@/contexts/ThemeContext';

interface Chain {
  id: string;
  name: string;
  displayName: string;
}

const CHAINS: Chain[] = [
  { id: 'TRON', name: 'TRON', displayName: 'TRON (TRC-20)' },
  { id: 'BSC', name: 'BSC', displayName: 'BSC (BEP-20)' },
];

// SVG Icons
const TronIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="8" fill="#EF0027" />
    <path d="M10 4l3 6-3-1-3 1 3-6z" fill="white" />
    <path d="M7 10l3 5 3-5-3 1-3-1z" fill="white" />
  </svg>
);

const BscIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="8" fill="#F0B90B" />
    <path d="M10 4l2 2-2 2-2-2 2-2zM6 8l2 2-2 2-2-2 2-2zM14 8l2 2-2 2-2-2 2-2zM10 12l2 2-2 2-2-2 2-2z" fill="white" />
  </svg>
);

interface ChainSelectorProps {
  selectedChain: string;
  onChainChange: (chain: string) => void;
  disabled?: boolean;
}

export default function ChainSelector({ selectedChain, onChainChange, disabled }: ChainSelectorProps) {
  return (
    <div className="flex gap-2">
      {CHAINS.map((chain) => (
        <button
          key={chain.id}
          onClick={() => onChainChange(chain.id)}
          disabled={disabled}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-150 ${
            selectedChain === chain.id
              ? 'bg-[var(--accent)] text-white shadow-[var(--shadow-md)]'
              : 'bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] hover:border-[var(--text-muted)]'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {chain.id === 'TRON' ? <TronIcon /> : <BscIcon />}
          <span>{chain.name}</span>
        </button>
      ))}
    </div>
  );
}