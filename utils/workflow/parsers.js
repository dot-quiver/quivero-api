import _ from 'lodash';
import fs from 'fs';

import { createRequire } from 'module';
import Graph from '../../data-structures/graph/Graph.js';

import {
  createEdgesFromVerticesValues,
} from '../../data-structures/graph/utils/graph.js';

import {
  getAllIndexes,
  removeArrayDuplicates,
  hasElement,
} from '../arrays/arrays.js';

import {
  filenameHasExtension,
  createDirectory,
  saveFilenameContentObject,
  loadJSONfromFile,
} from '../file/file.js';

import {
  objectReduce,
  objectFilter,
  objectFlatten,
  objectKeyFind,
} from '../objects/objects.js';

const diagramConfig = loadJSONfromFile(`${process.cwd()}/utils/workflow/`, 'diagramConfig');

const node_types = [
  'start', 'finish', 'systemtask', 'subprocess', 'scripttask', 'flow', 'usertask',
];

const require = createRequire(import.meta.url);

/**
 * @abstract
 *
 * @param {Object} bps_root_path
 * @param {Object} blueprint_name
 * @param {Object} blueprintFn
 * @return processed_blueprint
 */
export const readBlueprintFromFile = (bps_root_path, blueprint_name) => {
  const fname = `${bps_root_path}/${blueprint_name}`;
  const tokens = fname.split('.');

  if (tokens[tokens.length - 1] === 'json') {
    const blueprint = require(fname);

    return blueprint;
  }
  return {};
};

/**
 * @abstract returns the output of processed blueprint blueprint_name
 * for given path bps_root_path to blueprints and blueprint process
 * function blueprintFn
 *
 * @param {Object} bps_root_path
 * @param {Object} blueprint_name
 * @param {Object} blueprintFn
 * @return processed_blueprint
 */
export const processBlueprint = (bps_root_path, blueprint_name, blueprintFn) => {
  const blueprint = readBlueprintFromFile(bps_root_path, blueprint_name);

  if (Object.keys(blueprint).length !== 0) {
    return blueprintFn(blueprint);
  }
  return {};
};

/**
 * @abstract return the result of function blueprintFn respective to path bps_root_path
 *
 * @param {Object} bps_root_path
 * @param {Object} blueprint_name
 * @param {Object} blueprintFn
 * @return processed_blueprint
 */
export const processBlueprints = (bps_root_path, blueprintFn) => {
  const processed_blueprints = {};
  const blueprints_fnames = fs.readdirSync(bps_root_path).filter(
    (filename) => filenameHasExtension(filename, 'json'),
  );

  for (let i = 0; i < blueprints_fnames.length; i += 1) {
    console.log(`[${i}/${blueprints_fnames.length}]: ${blueprints_fnames[i]}`);

    const blueprint_i_name = blueprints_fnames[i];

    processed_blueprints[blueprint_i_name] = processBlueprint(bps_root_path, blueprint_i_name, blueprintFn);
  }

  return processed_blueprints;
};

/**
 * @abstract returns object with current and next nodes given a blueprint
 *
 * @param {Object} blueprint
 * @return next_ndoes
 */
export const getBlueprintNextNodes = (blueprint) => {
  const { nodes } = blueprint.blueprint_spec;

  return objectReduce(
    nodes,
    (next_nodes, node_key, node_value) => {
      if (node_value.type.toLowerCase() === 'flow') {
        next_nodes[node_value.id] = Object.values(node_value.next);
      } else if (node_value.type.toLowerCase() === 'finish') {
      } else {
        next_nodes[node_value.id] = [node_value.next];
      }

      return next_nodes;
    },
    {},
  );
};

/**
 * @abstract returns object with edges current-to-next nodes given a blueprint
 *
 * @param {Object} blueprint
 * @return edges
 */
export const getBlueprintFromToEdgeTuples = (blueprint) => {
  const { nodes } = blueprint.blueprint_spec;

  return objectReduce(
    getBlueprintNextNodes(blueprint),
    (edge_nodes, curr_node_key, curr_node_value) => {
      if (curr_node_value.length > 1) {
        edge_nodes = edge_nodes.concat(
          curr_node_value.map((next_node_key) => [curr_node_key, next_node_key]),
        );
      } else {
        edge_nodes.push([curr_node_key, curr_node_value[0]]);
      }

      return edge_nodes;
    },
    [],
  );
};

