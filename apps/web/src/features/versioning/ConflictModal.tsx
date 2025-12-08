import React from 'react';

interface ConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOverwrite: () => void;
  onViewDiff?: () => void;
  isSaving?: boolean;
  conflict?: {
    message?: string;
    yourEtag?: string;
    currentEtag?: string;
    lastModifiedBy?: string;
    lastModifiedAt?: string;
  };
}

export default function ConflictModal({
  isOpen,
  onClose,
  onOverwrite,
  onViewDiff,
  isSaving = false,
  conflict
}: ConflictModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-lg border border-zinc-200 dark:border-zinc-800">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Conflito de edição</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
            ✕
          </button>
        </div>

        <div className="p-4 space-y-3">
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            {conflict?.message || 'A versão do processo mudou enquanto você editava.'}
          </p>

          <div className="bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-md p-3 text-xs space-y-1">
            {conflict?.yourEtag && (
              <div className="flex justify-between gap-2">
                <span className="text-zinc-500">Sua versão</span>
                <span className="font-mono text-[11px] text-zinc-700 dark:text-zinc-300">{conflict.yourEtag}</span>
              </div>
            )}
            {conflict?.currentEtag && (
              <div className="flex justify-between gap-2">
                <span className="text-zinc-500">Versão atual</span>
                <span className="font-mono text-[11px] text-zinc-700 dark:text-zinc-300">{conflict.currentEtag}</span>
              </div>
            )}
            {conflict?.lastModifiedBy && (
              <div className="flex justify-between gap-2 text-zinc-500">
                <span>Última alteração por</span>
                <span className="text-zinc-700 dark:text-zinc-200">{conflict.lastModifiedBy}</span>
              </div>
            )}
            {conflict?.lastModifiedAt && (
              <div className="flex justify-between gap-2 text-zinc-500">
                <span>Alterado em</span>
                <span className="text-zinc-700 dark:text-zinc-200">{new Date(conflict.lastModifiedAt).toLocaleString()}</span>
              </div>
            )}
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-md p-3 text-xs text-amber-700 dark:text-amber-200">
            Escolha uma ação: sobrescrever mesmo assim ou comparar com a versão atual.
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-zinc-200 dark:border-zinc-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
          >
            Cancelar
          </button>
          {onViewDiff && (
            <button
              onClick={onViewDiff}
              className="px-4 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-md text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Ver diff
            </button>
          )}
          <button
            onClick={onOverwrite}
            disabled={isSaving}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Sobrescrevendo...' : 'Sobrescrever'}
          </button>
        </div>
      </div>
    </div>
  );
}

