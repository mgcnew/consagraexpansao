import { Helmet } from 'react-helmet-async';

interface OrganizationSchemaProps {
  name?: string;
  description?: string;
  logo?: string;
  url?: string;
}

interface LocalBusinessSchemaProps {
  name: string;
  description?: string;
  image?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  };
  geo?: {
    latitude: number;
    longitude: number;
  };
  telephone?: string;
  url?: string;
}

interface EventSchemaProps {
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  location?: {
    name: string;
    address?: string;
  };
  image?: string;
  url?: string;
  organizer?: {
    name: string;
    url?: string;
  };
  offers?: {
    price: number;
    currency?: string;
    availability?: 'InStock' | 'SoldOut' | 'PreOrder';
  };
}

const SITE_URL = 'https://ahoo.com.br';

export function OrganizationSchema({
  name = 'Ahoo',
  description = 'Plataforma completa para gestao de casas de consagracao',
  logo = '/logo.png',
  url = SITE_URL,
}: OrganizationSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    description,
    logo: logo.startsWith('http') ? logo : `${SITE_URL}${logo}`,
    url,
    sameAs: [],
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

export function LocalBusinessSchema({
  name,
  description,
  image,
  address,
  geo,
  telephone,
  url,
}: LocalBusinessSchemaProps) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name,
    description,
    url,
  };

  if (image) {
    schema.image = image.startsWith('http') ? image : `${SITE_URL}${image}`;
  }

  if (address) {
    schema.address = {
      '@type': 'PostalAddress',
      streetAddress: address.street,
      addressLocality: address.city,
      addressRegion: address.state,
      postalCode: address.postalCode,
      addressCountry: 'BR',
    };
  }

  if (geo) {
    schema.geo = {
      '@type': 'GeoCoordinates',
      latitude: geo.latitude,
      longitude: geo.longitude,
    };
  }

  if (telephone) {
    schema.telephone = telephone;
  }

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

export function EventSchema({
  name,
  description,
  startDate,
  endDate,
  location,
  image,
  url,
  organizer,
  offers,
}: EventSchemaProps) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name,
    description,
    startDate,
    endDate: endDate || startDate,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  };

  if (image) {
    schema.image = image.startsWith('http') ? image : `${SITE_URL}${image}`;
  }

  if (url) {
    schema.url = url;
  }

  if (location) {
    schema.location = {
      '@type': 'Place',
      name: location.name,
      address: location.address,
    };
  }

  if (organizer) {
    schema.organizer = {
      '@type': 'Organization',
      name: organizer.name,
      url: organizer.url,
    };
  }

  if (offers) {
    schema.offers = {
      '@type': 'Offer',
      price: offers.price / 100,
      priceCurrency: offers.currency || 'BRL',
      availability: `https://schema.org/${offers.availability || 'InStock'}`,
    };
  }

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}