/**
 * @abstract returns node reachability object from start nodes
 *
 * @param {Object} blueprint
 * @param {Object} description
 */
export const reachableNodesFromStartNodes = (blueprint) => {
  const start_finish_nodes = startAndFinishNodes(blueprint);
  const reachable_nodes = {};

  const bp_graph = parseBlueprintToGraph(blueprint);
  const workflow_finish_reachability = {};

  for (const start_node_key of start_finish_nodes.start_nodes) {
    workflow_finish_reachability[start_node_key] = [];

    reachable_nodes[start_node_key] = bp_graph.convertVerticesIndexestoKeys(
      bp_graph.reachableNodes(start_node_key),
    );
  }

  return reachable_nodes;
};

/**
 * @abstract returns finish node reachability object from start nodes
 *
 * @param {Object} blueprint
 * @param {Object} description
 */
export const reachableFinishNodesFromStartNodes = (blueprint) => {
  const start_finish_nodes = startAndFinishNodes(blueprint);
  const reachable_nodes = reachableNodesFromStartNodes(blueprint);

  const bp_graph = parseBlueprintToGraph(blueprint);

  for (const start_node_key of start_finish_nodes.start_nodes) {
    reachable_nodes[start_node_key] = _.intersection(
      reachable_nodes[start_node_key],
      start_finish_nodes.finish_nodes,
    );
  }

  return reachable_nodes;
};

/**
 * @abstract returns an object with a rich description of given blueprint
 *
 * @param {Object} blueprint
 * @param {Object} description
 */
export const describeBlueprint = (blueprint) => {
  const bp_graph = parseBlueprintToGraph(blueprint);

  return {
    name: blueprint.name,
    description: blueprint.description,
    node_ids_per_type: getBlueprintAllNodesByType(blueprint),
    reachable_finish_from_start: reachableFinishNodesFromStartNodes(blueprint),
    graph: bp_graph.describe(),
  };
};

/**
 * @abstract returns an object with all nodes specified by type as keys
 *
 * @param {Object} blueprint
 * @param {Integer} type
 * @param {Object} nodes_per_type
 */
export const getBlueprintNodesByType = (blueprint, type) => {
  const { nodes } = blueprint.blueprint_spec;
  const nodes_per_type = [];

  for (const node of nodes) {
    if (node.type.toLowerCase() === type) {
      nodes_per_type.push(node.id);
    }
  }

  return nodes_per_type;
};

/**
 * @abstract returns an object with all nodes specified by type as keys
 *
 * @param {Object} blueprint
 * @param {Integer} type
 * @param {Object} nodes_per_type
 */
export const getBlueprintNodesByTypeCategory = (blueprint, type) => {
  const { nodes } = blueprint.blueprint_spec;
  const nodes_per_type = [];

  for (const node of nodes) {
    if (node.type.toLowerCase() === type) {
      nodes_per_type.push(node.id);
    }
  }

  return nodes_per_type;
};

/**
 * @abstract returns the type of each object
 *
 * @param {Object} blueprint
 * @return {Object} node_ids_per_type
 */
export const getBlueprintAllNodesByType = (blueprint) => {
  const node_ids_per_type = {};

  for (const type of node_types) {
    node_ids_per_type[type] = getBlueprintNodesByType(blueprint, type);
  }

  return node_ids_per_type;
};

/**
 * @abstract returns node to type map
 *
 * @param {Object} blueprint
 * @return {Object} node_type_map
 */
export const getBlueprintNodeToTypeMap = (blueprint) => {
  const node_type_map = {};
  const nodes = [];

  for (const type of node_types) {
    getBlueprintNodesByType(blueprint, type).forEach(
      (node_key) => {
        node_type_map[node_key] = type;
      },
    );
  }

  return node_type_map;
};

/**
 * @abstract returns a Graph instance of the blueprint spectrum
 *
 * @param {Object} blueprint
 * @param {Graph} graph
 */
export const parseBlueprintToGraph = (blueprint) => {
  const { nodes } = blueprint.blueprint_spec;

  const graph = new Graph(true);

  graph.addEdges(
    removeArrayDuplicates(
      createEdgesFromVerticesValues(
        getBlueprintFromToEdgeTuples(blueprint),
      ),
    ),
  );

  return graph;
};

