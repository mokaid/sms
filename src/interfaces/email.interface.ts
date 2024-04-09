export interface SchemaFieldConfig {
  [fieldName: string]: string[];
}

export interface SchemaConfig {
  headerRow: number;
  fields: SchemaFieldConfig;
}

export interface ParsedItem {
  country: string;
  MCC: string;
  MNC: string;
  price: string;
  currency: string;
}
