import api from './api';

export interface Account {
  id: string;
  accountNumber: string;
  balance: number;
  ownerName: string;
  // Add other properties as needed
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    // Other user properties
  };
}

export interface TransferResponse {
  success: boolean;
  message: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transaction?: any; // You could create a Transaction interface for better typing
}

export interface CreateAccountResponse {
  success: boolean;
  accountNumber: string;
  message: string;
}

export const accountService = {
  // Get account info
  getAccount: async (accountId: string): Promise<Account> => {
    const response = await api.get(`/accounts/${accountId}`);
    return response.data;
  },
  
  // Verify account exists
  verifyAccount: async (accountId: string): Promise<boolean> => {
    try {
      const response = await api.get(`/account_verifications/${accountId}`);
      return response.data.exists;
    } catch {
        // Handle error (e.g., account not found)
        console.error('Error verifying account:', Error);
      return false;
    }
  },
  
  // Login with account
  login: async (accountId: string): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', { accountId});
    return response.data;
  },

  // DEV ONLY: Deposit money into account
  deposit: async (accountId: string, amount: number): Promise<void> => {
    await api.post(`/accounts/${accountId}/deposit`, { amount });
  },

  // Create a new account
  createAccount: async (name: string, email: string, initialDeposit: number = 0): Promise<CreateAccountResponse> => {
    const response = await api.post('/accounts', { 
      name, 
      email, 
      initialDeposit 
    });
    return response.data;
  },
  
  // Get account transactions
  getTransactions: async (accountId: string) => {
    const response = await api.get(`/accounts/${accountId}/transactions`);
    return response.data;
  },
  transferMoney: async (fromAccountId: string, toAccountId: string, amount: number, description?: string): Promise<TransferResponse> => {
    try {
      // Step 1: Check if source account exists and has sufficient funds
      const sourceAccount = await accountService.getAccount(fromAccountId);
      
      // Step 2: Check if destination account exists
      try {
        await accountService.getAccount(toAccountId);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch {
        return {
          success: false,
          message: `La cuenta destino ${toAccountId} no existe.`
        };
      }
      
      // Step 3: Verify sufficient funds
      if (sourceAccount.balance < amount) {
        return {
          success: false,
          message: `Fondos insuficientes. Saldo actual: $${sourceAccount.balance.toFixed(2)}`
        };
      }
      
      // Step 4: If all validation passes, process the transaction
      const response = await api.post('/transactions', {
        fromAccountId,
        toAccountId,
        amount,
        description: description || 'Transferencia',
        timestamp: new Date().toISOString(),
        status: 'completed'
      });
      
      return {
        success: true,
        message: 'Transferencia completada exitosamente',
        transaction: response.data
      };
    } catch (error) {
      console.error('Error processing transfer:', error);
      return {
        success: false,
        message: 'Error al procesar la transferencia. Por favor intente nuevamente.'
      };
    }
  },
};

export default accountService;