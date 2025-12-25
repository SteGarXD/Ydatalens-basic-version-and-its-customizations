/**
 * Graph Analytics Module
 * Анализ связей между данными (рейсы, маршруты, аэропорты)
 */

import { AERONAVIGATOR_FEATURES } from '../../config';

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  properties?: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  weight?: number;
  properties?: Record<string, any>;
}

export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface GraphAnalysis {
  nodes: number;
  edges: number;
  communities: string[][];
  centralNodes: GraphNode[];
  shortestPaths: Array<{ from: string; to: string; path: string[]; distance: number }>;
}

/**
 * Построение графа из данных о рейсах
 */
export const buildFlightGraph = (data: any[]): Graph => {
  if (!AERONAVIGATOR_FEATURES.GRAPH_ANALYTICS) {
    throw new Error('Graph analytics is disabled');
  }

  const nodes: Map<string, GraphNode> = new Map();
  const edges: Map<string, GraphEdge> = new Map();

  data.forEach((row, index) => {
    const origin = row.origin || row.departure_airport;
    const destination = row.destination || row.arrival_airport;
    const flightId = row.flight_id || `flight-${index}`;

    if (origin && destination) {
      // Добавление узлов (аэропорты)
      if (!nodes.has(origin)) {
        nodes.set(origin, {
          id: origin,
          label: origin,
          type: 'airport',
          properties: {},
        });
      }

      if (!nodes.has(destination)) {
        nodes.set(destination, {
          id: destination,
          label: destination,
          type: 'airport',
          properties: {},
        });
      }

      // Добавление ребра (маршрут)
      const edgeId = `${origin}-${destination}`;
      if (!edges.has(edgeId)) {
        edges.set(edgeId, {
          id: edgeId,
          source: origin,
          target: destination,
          label: `${origin} → ${destination}`,
          weight: 1,
          properties: {
            flights: [flightId],
          },
        });
      } else {
        // Увеличение веса при повторных рейсах
        const edge = edges.get(edgeId)!;
        edge.weight = (edge.weight || 1) + 1;
        if (edge.properties) {
          edge.properties.flights = [...(edge.properties.flights || []), flightId];
        }
      }
    }
  });

  return {
    nodes: Array.from(nodes.values()),
    edges: Array.from(edges.values()),
  };
};

/**
 * Анализ графа
 */
export const analyzeGraph = async (graph: Graph): Promise<GraphAnalysis> => {
  if (!AERONAVIGATOR_FEATURES.GRAPH_ANALYTICS) {
    throw new Error('Graph analytics is disabled');
  }

  // Простой анализ графа (без внешних библиотек)
  const communities = findCommunities(graph);
  const centralNodes = findCentralNodes(graph);
  const shortestPaths = findShortestPaths(graph);

  return {
    nodes: graph.nodes.length,
    edges: graph.edges.length,
    communities,
    centralNodes,
    shortestPaths,
  };
};

/**
 * Поиск сообществ (упрощенный алгоритм)
 */
const findCommunities = (graph: Graph): string[][] => {
  const communities: string[][] = [];
  const visited = new Set<string>();

  const dfs = (nodeId: string, community: string[]) => {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    community.push(nodeId);

    graph.edges.forEach(edge => {
      if (edge.source === nodeId && !visited.has(edge.target)) {
        dfs(edge.target, community);
      } else if (edge.target === nodeId && !visited.has(edge.source)) {
        dfs(edge.source, community);
      }
    });
  };

  graph.nodes.forEach(node => {
    if (!visited.has(node.id)) {
      const community: string[] = [];
      dfs(node.id, community);
      if (community.length > 0) {
        communities.push(community);
      }
    }
  });

  return communities;
};

/**
 * Поиск центральных узлов (по количеству связей)
 */
const findCentralNodes = (graph: Graph, topN: number = 5): GraphNode[] => {
  const nodeConnections = new Map<string, number>();

  graph.nodes.forEach(node => {
    nodeConnections.set(node.id, 0);
  });

  graph.edges.forEach(edge => {
    nodeConnections.set(edge.source, (nodeConnections.get(edge.source) || 0) + 1);
    nodeConnections.set(edge.target, (nodeConnections.get(edge.target) || 0) + 1);
  });

  const sorted = Array.from(nodeConnections.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN);

  return sorted.map(([nodeId]) => {
    return graph.nodes.find(n => n.id === nodeId)!;
  }).filter(Boolean);
};

/**
 * Поиск кратчайших путей (BFS)
 */
const findShortestPaths = (graph: Graph, maxPaths: number = 10): Array<{ from: string; to: string; path: string[]; distance: number }> => {
  const paths: Array<{ from: string; to: string; path: string[]; distance: number }> = [];

  const bfs = (start: string, end: string): string[] | null => {
    const queue: Array<{ node: string; path: string[] }> = [{ node: start, path: [start] }];
    const visited = new Set<string>([start]);

    while (queue.length > 0) {
      const { node, path } = queue.shift()!;

      if (node === end) {
        return path;
      }

      graph.edges.forEach(edge => {
        if (edge.source === node && !visited.has(edge.target)) {
          visited.add(edge.target);
          queue.push({ node: edge.target, path: [...path, edge.target] });
        } else if (edge.target === node && !visited.has(edge.source)) {
          visited.add(edge.source);
          queue.push({ node: edge.source, path: [...path, edge.source] });
        }
      });
    }

    return null;
  };

  // Поиск путей между первыми несколькими узлами
  const nodes = graph.nodes.slice(0, Math.min(5, graph.nodes.length));
  for (let i = 0; i < nodes.length && paths.length < maxPaths; i++) {
    for (let j = i + 1; j < nodes.length && paths.length < maxPaths; j++) {
      const path = bfs(nodes[i].id, nodes[j].id);
      if (path) {
        paths.push({
          from: nodes[i].id,
          to: nodes[j].id,
          path,
          distance: path.length - 1,
        });
      }
    }
  }

  return paths;
};

/**
 * Визуализация графа
 */
export const visualizeGraph = async (graph: Graph): Promise<any> => {
  if (!AERONAVIGATOR_FEATURES.GRAPH_ANALYTICS) {
    throw new Error('Graph analytics is disabled');
  }

  // Возвращаем данные для визуализации
  return {
    nodes: graph.nodes.map(node => ({
      id: node.id,
      label: node.label,
      type: node.type,
      ...node.properties,
    })),
    edges: graph.edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      weight: edge.weight,
      ...edge.properties,
    })),
  };
};

/**
 * Инициализация Graph Analytics
 */
export const initializeGraphAnalytics = async () => {
  if (!AERONAVIGATOR_FEATURES.GRAPH_ANALYTICS) {
    return;
  }

  try {
    // Регистрация в DataLens
    if (typeof window !== 'undefined') {
      const datalens = (window as any).datalens || {};
      if (!datalens.graph) {
        datalens.graph = {
          buildFlightGraph,
          analyze: analyzeGraph,
          visualize: visualizeGraph,
        };
      }
      (window as any).datalens = datalens;
    }

    console.log('[AeronavigatorBI] Graph Analytics initialized');
  } catch (error) {
    console.error('[AeronavigatorBI] Error initializing Graph Analytics:', error);
  }
};

export default initializeGraphAnalytics;

