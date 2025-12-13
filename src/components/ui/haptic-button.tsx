import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';

/**
 * Botão com feedback tátil (vibração) para dispositivos móveis
 */
export const HapticButton: React.FC<ButtonProps & { haptic?: boolean }> = ({
  onClick,
  haptic = true,
  children,
  ...props
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Vibração sutil em dispositivos que suportam
    if (haptic && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
    onClick?.(e);
  };

  return (
    <Button onClick={handleClick} {...props}>
      {children}
    </Button>
  );
};

export default HapticButton;
