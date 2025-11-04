import { Mail, MessageSquare, Phone, MapPin, Clock, Github, Twitter, Linkedin, MessageCircle } from 'lucide-react';
import { ContactForm } from '@/features/contact/components/ContactForm';

const contactMethods = [
  {
    icon: Mail,
    title: 'Email Us',
    description: 'Our team typically responds within 24 hours',
    contact: 'support@frame.dev',
    action: 'mailto:support@frame.dev'
  },
  {
    icon: MessageSquare,
    title: 'Live Chat',
    description: 'Available Monday-Friday, 9am-5pm EST',
    contact: 'Start Chat',
    action: '#chat'
  },
  {
    icon: MessageCircle,
    title: 'Discord community',
    description: 'Join our community for instant help',
    contact: 'Join Discord',
    action: 'https://discord.gg/framersai'
  },
  {
    icon: Github,
    title: 'GitHub Issues',
    description: 'Report bugs or request features',
    contact: 'Open Issue',
    action: 'https://github.com/framersai/openstrand/issues'
  }
];

const offices = [
  {
    city: 'San Francisco',
    address: '123 Innovation Drive, San Francisco, CA 94105',
    phone: '+1 (555) 123-4567',
    hours: '9:00 AM - 6:00 PM PST'
  },
  {
    city: 'London',
    address: '456 Tech Lane, London, EC2A 4BX',
    phone: '+44 20 1234 5678',
    hours: '9:00 AM - 6:00 PM GMT'
  }
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Get in Touch
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Have questions about OpenStrand? We&apos;re here to help you revolutionize
              your knowledge management.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {contactMethods.map((method) => (
              <a
                key={method.title}
                href={method.action}
                className="group bg-card rounded-xl p-6 border border-border/60 hover:border-primary/50 hover:shadow-lg transition-all"
                target={method.action.startsWith('http') ? '_blank' : undefined}
                rel={method.action.startsWith('http') ? 'noopener noreferrer' : undefined}
              >
                <method.icon className="h-10 w-10 text-primary mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-semibold mb-2">{method.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{method.description}</p>
                <p className="text-sm font-medium text-primary flex items-center gap-2">
                  {method.contact}
                  <Send className="h-3 w-3" />
                </p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & Office Info */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-border/60 bg-card p-8 shadow-xl">
                <ContactForm />
              </div>
            </div>

            {/* Office Information */}
            <div className="space-y-6">
              <div className="bg-card rounded-xl p-6 border border-border/60">
                <h3 className="text-xl font-semibold mb-6">Our Offices</h3>
                {offices.map((office) => (
                  <div key={office.city} className="mb-6 last:mb-0">
                    <h4 className="font-semibold text-lg mb-3 text-primary">{office.city}</h4>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        {office.address}
                      </p>
                      <p className="flex items-center gap-2">
                        <Phone className="h-4 w-4 flex-shrink-0" />
                        {office.phone}
                      </p>
                      <p className="flex items-center gap-2">
                        <Clock className="h-4 w-4 flex-shrink-0" />
                        {office.hours}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl p-6 border border-primary/20">
                <h3 className="text-lg font-semibold mb-3">Need Immediate Help?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Join our Discord community for real-time support from our team and community members.
                </p>
                <a
                href="https://discord.gg/framersai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
                >
                  <MessageCircle className="h-4 w-4" />
                  Join Discord
                </a>
              </div>

              <div className="bg-card rounded-xl p-6 border border-border/60">
                <h3 className="text-lg font-semibold mb-3">Follow Us</h3>
                <div className="flex gap-3">
                  <a
                    href="https://twitter.com/framersai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-border hover:border-primary hover:bg-primary/10 transition"
                  >
                    <Twitter className="h-4 w-4" />
                  </a>
                  <a
                    href="https://github.com/framersai/openstrand"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-border hover:border-primary hover:bg-primary/10 transition"
                  >
                    <Github className="h-4 w-4" />
                  </a>
                  <a
                    href="https://linkedin.com/company/framersai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-border hover:border-primary hover:bg-primary/10 transition"
                  >
                    <Linkedin className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}



