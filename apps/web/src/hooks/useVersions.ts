
import { useState, useCallback } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export interface Version {
    id: string;
    version_number: number;
    version_label?: string;
    commit_message?: string;
    is_active: boolean;
    created_at: string;
    created_by?: string;
    change_type?: 'major' | 'minor' | 'patch';
    etag?: string;
}

export interface ConflictDetail {
    message?: string;
    yourEtag?: string;
    currentEtag?: string;
    lastModifiedBy?: string;
    lastModifiedAt?: string;
}

export function useVersions(processId?: string) {
    const { token } = useAuth();

    const [versions, setVersions] = useState<Version[]>([]);
    const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
    const [selectedVersionEtag, setSelectedVersionEtag] = useState<string | undefined>(undefined);
    const [bpmnXml, setBpmnXml] = useState<string | undefined>(undefined);
    const [conflictInfo, setConflictInfo] = useState<ConflictDetail | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Load list of versions
    const loadVersions = useCallback(async (pid: string) => {
        if (!token) return;
        try {
            const data = await apiFetch(`/api/v1/processes/${pid}/versions`, { token });
            const list: Version[] = data.versions || [];
            setVersions(list);

            // Auto-update selected etag if selectedVersion matches
            if (selectedVersionId) {
                const match = list.find(v => v.id === selectedVersionId);
                if (match) setSelectedVersionEtag(match.etag);
            } else if (list.length > 0) {
                // Default to latest
                setSelectedVersionId(list[0].id);
                setSelectedVersionEtag(list[0].etag);
            }
        } catch (err) {
            console.error('Failed to load versions', err);
        }
    }, [token, selectedVersionId]);

    // Load XML content for a specific version
    const loadVersionXml = useCallback(async (pid: string, vid: string) => {
        if (!token) return;
        try {
            const data = await apiFetch(`/api/v1/processes/${pid}/versions/${vid}`, { token });

            // Check bpmn_json wrapper first, then raw xml
            const xml = data.bpmn_json?.xml || data.bpmn_xml;
            if (xml) setBpmnXml(xml);
            return xml;
        } catch (err) {
            console.error('Failed to load version XML', err);
            // Let caller handle UI error
            throw err;
        }
    }, [token]);

    // Save new version
    const saveVersion = useCallback(async (
        pid: string,
        xml: string,
        params: {
            message: string;
            changeType: 'major' | 'minor' | 'patch';
            parentVersionId: string | null;
            force?: boolean;
        }
    ) => {
        if (!token) throw new Error('Not authenticated');

        setIsSaving(true);
        setConflictInfo(null); // Reset conflict

        const headers: Record<string, string> = {};
        if (!params.force && selectedVersionEtag) {
            headers['If-Match'] = selectedVersionEtag;
        }

        try {
            const parentId = params.parentVersionId || (versions.length > 0 ? versions[0].id : null);

            const newVersion = await apiFetch(`/api/v1/processes/${pid}/versions`, {
                method: 'POST',
                token,
                headers,
                body: JSON.stringify({
                    bpmn_json: { xml },
                    version_label: `vNew`, // Backend handles numbering usually, or simpler logic here
                    commit_message: params.message,
                    change_type: params.changeType,
                    parent_version_id: parentId,
                    is_active: true
                })
            });

            await loadVersions(pid);
            setSelectedVersionId(newVersion.id);
            setSelectedVersionEtag(newVersion.etag);
            return newVersion;

        } catch (err: any) {
            if (err.status === 409) {
                const detail = err.data?.detail || err.data;
                setConflictInfo({
                    message: detail?.message || 'Edit conflict detected.',
                    yourEtag: detail?.your_etag || selectedVersionEtag,
                    currentEtag: detail?.current_etag,
                    lastModifiedAt: detail?.last_modified_at,
                    lastModifiedBy: detail?.last_modified_by,
                });
                // Reload versions to show what happened
                await loadVersions(pid);
                throw new Error('Conflict detected');
            }
            throw err;
        } finally {
            setIsSaving(false);
        }
    }, [token, selectedVersionEtag, versions, loadVersions]);

    return {
        versions,
        selectedVersionId,
        selectedVersionEtag,
        bpmnXml,
        conflictInfo,
        isSaving,
        loadVersions,
        loadVersionXml,
        saveVersion,
        setSelectedVersionId,
        setBpmnXml,
        setConflictInfo
    };
}
