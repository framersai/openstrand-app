'use client';

import { useState, useEffect } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight, Sparkles, Twitter, Linkedin } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TestimonialsEnhancedProps {
  id?: string;
  className?: string;
}

// PLACEHOLDER DATA - Easy to remove/replace
// Just comment out this section and replace with real data when available
const TESTIMONIALS_DATA = [
  {
    id: 1,
    name: 'Dr. Sarah Chen',
    role: 'Lead Data Scientist',
    company: 'BioTech Innovations',
    avatar: '👩‍🔬', // Using emoji as placeholder
    // avatar: '/avatars/sarah-chen.jpg', // Uncomment when real images available
    rating: 5,
    quote: 'OpenStrand transformed how our research team analyzes genomic data. The 3-tier visualization system automatically adapts from simple patterns to complex neural networks. We reduced analysis time by 90%.',
    highlight: 'Reduced analysis time by 90%',
    social: 'linkedin',
    verified: true,
    industry: 'Biotech',
    useCase: 'Research Analysis'
  },
  {
    id: 2,
    name: 'Marcus Rodriguez',
    role: 'VP of Engineering',
    company: 'FinanceFlow',
    avatar: '👨‍💼',
    // avatar: '/avatars/marcus-rodriguez.jpg',
    rating: 5,
    quote: 'The TypeScript-first approach means our entire team can contribute. From database schemas to frontend components, everything is type-safe. Plus, the AI Artisan visualizations blow our clients away.',
    highlight: '100% type-safe codebase',
    social: 'twitter',
    verified: true,
    industry: 'Finance',
    useCase: 'Client Dashboards'
  },
  {
    id: 3,
    name: 'Emily Watson',
    role: 'Knowledge Manager',
    company: 'ConsultPro Global',
    avatar: '👩‍💻',
    // avatar: '/avatars/emily-watson.jpg',
    rating: 5,
    quote: 'Finally, a knowledge management system that actually understands connections. Block-level linking means every insight is discoverable. Our consultants save 5+ hours per week.',
    highlight: '5+ hours saved weekly',
    social: 'linkedin',
    verified: true,
    industry: 'Consulting',
    useCase: 'Knowledge Management'
  },
  {
    id: 4,
    name: 'Dr. James Park',
    role: 'Research Director',
    company: 'Academic Institute',
    avatar: '👨‍🏫',
    // avatar: '/avatars/james-park.jpg',
    rating: 5,
    quote: 'OpenStrand weaves together 10 years of research papers into an interconnected knowledge graph. The spaced repetition feature helps our students retain complex concepts 85% better.',
    highlight: '85% better retention',
    social: 'twitter',
    verified: true,
    industry: 'Education',
    useCase: 'Academic Research'
  },
  {
    id: 5,
    name: 'Lisa Thompson',
    role: 'Product Manager',
    company: 'TechStart',
    avatar: '👩‍🚀',
    // avatar: '/avatars/lisa-thompson.jpg',
    rating: 5,
    quote: 'We switched from Notion + Tableau to OpenStrand. One platform, local-first, with AI that actually understands our data structure. Customer feedback analysis is now instant.',
    highlight: 'Instant feedback analysis',
    social: 'linkedin',
    verified: true,
    industry: 'SaaS',
    useCase: 'Product Analytics'
  },
  {
    id: 6,
    name: 'Robert Kim',
    role: 'Chief Data Officer',
    company: 'RetailChain',
    avatar: '👨‍💻',
    // avatar: '/avatars/robert-kim.jpg',
    rating: 5,
    quote: 'The ability to run entirely offline was the deciding factor. Our sensitive sales data never leaves our servers, yet we get enterprise-grade visualizations and AI insights.',
    highlight: '100% data privacy',
    social: 'twitter',
    verified: true,
    industry: 'Retail',
    useCase: 'Sales Analytics'
  }
];

// Stats from testimonials
const IMPACT_STATS = [
  { value: '10,000+', label: 'Active Users' },
  { value: '90%', label: 'Time Saved' },
  { value: '5TB+', label: 'Data Processed' },
  { value: '4.9/5', label: 'Average Rating' }
];

