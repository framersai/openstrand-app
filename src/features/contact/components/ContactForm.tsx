"use client";

import { useMemo, useState } from 'react';
import { Loader2, Send, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';

const FORMSPREE_FORM_ID = process.env.NEXT_PUBLIC_FORMSPREE_FORM_ID ?? '';

interface ContactFormProps {
  className?: string;
  heading?: string;
  subheading?: string;
  compact?: boolean;
}

interface FormState {
  name: string;
  email: string;
  company: string;
  type: 'general' | 'sales' | 'support' | 'partnership' | 'team-license';
  subject: string;
  message: string;
}

const INITIAL_STATE: FormState = {
  name: '',
  email: '',
  company: '',
  type: 'general',
  subject: '',
  message: '',
};

export function ContactForm({ className, heading, subheading, compact = false }: ContactFormProps) {
  const [formState, setFormState] = useState<FormState>(INITIAL_STATE);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const targetEndpoint = useMemo(() => {
    if (!FORMSPREE_FORM_ID) {
      return null;
    }
    return `https://formspree.io/f/${FORMSPREE_FORM_ID}`;
  }, []);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();

    if (!targetEndpoint) {
      toast.error('Contact form is not configured yet. Please email support@openstrand.com.');
      setStatus('error');
      return;
    }

    setIsSubmitting(true);
    setStatus('idle');

    try {
      const response = await fetch(targetEndpoint, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formState.name,
          email: formState.email,
          company: formState.company,
          type: formState.type,
          subject: formState.subject,
          message: formState.message,
          source: 'openstrand-app',
        }),
      });

      if (!response.ok) {
        throw new Error('Unable to submit form');
      }

      setStatus('success');
      toast.success('Thanks! We received your message and will get back to you shortly.');
      setFormState(INITIAL_STATE);
    } catch (error) {
      console.error(error);
      setStatus('error');
      toast.error('Something went wrong sending your message. Please retry or email us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-primary/10 p-2 text-primary">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
            {heading ?? 'Tell us about your project'}
          </h2>
          {subheading ? (
            <p className="text-sm text-muted-foreground">{subheading}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              We read every message. Share a few details and we will reply within one business day.
            </p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Name *</label>
            <input
              required
              type="text"
              value={formState.name}
              onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
              className="w-full rounded-xl border border-border/60 bg-background px-4 py-2 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Ada Lovelace"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Email *</label>
            <input
              required
              type="email"
              value={formState.email}
              onChange={(event) => setFormState((prev) => ({ ...prev, email: event.target.value }))}
              className="w-full rounded-xl border border-border/60 bg-background px-4 py-2 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="ada@analytical.engine"
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Company</label>
            <input
              type="text"
              value={formState.company}
              onChange={(event) => setFormState((prev) => ({ ...prev, company: event.target.value }))}
              className="w-full rounded-xl border border-border/60 bg-background px-4 py-2 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="OpenStrand Labs"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Inquiry type</label>
            <select
              value={formState.type}
              onChange={(event) => setFormState((prev) => ({ ...prev, type: event.target.value as FormState['type'] }))}
              className="w-full rounded-xl border border-border/60 bg-background px-4 py-2 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="general">General question</option>
              <option value="team-license">Team license / API access</option>
              <option value="sales">Sales</option>
              <option value="support">Technical support</option>
              <option value="partnership">Partnership</option>
            </select>
          </div>
        </div>

        {!compact && (
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Subject</label>
            <input
              type="text"
              value={formState.subject}
              onChange={(event) => setFormState((prev) => ({ ...prev, subject: event.target.value }))}
              className="w-full rounded-xl border border-border/60 bg-background px-4 py-2 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="How can we help?"
            />
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">Message *</label>
          <textarea
            required
            value={formState.message}
            onChange={(event) => setFormState((prev) => ({ ...prev, message: event.target.value }))}
            className="w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            rows={compact ? 4 : 6}
            placeholder="Tell us about your use case, timelines, and goals."
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>
            Need something faster? Email <a className="font-medium text-primary hover:underline" href="mailto:team@openstrand.com">team@openstrand.com</a>
          </span>
          {status === 'success' && <span className="text-emerald-500">Message sent ✔︎</span>}
          {status === 'error' && <span className="text-destructive">We couldn&apos;t send your message. Try again?</span>}
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full gap-2 text-base">
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Send message
        </Button>
      </form>
    </div>
  );
}

