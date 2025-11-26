/**
 * BPMN Linting Module
 * 
 * Validates BPMN diagrams against best practices and BPMN 2.0 rules.
 */

import type { BPMN_JSON, BPMNElement, SequenceFlow } from '@processlab/shared-schemas';

export interface LintIssue {
    severity: 'error' | 'warning' | 'info';
    elementId?: string;
    message: string;
    rule: string;
}

/**
 * Lint BPMN diagram for common issues
 */
export function lintBpmn(bpmn: BPMN_JSON): LintIssue[] {
    const issues: LintIssue[] = [];

    // Check for start event
    const startEvents = bpmn.elements.filter(e => e.type === 'startEvent');
    if (startEvents.length === 0) {
        issues.push({
            severity: 'error',
            message: 'Process must have at least one start event',
            rule: 'start-event-required',
        });
    }

    // Check for end event
    const endEvents = bpmn.elements.filter(e => e.type === 'endEvent');
    if (endEvents.length === 0) {
        issues.push({
            severity: 'warning',
            message: 'Process should have at least one end event',
            rule: 'end-event-recommended',
        });
    }

    // Check for disconnected elements
    const connectedElements = new Set<string>();
    bpmn.flows.forEach(flow => {
        connectedElements.add(flow.source);
        connectedElements.add(flow.target);
    });

    bpmn.elements.forEach(element => {
        if (!connectedElements.has(element.id) && element.type !== 'startEvent') {
            issues.push({
                severity: 'warning',
                elementId: element.id,
                message: `Element "${element.name || element.id}" is not connected`,
                rule: 'disconnected-element',
            });
        }
    });

    // Check for gateway issues
    bpmn.elements
        .filter(e => e.type.includes('Gateway'))
        .forEach(gateway => {
            const outgoing = bpmn.flows.filter(f => f.source === gateway.id);
            if (outgoing.length < 2) {
                issues.push({
                    severity: 'warning',
                    elementId: gateway.id,
                    message: `Gateway should have at least 2 outgoing flows`,
                    rule: 'gateway-outgoing-flows',
                });
            }
        });

    // TODO: Add more linting rules
    // - Check for cycles
    // - Validate lane assignments
    // - Check naming conventions
    // - Validate gateway types

    return issues;
}

/**
 * Get lint issues for a specific element
 */
export function lintElement(bpmn: BPMN_JSON, elementId: string): LintIssue[] {
    const allIssues = lintBpmn(bpmn);
    return allIssues.filter(issue => issue.elementId === elementId);
}
