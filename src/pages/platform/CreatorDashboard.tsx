import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Eye, Edit, Trash2, EyeOff, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { TemplateDialog } from '@/components/platform/TemplateDialog';
import { CompetenciesDialog } from '@/components/platform/CompetenciesDialog';

type Template = {
  id: string;
  name: string;
  description: string;
  base_prompt: string | null;
  is_published: boolean;
  created_at: string;
  preview_image?: string;
  preview_html?: string | null;
  template_type?: 'ai_generated' | 'custom_upload';
  competency_id?: string;
  selected_sub_competencies?: string[];
};

export default function CreatorDashboard() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [competenciesDialogOpen, setCompetenciesDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('game_templates')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (template: Template) => {
    setSelectedTemplate(template);
    setDialogOpen(true);
  };

  const handleManageCompetencies = (template: Template) => {
    setSelectedTemplate(template);
    setCompetenciesDialogOpen(true);
  };

  const handlePreview = (template: Template) => {
    if (template.preview_html) {
      sessionStorage.setItem('gamePreviewHtml', template.preview_html);
      navigate('/preview');
    } else {
      toast.info('No preview available for this template.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return;

    try {
      const { error } = await supabase
        .from('game_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Template deleted');
      loadTemplates();
    } catch (error: any) {
      toast.error('Failed to delete template');
    }
  };

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('game_templates')
        .update({ is_published: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      toast.success(currentStatus ? 'Unpublished' : 'Published to marketplace');
      loadTemplates();
    } catch (error: any) {
      toast.error('Failed to update template');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading templates...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold" style={{ color: 'hsl(var(--neon-green))' }}>
            My Templates
          </h2>
          <p className="text-gray-400 mt-2">Create game templates with CBE competencies built in</p>
        </div>
        <Button 
          onClick={() => {
            setSelectedTemplate(null);
            setDialogOpen(true);
          }} 
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          New Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card className="p-12 text-center bg-gray-900 border-gray-800">
          <p className="text-gray-400 mb-4">No templates yet</p>
          <Button 
            onClick={() => {
              setSelectedTemplate(null);
              setDialogOpen(true);
            }} 
            variant="outline"
          >
            Create Your First Template
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="bg-gray-900 border-gray-800 overflow-hidden">
              <div 
                className="aspect-video bg-gray-800 flex items-center justify-center cursor-pointer"
                onClick={() => handlePreview(template)}
              >
                {template.preview_image ? (
                  <img src={template.preview_image} alt={template.name} className="w-full h-full object-cover" />
                ) : (
                  <Eye className="w-12 h-12 text-gray-600" />
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg text-white">{template.name}</h3>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      template.is_published
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {template.is_published ? 'Published' : 'Draft'}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{template.description}</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(template)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleManageCompetencies(template)}
                    title="Manage Competencies"
                  >
                    <Layers className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleTogglePublish(template.id, template.is_published)}
                  >
                    {template.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(template.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <TemplateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        template={selectedTemplate}
        onSuccess={loadTemplates}
      />

      <CompetenciesDialog
        open={competenciesDialogOpen}
        onOpenChange={setCompetenciesDialogOpen}
        templateId={selectedTemplate?.id || ''}
        templateName={selectedTemplate?.name || ''}
      />
    </div>
  );
}
