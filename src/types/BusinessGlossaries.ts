interface TaggedAsset {
  id: string;
  name: string;
  type: string;
  path: string;
}

export interface GlossaryTerm {
  id: string;
  name: string;
  definition: string;
  domain: string;
  abbreviation?: string;
  synonyms: string[];
  examples: string[];
  tags: string[];
  owner: string;
  status: string;
  created_at: string;
  updated_at: string;
  source_glossary_id: string;
  taggedAssets?: TaggedAsset[];
}

export interface BusinessGlossary {
  id: string;
  name: string;
  description: string;
  scope: string;
  org_unit: string;
  domain: string;
  parent_glossary_ids: string[];
  terms: { [key: string]: GlossaryTerm };
  tags: string[];
  owner: string;
  status: string;
  created_at: string;
  updated_at: string;
  taggedAssets?: TaggedAsset[];
} 