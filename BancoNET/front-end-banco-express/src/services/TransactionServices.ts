import api from './api';

export interface TransactionRequest {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description?: string;
}

export interface Transaction {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
}

export const transactionService = {
  // Create a new transaction
  createTransaction: async (transaction: TransactionRequest): Promise<Transaction> => {
    const response = await api.post('/transactions', transaction);
    return response.data;
  },
  
  // Get transaction details
  getTransaction: async (transactionId: string): Promise<Transaction> => {
    const response = await api.get(`/transactions/${transactionId}`);
    return response.data;
  }
};

export default transactionService;