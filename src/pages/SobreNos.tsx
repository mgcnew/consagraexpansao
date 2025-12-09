import React from 'react';
import { Info, User, Sparkles, Heart, BookOpen, Award } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader, PageContainer } from '@/components/shared';

const SobreNos: React.FC = () => {
  return (
    <PageContainer maxWidth="lg">
      <PageHeader
        icon={Info}
        title="Sobre Nós"
        description="Conheça nossa história, nosso propósito e quem conduz nossos trabalhos sagrados."
      />

      <Tabs defaultValue="templo" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="templo" className="gap-2">
            <Sparkles className="w-4 h-4" />
            O Templo
          </TabsTrigger>
          <TabsTrigger value="mestre" className="gap-2">
            <User className="w-4 h-4" />
            Mestre de Cerimônia
          </TabsTrigger>
        </TabsList>

        {/* Tab do Templo */}
        <TabsContent value="templo" className="animate-in fade-in-50">
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-display font-semibold text-primary mb-2">
                  Templo Xamânico Universalista
                </h2>
                <p className="text-muted-foreground">
                  Um espaço sagrado dedicado ao despertar da consciência
                </p>
              </div>

              <div className="prose prose-lg dark:prose-invert max-w-none space-y-4 text-foreground/90">
                <p>
                  Somos um <strong>Templo Xamânico Universalista</strong>, um espaço sagrado dedicado ao despertar da consciência, ao acolhimento amoroso e à cura espiritual. Aqui, caminhamos guiados por Deus, por Jesus Cristo e pelos mentores espirituais, valorizando a luz divina que habita em cada ser.
                </p>

                <p>
                  Em nosso templo, consagramos com profundo respeito e responsabilidade as medicinas sagradas <strong>Ayahuasca</strong>, <strong>Rapé</strong>, <strong>Sananga</strong>, entre outras ferramentas de cura ancestral e espiritual. Também realizamos trabalhos de energização, harmonização, limpeza espiritual e vivências que despertam o autoconhecimento e a conexão com o sagrado.
                </p>

                <p>
                  Acreditamos que <strong>todos são bem-vindos</strong>. Não limitamos ninguém, pois compreendemos que cada alma está em seu próprio caminho de evolução. A única condição para caminhar conosco é crer em Deus, pois é Ele quem guia, protege e ilumina nossos trabalhos.
                </p>

                <p>
                  Desde nossa fundação, em <strong>2021</strong>, temos dedicado cada cerimônia ao amor, ao equilíbrio e ao propósito maior de servir ao próximo. Ao longo desses anos, presenciamos inúmeras histórias de superação e renascimento. São relatos de cura, transformação e libertação que surgem ao final de cada trabalho — e até mesmo meses depois, quando as pessoas retornam para compartilhar como as medicinas seguiram agindo em suas vidas, trazendo clareza, força e paz.
                </p>

                <p>
                  Cada testemunho é para nós uma bênção, uma confirmação do quanto o caminho é sagrado e do quanto Deus age através das medicinas e das vivências espirituais. Somos profundamente gratos por testemunhar tantas vidas florescendo, tantos corações sendo restaurados e tantos espíritos reencontrando sua verdadeira essência.
                </p>

                <p>
                  Nosso propósito é simples e sagrado: <strong>honrar as medicinas, honrar o divino e honrar você</strong>, que chega até nós com fé, coragem e coração aberto.
                </p>

                <div className="text-center pt-4 border-t border-border/50">
                  <p className="text-primary font-medium flex items-center justify-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Se você sente o chamado, permita-se viver essa experiência.
                  </p>
                  <p className="text-muted-foreground mt-2">
                    Venha fazer parte do nosso templo e caminhar conosco rumo à consciência divina.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>


        {/* Tab do Mestre de Cerimônia */}
        <TabsContent value="mestre" className="animate-in fade-in-50">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-8">
                {/* Foto placeholder */}
                <div className="flex-shrink-0 mx-auto md:mx-0">
                  <div className="w-48 h-48 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary/20">
                    <User className="w-24 h-24 text-primary/40" />
                  </div>
                </div>

                {/* Informações */}
                <div className="flex-1 space-y-6">
                  <div className="text-center md:text-left">
                    <h2 className="text-2xl font-display font-semibold text-primary">
                      Txai Raimundo Ferreira Lima
                    </h2>
                    <p className="text-muted-foreground mt-1">
                      Mestre de Cerimônia • Guia Espiritual
                    </p>
                  </div>

                  <div className="prose prose-lg dark:prose-invert max-w-none space-y-4 text-foreground/90">
                    <p>
                      Com quase <strong>50 anos de caminhada espiritual</strong>, Txai Raimundo Ferreira Lima é um guardião das tradições ancestrais e um dedicado servidor da luz divina. Sua jornada é marcada pela busca incessante pelo conhecimento sagrado e pelo compromisso de guiar almas em seus processos de cura e transformação.
                    </p>

                    <p>
                      Formado pela <strong>Casa AUYA</strong>, uma das mais respeitadas instituições formadoras de mestres de cerimônia no Brasil, Txai Raimundo traz consigo a sabedoria e os ensinamentos transmitidos por grandes mestres da tradição ayahuasqueira. Sua formação combina o rigor do conhecimento tradicional com a sensibilidade necessária para conduzir trabalhos espirituais profundos e transformadores.
                    </p>

                    <p>
                      Além de sua formação xamânica, Txai Raimundo possui <strong>bacharelados em Teologia</strong>, o que lhe confere uma visão ampla e universalista da espiritualidade. Essa combinação única de conhecimentos permite que ele acolha pessoas de diferentes crenças e tradições, sempre respeitando a individualidade de cada caminhante.
                    </p>

                    <p>
                      Sua condução é marcada pelo <strong>amor, pela firmeza e pela sabedoria</strong>. Em cada cerimônia, Txai Raimundo cria um ambiente seguro e sagrado, onde os participantes podem se entregar ao processo de cura com confiança e entrega. Seu olhar atento e sua presença serena são faróis que iluminam o caminho daqueles que buscam a reconexão com o divino.
                    </p>
                  </div>

                  {/* Credenciais */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-border/50">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Heart className="w-8 h-8 text-primary" />
                      <div>
                        <p className="font-medium text-sm">Experiência</p>
                        <p className="text-xs text-muted-foreground">~50 anos de caminhada</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Award className="w-8 h-8 text-primary" />
                      <div>
                        <p className="font-medium text-sm">Formação</p>
                        <p className="text-xs text-muted-foreground">Casa AUYA</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <BookOpen className="w-8 h-8 text-primary" />
                      <div>
                        <p className="font-medium text-sm">Acadêmico</p>
                        <p className="text-xs text-muted-foreground">Bacharel em Teologia</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
};

export default SobreNos;
