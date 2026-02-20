import LeadRedirect from './LeadRedirect';

export async function generateMetadata({ params }) {
  const { leadId } = params;

  return {
    title: 'Tenant Lead | Yoombaa',
    description:
      'View this tenant lead on the Yoombaa app — Africa\'s #1 platform for real estate agents.',
    openGraph: {
      title: '\ud83c\udfe0 Tenant Lead on Yoombaa',
      description:
        'A tenant is looking for a property. Open in the Yoombaa app to view lead details and connect.',
      type: 'website',
      siteName: 'Yoombaa',
      url: `https://www.yoombaa.com/lead/${leadId}`,
      images: [
        {
          url: '/yoombaa-logo.png',
          width: 512,
          height: 512,
          alt: 'Yoombaa',
        },
      ],
    },
    twitter: {
      card: 'summary',
      title: '\ud83c\udfe0 Tenant Lead on Yoombaa',
      description:
        'A tenant is looking for a property. Open in the Yoombaa app to view details.',
    },
  };
}

export default function LeadPage({ params }) {
  return <LeadRedirect leadId={params.leadId} />;
}
