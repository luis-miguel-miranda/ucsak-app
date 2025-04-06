export interface Port {
  name: string;
  description: string;
  schema_reference: string;
  port_type: "input" | "output";
  tags: string[];
}

export interface DataProduct {
  id?: string;
  name: string;
  description: string;
  owner: string;
  type: string;
  status: string;
  tags: string[];
  created_at?: string;
  updated_at?: string;
  input_ports: any[];
  output_ports: any[];
}

export interface ProductStatus {
  id: string;
  name: string;
  description: string;
}

export type ProductType = string; 