import React, { useState } from 'react';

interface SaveVersionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (message: string, changeType: 'major' | 'minor' | 'patch') => Promise<boolean>;
    isSaving: boolean;
}

export default function SaveVersionModal({ isOpen, onClose, onSave, isSaving }: SaveVersionModalProps) {
    if (!isOpen) return null;

    const handleConfirm = async () => {
        // Default values for simplified save
        await onSave('Manual save', 'minor');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-sm border border-zinc-200 dark:border-zinc-800 p-6">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Save Changes?</h3>
                <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                    Are you sure you want to save your changes to this process?
                </p>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                        disabled={isSaving}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isSaving}
                        className="px-4 py-2 text-sm bg-zinc-900 text-white rounded-md hover:bg-zinc-700 transition-colors disabled:opacity-50"
                    >
                        {isSaving ? 'Saving...' : 'Yes, Save'}
                    </button>
                </div>
            </div>
        </div>
    );
}
