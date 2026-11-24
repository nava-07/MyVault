import React, { useRef, useEffect } from 'react';

/**
 * Reusable OTP Input component
 * Renders individual input boxes for multi-digit verification codes.
 * Supports auto-focus, backspace navigation, paste distribution, and auto-submit.
 */
const OTPInput = ({
  length = 8,
  value = '',
  onChange = () => {},
  onComplete = () => {},
  disabled = false,
  autoFocus = true,
  className = '',
}) => {
  const inputRefs = useRef([]);

  // Convert incoming string value to array of digits
  const digits = Array.from({ length }, (_, i) => (value && value[i] !== undefined ? value[i] : ''));

  useEffect(() => {
    if (autoFocus && !disabled) {
      // Find the first empty input or default to index 0
      const firstEmptyIndex = digits.findIndex((d) => d === '');
      const focusIndex = firstEmptyIndex === -1 ? length - 1 : firstEmptyIndex;
      inputRefs.current[focusIndex]?.focus();
    }
  }, []); // Run on mount

  const handleChange = (e, index) => {
    if (disabled) return;

    const rawVal = e.target.value;
    const cleanVal = rawVal.replace(/\D/g, '');

    if (!cleanVal) {
      // Cleared or non-digit input
      const newDigits = [...digits];
      newDigits[index] = '';
      const newOtp = newDigits.join('');
      onChange(newOtp);
      return;
    }

    if (cleanVal.length > 1) {
      // Multiple digits entered (e.g., auto-complete)
      const digitsToFill = cleanVal.slice(0, length);
      onChange(digitsToFill);
      const nextIndex = Math.min(digitsToFill.length, length - 1);
      inputRefs.current[nextIndex]?.focus();

      if (digitsToFill.length === length) {
        onComplete(digitsToFill);
      }
      return;
    }

    // Single digit entered
    const digit = cleanVal.slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    const newOtp = newDigits.join('');
    onChange(newOtp);

    // Focus next input box
    if (index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // If all digits are entered, trigger onComplete
    if (newOtp.length === length && !newDigits.includes('')) {
      onComplete(newOtp);
    }
  };

  const handleKeyDown = (e, index) => {
    if (disabled) return;

    if (e.key === 'Backspace') {
      e.preventDefault();
      const newDigits = [...digits];

      if (digits[index]) {
        // Clear current input
        newDigits[index] = '';
        const newOtp = newDigits.join('');
        onChange(newOtp);
      } else if (index > 0) {
        // Current is already empty, move to previous and clear it
        newDigits[index - 1] = '';
        const newOtp = newDigits.join('');
        onChange(newOtp);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === 'Delete') {
      e.preventDefault();
      const newDigits = [...digits];
      newDigits[index] = '';
      onChange(newDigits.join(''));
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    if (disabled) return;

    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pastedData) return;

    onChange(pastedData);

    const nextIndex = Math.min(pastedData.length, length - 1);
    inputRefs.current[nextIndex]?.focus();

    if (pastedData.length === length) {
      onComplete(pastedData);
    }
  };

  return (
    <div
      className={`flex items-center justify-center gap-1 sm:gap-2 md:gap-2.5 max-w-full overflow-x-auto py-1 ${className}`}
      onPaste={handlePaste}
    >
      {Array.from({ length }, (_, index) => {
        const isFilled = Boolean(digits[index]);
        return (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digits[index] || ''}
            disabled={disabled}
            autoComplete="one-time-code"
            aria-label={`Digit ${index + 1}`}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onClick={(e) => e.target.select()}
            className={`w-8 h-11 sm:w-10 sm:h-13 md:w-11 md:h-14 text-center text-lg sm:text-xl md:text-2xl font-bold rounded-lg border transition-all duration-200 outline-none
              bg-[var(--color-surface)] text-[var(--color-text)]
              ${
                isFilled
                  ? 'border-primary-500 shadow-sm ring-1 ring-primary-500/20'
                  : 'border-[var(--color-border)]'
              }
              focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          />
        );
      })}
    </div>
  );
};

export default OTPInput;
