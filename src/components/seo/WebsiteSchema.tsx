import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://ahoo.com.br';

export function WebsiteSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Ahoo',
    alternateName: 'Portal Ahoo',
    url: SITE_URL,
    description: 'Plataforma completa para gestao de casas de consagracao',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/buscar-casas?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    inLanguage: ['pt-BR', 'en-US'],
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

export default WebsiteSchema;
