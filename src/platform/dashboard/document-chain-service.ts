/**
 * Part 21 — Document Chain Service
 * 
 * Shows the complete document chain for any business object, both upstream and downstream.
 * Each node shows type, number, status, value, and date.
 * Nodes the user cannot access are shown as "Restricted" with type only.
 */

import { DocumentChain, DocumentChainNode, DocumentChainEdge } from './role-dashboard-types';
import { Actor } from '../permission/actor';

export class DocumentChainService {
  /**
   * Get complete document chain for an entity
   */
  async getDocumentChain(
    entityType: string,
    entityId: number,
    actor: Actor
  ): Promise<DocumentChain> {
    // Build the chain by traversing relationships
    const nodes: DocumentChainNode[] = [];
    const edges: DocumentChainEdge[] = [];

    // Start with the current entity
    const currentNode = await this.buildNode(entityType, entityId, actor);
    if (!currentNode) {
      throw new Error(`Entity not found: ${entityType}/${entityId}`);
    }
    nodes.push(currentNode);

    // Traverse upstream (parents)
    await this.traverseUpstream(currentNode, nodes, edges, actor);

    // Traverse downstream (children)
    await this.traverseDownstream(currentNode, nodes, edges, actor);

    return {
      entityType,
      entityId,
      nodes,
      edges,
    };
  }

  /**
   * Build a single node in the chain
   */
  private async buildNode(
    entityType: string,
    entityId: number,
    actor: Actor
  ): Promise<DocumentChainNode | null> {
    // Check if user has permission to view this entity
    const permissionKey = this.getPermissionKey(entityType);
    const projectId = await this.getProjectId(entityType, entityId);
    const accessible = actor.can(permissionKey, projectId);

    if (!accessible) {
      // Show as "Restricted" with type only
      return {
        id: `${entityType}:${entityId}`,
        entityType,
        entityId,
        documentNumber: 'Restricted',
        status: 'RESTRICTED',
        date: '',
        accessible: false,
      };
    }

    // Fetch entity data
    const entity = await this.fetchEntity(entityType, entityId);
    if (!entity) {
      return null;
    }

    return {
      id: `${entityType}:${entityId}`,
      entityType,
      entityId,
      documentNumber: entity.documentNumber,
      status: entity.status,
      value: entity.value,
      date: entity.date,
      accessible: true,
      route: this.getRoute(entityType, entityId),
    };
  }

  /**
   * Traverse upstream (parent documents)
   */
  private async traverseUpstream(
    node: DocumentChainNode,
    nodes: DocumentChainNode[],
    edges: DocumentChainEdge[],
    actor: Actor
  ): Promise<void> {
    const parents = await this.getParents(node.entityType, node.entityId);

    for (const parent of parents) {
      // Check if already visited
      if (nodes.find(n => n.id === `${parent.type}:${parent.id}`)) {
        continue;
      }

      const parentNode = await this.buildNode(parent.type, parent.id, actor);
      if (parentNode) {
        nodes.push(parentNode);
        edges.push({
          from: parentNode.id,
          to: node.id,
          relationship: `${parent.type} → ${node.entityType}`,
        });

        // Recursively traverse further upstream
        await this.traverseUpstream(parentNode, nodes, edges, actor);
      }
    }
  }

  /**
   * Traverse downstream (child documents)
   */
  private async traverseDownstream(
    node: DocumentChainNode,
    nodes: DocumentChainNode[],
    edges: DocumentChainEdge[],
    actor: Actor
  ): Promise<void> {
    const children = await this.getChildren(node.entityType, node.entityId);

    for (const child of children) {
      // Check if already visited
      if (nodes.find(n => n.id === `${child.type}:${child.id}`)) {
        continue;
      }

      const childNode = await this.buildNode(child.type, child.id, actor);
      if (childNode) {
        nodes.push(childNode);
        edges.push({
          from: node.id,
          to: childNode.id,
          relationship: `${node.entityType} → ${child.type}`,
        });

        // Recursively traverse further downstream
        await this.traverseDownstream(childNode, nodes, edges, actor);
      }
    }
  }

