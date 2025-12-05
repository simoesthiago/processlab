'use client';

/**
 * Audit Log Settings Page
 * 
 * View and export system audit logs for compliance.
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
  ScrollText, 
  Download, 
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  User,
  Shield,
  Settings,
  FileOutput,
  Building2,
  Calendar,
  Search
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface AuditLogEntry {
  id: string;
  organization_id: string | null;
  event_type: string;
  event_category: string;
  actor_email: string | null;
  target_type: string | null;
  target_id: string | null;
  target_email: string | null;
  ip_address: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

const EVENT_CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'user_management', label: 'User Management', icon: User },
  { value: 'security', label: 'Security', icon: Shield },
  { value: 'organization', label: 'Organization', icon: Building2 },
  { value: 'export', label: 'Export', icon: FileOutput },
];

const getCategoryIcon = (category: string) => {
  const cat = EVENT_CATEGORIES.find(c => c.value === category);
  return cat?.icon || Settings;
};

const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    user_management: 'bg-blue-500/10 text-blue-600',
    security: 'bg-red-500/10 text-red-600',
    organization: 'bg-purple-500/10 text-purple-600',
    export: 'bg-green-500/10 text-green-600',
    billing: 'bg-yellow-500/10 text-yellow-600',
  };
  return colors[category] || 'bg-muted text-muted-foreground';
};

const formatEventType = (eventType: string): string => {
  return eventType
    .replace(/_/g, ' ')
    .replace(/\./g, ' → ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default function AuditLogPage() {
  const { token, user } = useAuth();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 20;
  
  // Filters
  const [filters, setFilters] = useState({
    event_category: '',
    event_type: '',
    actor_email: '',
    start_date: '',
    end_date: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Export state
  const [exporting, setExporting] = useState(false);

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  // Fetch audit logs
  const fetchLogs = async () => {
    if (!isAdmin) {
      setError('Only administrators can view audit logs');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      });
      
      if (filters.event_category) params.append('event_category', filters.event_category);
      if (filters.event_type) params.append('event_type', filters.event_type);
      if (filters.actor_email) params.append('actor_email', filters.actor_email);
      if (filters.start_date) params.append('start_date', new Date(filters.start_date).toISOString());
      if (filters.end_date) params.append('end_date', new Date(filters.end_date).toISOString());
      
      const response = await fetch(`${API_URL}/api/v1/audit-log?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Access denied. Only administrators can view audit logs.');
        }
        throw new Error('Failed to fetch audit logs');
      }

      const data = await response.json();
      setLogs(data.items);
      setTotalItems(data.total);
      setTotalPages(Math.ceil(data.total / pageSize));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [token, page, isAdmin]);

  // Apply filters
  const handleApplyFilters = () => {
    setPage(1);
    fetchLogs();
  };

  // Clear filters
  const handleClearFilters = () => {
    setFilters({
      event_category: '',
      event_type: '',
      actor_email: '',
      start_date: '',
      end_date: '',
    });
    setPage(1);
    fetchLogs();
  };

  // Export logs
  const handleExport = async (format: 'csv' | 'json') => {
    try {
      setExporting(true);
      
      const params = new URLSearchParams({ format });
      if (filters.event_category) params.append('event_category', filters.event_category);
      if (filters.event_type) params.append('event_type', filters.event_type);
      if (filters.actor_email) params.append('actor_email', filters.actor_email);
      if (filters.start_date) params.append('start_date', new Date(filters.start_date).toISOString());
      if (filters.end_date) params.append('end_date', new Date(filters.end_date).toISOString());
      
      const response = await fetch(`${API_URL}/api/v1/audit-log/export?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to export audit logs');
      }

      // Get filename from content-disposition header
      const disposition = response.headers.get('content-disposition');
      const filename = disposition?.match(/filename=(.+)/)?.[1] || `audit_log.${format}`;
      
      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export audit logs');
    } finally {
      setExporting(false);
    }
  };

  // Not admin view
  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
          <p className="text-muted-foreground">
            View security and activity logs for your organization.
          </p>
        </div>
        
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <div className="ml-2">
            <p className="font-medium">Access Denied</p>
            <p className="text-sm">Only organization administrators can view audit logs.</p>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
          <p className="text-muted-foreground">
            View security and activity logs for compliance.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          
          <Button
            variant="outline"
            onClick={() => handleExport('csv')}
            disabled={exporting}
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export CSV
          </Button>
          
          <Button
            variant="outline"
            onClick={() => handleExport('json')}
            disabled={exporting}
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export JSON
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <p>{error}</p>
        </Alert>
      )}

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  className="w-full px-3 py-2 rounded-md border bg-background"
                  value={filters.event_category}
                  onChange={(e) => setFilters({ ...filters, event_category: e.target.value })}
                >
                  {EVENT_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="actor">Actor Email</Label>
                <Input
                  id="actor"
                  placeholder="Search by email..."
                  value={filters.actor_email}
                  onChange={(e) => setFilters({ ...filters, actor_email: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="eventType">Event Type</Label>
                <Input
                  id="eventType"
                  placeholder="e.g., invitation.created"
                  value={filters.event_type}
                  onChange={(e) => setFilters({ ...filters, event_type: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                />
              </div>
              
              <div className="flex items-end gap-2">
                <Button onClick={handleApplyFilters}>
                  <Search className="h-4 w-4 mr-2" />
                  Apply
                </Button>
                <Button variant="outline" onClick={handleClearFilters}>
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="h-5 w-5" />
            Activity Log
          </CardTitle>
          <CardDescription>
            Showing {logs.length} of {totalItems} entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ScrollText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No audit log entries found</p>
              <p className="text-sm">Activity will appear here as it happens.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => {
                const CategoryIcon = getCategoryIcon(log.event_category);
                
                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className={`p-2 rounded-lg ${getCategoryColor(log.event_category)}`}>
                      <CategoryIcon className="h-4 w-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{formatEventType(log.event_type)}</p>
                        <Badge className={getCategoryColor(log.event_category)}>
                          {log.event_category.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      <div className="mt-1 text-sm text-muted-foreground space-y-1">
                        {log.actor_email && (
                          <p>
                            <span className="text-foreground font-medium">{log.actor_email}</span>
                          </p>
                        )}
                        {log.target_email && (
                          <p>
                            Target: <span className="text-foreground">{log.target_email}</span>
                          </p>
                        )}
                        {log.details && Object.keys(log.details).length > 0 && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-xs hover:text-foreground">
                              View details
                            </summary>
                            <pre className="mt-2 p-2 rounded bg-muted text-xs overflow-x-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right text-sm text-muted-foreground shrink-0">
                      <p>{new Date(log.created_at).toLocaleDateString()}</p>
                      <p>{new Date(log.created_at).toLocaleTimeString()}</p>
                      {log.ip_address && (
                        <p className="text-xs mt-1">{log.ip_address}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

