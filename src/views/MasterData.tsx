import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Progress } from '../components/ui/progress';
import { AlertCircle, GitCompareArrows, Plus } from 'lucide-react';

interface Dataset {
  id: string;
  name: string;
  catalog: string;
  schema: string;
  table: string;
  entityColumn: string;
  type: 'customer' | 'product' | 'supplier' | 'location';
  totalRecords: number;
}

interface ComparisonResult {
  datasetA: string;
  datasetB: string;
  matchingEntities: number;
  uniqueToA: number;
  uniqueToB: number;
  matchScore: number;
  commonColumns: string[];
  sampleMatches: Array<{
    entityA: string;
    entityB: string;
    confidence: number;
  }>;
  columnStats: Array<{
    column: string;
    matchRate: number;
    nullRate: number;
  }>;
}

export default function MasterData() {
  const [selectedDatasets, setSelectedDatasets] = useState<string[]>([]);
  const [entityType, setEntityType] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<ComparisonResult[]>([]);
  const [detailedResults, setDetailedResults] = useState<ComparisonResult[]>([]);
  const [selectedComparison, setSelectedComparison] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);

  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    try {
      const response = await fetch('/api/master-data-management/datasets');
      if (!response.ok) throw new Error('Failed to fetch datasets');
      const data = await response.json();
      setDatasets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch datasets');
    }
  };

  const handleAnalyze = async () => {
    if (selectedDatasets.length < 2) {
      setError('Please select at least two datasets to compare');
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/master-data-management/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(selectedDatasets),
      });

      if (!response.ok) throw new Error('Failed to analyze datasets');
      const data = await response.json();
      setDetailedResults(data);
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze datasets');
    } finally {
      setAnalyzing(false);
    }
  };

  const renderDetailedResults = () => {
    if (!selectedComparison) return null;
    
    const detail = detailedResults.find(r => 
      `${r.datasetA}-${r.datasetB}` === selectedComparison
    );
    
    if (!detail) return null;

    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Detailed Analysis: {detail.datasetA} vs {detail.datasetB}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Common Columns */}
          <div>
            <h4 className="text-sm font-medium mb-2">Common Columns</h4>
            <div className="flex flex-wrap gap-1">
              {detail.commonColumns.map(col => (
                <Badge key={col} variant="secondary">{col}</Badge>
              ))}
            </div>
          </div>

          {/* Column Statistics */}
          <div>
            <h4 className="text-sm font-medium mb-2">Column Statistics</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Column</TableHead>
                  <TableHead className="text-right">Match Rate</TableHead>
                  <TableHead className="text-right">Null Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.columnStats.map(stat => (
                  <TableRow key={stat.column}>
                    <TableCell>{stat.column}</TableCell>
                    <TableCell className="text-right">{(stat.matchRate * 100).toFixed(1)}%</TableCell>
                    <TableCell className="text-right">{(stat.nullRate * 100).toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Sample Matches */}
          <div>
            <h4 className="text-sm font-medium mb-2">Sample Matches</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entity A</TableHead>
                  <TableHead>Entity B</TableHead>
                  <TableHead className="text-right">Confidence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.sampleMatches.map((match, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{match.entityA}</TableCell>
                    <TableCell>{match.entityB}</TableCell>
                    <TableCell className="text-right">{(match.confidence * 100).toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-bold">Master Data Management</h1>
          <p className="text-muted-foreground mt-1">
            Analyze and manage entity overlaps across your data estate
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Entity
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-12 gap-6">
        {/* Dataset Selection */}
        <div className="col-span-8">
          <Card>
            <CardHeader>
              <CardTitle>Dataset Selection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Entity Type</Label>
                  <Select value={entityType} onValueChange={setEntityType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select entity type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="product">Product</SelectItem>
                      <SelectItem value="supplier">Supplier</SelectItem>
                      <SelectItem value="location">Location</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Datasets to Compare</Label>
                  <Select
                    value={selectedDatasets.join(',')}
                    onValueChange={(value) => setSelectedDatasets(value.split(',').filter(Boolean))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select datasets" />
                    </SelectTrigger>
                    <SelectContent>
                      {datasets.map((dataset) => (
                        <SelectItem key={dataset.id} value={dataset.id}>
                          {dataset.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleAnalyze}
                  disabled={analyzing || selectedDatasets.length < 2}
                >
                  <GitCompareArrows className="h-4 w-4 mr-2" />
                  Analyze Overlaps
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Selected Datasets Info */}
        <div className="col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Selected Datasets</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {selectedDatasets.map(id => {
                  const dataset = datasets.find(d => d.id === id);
                  return dataset ? (
                    <div key={id} className="mb-4">
                      <h4 className="font-medium">{dataset.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Path: {dataset.catalog}.{dataset.schema}.{dataset.table}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Records: {dataset.totalRecords.toLocaleString()}
                      </p>
                    </div>
                  ) : null;
                })}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Analysis Results */}
        <div className="col-span-12">
          <Card>
            <CardHeader>
              <CardTitle>Analysis Results</CardTitle>
            </CardHeader>
            <CardContent>
              {analyzing && (
                <div className="mb-4">
                  <Progress value={33} className="w-full" />
                </div>
              )}

              {results.length > 0 && (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Dataset A</TableHead>
                        <TableHead>Dataset B</TableHead>
                        <TableHead className="text-right">Matching Entities</TableHead>
                        <TableHead className="text-right">Unique to A</TableHead>
                        <TableHead className="text-right">Unique to B</TableHead>
                        <TableHead className="text-right">Match Score</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.map((result, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{result.datasetA}</TableCell>
                          <TableCell>{result.datasetB}</TableCell>
                          <TableCell className="text-right">
                            {result.matchingEntities.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {result.uniqueToA.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {result.uniqueToB.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {result.matchScore.toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="mt-4">
                    <Label>View Detailed Analysis</Label>
                    <Select
                      value={selectedComparison || ''}
                      onValueChange={setSelectedComparison}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select comparison" />
                      </SelectTrigger>
                      <SelectContent>
                        {results.map((result, idx) => (
                          <SelectItem key={idx} value={`${result.datasetA}-${result.datasetB}`}>
                            {result.datasetA} vs {result.datasetB}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {renderDetailedResults()}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 