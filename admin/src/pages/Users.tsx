import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, Users as UsersIcon, Shield, ShieldAlert, Mail, Calendar, Key } from 'lucide-react';
import api from '@/lib/api';
import type { User, ApiResponse } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

export default function Users() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'user' as 'user' | 'admin' | 'moderator',
  });

  const { data: usersData, isLoading, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        const response = await api.get<ApiResponse<User[]>>('/users');
        return response.data.data;
      } catch (error) {
        console.error("Failed to fetch users:", error);
        // Fallback to dummy data for preview purposes if API fails
        return [
          { id: '1', email: 'admin@olivegarden.com', role: 'admin', created_at: new Date().toISOString() },
          { id: '2', email: 'sarah.njiru@olivegarden.com', role: 'moderator', created_at: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString() },
          { id: '3', email: 'j.kamau@techcorp.co.ke', role: 'user', created_at: new Date(new Date().setDate(new Date().getDate() - 12)).toISOString() },
          { id: '4', email: 'grace@leadership.org', role: 'user', created_at: new Date(new Date().setDate(new Date().getDate() - 25)).toISOString() },
        ] as User[];
      }
    },
  });

  const filteredUsers = usersData?.filter((user) =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', formData);
      setIsCreateDialogOpen(false);
      setFormData({ email: '', password: '', role: 'user' });
      refetch();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create user');
    }
  };

  const handleEditUser = (user: User) => {
    setFormData({
      email: user.email,
      password: '',
      role: user.role,
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this user from the system?')) return;
    
    try {
      await api.delete(`/users/${userId}`);
      refetch();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete user');
    }
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-[#8b9172]/20 text-[#6a7051] border border-[#8b9172]/30">
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
    { label: 'Total Accounts', value: usersData?.length || 0, color: 'text-gray-900' },
    { label: 'Administrators', value: usersData?.filter(u => u.role === 'admin').length || 0, color: 'text-red-700' },
    { label: 'Event Managers', value: usersData?.filter(u => u.role === 'moderator').length || 0, color: 'text-[#8b9172]' },
    { label: 'Standard Clients', value: usersData?.filter(u => u.role === 'user').length || 0, color: 'text-gray-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2 font-light">Control system access, team roles, and client accounts</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-[#8b9172] hover:bg-[#6a7051] text-white w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Add New User
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="border-border/50 shadow-sm">
            <CardContent className="pt-6">
              <div className={`text-3xl font-bold font-serif mb-1 ${stat.color}`}>{stat.value}</div>
              <div className="text-sm text-gray-500 font-medium uppercase tracking-wider">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="border-b border-border/50 pb-4">
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
            <div className="text-center py-16">
              <div className="w-12 h-12 border-4 border-[#8b9172]/30 border-t-[#8b9172] rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500 font-light">Loading user directory...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow>
                    <TableHead className="pl-6 w-[350px]">Account</TableHead>
                    <TableHead>System Role</TableHead>
                    <TableHead>Joined Date</TableHead>
                    <TableHead className="text-right pr-6">Management</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10 text-gray-500 font-light">
                        No users found matching your search.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers?.map((user) => (
                      <TableRow key={user.id} className="hover:bg-gray-50/30">
                        <TableCell className="pl-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-medium border border-gray-200">
                              {user.email.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{user.email}</div>
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
                              onClick={() => handleEditUser(user)}
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
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
                <Label htmlFor="email" className="text-gray-700">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="pl-9 h-11 border-gray-200 focus:border-[#8b9172] focus:ring-[#8b9172]"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="password" className="text-gray-700">Temporary Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="h-11 border-gray-200 focus:border-[#8b9172] focus:ring-[#8b9172]"
                  required
                />
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="role" className="text-gray-700">Access Level</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger className="h-11 border-gray-200 focus:border-[#8b9172] focus:ring-[#8b9172]">
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
              >
                Cancel
              </Button>
              <Button type="submit" className="w-full sm:w-auto h-11 bg-[#8b9172] hover:bg-[#6a7051] text-white">
                Send Invitation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Modify Access Level</DialogTitle>
            <DialogDescription className="font-light">
              Update the system permissions for this account.
            </DialogDescription>
          </DialogHeader>
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
              <Label htmlFor="edit-role" className="text-gray-700">Access Level</Label>
              <Select
                value={formData.role}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger className="h-11 border-gray-200 focus:border-[#8b9172] focus:ring-[#8b9172]">
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
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="w-full sm:w-auto h-11"
            >
              Cancel
            </Button>
            <Button onClick={() => setIsEditDialogOpen(false)} className="w-full sm:w-auto h-11 bg-[#8b9172] hover:bg-[#6a7051] text-white">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
