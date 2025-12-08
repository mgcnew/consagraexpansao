/**
 * Mensagens padronizadas para toasts e feedback do usuário
 */

export const TOAST_MESSAGES = {
  // Depoimentos
  depoimento: {
    aprovado: {
      title: 'Depoimento aprovado',
      description: 'O depoimento foi publicado e já está visível na página de depoimentos.',
    },
    rejeitado: {
      title: 'Depoimento rejeitado',
      description: 'O depoimento foi removido do sistema.',
    },
    erroAprovar: {
      title: 'Erro ao aprovar',
      description: 'Não foi possível aprovar o depoimento. Tente novamente.',
    },
    erroRejeitar: {
      title: 'Erro ao rejeitar',
      description: 'Não foi possível rejeitar o depoimento. Tente novamente.',
    },
  },

  // Pagamentos
  pagamento: {
    atualizado: {
      title: 'Pagamento atualizado',
      description: 'O status de pagamento foi alterado com sucesso.',
    },
    confirmado: {
      title: 'Pagamento confirmado',
      description: 'A inscrição foi marcada como paga.',
    },
    pendente: {
      title: 'Pagamento pendente',
      description: 'A inscrição foi marcada como pendente.',
    },
    erro: {
      title: 'Erro ao atualizar',
      description: 'Não foi possível atualizar o status de pagamento. Tente novamente.',
    },
  },

  // Roles/Papéis
  role: {
    atualizado: {
      title: 'Papel atualizado',
      description: 'As permissões do usuário foram alteradas com sucesso.',
    },
    erro: {
      title: 'Erro ao atualizar papel',
      description: 'Não foi possível alterar as permissões do usuário. Tente novamente.',
    },
  },

  // Notificações
  notificacao: {
    lida: {
      title: 'Notificação lida',
      description: 'A notificação foi marcada como lida.',
    },
  },

  // Inscrições
  inscricao: {
    sucesso: {
      title: 'Inscrição realizada',
      description: 'Sua inscrição foi confirmada com sucesso!',
    },
    cancelada: {
      title: 'Inscrição cancelada',
      description: 'Sua inscrição foi cancelada.',
    },
    erro: {
      title: 'Erro na inscrição',
      description: 'Não foi possível processar sua inscrição. Tente novamente.',
    },
  },

  // Cerimônias
  cerimonia: {
    criada: {
      title: 'Cerimônia criada',
      description: 'A nova cerimônia foi adicionada ao calendário.',
    },
    atualizada: {
      title: 'Cerimônia atualizada',
      description: 'As informações da cerimônia foram salvas.',
    },
    removida: {
      title: 'Cerimônia removida',
      description: 'A cerimônia foi excluída do sistema.',
    },
    erro: {
      title: 'Erro na operação',
      description: 'Não foi possível processar a operação. Tente novamente.',
    },
  },

  // Anamnese
  anamnese: {
    salva: {
      title: 'Ficha salva',
      description: 'Sua ficha de anamnese foi salva com sucesso.',
    },
    erro: {
      title: 'Erro ao salvar',
      description: 'Não foi possível salvar sua ficha. Tente novamente.',
    },
  },

  // Genéricos
  generico: {
    sucesso: {
      title: 'Operação realizada',
      description: 'A operação foi concluída com sucesso.',
    },
    erro: {
      title: 'Erro',
      description: 'Ocorreu um erro inesperado. Tente novamente.',
    },
    permissao: {
      title: 'Sem permissão',
      description: 'Você não tem permissão para realizar esta ação.',
    },
    sessaoExpirada: {
      title: 'Sessão expirada',
      description: 'Sua sessão expirou. Faça login novamente.',
    },
  },
} as const;
