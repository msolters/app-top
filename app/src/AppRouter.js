import React, { Component } from 'react';
import App from './App.js';
import { HashRouter as Router, Route, Link } from "react-router-dom";

class AppRouter extends Component {
  render() {
    return(
      <Router>
        <Route path="/" exact component={App} />
        <Route path="/:docKey" component={App} />
      </Router>
    );
  }
}

export default AppRouter;
