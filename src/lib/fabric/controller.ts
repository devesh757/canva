import type {
  Canvas as FabricCanvas,
  FabricImage as FabricImageT,
} from "fabric";
import type { FabricMod } from "./helpers";
import type { CanvasController } from "./registry";
import { clamp, slug, uid } from "@/lib/utils";

type Obj = import("fabric").FabricObject;

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function createController(
  fabric: FabricMod,
  canvas: FabricCanvas,
  api: {
    getW(): number;
    getH(): number;
    getSnapshot(): string;
    commit(): void;
    syncSelection(): void;
    refreshLayers(): void;
    saveNow(json: string, thumbnail: string): void;
    getTitle(): string;
  }
): CanvasController {
  const { Textbox, Rect, Circle, Ellipse, Triangle, Path, FabricImage, filters, Shadow, Gradient } =
    fabric;
  const serialize = () => api.getSnapshot();
  const commitAndSync = () => {
    api.commit();
    api.syncSelection();
    api.refreshLayers();
    canvas.requestRenderAll();
  };

  const controller: CanvasController = {
    async addText(preset = {}) {
      const W = api.getW();
      const H = api.getH();
      const box = new Textbox(
        (preset.text as string) ?? "Double-click to edit",
        {
          left: 100,
          top: 100,
          width: Math.min(560, W * 0.7),
          fontSize: Math.max(26, Math.round(W * 0.045)),
          fontFamily: "Inter",
          fontWeight: 700,
          fill: "#FFFFFF",
          textAlign: "left",
          editable: true,
          objectCaching: true,
          data: { layerId: uid(), kind: "text" },
          ...preset,
        } as never
      );
      canvas.add(box as Obj);
      canvas.setActiveObject(box);
      canvas.requestRenderAll();
      api.commit();
      api.syncSelection();
      api.refreshLayers();
    },

    async addShape(shape, opts = {}) {
      const W = api.getW();
      const H = api.getH();
      const size = Math.round(Math.max(80, Math.min(W, H) * 0.25));
      const base = {
        left: Math.round((W - size) / 2),
        top: Math.round((H - size) / 2),
        fill: "#A855F7",
        opacity: 1,
        data: { layerId: uid(), kind: "shape" },
        ...opts,
      } as Record<string, unknown>;

      let obj: Obj;
      switch (shape) {
        case "circle":
          obj = new Circle({ radius: size / 2, ...base } as never);
          break;
        case "triangle":
          obj = new Triangle({ width: size, height: size, ...base } as never);
          break;
        case "ellipse":
          obj = new Ellipse({
            rx: (base.width as number) ? (base.width as number) / 2 : size / 2,
            ry: (base.height as number) ? (base.height as number) / 2 : size / 2,
            ...base,
          } as never);
          break;
        default:
          obj = new Rect({
            width: size,
            height: size,
            rx: 12,
            ry: 12,
            ...base,
          } as never);
      }
      if (base.left !== undefined && base.top !== undefined) {
        obj.set({ left: base.left as number, top: base.top as number });
      }
      canvas.add(obj);
      canvas.setActiveObject(obj);
      canvas.requestRenderAll();
      api.commit();
      api.syncSelection();
      api.refreshLayers();
    },

    async addImage(dataUrl) {
      const W = api.getW();
      const H = api.getH();
      const img = await FabricImage.fromURL(dataUrl, { crossOrigin: "anonymous" });
      const iw = img.width ?? 800;
      const ih = img.height ?? 600;
      const k = Math.min((W * 0.7) / iw, (H * 0.7) / ih, 1);
      img.scale(k);
      img.set({
        left: Math.round((W - iw * k) / 2),
        top: Math.round((H - ih * k) / 2),
      });
      img.set("data", { layerId: uid(), kind: "image" });
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.requestRenderAll();
      api.commit();
      api.syncSelection();
      api.refreshLayers();
    },

    async addPath(rawPath, opts = {}, _label = "Path") {
      if (!canvas || !fabric) return;
      const W = api.getW();
      const H = api.getH();
      // paths authored on a 24x24 grid — grow them to a comfortable icon size
      const size = Math.max(90, Math.round(Math.min(W, H) * 0.15));
      const obj = new Path(rawPath, {
        fill: opts.fill ?? "#A855F7",
        left: clamp((opts.left as number) ?? Math.round(W * 0.38), 0, W - size),
        top: clamp((opts.top as number) ?? Math.round(H * 0.4), 0, H - size),
        scaleX: (opts.scaleX as number) ?? size / 24,
        scaleY: (opts.scaleY as number) ?? size / 24,
        opacity: (opts.opacity as number) ?? 1,
        data: { layerId: uid(), kind: "icon" },
      } as never) as unknown as Obj;
      canvas.add(obj);
      canvas.setActiveObject(obj);
      canvas.requestRenderAll();
      api.commit();
      api.syncSelection();
      api.refreshLayers();
    },

    async addLine(color) {
      if (!canvas || !fabric) return;
      const W = api.getW();
      const H = api.getH();
      const len = Math.max(200, W * 0.45);
      const obj = new fabric.Line(
        [W * 0.2, H * 0.5, W * 0.2 + len, H * 0.5],
        {
          stroke: color,
          strokeWidth: 6,
          strokeLineCap: "round",
          data: { layerId: uid(), kind: "shape" },
        } as never
      ) as unknown as Obj;
      obj.left = W * 0.2;
      obj.top = H * 0.5 - 3;
      canvas.add(obj);
      canvas.setActiveObject(obj);
      canvas.requestRenderAll();
      api.commit();
      api.syncSelection();
      api.refreshLayers();
    },

    async loadTemplate(json) {
      await canvas.loadFromJSON(json);
      try {
        const bg = JSON.parse(json).background;
        canvas.backgroundColor = bg ?? "#ffffff";
      } catch {
        /* noop */
      }
      canvas.requestRenderAll();
      for (const o of canvas.getObjects()) {
        const data = (o.data ?? {}) as Record<string, unknown>;
        if (!data.layerId) o.set("data", { ...data, layerId: uid() });
      }
      api.commit();
      api.syncSelection();
      api.refreshLayers();
    },

    setCanvasBackground(color) {
      canvas.backgroundColor = color;
      canvas.requestRenderAll();
      api.commit();
    },

    async applyCommands(commands) {
      const W = api.getW();
      const H = api.getH();
      for (const c of commands) {
        try {
          switch (c.type) {
            case "setCanvas":
              canvas.backgroundColor = c.background ?? canvas.backgroundColor;
              break;
            case "addText":
              await controller.addText({
                text: c.text,
                left: clamp(Math.round(c.left ?? 64), 8, W - 48),
                top: clamp(Math.round(c.top ?? 64), 8, H - 48),
                fontSize: c.fontSize,
                fontWeight: c.fontWeight ?? 700,
                fill: c.fill ?? "#FFFFFF",
                width: clamp(Math.round(c.width ?? 600), 80, W),
                textAlign: c.textAlign ?? "left",
                fontFamily: c.fontFamily ?? "Inter",
              });
              break;
            case "addShape": {
              const w = Math.min(c.width ?? 220, W * 0.7);
              const h = Math.min(c.height ?? 220, H * 0.7);
              await controller.addShape(c.shape, {
                left: clamp(Math.round(c.left ?? 80), -w / 2, W - w / 2),
                top: clamp(Math.round(c.top ?? 80), -h / 2, H - h / 2),
                width: w,
                height: h,
                fill: c.fill ?? "#A855F7",
                opacity: c.opacity ?? 0.9,
                ...(c.shape === "rect" && c.radius
                  ? { rx: c.radius, ry: c.radius }
                  : {}),
                ...(c.shape === "circle" ? { radius: w / 2 } : {}),
                ...(c.shape === "ellipse" ? { rx: w / 2, ry: h / 2 } : {}),
              });
              break;
            }
            case "setText": {
              for (const o of canvas.getObjects()) {
                const text = (o as unknown as { text?: string }).text;
                if (typeof text === "string" && text.includes(c.find)) {
                  const replaced = text.split(c.find).join(c.replace);
                  o.set("text", replaced);
                  (o as unknown as { initDimensions?: () => void }).initDimensions?.();
                  o.setCoords();
                }
              }
              break;
            }
            case "setOverlay": {
              const overlay = new Rect({
                left: 0,
                top: 0,
                width: W,
                height: H,
                fill: c.fill,
                opacity: c.opacity ?? 0.4,
                selectable: true,
                data: { layerId: uid(), kind: "overlay" },
              } as never);
              canvas.add(overlay);
              canvas.sendObjectToBack(overlay);
              break;
            }
          }
        } catch (err) {
          console.error("[canvas] AI command failed:", c.type, err);
        }
      }
      api.commit();
      api.refreshLayers();
      api.syncSelection();
      canvas.requestRenderAll();
    },

    modifySelection(props) {
      const a = canvas.getActiveObject();
      if (!a) return;
      a.set(props as never);
      if ("fontSize" in props || "width" in props || "text" in props) {
        (a as unknown as { initDimensions?: () => void }).initDimensions?.();
      }
      a.setCoords();
      canvas.requestRenderAll();
      api.commit();
      api.syncSelection();
    },

    applyTextEffect(mode) {
      const a = canvas.getActiveObject();
      if (!a) return;
      let shadow: import("fabric").Shadow | undefined;
      switch (mode) {
        case "soft":
          shadow = new Shadow({ color: "rgba(0,0,0,0.45)", blur: 18, offsetX: 0, offsetY: 8 });
          break;
        case "hard":
          shadow = new Shadow({ color: "#000000", blur: 0, offsetX: 7, offsetY: 7 });
          break;
        case "glow":
          shadow = new Shadow({ color: "#A855F7", blur: 26, offsetX: 0, offsetY: 0 });
          break;
        case "none":
        default:
          shadow = undefined;
      }
      if (shadow) a.set("shadow", shadow);
      else a.set("shadow", undefined);
      canvas.requestRenderAll();
      api.commit();
    },

    applyGradient(from, to, angle) {
      const a = canvas.getActiveObject();
      if (!a) return;
      const w = a.width ?? 100;
      const h = a.height ?? 100;
      const coords =
        angle === "h"
          ? { x1: 0, y1: 0, x2: 1, y2: 0 }
          : angle === "v"
            ? { x1: 0, y1: 0, x2: 0, y2: 1 }
            : { x1: 0, y1: 0, x2: 1, y2: 1 };
      const grad = new Gradient({
        type: "linear",
        gradientUnits: "percentage",
        coords,
        colorStops: [
          { offset: 0, color: from },
          { offset: 1, color: to },
        ],
      });
      a.set("fill", grad as never);
      canvas.requestRenderAll();
      api.commit();
      api.syncSelection();
    },

    applyImageFilter(key, value) {
      const a = canvas.getActiveObject() as FabricImageT | null;
      if (!a || !(a instanceof FabricImage)) return;
      const defaults: Record<string, number> = {
        brightness: 0.05,
        contrast: 0.05,
        saturation: 0.15,
        blur: 0.08,
        hue: 0.1,
      };
      // strip existing instances of the same filter, then add fresh
      a.filters = a.filters.filter(
        (f) => (f as unknown as { type: string }).type !== capitalize(key)
      );
      switch (key) {
        case "grayscale":
          a.filters.push(new filters.Grayscale());
          break;
        case "sepia":
          a.filters.push(new filters.Sepia());
          break;
        case "invert":
          a.filters.push(new filters.Invert());
          break;
        case "brownie":
          a.filters.push(new filters.Brownie());
          break;
        case "vintage":
          a.filters.push(new filters.Vintage());
          break;
        case "brightness":
          a.filters.push(
            new filters.Brightness({ brightness: value ?? defaults.brightness })
          );
          break;
        case "contrast":
          a.filters.push(
            new filters.Contrast({ contrast: value ?? defaults.contrast })
          );
          break;
        case "saturation":
          a.filters.push(
            new filters.Saturation({ saturation: value ?? defaults.saturation })
          );
          break;
        case "blur":
          a.filters.push(new filters.Blur({ blur: value ?? defaults.blur }));
          break;
        case "hue":
          a.filters.push(
            new filters.HueRotation({ rotation: value ?? defaults.hue })
          );
          break;
        default:
          return;
      }
      a.applyFilters();
      canvas.requestRenderAll();
      api.commit();
    },

    resetImageFilters() {
      const a = canvas.getActiveObject() as FabricImageT | null;
      if (!a || !(a instanceof FabricImage)) return;
      a.filters = [];
      a.applyFilters();
      canvas.requestRenderAll();
      api.commit();
    },

    deleteSelection() {
      const actives = canvas.getActiveObjects();
      if (!actives.length) return;
      actives.forEach((o) => canvas.remove(o));
      canvas.discardActiveObject();
      canvas.requestRenderAll();
      api.commit();
      api.syncSelection();
      api.refreshLayers();
    },

    async duplicateSelection() {
      const a = canvas.getActiveObject();
      if (!a) return;
      try {
        const clone: Obj = await a.clone();
        clone.set({ left: (a.left ?? 0) + 24, top: (a.top ?? 0) + 24 });
        clone.set("data", { layerId: uid() });
        canvas.add(clone);
        canvas.setActiveObject(clone);
        canvas.requestRenderAll();
        api.commit();
        api.syncSelection();
        api.refreshLayers();
      } catch (e) {
        console.error("[canvas] duplicate failed", e);
      }
    },

    toggleLockSelection() {
      const a = canvas.getActiveObject() as Obj & {
        lockMovementX?: boolean;
      };
      if (!a) return;
      const locked = !a.lockMovementX;
      a.set({
        lockMovementX: locked,
        lockMovementY: locked,
        lockRotation: locked,
        lockScalingX: locked,
        lockScalingY: locked,
      } as never);
      canvas.requestRenderAll();
      api.commit();
      api.syncSelection();
    },

    toggleVisibilitySelection() {
      const a = canvas.getActiveObject();
      if (!a) return;
      a.visible = !a.visible;
      canvas.requestRenderAll();
      api.commit();
      api.refreshLayers();
    },

    alignSelection(mode) {
      const a = canvas.getActiveObject();
      if (!a) return;
      const W = api.getW();
      const H = api.getH();
      const r = a.getBoundingRect();
      switch (mode) {
        case "left":
          a.left = (a.left ?? 0) - r.left;
          break;
        case "center":
          a.left = (a.left ?? 0) + ((W - r.width) / 2 - r.left);
          break;
        case "right":
          a.left = (a.left ?? 0) + (W - r.width - r.left);
          break;
        case "top":
          a.top = (a.top ?? 0) + (0 - r.top);
          break;
        case "middle":
          a.top = (a.top ?? 0) + ((H - r.height) / 2 - r.top);
          break;
        case "bottom":
          a.top = (a.top ?? 0) + (H - r.height - r.top);
          break;
      }
      a.setCoords();
      canvas.requestRenderAll();
      api.commit();
      api.syncSelection();
    },

    layerOrder(mode) {
      const a = canvas.getActiveObject();
      if (!a) return;
      switch (mode) {
        case "front":
          canvas.bringObjectToFront(a);
          break;
        case "back":
          canvas.sendObjectToBack(a);
          break;
        case "forward":
          canvas.bringObjectForward(a);
          break;
        case "backward":
          canvas.sendObjectBackwards(a);
          break;
        case "index":
          break;
      }
      canvas.requestRenderAll();
      api.commit();
      api.refreshLayers();
      api.syncSelection();
    },

    reorderBySelectionDelta(delta) {
      const a = canvas.getActiveObject();
      if (!a) return;
      const cur = canvas.getObjects().indexOf(a);
      canvas.moveObjectTo(a, clamp(cur + delta, 0, canvas.getObjects().length - 1));
      canvas.requestRenderAll();
      api.commit();
      api.refreshLayers();
    },

    selectLayerById(id) {
      for (const o of canvas.getObjects()) {
        const data = (o.data ?? {}) as Record<string, unknown>;
        if (data.layerId === id) {
          canvas.setActiveObject(o);
          canvas.requestRenderAll();
          api.syncSelection();
          return;
        }
      }
    },

    getActiveJSON(): string {
      const json = canvas.toObject(["data"]) as Record<string, unknown>;
      json.version = fabric.version ?? "6.x";
      json.background = canvas.backgroundColor;
      return JSON.stringify(json);
    },

    getThumbnailDataUrl(): string {
      const W = api.getW();
      return canvas.toDataURL({
        format: "jpeg",
        quality: 0.5,
        multiplier: Math.min(1, 220 / Math.max(W, 1)),
      }) as string;
    },

    async exportAs(format, scale) {
      const W = api.getW();
      const H = api.getH();
      canvas.discardActiveObject();
      canvas.requestRenderAll();
      const fileName = slug(api.getTitle() || "export");

      if (format === "pdf") {
        const { jsPDF } = await import("jspdf");
        const target = Math.max(2400, W, H);
        const multiplier = Math.min(2, target / Math.max(W, 1));
        const dataUrl = canvas.toDataURL({
          format: "png",
          multiplier,
        }) as string;
        const img = new Image();
        await new Promise<void>((res) => {
          img.onload = () => res();
          img.src = dataUrl;
        });
        const w = Math.round(W * multiplier);
        const h = Math.round(H * multiplier);
        const orientation = w >= h ? "landscape" : "portrait";
        const doc = new jsPDF({
          orientation,
          unit: "px",
          format: [w, h],
          hotfixes: ["px_scaling"],
        });
        doc.addImage(dataUrl, "PNG", 0, 0, w, h, undefined, "SLOW");
        doc.save(`${fileName}.pdf`);
        return { fileName };
      }

      const multiplier = scale ?? 2;
      const url = canvas.toDataURL({
        format: format === "jpeg" ? "jpeg" : "png",
        quality: format === "jpeg" ? 0.92 : 1,
        multiplier,
      }) as string;
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName}.${format === "jpeg" ? "jpg" : "png"}`;
      a.click();
      return { dataUrl: url, fileName };
    },

    saveNow() {
      api.saveNow(serialize(), String(controller.getThumbnailDataUrl()));
    },
  };

  return controller;
}
