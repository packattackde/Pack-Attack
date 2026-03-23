'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface AchievementToastProps {
  title: string
  description: string
  icon?: string
  visible: boolean
  onClose: () => void
}

export function AchievementToast({ title, description, icon = '🏆', visible, onClose }: AchievementToastProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-6 right-6 z-[100] flex items-center gap-4 rounded-2xl border border-[rgba(191,255,0,0.2)] bg-[#12123a] px-6 py-4 shadow-[0_0_30px_rgba(191,255,0,0.15)]"
          onClick={onClose}
        >
          <span className="text-3xl">{icon}</span>
          <div>
            <p className="text-sm font-bold text-[#BFFF00]">{title}</p>
            <p className="text-xs text-[#8888aa]">{description}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
