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

type TemplateStats = {
  templateId: string;
  customizationsCount: number;
  completionsCount: number;
  averageScore: number;
  testStatus: 'tested' | 'untested';
};

export default function CreatorDashboard() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateStats, setTemplateStats] = useState<Map<string, TemplateStats>>(new Map());
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [competenciesDialogOpen, setCompetenciesDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [filter, setFilter] = useState<'all' | 'tested' | 'untested' | 'published' | 'draft' | 'new' | 'old'>('all');

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
      
      // Load statistics for each template
      const statsMap = new Map<string, TemplateStats>();
      
      for (const template of (data || [])) {
        // Count customizations
        const { count: customizationsCount } = await supabase
          .from('brand_customizations')
          .select('*', { count: 'exact', head: true })
          .eq('template_id', template.id);
        
        // Count completions and calculate average score
        const { data: results, count: completionsCount } = await supabase
          .from('game_results')
          .select('scoring_metrics', { count: 'exact' })
          .eq('template_id', template.id);
        
        let averageScore = 0;
        if (results && results.length > 0) {
          const scores = results.map(r => r.scoring_metrics?.accuracy || r.scoring_metrics?.final_score || 0);
          averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        }
        
        statsMap.set(template.id, {
          templateId: template.id,
          customizationsCount: customizationsCount || 0,
          completionsCount: completionsCount || 0,
          averageScore: Math.round(averageScore),
          testStatus: completionsCount && completionsCount > 0 ? 'tested' : 'untested'
        });
      }
      
      setTemplateStats(statsMap);
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
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="bg-gray-900 border border-gray-700 text-gray-200 rounded px-3 py-2 text-sm"
            >
              <option value="all">All</option>
              <option value="tested">Tested</option>
              <option value="untested">Not Tested</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="new">New</option>
              <option value="old">Old</option>
            </select>
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
          {templates
            .filter((t) => {
              const stats = templateStats.get(t.id);
              if (!stats && (filter === 'tested' || filter === 'untested')) return filter === 'untested';
              switch (filter) {
                case 'tested':
                  return stats?.testStatus === 'tested';
                case 'untested':
                  return stats?.testStatus === 'untested';
                case 'published':
                  return t.is_published;
                case 'draft':
                  return !t.is_published;
                case 'new':
                  return true; // will rely on ordering
                case 'old':
                  return true; // will rely on ordering, we can reverse below if needed
                default:
                  return true;
              }
            })
            .sort((a, b) => {
              if (filter === 'old') {
                return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
              }
              // default/new = newest first (already ordered desc by load)
              return 0;
            })
            .map((template) => (
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
                  <div className="flex flex-col gap-1 items-end">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        template.is_published
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-gray-700 text-gray-400'
                      }`}
                    >
                      {template.is_published ? 'Published' : 'Draft'}
                    </span>
                    {templateStats.has(template.id) && (
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          templateStats.get(template.id)?.testStatus === 'tested'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}
                      >
                        {templateStats.get(template.id)?.testStatus === 'tested' ? 'Tested' : 'Untested'}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{template.description}</p>
                
                {/* Statistics */}
                {templateStats.has(template.id) && (
                  <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                    <div className="bg-gray-800/50 p-2 rounded">
                      <p className="text-gray-400">Customizations</p>
                      <p className="font-bold text-white">{templateStats.get(template.id)?.customizationsCount || 0}</p>
                    </div>
                    <div className="bg-gray-800/50 p-2 rounded">
                      <p className="text-gray-400">Completions</p>
                      <p className="font-bold text-white">{templateStats.get(template.id)?.completionsCount || 0}</p>
                    </div>
                    <div className="bg-gray-800/50 p-2 rounded col-span-2">
                      <p className="text-gray-400">Avg Score</p>
                      <p className="font-bold text-white">{templateStats.get(template.id)?.averageScore || 0}{templateStats.get(template.id)?.averageScore ? '%' : ''}</p>
                    </div>
                  </div>
                )}
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
