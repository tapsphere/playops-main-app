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
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type Profile = {
    id: string;
    user_id: string;
    full_name: string | null;
    location: string | null;
    bio: string | null;
    created_at: string;
    wallet_address: string | null;
};

const initialNewProfileState = {
    email: "",
    password: "",
    confirmPassword: "",
    full_name: "",
    role: "player",
};

const ManagePlayers = () => {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [newProfile, setNewProfile] = useState(initialNewProfileState);

    const fetchProfiles = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('profiles').select('*');
            if (error) throw error;
            setProfiles(data || []);
        } catch (error: any) {
            toast.error("Failed to fetch profiles", { description: error.message });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfiles();
    }, [fetchProfiles]);

    const handleEditClick = (profile: Profile) => {
        setEditingProfile({ ...profile });
        setIsEditDialogOpen(true);
    };

    const handleUpdateProfile = async () => {
        if (!editingProfile) return;
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: editingProfile.full_name,
                    wallet_address: editingProfile.wallet_address,
                    location: editingProfile.location,
                    bio: editingProfile.bio,
                })
                .eq('id', editingProfile.id);
            if (error) throw error;
            toast.success("Profile updated successfully");
            setIsEditDialogOpen(false);
            fetchProfiles();
        } catch (error: any) {
            toast.error("Failed to update profile", { description: error.message });
        }
    };
    
    const handleDeleteProfile = (profile: Profile) => {
        toast.info(`Delete functionality for ${profile.full_name} is not implemented yet.`);
    };

    const handleAddProfile = async () => {
        if (newProfile.password !== newProfile.confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        try {
            const { error } = await supabase.functions.invoke('create-user', {
                body: { ...newProfile },
            });

            if (error) throw error;

            toast.success("Profile created successfully!");
            setIsAddDialogOpen(false);
            setNewProfile(initialNewProfileState);
            fetchProfiles();
        } catch (error: any) {
            toast.error("Failed to create profile", { description: error.message });
        }
    };

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Manage Profiles</h1>
                <Button onClick={() => setIsAddDialogOpen(true)}>Add Profile</Button>
            </div>
            <Card className="p-6">
                {loading ? (
                    <p>Loading profiles...</p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>full_name</TableHead>
                                <TableHead>wallet_address</TableHead>
                                <TableHead>location</TableHead>
                                <TableHead>bio</TableHead>
                                <TableHead>created_at</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {profiles.map((profile) => (
                                <TableRow key={profile.id}>
                                    <TableCell>{profile.full_name}</TableCell>
                                    <TableCell>{profile.wallet_address}</TableCell>
                                    <TableCell>{profile.location}</TableCell>
                                    <TableCell className="max-w-xs truncate">{profile.bio}</TableCell>
                                    <TableCell>{new Date(profile.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell className="space-x-2">
                                        <Button variant="outline" size="sm" onClick={() => handleEditClick(profile)}>Edit</Button>
                                        <Button variant="destructive" size="sm" onClick={() => handleDeleteProfile(profile)}>Delete</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Card>

            {/* Edit Profile Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Edit Profile</DialogTitle></DialogHeader>
                    {editingProfile && (
                        <div className="space-y-4 py-4">
                            <div>
                                <Label htmlFor="fullName">full_name</Label>
                                <Input id="fullName" value={editingProfile.full_name || ''} onChange={(e) => setEditingProfile({ ...editingProfile, full_name: e.target.value })} />
                            </div>
                            <div>
                                <Label htmlFor="walletAddress">wallet_address</Label>
                                <Input id="walletAddress" value={editingProfile.wallet_address || ''} onChange={(e) => setEditingProfile({ ...editingProfile, wallet_address: e.target.value })} />
                            </div>
                            <div>
                                <Label htmlFor="location">location</Label>
                                <Input id="location" value={editingProfile.location || ''} onChange={(e) => setEditingProfile({ ...editingProfile, location: e.target.value })} />
                            </div>
                            <div>
                                <Label htmlFor="bio">bio</Label>
                                <Textarea id="bio" value={editingProfile.bio || ''} onChange={(e) => setEditingProfile({ ...editingProfile, bio: e.target.value })} />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                        <Button onClick={handleUpdateProfile}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Profile Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Add New Profile</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label htmlFor="new-email">Email</Label>
                            <Input id="new-email" type="email" value={newProfile.email} onChange={(e) => setNewProfile({...newProfile, email: e.target.value})} />
                        </div>
                        <div>
                            <Label htmlFor="new-password">Password</Label>
                            <Input id="new-password" type="password" value={newProfile.password} onChange={(e) => setNewProfile({...newProfile, password: e.target.value})} />
                        </div>
                        <div>
                            <Label htmlFor="confirm-password">Confirm Password</Label>
                            <Input id="confirm-password" type="password" value={newProfile.confirmPassword} onChange={(e) => setNewProfile({...newProfile, confirmPassword: e.target.value})} />
                        </div>
                        <div>
                            <Label htmlFor="new-fullname">Full Name</Label>
                            <Input id="new-fullname" value={newProfile.full_name} onChange={(e) => setNewProfile({...newProfile, full_name: e.target.value})} />
                        </div>
                        <div>
                            <Label htmlFor="new-role">Role</Label>
                            <Select value={newProfile.role} onValueChange={(value) => setNewProfile({...newProfile, role: value})}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="player">Player</SelectItem>
                                    <SelectItem value="brand">Brand</SelectItem>
                                    <SelectItem value="creator">Creator</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                        <Button onClick={handleAddProfile}>Create Profile</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default ManagePlayers;
