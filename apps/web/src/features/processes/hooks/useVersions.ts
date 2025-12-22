/**
 * useVersions Hook
 * 
 * Hook for managing process versions.
 */

import { useState, useCallback, useEffect } from 'react';
import { apiFetch, API_URL } from '@/shared/services/api/client';

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
  bpmn_json?: any;
  xml?: string;
}

interface UseVersionsOptions {
  processId?: string;
}

export function useVersions(processId?: string) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [selectedVersionEtag, setSelectedVersionEtag] = useState<string | null>(null);
  const [bpmnXml, setBpmnXml] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadVersions = useCallback(async (id: string) => {
    if (!id) return;

    setLoading(true);
    try {
      const response = await apiFetch<{ versions: Version[] }>(
        `${API_URL}/api/v1/processes/${id}/versions`
      );
      setVersions(response.versions || []);
      
      // Set active version as selected if available
      const activeVersion = response.versions?.find(v => v.is_active);
      if (activeVersion) {
        setSelectedVersionId(activeVersion.id);
        setSelectedVersionEtag(activeVersion.etag || null);
      }
    } catch (err: any) {
      console.error('[useVersions] Load versions error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadVersionXml = useCallback(async (versionId: string) => {
    if (!processId || !versionId) return;

    try {
      const version = await apiFetch<Version>(
        `${API_URL}/api/v1/processes/${processId}/versions/${versionId}`
      );
      
      if (version.xml) {
        setBpmnXml(version.xml);
      } else if (version.bpmn_json) {
        // Convert JSON to XML if needed
        // This would require the converter utility
        console.warn('[useVersions] Version has JSON but no XML, conversion needed');
      }
      
      setSelectedVersionEtag(version.etag || null);
    } catch (err: any) {
      console.error('[useVersions] Load version XML error:', err);
    }
  }, [processId]);

  const saveVersion = useCallback(async (
    bpmnJson: any,
    commitMessage: string,
    changeType: 'major' | 'minor' | 'patch' = 'minor'
  ) => {
    if (!processId) {
      throw new Error('Process ID is required to save version');
    }

    setIsSaving(true);
    try {
      const response = await apiFetch<Version>(
        `${API_URL}/api/v1/processes/${processId}/versions`,
        {
          method: 'POST',
          body: JSON.stringify({
            bpmn_json: bpmnJson,
            commit_message: commitMessage,
            change_type: changeType,
          }),
        }
      );

      // Reload versions to get updated list
      await loadVersions(processId);
      
      // Set new version as selected
      setSelectedVersionId(response.id);
      setSelectedVersionEtag(response.etag || null);
      
      return response;
    } catch (err: any) {
      console.error('[useVersions] Save version error:', err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [processId, loadVersions]);

  // Load versions when processId changes
  useEffect(() => {
    if (processId) {
      loadVersions(processId);
    }
  }, [processId, loadVersions]);

  // Load XML when selected version changes
  useEffect(() => {
    if (processId && selectedVersionId) {
      loadVersionXml(selectedVersionId);
    }
  }, [processId, selectedVersionId, loadVersionXml]);

  return {
    versions,
    selectedVersionId,
    selectedVersionEtag,
    bpmnXml,
    isSaving,
    loading,
    loadVersions,
    loadVersionXml,
    saveVersion,
    setSelectedVersionId,
    setBpmnXml,
  };
}

