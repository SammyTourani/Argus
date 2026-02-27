export default function StructuredData() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "Argus",
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Web",
        description:
          "AI-powered website builder that clones and rebuilds any website as production React code",
        url: "https://buildargus.dev",
        offers: {
          "@type": "AggregateOffer",
          lowPrice: "0",
          highPrice: "49",
          priceCurrency: "USD",
        },
      },
      {
        "@type": "Organization",
        name: "Argus",
        url: "https://buildargus.dev",
        logo: "https://buildargus.dev/argus-assets/official_eye.png",
      },
      {
        "@type": "WebSite",
        url: "https://buildargus.dev",
        name: "Argus - AI Website Builder",
        potentialAction: {
          "@type": "SearchAction",
          target:
            "https://buildargus.dev/gallery?q={search_term_string}",
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
