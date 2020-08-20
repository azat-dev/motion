import { ResolvedValues } from "../../types"
// import { getDefaultValueType, getValueAsType } from "./value-types"
// import { isCSSVariable } from "./is-css-variable"
// import { valueScaleCorrection } from "../layout/scale-correction"
// import { Point2D, AxisBox2D, BoxDelta } from "../../../types/geometry"

/**
 * Build style and CSS variables
 *
 * This function converts a Motion style prop:
 *
 * { x: 100, width: 100, originX: 0.5 }
 *
 * Into an object with default value types applied and default
 * transform order set:
 *
 * {
 *   transform: 'translateX(100px) translateZ(0)`,
 *   width: '100px',
 *   transformOrigin: '50% 50%'
 * }
 *
 * Styles are saved to `style` and CSS vars to `vars`.
 *
 * This function works with mutative data structures.
 */
export function buildKonvaStyles(
    latest: ResolvedValues,
    style: ResolvedValues
    // vars: ResolvedValues,
    // isLayoutProjectionEnabled?: boolean,
    // delta?: BoxDelta,
    // treeScale?: Point2D,
    // targetBox?: AxisBox2D
): void {
    style = {
        ...latest,
    }
    return
    /**
     * Loop over all our latest animated values and decide whether to handle them
     * as a style or CSS variable. Transforms and transform origins are kept seperately
     * for further processing
     */
    for (const key in latest) {
        const value = latest[key]
        style[key] = value

        // // Convert the value to its default value type, ie 0 -> "0px"
        // // const valueType = getDefaultValueType(key)
        // // const valueAsType = getValueAsType(value, valueType)

        // if (key !== "transform" || typeof value !== "function") {
        //     // Handle all remaining values. Decide which map to save to depending
        //     // on whether this is a CSS variable
        //     const bucket = isCSSVariable(key) ? vars : style

        //     // If we need to perform scale correction, and we have a handler for this
        //     // value type (ie borderRadius), perform it

        //     if (isLayoutProjectionEnabled && valueScaleCorrection[key]) {
        //         const corrected = valueScaleCorrection[key].process(
        //             value,
        //             targetBox!,
        //             delta!,
        //             treeScale!
        //         )
        //         /**
        //          * Scale-correctable values can define a number of other values to break
        //          * down into. For instance borderRadius needs applying to borderBottomLeftRadius etc
        //          */
        //         const { applyTo } = valueScaleCorrection[key]
        //         if (applyTo) {
        //             const num = applyTo.length
        //             for (let i = 0; i < num; i++) {
        //                 bucket[applyTo[i]] = corrected
        //             }
        //         } else {
        //             bucket[key] = corrected
        //         }
        //     } else {
        //         // bucket[key] = valueAsType
        //         bucket[key] = value
        //     }
        // }
    }
}
