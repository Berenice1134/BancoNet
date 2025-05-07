import { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import Background from './Background';
import dollarIcon from '../assets/dollar-circle-list-svgrepo-com.svg';
import accountService from '../services/AccountServices';

function Login() {

  // API Simulation


  // State variables
  const [accountId, setAccountId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accountId.trim()) {
      setMessage('Por favor ingresa un ID de cuenta válido');
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    try {
      // Real API call instead of simulation
      const exists = await accountService.verifyAccount(accountId);
      
      if (exists) {
        setMessage(`Cuenta ${accountId} encontrada. Iniciando sesión...`);
        // Store account ID in local storage or context if needed
        /* const loginResponse = await accountService.login(accountId)
        localStorage.setItem('token', loginResponse.token); // Simulate token storage */
        // Navigate to dashboard
        navigate(`/dashboard/${accountId}`);
      } else {
        setMessage('Cuenta no encontrada. Verifica el ID ingresado.');
      }
    } catch (error) {
      setMessage('Error al procesar la solicitud. Intente nuevamente.');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Background></Background>
      <div className='logo-container'>
        <h1>Bankpress</h1>
        <img src={dollarIcon} alt="Banco" />
      </div>

      <div className='text-container'>
        
        <h2>Bienvenido a la app de Banco Express</h2>
        <p>Esta es una aplicación de ejemplo para el banco.</p>
        <p>Por favor ingresa tu ID de cuenta para continuar.</p>
      </div>
      <div>
        <form onSubmit={handleSubmit}>
          <label htmlFor="id_cuenta">ID de cuenta:</label>
          <input 
            type="text" 
            id="id_cuenta" 
            name="id_cuenta"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Procesando...' : 'Iniciar Sesión'}
          </button>
        </form>
        {message && <p className="message">{message}</p>}
      </div>

    <div className='signup-container'>
      <h2>No tienes cuenta?</h2>
      <p>Empieza a transferir con Nosotros</p>
      <button onClick={() => navigate('/signup')}>
        Crear Cuenta
      </button>
    </div>

      <div className='github-container'>
        <a href="https://github.com/RainBWP/BancoNET/tree/FrontBank">Github Code</a>
      </div>
    </>
  )
}

export default Login