export interface FoundryItem {
  id: string;
  label: string;
  repere: string;
  qte: number;
  methodBefore: string;
  children: FoundryItem[];
}

export type NodeType = 'part' | 'operation';

export interface NodeData {
  label: string;
  repere?: string;
  qte?: number;
  method?: string;
  onMethodChange?: (newMethod: string) => void;
}
