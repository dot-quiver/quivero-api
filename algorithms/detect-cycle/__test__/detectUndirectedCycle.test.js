import GraphVertex from '../../../data-structures/graph/GraphVertex.js';
import GraphEdge from '../../../data-structures/graph/GraphEdge.js';
import Graph from '../../../data-structures/graph/Graph.js';
import detectUndirectedCycle from '../detectUndirectedCycle.js';

describe('detectUndirectedCycle', () => {
  it('should detect undirected cycle', () => {
    const vertexA = new GraphVertex('A');
    const vertexB = new GraphVertex('B');
    const vertexC = new GraphVertex('C');
    const vertexD = new GraphVertex('D');
    const vertexE = new GraphVertex('E');
    const vertexF = new GraphVertex('F');

    const edgeAF = new GraphEdge(vertexA, vertexF);
    const edgeAB = new GraphEdge(vertexA, vertexB);
    const edgeBE = new GraphEdge(vertexB, vertexE);
    const edgeBC = new GraphEdge(vertexB, vertexC);
    const edgeCD = new GraphEdge(vertexC, vertexD);
    const edgeDE = new GraphEdge(vertexD, vertexE);

    const graph = new Graph();
    graph
      .addEdges([edgeAF, edgeAB, edgeBE, edgeBC, edgeCD]);

    expect(detectUndirectedCycle(graph)).toBeNull();

    graph.addEdge(edgeDE);

    expect(detectUndirectedCycle(graph)).toEqual({
      B: vertexC,
      C: vertexD,
      D: vertexE,
      E: vertexB,
    });
  });
});