/**
 * @abstract returns an array with unreachable nodes
 *
 * @param {Object} blueprint
 * @param {Array} graph
 */
export const getBlueprintUnreachableNodes = (blueprint) => {
  const graph = parseBlueprintToGraph(blueprint);
  const start_finish_nodes = startAndFinishNodes(blueprint);

  const non_start_nodes = _.difference(
    graph.getAllVerticesKeys(),
    start_finish_nodes.start_nodes,
  );

  const reachable_nodes = graph.convertVerticesIndexestoKeys(
    _.uniq(
      _.flatten(
        start_finish_nodes.start_nodes.map(
          (start_key) => graph.reachableNodes(start_key),
        ),
      ),
    ),
  );

  return _.difference(non_start_nodes, reachable_nodes);
};

/**
 * @abstract returns a structure with valid nodes
 *
 * @param {Object} blueprint
 * @param {Graph} graph
 */
export const blueprintValidity = (blueprint) => {
  const graph = parseBlueprintToGraph(blueprint);

  const sf_nodes = startAndFinishNodes(blueprint);

  const unreachable_non_start_nodes = getBlueprintUnreachableNodes(blueprint);

  // Finish nodes not reachable from a start node
  const non_traversable_finish_nodes = _.difference(
    sf_nodes.finish_nodes,
    Object.values(
      objectReduce(
        reachableFinishNodesFromStartNodes(blueprint),
        (traversable_finish_nodes, start_key, traversable_from_start_key) => _.uniq(
          _.union(traversable_finish_nodes, traversable_from_start_key),
        ),
        [],
      ),
    ),
  );

  // Vertices without to-nodes and not finish nodes
  const loose_nodes_keys = graph.convertVerticesIndexestoKeys(graph.sinkNodes());
  const loose_non_finish_nodes = _.difference(loose_nodes_keys, sf_nodes.finish_nodes);

  // Vertices without from-nodes and not start nodes
  const orphan_nodes_keys = graph.convertVerticesIndexestoKeys(graph.sourceNodes());
  const orphan_non_start_nodes = _.difference(orphan_nodes_keys, sf_nodes.start_nodes);

  const validity_decorate_obj = {
    reachability: {
      description: 'The union of all start vertices reachable nodes comprehend all non start vertices.',
      is_reachable_from_start: unreachable_non_start_nodes.length === 0,
      unreachable_nodes: unreachable_non_start_nodes,
    },
    contains_start_finish: {
      description: 'A Flowbuild workflow must have at least one start and finsh vertices.',
      has_start_finish: (sf_nodes.start_nodes.length !== 0) && (sf_nodes.finish_nodes.length !== 0),
    },
    traversability: {
      description: 'The union of reachable finish vertices by start vertices is equivalent to all finish vertices.',
      is_traversable_from_starts: non_traversable_finish_nodes.length === 0,
      non_traversable_finish: non_traversable_finish_nodes,
    },
    all_loose_is_finish: {
      description: 'A loose vertex MUST be a finish vertex.',
      is_all_loose_finish: loose_non_finish_nodes.length === 0,
      loose_non_finish_nodes,
    },
    all_orphan_is_start: {
      description: 'An orphan vertex MUST be a start vertex.',
      is_all_orphan_start: orphan_non_start_nodes.length === 0,
      orphan_non_start_nodes,
    },
  };

  let is_valid_key = true;
  const is_valid = objectReduce(
    validity_decorate_obj,
    (is_valid, validity_clause, validity_args) => {
      is_valid_key = objectKeyFind(validity_args, (reason, argument) => reason.includes('is_') || reason.includes('has_'));

      return is_valid && validity_args[is_valid_key];
    },
    true,
  );

  return {
    is_valid,
    validity_arguments: validity_decorate_obj,
  };
};

/**
 * @abstract returns valid nodes
 *
 * @param {Object} blueprint
 * @param {Array} valid_nodes
 */
export const getBlueprintInvalidNodes = (blueprint) => _.flatten(
  Object.values(
    objectFilter(objectFlatten(
      blueprintValidity(blueprint),
    ), (key, value) => key.includes('nodes')),
  ),
);

/**
 * @abstract returns start and finish nodes object of given blueprint
 *
 * @param {Object} blueprint
 * @param {Graph}
 */
