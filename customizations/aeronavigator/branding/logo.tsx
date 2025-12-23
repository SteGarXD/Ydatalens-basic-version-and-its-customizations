/**
 * Компонент логотипа ООО "Аэронавигатор"
 * Заменяет стандартный логотип Yandex DataLens
 */

import React from 'react';

interface AeronavigatorLogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  className?: string;
}

const AeronavigatorLogo: React.FC<AeronavigatorLogoProps> = ({
  size = 'medium',
  showText = true,
  className = '',
}) => {
  const sizeMap = {
    small: { logo: 24, text: 14 },
    medium: { logo: 40, text: 18 },
    large: { logo: 60, text: 24 },
  };

  const dimensions = sizeMap[size];

  return (
    <div
      className={`aeronavigator-logo ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      <img
        src="/OP-compass.png"
        alt="ООО Аэронавигатор"
        style={{
          width: `${dimensions.logo}px`,
          height: `${dimensions.logo}px`,
        }}
        onError={(e) => {
          // Fallback если логотип не найден
          e.currentTarget.style.display = 'none';
        }}
      />
      {showText && (
        <span
          style={{
            fontSize: `${dimensions.text}px`,
            fontWeight: 600,
            color: '#1a1a1a',
          }}
        >
          AeronavigatorBI
        </span>
      )}
    </div>
  );
};

export default AeronavigatorLogo;

