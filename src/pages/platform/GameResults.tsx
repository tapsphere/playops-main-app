import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

type GameResult = {
  id: string;
  created_at: string;
  scoring_metrics: any;
  passed: boolean;
  profiles: {
    full_name: string;
    avatar_url: string;
  } | null;
};

export default function GameResults() {
  const { customizationId } = useParams();
  const [results, setResults] = useState<GameResult[]>([]);
  const [gameName, setGameName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!customizationId) return;

    const fetchResults = async () => {
      try {
        setLoading(true);

        const { data: gameData, error: gameError } = await supabase
          .from('brand_customizations')
          .select('game_templates(name)')
          .eq('id', customizationId)
          .single();

        if (gameError) throw gameError;
        if (gameData) {
          setGameName((gameData.game_templates as any)?.name || 'Game');
        }

        const { data, error: resultsError } = await supabase
          .from('game_results')
          .select(`
            id,
            created_at,
            scoring_metrics,
            passed,
            profiles (
              full_name,
              avatar_url
            )
          `)
          .eq('customization_id', customizationId)
          .order('created_at', { ascending: false });

        if (resultsError) throw resultsError;

        setResults(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [customizationId]);

  if (loading) {
    return <div className="text-center py-12">Loading results...</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold mb-2 text-white">{gameName} Results</h2>
      <p className="text-gray-400 mb-8">Player attempts and scores for this game.</p>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">All Attempts</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-white">Player</TableHead>
                <TableHead className="text-white">Score</TableHead>
                <TableHead className="text-white">Result</TableHead>
                <TableHead className="text-white">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.length > 0 ? (
                results.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img 
                          src={result.profiles?.avatar_url || '/placeholder.svg'} 
                          alt={result.profiles?.full_name || 'Player'}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <span className="font-medium text-white">{result.profiles?.full_name || 'Anonymous'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-300">{result.scoring_metrics?.accuracy || 'N/A'}%</TableCell>
                    <TableCell>
                      <Badge variant={result.passed ? 'default' : 'destructive'}>
                        {result.passed ? 'Passed' : 'Failed'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-400">
                      {format(new Date(result.created_at), 'PPp')}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                    No results found for this game yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
