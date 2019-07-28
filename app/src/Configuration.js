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
\`app-top\` is a tool for browsing documentation that is highly relational.  It allows you to write markdown documents which can depend on each other.

\`app-top\` will then render networks visualizing the dependencies of your system.  These networks can be analyzed or rearranged and filtered by depth or direction.

It is intended to be used to document e.g. the relationships between core areas of a business product (such as what may appear on a status page), and myriad backend dependencies that such products entail: DNS records correctly configured, specific microservices running healthily, other network constructs such as endpoints and so on.
`,
      depends: {}
    }
  }
}

