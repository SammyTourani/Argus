'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { MODELS } from '../constants';
import { staggerContainer, staggerItem } from '../animations';
import { useKeyboardNav } from '../shared/useKeyboardNav';
import type { StepProps } from '../types';

export default function StepModel({ data, onUpdate, onNext, onSkip }: StepProps) {
  const [focusedIndex, setFocusedIndex] = useState(
    MODELS.findIndex((m) => m.id === data.chosenModel) ?? -1
  );

  const selectModel = useCallback(
    (modelId: string) => {
      onUpdate({ chosenModel: modelId });
    },
    [onUpdate]
  );

  const handleConfirm = useCallback(() => {
    if (data.chosenModel) {
      try {
        localStorage.setItem('argus_default_model', data.chosenModel);
      } catch {}
      onNext();
    }
  }, [data.chosenModel, onNext]);

  useKeyboardNav({
    onEnter: data.chosenModel ? handleConfirm : undefined,
    onEscape: onSkip,
    onArrowUp: () => {
      setFocusedIndex((prev) => {
        const next = prev <= 0 ? MODELS.length - 1 : prev - 1;
        selectModel(MODELS[next].id);
        return next;
      });
    },
    onArrowDown: () => {
      setFocusedIndex((prev) => {
        const next = prev >= MODELS.length - 1 ? 0 : prev + 1;
        selectModel(MODELS[next].id);
        return next;
      });
    },
  });

  return (
    <div className="flex flex-col items-center text-center">
      {/* Section label */}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="font-mono text-[12px] tracking-[0.2em] uppercase mb-6"
        style={{ color: 'rgba(255,255,255,0.6)' }}
      >
        [ 03 ] SELECT MODEL
      </motion.span>

      {/* Heading */}
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="text-2xl sm:text-3xl font-bold font-mono text-white mb-2"
      >
        Pick your AI engine
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-sm font-mono mb-10 max-w-sm"
        style={{ color: 'rgba(255,255,255,0.7)' }}
      >
        You can always switch later.
      </motion.p>

      {/* Provider cards — horizontal row on desktop, vertical on mobile */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-3 gap-12 w-full max-w-2xl mb-10"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {MODELS.map((model, i) => {
          const isSelected = data.chosenModel === model.id;
          const isFocused = focusedIndex === i;

          return (
            <motion.button
              key={model.id}
              type="button"
              variants={staggerItem}
              onClick={() => {
                selectModel(model.id);
                setFocusedIndex(i);
              }}
              whileTap={{ scale: 0.97 }}
              animate={isSelected ? { scale: 1.03 } : { scale: 1 }}
              className={`
                relative flex flex-col items-center gap-12 p-20 sm:p-24 rounded-20 text-center transition-all duration-300
                focus:outline-none
                ${isFocused && !isSelected ? 'ring-1 ring-white/20' : ''}
              `}
              style={{
                background: isSelected
                  ? 'rgba(255, 255, 255, 0.95)'
                  : 'rgba(255, 255, 255, 0.12)',
                backdropFilter: isSelected ? 'none' : 'blur(12px)',
                WebkitBackdropFilter: isSelected ? 'none' : 'blur(12px)',
                border: isSelected
                  ? '2px solid rgba(255, 255, 255, 1)'
                  : '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: isSelected
                  ? '0 8px 32px rgba(0, 0, 0, 0.2)'
                  : 'none',
              }}
            >
              {/* Recommended badge */}
              {'recommended' in model && model.recommended && (
                <span
                  className="absolute -top-8 left-1/2 -translate-x-1/2 font-mono text-[10px] font-semibold tracking-[0.05em] px-10 py-3 rounded-full whitespace-nowrap"
                  style={{
                    background: isSelected ? '#FFF7ED' : 'rgba(255,255,255,0.2)',
                    color: isSelected ? '#EA580C' : '#FFFFFF',
                    border: isSelected
                      ? '1px solid #FDBA74'
                      : '1px solid rgba(255,255,255,0.3)',
                  }}
                >
                  RECOMMENDED
                </span>
              )}

              {/* Provider logo */}
              <div className="w-48 h-32 flex items-center justify-center">
                <Image
                  src={model.logo}
                  alt={model.name}
                  width={100}
                  height={32}
                  className="max-h-28 w-auto object-contain transition-all duration-300"
                  style={{
                    filter: isSelected
                      ? 'brightness(0)'
                      : 'brightness(0) invert(1)',
                  }}
                />
              </div>

              {/* Provider name */}
              <span
                className="font-mono text-lg font-bold transition-colors duration-300"
                style={{
                  color: isSelected ? '#1A1A1A' : '#FFFFFF',
                }}
              >
                {model.name}
              </span>

              {/* Description */}
              <span
                className="font-mono text-[11px] leading-relaxed transition-colors duration-300"
                style={{
                  color: isSelected
                    ? 'rgba(26, 26, 26, 0.6)'
                    : 'rgba(255, 255, 255, 0.6)',
                }}
              >
                {model.description}
              </span>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Confirm button */}
      <AnimatePresence>
        {data.chosenModel && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.3 }}
            onClick={handleConfirm}
            className="px-28 py-16 rounded-16 font-mono text-base font-semibold transition-all hover:bg-white/90 active:scale-[0.98]"
            style={{
              background: '#FFFFFF',
              color: '#EA580C',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
            }}
          >
            Set default &rarr;
          </motion.button>
        )}
      </AnimatePresence>

      {/* Keyboard hint */}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-4 font-mono text-[11px] tracking-[0.1em] uppercase"
        style={{ color: 'rgba(255,255,255,0.5)' }}
      >
        &uarr;&darr; navigate &middot; enter confirm
      </motion.span>
    </div>
  );
}
