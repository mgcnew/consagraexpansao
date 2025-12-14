import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTotalNaoLidas } from '@/hooks/queries/useChat';
import { ROUTES } from '@/constants';

const ChatBell: React.FC = () => {
  const navigate = useNavigate();
  const { data: count = 0 } = useTotalNaoLidas();

  return (
    <Button
      variant="ghost"
      size="sm"
      className="relative gap-2 text-muted-foreground hover:text-foreground hover:bg-accent"
      onClick={() => navigate(ROUTES.CHAT)}
      title="Mensagens"
    >
      <MessageCircle className="w-4 h-4" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Button>
  );
};

export default ChatBell;
