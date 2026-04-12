export type Role = 'USER' | 'ADMIN' | 'SHOP_OWNER';

export type CardGame = 'MAGIC_THE_GATHERING' | 'ONE_PIECE' | 'POKEMON' | 'LORCANA';

export type BattleStatus = 'OPEN' | 'FULL' | 'READY' | 'ACTIVE' | 'FINISHED_WIN' | 'FINISHED_DRAW' | 'CANCELLED';

export type BattleMode = 'LOWEST_CARD' | 'HIGHEST_CARD';

export type WinCondition = 'HIGHEST' | 'LOWEST' | 'SHARE_MODE';

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export interface User {
  id: string;
  email: string;
  name?: string | null;
  role: Role;
  coins: number;
}

