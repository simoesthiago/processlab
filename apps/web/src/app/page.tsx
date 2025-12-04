'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/branding/Logo';
import { ProcessFlow } from '@/components/illustrations/ProcessFlow';
import { 
  Sparkles, 
  GitBranch, 
  FileText, 
  Shield, 
  Zap, 
  Users, 
  CheckCircle2,
  ArrowRight,
  Github,
  Mail,
  Twitter
} from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function LandingPage() {
  const features = [
    {
      icon: Sparkles,
      title: 'AI-Powered Generation',
      description: 'Generate BPMN diagrams from natural language descriptions and documents using advanced AI.',
    },
    {
      icon: GitBranch,
      title: 'Version Control',
      description: 'Track every change with full version history, visual diffs, and rollback capabilities.',
    },
    {
      icon: FileText,
      title: 'Evidence Tracking',
      description: 'Link documents and evidence to process elements for complete traceability.',
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'BYOK, audit logs, role-based access control, and complete data isolation.',
    },
    {
      icon: Zap,
      title: 'Smart Linting',
      description: 'Automatic validation of BPMN rules and best practices as you model.',
    },
    {
      icon: Users,
      title: 'Collaboration',
      description: 'Comments, approvals, and review workflows built for enterprise teams.',
    },
  ];

  const useCases = [
    {
      title: 'Consulting Firms',
      description: 'Accelerate process mapping for clients with AI assistance and professional documentation.',
      benefits: ['Faster project delivery', 'Consistent quality', 'Client-ready reports'],
    },
    {
      title: 'Internal Process Teams',
      description: 'Maintain a living repository of organizational processes with version control and governance.',
      benefits: ['Single source of truth', 'Change management', 'Compliance ready'],
    },
    {
      title: 'Audit & Compliance',
      description: 'Track evidence and maintain audit trails for regulatory requirements (ISO, SOX, LGPD).',
      benefits: ['Full traceability', 'Audit-ready reports', 'Evidence linking'],
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo variant="horizontal" width={180} height={36} />
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b bg-gradient-to-br from-background via-background to-primary/5 py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-8 flex justify-center">
              <div className="rounded-full bg-primary/10 p-4">
                <ProcessFlow size="md" />
              </div>
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              The GitHub for Process Modeling
          </h1>
            <p className="mb-8 text-lg text-muted-foreground sm:text-xl">
              Model, version, and govern business processes with AI-powered BPMN editor.
              Built for consultants, process owners, and compliance teams.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Learn More
                </Button>
              </Link>
            </div>
            <div className="mt-12 flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>Free 14-day trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>Enterprise ready</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Everything you need to model processes
            </h2>
            <p className="text-lg text-muted-foreground">
              Professional-grade tools for process modeling, versioning, and governance.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="bg-muted/30 py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Built for your workflow
            </h2>
            <p className="text-lg text-muted-foreground">
              Designed for the teams that need process governance most.
            </p>
          </div>
          <div className="grid gap-8 lg:grid-cols-3">
            {useCases.map((useCase, index) => (
              <Card key={index} className="p-8">
                <h3 className="mb-3 text-2xl font-semibold">{useCase.title}</h3>
                <p className="mb-6 text-muted-foreground">{useCase.description}</p>
                <ul className="space-y-2">
                  {useCase.benefits.map((benefit, benefitIndex) => (
                    <li key={benefitIndex} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-success" />
                      <span className="text-sm">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="mx-auto max-w-3xl bg-gradient-to-br from-primary/10 to-primary/5 p-12 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Ready to transform your process modeling?
            </h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Join teams already using ProcessLab to model, version, and govern their processes.
            </p>
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="space-y-4">
              <Logo variant="horizontal" width={160} height={32} />
              <p className="text-sm text-muted-foreground">
                The GitHub for process modeling. AI-powered BPMN editor with version control and governance.
              </p>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#features" className="hover:text-foreground transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-foreground transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Documentation
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Careers
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold">Connect</h4>
              <div className="flex gap-4">
                <a
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="GitHub"
                >
                  <Github className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter className="h-5 w-5" />
          </a>
          <a
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Email"
                >
                  <Mail className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
          <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} ProcessLab. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
