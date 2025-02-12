export interface Expense {
  id: number;
  payer: string;
  amount: number;
  description: string;
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
