//#region node_modules/.nitro/vite/services/ssr/index.js
var serverEntryPromise;
async function getServerEntry() {
	serverEntryPromise ??= import("./server-Caoo7o_3.mjs").then((n) => n.t).then((module) => module.default ?? module);
	return serverEntryPromise;
}
var server_default = { async fetch(request, env, ctx) {
	return (await getServerEntry()).fetch(request, env, ctx);
} };
//#endregion
export { server_default as default };
