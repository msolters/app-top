import React, { Component } from 'react';
import Draggable from 'react-draggable';
import ReactMarkdown from "react-markdown";
import CodeBlock from "./CodeBlock";

class Dep extends Component {
  constructor(props) {
    super(props);
    this.handleDepClick = this.handleDepClick.bind(this);
  }

  handleDepClick(e) {
    e.preventDefault();
    this.props.onDocSelect(this.props.depKey);
  }

  render() {
    return (
      <div key={this.props.depKey}>
        <h4 className="depLink" onClick={this.handleDepClick}>🔗 {this.props.name}</h4>
        <ReactMarkdown
          source={this.props.desc}
          renderers={{ code: CodeBlock }}
        />
      </div>
    );
  }
}

class DepList extends Component {
  render() {
    let deps = [];
    for (let [name, desc] of Object.entries(this.props.deps)) {
      const depKey = this.props.doc.getDocKey(this.props.type, name);
      deps.push(
        <Dep key={depKey} depKey={depKey} type={this.props.type} name={name} desc={desc} onDocSelect={this.props.onDocSelect} />
      );
    }
    return(
      <div>
        <br/>
        <h2 className="detailDepTitle">{this.props.type} Dependencies</h2>
        {deps}
      </div>
    );
  }
}

export class DetailView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: this.props.doc.config.detailView.open
    };
    this.handleToggleOpenClick = this.handleToggleOpenClick.bind(this);
  }

  handleToggleOpenClick(e) {
    e.preventDefault();
    this.setState({
      open: !this.state.open
    });
  }

  render() {
    // Basic Document Data
    const activeKey = this.props.activeDoc;
    let doc, editLink;
    if (this.props.doc.docs[activeKey] === undefined || activeKey === this.props.doc.config.defaultKey) {
      doc = this.props.doc.config.detailView.default;
      editLink = '';
    } else {
      doc = this.props.doc.docs[activeKey];
      editLink = <a href={`https://github.com/${this.props.doc.config.githubOrgName}/app-top/edit/master/app/docs/${doc.type}/${doc.fileName}`}>Contribute to this document ✏</a>;
    }
    const docBody = doc.doc;

    // Generate Dependencies
    let depsList = [];
    for (let [type, deps] of Object.entries(doc.depends)) {
      depsList.push(<DepList key={type} type={type} deps={deps} doc={this.props.doc} onDocSelect={this.props.onDocSelect} />);
    }
    // Initial DetailView position wrt viewport
    const initStyle = {
      bottom: "calc(1em - 50em)",
      right: "0.25em"
    };

    // Generate body components
    let detailBody = null;
    if (this.state.open) {
      detailBody = (
        <>
          <ReactMarkdown
            source={docBody}
            renderers={{ code: CodeBlock }}
          />
          {depsList}
          {editLink}
        </>
      );
    }

    let buttons = [];
    const toggleButtonStyles = {
      backgroundColor: (this.state.open) ? 'yellow' : 'green'
    };
    buttons.push(<div key="toggle-btn" className="toggleBtn" style={toggleButtonStyles} onClick={this.handleToggleOpenClick}></div>);

    if (this.props.activeDoc !== null) {
      buttons.push(<div key="close-btn" className="closeBtn" onClick={() => this.props.resetGraph()}></div>);
    }

    return(
      <Draggable>
        <div className=" leftAlign detailView" style={initStyle}>
          <div className="detailTitle">{doc.name}</div>
          <div className="detailType">{doc.type}</div>
          {detailBody}
          <div className="windowControls">
            {buttons}
          </div>
        </div>
      </Draggable>
    );
  }
}
