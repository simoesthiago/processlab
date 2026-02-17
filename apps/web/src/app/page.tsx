'use client';

import Link from 'next/link';
import { Button } from '@/shared/components/ui/button';
import { Github, Workflow, Wand2, GitBranch } from 'lucide-react';
import { HeroVisualization } from '@/shared/components/HeroVisualization';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary/20">

      {/* Top bar */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-3 sm:px-4 lg:px-6">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            ProcessLab
          </Link>
          <Link href="/spaces/private">
            <Button size="sm" className="font-medium">
              Open App &rarr;
            </Button>
          </Link>
        </div>
      </nav>

      <main>

        {/* Hero Section */}
        <section className="relative w-full py-16 sm:py-20 overflow-hidden">
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
                  <Link href="/spaces/private">
                    <Button size="lg" className="h-12 px-8 text-base">Open App &rarr;</Button>
                  </Link>
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  Open-source, local-first BPMN modeling.
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

        {/* Features Section */}
        <section className="w-full py-16 sm:py-20 border-t border-border/60">
          <div className="container mx-auto px-3 sm:px-4 lg:px-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12 tracking-tight">
              Everything you need to model processes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="rounded-xl border border-border p-6 flex flex-col gap-4 bg-card">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Workflow className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-base mb-1">BPMN Editor</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Professional drag-and-drop editing with bpmn-js. Full BPMN 2.0 support with formatting, versioning, and export.
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-border p-6 flex flex-col gap-4 bg-card">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Wand2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-base mb-1">AI-Powered</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Use natural language to build and modify processes. Upload documents and let the Process Wizard generate BPMN diagrams instantly.
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-border p-6 flex flex-col gap-4 bg-card">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <GitBranch className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-base mb-1">Version Control</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Full version history with semantic versioning. Compare changes, roll back, and track every edit with commit messages.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      <footer className="border-t py-6 bg-background">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-3">
              <Link href="/" className="text-sm font-medium text-foreground">
                ProcessLab
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link href="https://github.com/simoesthiago/processlab" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                <Github className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
