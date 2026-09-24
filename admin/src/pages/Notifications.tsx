import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { Bell, Check, Trash2, Filter, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import api from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import type { Notification, NotificationStats, NotificationType } from '@/types/notification';
import type { ApiResponse } from '@/types';
import BulkActionBar from '@/components/BulkActionBar';
import EmptyState from '@/components/EmptyState';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import { TableSkeleton } from '@/components/ui/skeleton';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useBulkDelete } from '@/hooks/useBulkDelete';
import { createEntityListCache } from '@/lib/entityListCache';
import ProgressModal from '@/components/ProgressModal';
import PageIntro from '@/components/PageIntro';

const priorityConfig = {
  low: { label: 'Low', color: 'text-gray-600', bg: 'bg-gray-100', icon: Info },
  medium: { label: 'Medium', color: 'text-blue-600', bg: 'bg-blue-100', icon: Bell },
  high: { label: 'High', color: 'text-orange-600', bg: 'bg-orange-100', icon: AlertTriangle },
  urgent: { label: 'Urgent', color: 'text-red-600', bg: 'bg-red-100', icon: AlertCircle },
};

const typeLabels: Record<NotificationType, string> = {
  booking_created: 'Booking Created',
  booking_updated: 'Booking Updated',
  booking_confirmed: 'Booking Confirmed',
  booking_cancelled: 'Booking Cancelled',
  booking_completed: 'Booking Completed',
  payment_received: 'Payment Received',
  payment_pending: 'Payment Pending',
  user_created: 'User Created',
  user_updated: 'User Updated',
  user_deleted: 'User Deleted',
  gallery_upload: 'Gallery Upload',
  gallery_deleted: 'Gallery Deleted',
  inquiry_received: 'New Inquiry',
  system_alert: 'System Alert',
  admin_action: 'Admin Action',
};