export const startAndFinishNodes = (blueprint) => {
  const { nodes } = blueprint.blueprint_spec;
  const startNodes = [];
  const finishNodes = [];

  for (const node of nodes) {
    if (node.type.toLowerCase() === 'start') {
      startNodes.push(node.id);
    }

    if (node.type.toLowerCase() === 'finish') {
      finishNodes.push(node.id);
    }
  }

  return { start_nodes: [...startNodes], finish_nodes: [...finishNodes] };
};

/**
 * @abstract returns start and finish nodes object of given blueprint
 *
 * @param {Object} blueprint
 * @param {Graph}
 */
export const nodeToLane = (blueprint) => {
  const { nodes } = blueprint.blueprint_spec;
  const node_to_lane = {};

  for (const node of nodes) {
    node_to_lane[node.id] = node.lane_id;
  }

  return node_to_lane;
};

/**
 * @abstract returns lane route from a node_route
 *
 * @param {Object} blueprint
 * @param {Graph}
 */
export const nodeToLaneRoute = (
  node_route,
  vertices_indices_to_keys,
  node_id_to_lane,
) => {
  const lane_route = [];

  for (const vertex_j of node_route) {
    const lane_vertex_j = node_id_to_lane[vertices_indices_to_keys[vertex_j]];

    if (lane_route.length === 0) {
      lane_route.push(lane_vertex_j);
    } else if (lane_route[lane_route.length - 1] !== lane_vertex_j) {
      lane_route.push(lane_vertex_j);
    } else {
      continue;
    }
  }

  return lane_route;
};

/**
 * @abstract returns all paths from certain start_key to finish_key
 *
 * @param {Object} blueprint
 * @param {String} start_key
 * @param {String} finish_key
 * @return {object} all_paths
 */
export const fromStartToFinishAllPaths = (blueprint, start_key, finish_key) => {
  const bp_graph = parseBlueprintToGraph(blueprint);

  const node_id_to_lane = nodeToLane(blueprint);

  const sinkNodes = bp_graph.sinkNodes();
  const sourceNodes = bp_graph.sourceNodes();

  const vertices_keys_to_indices = bp_graph.getVerticesKeystoIndices();
  const vertices_indices_to_keys = bp_graph.getVerticesIndicestoKeys();

  const start_index = vertices_keys_to_indices[start_key];
  const finish_index = vertices_keys_to_indices[finish_key];

  let is_undefined = false;
  if (start_index === undefined) {
    console.Warning(`Warning: Claimed start vertex key ${start_key} is not available within nodes`);
    is_undefined = true;
  }

  if (finish_index === undefined) {
    console.warn(`Warning: Claimed finish vertex key ${finish_key} is not available within nodes`);
    is_undefined = true;
  }

  if (is_undefined) {
    return [];
  }

  if (getAllIndexes(sourceNodes, start_index).length === 0) {
    console.warn(`Warning: Vertex id ${start_index}, key ${start_key}, is not a orphan node! Detected start nodes: ${sourceNodes}`);

    return [];
  }

  if (getAllIndexes(sinkNodes, finish_index).length === 0) {
    console.warn(`Warning: Vertex id ${finish_index}, key ${finish_key}, is not a loose node! Detected finish nodes: ${sinkNodes}`);

    return [];
  }

  const routes = bp_graph.allPaths(start_key, finish_key);
  const route_describe = {
    length: routes.length,
    routes: [],
  };

  let lane_route_i = [];
  let node_route_i = [];

  for (const i in routes) {
    lane_route_i = nodeToLaneRoute(routes[i], vertices_indices_to_keys, node_id_to_lane);

    node_route_i = bp_graph.convertVerticesIndexestoKeys(routes[i]);

    route_describe.routes.push(
      {
        node_path: {
          length: node_route_i.length,
          trace: node_route_i,
        },
        lane_path: {
          length: lane_route_i.length,
          trace: lane_route_i,
        },
      },
    );
  }

  return route_describe;
};

/**
 * @abstract return all paths between all start nodes and finish nodes
 *
 * @param {Object} blueprint
 * @return {object} all_paths
 */
