import React from 'react';
import Image from 'next/image';

interface QyanCharacterProps {
  width?: number;
  height?: number;
  className?: string;
}

export const QyanCharacter: React.FC<QyanCharacterProps> = ({ 
  width = 100, 
  height = 100, 
  className = "" 
}) => {
  return (
    <div className={`qyan-character ${className}`} style={{ width, height }}>
      <Image
        src="/images/paramedic-mascot.png"
        alt="Qやん - パラメディック試験対策アシスタント"
        width={width}
        height={height}
        className="drop-shadow-lg rounded-lg"
        priority
      />
    </div>
  );
};

export default QyanCharacter;