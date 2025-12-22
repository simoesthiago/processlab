'use client';

import { useEffect, useState } from 'react';
import { useSpaces } from '@/contexts/SpacesContext';
import { BreadcrumbItem, Breadcrumbs } from '@/shared/components/ui/breadcrumbs';
import { FolderOpen, Lock } from 'lucide-react';

interface FolderBreadcrumbsProps {
  spaceId: string;
  folderId: string | null;
  spaceName?: string;
}

export function FolderBreadcrumbs({ spaceId, folderId, spaceName }: FolderBreadcrumbsProps) {
  const { getFolderPath, getFolder, trees } = useSpaces();
  const currentFolder = folderId ? getFolder(spaceId, folderId) : null;
  const [path, setPath] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('[FolderBreadcrumbs] useEffect chamado com folderId:', folderId, 'spaceId:', spaceId);
    if (!folderId) {
      console.log('[FolderBreadcrumbs] folderId vazio, limpando path');
      setPath([]);
      setLoading(false);
      return;
    }

    let isMounted = true;
    
    // Função para encontrar path local na árvore
    const findLocalPath = (folders: any[], targetId: string, currentPath: any[] = []): any[] | null => {
      for (const folder of folders) {
        const folderName = folder.name || `Folder ${folder.id?.slice(0, 8) || 'unknown'}`;
        const newPath = [...currentPath, { id: folder.id, name: folderName }];
        if (folder.id === targetId) {
          return newPath;
        }
        if (folder.children?.length) {
          const childPath = findLocalPath(folder.children, targetId, newPath);
          if (childPath) return childPath;
        }
      }
      return null;
    };
    
    // Tentar obter path local imediatamente para exibição rápida
    const tree = trees?.[spaceId];
    let hasLocalPath = false;
    if (tree) {
      const localPath = findLocalPath(tree.root_folders || [], folderId);
      if (localPath && localPath.length > 0) {
        console.log('[FolderBreadcrumbs] Path local encontrado imediatamente:', localPath);
        setPath(localPath);
        hasLocalPath = true;
      }
    }
    
    // Só mostrar loading se não temos path local
    if (!hasLocalPath) {
      setLoading(true);
    }

    console.log('[FolderBreadcrumbs] Chamando getFolderPath para folderId:', folderId);

    // Buscar path completo da API em background para atualizar se necessário
    getFolderPath(spaceId, folderId)
      .then((p) => {
        if (isMounted) {
          console.log('[FolderBreadcrumbs] Path recebido da API:', p);
          // Validar e filtrar items inválidos
          const validPath = (p || []).filter(item => item && item.id);
          console.log('[FolderBreadcrumbs] Path válido após filtro:', validPath);
          // Atualizar se o path da API for diferente ou mais completo
          if (validPath.length > 0) {
            setPath(validPath);
          }
        }
      })
      .catch((err) => {
        console.error('[FolderBreadcrumbs] Failed to load folder path:', err);
        // Não limpar path se já temos um local
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [spaceId, folderId, getFolderPath, trees]);

  // Construct full breadcrumb list
  // 1. Root Space
  const fullItems: BreadcrumbItem[] = [
    {
      label: spaceName === 'Private Space' || !spaceName ? 'Private Space' : spaceName,
      href: `/spaces/${spaceId}`,
      icon: (spaceName === 'Private Space' || !spaceName) ? Lock : FolderOpen
    }
  ];

  // 2. Folder Path (API returns path including the current folder)
  // We want to link all except the last one (current page) usually, but Breadcrumbs component handles last item distinctness.
  // Actually standard breadcrumbs usually have link for everything except current page.

  if (path.length > 0) {
    // Path completo da API - adicionar todos os folders
    path.forEach((item, index) => {
      // Validar que item tem name e id
      if (item && item.id) {
        const label = item.name || `Folder ${index + 1}`;
        if (!item.name) {
          console.warn('[FolderBreadcrumbs] Item sem name, usando fallback:', item);
        }
        fullItems.push({
          label: label,
          href: `/spaces/${spaceId}/folders/${item.id}`,
          icon: FolderOpen,
        });
      } else {
        console.error('[FolderBreadcrumbs] Item do path inválido (sem id):', item);
      }
    });
  } else if (loading) {
    // Ainda carregando - mostrar skeleton
    return (
      <div className="text-sm text-muted-foreground animate-pulse flex items-center gap-2">
        <Lock className="h-4 w-4" /> <span>Private Space</span> <span>/</span> <span className="h-4 w-20 bg-muted rounded"></span>
      </div>
    );
  } else if (currentFolder && path.length === 0 && !loading) {
    // Path não carregou mas temos o folder atual - mostrar apenas ele como fallback
    // Isso pode acontecer se a API falhar ou retornar vazio
    if (currentFolder.name && currentFolder.id) {
      console.warn('[FolderBreadcrumbs] Path não carregou, mostrando apenas folder atual como fallback:', currentFolder.name);
      fullItems.push({
        label: currentFolder.name,
        href: `/spaces/${spaceId}/folders/${currentFolder.id}`,
        icon: FolderOpen,
      });
    } else {
      console.error('[FolderBreadcrumbs] currentFolder inválido:', currentFolder);
    }
  }

  // 3. Truncation Logic
  // User wants: if > 5 elements, show "Private Space > (...) > Last Folder"
  // Interpret "elements" as the total breadcrumb items.

  let displayedItems = fullItems;
  const MAX_ITEMS = 5;

  if (fullItems.length > MAX_ITEMS) {
    // Keep first (Space)
    // Keep last (Current Folder)
    // Collapse everything in between
    const first = fullItems[0];
    const last = fullItems[fullItems.length - 1];

    displayedItems = [
      first,
      { label: '...', icon: FolderOpen }, // Collapsed indicator
      last
    ];

    // Alternative interpretation: Provide access to immediate parent? 
    // User example: "Private Space > iconepasta (...) > Folder 5"
    // This strictly matches my implementation above.
  }

  return (
    <div className="text-sm text-muted-foreground">
      <Breadcrumbs items={displayedItems} />
    </div>
  );
}
