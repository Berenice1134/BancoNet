import React from 'react';
import './TransactionItem.css';

// Define the Transaction interface
interface Transaction {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
}

interface TransactionItemProps {
  transaction: Transaction;
  accountId: string;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, accountId }) => {
  return (
    <div key={transaction.id} className="transaction-item">
      <p className='transaction-name'>{transaction.description}</p>
      <div className={transaction.fromAccountId === accountId ? "amount-negative" : "amount-positive"}>
        {transaction.fromAccountId === accountId ? '-' : '+'}${transaction.amount.toFixed(2)}
      </div>
      <div className="transaction-date">
        {new Date(transaction.timestamp).toLocaleDateString()}
      </div>
    </div>
  );
};

export default TransactionItem;