'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/branding/Logo';
import {
  Github,
  Menu,
  X,
  Zap,
  Layout,
  Edit,
  Shield
} from 'lucide-react';
import { useState } from 'react';
import { Card } from '@/components/ui/card';

import { HeroVisualization } from '@/components/illustrations/HeroVisualization';

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const features = [
    {
      title: 'Generate',
      description: "ProcessLab's AI engine converts natural language and documents into standard BPMN 2.0 models instantly.",
      icon: Zap
    },
    {
      title: 'Version',
      description: 'Track every change with Git-like version control. Branch, merge, and rollback process definitions with confidence.',
      icon: Layout
    },
    {
      title: 'Govern',
      description: 'Enforce modeling standards and compliance rules automatically. Lint your processes as you design them.',
      icon: Shield
    },
    {
      title: 'Collaborate',
      description: 'Real-time collaboration for teams. Comment, review, and approve process changes in one unified workspace.',
      icon: Edit
    }
  ];

  const faqs = [
    {
      question: 'Is ProcessLab open source?',
      answer: 'Yes, ProcessLab is an open-source project. You can view the source code, contribute, and deploy it in your own environment.'
    },
    {
      question: 'Can ProcessLab import existing BPMN files?',
      answer: 'Yes, we support full import/export of standard BPMN 2.0 XML files, ensuring compatibility with other tools like Camunda or Signavio.'
    },
    {
      question: 'How do I get started?',
      answer: 'Simply create a free account to start using ProcessLab. You can begin transforming your documents into BPMN models right away.'
    }
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary/20">

      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-3 sm:px-4 lg:px-6">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
              <Logo variant="horizontal" width={140} height={32} />
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-md hover:bg-accent">
              Log in
            </Link>
            <Link href="/register" className="hidden md:block">
              <Button size="sm" className="font-medium">Try for free</Button>
            </Link>
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl transition-all duration-200">
            <div className="container mx-auto px-3 py-4 space-y-2">
              <Link 
                href="/register" 
                className="block"
                onClick={() => setIsMenuOpen(false)}
              >
                <Button className="w-full font-medium">Try for free</Button>
              </Link>
              <Link 
                href="/login" 
                className="block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-md hover:bg-accent"
                onClick={() => setIsMenuOpen(false)}
              >
                Log in
              </Link>
            </div>
          </div>
        )}
      </nav>

      <main className="flex-1">

        {/* Hero Section */}
        <section className="relative pt-12 pb-16 overflow-hidden">
          <div className="container mx-auto px-3 sm:px-4 lg:px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="max-w-2xl">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
                  Turn documents into processes.<br />
                  <span style={{ color: '#D64108' }}>Build without constraints.</span>
                </h1>
                <p className="text-xl text-muted-foreground mb-8 max-w-lg leading-relaxed">
                  ProcessLab is an open-source platform that combines generative AI and standard BPMN to help you transform documents into executable process models.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 mb-12">
                  <Link href="/register">
                    <Button size="lg" className="h-12 px-8 text-base">Try for free</Button>
                  </Link>
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  Open-source, simple, and powerful.
                </div>
              </div>
              <div className="relative">
                <HeroVisualization />
                {/* Decorative elements */}
                <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/5 blur-3xl rounded-full" />
              </div>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="border-t border-border/40" />

        {/* Features Grid */}
        <section className="py-12 sm:py-16 bg-muted/20">
          <div className="container mx-auto px-3 sm:px-4 lg:px-6">
            <div className="mb-12 max-w-2xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight mb-6 lg:whitespace-nowrap">
                Free your processes from static documents.
              </h2>
              <p className="text-xl text-muted-foreground">
                A toolbox of flexible AI agents for all your modeling needs.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card key={index} className="p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="border-t border-border/40" />

        {/* FAQ Section */}
        <section className="py-12 sm:py-16">
          <div className="container mx-auto px-3 sm:px-4 lg:px-6">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-4xl font-bold tracking-tight mb-12 text-center">
                Questions, answered.
              </h2>
              <div className="space-y-8">
                {faqs.map((faq, i) => (
                  <div key={i} className="border-b pb-8 last:border-0">
                    <h3 className="text-xl font-semibold mb-3">{faq.question}</h3>
                    <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

      </main>

      <footer className="border-t py-6 bg-background">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center">
                <Logo variant="horizontal" width={120} height={28} />
              </Link>
              <span className="hidden sm:inline">•</span>
              <p className="hidden sm:inline text-sm">
                Open-source platform for transforming documents into executable BPMN process models.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-sm">
                © {new Date().getFullYear()} ProcessLab
              </p>
              <Link href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                <Github className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
