'use client';

import { useEffect, useState } from 'react';

/** True for touch-first devices (phones/tablets); used to disable custom cursor and tune touch UI. */
export function useCoarsePointer() {
  const [coarse, setCoarse] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse), (hover: none)');
    const update = () => setCoarse(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return coarse;
}
