'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
        style={{ color: 'rgba(255,255,255,0.45)' }}
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
        Pick your default model
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-sm font-mono mb-10 max-w-sm"
        style={{ color: 'rgba(255,255,255,0.4)' }}
      >
        You can always switch later. Choose the AI engine for your builds.
      </motion.p>

      {/* Model cards - vertical stack */}
      <motion.div
        className="flex flex-col gap-12 w-full max-w-xl mb-10"
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
              whileTap={{ scale: 0.98 }}
              animate={isSelected ? { scale: 1.01 } : { scale: 1 }}
              className={`
                group relative flex items-center gap-16 p-16 sm:p-20 rounded-12 text-left transition-all duration-300
                focus:outline-none focus:ring-2 focus:ring-heat-100/30
                ${isFocused && !isSelected ? 'ring-1 ring-white/10' : ''}
              `}
              style={{
                background: isSelected
                  ? 'rgba(250, 93, 25, 0.08)'
                  : 'rgba(255, 255, 255, 0.03)',
                border: isSelected
                  ? '1px solid #FA5D19'
                  : '1px solid rgba(255, 255, 255, 0.06)',
                boxShadow: isSelected
                  ? '0 0 20px rgba(250, 93, 25, 0.15)'
                  : 'none',
              }}
            >
              {/* Corner brackets */}
              <div
                className="absolute top-0 left-0 border-t border-l transition-all duration-300"
                style={{
                  width: isSelected ? '20px' : '12px',
                  height: isSelected ? '20px' : '12px',
                  borderColor: isSelected
                    ? '#FA5D19'
                    : 'rgba(255,255,255,0.1)',
                  opacity: isSelected ? 1 : 0.4,
                }}
              />
              <div
                className="absolute bottom-0 right-0 border-b border-r transition-all duration-300"
                style={{
                  width: isSelected ? '20px' : '12px',
                  height: isSelected ? '20px' : '12px',
                  borderColor: isSelected
                    ? '#FA5D19'
                    : 'rgba(255,255,255,0.1)',
                  opacity: isSelected ? 1 : 0.4,
                }}
              />

              {/* Provider circle */}
              <div
                className="w-40 h-40 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                style={{ background: model.color }}
              >
                {'initial' in model ? (model as { initial: string }).initial : model.name[0]}
              </div>

              {/* Model info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-8 mb-2">
                  <span className="font-mono text-sm font-medium text-white">
                    {model.name}
                  </span>
                  {'recommended' in model && model.recommended && (
                    <span
                      className="font-mono text-[11px] font-medium tracking-[0.05em] px-8 py-3 rounded-full"
                      style={{
                        background: 'rgba(250, 93, 25, 0.1)',
                        color: '#FA5D19',
                        border: '1px solid rgba(250, 93, 25, 0.3)',
                      }}
                    >
                      RECOMMENDED
                    </span>
                  )}
                </div>
                <span
                  className="block font-mono text-[11px] mb-4"
                  style={{ color: 'rgba(255,255,255,0.45)' }}
                >
                  {model.provider}
                </span>
                <p
                  className="font-mono text-[12px] mb-8 hidden sm:block"
                  style={{ color: 'rgba(255,255,255,0.3)' }}
                >
                  {model.description}
                </p>

                {/* Capability bars */}
                <div className="flex gap-12 sm:gap-16">
                  {[
                    { label: 'SPD', value: model.speed },
                    { label: 'QLT', value: model.quality },
                    { label: 'CAP', value: model.capability },
                  ].map((bar) => (
                    <div key={bar.label} className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className="font-mono text-[9px] tracking-[0.1em]"
                          style={{ color: 'rgba(255,255,255,0.25)' }}
                        >
                          {bar.label}
                        </span>
                        <span
                          className="font-mono text-[9px]"
                          style={{ color: 'rgba(255,255,255,0.2)' }}
                        >
                          {bar.value}
                        </span>
                      </div>
                      <div
                        className="h-4 rounded-full overflow-hidden"
                        style={{ background: 'rgba(255,255,255,0.06)' }}
                      >
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: isSelected ? '#FA5D19' : 'rgba(255,255,255,0.2)' }}
                          initial={{ width: '0%' }}
                          animate={{ width: `${bar.value}%` }}
                          transition={{ duration: 0.7, delay: i * 0.1 + 0.3, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
            className="px-24 py-14 rounded-12 font-mono text-label-large text-white transition-all hover:opacity-90 active:scale-[0.98] heat-glow"
            style={{ background: '#FA5D19' }}
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
        style={{ color: 'rgba(255,255,255,0.25)' }}
      >
        ↑↓ navigate &middot; enter confirm
      </motion.span>
    </div>
  );
}