export default function Notifications() {
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [readFilter, setReadFilter] = useState<string>('unread');

  // Fetch notifications
  const { data: notificationsData, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['notifications', 'all', typeFilter, priorityFilter, readFilter],
    queryFn: async ({ pageParam }) => {
      const params: Record<string, string | number | boolean | undefined> = {};
      if (typeFilter !== 'all') params.type = typeFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;
      if (readFilter !== 'all') params.is_read = readFilter === 'read';
      params.page = pageParam;
      params.limit = 25;
      
      const response = await api.get<ApiResponse<{ notifications: Notification[]; total: number }>>('/notifications', { params });
      return response.data.data as { notifications: Notification[]; total: number; page: number; has_more: boolean };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.has_more ? lastPage.page + 1 : undefined,
  });

  // Fetch stats
  const { data: statsData } = useQuery({
    queryKey: ['notifications', 'stats'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<NotificationStats>>('/notifications/stats');
      return response.data.data;
    },
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await api.patch(`/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await api.patch('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await api.delete(`/notifications/${notificationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const notifications = notificationsData?.pages.flatMap((page) => page.notifications) || [];
  const { sentinelRef } = useInfiniteScroll(() => { void fetchNextPage(); }, Boolean(hasNextPage), isFetchingNextPage);
  const stats = statsData || { total: 0, unread: 0, by_type: [], by_priority: [] };
  const bulk = useBulkSelection(notifications);

  interface NotificationListPage {
    notifications: Notification[];
    total: number;
    page?: number;
    has_more?: boolean;
  }

  const notificationListCache = useMemo(
    () =>
      createEntityListCache<NotificationListPage, Notification>({
        queryClient,
        queryKey: ['notifications', 'all', typeFilter, priorityFilter, readFilter],
        getItems: (page) => page.notifications,
        setItems: (page, notifications) => ({ ...page, notifications }),
      }),
    [queryClient, typeFilter, priorityFilter, readFilter]
  );

  const bulkDelete = useBulkDelete({
    noun: 'notifications',
    list: notificationListCache,
    deleteOne: (id) => api.delete(`/notifications/${id}`),
    refetch: () => { void queryClient.invalidateQueries({ queryKey: ['notifications'] }); },
    undoable: false,
  });

  const bulkMarkRead = async () => {
    await Promise.all([...bulk.selectedIds].map((id) => api.patch(`/notifications/${id}/read`)));
    bulk.clearSelection();
    await queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };
  const handleBulkDelete = async () => {
    if (await bulkDelete.run(new Set(bulk.selectedIds))) {
      bulk.clearSelection();
    }
  };

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="System activity"
        title="Notifications"
        description="Manage and review alerts, updates, and operational activity."
        actions={stats.unread > 0 ? (
          <Button onClick={() => markAllAsReadMutation.mutate()}>
            <Check className="h-4 w-4 mr-2" />
            Mark All as Read
          </Button>
        ) : undefined}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Unread</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.unread}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">High Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {stats.by_priority.find(p => p.priority === 'high')?.count || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Urgent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {stats.by_priority.find(p => p.priority === 'urgent')?.count || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
              <Select value={readFilter} onValueChange={setReadFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Priority</label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="booking_created">Booking Created</SelectItem>
                  <SelectItem value="booking_confirmed">Booking Confirmed</SelectItem>
                  <SelectItem value="booking_cancelled">Booking Cancelled</SelectItem>
                  <SelectItem value="inquiry_received">New Inquiry</SelectItem>
                  <SelectItem value="user_created">User Created</SelectItem>
                  <SelectItem value="gallery_upload">Gallery Upload</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>All Notifications</CardTitle>
          <CardDescription>
            {notifications.length} notification{notifications.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton rows={5} columns={3} />
          ) : notifications.length === 0 ? (
            <EmptyState title="You're all caught up" description="No notifications match the current filters." actionLabel="Clear filters" onAction={() => { setTypeFilter('all'); setPriorityFilter('all'); setReadFilter('all'); }} />
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2"><input type="checkbox" aria-label="Select all notifications" checked={bulk.allSelected} onChange={bulk.toggleAll} /><span className="text-sm text-gray-500">Select all</span></div>
              {notifications.map((notification: Notification) => {
                const config = priorityConfig[notification.priority];
                const Icon = config.icon;
                
                return (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      notification.is_read
                        ? 'border-gray-200 bg-white'
                        : 'border-[#8b9172] bg-[#8b9172]/5'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <input type="checkbox" aria-label={`Select notification ${notification.title}`} checked={bulk.isSelected(notification.id)} onChange={() => bulk.toggleSelection(notification.id)} className="mt-3" />
                      <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center`}>
                        <Icon className={`h-5 w-5 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color} mt-1`}>
                              {config.label}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            {!notification.is_read && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => markAsReadMutation.mutate(notification.id)}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Mark Read
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => deleteNotificationMutation.mutate(notification.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-gray-700 mb-2">{notification.message}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="font-medium">{typeLabels[notification.type]}</span>
                          <span>•</span>
                          <span>{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}</span>
                          {notification.resource_type && (
                            <>
                              <span>•</span>
                              <span className="capitalize">{notification.resource_type}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={sentinelRef} className="h-8" aria-hidden="true" />
              {isFetchingNextPage && <p className="py-3 text-center text-sm text-gray-500" role="status">Loading more notifications…</p>}
              {!hasNextPage && notifications.length > 0 && <p className="py-3 text-center text-sm text-gray-400">No more notifications</p>}
            </div>
          )}
        </CardContent>
      </Card>
      <BulkActionBar count={bulk.selectedCount} onSecondary={() => void bulkMarkRead()} secondaryLabel="Mark as read" onDelete={() => void handleBulkDelete()} />
      <ProgressModal open={bulkDelete.progress?.open ?? false} progress={bulkDelete.progress?.progress ?? 0} label={bulkDelete.progress?.label ?? ''} onCancel={bulkDelete.cancel} />
    </div>
  );
}
