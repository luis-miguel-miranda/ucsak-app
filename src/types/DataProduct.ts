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
  owner: string;
  type: "source-aligned" | "aggregate" | "consumer-aligned";
  status: "candidate" | "in-development" | "active" | "deprecated" | "retired";
  description: string;
  tags: string[];
  input_ports: Port[];
  output_ports: Port[];
  created_at?: string;
  updated_at?: string;
} 