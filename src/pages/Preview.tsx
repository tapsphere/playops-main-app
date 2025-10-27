import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const PreviewPage = () => {
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedHtml = sessionStorage.getItem('gamePreviewHtml');
    if (storedHtml) {
      setPreviewHtml(storedHtml);
    } else {
      // Handle case where there's no HTML, maybe redirect or show a message
      navigate(-1); // Go back if no HTML is found
    }
  }, [navigate]);

  return (
    <div className="w-full h-screen bg-black flex flex-col">
      <header className="w-full p-2 bg-gray-900 border-b border-neon-green/30 flex items-center justify-between flex-shrink-0">
        <h1 className="text-neon-green text-glow-green text-sm">Mobile Preview</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Close Preview
        </Button>
      </header>
      <main className="flex-1 w-full max-w-[430px] mx-auto overflow-y-auto">
        {previewHtml ? (
          <iframe
            srcDoc={previewHtml}
            className="w-full h-full"
            title="Game Preview"
            sandbox="allow-scripts allow-same-origin"
            style={{ border: 'none' }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-white">
            <p>No preview content found.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default PreviewPage;
