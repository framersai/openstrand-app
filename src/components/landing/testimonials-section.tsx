'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Quote, Star } from 'lucide-react';

import { cn } from '@/lib/utils';

interface TestimonialsSectionProps {
  id?: string;
  className?: string;
}

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  company: string;
  rating: number;
  theme: string;
}

export function TestimonialsSection({ id, className }: TestimonialsSectionProps) {
  const t = useTranslations('landing.testimonials');

  const testimonials = useMemo<Testimonial[]>(
    () => [
      {
        quote: t('items.0.quote'),
        name: t('items.0.name'),
        role: t('items.0.role'),
        company: t('items.0.company'),
        rating: 5,
        theme: 'aurora-light',
      },
      {
        quote: t('items.1.quote'),
        name: t('items.1.name'),
        role: t('items.1.role'),
        company: t('items.1.company'),
        rating: 5,
        theme: 'classic-light',
      },
      {
        quote: t('items.2.quote'),
        name: t('items.2.name'),
        role: t('items.2.role'),
        company: t('items.2.company'),
        rating: 4,
        theme: 'minimal-light',
      },
    ],
    [t],
  );

  return (
    <section
      id={id}
      className={cn('landing-section testimonials-section bg-muted/10 py-24', className)}
    >
      <div className="container mx-auto px-4 text-center">
        <span className="text-sm font-semibold uppercase tracking-[0.3em] text-primary/70">
          {t('eyebrow')}
        </span>
        <h2 className="mt-4 text-3xl font-bold text-foreground sm:text-4xl">{t('title')}</h2>
        <p className="mt-4 text-lg text-muted-foreground">{t('subtitle')}</p>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <article
              key={testimonial.name}
              data-theme={testimonial.theme}
              className="relative overflow-hidden rounded-3xl border border-border/70 bg-background/90 p-8 text-left shadow-lg backdrop-blur transition hover:-translate-y-1"
            >
              <Quote className="absolute -top-6 -left-6 h-16 w-16 text-primary/20" />
              <div className="flex items-center gap-1">
                {Array.from({ length: testimonial.rating }).map((_, index) => (
                  <Star key={index} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="mt-6 text-base text-foreground">{testimonial.quote}</p>
              <div className="mt-8">
                <p className="text-sm font-semibold text-foreground">{testimonial.name}</p>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {testimonial.role} &middot; {testimonial.company}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
