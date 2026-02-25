'use client';

import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MatrixAsciiPanel from './MatrixAsciiPanel';

interface AuthLayoutProps {
  mode: 'signin' | 'signup';
  children: ReactNode;
}

export default function AuthLayout({ mode, children }: AuthLayoutProps) {
  // signin: art LEFT, form RIGHT
  // signup: form LEFT, art RIGHT
  const isSignIn = mode === 'signin';

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <AnimatePresence mode="wait" initial={false}>
        {isSignIn ? (
          <motion.div
            key="signin-layout"
            className="flex w-full h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            {/* LEFT: Matrix panel */}
            <motion.div
              className="hidden md:block w-1/2 h-full"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            >
              <MatrixAsciiPanel />
            </motion.div>

            {/* RIGHT: Form panel */}
            <motion.div
              className="w-full md:w-1/2 h-full overflow-y-auto"
              style={{ background: '#FAFAFA' }}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="flex items-center justify-center min-h-full px-6 py-12">
                <div className="w-full max-w-[400px]">{children}</div>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="signup-layout"
            className="flex w-full h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            {/* LEFT: Form panel */}
            <motion.div
              className="w-full md:w-1/2 h-full overflow-y-auto"
              style={{ background: '#FAFAFA' }}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="flex items-center justify-center min-h-full px-6 py-12">
                <div className="w-full max-w-[400px]">{children}</div>
              </div>
            </motion.div>

            {/* RIGHT: Matrix panel */}
            <motion.div
              className="hidden md:block w-1/2 h-full"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            >
              <MatrixAsciiPanel />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
