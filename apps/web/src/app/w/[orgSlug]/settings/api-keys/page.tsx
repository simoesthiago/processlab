'use client';

/**
 * API Keys Settings Page
 * 
 * Manage API keys for integrations and BYOK LLM.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { 
  Key, 
  Plus, 
  Copy, 
  Check, 
  Trash2, 
  RotateCw,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ApiKey {
  id: string;
  name: string;
  key_type: string;
  key_preview: string;
  scopes: string[] | null;
  is_active: boolean;
  last_used_at: string | null;
  usage_count: number;
  created_at: string;
  expires_at: string | null;
}

interface NewKeyResponse {
  id: string;
  name: string;
  key_type: string;
  key: string;
  key_preview: string;
  scopes: string[] | null;
  created_at: string;
  expires_at: string | null;
}

const KEY_TYPES = [
  { value: 'integration', label: 'Integration', description: 'For external API access' },
  { value: 'llm_openai', label: 'OpenAI', description: 'BYOK for OpenAI models' },
  { value: 'llm_anthropic', label: 'Anthropic', description: 'BYOK for Claude models' },
  { value: 'llm_other', label: 'Other LLM', description: 'For other LLM providers' },
];

export default function ApiKeysPage() {
  const { token } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyType, setNewKeyType] = useState('integration');
  const [creating, setCreating] = useState(false);
  
  // New key display
  const [newKey, setNewKey] = useState<NewKeyResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);
  
  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch API keys
  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/v1/api-keys`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch API keys');
      }

      const data = await response.json();
      setApiKeys(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApiKeys();
  }, [token]);

  // Create new key
  const handleCreate = async () => {
    if (!newKeyName.trim()) return;

    try {
      setCreating(true);
      const response = await fetch(`${API_URL}/api/v1/api-keys`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newKeyName,
          key_type: newKeyType,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create API key');
      }

      const data: NewKeyResponse = await response.json();
      setNewKey(data);
      setNewKeyName('');
      setNewKeyType('integration');
      fetchApiKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create API key');
    } finally {
      setCreating(false);
    }
  };

  // Copy key to clipboard
  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Delete key
  const handleDelete = async (keyId: string) => {
    try {
      setDeleting(true);
      const response = await fetch(`${API_URL}/api/v1/api-keys/${keyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to revoke API key');
      }

      setDeleteId(null);
      fetchApiKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke API key');
    } finally {
      setDeleting(false);
    }
  };

  // Rotate key
  const handleRotate = async (keyId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/api-keys/${keyId}/rotate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to rotate API key');
      }

      const data = await response.json();
      setNewKey(data.new_key);
      fetchApiKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rotate API key');
    }
  };

  const getKeyTypeBadge = (keyType: string) => {
    const colors: Record<string, string> = {
      integration: 'bg-primary/10 text-primary',
      llm_openai: 'bg-green-500/10 text-green-600',
      llm_anthropic: 'bg-orange-500/10 text-orange-600',
      llm_other: 'bg-purple-500/10 text-purple-600',
    };
    return colors[keyType] || 'bg-muted text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">API Keys</h1>
          <p className="text-muted-foreground">
            Manage API keys for integrations and BYOK (Bring Your Own Key) for LLM providers.
          </p>
        </div>
        
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create API Key</DialogTitle>
              <DialogDescription>
                Create a new API key for integrations or BYOK.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="keyName">Key Name</Label>
                <Input
                  id="keyName"
                  placeholder="My API Key"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Key Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  {KEY_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setNewKeyType(type.value)}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        newKeyType === type.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-muted'
                      }`}
                    >
                      <p className="font-medium text-sm">{type.label}</p>
                      <p className="text-xs text-muted-foreground">{type.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={creating || !newKeyName.trim()}>
                {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Key
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <p>{error}</p>
        </Alert>
      )}

      {/* New Key Display */}
      {newKey && (
        <Alert className="bg-success/5 border-success/20">
          <Key className="h-4 w-4 text-success" />
          <div className="ml-2 flex-1">
            <p className="font-medium text-success">API Key Created Successfully!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Make sure to copy your key now. You won't be able to see it again!
            </p>
            <div className="mt-3 flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-muted rounded font-mono text-sm">
                {showKey ? newKey.key : '•'.repeat(40)}
              </code>
              <Button
                size="icon"
                variant="outline"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={() => handleCopy(newKey.key)}
              >
                {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="mt-2"
              onClick={() => {
                setNewKey(null);
                setShowKey(false);
              }}
            >
              Dismiss
            </Button>
          </div>
        </Alert>
      )}

      {/* API Keys List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Your API Keys
          </CardTitle>
          <CardDescription>
            API keys allow you to authenticate with the ProcessLab API.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Key className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No API keys yet</p>
              <p className="text-sm">Create your first API key to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    !key.is_active ? 'opacity-50 bg-muted/50' : ''
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{key.name}</p>
                      <Badge className={getKeyTypeBadge(key.key_type)}>
                        {KEY_TYPES.find(t => t.value === key.key_type)?.label || key.key_type}
                      </Badge>
                      {!key.is_active && (
                        <Badge variant="destructive">Revoked</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <code className="font-mono">{key.key_preview}</code>
                      <span>•</span>
                      <span>Used {key.usage_count} times</span>
                      {key.last_used_at && (
                        <>
                          <span>•</span>
                          <span>
                            Last used {new Date(key.last_used_at).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {key.is_active && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleRotate(key.id)}
                        title="Rotate Key"
                      >
                        <RotateCw className="h-4 w-4" />
                      </Button>
                      
                      <Dialog open={deleteId === key.id} onOpenChange={(open) => setDeleteId(open ? key.id : null)}>
                        <DialogTrigger asChild>
                          <Button size="icon" variant="outline" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Revoke API Key</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to revoke "{key.name}"? This action cannot be undone.
                              Any integrations using this key will stop working.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setDeleteId(null)}>
                              Cancel
                            </Button>
                            <Button 
                              variant="destructive" 
                              onClick={() => handleDelete(key.id)}
                              disabled={deleting}
                            >
                              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                              Revoke Key
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0" />
            <div className="space-y-1">
              <p className="font-medium">Security Best Practices</p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>Never share your API keys or commit them to version control</li>
                <li>Rotate keys periodically and immediately if compromised</li>
                <li>Use separate keys for different environments (dev, staging, prod)</li>
                <li>BYOK keys are never stored - they're only used for the request</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

