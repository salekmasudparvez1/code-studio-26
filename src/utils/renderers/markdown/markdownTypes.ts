export type MarkdownLineStyle =
  | "heading"
  | "paragraph"
  | "bullet"
  | "quote"
  | "code"
  | "hr"
  | "math"
  | "table"
  | "image";

export interface CalloutBox {
  background: string;
  border?: string;
  first: boolean;
  last: boolean;
}

export interface TableCell {
  text: string;
  header: boolean;
}

export interface MarkdownVisualLine {
  text: string;
  style: MarkdownLineStyle;
  color?: string;
  size?: number;
  headingLevel?: number;
  box?: CalloutBox;
  tableCells?: TableCell[];
  imageSrc?: string;
  imageAlt?: string;
}

export interface RichTextStyle {
  size: number;
  weight: string;
  color: string;
  font: string;
}
