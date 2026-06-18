/**
 * Minimal HERE Maps JS API v3.1 typings — SDK loads from CDN at runtime.
 */

export {};

declare global {
  namespace H {
    namespace geo {
      interface IPoint {
        lat: number;
        lng: number;
      }

      class Point {
        constructor(lat: number, lng: number);
        distance(other: Point): number;
      }

      class LineString {
        pushLatLngAlt(lat: number, lng: number, alt: number): void;
        eachLatLngAlt(cb: (lat: number, lng: number, alt: number) => void): void;
      }

      class Polygon {
        constructor(lineString: LineString);
      }

      class Rect {
        static coverPoints(points: IPoint[]): Rect;
      }
    }

    namespace map {
      namespace SpatialStyle {
        interface Options {
          fillColor?: string;
          strokeColor?: string;
          lineWidth?: number;
          lineDash?: number[];
        }
      }

      class SpatialStyle {
        constructor(options?: SpatialStyle.Options);
      }

      class Object {
        getBoundingBox(): geo.Rect;
      }

      interface Spatial extends Object {
        setStyle(style: SpatialStyle): void;
      }

      class Group extends Object {
        addObject(obj: Object): void;
        removeAll(): void;
        removeObject(obj: Object): void;
      }

      class DomIcon {
        constructor(element: HTMLElement);
      }

      class DomMarker extends Object {
        constructor(position: geo.IPoint, options?: { icon: DomIcon });
      }

      class Polyline extends Object {
        constructor(lineString: geo.LineString, options?: { style?: SpatialStyle });
      }

      class Polygon extends Object {
        constructor(geoPolygon: geo.Polygon, options?: { style?: SpatialStyle });
        getBoundingBox(): geo.Rect;
        setStyle(style: SpatialStyle): void;
      }

      class Circle extends Object {
        constructor(center: geo.IPoint, radius: number, options?: { style?: SpatialStyle });
      }

      class Rect extends Object {
        constructor(bounds: geo.Rect, options?: { style?: SpatialStyle });
      }

      namespace layer {
        class Layer {}
      }
    }

    namespace mapevents {
      class Event {
        currentPointer: { viewportX: number; viewportY: number };
        target: map.Object;
      }

      class MapEvents {
        constructor(map: Map);
      }

      class Behavior {
        static DRAGGING: unknown;
        constructor(events: MapEvents);
        enable(feature: unknown): void;
        disable(feature: unknown): void;
      }
    }

    namespace ui {
      class UI {
        static createDefault(map: Map, layers: service.DefaultLayers, ...args: unknown[]): void;
      }
    }

    namespace service {
      interface DefaultLayers {
        vector: { normal: { map: map.layer.Layer } };
      }

      class Platform {
        constructor(options: { apikey: string });
        createDefaultLayers(options?: { lg?: string }): unknown;
      }
    }

    class Map {
      constructor(
        element: HTMLElement,
        baseLayer: map.layer.Layer,
        options: { zoom: number; center: geo.IPoint; pixelRatio: number },
      );
      addObject(obj: map.Object): void;
      dispose(): void;
      geoToScreen(point: geo.IPoint): { x: number; y: number } | null;
      screenToGeo(x: number, y: number): geo.IPoint;
      setZoom(zoom: number, animate?: boolean): void;
      getZoom(): number;
      setCenter(point: geo.IPoint, animate?: boolean): void;
      getViewPort(): { resize(): void };
      getViewModel(): {
        setLookAtData(
          data: { position?: geo.IPoint; zoom?: number; bounds?: geo.Rect },
          animate?: boolean,
        ): void;
      };
      addEventListener(type: string, listener: (evt: mapevents.Event) => void): void;
      removeEventListener(type: string, listener: (evt: mapevents.Event) => void): void;
    }
  }

  interface Window {
    H: typeof H;
  }
}
