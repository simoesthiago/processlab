/**
 * Copilot Interface
 * 
 * Chat-like interface for natural language BPMN editing.
 */

import { useState } from 'react';
import { BPMN_JSON } from '@processlab/shared-schemas';

interface CopilotProps {
    bpmn?: BPMN_JSON;
    bpmnXml?: string;
    modelVersionId?: string;
    onEditApplied: (newBpmn: BPMN_JSON, newVersionId: string) => void;
}

export default function Copilot({ bpmn, bpmnXml, modelVersionId, onEditApplied }: CopilotProps) {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [history, setHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const command = input;
        setInput('');
        setHistory(prev => [...prev, { role: 'user', content: command }]);
        setIsLoading(true);

        try {
            const res = await fetch('/api/v1/edit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bpmn: bpmn || undefined,
                    bpmn_xml: bpmnXml,
                    command,
                    model_version_id: modelVersionId,
                }),
            });

            if (!res.ok) {
                throw new Error('Failed to execute command');
            }

            const data = await res.json();

            // Update history with changes
            const changesText = data.changes.join('\n');
            setHistory(prev => [...prev, { role: 'assistant', content: `Done! ${changesText}` }]);

            // Apply changes
            onEditApplied(data.bpmn, data.versionId);

        } catch (err) {
            console.error(err);
            setHistory(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error executing that command.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white border-l border-gray-200">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h2 className="font-semibold text-gray-700">Copilot</h2>
                <p className="text-xs text-gray-500">Describe changes to the process</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {history.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`p-3 rounded-lg text-sm ${msg.role === 'user'
                            ? 'bg-blue-50 text-blue-800 ml-8'
                            : 'bg-gray-100 text-gray-800 mr-8'
                            }`}
                    >
                        {msg.content.split('\n').map((line, i) => (
                            <div key={i}>{line}</div>
                        ))}
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-center space-x-2 text-gray-400 text-sm p-2">
                        <div className="animate-pulse">Thinking...</div>
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-gray-200">
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="e.g., Add a task 'Review'..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isLoading}
                    />
                </form>
            </div>
        </div>
    );
}
