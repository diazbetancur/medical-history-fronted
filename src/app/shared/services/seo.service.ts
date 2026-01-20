import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { SeoMeta } from '@data/models';

/**
 * SEO Service for managing meta tags, title, and OpenGraph data.
 * SSR compatible - works on both server and browser.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly defaultTitle =
    'ProDirectory - Encuentra Profesionales de Confianza';
  private readonly defaultDescription =
    'Conecta con profesionales verificados en tu área. Plomeros, electricistas, abogados y más.';
  private readonly siteName = 'ProDirectory';
  private readonly defaultOgImage = '/icons/og-image.png';

  /**
   * Set all SEO meta tags from a SeoMeta object
   */
  setSeo(seo: SeoMeta): void {
    this.setTitle(seo.title);
    this.setDescription(seo.description);

    if (seo.canonical) {
      this.setCanonical(seo.canonical);
    }

    this.setOpenGraph({
      title: seo.title,
      description: seo.description,
      image: seo.ogImage,
    });

    this.setTwitterCard({
      title: seo.title,
      description: seo.description,
      image: seo.ogImage,
    });
  }

  /**
   * Set page title
   */
  setTitle(title: string): void {
    const fullTitle = title ? `${title} | ${this.siteName}` : this.defaultTitle;
    this.title.setTitle(fullTitle);
  }

  /**
   * Set meta description
   */
  setDescription(description: string): void {
    const desc = description || this.defaultDescription;
    this.meta.updateTag({ name: 'description', content: desc });
  }

  /**
   * Set canonical URL
   */
  setCanonical(url: string): void {
    // Remove existing canonical link
    const existingCanonical = this.document.querySelector(
      'link[rel="canonical"]'
    );
    if (existingCanonical) {
      existingCanonical.remove();
    }

    // Create new canonical link
    const link = this.document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', url);
    this.document.head.appendChild(link);
  }

  /**
   * Set OpenGraph meta tags
   */
  setOpenGraph(og: {
    title: string;
    description: string;
    image?: string;
    url?: string;
  }): void {
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:site_name', content: this.siteName });
    this.meta.updateTag({
      property: 'og:title',
      content: og.title || this.defaultTitle,
    });
    this.meta.updateTag({
      property: 'og:description',
      content: og.description || this.defaultDescription,
    });
    this.meta.updateTag({
      property: 'og:image',
      content: og.image || this.defaultOgImage,
    });

    if (og.url) {
      this.meta.updateTag({ property: 'og:url', content: og.url });
    }
  }

  /**
   * Set Twitter Card meta tags
   */
  setTwitterCard(twitter: {
    title: string;
    description: string;
    image?: string;
  }): void {
    this.meta.updateTag({
      name: 'twitter:card',
      content: 'summary_large_image',
    });
    this.meta.updateTag({
      name: 'twitter:title',
      content: twitter.title || this.defaultTitle,
    });
    this.meta.updateTag({
      name: 'twitter:description',
      content: twitter.description || this.defaultDescription,
    });
    this.meta.updateTag({
      name: 'twitter:image',
      content: twitter.image || this.defaultOgImage,
    });
  }

  /**
   * Set robots meta tag
   */
  setRobots(content: string): void {
    this.meta.updateTag({ name: 'robots', content });
  }

  /**
   * Reset to default SEO settings
   */
  resetToDefaults(): void {
    this.setTitle('');
    this.setDescription('');
    this.setOpenGraph({ title: '', description: '' });
    this.setTwitterCard({ title: '', description: '' });
  }

  /**
   * Add JSON-LD structured data
   */
  setJsonLd(data: Record<string, unknown>): void {
    // Remove existing JSON-LD script
    const existingScript = this.document.querySelector(
      'script[type="application/ld+json"]'
    );
    if (existingScript) {
      existingScript.remove();
    }

    // Create new JSON-LD script
    const script = this.document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(data);
    this.document.head.appendChild(script);
  }

  /**
   * Set Professional structured data (JSON-LD)
   */
  setProfessionalSchema(professional: {
    name: string;
    description: string;
    image?: string;
    rating?: number;
    reviewCount?: number;
  }): void {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: professional.name,
      description: professional.description,
      image: professional.image,
      aggregateRating: professional.rating
        ? {
            '@type': 'AggregateRating',
            ratingValue: professional.rating,
            reviewCount: professional.reviewCount || 0,
          }
        : undefined,
    };

    this.setJsonLd(schema);
  }

  /**
   * Check if running in browser
   */
  get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }
}
