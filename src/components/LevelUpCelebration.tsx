'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'

interface LevelUpCelebrationProps {
  level: number
  title: string
  visible: boolean
  onClose: () => void
}

export function LevelUpCelebration({ level, title, visible, onClose }: LevelUpCelebrationProps) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onClose, 4000)
      return () => clearTimeout(timer)
    }
  }, [visible, onClose])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
              className="mb-4 text-6xl"
            >
              ⬆️
            </motion.div>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="font-heading text-lg font-bold uppercase tracking-widest text-[#8888aa]"
            >
              Level Up!
            </motion.p>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="font-heading text-7xl font-extrabold text-[#C84FFF] drop-shadow-[0_0_30px_rgba(200,79,255,0.4)]"
            >
              {level}
            </motion.p>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-2 text-lg font-semibold text-[#f0f0f5]"
            >
              {title}
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
