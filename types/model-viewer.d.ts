import "react";

declare global {
  type ModelViewerElement = HTMLElement & {
    availableAnimations?: string[];
    animationName?: string | null;
    currentTime: number;
    play: () => void;
    pause: () => void;
  };
}

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        poster?: string;
        alt?: string;
        exposure?: string;
        "shadow-intensity"?: string;
        "animation-name"?: string;
        "interaction-prompt"?: string;
        autoplay?: boolean;
        loading?: "auto" | "eager" | "lazy";
        "camera-controls"?: boolean;
      };
    }
  }
}

export {};
