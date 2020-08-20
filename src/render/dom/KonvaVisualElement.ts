import { VisualElement } from "../VisualElement"
import Konva from "konva"
import { AxisBox2D, Point2D } from "../../types/geometry"
import {
    axisBox,
    convertBoundingBoxToAxisBox,
    transformBoundingBox,
} from "../../utils/geometry"
import { ResolvedValues } from "../types"
import { DOMVisualElementConfig } from "./types"
import { isTransformProp } from "./utils/transform"
import { getDefaultValueType } from "./utils/value-types"
import {
    Presence,
    SharedLayoutAnimationConfig,
} from "../../components/AnimateSharedLayout/types"
import { removeBoxTransforms } from "../../utils/geometry/delta-apply"

export type LayoutUpdateHandler = (
    layout: AxisBox2D,
    prev: AxisBox2D,
    config?: SharedLayoutAnimationConfig
) => void

/**
 * A VisualElement for HTMLElements
 */
export class KonvaVisualElement<
    E extends Konva.NodeConfig
> extends VisualElement<E> {
    public isKonva = true
    public mapToRenderProps?: (style: any, visualElement: any) => any
    updateLayoutDelta(): void {
        // throw new Error("Method not implemented.")
    }
    /**
     *
     */
    protected defaultConfig: DOMVisualElementConfig = {
        enableHardwareAcceleration: true,
        allowTransformNone: true,
    }

    /**
     * A mutable record of styles we want to apply directly to the rendered Element
     * every frame. We use a mutable data structure to reduce GC during animations.
     */
    style: ResolvedValues = {}

    /**
     * A record of styles we only want to apply via React. This gets set in useMotionValues
     * and applied in the render function. I'd prefer this to live somewhere else to decouple
     * VisualElement from React but works for now.
     */
    reactStyle: ResolvedValues = {}

    /**
     * A mutable record of CSS variables we want to apply directly to the rendered Element
     * every frame. We use a mutable data structure to reduce GC during animations.
     */
    vars: ResolvedValues = {}

    /**
     * Presence data. This is hydrated by useDomVisualElement and used by AnimateSharedLayout
     * to decide how to animate entering/exiting layoutId
     */
    presence?: Presence
    isPresent?: boolean

    /**
     * A mutable record of transforms we want to apply directly to the rendered Element
     * every frame. We use a mutable data structure to reduce GC during animations.
     */
    protected transform: ResolvedValues = {}

    config = this.defaultConfig

    /**
     * When a value is removed, we want to make sure it's removed from all rendered data structures.
     */
    removeValue(key: string) {
        super.removeValue(key)
        delete this.vars[key]
        delete this.style[key]
    }

    /**
     * Empty the mutable data structures by re-creating them. We can do this every React render
     * as the comparative workload to the rest of the render is very low and this is also when
     * we want to reflect values that might have been removed by the render.
     */
    clean() {
        this.style = {}
        this.vars = {}
        this.transform = {}
    }

    updateConfig(config: DOMVisualElementConfig = {}) {
        this.config = { ...this.defaultConfig, ...config }
    }

    /**
     * Read a value directly from the HTMLElement style.
     */
    read(key: string): number | string | null {
        return this.getComputedStyle()[key] || 0
    }

    /**
     * Read a value directly from the HTMLElement in case it's not defined by a Motion
     * prop. If it's a transform, we just return a pre-defined default value as reading these
     * out of a matrix is either error-prone or can incur a big payload for little benefit.
     */
    readNativeValue(key: string) {
        if (isTransformProp(key)) {
            const defaultValueType = getDefaultValueType(key)
            return defaultValueType ? defaultValueType.default || 0 : 0
        } else {
            return this.read(key)
        }
    }

    /**
     * ========================================
     * Layout
     * ========================================
     */
    isLayoutProjectionEnabled = false

    enableLayoutProjection() {
        this.isLayoutProjectionEnabled = true
    }

    /**
     * Optional id. If set, and this is the child of an AnimateSharedLayout component,
     * the targetBox can be transerred to a new component with the same ID.
     */
    layoutId?: string

    /**
     * The measured bounding box as it exists on the page with no transforms applied.
     *
     * To calculate the visual output of a component in any given frame, we:
     *
     *   1. box -> boxCorrected
     *      Apply the delta between the tree transform when the box was measured and
     *      the tree transform in this frame to the box
     *   2. targetBox -> targetBoxFinal
     *      Apply the VisualElement's `transform` properties to the targetBox
     *   3. Calculate the delta between boxCorrected and targetBoxFinal and apply
     *      it as a transform style.
     */
    box: AxisBox2D

    /**
     * The visual target we want to project our component into on a given frame
     * before applying transforms defined in `animate` or `style`.
     *
     * This is considered mutable to avoid object creation on each frame.
     */
    targetBox: AxisBox2D

    /**
     * The visual target we want to project our component into on a given frame
     * before applying transforms defined in `animate` or `style`.
     *
     * This is considered mutable to avoid object creation on each frame.
     */
    protected targetBoxFinal: AxisBox2D = axisBox()

    /**
     * Can be used to store a snapshot of the measured viewport bounding box before
     * a re-render.
     */
    prevViewportBox?: AxisBox2D

    /**
     * The overall scale of the local coordinate system as transformed by all parents
     * of this component. We use this for scale correction on our calculated layouts
     * and scale-affected values like `boxShadow`.
     *
     * This is considered mutable to avoid object creation on each frame.
     */
    treeScale: Point2D = { x: 1, y: 1 }

    isVisible?: boolean

    hide() {
        if (this.isVisible === false) return
        this.isVisible = false
        this.scheduleRender()
    }

    show() {
        if (this.isVisible === true) return
        this.isVisible = true
        this.scheduleRender()
    }

    /**
     * Measure and return the Element's bounding box. We convert it to a AxisBox2D
     * structure to make it easier to work on each individual axis generically.
     */
    getBoundingBox(): AxisBox2D {
        const { transformPagePoint } = this.config

        const box = this.element.getClientRect()
        return convertBoundingBoxToAxisBox(
            transformBoundingBox(box, transformPagePoint)
        )
    }

    getBoundingBoxWithoutTransforms() {
        const bbox = this.getBoundingBox()
        removeBoxTransforms(bbox, this.latest)
        return bbox
    }

    /**
     * Return the computed style after a render.
     */
    getComputedStyle() {
        return this.element.getAttrs()
    }

    /**
     *
     */
    snapshotBoundingBox() {
        throw new Error("Not implemented snapshotBoundingBox")
    }

    /**
     * The viewport scroll at the time of the previous layout measurement.
     */
    viewportScroll: Point2D

    /**
     * ========================================
     * Build & render
     * ========================================
     */

    /**
     * Build a style prop using the latest resolved MotionValues
     */
    build() {
        if (this.isVisible !== undefined) {
            this.style.visibility = this.isVisible ? "visible" : "hidden"
        }

        this.style = {
            ...this.latest,
        }

        if (this.mapToRenderProps) {
            this.style = this.mapToRenderProps(this.style, this)
        }
    }

    /**
     * Render the Element by rebuilding and applying the latest styles and vars.
     */
    render() {
        // Rebuild the latest animated values into style and vars caches.
        this.build()

        this.element._applyProps(this.element, this.style)
    }
}