export const fromStartToFinishCombsAllPaths = (blueprint) => {
  const sf_nodes = startAndFinishNodes(blueprint);

  const paths = {};
  let total_length = 0;
  let startNode;
  let finishNode;

  for (const i of _.range(sf_nodes.start_nodes.length)) {
    startNode = sf_nodes.start_nodes[i];
    for (const j of _.range(sf_nodes.finish_nodes.length)) {
      finishNode = sf_nodes.finish_nodes[j];

      const label = `${startNode}_${finishNode}`;
      paths[label] = fromStartToFinishAllPaths(blueprint, startNode, finishNode);

      total_length += paths[label].length;
    }
  }

  return {
    length: total_length,
    from_to: paths,
  };
};

/**
 * @abstract generates and save blueprint diagrams to diagrams_destination_folder
 *
 * @param {Object} blueprint
 * @return {object} all_paths
 */
export const generateValidBlueprintPathDiagrams = (blueprint, bps_root, diagrams_destination_folder) => {
  const blueprint_validity = blueprintValidity(blueprint);

  if (blueprint_validity.is_valid) {
    let path_folder = '';
    const processed_blueprint = castBlueprintPathsToDiagram(blueprint);

    createDirectory(bps_root, diagrams_destination_folder);

    for (const start_finish in processed_blueprint.from_to) {
      path_folder = `${diagrams_destination_folder}/${blueprint.name}`;
      createDirectory(bps_root, path_folder);

      path_folder = `${path_folder}/${start_finish}`;
      createDirectory(bps_root, path_folder);

      processed_blueprint.from_to[start_finish] = objectReduce(
        processed_blueprint.from_to[start_finish],
        (result, path_index, route) => {
          result[`path_${start_finish}_index_${path_index}`] = route;

          return result;
        },
        {},
      );

      saveFilenameContentObject(processed_blueprint.from_to[start_finish], `${bps_root}/${path_folder}`);
    }
  }
};

/**
 * @abstract returns blueprint diagram string
 *
 * @param {Object} blueprint
 * @param {Object} diagramConfig
 * @return {String} diagram_body
 */
