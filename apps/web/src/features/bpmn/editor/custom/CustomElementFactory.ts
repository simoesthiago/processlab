import ElementFactory from 'bpmn-js/lib/features/modeling/ElementFactory';
import { is } from 'bpmn-js/lib/util/ModelUtil';

export default class CustomElementFactory extends ElementFactory {
    constructor(bpmnFactory: any, moddle: any, translate: any) {
        // @ts-ignore
        super(bpmnFactory, moddle, translate);
    }

    getDefaultSize(element: any, di: any) {
        const bo = element.businessObject || element;

        // Events (Start, Intermediate, End): 30x30
        if (is(bo, 'bpmn:StartEvent') || is(bo, 'bpmn:EndEvent') || is(bo, 'bpmn:IntermediateThrowEvent') || is(bo, 'bpmn:IntermediateCatchEvent') || is(bo, 'bpmn:BoundaryEvent')) {
            return { width: 30, height: 30 };
        }

        // Tasks: 140x90
        if (is(bo, 'bpmn:Task') || is(bo, 'bpmn:UserTask') || is(bo, 'bpmn:ServiceTask') || is(bo, 'bpmn:ScriptTask') || is(bo, 'bpmn:ManualTask') || is(bo, 'bpmn:SendTask') || is(bo, 'bpmn:ReceiveTask') || is(bo, 'bpmn:BusinessRuleTask') || is(bo, 'bpmn:CallActivity')) {
            return { width: 140, height: 90 };
        }

        // SubProcess: 140x90
        if (is(bo, 'bpmn:SubProcess')) {
            return { width: 140, height: 90 };
        }

        // Data Store: 50x50
        if (is(bo, 'bpmn:DataStoreReference')) {
            return { width: 50, height: 50 };
        }

        // Gateway: 40x40
        if (is(bo, 'bpmn:Gateway')) {
            return { width: 40, height: 40 };
        }

        // Data Object: 40x50
        if (is(bo, 'bpmn:DataObjectReference')) {
            return { width: 40, height: 50 };
        }

        return super.getDefaultSize(element, di);
    }
}

CustomElementFactory.$inject = ['bpmnFactory', 'moddle', 'translate'];
