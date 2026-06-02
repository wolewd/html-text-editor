import { WolComponent, html, define, router } from "wolfe";
import { el } from "wolfe/utils";
import "./components/editor.ts";

@define("app-root")
class AppRoot extends WolComponent {
  protected render() {
    return html`<wolfe-editor></wolfe-editor>`;
  }
}

const outlet = el("app");
router.add({ path: "/", tag: "app-root", title: "WolFe Editor" });
router.missing({ tag: "app-root", title: "WolFe Editor" });
router.init({ outlet, appName: "WolFe Editor" });
