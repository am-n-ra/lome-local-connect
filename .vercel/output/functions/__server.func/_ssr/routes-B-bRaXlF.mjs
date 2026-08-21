import { d as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-B-bRaXlF.js
var import_jsx_runtime = require_jsx_runtime();
function V2Landing() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "v2-shell",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "v2-card",
			"aria-labelledby": "v2-title",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "v2-kicker",
					children: "OMNI / V2 REBUILD"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					id: "v2-title",
					children: "Nouvelle base en préparation."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
					"Cette branche est une base propre et isolée pour reconstruire Omni. La version actuelle reste disponible sur la branche ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "main" }),
					" et son déploiement de production."
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "v2-status",
					role: "status",
					children: "V2 clean-slate · aucune fonctionnalité V1 active"
				})
			]
		})
	});
}
//#endregion
export { V2Landing as component };
