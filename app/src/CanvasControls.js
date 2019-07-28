import React, { Component } from 'react';
import AudioPlayer from './AudioPlayer.js';

export class CanvasControls extends Component {
  constructor(props) {
    super(props);
    this.audioPlayerRef = React.createRef();
    this.onAppTitleClick = this.onAppTitleClick.bind(this);
    this.audioPlaying = false;
  }

  onAppTitleClick(e) {
    e.preventDefault();
    const player = this.audioPlayerRef.current;

    if (this.audioPlaying) {
      player.pause.call(player);
      this.audioPlaying = false;
    } else {
      player.play.call(player);
      this.audioPlaying = true;
    }
  }

  render() {
    let classNames = {
      up: "",
      both: "",
      down: ""
    };
    for (const k of Object.keys(classNames)) {
      classNames[k] = "canvas-control-button";
      if (this.props.traversalDirection === k) {
        classNames[k] += " selected";
      }
    }

    let styles = {
      up: null,
      active: null,
      down: null
    };

    for (const [k, v] of Object.entries(styles)) {
      styles[k] = {
        'borderColor': this.props.doc.baseColors[k]
      };
    }

    const graphRadius = this.props.graphRadius;

    let minusButton = null;
    if (graphRadius >= 0) {
      minusButton =
        <div className="graph-radius-inc-btn canvas-control-button" onClick={() => this.props.incrementGraphRadius(-1)}>
          -
        </div>;
    }

    return(
      <div className="canvas-controls">
        <div className="graph-radius">
          Depth: {graphRadius < 0 ? "∞" : graphRadius}
        </div>
        { minusButton }
        <div className="graph-radius-inc-btn canvas-control-button" onClick={() => this.props.incrementGraphRadius(1)}>
          +
        </div>
        <div className={classNames.down} style={styles.down} onClick={() => this.props.onTraversalDirectionSelect('down')}>Dependencies</div>
        <div className={classNames.both} style={styles.active} onClick={() => this.props.onTraversalDirectionSelect('both')}>Both</div>
        <div className={classNames.up} style={styles.up} onClick={() => this.props.onTraversalDirectionSelect('up')}>Dependants</div>
        <div className="app-top-title" onClick={this.onAppTitleClick} >
          <b style={{fontSize: "1.2em"}}>app-top</b>
          <br/>
          <span style={{fontWeight: "lighter"}}>by Moroder</span>
        </div>
        <AudioPlayer playerRef={this.audioPlayerRef} />
      </div>
    );
  }
}
