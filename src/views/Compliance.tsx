import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { useToast } from '@/hooks/useToast';
import { Plus, Pencil, Trash2, AlertCircle, CheckCircle2, XCircle, Gavel, Scale } from 'lucide-react';
import { Sparklines, SparklinesLine } from 'react-sparklines';

interface CompliancePolicy {
  id: string;
  name: string;
  description: string;
  rule: string;
  compliance: number;
  history: number[];
  is_active: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
}

interface ComplianceStats {
  overall_compliance: number;
  active_policies: number;
  critical_issues: number;
}

export default function Compliance() {
  const [policies, setPolicies] = useState<CompliancePolicy[]>([]);
  const [stats, setStats] = useState<ComplianceStats>({
    overall_compliance: 0,
    active_policies: 0,
    critical_issues: 0
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<CompliancePolicy | null>(null);
  const [formData, setFormData] = useState<Partial<CompliancePolicy>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [policiesRes, statsRes] = await Promise.all([
        fetch('/api/compliance/policies'),
        fetch('/api/compliance/stats')
      ]);
      
      if (!policiesRes.ok || !statsRes.ok) throw new Error('Failed to fetch data');
      
      const policiesData = await policiesRes.json();
      const statsData = await statsRes.json();
      
      setPolicies(policiesData);
      setStats(statsData);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load compliance data"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const url = editingPolicy 
        ? `/api/compliance/policies/${editingPolicy.id}`
        : '/api/compliance/policies';
      
      const method = editingPolicy ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) throw new Error('Failed to save policy');
      
      toast({
        title: "Success",
        description: "Policy saved successfully"
      });
      
      setDialogOpen(false);
      fetchData();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save policy"
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/compliance/policies/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete policy');
      
      toast({
        title: "Success",
        description: "Policy deleted successfully"
      });
      
      fetchData();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete policy"
      });
    }
  };

  const overallCompliance = stats.overall_compliance;
  const activePolicies = stats.active_policies;
  const criticalIssues = stats.critical_issues;

  const handleCreateRule = () => {
    setEditingPolicy(null);
    setDialogOpen(true);
  };

  const handleEditRule = (policy: CompliancePolicy) => {
    setEditingPolicy(policy);
    setDialogOpen(true);
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
    <div className="container py-6">
      <h1 className="text-4xl font-bold mb-6 flex items-center gap-2">
        <Scale className="w-8 h-8" />
        Compliance
      </h1>

      <div className="flex justify-between items-center mb-6">
        <Button onClick={handleCreateRule} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Rule
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
            <div className="text-3xl font-bold">{activePolicies}</div>
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
        {policies.map((policy) => (
          <Card key={policy.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-semibold">{policy.name[0]}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{policy.name}</h3>
                    <p className="text-sm text-muted-foreground">{policy.description}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant="outline">{policy.category}</Badge>
                      <Badge className={getSeverityBadge(policy.severity)}>
                        {policy.severity}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className={`text-lg font-semibold ${getComplianceColor(policy.compliance)}`}>
                      {policy.compliance}%
                    </div>
                    <p className="text-sm text-muted-foreground">Compliant</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleEditRule(policy)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPolicy ? 'Edit Compliance Rule' : 'Create New Compliance Rule'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                defaultValue={editingPolicy?.name}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                defaultValue={editingPolicy?.description}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select defaultValue={editingPolicy?.category}>
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
              <Select defaultValue={editingPolicy?.severity}>
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
              <Label htmlFor="compliance">Compliance</Label>
              <Input
                id="compliance"
                type="number"
                min="0"
                max="100"
                defaultValue={editingPolicy?.compliance}
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