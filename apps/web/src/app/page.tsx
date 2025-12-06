'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/branding/Logo';
import {
  ArrowRight,
  CheckCircle2,
  Github,
  Twitter,
  Linkedin,
  Menu,
  X,
  ChevronDown,
  Zap,
  Layout,
  FileText,
  Edit,
  Shield,
  Server,
  Activity,
  Lock
} from 'lucide-react';
import { useState } from 'react';
import { Card } from '@/components/ui/card';

import { HeroVisualization } from '@/components/illustrations/HeroVisualization';

// Placeholder component for missing assets
const Placeholder = ({ title, height = "h-64", className = "" }: { title: string, height?: string, className?: string }) => (
  <div className={`w-full ${height} bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center p-4 text-center transition-colors hover:bg-muted/70 ${className}`}>
    <div className="rounded-full bg-background p-3 shadow-sm mb-3">
      <div className="h-6 w-6 text-muted-foreground/50" />
    </div>
    <div className="text-muted-foreground font-medium">{title}</div>
    <div className="text-xs text-muted-foreground/60 mt-1">Asset Placeholder</div>
  </div>
);

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const features = [
    {
      title: 'Generate',
      description: "ProcessLab's AI engine converts natural language and documents into standard BPMN 2.0 models instantly.",
      icon: Zap,
      visual: "AI Generation Visualization"
    },
    {
      title: 'Version',
      description: 'Track every change with Git-like version control. Branch, merge, and rollback process definitions with confidence.',
      icon: Layout,
      visual: "Versioning Graph Visualization"
    },
    {
      title: 'Govern',
      description: 'Enforce modeling standards and compliance rules automatically. Lint your processes as you design them.',
      icon: Shield,
      visual: "Governance Rules Visualization"
    },
    {
      title: 'Collaborate',
      description: 'Real-time collaboration for teams. Comment, review, and approve process changes in one unified workspace.',
      icon: Edit,
      visual: "Collaboration UI Visualization"
    }
  ];

  const enterpriseFeatures = [
    {
      title: '99.9%+ uptime',
      description: 'Battle-tested infrastructure you can trust in production and at scale.',
      icon: Activity
    },
    {
      title: 'Enterprise support and SLAs',
      description: 'Hands-on forward deployed support and tailored SLAs to meet your enterprise needs.',
      icon: Server
    },
    {
      title: 'SOC2, HIPAA compliant',
      description: 'Enterprise-grade security, certified for sensitive and regulated data.',
      icon: Shield
    },
    {
      title: 'Deploy in your environment',
      description: 'Run ProcessLab entirely within your own infrastructure—ideal for strict security requirements.',
      icon: Lock
    }
  ];

  const faqs = [
    {
      question: 'Do you offer trials? How can I get access?',
      answer: 'You can get access right away by starting off on our Standard tier. We offer a 14-day free trial for all new workspaces.'
    },
    {
      question: 'Who is eligible for the free credits?',
      answer: 'Early-stage startups and educational institutions may be eligible for our startup program. Contact sales to learn more.'
    },
    {
      question: 'Can ProcessLab import existing BPMN files?',
      answer: 'Yes, we support full import/export of standard BPMN 2.0 XML files, ensuring compatibility with other tools like Camunda or Signavio.'
    },
    {
      question: 'Is ProcessLab SOC2 compliant?',
      answer: 'We are currently in the process of obtaining SOC2 Type II certification. Security is our top priority.'
    }
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary/20">

      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <Logo variant="horizontal" width={140} height={32} />
            </Link>
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
              <Link href="#pricing" className="hover:text-foreground transition-colors">Pricing</Link>
              <Link href="#blog" className="hover:text-foreground transition-colors">Blog</Link>
              <Link href="#careers" className="hover:text-foreground transition-colors">Careers</Link>
              <Link href="#docs" className="hover:text-foreground transition-colors">Docs</Link>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">
              Log in
            </Link>
            <Link href="/contact">
              <Button variant="outline" size="sm">Contact sales</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Try for free</Button>
            </Link>
          </div>

          <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t bg-background px-4 py-6 space-y-4">
            <Link href="#pricing" className="block text-sm font-medium hover:text-primary">Pricing</Link>
            <Link href="#blog" className="block text-sm font-medium hover:text-primary">Blog</Link>
            <Link href="#careers" className="block text-sm font-medium hover:text-primary">Careers</Link>
            <Link href="#docs" className="block text-sm font-medium hover:text-primary">Docs</Link>
            <div className="pt-4 border-t space-y-3">
              <Link href="/login" className="block text-sm font-medium hover:text-primary">Log in</Link>
              <Link href="/contact" className="block">
                <Button variant="outline" className="w-full justify-start">Contact sales</Button>
              </Link>
              <Link href="/register" className="block">
                <Button className="w-full justify-start">Try for free</Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      <main className="flex-1">

        {/* Hero Section */}
        <section className="relative pt-20 pb-32 overflow-hidden">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="max-w-2xl">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
                  Turn documents into processes.<br />
                  <span className="text-muted-foreground">Build without constraints.</span>
                </h1>
                <p className="text-xl text-muted-foreground mb-8 max-w-lg leading-relaxed">
                  ProcessLab combines the best of generative AI and standard BPMN to produce the most accurate, executable process models.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 mb-12">
                  <Link href="/register">
                    <Button size="lg" className="h-12 px-8 text-base">Try for free</Button>
                  </Link>
                  <Link href="/demo">
                    <Button variant="outline" size="lg" className="h-12 px-8 text-base">Request a demo</Button>
                  </Link>
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  Helping everyone from startups to Fortune 10 enterprises unlock their process knowledge.
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

        {/* Logos Section */}
        <section className="py-12 border-y bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm font-medium text-muted-foreground mb-8">
              TRUSTED BY INNOVATIVE TEAMS AT
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex justify-center">
                  <Placeholder title={`Logo ${i}`} height="h-12" className="w-32 border-none bg-transparent" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-24 sm:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-20 max-w-2xl">
              <h2 className="text-4xl font-bold tracking-tight mb-6">
                Free your processes from static documents.
              </h2>
              <p className="text-xl text-muted-foreground">
                A toolbox of flexible AI agents for all your modeling needs.
              </p>
            </div>

            <div className="space-y-24">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className={`grid lg:grid-cols-2 gap-16 items-center ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                    <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-6">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                      <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                        {feature.description}
                      </p>
                      <ul className="space-y-3 mb-8">
                        <li className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          <span>High accuracy parsing</span>
                        </li>
                        <li className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          <span>Standard BPMN 2.0 output</span>
                        </li>
                        <li className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          <span>Enterprise governance</span>
                        </li>
                      </ul>
                    </div>
                    <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
                      <Placeholder title={feature.visual} height="h-[400px]" className="shadow-lg bg-card" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-24 sm:py-32 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-4xl font-bold tracking-tight mb-6">
                Powering the world's best process teams.
              </h2>
              <p className="text-xl text-primary-foreground/80">
                Trusted across industries where accuracy matters—consulting, finance, healthcare, and more.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: 'Consulting',
                  desc: 'Extract key insights from client interviews, huge documentation repositories, and legacy process maps.'
                },
                {
                  title: 'Healthcare',
                  desc: 'Standardize clinical pathways and administrative workflows with compliance built-in.'
                },
                {
                  title: 'Finance',
                  desc: 'Model complex approval chains and regulatory reporting processes with audit trails.'
                }
              ].map((useCase, i) => (
                <Card key={i} className="bg-primary-800 border-primary-700 p-8 hover:bg-primary-700 transition-colors">
                  <h3 className="text-xl font-bold mb-3 text-primary-foreground">{useCase.title}</h3>
                  <p className="text-primary-foreground/70 mb-6">{useCase.desc}</p>
                  <Button variant="link" className="text-primary-foreground hover:text-primary-foreground/80 p-0 h-auto">
                    Get started <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="py-24 sm:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-4xl font-bold tracking-tight mb-6">
                Built to model the way humans think.
              </h2>
              <p className="text-lg text-muted-foreground">
                ProcessLab's multi-pass system utilizes both LLMs and standard BPMN validation for unmatched accuracy and reliability.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-12 relative">
              {/* Connector Line (Desktop) */}
              <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-transparent via-primary/20 to-transparent border-t-2 border-dashed border-primary/20" />

              {[
                { step: '01', title: 'Context Extraction', desc: 'ProcessLab first reads your documents to understand the process context, roles, and business rules.' },
                { step: '02', title: 'Intelligent Synthesis', desc: 'Our AI agents draft the process flow, identifying gateways, events, and sub-processes.' },
                { step: '03', title: 'Governance Review', desc: 'The Linter validates the model against BPMN 2.0 standards and your organization best practices.' }
              ].map((step, i) => (
                <div key={i} className="relative flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-full bg-background border-4 border-muted flex items-center justify-center mb-6 z-10 shadow-sm">
                    <span className="text-2xl font-bold text-muted-foreground">{step.step}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground">{step.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-20">
              <Placeholder title="Interactive How-it-Works Visualization" height="h-[400px]" />
            </div>
          </div>
        </section>

        {/* Enterprise Ready */}
        <section className="py-24 sm:py-32 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-4xl font-bold tracking-tight mb-6">
                  Enterprise-ready.
                </h2>
                <p className="text-xl text-muted-foreground mb-12">
                  From security to scale, ProcessLab is built for the demands of production environments.
                </p>
                <div className="grid sm:grid-cols-2 gap-8">
                  {enterpriseFeatures.map((feat, i) => {
                    const Icon = feat.icon;
                    return (
                      <div key={i}>
                        <Icon className="h-6 w-6 text-primary mb-3" />
                        <h4 className="font-semibold mb-2">{feat.title}</h4>
                        <p className="text-sm text-muted-foreground">{feat.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <Placeholder title="Enterprise Security / Architecture Diagram" height="h-[500px]" className="bg-background shadow-lg" />
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-24 sm:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
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

        {/* CTA Footer */}
        <section className="py-24 border-t bg-gradient-to-b from-background to-muted/20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-8">Get started in minutes.</h2>
            <div className="flex justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="h-12 px-8">Try for free</Button>
              </Link>
              <Link href="/demo">
                <Button variant="outline" size="lg" className="h-12 px-8">Request a demo</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-12 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <Link href="/" className="inline-block mb-6">
                <Logo variant="horizontal" width={140} height={32} />
              </Link>
              <p className="text-muted-foreground max-w-sm">
                ProcessLab helps leading teams transform unstructured documents into structured, executable processes that can power production workflows with industry-leading accuracy.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">Docs</Link></li>
                <li><Link href="#" className="hover:text-foreground">Pricing</Link></li>
                <li><Link href="#" className="hover:text-foreground">Features</Link></li>
                <li><Link href="#" className="hover:text-foreground">Security</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">Blog</Link></li>
                <li><Link href="#" className="hover:text-foreground">Careers</Link></li>
                <li><Link href="#" className="hover:text-foreground">Support</Link></li>
                <li><Link href="#" className="hover:text-foreground">Terms & Privacy</Link></li>
              </ul>
            </div>
          </div>
          <div className="flex justify-between items-center pt-8 border-t">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} ProcessLab, Inc.
            </p>
            <div className="flex gap-4 text-muted-foreground">
              <Link href="#" className="hover:text-foreground"><Twitter className="h-5 w-5" /></Link>
              <Link href="#" className="hover:text-foreground"><Linkedin className="h-5 w-5" /></Link>
              <Link href="#" className="hover:text-foreground"><Github className="h-5 w-5" /></Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
