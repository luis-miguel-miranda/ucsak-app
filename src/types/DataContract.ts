interface DatasetSchema {
  name: string;
  type: string;
  nullable: boolean;
  description?: string;
}

interface DatasetDefinition {
  name: string;
  type: 'table' | 'view';
  schema: DatasetSchema[];
  example_data: any[];
  entitlements: {
    column_masks: { [key: string]: string };
    row_filters: string[];
  };
}

export interface DataContract {
  id?: string;
  name: string;
  version: string;
  status: string;
  owner: string;
  description: string;
  datasets: DatasetDefinition[];
  created_at?: string;
  updated_at?: string;
} 