import { WolComponent, html, define, router } from "wolfe";
import "./pages/text-editor.ts";

@define("app-root")
class AppRoot extends WolComponent {
  protected render() {
    return html`<text-editor></text-editor>`;
  }
}

const outlet = document.getElementById("app")!;
router.add({ path: "/", tag: "app-root", title: "Wolfe" });
router.missing({ tag: "app-root", title: "Wolfe" });
router.init({ outlet, appName: "HTML Editor" });
