export interface Expense {
  id: number;
  payer: string;
  amount: number;
  description: string;
  timestamp: number;
}

export interface Transfer {
  from: string;
  to: string;
  amount: number;
}

export interface Balance {
  person: string;
  amount: number;
}

export interface ParticipantStats {
  totalPaid: number;
  totalOwed: number;
  netBalance: number;
  numberOfExpenses: number;
  averageExpense: number;
}

export interface Partecipant {
  id: number;
  name: string;
}
