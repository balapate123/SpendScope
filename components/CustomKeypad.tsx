import React from 'react';
import { Delete } from 'lucide-react';

interface CustomKeypadProps {
  onKeyPress: (key: string) => void;
  onDelete: () => void;
}

export const CustomKeypad: React.FC<CustomKeypadProps> = ({ onKeyPress, onDelete }) => {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'];

  return (
    <div className="grid grid-cols-3 gap-4 px-4 pb-8 w-full max-w-sm mx-auto">
      {keys.map((key) => (
        <button
          key={key}
          onClick={() => onKeyPress(key)}
          className="h-14 rounded-2xl text-2xl font-semibold text-white bg-white/5 hover:bg-white/10 active:scale-95 transition-all duration-150 flex items-center justify-center outline-none focus:outline-none select-none"
        >
          {key}
        </button>
      ))}
      <button
        onClick={onDelete}
        className="h-14 rounded-2xl text-white bg-white/5 hover:bg-white/10 active:scale-95 transition-all duration-150 flex items-center justify-center outline-none focus:outline-none"
      >
        <Delete size={24} />
      </button>
    </div>
  );
};
