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

type Brand = {
    id: string;
    full_name: string | null;
    wallet_address: string | null;
    created_at: string;
};

const initialNewBrandState = {
    email: "",
    password: "",
    confirmPassword: "",
    full_name: "",
    role: "brand",
};

const ManageBrands = () => {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [newBrand, setNewBrand] = useState(initialNewBrandState);

    const fetchBrands = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_users_by_role', { role_name: 'brand' });
            if (error) throw error;
            setBrands(data || []);
        } catch (error: any) {
            toast.error("Failed to fetch brands", { description: error.message });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBrands();
    }, [fetchBrands]);

    const handleEditClick = (brand: Brand) => {
        setEditingBrand({ ...brand });
        setIsEditDialogOpen(true);
    };

    const handleUpdateBrand = async () => {
        if (!editingBrand) return;
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ 
                    full_name: editingBrand.full_name,
                    wallet_address: editingBrand.wallet_address,
                 })
                .eq('user_id', editingBrand.id);

            if (error) throw error;
            toast.success("Brand updated successfully");
            setIsEditDialogOpen(false);
            fetchBrands();
        } catch (error: any) {
            toast.error("Failed to update brand", { description: error.message });
        }
    };
    
    const handleDeleteBrand = (brand: Brand) => {
        toast.info(`Delete functionality for ${brand.full_name} is not implemented yet.`);
    };

    const handleAddBrand = async () => {
        if (newBrand.password !== newBrand.confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        try {
            const { error } = await supabase.functions.invoke('create-user', {
                body: { ...newBrand },
            });

            if (error) throw error;

            toast.success("Brand created successfully!");
            setIsAddDialogOpen(false);
            setNewBrand(initialNewBrandState);
            fetchBrands();
        } catch (error: any) {
            toast.error("Failed to create brand", { description: error.message });
        }
    };

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Manage Brands</h1>
                <Button onClick={() => setIsAddDialogOpen(true)}>Add Brand</Button>
            </div>
            <Card className="p-6">
                {loading ? (
                    <p>Loading brands...</p>
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
                            {brands.map((brand) => (
                                <TableRow key={brand.id}>
                                    <TableCell>{brand.full_name}</TableCell>
                                    <TableCell>{brand.wallet_address}</TableCell>
                                    <TableCell>{new Date(brand.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell className="space-x-2">
                                        <Button variant="outline" size="sm" onClick={() => handleEditClick(brand)}>Edit</Button>
                                        <Button variant="destructive" size="sm" onClick={() => handleDeleteBrand(brand)}>Delete</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Card>

            {/* Edit Brand Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Edit Brand</DialogTitle></DialogHeader>
                    {editingBrand && (
                        <div className="space-y-4 py-4">
                            <div>
                                <Label htmlFor="edit-fullname">Full Name</Label>
                                <Input id="edit-fullname" value={editingBrand.full_name || ''} onChange={(e) => setEditingBrand({ ...editingBrand, full_name: e.target.value })} />
                            </div>
                            <div>
                                <Label htmlFor="edit-wallet">Wallet Address</Label>
                                <Input id="edit-wallet" value={editingBrand.wallet_address || ''} onChange={(e) => setEditingBrand({ ...editingBrand, wallet_address: e.target.value })} />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                        <Button onClick={handleUpdateBrand}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Brand Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Add New Brand</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label htmlFor="new-email">Email</Label>
                            <Input id="new-email" type="email" value={newBrand.email} onChange={(e) => setNewBrand({...newBrand, email: e.target.value})} />
                        </div>
                        <div>
                            <Label htmlFor="new-password">Password</Label>
                            <Input id="new-password" type="password" value={newBrand.password} onChange={(e) => setNewBrand({...newBrand, password: e.target.value})} />
                        </div>
                        <div>
                            <Label htmlFor="confirm-password">Confirm Password</Label>
                            <Input id="confirm-password" type="password" value={newBrand.confirmPassword} onChange={(e) => setNewBrand({...newBrand, confirmPassword: e.target.value})} />
                        </div>
                        <div>
                            <Label htmlFor="new-fullname">Full Name</Label>
                            <Input id="new-fullname" value={newBrand.full_name} onChange={(e) => setNewBrand({...newBrand, full_name: e.target.value})} />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                        <Button onClick={handleAddBrand}>Create Brand</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default ManageBrands;