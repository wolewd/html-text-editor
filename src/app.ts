import { WolComponent, html, define, router } from "wolfe";
import "./pages/text-editor.ts";

@define("app-root")
class AppRoot extends WolComponent {
  protected render() {
    return html`<text-editor></text-editor>`;
  }
}

const outlet = document.getElementById("app")!;
router.add({ path: "/", tag: "app-root", title: "WolFe Editor" });
router.missing({ tag: "app-root", title: "WolFe Editor" });
router.init({ outlet, appName: "WolFe Editor" });
