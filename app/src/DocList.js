import React, { Component } from 'react';
import Draggable from 'react-draggable';
import md5 from 'md5';

class Doc extends Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(e) {
    e.preventDefault();
    this.props.onDocSelect(this.props.docKey);
  }

  updateLocation() {
    if (this.props.domRef.current === null) return;
    let ref = this.props.domRef.current.getBoundingClientRect();
    let x = ref.left;
    let y = ref.top;
    this.props.onUpdatePos(this.props.docKey, [x, y]);
  }

  componentDidMount() {
    setTimeout(this.updateLocation.bind(this), 100);
    window.addEventListener("resize", this.updateLocation.bind(this));
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.updateLocation.bind(this));
  }

  render() {
    const docData = this.props.doc.docs[this.props.docKey];
    const name = docData.name;
    let className = "pill";
    let style = {};

    const adj = this.props.doc.adj;
    let doc = null;
    if (this.props.selectedDocs[this.props.docKey] !== undefined || this.props.activeDoc == this.props.doc.config.defaultKey) {
      if (this.props.docKey === this.props.activeDoc) {
        className += " active";
        style.borderColor = "#555555";
      } else if (this.props.activeDoc !== this.props.doc.config.defaultKey) {
        className += ` related`;
        style.borderColor = this.props.selectedDocs[this.props.docKey].color;
        style.color = this.props.selectedDocs[this.props.docKey].color;
      }
      doc = <div className={className} onClick={this.handleClick} ref={this.props.domRef} style={style}>{name}</div>;
    }

    return(doc);
  }
}

export class DocList extends Component {
  constructor(props) {
    super(props);
    this.onDocTypeMoved = this.onDocTypeMoved.bind(this);
  }

  onDocTypeMoved(e, data) {
    this.props.onUpdateOffset(this.props.type, [data.x, data.y]);
    this.props.onDocSelect(this.props.activeDoc);
  }

  render() {
    let docList = [];
    const type = this.props.type;
    for (let docKey of this.props.doc.docsByType[type]) {
      docList.push(
        <Doc key={docKey} doc={this.props.doc} docKey={docKey} activeDoc={this.props.activeDoc} selectedDocs={this.props.selectedDocs} onDocSelect={this.props.onDocSelect} onUpdatePos={this.props.onUpdatePos} domRef={this.props.domRefs[docKey]} />
      );
    }
    return (
      <Draggable
        position={this.props.offsets[type]}
        handle=".title"
        onStop={this.onDocTypeMoved}
      >
      <div className="verticalGutter">
        <div className="pill centerAlign title">{type}</div>
        { docList }
      </div>
      </Draggable>
    );
  }
}
