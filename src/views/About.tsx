import React from 'react';

export default function About() {
  return (
    <div className="container py-6">
      <h1 className="text-4xl font-bold mb-6">About Unity Catalog Swiss Army Knife</h1>
      
      <div className="prose max-w-none">
        <p className="text-lg mb-4">
          The Unity Catalog Swiss Army Knife is a comprehensive tool for managing Databricks Unity Catalog,
          providing a unified interface for data governance, security, and management.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Features</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Data Products: Group and manage Databricks assets with tags</li>
          <li>Data Contracts: Implement technical metadata and quality controls</li>
          <li>Business Glossary: Create and manage business terms across organizational units</li>
          <li>Master Data Management: Implement MDM using Zingg.ai</li>
          <li>Entitlements: Manage access privileges through personas</li>
          <li>Security: Enable advanced security features like differential privacy</li>
          <li>Compliance: Create and verify compliance rules</li>
          <li>Catalog Commander: Explore and manage data assets</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Source Code</h2>
        <p className="mb-4">
          The source code for this application is available on GitHub:
        </p>
        <a
          href="https://github.com/your-org/unity-catalog-swiss-army-knife"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3"
        >
          View on GitHub
        </a>

        <h2 className="text-2xl font-semibold mt-8 mb-4">License</h2>
        <p className="mb-4">
          This project is licensed under the Apache License 2.0.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Contributing</h2>
        <p className="mb-4">
          We welcome contributions! Please see our contributing guidelines in the repository.
        </p>
      </div>
    </div>
  );
} 