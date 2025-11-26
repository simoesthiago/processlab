/**
 * BPMappr Studio - BPMN Process Modeling Interface
 * 
 * This is the main workspace where users:
 * - View and edit BPMN diagrams
 * - Interact with the AI copilot
 * - View citations and source artifacts
 * 
 * Layout:
 * - Left: BPMN Editor (bpmn-js)
 * - Right: Copilot panel + Citations/Artifacts
 */

import React from 'react';

export default function StudioPage() {
    return (
        <div className="flex h-screen w-full bg-zinc-50 dark:bg-zinc-900">
            {/* Left Panel - BPMN Editor */}
            <div className="flex-1 flex flex-col border-r border-zinc-200 dark:border-zinc-800">
                {/* Toolbar */}
                <div className="h-14 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-4 gap-4">
                    <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                        BPMappr Studio
                    </h1>
                    <div className="flex-1" />
                    <button className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                        Export
                    </button>
                </div>

                {/* Editor Area - Placeholder for bpmn-js */}
                <div className="flex-1 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto">
                            <svg
                                className="w-8 h-8 text-blue-600 dark:text-blue-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                                />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                                BPMN Editor
                            </h2>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                                bpmn-js integration will be added in Sprint 2
                            </p>
                        </div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-500 font-mono">
                            src/features/bpmn/editor/BpmnEditor.tsx
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Copilot & Artifacts */}
            <div className="w-96 bg-white dark:bg-zinc-950 flex flex-col">
                {/* Tabs */}
                <div className="h-14 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-4 gap-2">
                    <button className="px-3 py-1.5 text-sm font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 rounded-md">
                        Copilot
                    </button>
                    <button className="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-md transition-colors">
                        Citations
                    </button>
                    <button className="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-md transition-colors">
                        Artifacts
                    </button>
                </div>

                {/* Copilot Panel Placeholder */}
                <div className="flex-1 p-4 overflow-y-auto">
                    <div className="space-y-4">
                        <div className="text-center py-8">
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg
                                    className="w-6 h-6 text-purple-600 dark:text-purple-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                                AI Copilot
                            </h3>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                                Natural language editing and guidance
                            </p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-500 font-mono mt-3">
                                src/features/copiloto/
                            </p>
                        </div>

                        <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-3">
                            <h4 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                                Example Commands
                            </h4>
                            <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
                                <li>• "Add a user task after the start event"</li>
                                <li>• "Create a gateway for approval decision"</li>
                                <li>• "Add a lane for Finance Department"</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Input Area Placeholder */}
                <div className="border-t border-zinc-200 dark:border-zinc-800 p-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Ask copilot to edit the diagram..."
                            className="w-full px-3 py-2 pr-10 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 text-zinc-900 dark:text-zinc-50 placeholder-zinc-500 dark:placeholder-zinc-500"
                            disabled
                        />
                        <button className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-600">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </button>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-2">
                        Sprint 2: Natural language editing via multiagent system
                    </p>
                </div>
            </div>
        </div>
    );
}
