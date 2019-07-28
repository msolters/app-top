import React, { Component } from 'react';
import soundfile from './future.mp3';

class AudioPlayer extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    // if (this.state.domRef === undefined) return;
    // if (this.state.domRef.current === null) return;
    // this.state.domRef.current.play.call(this.state.domRef.current);
    // console.log(this.state.domRef.current);
    // setTimeout(this.state.domRef.current.play, 1000);
  }

  render() {
    return (
      <>
        <audio src={soundfile} ref={this.props.playerRef} />
      </>
    );
  }
}

export default AudioPlayer;
