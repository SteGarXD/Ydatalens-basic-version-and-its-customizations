/**
 * Модуль Parent-Child визуализации
 * Иерархические визуализации для данных с parent-child связями
 */

import React from 'react';

export interface ParentChildNode {
  id: string;
  parentId: string | null;
  label: string;
  value?: number;
  children?: ParentChildNode[];
}

export interface ParentChildConfig {
  idField: string;
  parentIdField: string;
  labelField: string;
  valueField?: string;
}

/**
 * Построить дерево из плоских данных
 */
export const buildTree = (
  data: any[],
  config: ParentChildConfig
): ParentChildNode[] => {
  const nodeMap = new Map<string, ParentChildNode>();
  const rootNodes: ParentChildNode[] = [];

  // Создать все узлы
  data.forEach(item => {
    const node: ParentChildNode = {
      id: String(item[config.idField]),
      parentId: item[config.parentIdField] ? String(item[config.parentIdField]) : null,
      label: String(item[config.labelField]),
      value: config.valueField ? item[config.valueField] : undefined,
      children: [],
    };
    nodeMap.set(node.id, node);
  });

  // Построить связи
  nodeMap.forEach(node => {
    if (node.parentId && nodeMap.has(node.parentId)) {
      const parent = nodeMap.get(node.parentId)!;
      if (!parent.children) {
        parent.children = [];
      }
      parent.children.push(node);
    } else {
      rootNodes.push(node);
    }
  });

  return rootNodes;
};

/**
 * Найти путь от корня до узла
 */
export const findPath = (
  tree: ParentChildNode[],
  nodeId: string
): ParentChildNode[] => {
  const path: ParentChildNode[] = [];

  const find = (nodes: ParentChildNode[], targetId: string): boolean => {
    for (const node of nodes) {
      path.push(node);
      if (node.id === targetId) {
        return true;
      }
      if (node.children && find(node.children, targetId)) {
        return true;
      }
      path.pop();
    }
    return false;
  };

  find(tree, nodeId);
  return path;
};

const ParentChildVizModule: React.FC = () => {
  return null;
};

export default ParentChildVizModule;

