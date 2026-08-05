export interface Expense {
  id: string;
  payer: string;
  amount: number;
  description: string;
  /**
   * Snapshot of who this expense is split among, frozen when the expense is
   * created. Adding or removing participants later must not re-split expenses
   * that were already recorded.
   */
  participants: string[];
  timestamp: number;
}

export interface Transfer {
  from: string;
  to: string;
  amount: number;
}

export interface ParticipantStats {
  totalPaid: number;
  totalOwed: number;
  netBalance: number;
  numberOfExpenses: number;
  averageExpense: number;
}
