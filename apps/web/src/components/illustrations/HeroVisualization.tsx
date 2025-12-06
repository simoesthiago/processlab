import { FileText, ArrowRight, Zap } from 'lucide-react';

export function HeroVisualization() {
  return (
    <div className="relative w-full h-[400px] sm:h-[500px] rounded-xl overflow-hidden bg-slate-50/50 border border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 shadow-sm">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0" style={{
        backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        opacity: 0.3
      }}></div>

      {/* Content Container */}
      <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-8">
        <div className="flex items-center gap-3 sm:gap-6 md:gap-8 lg:gap-12 max-w-full">
          
          {/* Left: Documents */}
          <div className="relative group shrink-0">
            {/* Back doc */}
            <div className="absolute -left-2 -top-2 w-24 sm:w-32 h-32 sm:h-40 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm transform -rotate-6 transition-transform group-hover:-rotate-12"></div>
            {/* Front doc */}
            <div className="relative w-24 sm:w-32 h-32 sm:h-40 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-md p-3 sm:p-4 flex flex-col gap-2 sm:gap-3 transition-transform group-hover:scale-105">
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-1 sm:mb-2">
                 <FileText className="w-4 h-4 sm:w-6 sm:h-6 text-slate-400" />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <div className="h-1.5 sm:h-2 w-full bg-slate-100 dark:bg-slate-700 rounded"></div>
                <div className="h-1.5 sm:h-2 w-3/4 bg-slate-100 dark:bg-slate-700 rounded"></div>
                <div className="h-1.5 sm:h-2 w-5/6 bg-slate-100 dark:bg-slate-700 rounded"></div>
              </div>
            </div>
            <div className="absolute -bottom-8 left-0 right-0 text-center opacity-0 sm:opacity-100 transition-opacity">
              <span className="text-xs font-semibold text-muted-foreground">Unstructured Docs</span>
            </div>
          </div>

          {/* Middle: Transformation */}
          <div className="flex flex-col items-center gap-2 text-primary relative z-10 shrink-0">
             <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center shadow-lg shadow-primary/20 animate-pulse">
               <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
             </div>
             <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground/50" />
          </div>

          {/* Right: BPMN Model */}
          <div className="relative w-48 sm:w-64 h-36 sm:h-48 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl p-4 sm:p-6 flex items-center justify-center transition-transform hover:scale-[1.02] shrink-0">
            {/* Simple CSS BPMN Diagram */}
            <div className="relative w-full h-full flex items-center justify-between">
               {/* Start Event */}
               <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-green-500 bg-green-50 dark:bg-green-900/20 shrink-0"></div>
               
               {/* Line */}
               <div className="flex-1 h-0.5 bg-slate-300 mx-0.5 sm:mx-1"></div>
               
               {/* Task */}
               <div className="w-14 sm:w-20 h-10 sm:h-12 rounded border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                 <div className="space-y-1">
                    <div className="w-8 sm:w-12 h-1 bg-blue-200 dark:bg-blue-800 rounded"></div>
                    <div className="w-6 sm:w-8 h-1 bg-blue-200 dark:bg-blue-800 rounded mx-auto"></div>
                 </div>
               </div>

               {/* Line */}
               <div className="flex-1 h-0.5 bg-slate-300 mx-0.5 sm:mx-1"></div>

               {/* Gateway */}
               <div className="w-6 h-6 sm:w-8 sm:h-8 transform rotate-45 border-2 border-orange-500 bg-orange-50 dark:bg-orange-900/20 shrink-0"></div>

               {/* Line */}
               <div className="flex-1 h-0.5 bg-slate-300 mx-0.5 sm:mx-1"></div>

               {/* End Event */}
               <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-4 border-red-500 bg-red-50 dark:bg-red-900/20 shrink-0"></div>
            </div>
            
            {/* Floating Label */}
            <div className="absolute -right-2 sm:-right-4 -top-2 sm:-top-4 bg-primary text-primary-foreground text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-lg">
              BPMN 2.0
            </div>
            
            <div className="absolute -bottom-8 left-0 right-0 text-center opacity-0 sm:opacity-100 transition-opacity">
              <span className="text-xs font-semibold text-muted-foreground">Structured Model</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

