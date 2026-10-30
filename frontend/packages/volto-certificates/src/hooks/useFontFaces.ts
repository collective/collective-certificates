import { useEffect, useState } from 'react';
import { fontFaceCss } from '../helpers/fontUrl';

const STYLE_ID = 'collective-certificates-fonts';

/**
 * Declare the font tokens as `@font-face` families and wait for them.
 *
 * Text measured or drawn before its face has loaded would use a fallback
 * font, so the designer waits for `ready` before measuring.
 *
 * @param tokens Font tokens.
 * @returns Whether every face has loaded (or failed to).
 */
export default function useFontFaces(tokens: readonly string[]): boolean {
  const [ready, setReady] = useState(false);
  const key = tokens.join(' ');
  useEffect(() => {
    if (typeof document === 'undefined' || tokens.length === 0) {
      setReady(tokens.length === 0);
      return undefined;
    }
    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement('style');
      style.id = STYLE_ID;
      document.head.appendChild(style);
    }
    style.textContent = fontFaceCss(tokens);
    let active = true;
    setReady(false);
    const fonts = document.fonts;
    const loads = fonts
      ? tokens.map((token) => fonts.load(`16px "${token}"`).catch(() => []))
      : [];
    Promise.all(loads).then(() => {
      if (active) setReady(true);
    });
    return () => {
      active = false;
    };
    // `key` stands for the token list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return ready;
}
