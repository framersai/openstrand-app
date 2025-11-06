import { Metadata } from 'next';
import { Sparkles, Target, Rocket, Globe, CheckCircle, TrendingUp, Shield, Heart } from 'lucide-react';
import { ContactForm } from '@/features/contact/components/ContactForm';

export const metadata: Metadata = {
  title: 'About Us - OpenStrand',
  description: 'Learn about OpenStrand\'s mission to revolutionize personal knowledge management with AI-powered visualization.',
};

export default function AboutPage() {
  const values = [
    {
      icon: Shield,
      title: 'Privacy First',
      description: 'Your data stays yours. We believe in complete data ownership and privacy.'
    },
    {
      icon: Globe,
      title: 'Accessibility',
      description: 'Knowledge management should be available to everyone, in any language.'
    },
    {
      icon: Heart,
      title: 'User-Centric',
      description: 'Every feature is designed with real user needs and feedback in mind.'
    },
    {
      icon: Rocket,
      title: 'Innovation',
      description: 'Pushing the boundaries of what\'s possible with AI and visualization.'
    }
  ];

  const milestones = [
    { year: '2024', event: 'OpenStrand founded with a vision for better PKM' },
    { year: '2024 Q2', event: 'First prototype with AI visualization capabilities' },
    { year: '2024 Q3', event: 'Launch of three-tier visualization system' },
    { year: '2024 Q4', event: 'Open source release and community building' },
    { year: '2025', event: '10+ language support and global expansion' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      {/* Hero Section */}
      <section className="relative py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-3xl" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 shadow-2xl shadow-primary/30">
                  <Sparkles className="h-10 w-10 text-primary-foreground" />
                </div>
              </div>
            </div>
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              About OpenStrand
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              We're building the future of personal knowledge management, where AI meets
              intuitive visualization to transform how you understand and share information.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4 border-t border-border/40">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Target className="h-8 w-8 text-primary" />
                <h2 className="text-3xl font-bold">Our Mission</h2>
              </div>
              <p className="text-lg text-muted-foreground mb-6">
                To democratize data understanding and knowledge management by providing
                powerful, AI-enhanced visualization tools that work for everyone, everywhere.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <span>Make complex data accessible through intelligent visualization</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <span>Support offline-first architecture for true data ownership</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <span>Break language barriers with multilingual support</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <span>Advance the field of AI-assisted knowledge management</span>
                </li>
              </ul>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 blur-3xl" />
              <div className="relative bg-card rounded-2xl p-8 border border-border/60 shadow-xl">
                <TrendingUp className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-2xl font-semibold mb-4">By the Numbers</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-3xl font-bold text-primary">10K+</p>
                    <p className="text-sm text-muted-foreground">Active Users</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-primary">1M+</p>
                    <p className="text-sm text-muted-foreground">Visualizations Created</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-primary">10+</p>
                    <p className="text-sm text-muted-foreground">Languages Supported</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-primary">50+</p>
                    <p className="text-sm text-muted-foreground">Data Formats</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">Our Core Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => (
              <div key={value.title} className="bg-card rounded-xl p-6 border border-border/60 hover:shadow-lg transition-shadow">
                <value.icon className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">Our Journey</h2>
          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-border" />
            {milestones.map((milestone, index) => (
              <div key={index} className={`relative flex items-center mb-8 ${
                index % 2 === 0 ? 'justify-start' : 'justify-end'
              }`}>
                <div className={`w-5/12 ${index % 2 === 0 ? 'text-right pr-8' : 'text-left pl-8'}`}>
                  <div className="bg-card rounded-lg p-4 border border-border/60">
                    <p className="text-sm text-primary font-semibold mb-1">{milestone.year}</p>
                    <p className="text-sm text-muted-foreground">{milestone.event}</p>
                  </div>
                </div>
                <div className="absolute left-1/2 transform -translate-x-1/2">
                  <div className="h-4 w-4 rounded-full bg-primary border-4 border-background" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="border-t border-border/40 bg-muted/20 px-4 py-16">
        <div className="container mx-auto max-w-4xl">
          <div className="rounded-3xl border border-border/60 bg-card/90 p-8 shadow-2xl">
            <ContactForm
              compact
              heading="Partner with OpenStrand"
              subheading="Teams licensing starts at $1,000. Tell us about your rollout and we’ll schedule installation or integration support."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-4">Join Our Journey</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Be part of the revolution in personal knowledge management
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href="/contact"
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
            >
              Get in Touch
            </a>
            <a
              href="/careers"
              className="px-6 py-3 bg-card border border-border rounded-lg hover:bg-muted transition"
            >
              Join Our Team
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}