import { invariant } from "hey-listen"
import { cubicBezier } from "@popmotion/easing"
import * as easingLookup from "@popmotion/easing"
import { Easing } from "../../types"

export const easingDefinitionToFunction = (definition: Easing) => {
    if (Array.isArray(definition)) {
        // If cubic bezier definition, create bezier curve
        invariant(
            definition.length === 4,
            `Cubic bezier arrays must contain four numerical values.`
        )

        const [x1, y1, x2, y2] = definition
        return cubicBezier(x1, y1, x2, y2)
    } else if (typeof definition === "string") {
        // Else lookup from table
        invariant(
            easingLookup[definition] !== undefined,
            `Invalid easing type '${definition}'`
        )
        return easingLookup[definition]
    }

    return definition
}

export const isEasingArray = (ease: any): ease is Easing[] => {
    return Array.isArray(ease) && typeof ease[0] !== "number"
}
