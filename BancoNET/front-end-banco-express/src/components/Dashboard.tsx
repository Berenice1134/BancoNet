import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import accountService, { Account } from '../services/AccountServices';
import Background from './Background';
import TransactionItem from './TransactionItem'

import './Dashboard.css'

function Dashboard() {
  const { accountId } = useParams();
  const navigate = useNavigate();
  const [account, setAccount] = useState<Account | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const loadAccountData = async () => {
      try {
        // Fetch account details
        const accountData = await accountService.getAccount(accountId!);
        setAccount(accountData);
        
        // Fetch transactions
        const transactionData = await accountService.getTransactions(accountId!);
        setTransactions(transactionData);
      } catch (err) {
        setError('Error loading account data. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    loadAccountData();
  }, [accountId]);
  
  const handleLogout = () => {
    // Clear any stored tokens/data
    localStorage.removeItem('token');
    navigate('/');
  };
  
  if (loading) return <div>Loading account information...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!account) return <div>Account not found</div>;
  
  return (
    
    <div className="dashboard">
        <Background></Background>
      <div className="account-header">
        <p>Bienvenido, {account.ownerName}</p>
        <button className='logout-button' onClick={handleLogout}>Cerrar Sesión</button>
        <h3>Saldo Actual</h3>
        <h4 className="balance-amount">${account.balance.toFixed(2)}</h4>
      </div>
      
      <div className="account-actions">
        <h2>Operaciones</h2>
        <div className="action-buttons">
          <button onClick={() => navigate(`/transfer/${accountId}`)}>
            Transferir Dinero
          </button>
          <button onClick={() => navigate(`/deposit/${accountId}`)}>
            Abonar Dinero "DEV ONLY"
          </button>
          <button>
            handler test
          </button>
          <button>
            handler test
          </button>
        </div>
      </div>
      
      <div className="recent-transactions">
        <h2>Transacciones Recientes</h2>
        {transactions.length === 0 ? (
          <p>No hay transacciones recientes</p>
        ) : (
          <ul className="transaction-list">
            {transactions.slice(0, 5).map(transaction => (
              <TransactionItem 
              key={transaction.id} 
              transaction={transaction} 
              accountId={accountId!} 
            />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Dashboard;