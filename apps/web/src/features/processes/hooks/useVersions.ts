/**
 * useVersions Hook
 * 
 * Hook for managing process versions.
 */

import { useState, useCallback, useEffect } from 'react';
import { apiFetch } from '@/shared/services/api/client';

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

  const loadVersions = useCallback(async (id: string, silent: boolean = false) => {
    if (!id) return;

    setLoading(true);
    try {
      const response = await apiFetch<{ versions: Version[]; process_id?: string; process_name?: string; total_count?: number }>(
        `/api/v1/processes/${id}/versions`,
        { silent } // Pass silent mode to apiFetch
      );
      // API returns { versions, process_id, process_name, total_count }
      const versionsList = response.versions || [];
      setVersions(versionsList);
      
      // Set active version as selected if available, otherwise use the latest version
      const activeVersion = versionsList.find(v => v.is_active);
      if (activeVersion) {
        setSelectedVersionId(activeVersion.id);
        setSelectedVersionEtag(activeVersion.etag || null);
      } else if (versionsList.length > 0) {
        // If no active version, use the latest version (first in list, as it's sorted by version_number desc)
        const latestVersion = versionsList[0];
        setSelectedVersionId(latestVersion.id);
        setSelectedVersionEtag(latestVersion.etag || null);
      }
    } catch (err: any) {
      if (!silent) {
        console.error('[useVersions] Load versions error:', err);
      } else {
        console.warn('[useVersions] Failed to load versions (silent mode):', err.message);
      }
      // Don't throw in silent mode to prevent breaking the UI
      if (!silent) {
        throw err;
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const loadVersionXml = useCallback(async (versionId: string) => {
    if (!processId || !versionId) return;

    try {
      const version = await apiFetch<Version>(
        `/api/v1/processes/${processId}/versions/${versionId}`
      );
      
      console.log('[useVersions] Loaded version:', {
        id: version.id,
        hasXml: !!version.xml,
        xmlLength: version.xml?.length || 0,
        hasBpmnJson: !!version.bpmn_json,
        bpmnJsonKeys: version.bpmn_json ? Object.keys(version.bpmn_json) : []
      });
      
      if (version.xml) {
        console.log('[useVersions] XML preview (first 500 chars):', version.xml.substring(0, 500));
        setBpmnXml(version.xml);
      } else if (version.bpmn_json) {
        // Try to extract XML from bpmn_json if it exists
        const xmlFromJson = version.bpmn_json.xml || version.bpmn_json.bpmn_xml;
        if (xmlFromJson) {
          console.log('[useVersions] Found XML in bpmn_json, length:', xmlFromJson.length);
          setBpmnXml(xmlFromJson);
        } else {
          // Convert JSON to XML if needed
          // This would require the converter utility
          console.warn('[useVersions] Version has JSON but no XML, conversion needed');
        }
      } else {
        console.warn('[useVersions] Version has no XML or bpmn_json');
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

    // Extract XML from bpmnJson to use immediately after save
    const savedXml = bpmnJson.xml || bpmnJson.bpmn_xml || null;

    setIsSaving(true);
    try {
      const response = await apiFetch<Version>(
        `/api/v1/processes/${processId}/versions`,
        {
          method: 'POST',
          body: JSON.stringify({
            bpmn_json: bpmnJson,
            commit_message: commitMessage,
            change_type: changeType,
          }),
        }
      );

      // Set new version as selected immediately
      setSelectedVersionId(response.id);
      setSelectedVersionEtag(response.etag || null);
      
      // Use the XML we just saved instead of reloading from API
      // This prevents the canvas from going blank while waiting for API response
      if (savedXml) {
        console.log('[useVersions] Using saved XML directly, length:', savedXml.length);
        setBpmnXml(savedXml);
      } else {
        // Fallback: reload from API if XML not in bpmnJson
        console.log('[useVersions] XML not in bpmnJson, reloading from API');
        try {
          await loadVersionXml(response.id);
        } catch (xmlError: any) {
          console.warn('[useVersions] Failed to reload XML after save:', xmlError);
        }
      }
      
      // Try to reload versions, but don't fail if it errors (use silent mode)
      try {
        await loadVersions(processId, true);
      } catch (reloadError: any) {
        // Silent mode shouldn't throw, but just in case, handle it gracefully
        console.warn('[useVersions] Failed to reload versions after save, but save was successful:', reloadError);
        // Add the new version to the list manually if reload fails
        setVersions(prev => {
          const exists = prev.some(v => v.id === response.id);
          if (!exists) {
            return [...prev, response];
          }
          return prev;
        });
      }
      
      return response;
    } catch (err: any) {
      console.error('[useVersions] Save version error:', err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [processId, loadVersions]);

  // Load versions when processId changes (silent mode to prevent UI breaking)
  useEffect(() => {
    if (processId) {
      loadVersions(processId, true).catch(() => {
        // Silently handle errors - versions will be empty but UI won't break
      });
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

