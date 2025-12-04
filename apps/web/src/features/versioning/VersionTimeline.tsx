import React, { useState } from 'react';

interface Version {
    id: string;
    version_number: number;
    version_label?: string;
    commit_message?: string;
    created_at: string;
    created_by?: string;
    is_active: boolean;
    change_type?: 'major' | 'minor' | 'patch';
}

interface VersionTimelineProps {
    versions: Version[];
    selectedVersionId: string | null;
    onSelectVersion: (versionId: string) => void;
    onCompareVersions?: (baseVersionId: string, compareVersionId: string) => void;
    onRestoreVersion?: (versionId: string) => void;
}

export default function VersionTimeline({
    versions,
    selectedVersionId,
    onSelectVersion,
    onCompareVersions,
    onRestoreVersion
}: VersionTimelineProps) {
    const [compareMode, setCompareMode] = useState(false);
    const [baseVersionId, setBaseVersionId] = useState<string | null>(null);

    if (versions.length === 0) {
        return (
            <div className="p-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
                No history available.
            </div>
        );
    }

    const handleCompareClick = (versionId: string) => {
        if (!onCompareVersions) return;
        
        if (!compareMode) {
            // Enter compare mode
            setCompareMode(true);
            setBaseVersionId(versionId);
        } else {
            // Compare with selected base version
            if (baseVersionId && baseVersionId !== versionId) {
                onCompareVersions(baseVersionId, versionId);
                setCompareMode(false);
                setBaseVersionId(null);
            } else {
                // Reset if clicking same version
                setCompareMode(false);
                setBaseVersionId(null);
            }
        }
    };

    const handleCancelCompare = () => {
        setCompareMode(false);
        setBaseVersionId(null);
    };

    return (
        <div className="flex flex-col h-full overflow-y-auto">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Version History</h3>
                    {compareMode && (
                        <button
                            onClick={handleCancelCompare}
                            className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                        >
                            Cancel
                        </button>
                    )}
                </div>
                {compareMode && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        Select a version to compare with v{versions.find(v => v.id === baseVersionId)?.version_number}
                    </p>
                )}
            </div>

            <div className="relative pl-6 pr-4 py-4 space-y-6">
                {/* Vertical Line */}
                <div className="absolute left-[27px] top-4 bottom-4 w-px bg-zinc-200 dark:bg-zinc-800" />

                {versions.map((version) => {
                    const isSelected = version.id === selectedVersionId;
                    const isActive = version.is_active;

                    return (
                        <div
                            key={version.id}
                            className={`relative pl-6 cursor-pointer group transition-all`}
                            onClick={() => onSelectVersion(version.id)}
                        >
                            {/* Dot */}
                            <div className={`absolute left-[-5px] top-1.5 w-3 h-3 rounded-full border-2 z-10 ${isActive
                                    ? 'bg-green-500 border-green-500'
                                    : isSelected
                                        ? 'bg-blue-500 border-blue-500'
                                        : 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600 group-hover:border-blue-400'
                                }`} />

                            <div className={`p-3 rounded-lg border transition-all ${isSelected
                                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                                }`}>
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                                            v{version.version_number}
                                        </span>
                                        {version.version_label && (
                                            <span className="text-xs px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-600 dark:text-zinc-400">
                                                {version.version_label}
                                            </span>
                                        )}
                                        {isActive && (
                                            <span className="text-xs px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded font-medium">
                                                Active
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-xs text-zinc-500">
                                        {new Date(version.created_at).toLocaleDateString()}
                                    </span>
                                </div>

                                {version.commit_message && (
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                                        {version.commit_message}
                                    </p>
                                )}

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                                        <span>{version.created_by || 'System'}</span>
                                        {version.change_type && (
                                            <>
                                                <span>•</span>
                                                <span className={`uppercase font-medium ${version.change_type === 'major' ? 'text-red-500' :
                                                        version.change_type === 'minor' ? 'text-blue-500' :
                                                            'text-zinc-500'
                                                    }`}>
                                                    {version.change_type}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {onCompareVersions && versions.length > 1 && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleCompareClick(version.id);
                                                }}
                                                className={`text-xs px-2 py-1 rounded transition-colors ${
                                                    compareMode && baseVersionId === version.id
                                                        ? 'bg-blue-600 text-white'
                                                        : compareMode
                                                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                                                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                                }`}
                                                title="Compare versions"
                                            >
                                                {compareMode && baseVersionId === version.id
                                                    ? 'Base'
                                                    : compareMode
                                                    ? 'Compare'
                                                    : 'Compare'}
                                            </button>
                                        )}
                                        {onRestoreVersion && !isActive && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onRestoreVersion(version.id);
                                                }}
                                                className="text-xs px-2 py-1 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
                                                title="Restore this version"
                                            >
                                                ↶ Restore
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
