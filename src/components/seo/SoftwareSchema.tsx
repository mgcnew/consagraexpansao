import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://ahoo.com.br';

export function SoftwareApplicationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Ahoo',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web, iOS, Android',
    description: 'Plataforma completa para gestao de casas de consagracao. Gerencie cerimonias, inscricoes, pagamentos, cursos e muito mais.',
    url: SITE_URL,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'BRL',
      description: '7 dias gratis para testar',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '50',
      bestRating: '5',
      worstRating: '1',
    },
    featureList: [
      'Gestao de cerimonias',
      'Inscricoes online',
      'Pagamentos Pix e cartao',
      'Loja virtual',
      'Cursos e eventos',
      'Relatorios financeiros',
      'Galeria de fotos',
      'Depoimentos',
    ],
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

export default SoftwareApplicationSchema;
