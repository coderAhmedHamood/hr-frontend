"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  MULTI_CLICK_MODES,
  MIN_VERTICES_TO_CLOSE,
  FINAL_SHAPE_STYLE,
  PREVIEW_SHAPE_STYLE,
  RUBBER_BAND_STYLE,
  SNAP_HIGHLIGHT_STYLE,
  CLOSING_HINT_STYLE,
} from "../constants/constants";
import {
  buildLineString,
  buildEllipsePolygon,
  buildArrowHead,
  geodesicDistance,
  isCursorNearPin,
  createPinIcon,
} from "./geometry";
import { buildGeoJsonCollection } from "./geojson";
import { safeRequestAnimationFrame } from "../lib/safeRequestAnimationFrame";
import type { HereMapRefs, DrawingState, ShapeType, ShapeMeta, ZoneBoundary } from "../types/types";

// ─────────────────────────────────────────────────────────────────────────────
// useDrawing — all draw-mode event wiring
// ─────────────────────────────────────────────────────────────────────────────

export function useDrawing(refs: HereMapRefs): DrawingState {
  const {
    mapRef, behaviorRef,
    finalGroupRef, previewGroupRef, pinGroupRef,
    containerRef,
  } = refs;

  const multiClickVertices = useRef<H.geo.IPoint[]>([]);
  const singleClickAnchors = useRef<H.geo.IPoint[]>([]);
  const savedShapes        = useRef<ShapeMeta[]>([]);
  const shapeIdCounter     = useRef(0);

  const [drawMode,          setDrawMode         ] = useState<import("../types/types").DrawMode>("select");
  const [drawingStatus,     setDrawingStatus    ] = useState("اختر أداة رسم للبدء.");
  const [savedShapeCount,   setSavedShapeCount  ] = useState(0);
  const [exportedGeoJson,   setExportedGeoJson  ] = useState<string | null>(null);
  const [isActivelyDrawing, setIsActivelyDrawing] = useState(false);
  const [placedVertexCount, setPlacedVertexCount] = useState(0);
  const [isSnappingToClose, setIsSnappingToClose] = useState(false);
  const [isHoveringShape,   setIsHoveringShape  ] = useState(false);

  const clearPreviewLayer = useCallback(
    () => previewGroupRef.current?.removeAll(),
    [previewGroupRef],
  );

  const clearPinLayer = useCallback(
    () => pinGroupRef.current?.removeAll(),
    [pinGroupRef],
  );

  /** Apply fill+stroke; Rect/Circle/Polygon all implement H.map.Spatial.setStyle */
  const applyFinalSpatialStyle = useCallback((mapObject: H.map.Object) => {
    try {
      const style = new H.map.SpatialStyle(FINAL_SHAPE_STYLE);
      const spatial = mapObject as H.map.Spatial;
      if (spatial && typeof spatial.setStyle === "function") {
        spatial.setStyle(style);
      }
    } catch {
      /* HERE runtime may throw on some object types */
    }
  }, []);

  const resetDrawingState = useCallback(() => {
    multiClickVertices.current = [];
    singleClickAnchors.current = [];
    clearPreviewLayer();
    clearPinLayer();
    setIsActivelyDrawing(false);
    setPlacedVertexCount(0);
    setIsSnappingToClose(false);
  }, [clearPreviewLayer, clearPinLayer]);

  const placePinAt = useCallback(
    (position: H.geo.IPoint, isSnapTarget = false) => {
      pinGroupRef.current?.addObject(
        new H.map.DomMarker(position, { icon: createPinIcon(isSnapTarget) }),
      );
    },
    [pinGroupRef],
  );

  const rebuildAllPins = useCallback(() => {
    clearPinLayer();
    multiClickVertices.current.forEach((vertex, index) => {
      const isFirst = index === 0 && multiClickVertices.current.length > 1;
      placePinAt(vertex, isFirst);
    });
  }, [clearPinLayer, placePinAt]);

  const setMapPanning = useCallback(
    (enabled: boolean) => {
      const behavior = behaviorRef.current;
      if (!behavior) return;
      const panFeature = H.mapevents.Behavior.DRAGGING;
      enabled ? behavior.enable(panFeature) : behavior.disable(panFeature);
    },
    [behaviorRef],
  );

  const pointerEventToGeo = useCallback(
    (event: H.mapevents.Event): H.geo.IPoint =>
      mapRef.current!.screenToGeo(
        event.currentPointer.viewportX,
        event.currentPointer.viewportY,
      ),
    [mapRef],
  );

  const commitShape = useCallback(
    (type: ShapeType, mapObject: H.map.Object, skipStyleApplication = false) => {
      if (!skipStyleApplication) {
        applyFinalSpatialStyle(mapObject);
      }
      finalGroupRef.current?.addObject(mapObject);
      savedShapes.current.push({
        id: `zone_${++shapeIdCounter.current}`,
        type,
        mapObject,
      });
      setSavedShapeCount(savedShapes.current.length);
      setExportedGeoJson(buildGeoJsonCollection(savedShapes.current));
      setDrawingStatus("تم حفظ الشكل.");
      setIsActivelyDrawing(false);
      setPlacedVertexCount(0);
      setIsSnappingToClose(false);
      setDrawMode("select");
    },
    [finalGroupRef, applyFinalSpatialStyle],
  );

  const undoLastVertex = useCallback(() => {
    if (multiClickVertices.current.length === 0) return;
    multiClickVertices.current.pop();
    rebuildAllPins();
    const remaining = multiClickVertices.current.length;
    setPlacedVertexCount(remaining);
    if (remaining === 0) {
      setIsActivelyDrawing(false);
      setDrawingStatus("تم التراجع. انقر للبدء من جديد.");
    } else {
      setDrawingStatus(`تم التراجع. تبقى ${remaining} نقطة.`);
    }
  }, [rebuildAllPins]);

  const finishShape = useCallback(() => {
    const vertices = multiClickVertices.current;
    const minRequired = MULTI_CLICK_MODES.has(drawMode)
      ? MIN_VERTICES_TO_CLOSE[drawMode as "line" | "polygon" | "ellipse"]
      : 2;

    if (vertices.length < minRequired) {
      setDrawingStatus(`تحتاج إلى ${minRequired} نقاط على الأقل.`);
      return;
    }

    if (drawMode === "line") {
      const closedPolyline = new H.map.Polyline(
        buildLineString([...vertices, vertices[0]]),
        { style: new H.map.SpatialStyle(FINAL_SHAPE_STYLE) },
      );
      clearPreviewLayer();
      clearPinLayer();
      multiClickVertices.current = [];
      commitShape("line", closedPolyline, true);
      return;
    }

    if (drawMode === "polygon") {
      const polygon = new H.map.Polygon(
        new H.geo.Polygon(buildLineString(vertices, true)),
        { style: new H.map.SpatialStyle(FINAL_SHAPE_STYLE) },
      );
      clearPreviewLayer();
      clearPinLayer();
      multiClickVertices.current = [];
      commitShape("polygon", polygon, true);
      return;
    }

    if (drawMode === "ellipse") {
      const [centre, majorAxisEnd, minorAxisEnd] = vertices;
      const semiMajor = geodesicDistance(centre, majorAxisEnd);
      const semiMinor = geodesicDistance(centre, minorAxisEnd);
      const angleRad  = Math.atan2(
        majorAxisEnd.lng - centre.lng,
        majorAxisEnd.lat - centre.lat,
      );
      const ellipse = buildEllipsePolygon(
        centre,
        semiMajor,
        semiMinor,
        (angleRad * 180) / Math.PI,
      );
      ellipse.setStyle(new H.map.SpatialStyle(FINAL_SHAPE_STYLE));
      clearPreviewLayer();
      clearPinLayer();
      multiClickVertices.current = [];
      commitShape("ellipse", ellipse, true);
    }
  }, [drawMode, clearPreviewLayer, clearPinLayer, commitShape]);

  // ── Keyboard shortcuts ──────────────────────────────────────────────────

  useEffect(() => {
    if (!MULTI_CLICK_MODES.has(drawMode)) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const isUndo =
        event.key === "Backspace" ||
        (event.key === "z" && (event.ctrlKey || event.metaKey));

      if (event.key === "Enter")  { event.preventDefault(); finishShape(); }
      if (event.key === "Escape") { event.preventDefault(); resetDrawingState(); setDrawingStatus("تم إلغاء الرسم."); }
      if (isUndo)                 { event.preventDefault(); undoLastVertex(); }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [drawMode, finishShape, resetDrawingState, undoLastVertex]);

  // ── Main drawing event wiring ───────────────────────────────────────────

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    resetDrawingState();

    if (drawMode === "select") {
      setMapPanning(true);
      setDrawingStatus("تحريك وتكبير الخريطة بحرية.");
      return;
    }

    if (drawMode === "delete") {
      setMapPanning(true);
      setDrawingStatus("انقر على شكل لحذفه.");

      const onPointerMove = (event: H.mapevents.Event) => {
        const isOverSavedShape = savedShapes.current.some(
          (shape) => shape.mapObject === event.target,
        );
        setIsHoveringShape(isOverSavedShape);
      };

      const onTap = (event: H.mapevents.Event) => {
        const shapeIndex = savedShapes.current.findIndex(
          (shape) => shape.mapObject === event.target,
        );
        if (shapeIndex === -1) return;

        const [deletedShape] = savedShapes.current.splice(shapeIndex, 1);
        finalGroupRef.current?.removeObject(deletedShape.mapObject);
        setSavedShapeCount(savedShapes.current.length);
        setExportedGeoJson(
          savedShapes.current.length
            ? buildGeoJsonCollection(savedShapes.current)
            : null,
        );
        setDrawingStatus("تم حذف الشكل.");
        setIsHoveringShape(false);
      };

      map.addEventListener("pointermove", onPointerMove as any);
      map.addEventListener("tap", onTap as any);
      return () => {
        map.removeEventListener("pointermove", onPointerMove as any);
        map.removeEventListener("tap", onTap as any);
        setIsHoveringShape(false);
      };
    }

    if (drawMode === "polygon") {
      setMapPanning(false);
      setDrawingStatus("انقر لتثبيت نقطة.");

      const onPointerMove = (event: H.mapevents.Event) => {
        const vertices = multiClickVertices.current;
        if (vertices.length === 0) return;
        clearPreviewLayer();

        const screenX = event.currentPointer.viewportX;
        const screenY = event.currentPointer.viewportY;
        const snapping =
          vertices.length >= 3 &&
          isCursorNearPin(map, vertices[0], screenX, screenY);
        setIsSnappingToClose(snapping);

        const cursorGeo = snapping ? vertices[0] : pointerEventToGeo(event);
        const edgeStyle = snapping ? SNAP_HIGHLIGHT_STYLE : RUBBER_BAND_STYLE;

        previewGroupRef.current?.addObject(
          new H.map.Polyline(
            buildLineString([vertices[vertices.length - 1], cursorGeo]),
            { style: new H.map.SpatialStyle(edgeStyle) },
          ),
        );
        if (vertices.length >= 2) {
          previewGroupRef.current?.addObject(
            new H.map.Polygon(
              new H.geo.Polygon(buildLineString([...vertices, cursorGeo], true)),
              { style: new H.map.SpatialStyle(snapping ? SNAP_HIGHLIGHT_STYLE : PREVIEW_SHAPE_STYLE) },
            ),
          );
        }
      };

      const onTap = (event: H.mapevents.Event) => {
        const vertices = multiClickVertices.current;
        const screenX  = event.currentPointer.viewportX;
        const screenY  = event.currentPointer.viewportY;

        if (vertices.length >= 3 && isCursorNearPin(map, vertices[0], screenX, screenY)) {
          finishShape();
          return;
        }

        const newVertex = pointerEventToGeo(event);
        vertices.push(newVertex);
        clearPinLayer();
        vertices.forEach((vertex, index) =>
          placePinAt(vertex, index === 0 && vertices.length > 1),
        );
        setPlacedVertexCount(vertices.length);
        setIsActivelyDrawing(true);
        setDrawingStatus(`${vertices.length} نقطة. كليك يمين أو Enter للإنهاء.`);
      };

      const onContextMenu = (event: MouseEvent) => {
        event.preventDefault();
        if (multiClickVertices.current.length >= 3) finishShape();
        else setDrawingStatus("تحتاج إلى ٣ نقاط على الأقل.");
      };

      map.addEventListener("pointermove", onPointerMove as any);
      map.addEventListener("tap", onTap as any);
      containerRef.current?.addEventListener("contextmenu", onContextMenu);
      return () => {
        map.removeEventListener("pointermove", onPointerMove as any);
        map.removeEventListener("tap", onTap as any);
        containerRef.current?.removeEventListener("contextmenu", onContextMenu);
        resetDrawingState();
        setMapPanning(true);
      };
    }

    if (drawMode === "rectangle") {
      setMapPanning(false);
      setDrawingStatus("انقر لتثبيت الزاوية الأولى.");

      const onPointerMove = (event: H.mapevents.Event) => {
        if (singleClickAnchors.current.length === 0) return;
        clearPreviewLayer();
        const bounds = H.geo.Rect.coverPoints([
          singleClickAnchors.current[0],
          pointerEventToGeo(event),
        ]);
        previewGroupRef.current?.addObject(
          new H.map.Rect(bounds, {
            style: new H.map.SpatialStyle(PREVIEW_SHAPE_STYLE),
          }),
        );
      };

      const onTap = (event: H.mapevents.Event) => {
        const tappedPoint = pointerEventToGeo(event);
        if (singleClickAnchors.current.length === 0) {
          singleClickAnchors.current.push(tappedPoint);
          placePinAt(tappedPoint);
          setIsActivelyDrawing(true);
          setDrawingStatus("تم تثبيت الزاوية. انقر الزاوية المقابلة.");
        } else {
          const bounds = H.geo.Rect.coverPoints([
            singleClickAnchors.current[0],
            tappedPoint,
          ]);
          clearPreviewLayer();
          clearPinLayer();
          singleClickAnchors.current = [];
          const rect = new H.map.Rect(bounds, {
            style: new H.map.SpatialStyle(FINAL_SHAPE_STYLE),
          });
          commitShape("rectangle", rect, true);
        }
      };

      map.addEventListener("pointermove", onPointerMove as any);
      map.addEventListener("tap", onTap as any);
      return () => {
        map.removeEventListener("pointermove", onPointerMove as any);
        map.removeEventListener("tap", onTap as any);
        resetDrawingState();
        setMapPanning(true);
      };
    }

    if (drawMode === "circle") {
      setMapPanning(false);
      setDrawingStatus("انقر لتثبيت مركز الدائرة.");

      const onPointerMove = (event: H.mapevents.Event) => {
        if (singleClickAnchors.current.length === 0) return;
        clearPreviewLayer();
        const centre = singleClickAnchors.current[0];
        const radius = geodesicDistance(centre, pointerEventToGeo(event));
        previewGroupRef.current?.addObject(
          new H.map.Circle(centre, radius, {
            style: new H.map.SpatialStyle(PREVIEW_SHAPE_STYLE),
          }),
        );
      };

      const onTap = (event: H.mapevents.Event) => {
        const tappedPoint = pointerEventToGeo(event);
        if (singleClickAnchors.current.length === 0) {
          singleClickAnchors.current.push(tappedPoint);
          placePinAt(tappedPoint);
          setIsActivelyDrawing(true);
          setDrawingStatus("تم تثبيت المركز. انقر لتحديد نصف القطر.");
        } else {
          const centre = singleClickAnchors.current[0];
          const radius = geodesicDistance(centre, tappedPoint);
          clearPreviewLayer();
          clearPinLayer();
          singleClickAnchors.current = [];
          const circle = new H.map.Circle(centre, radius, {
            style: new H.map.SpatialStyle(FINAL_SHAPE_STYLE),
          });
          commitShape("circle", circle as unknown as H.map.Polygon, true);
        }
      };

      map.addEventListener("pointermove", onPointerMove as any);
      map.addEventListener("tap", onTap as any);
      return () => {
        map.removeEventListener("pointermove", onPointerMove as any);
        map.removeEventListener("tap", onTap as any);
        resetDrawingState();
        setMapPanning(true);
      };
    }

    if (drawMode === "ellipse") {
      setMapPanning(false);
      setDrawingStatus("انقر لتثبيت مركز البيضاوي.");

      const onPointerMove = (event: H.mapevents.Event) => {
        const vertices = multiClickVertices.current;
        if (vertices.length === 0) return;
        clearPreviewLayer();

        const cursorGeo = pointerEventToGeo(event);

        if (vertices.length === 1) {
          previewGroupRef.current?.addObject(
            new H.map.Polyline(buildLineString([vertices[0], cursorGeo]), {
              style: new H.map.SpatialStyle(RUBBER_BAND_STYLE),
            }),
          );
        } else if (vertices.length === 2) {
          const semiMajor = geodesicDistance(vertices[0], vertices[1]);
          const semiMinor = geodesicDistance(vertices[0], cursorGeo);
          const angleRad  = Math.atan2(
            vertices[1].lng - vertices[0].lng,
            vertices[1].lat - vertices[0].lat,
          );
          const preview = buildEllipsePolygon(
            vertices[0], semiMajor, semiMinor, (angleRad * 180) / Math.PI,
          );
          preview.setStyle(new H.map.SpatialStyle(PREVIEW_SHAPE_STYLE));
          previewGroupRef.current?.addObject(preview);
        }
      };

      const onTap = (event: H.mapevents.Event) => {
        const vertices  = multiClickVertices.current;
        const newVertex = pointerEventToGeo(event);
        vertices.push(newVertex);
        placePinAt(newVertex);
        setPlacedVertexCount(vertices.length);
        setIsActivelyDrawing(true);

        if (vertices.length === 1)      setDrawingStatus("تم تثبيت المركز. انقر لتحديد المحور الكبير.");
        else if (vertices.length === 2) setDrawingStatus("تم تثبيت المحور الكبير. انقر لتحديد المحور الصغير.");
        else                            finishShape();
      };

      const onContextMenu = (event: MouseEvent) => {
        event.preventDefault();
        finishShape();
      };

      map.addEventListener("pointermove", onPointerMove as any);
      map.addEventListener("tap", onTap as any);
      containerRef.current?.addEventListener("contextmenu", onContextMenu);
      return () => {
        map.removeEventListener("pointermove", onPointerMove as any);
        map.removeEventListener("tap", onTap as any);
        containerRef.current?.removeEventListener("contextmenu", onContextMenu);
        resetDrawingState();
        setMapPanning(true);
      };
    }

    if (drawMode === "line") {
      setMapPanning(false);
      setDrawingStatus("انقر لتثبيت النقطة الأولى.");

      const onPointerMove = (event: H.mapevents.Event) => {
        const vertices = multiClickVertices.current;
        if (vertices.length === 0) return;
        clearPreviewLayer();

        const screenX  = event.currentPointer.viewportX;
        const screenY  = event.currentPointer.viewportY;
        const snapping =
          vertices.length >= 2 &&
          isCursorNearPin(map, vertices[0], screenX, screenY);
        setIsSnappingToClose(snapping);

        const cursorGeo = snapping ? vertices[0] : pointerEventToGeo(event);

        if (vertices.length >= 2) {
          previewGroupRef.current?.addObject(
            new H.map.Polyline(buildLineString(vertices), {
              style: new H.map.SpatialStyle(FINAL_SHAPE_STYLE),
            }),
          );
        }

        previewGroupRef.current?.addObject(
          new H.map.Polyline(
            buildLineString([vertices[vertices.length - 1], cursorGeo]),
            { style: new H.map.SpatialStyle(snapping ? SNAP_HIGHLIGHT_STYLE : RUBBER_BAND_STYLE) },
          ),
        );

        if (vertices.length >= 2 && !snapping) {
          previewGroupRef.current?.addObject(
            new H.map.Polyline(buildLineString([cursorGeo, vertices[0]]), {
              style: new H.map.SpatialStyle(CLOSING_HINT_STYLE),
            }),
          );
        }
      };

      const onTap = (event: H.mapevents.Event) => {
        const vertices = multiClickVertices.current;
        const screenX  = event.currentPointer.viewportX;
        const screenY  = event.currentPointer.viewportY;

        if (vertices.length >= 2 && isCursorNearPin(map, vertices[0], screenX, screenY)) {
          finishShape();
          return;
        }

        const newVertex = pointerEventToGeo(event);
        vertices.push(newVertex);

        clearPinLayer();
        vertices.forEach((vertex, index) =>
          placePinAt(vertex, index === 0 && vertices.length > 1),
        );

        setPlacedVertexCount(vertices.length);
        setIsActivelyDrawing(true);

        if (vertices.length === 1)
          setDrawingStatus("تم تثبيت النقطة الأولى. انقر لإضافة نقاط.");
        else
          setDrawingStatus(`${vertices.length} نقاط. انقر قرب النقطة الأولى للإغلاق.`);
      };

      const onContextMenu = (event: MouseEvent) => {
        event.preventDefault();
        if (multiClickVertices.current.length >= 2) finishShape();
        else setDrawingStatus("تحتاج إلى نقطتين على الأقل.");
      };

      map.addEventListener("pointermove", onPointerMove as any);
      map.addEventListener("tap", onTap as any);
      containerRef.current?.addEventListener("contextmenu", onContextMenu);
      return () => {
        map.removeEventListener("pointermove", onPointerMove as any);
        map.removeEventListener("tap", onTap as any);
        containerRef.current?.removeEventListener("contextmenu", onContextMenu);
        resetDrawingState();
        setMapPanning(true);
      };
    }

    if (drawMode === "arrow") {
      setMapPanning(false);
      setDrawingStatus("انقر لتثبيت ذيل السهم.");

      const onPointerMove = (event: H.mapevents.Event) => {
        if (singleClickAnchors.current.length === 0) return;
        clearPreviewLayer();

        const shaftStart = singleClickAnchors.current[0];
        const cursorGeo  = pointerEventToGeo(event);

        previewGroupRef.current?.addObject(
          new H.map.Polyline(buildLineString([shaftStart, cursorGeo]), {
            style: new H.map.SpatialStyle(RUBBER_BAND_STYLE),
          }),
        );

        if (geodesicDistance(shaftStart, cursorGeo) > 1) {
          const arrowHeadPreview = buildArrowHead(shaftStart, cursorGeo);
          arrowHeadPreview.setStyle(
            new H.map.SpatialStyle({
              ...PREVIEW_SHAPE_STYLE,
              fillColor: "rgba(96,165,250,0.55)",
            }),
          );
          previewGroupRef.current?.addObject(arrowHeadPreview);
        }
      };

      const onTap = (event: H.mapevents.Event) => {
        const tappedPoint = pointerEventToGeo(event);

        if (singleClickAnchors.current.length === 0) {
          singleClickAnchors.current.push(tappedPoint);
          placePinAt(tappedPoint);
          setIsActivelyDrawing(true);
          setDrawingStatus("تم تثبيت الذيل. انقر لتحديد رأس السهم.");
        } else {
          const shaftStart = singleClickAnchors.current[0];
          const shaft = new H.map.Polyline(
            buildLineString([shaftStart, tappedPoint]),
            { style: new H.map.SpatialStyle(FINAL_SHAPE_STYLE) },
          );
          const head = buildArrowHead(shaftStart, tappedPoint);

          clearPreviewLayer();
          clearPinLayer();
          singleClickAnchors.current = [];

          finalGroupRef.current?.addObject(shaft);
          finalGroupRef.current?.addObject(head);
          savedShapes.current.push({
            id: `zone_${++shapeIdCounter.current}`,
            type: "arrow",
            mapObject: shaft,
          });
          setSavedShapeCount(savedShapes.current.length);
          setExportedGeoJson(buildGeoJsonCollection(savedShapes.current));
          setDrawingStatus("تم حفظ السهم.");
          setIsActivelyDrawing(false);
          setPlacedVertexCount(0);
          setDrawMode("select");
        }
      };

      map.addEventListener("pointermove", onPointerMove as any);
      map.addEventListener("tap", onTap as any);
      return () => {
        map.removeEventListener("pointermove", onPointerMove as any);
        map.removeEventListener("tap", onTap as any);
        resetDrawingState();
        setMapPanning(true);
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawMode, refs.mapRef.current]);

  const clearAllShapes = useCallback(() => {
    finalGroupRef.current?.removeAll();
    savedShapes.current = [];
    setSavedShapeCount(0);
    setExportedGeoJson(null);
    resetDrawingState();
    setDrawingStatus("تم مسح جميع الأشكال.");
  }, [finalGroupRef, resetDrawingState]);

  const loadBoundary = useCallback((boundary: ZoneBoundary) => {
    if (!boundary?.coordinates?.[0] || boundary.coordinates[0].length < 3) return;
    const map = mapRef.current;
    if (!map || !finalGroupRef.current) return;

    try {
      clearAllShapes();

      const ring = boundary.coordinates[0];
      const lineString = new H.geo.LineString();
      ring.forEach(([lng, lat]) => lineString.pushLatLngAlt(lat, lng, 0));

      const polygon = new H.map.Polygon(
        new H.geo.Polygon(lineString),
        { style: new H.map.SpatialStyle(FINAL_SHAPE_STYLE) },
      );

      finalGroupRef.current?.addObject(polygon);
      savedShapes.current.push({
        id: `zone_${++shapeIdCounter.current}`,
        type: "polygon",
        mapObject: polygon,
      });
      setSavedShapeCount(1);
      setExportedGeoJson(buildGeoJsonCollection(savedShapes.current));
      setDrawingStatus("تم تحميل حدود المنطقة.");

      map.getViewModel().setLookAtData({
        bounds: polygon.getBoundingBox(),
      });
      // Slightly zoom out after fitting bounds for a better surrounding context.
      safeRequestAnimationFrame(() => {
        const currentZoom = map.getZoom?.();
        if (typeof currentZoom === "number") {
          map.getViewModel().setLookAtData({
            zoom: Math.max(currentZoom - 0.9, 2),
          });
        }
      });
    } catch (err) {
    }
  }, [mapRef, finalGroupRef, clearAllShapes]);

  const getFirstPolygonBoundary = useCallback((): ZoneBoundary | null => {
    if (!exportedGeoJson) return null;
    try {
      const collection = JSON.parse(exportedGeoJson);
      const polygonFeature = collection?.features?.find(
        (f: any) => f.geometry?.type === "Polygon",
      );
      if (!polygonFeature) return null;
      return {
        type: "Polygon",
        coordinates: polygonFeature.geometry.coordinates,
      };
    } catch {
      return null;
    }
  }, [exportedGeoJson]);

  return {
    drawMode,
    setDrawMode,
    drawingStatus,
    savedShapeCount,
    exportedGeoJson,
    isActivelyDrawing,
    placedVertexCount,
    isSnappingToClose,
    isHoveringShape,
    finishShape,
    undoLastVertex,
    loadBoundary,
    clearAllShapes,
    getFirstPolygonBoundary,
  };
}
