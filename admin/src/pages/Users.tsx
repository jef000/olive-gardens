import { useMemo, useState } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, Users as UsersIcon, Shield, ShieldAlert, Mail, Calendar, Key, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import type { User, ApiResponse } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Avatar from '@/components/Avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import BulkActionBar from '@/components/BulkActionBar';
import EmptyState from '@/components/EmptyState';
import ExportDialog from '@/components/ExportDialog';
import { TableSkeleton } from '@/components/ui/skeleton';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import { highlightText } from '@/lib/highlighter';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useBulkDelete } from '@/hooks/useBulkDelete';
import { confirm } from '@/lib/confirm';
import { createEntityListCache } from '@/lib/entityListCache';
import { scheduleUndoableOperation } from '@/lib/undoableOperations';
import InfiniteScrollFooter from '@/components/InfiniteScrollFooter';
import ProgressModal from '@/components/ProgressModal';
import PageIntro from '@/components/PageIntro';

export default function Users() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'user' as 'user' | 'admin' | 'moderator',
  });

  const { data: usersData, isLoading, isError, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['users', searchTerm],
    queryFn: async ({ pageParam }) => {
      const response = await api.get<ApiResponse<{ users: User[]; total: number; page: number; has_more: boolean }>>('/users', { params: { search: searchTerm || undefined, page: pageParam, limit: 25 } });
      const payload = response.data.data;
      if (payload && Array.isArray(payload.users)) {
        return payload;
      }

      console.warn('Unexpected payload shape for /users, falling back to sanitized array', payload);
      return { users: [], total: 0, page: pageParam, has_more: false };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.has_more ? lastPage.page + 1 : undefined,
  });

  const normalizedUsers = useMemo(() => usersData?.pages.flatMap((page) => page.users) || [], [usersData]);

  const bulk = useBulkSelection(normalizedUsers);
  const { sentinelRef } = useInfiniteScroll(() => { void fetchNextPage(); }, Boolean(hasNextPage), isFetchingNextPage);
  const exportRows = useMemo(() => normalizedUsers.map((user) => ({ email: user.email, role: user.role, joined: user.created_at, id: user.id })), [normalizedUsers]);
  const queryClient = useQueryClient();
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [bulkRole, setBulkRole] = useState<'user' | 'moderator' | 'admin'>('moderator');

  interface UserListPage {
    users: User[];
    total: number;
    page?: number;
    has_more?: boolean;
  }

  const userListCache = useMemo(
    () =>
      createEntityListCache<UserListPage, User>({
        queryClient,
        queryKey: ['users', searchTerm],
        getItems: (page) => page.users,
        setItems: (page, users) => ({ ...page, users }),
      }),
    [queryClient, searchTerm]
  );

  const bulkDelete = useBulkDelete({
    noun: 'users',
    deleteOne: (id) => api.delete(`/users/${id}`),
    list: userListCache,
    refetch,
  });

  const deleteSelected = async () => {
    if (await bulkDelete.run(new Set(bulk.selectedIds))) {
      bulk.clearSelection();
    }
  };

  const changeSelectedRole = async () => {
    if (!bulk.selectedCount) return;
    try {
      const results = await Promise.allSettled([...bulk.selectedIds].map((id) => api.put(`/users/${id}`, { role: bulkRole })));
      const failed = results.filter((result) => result.status === 'rejected').length;
      if (failed > 0) {
        alert(`${failed} of ${results.length} role changes failed. The list has been refreshed.`);
      }
      bulk.clearSelection();
      setRoleDialogOpen(false);
    } finally {
      await refetch();
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/users', formData);
      setIsCreateDialogOpen(false);
      setFormData({ email: '', password: '', role: 'user' });
      refetch();
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUserClick = (user: User) => {
    setEditingUserId(user.id);
    setFormData({
      email: user.email,
      password: '', // Leave empty to not update password unless typed
      role: user.role,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId) return;
    
    setIsSubmitting(true);
    try {
      const payload: { role: User['role']; password?: string } = { role: formData.role };
      if (formData.password) {
        payload.password = formData.password;
      }
      
      await api.put(`/users/${editingUserId}`, payload);
      setIsEditDialogOpen(false);
      setEditingUserId(null);
      setFormData({ email: '', password: '', role: 'user' });
      refetch();
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const approved = await confirm({
      title: 'Remove this user?',
      undoable: true,
      confirmLabel: 'Remove',
      variant: 'destructive',
    });
    if (!approved) return;
    userListCache.remove(new Set([userId]));
    scheduleUndoableOperation({
      label: 'User deleted',
      cancel: () => void refetch(),
      commit: async () => {
        try {
          await api.delete(`/users/${userId}`);
        } catch (error: unknown) {
          alert(error instanceof Error ? error.message : 'Failed to delete user');
        }
        await refetch();
      },
    });
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 border border-red-200">
            <ShieldAlert size={12} /> Administrator
          </span>
        );
      case 'moderator':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-brand-100 text-brand-700 border border-brand-200 dark:bg-brand-900/40 dark:text-brand-300 dark:border-brand-700/50">
            <Shield size={12} /> Event Manager
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 border border-gray-200">
            <UsersIcon size={12} /> Standard Client
          </span>
        );
    }
  };

  const stats = [
    { label: 'Total Accounts', value: normalizedUsers.length, color: 'text-gray-900' },
    { label: 'Administrators', value: normalizedUsers.filter(u => u.role === 'admin').length, color: 'text-red-700' },
    { label: 'Event Managers', value: normalizedUsers.filter(u => u.role === 'moderator').length, color: 'text-[#8b9172]' },
    { label: 'Standard Clients', value: normalizedUsers.filter(u => u.role === 'user').length, color: 'text-gray-600' },
  ];

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Access management"
        title="User Management"
        description="Control system access, team roles, and client accounts."
        actions={<Button onClick={() => setIsCreateDialogOpen(true)} className="w-full bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-brand transition hover:shadow-brand-lg hover:brightness-105 sm:w-auto"><Plus className="mr-2 h-4 w-4" />Add New User</Button>}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="glass card-hover relative overflow-hidden">
            <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-400 via-brand-500 to-gold-400" aria-hidden="true" />
            <CardContent className="pt-7">
              <div className={`text-3xl font-bold font-serif mb-1 ${stat.color}`}>{stat.value}</div>
              <div className="text-sm text-gray-500 font-medium uppercase tracking-wider dark:text-gray-400">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="glass overflow-hidden">
        <CardHeader className="border-b border-gray-200/60 pb-4 dark:border-white/10">
          <CardTitle className="font-serif text-xl">Directory</CardTitle>
          <div className="flex items-center gap-4 mt-4">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by email address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
              <TableSkeleton rows={6} columns={4} />
            ) : isError ? (
              <div className="p-4">
                <EmptyState
                  title="Could not load users"
                  description="The directory request failed. Check your connection and try again."
                  actionLabel="Retry"
                  onAction={() => void refetch()}
                />
              </div>
            ) : (
            <div className="overflow-x-auto">
              <div className="sr-only" aria-live="polite">{normalizedUsers.length} users found</div>
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow>
                    <TableHead className="pl-6 w-10"><input type="checkbox" aria-label="Select all users" checked={bulk.allSelected} onChange={bulk.toggleAll} /></TableHead>
                    <TableHead className="pl-6 w-[350px]">Account</TableHead>
                    <TableHead>System Role</TableHead>
                    <TableHead>Joined Date</TableHead>
                    <TableHead className="text-right pr-6">Management</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {normalizedUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10"><EmptyState title="No users found" description={searchTerm ? 'Try a different email search.' : 'Add a user to get started.'} actionLabel={searchTerm ? 'Clear search' : 'Add user'} onAction={() => searchTerm ? setSearchTerm('') : setIsCreateDialogOpen(true)} /></TableCell>
                    </TableRow>
                  ) : (
                    normalizedUsers.map((user) => (
                      <TableRow key={user.id} className="hover:bg-gray-50/30">
                        <TableCell className="pl-6"><input type="checkbox" aria-label={`Select user ${user.email}`} checked={bulk.isSelected(user.id)} onChange={() => bulk.toggleSelection(user.id)} /></TableCell>
                        <TableCell className="pl-6">
                          <div className="flex items-center gap-3">
                            <Avatar name={user.email} />
                            <div>
                              <div className="font-medium text-gray-900" dangerouslySetInnerHTML={{ __html: highlightText(user.email, searchTerm) }} />
                              <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                <Key size={10} /> ID: {user.id.substring(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getRoleBadge(user.role)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {format(new Date(user.created_at), 'MMM dd, yyyy')}
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditUserClick(user)}
                              className="h-8 border-border/50 text-gray-600 hover:text-[#8b9172] hover:bg-[#8b9172]/5 hover:border-[#8b9172]/30"
                            >
                              <Edit className="w-4 h-4 mr-1.5" /> Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteUser(user.id)}
                              className="h-8 border-border/50 text-gray-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <InfiniteScrollFooter sentinelRef={sentinelRef} isFetchingNextPage={isFetchingNextPage} hasNextPage={Boolean(hasNextPage)} hasItems={normalizedUsers.length > 0} loadingLabel="Loading more users…" endLabel="No more users" />
            </div>
          )}
        </CardContent>
      </Card>

      <BulkActionBar count={bulk.selectedCount} onSecondary={() => setRoleDialogOpen(true)} secondaryLabel="Change role" onExport={() => setExportOpen(true)} onDelete={() => void deleteSelected()} />
      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} rows={exportRows} filename="olive-garden-users.csv" />
      <ProgressModal open={bulkDelete.progress?.open ?? false} progress={bulkDelete.progress?.progress ?? 0} label={bulkDelete.progress?.label ?? ''} onCancel={bulkDelete.cancel} />

      {/* Change Role Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Change Role</DialogTitle>
            <DialogDescription className="font-light">
              Update the access level for {bulk.selectedCount} selected account{bulk.selectedCount === 1 ? '' : 's'}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2.5">
              <Label htmlFor="bulk-role" className="text-gray-700">Access Level</Label>
              <Select value={bulkRole} onValueChange={(value) => setBulkRole(value as 'user' | 'moderator' | 'admin')}>
                <SelectTrigger id="bulk-role" className="h-11 border-gray-200 focus:border-[#8b9172] focus:ring-[#8b9172]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Standard Client</SelectItem>
                  <SelectItem value="moderator">Event Manager</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setRoleDialogOpen(false)} className="w-full sm:w-auto h-11">Cancel</Button>
            <Button type="button" onClick={() => void changeSelectedRole()} className="w-full sm:w-auto h-11 bg-[#8b9172] hover:bg-[#6a7051] text-white">Apply Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
        if (!isSubmitting) setIsCreateDialogOpen(open);
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Invite New User</DialogTitle>
            <DialogDescription className="font-light">
              Add a new staff member or client to the Olive Garden portal.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser}>
            <div className="space-y-5 py-4">
              <div className="space-y-2.5">
                <Label htmlFor="create-email" className="text-gray-700">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="create-email"
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="pl-9 h-11 border-gray-200 focus:border-[#8b9172] focus:ring-[#8b9172]"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="create-password" className="text-gray-700">Temporary Password</Label>
                <Input
                  id="create-password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="h-11 border-gray-200 focus:border-[#8b9172] focus:ring-[#8b9172]"
                  required
                  disabled={isSubmitting}
                  minLength={6}
                />
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="create-role" className="text-gray-700">Access Level</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData({ ...formData, role: value as User['role'] })
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="create-role" className="h-11 border-gray-200 focus:border-[#8b9172] focus:ring-[#8b9172]">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Standard Client</SelectItem>
                    <SelectItem value="moderator">Event Manager</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="pt-4 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                className="w-full sm:w-auto h-11"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto h-11 bg-[#8b9172] hover:bg-[#6a7051] text-white">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Inviting...
                  </>
                ) : (
                  'Send Invitation'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        if (!isSubmitting) setIsEditDialogOpen(open);
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Modify Access Level</DialogTitle>
            <DialogDescription className="font-light">
              Update the system permissions for this account.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateUser}>
            <div className="space-y-5 py-4">
              <div className="space-y-2.5">
                <Label className="text-gray-700">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input value={formData.email} disabled className="pl-9 h-11 bg-gray-50 border-gray-200 text-gray-500" />
                </div>
                <p className="text-xs text-gray-500 font-light mt-1">Email addresses cannot be changed once set.</p>
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="edit-password" className="text-gray-700">New Password (Optional)</Label>
                <Input
                  id="edit-password"
                  type="password"
                  placeholder="Leave blank to keep current"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="h-11 border-gray-200 focus:border-[#8b9172] focus:ring-[#8b9172]"
                  disabled={isSubmitting}
                  minLength={6}
                />
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="edit-role" className="text-gray-700">Access Level</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData({ ...formData, role: value as User['role'] })
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="edit-role" className="h-11 border-gray-200 focus:border-[#8b9172] focus:ring-[#8b9172]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Standard Client</SelectItem>
                    <SelectItem value="moderator">Event Manager</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="pt-4 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="w-full sm:w-auto h-11"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto h-11 bg-[#8b9172] hover:bg-[#6a7051] text-white">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
