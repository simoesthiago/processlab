/**
 * useBpmnSync Hook
 * 
 * Manages synchronization between the local BPMN editor state and the backend.
 * - Auto-saves changes (debounced)
 * - Handles "Save" actions
 * - Updates internal JSON state
 */

import { useState, useCallback, useRef } from 'react';
import { BPMN_JSON } from '@processlab/shared-schemas';

interface UseBpmnSyncProps {
    onSave?: (xml: string, json: BPMN_JSON) => Promise<void>;
    onError?: (error: Error) => void;
}

export function useBpmnSync({ onSave, onError }: UseBpmnSyncProps = {}) {
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const save = useCallback(async (xml: string, json: BPMN_JSON) => {
        setIsSaving(true);
        try {
            if (onSave) {
                await onSave(xml, json);
            }
            setLastSaved(new Date());
        } catch (err) {
            console.error('Failed to save BPMN:', err);
            if (onError) onError(err as Error);
        } finally {
            setIsSaving(false);
        }
    }, [onSave, onError]);

    const debouncedSave = useCallback((xml: string, json: BPMN_JSON) => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
            save(xml, json);
        }, 2000); // 2s debounce
    }, [save]);

    return {
        save,
        debouncedSave,
        isSaving,
        lastSaved,
    };
}