export const castBlueprintToDiagram = (blueprint, path = []) => {
  // Required variables
  const nodesConfig = diagramConfig.themes.nodes;
  const edgesConfig = diagramConfig.themes.edges;

  let from_node_key = '';
  let to_node_key = '';

  let left_node_border = '';
  let right_node_border = '';
  let node_type = '';
  let node_border_type = '';

  let link_str = '';
  let string_tmp = '';

  const nodeToType = getBlueprintNodeToTypeMap(blueprint);
  const blueprint_graph = parseBlueprintToGraph(blueprint);

  path = blueprint_graph.convertVerticesKeystoIndexes(path);

  const path_edges = blueprint_graph.convertEdgesToVerticesIndices(
    blueprint_graph.getEdgesFromChain(path),
  ).map((path_edge) => blueprint_graph.convertVerticesIndexestoKeys(path_edge));

  const invalid_nodes = getBlueprintInvalidNodes(blueprint);
  const path_vertex_keys = blueprint_graph.convertVerticesIndexestoKeys(path);

  const styleFormatter = (str) => str.replace('{', '').replace(/['"]+/g, '').replace('}', '');

  const path_line_numbers = path_edges.map((path_edge) => Object.keys(blueprint_graph.edges).indexOf(
    `${path_edge[0]}_${path_edge[1]}`,
  ));

  const breakline = '\n';
  const spacing = '      ';
  let diagram_body = `graph TD${breakline}`;

  const diagramNodeType = {};

  // Classification of nodes according to diagram
  Object.keys(blueprint_graph.vertices).forEach(
    (node_key) => {
      node_type = nodeToType[node_key].toLowerCase();

      // Only start and finish nodes are simultaneous
      if (node_type.includes('start')) {
        diagramNodeType[node_key] = {
          style: 'start_node',
        };
      } else if (node_type.includes('finish')) {
        diagramNodeType[node_key] = {
          style: 'finish_node',
        };
      } else if (invalid_nodes.includes(node_key)) {
        diagramNodeType[node_key] = {
          style: 'bugged_node',
        };
      } else if (path_vertex_keys.includes(node_key)) {
        diagramNodeType[node_key] = {
          style: 'trail_node',
        };
      } else {
        diagramNodeType[node_key] = {
          style: 'default',
        };
      }

      // Define the border for each node separarely. It may be extended.
      if (node_type.includes('start')) {
        diagramNodeType[node_key].border = 'start_node';
      } else if (node_type.includes('finish')) {
        diagramNodeType[node_key].border = 'finish_node';
      } else if (node_type.includes('flow')) {
        diagramNodeType[node_key].border = 'flow_node';
      } else if (path_vertex_keys.includes(node_key)) {
        diagramNodeType[node_key].border = 'trail_node';
      } else if (invalid_nodes.includes(node_key)) {
        diagramNodeType[node_key].border = 'bugged_node';
      } else {
        diagramNodeType[node_key].border = 'default';
      }
    },
  );

  // Edges lines definition
  Object.values(blueprint_graph.edges).forEach(
    (edge) => {
      // From node
      from_node_key = edge.startVertex.getKey();
      node_border_type = diagramNodeType[from_node_key].border;

      left_node_border = nodesConfig.borders[node_border_type].left;
      right_node_border = nodesConfig.borders[node_border_type].right;
      from_node_key = `${from_node_key}${left_node_border}${from_node_key}${right_node_border}`;

      // To node
      to_node_key = edge.endVertex.getKey();
      node_border_type = diagramNodeType[to_node_key].border;

      left_node_border = nodesConfig.borders[node_border_type].left;
      right_node_border = nodesConfig.borders[node_border_type].right;

      to_node_key = `${to_node_key}${left_node_border}${to_node_key}${right_node_border}`;

      // Arrow
      if (hasElement(path_edges, edge.getKeyTuple())) {
        link_str = edgesConfig.trail.link;
      } else {
        link_str = edgesConfig.default.link;
      }

      link_str += '>';

      string_tmp = `${from_node_key} ${link_str} ${to_node_key}`;
      diagram_body += spacing + string_tmp + breakline;
    },
  );

  diagram_body += breakline;

  // Edges style definition
  path_line_numbers.forEach(
    (path_line_number) => {
      string_tmp = styleFormatter(JSON.stringify(edgesConfig.trail.style));

      string_tmp = `linkStyle ${path_line_number} ${string_tmp}`;
      diagram_body += spacing + string_tmp + breakline;
    },
  );

  diagram_body += breakline;

  // Add node classes
  Object.keys(nodesConfig.style).forEach(
    (node_key) => {
      string_tmp = styleFormatter(JSON.stringify(nodesConfig.style[node_key]));

      string_tmp = `classDef ${node_key} ${string_tmp}`;
      diagram_body += spacing + string_tmp + breakline;
    },
  );

  diagram_body += breakline;

  // Add node classes
  Object.keys(diagramNodeType).forEach(
    (node_key) => {
      if (diagramNodeType[node_key].style !== 'default') {
        string_tmp = `class ${node_key} ${diagramNodeType[node_key].style}`;
        diagram_body += spacing + string_tmp + breakline;
      }
    },
  );

  return diagram_body;
};

/**
 * @abstract returns object with route diagrams for given blueprint
 *
 * @param {Object} blueprint
 * @param {Object} diagramConfig
 * @return {Object} diagrams_obj
 */
export const castBlueprintPathsToDiagram = (blueprint) => {
  const path_diagrams = {};
  const paths_obj = fromStartToFinishCombsAllPaths(blueprint);
  const diagrams = {};
  let counter = 0;

  for (const from_to_key in paths_obj.from_to) {
    counter = 0;
    path_diagrams[from_to_key] = {};

    for (const route of paths_obj.from_to[from_to_key].routes) {
      try {
        diagrams[counter] = castBlueprintToDiagram(blueprint, route.node_path.trace);

        counter += 1;
      } catch (error) {
        console.log(`Route ${route.node_path.trace} is invalid.`);
        console.log(`Error message: ${error.message}`);
        console.log(`Error message: ${error.message}`);
      }
    }

    path_diagrams[from_to_key] = _.cloneDeep(diagrams);
  }

  return {
    length: paths_obj.length,
    from_to: path_diagrams,
  };
};

/**
 * @abstract returns a converted workflow blueprint XML to graph
 *
 * @param {Object} blueprint
 * @return {object} islands
 */
export const parseWorkflowXMLToGraph = () => {
  throw Error('Not implemented');
};

/**
 * @abstract returns workflow islands
 *
 * @param {Object} blueprint
 * @return {object} islands
 */
export const workflowIslands = (blueprint) => parseBlueprintToGraph(blueprint).islands();
