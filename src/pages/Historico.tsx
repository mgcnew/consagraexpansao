import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants';

/**
 * Página de redirecionamento - O histórico agora está integrado na página de Cerimônias
 */
const Historico: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redireciona para a página de cerimônias com a tab de histórico
    navigate(ROUTES.CERIMONIAS + '?tab=historico', { replace: true });
  }, [navigate]);

  return null;
};

export default Historico;
