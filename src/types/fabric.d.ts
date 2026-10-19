// Fabric.js v6 keeps custom props (like `data`) outside its base typings;
// augment once, globally, for a clean API across the editor.
declare module "fabric" {
  interface FabricObject<
    Props extends Record<string, unknown> = Record<string, unknown>,
    SProps extends Record<string, unknown> = Record<string, unknown>,
    EventSpec extends import("fabric/dist/src/EventTypeDefs").ObjectEvents = import("fabric/dist/src/EventTypeDefs").ObjectEvents
  > {
    data?: Record<string, unknown>;
  }
}

export {};
