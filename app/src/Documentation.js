import md5 from 'md5';
import docLib from './documentation.json';
import ColorInterpolate from 'color-interpolate';
import Configuration from './Configuration.js';

export class Documentation {
  constructor() {
    this.docs = docLib.docs;
    this.docTypes = docLib.docTypes;
    this.docsByType = docLib.docsByType;

    this.adj = {
      up: docLib.adj.up,
      down: docLib.adj.down
    };

    this.config = Configuration;
      console.log(this.docs);
    this.baseColors = this.config.baseColors;
  }

  getDocKey(type, name) {
    return md5((type+name).toLowerCase());
  }

  getDeselectedGraph() {
    return [
      [],
      {},
      this.docTypes.map((type) => {
        return {
          type: type,
          avgRadius: 0,
          docs: 0
        };
      }).sort((a, b) => { // reverse alphabetic by type
        if (a.type === b.type) return 0;
        if (a.type < b.type) return 1;
        return -1;
      })
    ];
  }

  getGraph(sourceKey, traversalDirection, graphRadius) {
    // (1) If no document is selected, show all documents but graph no edges.
    if (sourceKey === this.config.defaultKey) {
      return this.getDeselectedGraph();
    }

    if (this.docs[sourceKey] === undefined) {
      return this.getDeselectedGraph();
    }

    // (2) If a document is selected, compute all selected documents
    //     and the edges between them.
    let edges, selectedDocs;
    const graphStartKey = sourceKey === this.config.defaultKey ? null : sourceKey;
    if (traversalDirection === "both") {
      // Traverse the docs both upwards and downwards from the source key
      const [downEdges, downSelectedDocs] = this.traverseDocs(graphStartKey, 'down', graphRadius);
      const [upEdges, upSelectedDocs] = this.traverseDocs(graphStartKey, 'up', graphRadius);
      // Smoosh the resulting data together
      edges = Object.assign(downEdges, upEdges);
      selectedDocs = Object.assign(downSelectedDocs, upSelectedDocs);
    } else {
      [edges, selectedDocs] = this.traverseDocs(graphStartKey, traversalDirection, graphRadius);
    }
    edges = Object.values(edges);

    // (3) Compute category properties based on selected docs
    let selectedTypes = {};
    selectedDocs[sourceKey].radius = 0;
    //     Iterate over every selected document so we can figure
    //     out which docType has the most leafs in each direction
    //     We want to sort docTypes from ne
    for (const [docKey, selectedDoc] of Object.entries(selectedDocs)) {
      const type = this.docs[docKey].type;
      if (selectedTypes[type] === undefined) {
        selectedTypes[type] = {
          docs: 0,
          totalRadius: 0,
          type: type,
          leafScore: 0
        };
      }
      if (selectedDoc.leaf) {
        if (selectedDoc.direction === 'up') {
          selectedTypes[type].leafScore += 1;
        }
        if (selectedDoc.direction === 'down') {
          selectedTypes[type].leafScore -= 1;
        }
      }
      selectedTypes[type].docs += 1;
      selectedTypes[type].totalRadius += selectedDoc.radius;
    }

    // (4) Sort docTypes by some criteria
    const selectedTypesArr = Object.values(selectedTypes);
    selectedTypesArr.sort((a, b) => {
      if (a.leafScore === b.leafScore) return 0;
      if (a.leafScore > b.leafScore) return 1;
      return -1;
    });
    return [edges, selectedDocs, selectedTypesArr];
  }

  traverseDocs(sourceKey, traversalDirection, graphRadius, radius=0, edges={}, edgeMemo=[], visitedKeys=[], selectedDocs={}) {
    if (visitedKeys.includes(sourceKey)) {
      // We've already got this node's children
      // Draw this edge and move on!
      return [edges, selectedDocs, radius];
    }

    visitedKeys.push(sourceKey);
    const A = this.adj[traversalDirection];
    const radiusDirection = (traversalDirection === "up") ? -1 : 1;
    if (A[sourceKey] === undefined || A[sourceKey].children === undefined || (radius == graphRadius)) {
      // If we reach a leaf in our tree:
      //   (a) We've reached the maximum graphRadius allowed in this traversal, or
      //   (b) The document is parentn't
      const hasChildren = (A[sourceKey] && A[sourceKey].children);
      selectedDocs[sourceKey] = {
        color: this.baseColors[traversalDirection],
        radius: radius*radiusDirection,
        leaf: true,
        hasChildren: hasChildren,
        direction: traversalDirection
      };

      // If this is a leaf, but it has children, we draw little arrow stubs on it.
      // This lets the user know it still has connections lower down.
      if (hasChildren) {
        for (const destKey of A[sourceKey].children) {
          const edgeKey = sourceKey + destKey;
          // edges[edgeKey].color = color;
          edges[edgeKey] = {
            sourceKey: sourceKey,
            destKey: destKey,
            startColor: this.baseColors[traversalDirection],
            endColor: this.baseColors[traversalDirection],
            stub: true, // this indicates the document has further children
            traversalDirection: traversalDirection,
          }
        }
      }
      return [edges, selectedDocs, radius]; // no children
    }

    // This document has children, let's address them.
    let childrenToVisit = [];
    for (let destKey of A[sourceKey].children) {
      const edgeKey = sourceKey + destKey;
      edges[edgeKey] = {
        sourceKey: sourceKey,
        destKey: destKey,
        traversalDirection: traversalDirection,
      };
      // If we've already visited a child, draw the edge
      // But do not re-select the doc.  Never redraw an (all)edge.
      if (edgeMemo.includes(destKey)) continue;
      edgeMemo.push(destKey);
      childrenToVisit.push(destKey);
      selectedDocs[destKey] = {};
    }

    // Compute document depth and color
    // Note: the first step of this involves recursio
    // Note: the first step of this involves recursionn
    // That was a vim typo but i'm leaving it in, it's too good
    const _radius = radius + 1;
    let _height = radius + 1;
    for (let key of childrenToVisit) {
      const [e, s, r] = this.traverseDocs(key, traversalDirection, graphRadius, _radius, edges, edgeMemo, visitedKeys, selectedDocs);
      if (r > _height) _height = r;
    }
    const height = _height.valueOf();
    const colorSteps = 1.0 / height;
    const colorMap = ColorInterpolate([this.baseColors.active, this.baseColors[traversalDirection]]);
    const color = colorMap(Math.min(1, colorSteps * radius));
    if (selectedDocs[sourceKey] === undefined) selectedDocs[sourceKey] = {};
    // Create selectedDoc
    selectedDocs[sourceKey] = {
      color: color,
      radius: height*radiusDirection,
      leaf: false,
      direction: traversalDirection
    };

    // Create edges
    for (const destKey of A[sourceKey].children) {
      const edgeKey = sourceKey + destKey;
      edges[edgeKey].color = color;
      edges[edgeKey].startColor = colorMap(colorSteps * radius);
      edges[edgeKey].endColor = colorMap(colorSteps * (radius+1));
    }

    // Gotta keep dem numbies immutable
    return [edges, selectedDocs, height];
  }
}