  /**
   * Get parent documents for an entity
   */
  private async getParents(
    entityType: string,
    entityId: number
  ): Promise<Array<{ type: string; id: number }>> {
    // In production, would query relationship tables
    // For demo, return mock relationships based on entity type
    const relationships: Record<string, Array<{ type: string; id: number }>> = {
      'grn': [{ type: 'po', id: entityId % 100 }],
      'po': [{ type: 'pr', id: entityId % 50 }, { type: 'rfq', id: entityId % 30 }],
      'pr': [{ type: 'mr', id: entityId % 80 }],
      'invoice': [{ type: 'po', id: entityId % 100 }],
      'payment': [{ type: 'invoice', id: entityId % 60 }],
      'ra_bill': [{ type: 'mb', id: entityId % 40 }],
      'mb': [{ type: 'dpr', id: entityId % 300 }],
    };

    return relationships[entityType] || [];
  }

  /**
   * Get child documents for an entity
   */
  private async getChildren(
    entityType: string,
    entityId: number
  ): Promise<Array<{ type: string; id: number }>> {
    // In production, would query relationship tables
    // For demo, return mock relationships
    const relationships: Record<string, Array<{ type: string; id: number }>> = {
      'mr': [{ type: 'pr', id: entityId * 2 }],
      'pr': [{ type: 'rfq', id: entityId * 2 }, { type: 'po', id: entityId * 2 }],
      'rfq': [{ type: 'quotation', id: entityId * 3 }],
      'po': [{ type: 'grn', id: entityId * 2 }, { type: 'invoice', id: entityId * 2 }],
      'grn': [{ type: 'stock_receipt', id: entityId * 2 }],
      'invoice': [{ type: 'payment', id: entityId * 2 }],
      'dpr': [{ type: 'mb', id: entityId * 3 }],
      'mb': [{ type: 'ra_bill', id: entityId * 2 }],
      'ra_bill': [{ type: 'client_invoice', id: entityId * 2 }],
    };

    return relationships[entityType] || [];
  }

  /**
   * Get permission key for an entity type
   */
  private getPermissionKey(entityType: string): string {
    const permissionMap: Record<string, string> = {
      'mr': 'procure.mr.view',
      'pr': 'procure.pr.view',
      'rfq': 'procure.rfq.view',
      'quotation': 'procure.quotation.view',
      'po': 'procure.po.view',
      'grn': 'store.grn.view',
      'stock_receipt': 'store.stock.view',
      'invoice': 'finance.invoice.view',
      'payment': 'finance.payment.view',
      'dpr': 'project.dpr.view',
      'mb': 'mb.entry.view',
      'ra_bill': 'bill.client.view',
      'client_invoice': 'bill.invoice.view',
    };

    return permissionMap[entityType] || 'unknown.view';
  }

  /**
   * Get project ID for an entity
   */
  private async getProjectId(entityType: string, entityId: number): Promise<number> {
    // In production, would query entity table
    // For demo, return mock project ID
    return entityId % 10 + 1;
  }

  /**
   * Fetch entity data
   */
  private async fetchEntity(
    entityType: string,
    entityId: number
  ): Promise<{ documentNumber: string; status: string; value?: number; date: string } | null> {
    // In production, would query entity table
    // For demo, return mock data
    return {
      documentNumber: `${entityType.toUpperCase()}-${String(entityId).padStart(4, '0')}`,
      status: 'APPROVED',
      value: Math.floor(Math.random() * 1000000),
      date: new Date().toISOString().split('T')[0],
    };
  }

  /**
   * Get route for an entity
   */
  private getRoute(entityType: string, entityId: number): string {
    const routeMap: Record<string, string> = {
      'mr': `/procurement/mr/${entityId}`,
      'pr': `/procurement/pr/${entityId}`,
      'rfq': `/procurement/rfq/${entityId}`,
      'quotation': `/procurement/quotation/${entityId}`,
      'po': `/procurement/po/${entityId}`,
      'grn': `/store/grn/${entityId}`,
      'stock_receipt': `/store/stock/${entityId}`,
      'invoice': `/finance/invoice/${entityId}`,
      'payment': `/finance/payment/${entityId}`,
      'dpr': `/execution/dpr/${entityId}`,
      'mb': `/execution/mb/${entityId}`,
      'ra_bill': `/billing/ra-bill/${entityId}`,
      'client_invoice': `/billing/invoice/${entityId}`,
    };

    return routeMap[entityType] || '/';
  }
}

// Singleton instance
export const documentChainService = new DocumentChainService();
