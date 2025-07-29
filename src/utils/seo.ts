
export interface SEOMetadata {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
}

export const updatePageSEO = (metadata: SEOMetadata) => {
  // Update title
  document.title = metadata.title;

  // Update or create meta tags
  const updateMetaTag = (name: string, content: string, property = false) => {
    const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
    let meta = document.querySelector(selector);
    
    if (!meta) {
      meta = document.createElement('meta');
      if (property) {
        meta.setAttribute('property', name);
      } else {
        meta.setAttribute('name', name);
      }
      document.head.appendChild(meta);
    }
    
    meta.setAttribute('content', content);
  };

  // Update basic meta tags
  updateMetaTag('description', metadata.description);
  if (metadata.keywords) {
    updateMetaTag('keywords', metadata.keywords);
  }

  // Update canonical URL
  if (metadata.canonical) {
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', metadata.canonical);
  }

  // Update Open Graph tags
  updateMetaTag('og:title', metadata.ogTitle || metadata.title, true);
  updateMetaTag('og:description', metadata.ogDescription || metadata.description, true);
  if (metadata.ogImage) {
    updateMetaTag('og:image', metadata.ogImage, true);
  }
  if (metadata.ogUrl) {
    updateMetaTag('og:url', metadata.ogUrl, true);
  }

  // Update Twitter tags
  updateMetaTag('twitter:title', metadata.twitterTitle || metadata.title);
  updateMetaTag('twitter:description', metadata.twitterDescription || metadata.description);
  if (metadata.twitterImage) {
    updateMetaTag('twitter:image', metadata.twitterImage);
  }
};

export const generateProjectSEO = (project: any): SEOMetadata => {
  const baseUrl = 'https://user.usergy.ai';
  const projectUrl = `${baseUrl}/dashboard/project/${project.id}`;
  
  return {
    title: `Project: ${project.title} | Usergy`,
    description: `${project.description.substring(0, 150)}... | Join this AI product insights project on Usergy and earn rewards while contributing to innovation.`,
    keywords: `AI product insights, user insights, ${project.title}, paid opportunities, tech community, digital collaboration`,
    canonical: projectUrl,
    ogTitle: `${project.title} - AI Product Insights Project`,
    ogDescription: `Contribute to ${project.title} on Usergy's AI-powered user insights platform. Earn $${project.reward} while helping shape the future of software products.`,
    ogImage: `${baseUrl}/usergy-favicon.svg`,
    ogUrl: projectUrl,
    twitterTitle: `${project.title} - AI Product Insights Project`,
    twitterDescription: `Contribute to ${project.title} on Usergy's AI-powered user insights platform. Earn $${project.reward} while helping shape the future of software products.`,
    twitterImage: `${baseUrl}/usergy-favicon.svg`
  };
};

export const generateUserProfileSEO = (user: any): SEOMetadata => {
  const baseUrl = 'https://user.usergy.ai';
  const profileUrl = `${baseUrl}/profile/${user.id}`;
  
  return {
    title: `${user.full_name} - Explorer Profile | Usergy`,
    description: `Connect with ${user.full_name}, a digital pioneer on Usergy's AI-powered user insights platform. Explore their expertise and collaboration history.`,
    keywords: `${user.full_name}, digital pioneer, AI product insights, user insights, tech community, collaboration`,
    canonical: profileUrl,
    ogTitle: `${user.full_name} - Digital Pioneer on Usergy`,
    ogDescription: `Connect with ${user.full_name}, a digital pioneer on Usergy's AI-powered user insights platform.`,
    ogImage: user.avatar_url || `${baseUrl}/usergy-favicon.svg`,
    ogUrl: profileUrl
  };
};
