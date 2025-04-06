export interface DataContract {
  id: string;
  name: string;
  description?: string;
  version: string;
  status: string;
  owner: string;
  format: string;
  contract_text: string;
  created: string;
  updated: string;
  schema?: {
    fields: Array<{
      name: string;
      type: string;
      required: boolean;
    }>;
  };
  validation_rules?: string[];
  dataProducts: string[];
} 