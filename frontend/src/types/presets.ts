export interface PresetConfig {
  id: string;
  name: string;
  description?: string;
  category?: string;
  palette?: {
    primaryAccent?: string;
    secondaryAccent?: string;
    highlightColor?: string;
    darkAccent?: string;
    textPrimary?: string;
    textMuted?: string;
  };
  background?: {
    type?: string;
    primaryColor?: string;
    secondaryColor?: string;
    gridOpacity?: number;
    baseColor?: string;
    dotColor?: string;
    gridLineColor?: string;
  };
  typography?: {
    headlineFont?: string;
    bodyFont?: string;
    monoFont?: string;
  };
  captions: {
    activeWordColor: string;
    inactiveWordColor: string;
    highlightBox?: boolean;
    boxColor?: string;
    position?: 'bottom' | 'center' | 'top';
  };
}
