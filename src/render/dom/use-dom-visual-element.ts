import { HTMLVisualElement } from "./HTMLVisualElement"
import { KonvaVisualElement } from "./KonvaVisualElement"
import { useConstant } from "../../utils/use-constant"
import { MotionProps } from "../../motion/types"
import { SVGVisualElement } from "./SVGVisualElement"
import { UseVisualElement } from "../types"
import { isSVGComponent } from "./utils/is-svg-component"
import { useIsPresent } from "../../components/AnimatePresence/use-presence"
import { isKonvaComponent } from "."

/**
 * DOM-flavoured variation of the useVisualElement hook. Used to create either a HTMLVisualElement
 * or SVGVisualElement for the component.
 */
export const useDomVisualElement: UseVisualElement<MotionProps, any> = (
    Component,
    props,
    parent,
    isStatic,
    ref
) => {
    const mapToRenderProps = props.mapToRenderProps
    const visualElement = useConstant(() => {
        let DOMVisualElement: any = isSVGComponent(Component)
            ? SVGVisualElement
            : HTMLVisualElement

        if (isKonvaComponent(Component as any)) {
            const result = new KonvaVisualElement(parent, ref as any)
            result.mapToRenderProps = mapToRenderProps
            return result
        }

        return new DOMVisualElement(parent, ref as any)
    })

    visualElement.updateConfig({
        enableHardwareAcceleration: !isStatic,
        ...props,
    })

    visualElement.layoutId = props.layoutId

    const isPresent = useIsPresent()
    visualElement.isPresent =
        props.isPresent !== undefined ? props.isPresent : isPresent

    return visualElement
}
