/**
 * Preprocess raw editor HTML for display.
 * Converts empty blocks (<p><br></p>, <h1><br></h1>, etc.) to standalone <br>.
 * Does NOT touch the editor — display-only transformation.
 */
export function preprocess(html: string): string {
  return html.replace(/<(p|h[1-6])><br><\/\1>/gi, "<br>");
}