export function TestimonialsEnhanced({ id, className }: TestimonialsEnhancedProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-rotate testimonials
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % TESTIMONIALS_DATA.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const handlePrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + TESTIMONIALS_DATA.length) % TESTIMONIALS_DATA.length);
  };

  const handleNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % TESTIMONIALS_DATA.length);
  };

  const handleDotClick = (index: number) => {
    setIsAutoPlaying(false);
    setCurrentIndex(index);
  };

  const currentTestimonial = TESTIMONIALS_DATA[currentIndex];

  return (
    <section id={id} className={cn('landing-section py-24 relative overflow-hidden', className)}>
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/50 via-transparent to-teal-50/50 dark:from-cyan-950/20 dark:to-teal-950/20" />

      {/* Floating quotes background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <Quote
            key={i}
            className={cn(
              'absolute text-cyan-500/5 dark:text-cyan-400/5 animate-float',
              i % 2 === 0 ? 'w-24 h-24' : 'w-32 h-32'
            )}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${10 + Math.random() * 10}s`
            }}
          />
        ))}
      </div>

      <div className="container relative mx-auto px-4">
        {/* Section header */}
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <Badge className="mb-4 bg-gradient-to-r from-cyan-500 to-teal-500 text-white animate-pulse">
            <Sparkles className="mr-1 h-3 w-3" />
            Trusted by Teams Worldwide
          </Badge>
          <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl animate-fade-in">
            Real Stories, Real Impact
          </h2>
          <p className="text-lg text-muted-foreground animate-fade-in stagger-1">
            See how teams are transforming their data into living knowledge
          </p>
        </div>

        {/* Impact stats */}
        <div className="mb-16 grid grid-cols-2 gap-6 md:grid-cols-4">
          {IMPACT_STATS.map((stat, index) => (
            <div
              key={stat.label}
              className={cn(
                'text-center animate-fade-in-scale interactive-card rounded-xl border border-cyan-200/30 bg-white/80 p-6 backdrop-blur dark:border-cyan-800/30 dark:bg-gray-900/80',
                `stagger-${index + 1}`
              )}
            >
              <div className="mb-2 text-3xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Main testimonial carousel */}
        <div className="relative mx-auto max-w-4xl">
          {/* Current testimonial */}
          <div className="relative overflow-hidden rounded-2xl border border-cyan-200/30 bg-white/90 p-8 shadow-xl backdrop-blur transition-all duration-500 hover-glow dark:border-cyan-800/30 dark:bg-gray-900/90 md:p-12">
            {/* Quote icon */}
            <Quote className="absolute -left-4 -top-4 h-24 w-24 text-cyan-500/10" />

            <div className="relative">
              {/* Rating */}
              <div className="mb-6 flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'h-5 w-5 transition-all duration-300',
                      i < currentTestimonial.rating
                        ? 'fill-yellow-400 text-yellow-400 animate-pulse'
                        : 'text-gray-300'
                    )}
                    style={{ animationDelay: `${i * 0.1}s` }}
                  />
                ))}
                <span className="ml-2 text-sm text-muted-foreground">
                  {currentTestimonial.rating}.0
                </span>
              </div>

              {/* Quote */}
              <blockquote className="mb-8 text-xl leading-relaxed text-foreground animate-fade-in">
                "{currentTestimonial.quote}"
              </blockquote>

              {/* Highlight */}
              {currentTestimonial.highlight && (
                <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-100 to-teal-100 px-4 py-2 text-sm font-semibold text-cyan-700 animate-fade-in-scale dark:from-cyan-900/30 dark:to-teal-900/30 dark:text-cyan-300">
                  <Sparkles className="h-4 w-4" />
                  {currentTestimonial.highlight}
                </div>
              )}

              {/* Author info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 text-2xl shadow-lg hover-scale">
                      {currentTestimonial.avatar}
                    </div>
                    {currentTestimonial.verified && (
                      <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white">
                        ✓
                      </div>
                    )}
                  </div>

                  {/* Name and role */}
                  <div>
                    <div className="font-semibold text-foreground">{currentTestimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{currentTestimonial.role}</div>
                    <div className="text-sm font-medium text-cyan-600 dark:text-cyan-400">
                      {currentTestimonial.company}
                    </div>
                  </div>
                </div>

                {/* Industry badges */}
                <div className="hidden flex-col gap-2 md:flex">
                  <Badge variant="outline" className="text-xs">
                    {currentTestimonial.industry}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {currentTestimonial.useCase}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            {/* Previous/Next buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handlePrevious}
                variant="outline"
                size="icon"
                className="hover-scale"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleNext}
                variant="outline"
                size="icon"
                className="hover-scale"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Dots indicator */}
            <div className="flex gap-2">
              {TESTIMONIALS_DATA.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleDotClick(index)}
                  className={cn(
                    'h-2 transition-all duration-300 hover-scale',
                    index === currentIndex
                      ? 'w-8 bg-cyan-600 rounded-full'
                      : 'w-2 bg-gray-300 rounded-full hover:bg-cyan-400 dark:bg-gray-600'
                  )}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>

            {/* Auto-play toggle */}
            <Button
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              variant="outline"
              size="sm"
              className={cn(
                'gap-2',
                isAutoPlaying && 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300'
              )}
            >
              {isAutoPlaying ? '⏸ Pause' : '▶ Play'}
            </Button>
          </div>
        </div>

        {/* Company logos (placeholder) */}
        <div className="mt-20">
          <p className="mb-8 text-center text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Trusted by innovative teams at
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500">
            {['🏢 TechCorp', '🏥 HealthCo', '🏛️ EduInst', '💼 FinanceHub', '🚀 StartupLab', '🏭 DataWorks'].map(
              (company, index) => (
                <div
                  key={index}
                  className={cn(
                    'text-xl font-semibold text-muted-foreground animate-fade-in hover-scale',
                    `stagger-${index + 1}`
                  )}
                >
                  {company}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );
}