import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
    const navigate = useNavigate();

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
            <Card className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button onClick={() => navigate('/platform/admin/players')}>Manage Players</Button>
                    <Button onClick={() => navigate('/platform/admin/brands')}>Manage Brands</Button>
                    <Button onClick={() => navigate('/platform/admin/creators')}>Manage Creators</Button>
                </div>
            </Card>
        </div>
    );
}

export default AdminDashboard;
