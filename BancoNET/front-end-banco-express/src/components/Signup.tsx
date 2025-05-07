import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import accountService from '../services/AccountServices';
import Background from './Background';
import './Transfer.css'; // Reuse the transfer styling

function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    initialDeposit: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Por favor complete todos los campos obligatorios');
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Por favor ingrese un email válido');
      return;
    }
    
    // Validate initial deposit if provided
    const depositAmount = formData.initialDeposit ? parseFloat(formData.initialDeposit) : 0;
    if (formData.initialDeposit && (isNaN(depositAmount) || depositAmount < 0)) {
      setError('El depósito inicial debe ser un número positivo');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const result = await accountService.createAccount(
        formData.name,
        formData.email,
        depositAmount
      );
      
      setSuccess(`Cuenta creada con éxito. Su número de cuenta es: ${result.accountNumber}`);
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        initialDeposit: ''
      });
    
      
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Error al crear la cuenta. Por favor intente nuevamente.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      <div className="transfer-container">
        <Background />
        <h1>Crear Nueva Cuenta</h1>
        
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Nombre Completo:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Ingrese su nombre completo"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Correo Electrónico:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="ejemplo@correo.com"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="initialDeposit">Depósito Inicial (opcional):</label>
            <input
              type="number"
              id="initialDeposit"
              name="initialDeposit"
              value={formData.initialDeposit}
              onChange={handleChange}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              onClick={() => navigate('/')}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={loading}
            >
              {loading ? 'Procesando...' : 'Crear Cuenta'}
            </button>
          </div>
        </form>

        <div>
            <button onClick={() => navigate('/')} >
            Regresar a Iniciar Sesión
            </button>
        </div>

      </div>
    </>
  );
}

export default Signup;