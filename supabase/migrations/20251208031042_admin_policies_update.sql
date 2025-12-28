-- Política para Admin ver TODAS as anamneses
CREATE POLICY "Admins can view all anamneses" 
ON public.anamneses 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Política para Admin ver TODAS as inscrições
CREATE POLICY "Admins can view all inscricoes" 
ON public.inscricoes 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Política para Admin ver TODOS os registros pós-cerimônia
CREATE POLICY "Admins can view all pos_cerimonia" 
ON public.pos_cerimonia 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Garantir que Admin também possa editar/atualizar se necessário (opcional, mas útil)
CREATE POLICY "Admins can update all anamneses" 
ON public.anamneses 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));
;
