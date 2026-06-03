/**
 * Preprocess raw editor HTML for display in the HTML panel.
 * Converts empty blocks to standalone <br> for readability.
 */
export function preprocess(html: string): string {
  return html
    .replace(/<(p|h[1-6])><br><\/\1>/gi, "<br>")
    .replace(/<(p|h[1-6])>&nbsp;<\/\1>/gi, "<br>");
}
