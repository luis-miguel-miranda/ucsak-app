import { Info, Github, Shield, BookOpen, FileText, Users, Lock, CheckCircle, Settings, Database, GitBranch, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function About() {
  return (
    <div className="container py-8">
      <div className="flex items-center gap-3 mb-8">
        <Info className="w-8 h-8 text-primary" />
        <h1 className="text-4xl font-bold">About Unity Catalog Swiss Army Knife</h1>
      </div>
      
      <div className="prose max-w-none mb-12">
        <p className="text-lg text-muted-foreground">
          The Unity Catalog Swiss Army Knife is a comprehensive tool for managing Databricks Unity Catalog,
          providing a unified interface for data governance, security, and management.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              <CardTitle>Data Products</CardTitle>
            </div>
            <CardDescription>Group and manage Databricks assets with tags</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Tag-based asset organization</li>
              <li>• Domain-based categorization</li>
              <li>• Asset relationship management</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <CardTitle>Data Contracts</CardTitle>
            </div>
            <CardDescription>Implement technical metadata and quality controls</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Open Data Contract Standard</li>
              <li>• Quality control implementation</li>
              <li>• Access privilege verification</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <CardTitle>Business Glossary</CardTitle>
            </div>
            <CardDescription>Create and manage business terms across organizational units</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Hierarchical organization</li>
              <li>• Term lifecycle management</li>
              <li>• Asset assignment</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <CardTitle>Master Data Management</CardTitle>
            </div>
            <CardDescription>Implement MDM using Zingg.ai</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Entity resolution</li>
              <li>• Data deduplication</li>
              <li>• Golden record creation</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <CardTitle>Entitlements</CardTitle>
            </div>
            <CardDescription>Manage access privileges through personas</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Persona-based access control</li>
              <li>• Directory group integration</li>
              <li>• Privilege management</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-primary" />
              <CardTitle>Entitlements Sync</CardTitle>
            </div>
            <CardDescription>Synchronize entitlements with external systems</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Automated synchronization</li>
              <li>• Conflict resolution</li>
              <li>• Audit logging</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              <CardTitle>Security Features</CardTitle>
            </div>
            <CardDescription>Enable advanced security features</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Differential privacy</li>
              <li>• Row-level security</li>
              <li>• Column-level security</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              <CardTitle>Compliance</CardTitle>
            </div>
            <CardDescription>Create and verify compliance rules</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Rule creation and management</li>
              <li>• Compliance scoring</li>
              <li>• Verification workflows</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-primary" />
              <CardTitle>Catalog Commander</CardTitle>
            </div>
            <CardDescription>Explore and manage data assets</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Side-by-side catalog explorer</li>
              <li>• Asset rearrangement</li>
              <li>• Schema management</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              <CardTitle>Settings</CardTitle>
            </div>
            <CardDescription>Configure and manage application settings</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Job configuration</li>
              <li>• Git integration</li>
              <li>• System settings</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="prose max-w-none">
        <h2 className="text-2xl font-semibold mt-8 mb-4">Source Code</h2>
        <p className="mb-4 text-muted-foreground">
          The source code for this application is available on GitHub:
        </p>
        <a
          href="https://github.com/your-org/unity-catalog-swiss-army-knife"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3"
        >
          <Github className="w-4 h-4" />
          View on GitHub
        </a>

        <h2 className="text-2xl font-semibold mt-8 mb-4">License</h2>
        <p className="mb-4 text-muted-foreground">
          This project is licensed under the Apache License 2.0.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Contributing</h2>
        <p className="mb-4 text-muted-foreground">
          We welcome contributions! Please see our contributing guidelines in the repository.
        </p>
      </div>
    </div>
  );
} 