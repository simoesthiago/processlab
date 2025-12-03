import React, { useState } from 'react';

interface SaveVersionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (message: string, changeType: 'major' | 'minor' | 'patch') => Promise<void>;
    isSaving: boolean;
}

export default function SaveVersionModal({ isOpen, onClose, onSave, isSaving }: SaveVersionModalProps) {
    const [message, setMessage] = useState('');
    const [changeType, setChangeType] = useState<'major' | 'minor' | 'patch'>('minor');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave(message, changeType);
        setMessage('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-md border border-zinc-200 dark:border-zinc-800">
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Save New Version</h3>
                    <button onClick={onClose} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Change Type
                        </label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="changeType"
                                    value="patch"
                                    checked={changeType === 'patch'}
                                    onChange={() => setChangeType('patch')}
                                    className="text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-zinc-600 dark:text-zinc-400">Patch (Fix)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="changeType"
                                    value="minor"
                                    checked={changeType === 'minor'}
                                    onChange={() => setChangeType('minor')}
                                    className="text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-zinc-600 dark:text-zinc-400">Minor (Feature)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="changeType"
                                    value="major"
                                    checked={changeType === 'major'}
                                    onChange={() => setChangeType('major')}
                                    className="text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-zinc-600 dark:text-zinc-400">Major (Breaking)</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Commit Message
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Describe your changes..."
                            required
                            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving || !message.trim()}
                            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving ? 'Saving...' : 'Save Version'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
