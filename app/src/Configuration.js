module.exports = {
  baseColors: {
    up: "red",
    down: "green",
    active: "#ffffff"
  },
  traversalDirection: 'both',
  githubOrgName: 'msolters',
  defaultKey: '👌',
  graphRadius: 1,
  detailView: {
    open: true,
    default: {
      name: 'app-top',
      doc: `
# Welcome!
\`app-top\` is a tool for creating relational documentation.  It allows you to write markdown documentation, which can then create dependency links to other pieces of documentation.  The documentation is provided in a simple text file format.

For instance, see the how this library is [defined](https://github.com/msolters/app-top/tree/master/app/docs).

\`app-top\` will render draggable graphical networks depicting the dependencies of your system.  These networks can be analyzed, rearranged, and filtered by depth or direction.

It is intended to be used to document e.g. the relationships between core areas of a business product (such as what may appear on a status page), and myriad backend dependencies that such products entail: DNS records correctly configured, specific microservices running healthily, other network constructs such as endpoints and so on.

To learn more, see the [README](https://github.com/msolters/app-top).
`,
      depends: {}
    }
  }
}

