import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import accountService from '../services/AccountServices';
import Background from './Background';

import './Transfer.css';

function Transfer() {
  const { accountId } = useParams();
  const navigate = useNavigate();
  const [toAccountId, setToAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!toAccountId.trim() || !amount.trim()) {
      setError('Por favor complete todos los campos obligatorios');
      return;
    }
    
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      setError('Por favor ingrese un monto válido');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      if (!accountId) {
        throw new Error('Account ID is required');
      }
      
      const result = await accountService.transferMoney(
        accountId, 
        toAccountId, 
        amountValue, 
        description
      );
      
      if (result.success) {
        setSuccess(`Transferencia exitosa de $${amountValue.toFixed(2)} a la cuenta ${toAccountId}`);
        
        // Clear form
        setToAccountId('');
        setAmount('');
        setDescription('');
        
        // Redirect after a short delay
        setTimeout(() => {
          navigate(`/dashboard/${accountId}`);
        }, 2000);
      } else {
        // Handle specific failure reason from the service
        setError(result.message);
      }
    } catch (err) {
      setError('Error al procesar la transferencia. Por favor intente nuevamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      <div className="transfer-container">
          <Background></Background>
        <h1>Transferencia Bancaria</h1>
        
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="toAccountId">Cuenta Destino:</label>
            <input
              type="text"
              id="toAccountId"
              value={toAccountId}
              onChange={(e) => setToAccountId(e.target.value)}
              placeholder='0000'
              required
            />
          </div>
          
            <div className="form-group">
            <label htmlFor="amount">Monto:</label>
            <input
              type="text"
              id="amount"
              value={amount ? `$${amount}` : ''}
              onChange={(e) => {
              const inputValue = e.target.value.replace(/^\$/, '');
              setAmount(inputValue);
              }}
              placeholder="$0.00"
              required
            />
            </div>
          
          <div className="form-group">
            <label htmlFor="description">Descripción:</label>
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Transferencia a cuenta"
              
            />
          </div>
          
          <div className="form-actions">
            <button type="button" onClick={() => navigate(`/dashboard/${accountId}`)}>
              Cancelar
            </button>
            <button type="submit" disabled={loading}>
              {loading ? 'Procesando...' : 'Transferir'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default Transfer;