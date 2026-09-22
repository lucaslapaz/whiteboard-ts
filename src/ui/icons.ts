import addIcon from "../assets/icons/add.svg?raw";
import centerFocusIcon from "../assets/icons/center-focus.svg?raw";
import cursorIcon from "../assets/icons/cursor.svg?raw";
import eraserIcon from "../assets/icons/eraser.svg?raw";
import handIcon from "../assets/icons/hand.svg?raw";
import penIcon from "../assets/icons/pen.svg?raw";

/**
 * Os SVG entram como texto para virarem markup inline: assim eles herdam a cor
 * do botao (`currentColor`) e acompanham o tema claro/escuro.
 */
export const icons = {
    add: addIcon,
    center: centerFocusIcon,
    cursor: cursorIcon,
    eraser: eraserIcon,
    hand: handIcon,
    pen: penIcon,
    download: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 3v12m0 0 4.5-4.5M12 15l-4.5-4.5M4 17v1.5A2.5 2.5 0 0 0 6.5 21h11a2.5 2.5 0 0 0 2.5-2.5V17"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    shapes: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="11" height="11" rx="2" stroke="currentColor" stroke-width="2"/>
        <circle cx="15.5" cy="15.5" r="5.5" stroke="currentColor" stroke-width="2"/>
    </svg>`,
    text: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 6V4h14v2M12 4v16M8.5 20h7"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    theme: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9Z"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    trash: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 7h16M10 7V5h4v2M6 7l1 13h10l1-13M10 11v6M14 11v6"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
} as const;

export type IconName = keyof typeof icons;
