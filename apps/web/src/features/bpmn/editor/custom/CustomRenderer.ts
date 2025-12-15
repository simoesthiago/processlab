import BpmnRenderer from 'bpmn-js/lib/draw/BpmnRenderer';
import { is } from 'bpmn-js/lib/util/ModelUtil';

export default class CustomRenderer extends BpmnRenderer {
    constructor(config: any, eventBus: any, styles: any, pathMap: any, canvas: any, textRenderer: any) {
        super(config, eventBus, styles, pathMap, canvas, textRenderer, 1500);
    }

    canRender(element: any) {
        return is(element, 'bpmn:BaseElement');
    }

    drawShape(parentNode: any, element: any) {
        const shape = super.drawShape(parentNode, element);
        this._applyCustomStyles(parentNode, element);
        return shape;
    }

    _applyCustomStyles(parentNode: any, element: any) {
        const di = element.di;
        const attrs = di?.$attrs || {};

        // Helper to apply style to a node
        const applyStyle = (node: any, prop: string, value: string) => {
            if (!node) return;
            (node as any).style[prop] = value;
        };

        // Helper to set attribute
        const setAttr = (node: any, attr: string, value: string) => {
            if (!node) return;
            node.setAttribute(attr, value);
        };

        // Find the text element within the parent group
        // bpmn-js renders text in a <text> element usually class 'djs-label' or just 'text'
        const textNode = parentNode.querySelector('text');
        if (!textNode) return;

        // Font
        if (attrs['data-font-family']) {
            applyStyle(textNode, 'fontFamily', attrs['data-font-family']);
        }
        if (attrs['data-font-size']) {
            applyStyle(textNode, 'fontSize', `${attrs['data-font-size']}px`);
        }
        if (attrs['data-font-weight']) {
            applyStyle(textNode, 'fontWeight', attrs['data-font-weight']);
        }
        if (attrs['data-font-style']) {
            applyStyle(textNode, 'fontStyle', attrs['data-font-style']);
        }
        if (attrs['data-text-decoration']) {
            applyStyle(textNode, 'textDecoration', attrs['data-text-decoration']);
        }

        // Color
        if (attrs['data-font-color']) {
            applyStyle(textNode, 'fill', attrs['data-font-color']);
            // For text, fill is the color
            setAttr(textNode, 'fill', attrs['data-font-color']);
        }

        // Alignment
        // This is tricky as 'text-anchor' logic is complex in SVG
        if (attrs['data-text-align']) {
            const alignMap: Record<string, string> = { 'left': 'start', 'center': 'middle', 'right': 'end' };
            const anchor = alignMap[attrs['data-text-align']] || 'middle';
            setAttr(textNode, 'text-anchor', anchor);
            applyStyle(textNode, 'textAnchor', anchor);

            // Note: Just changing anchor might shift text position if not compensated.
            // bpmn-js calculates position based on center. 
            // For a perfect implementation we'd need to adjust x/y or tspan x values.
            // For now, let's stick to simple style application.
        }
    }
}

CustomRenderer.$inject = ['config.bpmnRenderer', 'eventBus', 'styles', 'pathMap', 'canvas', 'textRenderer'];
