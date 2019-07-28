import React, { Component } from 'react';
import { Documentation } from './Documentation.js';
import { Canvas } from './Canvas.js';
import { CanvasControls } from './CanvasControls.js';
import { DocList } from './DocList.js';
import { createHashHistory } from 'history';
import { DetailView } from './DetailView.js';
import update from 'immutability-helper';

class App extends Component {
  constructor(props) {
    super(props);
    const documentation = new Documentation();
    this.state = {
      doc: documentation,
      docPositions: {},
      docTypeOffsets: {},
      domRefs: {},
      graphRadius: documentation.config.graphRadius,
      traversalDirection: documentation.config.traversalDirection,
    };
    this.state.activeDoc = undefined;
    // Setup history
    this.history = createHashHistory({
      basename: '', // The base URL of the app (see below)
      hashType: 'slash', // The hash type to use (see below)
    });

    if (this.state.doc.docs[this.props.match.params.docKey] === undefined) {
      this.history.push( this.state.doc.config.defaultKey );
    }

    for (let [key, doc] of Object.entries(this.state.doc.docs)) {
      this.state.domRefs[key] = React.createRef();
      this.state.docPositions[key] = {
        x: null,
        y: null
      };
    }
    for (const type of this.state.doc.docTypes) {
      this.state.docTypeOffsets[type] = {
        x: 0, y: 0
      };
    }
    this.onUpdatePos = this.onUpdatePos.bind(this);
    this.onDocSelect = this.onDocSelect.bind(this);
    this.onUpdateOffset = this.onUpdateOffset.bind(this);
    this.resetDocTypeOffsets = this.resetDocTypeOffsets.bind(this);
    this.onTraversalDirectionSelect = this.onTraversalDirectionSelect.bind(this);
    this.incrementGraphRadius = this.incrementGraphRadius.bind(this);
    this.resetGraph = this.resetGraph.bind(this);

    this.unlisten = this.history.listen((location, action) => {
      // This is to redraw edges which depend on the Document <div>s to be settled
      // This is basically never the case by the time react wants to draw them.
      this.regraphTimer = setTimeout(this.regraph.bind(this), 10);
    });
  }

  onKeyDown(event) {
    if(event.keyCode === 27) {
      this.resetGraph();
    }
  }

  resetGraph() {
    this.onDocSelect(this.state.doc.config.defaultKey);
  }

  componentDidMount(){
    document.addEventListener("keydown", this.onKeyDown.bind(this), false);
  }

  componentWillUnmount() {
    document.removeEventListener("keydown", this.onKeyDown.bind(this), false);
    this.unlisten();
    clearTimeout(this.regraphTimer);
  }

  onUpdatePos(key, pos) {
    let mutation = {};
    mutation[key] = {
      x: {
        $set: pos[0]
      },
      y: {
        $set: pos[1]
      }
    };
    const _positions = update(this.state.docPositions, mutation);
    this.setState({docPositions: _positions});
  }

  onUpdateOffset(type, pos) {
    let mutation = {};
    mutation[type] = {
      x: {
        $set: pos[0]
      },
      y: {
        $set: pos[1]
      }
    };
    const _offsets = update(this.state.docTypeOffsets, mutation);
    this.setState({docTypeOffsets: _offsets});
  }

  resetDocTypeOffsets(onlyX=false) {
    let _docTypeOffsets = {};
    for (const type of Object.keys(this.state.docTypeOffsets)) {
      if (onlyX) {
        _docTypeOffsets[type] = {
          x: 0,
          y: this.state.docTypeOffsets[type].y
        };
      } else {
        _docTypeOffsets[type] = {
          x: 0, y: 0
        };
      }
    }
    this.setState({
      docTypeOffsets: _docTypeOffsets
    });
  }

  onDocSelect(docKey) {
    if (docKey !== this.state.activeDoc) {
      this.resetDocTypeOffsets();
    }
    if (this.state.doc.docs[docKey] === undefined) {
      docKey = this.state.doc.config.defaultKey;
    }
    this.history.push( docKey );
  }

  onTraversalDirectionSelect(_traversalDirection) {
    this.setState({
      traversalDirection: _traversalDirection
    }, () => {
      this.resetDocTypeOffsets(true);
      this.regraph();
    });
  }

  incrementGraphRadius(difference) {
    this.setState({
      graphRadius: this.state.graphRadius + difference,
    }, () => {
      this.resetDocTypeOffsets(true);
      this.regraph();
    });
  }

  regraph() {
    const traversalDirection = this.state.traversalDirection;
    const graphRadius = this.state.graphRadius;
    const [activeEdges, selectedDocs, selectedTypes] = this.state.doc.getGraph(this.state.activeDoc, traversalDirection, graphRadius);
    let newState = {
      selectedTypes: selectedTypes,
      selectedDocs: selectedDocs,
    }
    this.setState(newState, () => {
      this.setState({activeEdges: activeEdges});
    });
  }

  static getDerivedStateFromProps(props, state) {
    let newDocKey = props.match.params.docKey || null;
    if (newDocKey !== state.activeDoc) {
      console.log('Loading New Document: ', newDocKey);
      if (state.doc.docs[newDocKey] === undefined) {
        newDocKey = state.doc.config.defaultKey;
      }
      const traversalDirection = state.traversalDirection;
      const graphRadius = state.graphRadius;
      const [activeEdges, selectedDocs, selectedTypes] = state.doc.getGraph(newDocKey, traversalDirection, graphRadius);
      return {
        selectedTypes: selectedTypes,
        selectedDocs: selectedDocs,
        activeDoc: newDocKey,
        activeEdges: activeEdges,
      }
    }
    return null;
  }

  render() {
    let docLists = [];
    for (const selectedType of this.state.selectedTypes) {
      docLists.push(
        <DocList
          key={selectedType.type}
          type={selectedType.type}
          doc={this.state.doc}
          activeDoc={this.state.activeDoc}
          selectedDocs={this.state.selectedDocs}
          selectedTypes={this.state.selectedTypes}
          onDocSelect={this.onDocSelect}
          onUpdatePos={this.onUpdatePos}
          domRefs={this.state.domRefs}
          offsets={this.state.docTypeOffsets}
          onUpdateOffset={this.onUpdateOffset}
        />
      );
    }
    return (
      <div className="app">
        <DetailView
          activeDoc={this.state.activeDoc}
          doc={this.state.doc}
          onDocSelect={this.onDocSelect}
          resetGraph={this.resetGraph}
        />
        <div className="dataLayer">
          <Canvas
            positions={this.state.docPositions}
            doc={this.state.doc}
            activeDoc={this.state.activeDoc}
            activeEdges={this.state.activeEdges}
            domRefs={this.state.domRefs}
            traversalDirection={this.state.traversalDirection}
          />
          {docLists}
        </div>
        <CanvasControls
          graphRadius={this.state.graphRadius}
          incrementGraphRadius={this.incrementGraphRadius}
          activeDoc={this.state.activeDoc}
          doc={this.state.doc}
          onDocSelect={this.onDocSelect}
          traversalDirection={this.state.traversalDirection}
          onTraversalDirectionSelect={this.onTraversalDirectionSelect}
          resetDocTypeOffsets={this.resetDocTypeOffsets}
        />
      </div>
    );
  }
}

export default App;

