const fs = require('fs');
const md5 = require('md5');
const path = require('path');
const yaml = require('yaml');

const docsSrcDir = path.resolve('docs/');
const docsLibDir = path.resolve('src/');
let docs = {};
let docsByType = {};
let docTypes = new Set();

function getDocKey(type, name) {
  return md5((type+name).toLowerCase());
}

// (1) Read each YAML file, parse it, and update
//     or add basic properties such as types and file names.
fs.readdirSync(docsSrcDir).forEach( (dir) => {
  const subDir = path.resolve(docsSrcDir, dir);
  const stat = fs.statSync(subDir);
  if (stat && stat.isDirectory()) {
    const type = dir;
    fs.readdirSync(subDir).forEach( (doc) => {
      if (!/.yaml$/.test(doc)) return;
      const fileContents = fs.readFileSync(path.join(subDir, doc), 'utf8');
      const jsonData = yaml.parse(fileContents);
      jsonData.type = type;
      jsonData.fileName = doc;
      const docKey = getDocKey(jsonData.type, jsonData.name);
      docs[docKey] = jsonData;
      docTypes.add(jsonData.type);
      if (docsByType[jsonData.type] === undefined) docsByType[jsonData.type] = [];
      docsByType[jsonData.type].push(docKey);
    });
  }
});

//     Create directed adjacency matrix
//     One matrix stores all downwards (dependency) relationships
//     The other stores all upwards (dependent) relationships
function getAdjacencyMatrix() {
  const downwardAdj = {};
  const upwardAdj = {};
  for (const a of Object.keys(docs)) {
    const relatedKeys = getRelatedKeys(a);
    for (let b of relatedKeys) {
      if (downwardAdj[a] === undefined) {
        downwardAdj[a] = {
          children: [],
        };
      }
      downwardAdj[a].children.push(b);
      if (upwardAdj[b] === undefined) {
        upwardAdj[b] = {
          children: [],
        };
      }
      upwardAdj[b].children.push(a);
    }
  }
  return [upwardAdj, downwardAdj];
}

function getRelatedKeys(sourceKey) {
  const doc = docs[sourceKey];
  if (doc === undefined) {
    console.error(`${sourceKey} is not a recognized document`);
    return [];
  }

  let related = [];
  for (let [type, relatedDocs] of Object.entries(doc.depends)) {
    for (let [name, desc] of Object.entries(relatedDocs)) {
      related.push(getDocKey(type, name));
    }
  }
  return related;
}


// (?) Write the final results to file.
// if (!fs.existsSync(docsLibDir)){
//   fs.mkdirSync(docsLibDir);
// }
const lib = {
  docs: docs,
  docTypes: Array.from(docTypes),
  docsByType: docsByType,
  adj: {
    up: null,
    down: null
  }
};
[lib.adj.up, lib.adj.down] = getAdjacencyMatrix();
fs.writeFileSync(path.join(docsLibDir, 'documentation.json'), JSON.stringify(lib), {encoding: 'utf8'});
