import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// This is a generic user type. The fields returned by get_users_by_role.
// We might need to adjust this if different roles return different fields.
type User = {
    id: string;
    full_name: string | null;
    wallet_address: string | null;
    created_at: string;
};

const initialNewUserState = {
    email: "",
    password: "",
    confirmPassword: "",
    full_name: "",
};

interface ManageUsersProps {
    role: 'player' | 'brand' | 'creator';
    title: string;
}

const ManageUsers: React.FC<ManageUsersProps> = ({ role, title }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [newUser, setNewUser] = useState(initialNewUserState);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_users_by_role', { role_name: role });
            if (error) throw error;
            setUsers(data || []);
        } catch (error: any) {
            toast.error(`Failed to fetch ${role}s`, { description: error.message });
        } finally {
            setLoading(false);
        }
    }, [role]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleEditClick = (user: User) => {
        setEditingUser({ ...user });
        setIsEditDialogOpen(true);
    };

    const handleUpdateUser = async () => {
        if (!editingUser) return;
        try {
            // Note: This updates the profiles table. The function get_users_by_role joins
            // auth.users with profiles. The `id` from that function is the `user_id`.
            const { error } = await supabase
                .from('profiles')
                .update({ 
                    full_name: editingUser.full_name,
                    wallet_address: editingUser.wallet_address,
                 })
                .eq('user_id', editingUser.id);

            if (error) throw error;
            toast.success(`${title.slice(0, -1)} updated successfully`);
            setIsEditDialogOpen(false);
            fetchUsers();
        } catch (error: any) {
            toast.error(`Failed to update ${role}`, { description: error.message });
        }
    };
    
    const handleDeleteUser = (user: User) => {
        toast.info(`Delete functionality for ${user.full_name} is not implemented yet.`);
    };

    const handleAddUser = async () => {
        if (newUser.password !== newUser.confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        try {
            const { error } = await supabase.functions.invoke('create-user', {
                body: { ...newUser, role },
            });

            if (error) throw error;

            toast.success(`${title.slice(0, -1)} created successfully!`);
            setIsAddDialogOpen(false);
            setNewUser(initialNewUserState);
            fetchUsers();
        } catch (error: any) {
            toast.error(`Failed to create ${role}`, { description: error.message });
        }
    };

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">{title}</h1>
                <Button onClick={() => setIsAddDialogOpen(true)}>Add {title.slice(0, -1)}</Button>
            </div>
            <Card className="p-6">
                {loading ? (
                    <p>Loading {role}s...</p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Full Name</TableHead>
                                <TableHead>Wallet Address</TableHead>
                                <TableHead>Joined On</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>{user.full_name}</TableCell>
                                    <TableCell>{user.wallet_address}</TableCell>
                                    <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell className="space-x-2">
                                        <Button variant="outline" size="sm" onClick={() => handleEditClick(user)}>Edit</Button>
                                        <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(user)}>Delete</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Card>

            {/* Edit User Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Edit {title.slice(0, -1)}</DialogTitle></DialogHeader>
                    {editingUser && (
                        <div className="space-y-4 py-4">
                            <div>
                                <Label htmlFor="edit-fullname">Full Name</Label>
                                <Input id="edit-fullname" value={editingUser.full_name || ''} onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })} />
                            </div>
                            <div>
                                <Label htmlFor="edit-wallet">Wallet Address</Label>
                                <Input id="edit-wallet" value={editingUser.wallet_address || ''} onChange={(e) => setEditingUser({ ...editingUser, wallet_address: e.target.value })} />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                        <Button onClick={handleUpdateUser}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add User Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Add New {title.slice(0, -1)}</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label htmlFor="new-email">Email</Label>
                            <Input id="new-email" type="email" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} />
                        </div>
                        <div>
                            <Label htmlFor="new-password">Password</Label>
                            <Input id="new-password" type="password" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} />
                        </div>
                        <div>
                            <Label htmlFor="confirm-password">Confirm Password</Label>
                            <Input id="confirm-password" type="password" value={newUser.confirmPassword} onChange={(e) => setNewUser({...newUser, confirmPassword: e.target.value})} />
                        </div>
                        <div>
                            <Label htmlFor="new-fullname">Full Name</Label>
                            <Input id="new-fullname" value={newUser.full_name} onChange={(e) => setNewUser({...newUser, full_name: e.target.value})} />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                        <Button onClick={handleAddUser}>Create {title.slice(0, -1)}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default ManageUsers;
