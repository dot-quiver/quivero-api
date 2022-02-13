import Graph from '../Graph';
import GraphVertex, { createVertices } from '../GraphVertex';
import GraphEdge, { createEdges } from '../GraphEdge';

console.warn = jest.fn();

beforeEach(() => {
  console.warn.mockClear();
});

describe('Graph', () => {
  it('should add vertices to graph', () => {
    const graph = new Graph();

    const [A, B] = createVertices(['A', 'B']);

    graph.addVertices([A, B]);

    expect(graph.toString()).toBe('');
    expect(graph.getVertexByKey(A.getKey())).toEqual(A);
    expect(graph.getVertexByKey(B.getKey())).toEqual(B);
  });

  it('should get vertex by its index', () => {
    const graph = new Graph();

    const [A, B] = createVertices(['A', 'B']);

    graph.addVertices([A, B]);

    let vertex = graph.getVertexByIndex(0)

    expect(vertex.getKey()).toEqual('A');
  });

  it('should get edges by vertex keys', () => {
    const graph = new Graph();
    let keys = ['A', 'B', 'C'];
    
    const [A, B, C] = createVertices(keys);
    const [AB, BC] = createEdges([[A, B], [B, C]]);

    graph.addEdges([AB, BC]);
    
    let edges = graph.getEdgesByVertexKeys(keys)

    let edge_keys=[] 
    edges.forEach((edge) => {
      edge_keys.push(edge.getKey())
    })

    expect(edge_keys).toEqual(['A_B', 'B_C']);
  });
  
  it('should add edges to undirected graph', () => {
    const graph = new Graph();

    const [A, B] = createVertices(['A', 'B']);

    const edgeAB = new GraphEdge(A, B);

    graph.addEdge(edgeAB);

    expect(graph.getAllVertices().length).toBe(2);
    expect(graph.getAllVertices()[0]).toEqual(A);
    expect(graph.getAllVertices()[1]).toEqual(B);

    const graphVertexA = graph.getVertexByKey(A.getKey());
    const graphVertexB = graph.getVertexByKey(B.getKey());

    expect(graph.toString()).toBe('A_B');
    expect(graphVertexA).toBeDefined();
    expect(graphVertexB).toBeDefined();

    expect(graph.getVertexByKey('not existing')).toBeUndefined();

    expect(graphVertexA.getNeighbors().length).toBe(1);
    expect(graphVertexA.getNeighbors()[0]).toEqual(B);
    expect(graphVertexA.getNeighbors()[0]).toEqual(graphVertexB);

    expect(graphVertexB.getNeighbors().length).toBe(1);
    expect(graphVertexB.getNeighbors()[0]).toEqual(A);
    expect(graphVertexB.getNeighbors()[0]).toEqual(graphVertexA);
  });

  it('should add edges to directed graph', () => {
    const graph = new Graph(true);

    const [vertexA, vertexB] = createVertices(['A', 'B']);

    const edgeAB = new GraphEdge(vertexA, vertexB);

    graph.addEdge(edgeAB);

    const graphVertexA = graph.getVertexByKey(vertexA.getKey());
    const graphVertexB = graph.getVertexByKey(vertexB.getKey());

    expect(graph.toString()).toBe('A_B');
    expect(graphVertexA).toBeDefined();
    expect(graphVertexB).toBeDefined();

    expect(graphVertexA.getNeighbors().length).toBe(1);
    expect(graphVertexA.getNeighbors()[0]).toEqual(vertexB);
    expect(graphVertexA.getNeighbors()[0]).toEqual(graphVertexB);

    expect(graphVertexB.getNeighbors().length).toBe(0);
  });

  it('should check if vertex and edge exist', () => {
    const graph = new Graph();

    const [A, B] = createVertices(['A', 'B']);

    graph.addVertices([A, B]);

    // Edges
    const [AB] = createEdges([[A, B]]);
    graph.addEdge(AB);

    expect(graph.hasVertex(A.getKey())).toBe(true);
    expect(graph.hasEdge(AB.getKey())).toBe(true);
  });

  it('should copy directed graph but undirected', () => {
    // A directed graph
    const graph_ = new Graph(true);

    // Nodes
    const [A, B] = createVertices(['A', 'B']);

    // Vertices
    const AB = new GraphEdge(A, B);

    graph_.addEdge(AB);

    // Add edges
    const graph_undirected = graph_.retrieveUndirected();

    expect(graph_undirected.isDirected).toEqual(false);
  });

  it('should copy undirected graph', () => {
    // A directed graph
    const graph_ = new Graph(false);

    // Nodes
    const [A, B] = createVertices(['A', 'B']);

    // Vertices
    const AB = new GraphEdge(A, B);

    graph_.addEdge(AB);

    // Add edges
    const graph_undirected = graph_.retrieveUndirected();

    expect(graph_undirected.isDirected).toEqual(false);
  });

  it('Cycles in a finite graph must be finite', () => {
    // A directed graph
    const graph = new Graph(true);

    // Vertices
    const [A, B, C, D, E, F] = createVertices(['A', 'B', 'C', 'D', 'E', 'F']);

    // Edges
    const [AB, BC, CD, CE,
      EB, CF, FB] = createEdges([[A, B], [B, C], [C, D], [C, E],
      [E, B], [C, F], [F, B]]);

    // Add edges
    graph.addEdges([AB, BC, CD, CE, EB, CF, FB]);

    expect(graph.cyclicCircuits()).toStrictEqual([[1, 2, 4], [1, 2, 5]]);
  });

  it('Cycles in a finite graph must be finite', () => {
    // A directed graph
    const graph = new Graph(true);

    // Vertices
    const [A, B, C, D, E, F] = createVertices(['A', 'B', 'C', 'D', 'E', 'F']);

    // Edges
    const [AB, BC, CD, CE,
      EB, CF, FB] = createEdges([[A, B], [B, C], [C, D], [C, E],
      [E, B], [C, F], [F, B]]);

    // Add edges
    graph.addEdges([AB, BC, CD, CE, EB, CF, FB]);

    expect(graph.cyclicCircuits()).toStrictEqual([[1, 2, 4], [1, 2, 5]]);
  });

  it('should find Eulerian Circuit in graph', () => {
    const vertexA = new GraphVertex('A');
    const vertexB = new GraphVertex('B');
    const vertexC = new GraphVertex('C');
    const vertexD = new GraphVertex('D');
    const vertexE = new GraphVertex('E');
    const vertexF = new GraphVertex('F');

    const edgeAB = new GraphEdge(vertexA, vertexB);
    const edgeBC = new GraphEdge(vertexB, vertexC);
    const edgeCD = new GraphEdge(vertexC, vertexD);
    const edgeDE = new GraphEdge(vertexD, vertexE);
    const edgeEF = new GraphEdge(vertexE, vertexF);
    const edgeBE= new GraphEdge(vertexB, vertexE);

    const graph = new Graph();

    graph.addEdges([edgeAB, edgeBC, edgeCD, edgeDE, edgeEF]);
    
    expect(graph.getEulerianPath()).toStrictEqual([0, 1, 2, 3, 4, 5]);
  });

  it('should return false for a non-eulerian directed graph', () => {
    const vertexA = new GraphVertex('A');
    const vertexB = new GraphVertex('B');
    const vertexC = new GraphVertex('C');
    const vertexD = new GraphVertex('D');
    
    const edgeAB = new GraphEdge(vertexA, vertexB);
    const edgeBC = new GraphEdge(vertexB, vertexC);
    const edgeCD = new GraphEdge(vertexB, vertexD);

    const graph = new Graph(true);

    graph.addEdges([edgeAB, edgeBC, edgeCD]);
    
    expect(graph.isEulerian()).toStrictEqual(false);
  });

  it('should return true for an eulerian directed graph', () => {
    const vertexA = new GraphVertex('A');
    const vertexB = new GraphVertex('B');
    const vertexC = new GraphVertex('C');
    const vertexD = new GraphVertex('D');
    
    const edgeAB = new GraphEdge(vertexA, vertexB);
    const edgeBC = new GraphEdge(vertexB, vertexC);
    const edgeCD = new GraphEdge(vertexC, vertexD);
    const edgeDA = new GraphEdge(vertexD, vertexA);

    const graph = new Graph(true);

    graph.addEdges([edgeAB, edgeBC, edgeCD, edgeDA]);
    
    expect(graph.isEulerian()).toStrictEqual(true);
  });

  it('should return false for an directed graph with different in and out edge flow', () => {
    const vertexA = new GraphVertex('A');
    const vertexB = new GraphVertex('B');
    const vertexC = new GraphVertex('C');
    const vertexD = new GraphVertex('D');
    
    const edgeAB = new GraphEdge(vertexA, vertexB);
    const edgeBC = new GraphEdge(vertexB, vertexC);
    const edgeCD = new GraphEdge(vertexC, vertexD);

    const graph = new Graph(true);

    graph.addEdges([edgeAB, edgeBC, edgeCD]);
    
    expect(graph.isEulerian()).toStrictEqual(false);
  });

  it('should return 0 for an eulerian undirected graph', () => {
    const vertexA = new GraphVertex('A');
    const vertexB = new GraphVertex('B');
    const vertexC = new GraphVertex('C');
    const vertexD = new GraphVertex('D');
    
    const edgeAB = new GraphEdge(vertexA, vertexB);
    const edgeBC = new GraphEdge(vertexB, vertexC);
    const edgeCD = new GraphEdge(vertexB, vertexD);

    const graph = new Graph();

    graph.addEdges([edgeAB, edgeBC, edgeCD]);
    
    expect(graph.isEulerian()).toStrictEqual(0);
  });

  it('should return 0 for an eulerian undirected graph', () => {
    const vertexA = new GraphVertex('A');
    const vertexB = new GraphVertex('B');
    const vertexC = new GraphVertex('C');

    const graph = new Graph();

    graph.addVertices([vertexA, vertexB, vertexC]);
    
    expect(graph.isEulerian()).toStrictEqual(0);
  });

  it('should return 0 for non-eulerian graph', () => {
    const vertexA = new GraphVertex('A');
    const vertexB = new GraphVertex('B');
    const vertexC = new GraphVertex('C');
    const vertexD = new GraphVertex('D');

    const edgeAB = new GraphEdge(vertexA, vertexB);
    const edgeBC = new GraphEdge(vertexB, vertexC);
    const edgeCD = new GraphEdge(vertexB, vertexD);

    const graph = new Graph();

    graph.addEdges([edgeAB, edgeBC, edgeCD]);
    
    expect(graph.isEulerian()).toStrictEqual(0);
  });

  it('should return 1 for an eulerian path of directed graph', () => {
    const vertexA = new GraphVertex('A');
    const vertexB = new GraphVertex('B');
    const vertexC = new GraphVertex('C');
    const vertexD = new GraphVertex('D');
    const vertexE = new GraphVertex('E');
    const vertexF = new GraphVertex('F');

    const edgeAB = new GraphEdge(vertexA, vertexB);
    const edgeBC = new GraphEdge(vertexB, vertexC);
    const edgeCD = new GraphEdge(vertexC, vertexD);
    const edgeDE = new GraphEdge(vertexD, vertexE);
    const edgeEF = new GraphEdge(vertexE, vertexF);
    const edgeBE= new GraphEdge(vertexB, vertexE);

    const graph = new Graph();

    graph.addEdges([edgeAB, edgeBC, edgeCD, edgeDE, edgeEF]);
    
    expect(graph.isEulerian()).toStrictEqual(1);
  });

  it('should return 2 for an eulerian cycle of directed graph', () => {
    const vertexA = new GraphVertex('A');
    const vertexB = new GraphVertex('B');
    const vertexC = new GraphVertex('C');
    const vertexD = new GraphVertex('D');
    const vertexE = new GraphVertex('E');
    const vertexF = new GraphVertex('F');

    const edgeAB = new GraphEdge(vertexA, vertexB);
    const edgeBC = new GraphEdge(vertexB, vertexC);
    const edgeCD = new GraphEdge(vertexC, vertexD);
    const edgeDE = new GraphEdge(vertexD, vertexE);
    const edgeEF = new GraphEdge(vertexE, vertexF);
    const edgeFA= new GraphEdge(vertexF, vertexA);

    const graph = new Graph();

    graph.addEdges([edgeAB, edgeBC, edgeCD, 
                    edgeDE, edgeEF, edgeFA]);
    
    expect(graph.isEulerian()).toStrictEqual(2);
  });

  it('should return reverse star representation of a graph', () => {
    const vertexA = new GraphVertex('A');
    const vertexB = new GraphVertex('B');
    const vertexC = new GraphVertex('C');
    const vertexD = new GraphVertex('D');
    const vertexE = new GraphVertex('E');
    const vertexF = new GraphVertex('F');

    const edgeAB = new GraphEdge(vertexA, vertexB);
    const edgeBC = new GraphEdge(vertexB, vertexC);
    const edgeCD = new GraphEdge(vertexC, vertexD);
    const edgeDE = new GraphEdge(vertexD, vertexE);
    const edgeEF = new GraphEdge(vertexE, vertexF);
    const edgeFA= new GraphEdge(vertexF, vertexA);

    const graph = new Graph(true);

    graph.addEdges([edgeAB, edgeBC, edgeCD, 
                    edgeDE, edgeEF, edgeFA]);
    
    expect(graph.getAdjacencyList(1)).toEqual({
      0: [5],
      1: [0],
      2: [1],
      3: [2],
      4: [3],
      5: [4],
    });
  });

  it('should return true for strongly connected graph', () => {
    const vertex0 = new GraphVertex('0');
    const vertex1 = new GraphVertex('1');
    const vertex2 = new GraphVertex('2');
    const vertex3 = new GraphVertex('3');
    const vertex4 = new GraphVertex('4');

    const edge01 = new GraphEdge(vertex0, vertex1);
    const edge12 = new GraphEdge(vertex1, vertex2);
    const edge24 = new GraphEdge(vertex2, vertex4);
    const edge42 = new GraphEdge(vertex4, vertex2);
    const edge23= new GraphEdge(vertex2, vertex3);
    const edge30= new GraphEdge(vertex3, vertex0);

    const graph = new Graph(true);

    graph.addEdges([edge01, edge12, edge24, edge42, edge23, edge30]);
    
    expect(graph.isStronglyConnected()).toEqual(true);
  });

  it('should return bridges in a graph', () => {
    // A directed graph
    const graph = new Graph(true);

    // Nodes
    const A = new GraphVertex('A');
    const B = new GraphVertex('B');
    const C = new GraphVertex('C');
    const D = new GraphVertex('D');
    const E = new GraphVertex('E');
    const F = new GraphVertex('F');

    // Vertices
    const AB = new GraphEdge(A, B);
    const BC = new GraphEdge(B, C);
    const CD = new GraphEdge(C, D);
    const CE = new GraphEdge(C, E);
    const EB = new GraphEdge(E, B);
    const CF = new GraphEdge(C, F);
    const FB = new GraphEdge(F, B);

    // Add vertices
    graph.addVertices([A, B, C, D, E, F]);

    // Add edges
    graph.addEdges([AB, BC, CD, CE, EB, CF, FB]);

    expect(graph.cyclicCircuits()).toStrictEqual([[1, 2, 4], [1, 2, 5]]);
  });

  it('should return articulation points in a graph', () => {
    // A directed graph
    const graph = new Graph(false);

    // Nodes
    const A = new GraphVertex('A');
    const B = new GraphVertex('B');
    const C = new GraphVertex('C');
    const D = new GraphVertex('D');
    const E = new GraphVertex('E');
    const F = new GraphVertex('F');
    const G = new GraphVertex('G');
    const H = new GraphVertex('H');
    
    // Vertices
    const AB = new GraphEdge(A, B);
    const AC = new GraphEdge(A, C);
    const BD = new GraphEdge(B, D);
    const CD = new GraphEdge(C, D);
    const DE = new GraphEdge(D, E);
    const EF = new GraphEdge(E, F);
    const EG = new GraphEdge(E, G);
    const FH = new GraphEdge(F, H);
    const GH = new GraphEdge(G, H);

    // Add edges
    graph.addEdges([AB, AC, BD, CD, DE, 
                    EF, EG, FH, GH]);
    
    expect(graph.articulationPoints()).toStrictEqual([4, 3]);
  });

  it('should return true for strongly connected graph', () => {
    let vertex_keys=['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

    const [A, B, C, D, E, F, G, H] = createVertices(vertex_keys);

    let [AB, AC, CD, BD, 
         EF, EG, FH, GH, 
         DE]=createEdges([[A, B], [B, C], [C, D], [D, A], 
                          [E, F], [F, G], [G, H], [H, E], 
                          [D, E]])
    
    const graph = new Graph(true);
    
    graph.addEdges([AB, AC, CD, BD, EF, EG, FH, GH, DE]);
    
    let SCComponents = graph.getStronglyConnectedComponents();
    
    expect(SCComponents).toEqual([[0, 3, 2, 1], [4, 7, 6, 5]]);
  });

  it('Bridges in graph', () => {
    // A directed graph
    const graph = new Graph(true);

    // Nodes
    const A = new GraphVertex('A');
    const B = new GraphVertex('B');
    const C = new GraphVertex('C');
    const D = new GraphVertex('D');
    const E = new GraphVertex('E');
    const F = new GraphVertex('F');

    // Vertices
    const AB = new GraphEdge(A, B);
    const BC = new GraphEdge(B, C);
    const CD = new GraphEdge(C, D);
    const CE = new GraphEdge(C, E);
    const EB = new GraphEdge(E, B);
    const CF = new GraphEdge(C, F);
    const FB = new GraphEdge(F, B);

    // Add vertices
    graph.addVertices([A, B, C, D, E, F]);

    // Add edges
    graph.addEdges([AB, BC, CD, CE, EB, CF, FB]);

    expect(graph.getVertexByIndex(0)).toStrictEqual(A);
  });

  it('Cycles in a finite graph must be finite', () => {
    // A directed graph
    const graph = new Graph(true);

    // Vertices
    const [A, B, C] = createVertices(['A', 'B', 'C']);

    // Edges
    const [AB, BC] = createEdges([[A, B], [B, C]]);

    // Add edges
    graph.addEdges([AB, BC]);

    expect(graph.cyclicCircuits()).toEqual([]);
  });

  it('should find edge by vertices in undirected graph', () => {
    const graph = new Graph();

    const vertexA = new GraphVertex('A');
    const vertexB = new GraphVertex('B');
    const vertexC = new GraphVertex('C');

    const edgeAB = new GraphEdge(vertexA, vertexB, 10);

    graph.addEdge(edgeAB);

    const graphEdgeAB = graph.findEdge(vertexA, vertexB);
    const graphEdgeBA = graph.findEdge(vertexB, vertexA);
    const graphEdgeAC = graph.findEdge(vertexA, vertexC);
    const graphEdgeCA = graph.findEdge(vertexC, vertexA);

    expect(graphEdgeAC).toBeNull();
    expect(graphEdgeCA).toBeNull();
    expect(graphEdgeAB).toEqual(edgeAB);
    expect(graphEdgeBA).toEqual(edgeAB);
    expect(graphEdgeAB.weight).toBe(10);
  });

  it('should find edge by vertices in directed graph', () => {
    const graph = new Graph(true);

    const vertexA = new GraphVertex('A');
    const vertexB = new GraphVertex('B');
    const vertexC = new GraphVertex('C');

    const edgeAB = new GraphEdge(vertexA, vertexB, 10);

    graph.addEdge(edgeAB);

    const graphEdgeAB = graph.findEdge(vertexA, vertexB);
    const graphEdgeBA = graph.findEdge(vertexB, vertexA);
    const graphEdgeAC = graph.findEdge(vertexA, vertexC);
    const graphEdgeCA = graph.findEdge(vertexC, vertexA);

    expect(graphEdgeAC).toBeNull();
    expect(graphEdgeCA).toBeNull();
    expect(graphEdgeBA).toBeNull();
    expect(graphEdgeAB).toEqual(edgeAB);
    expect(graphEdgeAB.weight).toBe(10);
  });

  it('should return vertex neighbors', () => {
    const graph = new Graph(true);

    const vertexA = new GraphVertex('A');
    const vertexB = new GraphVertex('B');
    const vertexC = new GraphVertex('C');

    const edgeAB = new GraphEdge(vertexA, vertexB);
    const edgeAC = new GraphEdge(vertexA, vertexC);

    graph.addEdges([edgeAB, edgeAC]);

    const neighbors = graph.getNeighbors(vertexA);

    expect(neighbors.length).toBe(2);
    expect(neighbors[0]).toEqual(vertexB);
    expect(neighbors[1]).toEqual(vertexC);
  });

  it('should return graph density', () => {
    const graph = new Graph(true);

    const vertexA = new GraphVertex('A');
    const vertexB = new GraphVertex('B');
    const vertexC = new GraphVertex('C');

    const edgeAB = new GraphEdge(vertexA, vertexB);
    const edgeAC = new GraphEdge(vertexA, vertexC);

    graph.addEdges([edgeAB, edgeAC]);

    const { density } = graph;

    expect(density).toEqual(2 / 3);
  });

  it('should throw an error when trying to add edge twice', () => {
    function addSameEdgeTwice() {
      const graph = new Graph(true);

      const vertexA = new GraphVertex('A');
      const vertexB = new GraphVertex('B');

      const edgeAB = new GraphEdge(vertexA, vertexB);

      graph.addEdges([edgeAB, edgeAB]);
    }

    expect(addSameEdgeTwice).toThrow();
  });

  it('should return the list of all added edges', () => {
    const graph = new Graph(true);

    const vertexA = new GraphVertex('A');
    const vertexB = new GraphVertex('B');
    const vertexC = new GraphVertex('C');

    const edgeAB = new GraphEdge(vertexA, vertexB);
    const edgeBC = new GraphEdge(vertexB, vertexC);

    graph.addEdges([edgeAB, edgeBC]);

    const edges = graph.getAllEdges();

    expect(edges.length).toBe(2);
    expect(edges[0]).toEqual(edgeAB);
    expect(edges[1]).toEqual(edgeBC);
  });

  it('should calculate total graph weight for default graph', () => {
    const graph = new Graph();

    const vertexA = new GraphVertex('A');
    const vertexB = new GraphVertex('B');
    const vertexC = new GraphVertex('C');
    const vertexD = new GraphVertex('D');

    const edgeAB = new GraphEdge(vertexA, vertexB);
    const edgeBC = new GraphEdge(vertexB, vertexC);
    const edgeCD = new GraphEdge(vertexC, vertexD);
    const edgeAD = new GraphEdge(vertexA, vertexD);

    graph.addEdges([edgeAB, edgeBC, edgeCD, edgeAD]);

    expect(graph.getWeight()).toBe(0);
  });

  it('should calculate total graph weight for weighted graph', () => {
    const graph = new Graph();

    const vertexA = new GraphVertex('A');
    const vertexB = new GraphVertex('B');
    const vertexC = new GraphVertex('C');
    const vertexD = new GraphVertex('D');

    const edgeAB = new GraphEdge(vertexA, vertexB, 1);
    const edgeBC = new GraphEdge(vertexB, vertexC, 2);
    const edgeCD = new GraphEdge(vertexC, vertexD, 3);
    const edgeAD = new GraphEdge(vertexA, vertexD, 4);

    graph.addEdges([edgeAB, edgeBC, edgeCD, edgeAD]);

    expect(graph.getWeight()).toBe(10);
  });

  it('should get vertices to indexes', () => {
    const graph = new Graph();

    const vertexA = new GraphVertex('A');
    const vertexB = new GraphVertex('B');
    const vertexC = new GraphVertex('C');

    graph.addVertices([vertexA, vertexB, vertexC]);

    expect(graph.getVerticesIndices()).toEqual({
      A: 0,
      B: 1,
      C: 2,
    });
  });

  it('should get indexes to vertices', () => {
    const graph = new Graph();

    const vertexA = new GraphVertex('A');
    const vertexB = new GraphVertex('B');
    const vertexC = new GraphVertex('C');

    graph.addVertices([vertexA, vertexB, vertexC]);

    expect(graph.getIndicesToVertices()).toEqual({
      0: 'A',
      1: 'B',
      2: 'C',
    });
  });

  it('should get vertex index', () => {
    const graph = new Graph();

    const vertexA = new GraphVertex('A');
    const vertexB = new GraphVertex('B');
    const vertexC = new GraphVertex('C');

    graph.addVertices([vertexA, vertexB, vertexC]);

    expect(graph.getVertexIndex(vertexA)).toEqual(0);
    expect(graph.getVertexIndex(vertexC)).toEqual(2);
    expect(graph.getVertexIndex(vertexB)).toEqual(1);
  });

  it('should prove if a graph is cyclic', () => {
    // A directed graph
    const graph_ = new Graph(true);

    // Nodes
    let [A, B, C, D, E, F] = createVertices(['A', 'B', 'C', 'D', 'E', 'F'])

    // Vertices
    const [AB, BC, CD, CE, 
           EB, CF, FB] = new createEdges([[A, B], [B, C], [C, D], [C, E], 
                                          [E, B], [C, F], [F, B]]);
    
    // Add edges
    graph_.addEdges([AB, BC, CD, CE, EB, CF, FB]);

    expect(graph_.isCyclic()).toEqual(true);
  });

  it('should prove if a graph is acyclic', () => {
    // A directed graph
    const graph_ = new Graph(true);

    // Nodes
    const A = new GraphVertex('A');
    const B = new GraphVertex('B');
    const C = new GraphVertex('C');

    // Vertices
    const AB = new GraphEdge(A, B);
    const BC = new GraphEdge(B, C);

    // Add edges
    graph_.addEdges([AB, BC]);

    expect(graph_.isCyclic()).toEqual(false);
  });

  it('should be possible to delete edges from graph', () => {
    const graph = new Graph();

    const vertexA = new GraphVertex('A');
    const vertexB = new GraphVertex('B');
    const vertexC = new GraphVertex('C');

    const edgeAB = new GraphEdge(vertexA, vertexB);
    const edgeBC = new GraphEdge(vertexB, vertexC);
    const edgeAC = new GraphEdge(vertexA, vertexC);

    graph.addEdges([edgeAB, edgeBC, edgeAC]);

    expect(graph.getAllEdges().length).toBe(3);

    graph.deleteEdge(edgeAB);

    expect(graph.getAllEdges().length).toBe(2);
    expect(graph.getAllEdges()[0].getKey()).toBe(edgeBC.getKey());
    expect(graph.getAllEdges()[1].getKey()).toBe(edgeAC.getKey());
  });

  it('should throw an error when trying to delete not existing edge', () => {
    function deleteNotExistingEdge() {
      const graph = new Graph();

      const vertexA = new GraphVertex('A');
      const vertexB = new GraphVertex('B');
      const vertexC = new GraphVertex('C');

      const edgeAB = new GraphEdge(vertexA, vertexB);
      const edgeBC = new GraphEdge(vertexB, vertexC);

      graph.addEdge(edgeAB);
      graph.deleteEdge(edgeBC);
    }

    expect(deleteNotExistingEdge).toThrowError();
  });

  it('should return cycles from private property', () => {
    const graph_ = new Graph(true);

    // Nodes
    const A = new GraphVertex('A');
    const B = new GraphVertex('B');
    const C = new GraphVertex('C');
    const D = new GraphVertex('D');
    const E = new GraphVertex('E');
    const F = new GraphVertex('F');

    // Vertices
    const AB = new GraphEdge(A, B);
    const BC = new GraphEdge(B, C);
    const CD = new GraphEdge(C, D);
    const CE = new GraphEdge(C, E);
    const EB = new GraphEdge(E, B);
    const CF = new GraphEdge(C, F);
    const FB = new GraphEdge(F, B);

    // Add edges
    graph_.addEdges([AB, BC, CD, CE, EB, CF, FB]);
    
    expect(graph_.cycles).toEqual([[1, 2, 4], [1, 2, 5]]);
  });

  it('should return true for connected graph', () => {
    const graph = new Graph(true);

    // Nodes
    const A = new GraphVertex('A');
    const B = new GraphVertex('B');
    const C = new GraphVertex('C');
    const D = new GraphVertex('D');
    const E = new GraphVertex('E');
    const F = new GraphVertex('F');

    // Vertices
    const AB = new GraphEdge(A, B);
    const BC = new GraphEdge(B, C);
    const CD = new GraphEdge(C, D);
    const CE = new GraphEdge(C, E);
    const EB = new GraphEdge(E, B);
    const CF = new GraphEdge(C, F);
    const FB = new GraphEdge(F, B);

    // Add edges
    graph.addEdges([AB, BC, CD, CE, EB, CF, FB]);
    
    expect(graph.isConnected()).toEqual(true);
  });

  it('should return false for not-connected graph', () => {
    const graph = new Graph(true);

    // Nodes
    let [A, B, C] = createVertices(['A', 'B', 'C']);
    let [AB] = createEdges([[A, B]]);

    // Add edges
    graph.addVertices([A, B, C]);
    graph.addEdges([AB]);
    
    expect(graph.isConnected()).toEqual(false);
  });

  it('should return true for connected graph', () => {
    const graph = new Graph(true);

    // Nodes
    const A = new GraphVertex('A');
    const B = new GraphVertex('B');
    const C = new GraphVertex('C');
    const D = new GraphVertex('D');
    const E = new GraphVertex('E');
    const F = new GraphVertex('F');

    // Vertices
    const AB = new GraphEdge(A, B);
    const BC = new GraphEdge(B, C);
    const CD = new GraphEdge(C, D);
    const CE = new GraphEdge(C, E);
    const EB = new GraphEdge(E, B);
    const CF = new GraphEdge(C, F);
    const FB = new GraphEdge(F, B);

    // Add edges
    graph.addEdges([AB, BC, CD, CE, EB, CF, FB]);
    
    expect(graph.isConnected()).toEqual(true);
  });

  it('should return false for graph without edges', () => {
    const graph = new Graph(true);

    // Nodes
    const A = new GraphVertex('A');
    const B = new GraphVertex('B');
    const C = new GraphVertex('C');
    const D = new GraphVertex('D');
    const E = new GraphVertex('E');
    const F = new GraphVertex('F');

    graph.addVertices([A, B, C, D, E, F])

    expect(graph.isConnected()).toEqual(false);
  });

  it('should return empty for non-eulerian graph', () => {
    const graph = new Graph(true);

    // Nodes
    const A = new GraphVertex('A');
    const B = new GraphVertex('B');
    const C = new GraphVertex('C');
    const D = new GraphVertex('D');
    const E = new GraphVertex('E');
    const F = new GraphVertex('F');

    const AB = new GraphEdge(A, B);
    const BC = new GraphEdge(B, C);
    const CD = new GraphEdge(C, D);
    const DE = new GraphEdge(D, E);
    const EF = new GraphEdge(E, F);
    const BE = new GraphEdge(B, E);

    graph.addEdges([AB, BC, CD, DE, EF, BE])

    expect(graph.getEulerianPath()).toEqual([]);
  });

  it('should return paths for eulerian graph', () => {
    const graph = new Graph(true);

    // Nodes
    const A = new GraphVertex('A');
    const B = new GraphVertex('B');
    const C = new GraphVertex('C');
    const D = new GraphVertex('D');
    const E = new GraphVertex('E');
    const F = new GraphVertex('F');

    const AB = new GraphEdge(A, B);
    const BC = new GraphEdge(B, C);
    const CD = new GraphEdge(C, D);
    const DE = new GraphEdge(D, E);
    const EF = new GraphEdge(E, F);

    graph.addEdges([AB, BC, CD, DE, EF])
    
    expect(graph.getEulerianPath()).toEqual([]);
  });

  it('should return acyclic paths', () => {
    const graph_ = new Graph(true);

    // Nodes
    const A = new GraphVertex('A');
    const B = new GraphVertex('B');
    const C = new GraphVertex('C');
    const D = new GraphVertex('D');
    const E = new GraphVertex('E');
    const F = new GraphVertex('F');

    // Vertices
    const AB = new GraphEdge(A, B);
    const BC = new GraphEdge(B, C);
    const CD = new GraphEdge(C, D);
    const CE = new GraphEdge(C, E);
    const EB = new GraphEdge(E, B);
    const CF = new GraphEdge(C, F);
    const FB = new GraphEdge(F, B);
    
    // Add edges
    graph_.addEdges([AB, BC, CD, CE, EB, CF, FB]);

    expect(graph_.acyclicPaths(A, F)).toEqual([[0, 1, 2, 5]]);
  });

  it('should return all paths from from_key to to_key', () => {
    // A directed graph
    const graph_ = new Graph(true);

    // Nodes
    const node_labels = ['A', 'B', 'C', 'D', 'E', 'F'];
    const [A, B, C, D, E, F] = createVertices(node_labels);
    
    // Vertices
    const edge_vertices = [[A, B], [B, C], [C, D], [C, E], [E, B], [C, F], [F, B]];
    
    // Add edges
    graph_.addEdges(createEdges(edge_vertices));
    
    expect(graph_.allPaths(A, D)).toStrictEqual([
      [0, 1, 2, 3],
      [0, 1, 2, 4, 1, 2, 3],
      [0, 1, 2, 5, 1, 2, 3]
    ]);
  });
  
  it('should return cycles of vertices', () => {
    const graph_ = new Graph(true);

    // Nodes
    const A = new GraphVertex('A');
    const B = new GraphVertex('B');
    const C = new GraphVertex('C');
    const D = new GraphVertex('D');
    const E = new GraphVertex('E');
    const F = new GraphVertex('F');
    
    // Vertices
    const AB = new GraphEdge(A, B);
    const BC = new GraphEdge(B, C);
    const CD = new GraphEdge(C, D);
    const CE = new GraphEdge(C, E);
    const EB = new GraphEdge(E, B);
    const CF = new GraphEdge(C, F);
    const FB = new GraphEdge(F, B);

    // Add edges
    graph_.addEdges([AB, BC, CD, CE, EB, CF, FB]);

    expect(graph_.getVertexCycles()).toEqual({
      0: [],
      1: [[1, 2, 4], [1, 2, 5]],
      2: [[1, 2, 4], [1, 2, 5]],
      3: [],
      4: [[1, 2, 4]],
      5: [[1, 2, 5]],
    });
  });

  it('should return cycle indices', () => {
    const graph_ = new Graph(true);

    // Nodes
    const A = new GraphVertex('A');
    const B = new GraphVertex('B');
    const C = new GraphVertex('C');
    const D = new GraphVertex('D');
    const E = new GraphVertex('E');
    const F = new GraphVertex('F');

    // Vertices
    const AB = new GraphEdge(A, B);
    const BC = new GraphEdge(B, C);
    const CD = new GraphEdge(C, D);
    const CE = new GraphEdge(C, E);
    const EB = new GraphEdge(E, B);
    const CF = new GraphEdge(C, F);
    const FB = new GraphEdge(F, B);

    // Add edges
    graph_.addEdges([AB, BC, CD, CE, EB, CF, FB]);

    expect(graph_.getCycleIndices()).toEqual({
      0: [1, 2, 4],
      1: [1, 2, 5],
    });
  });

  it('should return loose nodes', () => {
    const graph_ = new Graph(true);

    // Nodes
    const A = new GraphVertex('A');
    const B = new GraphVertex('B');
    const C = new GraphVertex('C');
    const D = new GraphVertex('D');
    const E = new GraphVertex('E');
    const F = new GraphVertex('F');

    // Vertices
    const AB = new GraphEdge(A, B);
    const BC = new GraphEdge(B, C);
    const CD = new GraphEdge(C, D);
    const CE = new GraphEdge(C, E);
    const EB = new GraphEdge(E, B);
    const CF = new GraphEdge(C, F);
    const FB = new GraphEdge(F, B);

    // Add edges
    graph_.addEdges([AB, BC, CD, CE, EB, CF, FB]);

    expect(graph_.looseNodes()).toEqual([3]);
  });

  it('should return orphan nodes', () => {
    const graph_ = new Graph(true);

    // Nodes
    const A = new GraphVertex('A');
    const B = new GraphVertex('B');
    const C = new GraphVertex('C');
    const D = new GraphVertex('D');

    // Vertices
    const AB = new GraphEdge(A, B);
    const BC = new GraphEdge(B, C);
    const DB = new GraphEdge(D, B);

    // Add edges
    graph_.addEdges([AB, BC, DB]);

    expect(graph_.orphanNodes()).toEqual([0, 3]);
  });

  it('should be possible to reverse graph', () => {
    const vertexA = new GraphVertex('A');
    const vertexB = new GraphVertex('B');
    const vertexC = new GraphVertex('C');
    const vertexD = new GraphVertex('D');

    const edgeAB = new GraphEdge(vertexA, vertexB);
    const edgeAC = new GraphEdge(vertexA, vertexC);
    const edgeCD = new GraphEdge(vertexC, vertexD);

    const graph = new Graph(true);
    graph.addEdges([edgeAB, edgeAC, edgeCD]);

    expect(graph.toString()).toBe('A_B,A_C,C_D');
    expect(graph.getAllEdges().length).toBe(3);
    expect(graph.getNeighbors(vertexA).length).toBe(2);
    expect(graph.getNeighbors(vertexA)[0].getKey()).toBe(vertexB.getKey());
    expect(graph.getNeighbors(vertexA)[1].getKey()).toBe(vertexC.getKey());
    expect(graph.getNeighbors(vertexB).length).toBe(0);
    expect(graph.getNeighbors(vertexC).length).toBe(1);
    expect(graph.getNeighbors(vertexC)[0].getKey()).toBe(vertexD.getKey());
    expect(graph.getNeighbors(vertexD).length).toBe(0);

    graph.reverse();

    expect(graph.toString()).toBe('B_A,C_A,D_C');
    expect(graph.getAllEdges().length).toBe(3);
    expect(graph.getNeighbors(vertexA).length).toBe(0);
    expect(graph.getNeighbors(vertexB).length).toBe(1);
    expect(graph.getNeighbors(vertexB)[0].getKey()).toBe(vertexA.getKey());
    expect(graph.getNeighbors(vertexC).length).toBe(1);
    expect(graph.getNeighbors(vertexC)[0].getKey()).toBe(vertexA.getKey());
    expect(graph.getNeighbors(vertexD).length).toBe(1);
    expect(graph.getNeighbors(vertexD)[0].getKey()).toBe(vertexC.getKey());
  });

  it('should warn about reversing a undirected graph', () => {
    const graph = new Graph(false);

    const vertexA = new GraphVertex('A');
    const vertexB = new GraphVertex('B');

    const edgeAB = new GraphEdge(vertexA, vertexB);

    graph.addEdge(edgeAB);
    graph.reverse();

    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it('should return vertices indices', () => {
    const vertexA = new GraphVertex('A');
    const vertexB = new GraphVertex('B');
    const vertexC = new GraphVertex('C');
    const vertexD = new GraphVertex('D');

    const edgeAB = new GraphEdge(vertexA, vertexB);
    const edgeBC = new GraphEdge(vertexB, vertexC);
    const edgeCD = new GraphEdge(vertexC, vertexD);
    const edgeBD = new GraphEdge(vertexB, vertexD);

    const graph = new Graph();
    graph.addEdges([edgeAB, edgeBC, edgeCD, edgeBD]);

    const verticesIndices = graph.getVerticesIndices();
    expect(verticesIndices).toEqual({
      A: 0,
      B: 1,
      C: 2,
      D: 3,
    });
  });

  it('should generate adjacency matrix for undirected graph', () => {
    const vertexA = new GraphVertex('A');
    const vertexB = new GraphVertex('B');
    const vertexC = new GraphVertex('C');
    const vertexD = new GraphVertex('D');

    const edgeAB = new GraphEdge(vertexA, vertexB);
    const edgeBC = new GraphEdge(vertexB, vertexC);
    const edgeCD = new GraphEdge(vertexC, vertexD);
    const edgeBD = new GraphEdge(vertexB, vertexD);

    const graph = new Graph();
    graph.addEdges([edgeAB, edgeBC, edgeCD, edgeBD]);

    const adjacencyMatrix = graph.getAdjacencyMatrix();
    expect(adjacencyMatrix).toEqual([
      [Infinity, 0, Infinity, Infinity],
      [0, Infinity, 0, 0],
      [Infinity, 0, Infinity, 0],
      [Infinity, 0, 0, Infinity],
    ]);
  });

  it('should generate adjacency matrix for directed graph', () => {
    const vertexA = new GraphVertex('A');
    const vertexB = new GraphVertex('B');
    const vertexC = new GraphVertex('C');
    const vertexD = new GraphVertex('D');

    const edgeAB = new GraphEdge(vertexA, vertexB, 2);
    const edgeBC = new GraphEdge(vertexB, vertexC, 1);
    const edgeCD = new GraphEdge(vertexC, vertexD, 5);
    const edgeBD = new GraphEdge(vertexB, vertexD, 7);

    const graph = new Graph(true);
    graph.addEdges([edgeAB, edgeBC, edgeCD, edgeBD]);

    const adjacencyMatrix = graph.getAdjacencyMatrix();
    expect(adjacencyMatrix).toEqual([
      [Infinity, 2, Infinity, Infinity],
      [Infinity, Infinity, 1, 7],
      [Infinity, Infinity, Infinity, 5],
      [Infinity, Infinity, Infinity, Infinity],
    ]);
  });
});
