import React, { useState } from 'react';

interface Version {
    version_number: number;
    version_label?: string;
    commit_message?: string;
}

interface RestoreVersionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRestore: (commitMessage?: string) => Promise<void>;
    isRestoring: boolean;
    version: Version | null;
}

export default function RestoreVersionModal({
    isOpen,
    onClose,
    onRestore,
    isRestoring,
    version
}: RestoreVersionModalProps) {
    const [commitMessage, setCommitMessage] = useState('');

    if (!isOpen || !version) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onRestore(commitMessage.trim() || undefined);
        setCommitMessage('');
    };

    const handleCancel = () => {
        setCommitMessage('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-md border border-zinc-200 dark:border-zinc-800">
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                        Restore Version v{version.version_number}
                    </h3>
                    <button
                        onClick={handleCancel}
                        disabled={isRestoring}
                        className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 disabled:opacity-50"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                        <p className="text-sm text-orange-800 dark:text-orange-300">
                            <strong>⚠️ Warning:</strong> This will create a new version based on v{version.version_number}.
                            The current active version will be replaced, but all history will be preserved.
                        </p>
                    </div>

                    {version.commit_message && (
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                Original Commit Message
                            </label>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800 rounded px-3 py-2">
                                {version.commit_message}
                            </p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Restore Message (Optional)
                        </label>
                        <textarea
                            value={commitMessage}
                            onChange={(e) => setCommitMessage(e.target.value)}
                            placeholder="Add a message explaining why you're restoring this version..."
                            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[80px]"
                        />
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                            If left empty, a default message will be used.
                        </p>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={handleCancel}
                            disabled={isRestoring}
                            className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isRestoring}
                            className="px-4 py-2 text-sm bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isRestoring ? 'Restoring...' : 'Restore Version'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

