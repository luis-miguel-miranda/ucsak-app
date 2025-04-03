import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Plus, Pencil, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'inactive';
  complianceScore: number;
  lastChecked: string;
}

export default function Compliance() {
  const [rules, setRules] = useState<ComplianceRule[]>([
    {
      id: '1',
      name: 'PII Data Encryption',
      description: 'Ensures PII data is encrypted at rest',
      category: 'Security',
      severity: 'high',
      status: 'active',
      complianceScore: 85,
      lastChecked: '2024-03-29T12:30:00Z'
    },
    {
      id: '2',
      name: 'Data Quality Thresholds',
      description: 'Maintains data quality metrics above defined thresholds',
      category: 'Data Quality',
      severity: 'medium',
      status: 'active',
      complianceScore: 92,
      lastChecked: '2024-03-29T12:30:00Z'
    },
    {
      id: '3',
      name: 'Access Control',
      description: 'Verifies proper access controls on sensitive data',
      category: 'Security',
      severity: 'critical',
      status: 'active',
      complianceScore: 65,
      lastChecked: '2024-03-29T12:30:00Z'
    }
  ]);

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRule, setSelectedRule] = useState<ComplianceRule | null>(null);

  const overallCompliance = rules.reduce((acc, rule) => acc + rule.complianceScore, 0) / rules.length;
  const activeRules = rules.filter(rule => rule.status === 'active').length;
  const criticalIssues = rules.filter(rule => rule.severity === 'critical' && rule.complianceScore < 80).length;

  const handleCreateRule = () => {
    setSelectedRule(null);
    setOpenDialog(true);
  };

  const handleEditRule = (rule: ComplianceRule) => {
    setSelectedRule(rule);
    setOpenDialog(true);
  };

  const handleSaveRule = (event: React.FormEvent) => {
    event.preventDefault();
    // TODO: Implement save logic
    setOpenDialog(false);
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSeverityBadge = (severity: string) => {
    const variants = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return variants[severity as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Compliance</h1>
        <Button onClick={handleCreateRule}>
          <Plus className="h-4 w-4 mr-2" />
          Add Compliance Rule
        </Button>
      </div>

      {/* Compliance Score */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Overall Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getComplianceColor(overallCompliance)}`}>
              {overallCompliance.toFixed(0)}%
            </div>
            <p className="text-sm text-muted-foreground mt-2">Across all rules</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Active Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeRules}</div>
            <p className="text-sm text-muted-foreground mt-2">Currently enforced</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Critical Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{criticalIssues}</div>
            <p className="text-sm text-muted-foreground mt-2">Require attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Last Updated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">Today</div>
            <p className="text-sm text-muted-foreground mt-2">12:30 PM</p>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Rules */}
      <div className="space-y-4">
        {rules.map((rule) => (
          <Card key={rule.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-semibold">{rule.name[0]}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{rule.name}</h3>
                    <p className="text-sm text-muted-foreground">{rule.description}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant="outline">{rule.category}</Badge>
                      <Badge className={getSeverityBadge(rule.severity)}>
                        {rule.severity}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className={`text-lg font-semibold ${getComplianceColor(rule.complianceScore)}`}>
                      {rule.complianceScore}%
                    </div>
                    <p className="text-sm text-muted-foreground">Compliant</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleEditRule(rule)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedRule ? 'Edit Compliance Rule' : 'Create New Compliance Rule'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveRule} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                defaultValue={selectedRule?.name}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                defaultValue={selectedRule?.description}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select defaultValue={selectedRule?.category}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Security">Security</SelectItem>
                  <SelectItem value="Data Quality">Data Quality</SelectItem>
                  <SelectItem value="Privacy">Privacy</SelectItem>
                  <SelectItem value="Governance">Governance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="severity">Severity</Label>
              <Select defaultValue={selectedRule?.severity}>
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="complianceScore">Compliance Score</Label>
              <Input
                id="complianceScore"
                type="number"
                min="0"
                max="100"
                defaultValue={selectedRule?.complianceScore}
                required
              />
            </div>
            <DialogFooter>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 