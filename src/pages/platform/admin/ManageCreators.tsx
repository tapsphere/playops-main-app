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

type Creator = {
    id: string;
    full_name: string | null;
    wallet_address: string | null;
    created_at: string;
};

const initialNewCreatorState = {
    email: "",
    password: "",
    confirmPassword: "",
    full_name: "",
    role: "creator",
};

const ManageCreators = () => {
    const [creators, setCreators] = useState<Creator[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingCreator, setEditingCreator] = useState<Creator | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [newCreator, setNewCreator] = useState(initialNewCreatorState);

    const fetchCreators = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_users_by_role', { role_name: 'creator' });
            if (error) throw error;
            setCreators(data || []);
        } catch (error: any) {
            toast.error("Failed to fetch creators", { description: error.message });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCreators();
    }, [fetchCreators]);

    const handleEditClick = (creator: Creator) => {
        setEditingCreator({ ...creator });
        setIsEditDialogOpen(true);
    };

    const handleUpdateCreator = async () => {
        if (!editingCreator) return;
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ 
                    full_name: editingCreator.full_name,
                    wallet_address: editingCreator.wallet_address,
                 })
                .eq('user_id', editingCreator.id);

            if (error) throw error;
            toast.success("Creator updated successfully");
            setIsEditDialogOpen(false);
            fetchCreators();
        } catch (error: any) {
            toast.error("Failed to update creator", { description: error.message });
        }
    };
    
    const handleDeleteCreator = (creator: Creator) => {
        toast.info(`Delete functionality for ${creator.full_name} is not implemented yet.`);
    };

    const handleAddCreator = async () => {
        if (newCreator.password !== newCreator.confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        try {
            const { error } = await supabase.functions.invoke('create-user', {
                body: { ...newCreator },
            });

            if (error) throw error;

            toast.success("Creator created successfully!");
            setIsAddDialogOpen(false);
            setNewCreator(initialNewCreatorState);
            fetchCreators();
        } catch (error: any) {
            toast.error("Failed to create creator", { description: error.message });
        }
    };

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Manage Creators</h1>
                <Button onClick={() => setIsAddDialogOpen(true)}>Add Creator</Button>
            </div>
            <Card className="p-6">
                {loading ? (
                    <p>Loading creators...</p>
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
                            {creators.map((creator) => (
                                <TableRow key={creator.id}>
                                    <TableCell>{creator.full_name}</TableCell>
                                    <TableCell>{creator.wallet_address}</TableCell>
                                    <TableCell>{new Date(creator.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell className="space-x-2">
                                        <Button variant="outline" size="sm" onClick={() => handleEditClick(creator)}>Edit</Button>
                                        <Button variant="destructive" size="sm" onClick={() => handleDeleteCreator(creator)}>Delete</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Card>

            {/* Edit Creator Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Edit Creator</DialogTitle></DialogHeader>
                    {editingCreator && (
                        <div className="space-y-4 py-4">
                            <div>
                                <Label htmlFor="edit-fullname">Full Name</Label>
                                <Input id="edit-fullname" value={editingCreator.full_name || ''} onChange={(e) => setEditingCreator({ ...editingCreator, full_name: e.target.value })} />
                            </div>
                            <div>
                                <Label htmlFor="edit-wallet">Wallet Address</Label>
                                <Input id="edit-wallet" value={editingCreator.wallet_address || ''} onChange={(e) => setEditingCreator({ ...editingCreator, wallet_address: e.target.value })} />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                        <Button onClick={handleUpdateCreator}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Creator Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Add New Creator</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label htmlFor="new-email">Email</Label>
                            <Input id="new-email" type="email" value={newCreator.email} onChange={(e) => setNewCreator({...newCreator, email: e.target.value})} />
                        </div>
                        <div>
                            <Label htmlFor="new-password">Password</Label>
                            <Input id="new-password" type="password" value={newCreator.password} onChange={(e) => setNewCreator({...newCreator, password: e.target.value})} />
                        </div>
                        <div>
                            <Label htmlFor="confirm-password">Confirm Password</Label>
                            <Input id="confirm-password" type="password" value={newCreator.confirmPassword} onChange={(e) => setNewCreator({...newCreator, confirmPassword: e.target.value})} />
                        </div>
                        <div>
                            <Label htmlFor="new-fullname">Full Name</Label>
                            <Input id="new-fullname" value={newCreator.full_name} onChange={(e) => setNewCreator({...newCreator, full_name: e.target.value})} />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                        <Button onClick={handleAddCreator}>Create Creator</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default ManageCreators;