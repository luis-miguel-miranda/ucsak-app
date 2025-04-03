import React, { useState } from 'react';
import { Shield, Lock, Edit2, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SecurityRule {
  id: string;
  name: string;
  description: string;
  type: 'row' | 'column' | 'masking' | 'privacy';
  status: 'enabled' | 'disabled';
  target: string;
  conditions: string[];
  lastUpdated: string;
}

const Security: React.FC = () => {
  const [rules, setRules] = useState<SecurityRule[]>([
    {
      id: '1',
      name: 'Row Level Security',
      description: 'Restrict access to specific rows based on user attributes',
      type: 'row',
      status: 'enabled',
      target: 'sales.customers',
      conditions: ['region = current_user_region()'],
      lastUpdated: '2024-03-29'
    },
    {
      id: '2',
      name: 'Column Level Security',
      description: 'Restrict access to sensitive columns',
      type: 'column',
      status: 'enabled',
      target: 'sales.transactions',
      conditions: ['credit_card_number', 'ssn'],
      lastUpdated: '2024-03-29'
    }
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<SecurityRule | null>(null);
  const [newRule, setNewRule] = useState<Partial<SecurityRule>>({
    name: '',
    description: '',
    type: 'row',
    status: 'enabled',
    target: '',
    conditions: []
  });

  const handleSaveRule = () => {
    if (editingRule) {
      setRules(rules.map(rule => 
        rule.id === editingRule.id ? { ...editingRule } : rule
      ));
    } else {
      const rule: SecurityRule = {
        ...newRule as SecurityRule,
        id: Date.now().toString(),
        lastUpdated: new Date().toISOString().split('T')[0]
      };
      setRules([...rules, rule]);
    }
    setIsDialogOpen(false);
    setEditingRule(null);
    setNewRule({
      name: '',
      description: '',
      type: 'row',
      status: 'enabled',
      target: '',
      conditions: []
    });
  };

  const handleDeleteRule = (id: string) => {
    setRules(rules.filter(rule => rule.id !== id));
  };

  const getStatusColor = (status: string) => {
    return status === 'enabled' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'row':
        return <Shield className="w-5 h-5" />;
      case 'column':
        return <Lock className="w-5 h-5" />;
      default:
        return <Shield className="w-5 h-5" />;
    }
  };

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold">Security</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Security Rule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingRule ? 'Edit Security Rule' : 'Add Security Rule'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={editingRule?.name || newRule.name}
                  onChange={(e) => {
                    if (editingRule) {
                      setEditingRule({ ...editingRule, name: e.target.value });
                    } else {
                      setNewRule({ ...newRule, name: e.target.value });
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editingRule?.description || newRule.description}
                  onChange={(e) => {
                    if (editingRule) {
                      setEditingRule({ ...editingRule, description: e.target.value });
                    } else {
                      setNewRule({ ...newRule, description: e.target.value });
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={editingRule?.type || newRule.type}
                  onValueChange={(value) => {
                    if (editingRule) {
                      setEditingRule({ ...editingRule, type: value as any });
                    } else {
                      setNewRule({ ...newRule, type: value as any });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="row">Row Level Security</SelectItem>
                    <SelectItem value="column">Column Level Security</SelectItem>
                    <SelectItem value="masking">Data Masking</SelectItem>
                    <SelectItem value="privacy">Differential Privacy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="target">Target</Label>
                <Input
                  id="target"
                  value={editingRule?.target || newRule.target}
                  onChange={(e) => {
                    if (editingRule) {
                      setEditingRule({ ...editingRule, target: e.target.value });
                    } else {
                      setNewRule({ ...newRule, target: e.target.value });
                    }
                  }}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveRule}>
                {editingRule ? 'Save Changes' : 'Add Rule'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {rules.map((rule) => (
          <Card key={rule.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">
                <div className="flex items-center space-x-2">
                  {getTypeIcon(rule.type)}
                  <span>{rule.name}</span>
                </div>
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Badge className={getStatusColor(rule.status)}>
                  {rule.status}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditingRule(rule);
                    setIsDialogOpen(true);
                  }}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteRule(rule.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">{rule.description}</p>
              <div className="text-sm">
                <span className="font-medium">Target:</span> {rule.target}
              </div>
              {rule.conditions.length > 0 && (
                <div className="text-sm mt-1">
                  <span className="font-medium">Conditions:</span>{' '}
                  {rule.conditions.join(', ')}
                </div>
              )}
              <div className="text-xs text-muted-foreground mt-2">
                Last updated: {rule.lastUpdated}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Security; 