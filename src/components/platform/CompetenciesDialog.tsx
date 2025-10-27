import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

interface Competency {
  id: string;
  competency_name: string;
  sub_competencies: string[];
}

interface CompetenciesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  templateName: string;
}

export const CompetenciesDialog = ({ open, onOpenChange, templateId, templateName }: CompetenciesDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [newCompetency, setNewCompetency] = useState('');
  const [newSubCompetency, setNewSubCompetency] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (open) {
      loadCompetencies();
    }
  }, [open, templateId]);

  const loadCompetencies = async () => {
    try {
      const { data, error } = await supabase
        .from('template_competencies')
        .select('*')
        .eq('template_id', templateId);

      if (error) throw error;
      setCompetencies(data || []);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleAddCompetency = async () => {
    if (!newCompetency.trim()) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from('template_competencies')
        .insert({
          template_id: templateId,
          competency_name: newCompetency,
          sub_competencies: [],
        });

      if (error) throw error;
      toast.success('Competency added!');
      setNewCompetency('');
      loadCompetencies();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubCompetency = async (competencyId: string, currentSubs: string[]) => {
    const newSub = newSubCompetency[competencyId]?.trim();
    if (!newSub) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from('template_competencies')
        .update({ sub_competencies: [...currentSubs, newSub] })
        .eq('id', competencyId);

      if (error) throw error;
      toast.success('Sub-competency added!');
      setNewSubCompetency({ ...newSubCompetency, [competencyId]: '' });
      loadCompetencies();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCompetency = async (competencyId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('template_competencies')
        .delete()
        .eq('id', competencyId);

      if (error) throw error;
      toast.success('Competency deleted!');
      loadCompetencies();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSubCompetency = async (competencyId: string, currentSubs: string[], indexToRemove: number) => {
    setLoading(true);
    try {
      const newSubs = currentSubs.filter((_, i) => i !== indexToRemove);
      const { error } = await supabase
        .from('template_competencies')
        .update({ sub_competencies: newSubs })
        .eq('id', competencyId);

      if (error) throw error;
      toast.success('Sub-competency removed!');
      loadCompetencies();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-gray-900 border-neon-green text-white">
        <DialogHeader>
          <DialogTitle style={{ color: 'hsl(var(--neon-green))' }}>
            Competencies for {templateName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add New Competency */}
          <Card className="p-4 bg-gray-800 border-gray-700">
            <Label>Add Competency</Label>
            <div className="flex gap-2 mt-2">
              <Input
                value={newCompetency}
                onChange={(e) => setNewCompetency(e.target.value)}
                placeholder="e.g., Critical Thinking"
                className="bg-gray-700 border-gray-600"
              />
              <Button onClick={handleAddCompetency} disabled={loading}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </Card>

          {/* List Competencies */}
          {competencies.map((comp) => (
            <Card key={comp.id} className="p-4 bg-gray-800 border-gray-700">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-lg">{comp.competency_name}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteCompetency(comp.id)}
                  disabled={loading}
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </Button>
              </div>

              {/* Sub-competencies */}
              <div className="space-y-2">
                {comp.sub_competencies.map((sub, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-gray-700 px-3 py-2 rounded">
                    <span className="text-sm">{sub}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveSubCompetency(comp.id, comp.sub_competencies, idx)}
                      disabled={loading}
                    >
                      <Trash2 className="w-3 h-3 text-red-400" />
                    </Button>
                  </div>
                ))}

                {/* Add Sub-competency */}
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newSubCompetency[comp.id] || ''}
                    onChange={(e) => setNewSubCompetency({ ...newSubCompetency, [comp.id]: e.target.value })}
                    placeholder="Add sub-competency..."
                    className="bg-gray-700 border-gray-600 text-sm"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleAddSubCompetency(comp.id, comp.sub_competencies)}
                    disabled={loading}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
