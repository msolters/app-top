import React, { Component } from 'react';
import md5 from 'md5';

export class Canvas extends Component {
  constructor(props) {
    super(props);
    this.svgRef = React.createRef();
  }

  generateLine(startRect, destRect)
  {
    const spacing = "100";
    if ((destRect.x + destRect.width) < (startRect.x - spacing)) {
      // R->L
      const startX = startRect.x;
      return [
        [
          startX,
          startRect.y + (startRect.height*0.5)
        ],
        [
          (startX + destRect.x + destRect.width)*0.5,
          startRect.y + (startRect.height*0.5)
        ],
        [
          (startX + destRect.x + destRect.width)*0.5,
          destRect.y + (destRect.height*0.5)
        ],
        [
          destRect.x + destRect.width + 14,
          destRect.y + (destRect.height*0.5)
        ]
      ];
    }

    if (destRect.x < startRect.x + startRect.width + spacing/2) {
      // L <-> L
      const startX = startRect.x;
      const scale = Math.abs(destRect.x - startRect.x)/destRect.width * 2;
      const controlDistance = Math.min(scale * spacing + spacing*0.5, 1.5*spacing);
      const vertScale = 0.89;
      return [
        [
          startX,
          startRect.y + (startRect.height*0.5)
        ],
        [
          startX - controlDistance,
          vertScale*(startRect.y + (startRect.height*0.5)) + (1-vertScale)*(destRect.y + (destRect.height*0.5))
        ],
        [
          destRect.x - controlDistance,
          (1-vertScale)*(startRect.y + (startRect.height*0.5)) + (vertScale)*(destRect.y + (destRect.height*0.5))
        ],
        [
          destRect.x - 14,
          destRect.y + (destRect.height*0.5)
        ]
      ];
    }

    if (destRect.x > startRect.x + startRect.width + spacing/2) {
      // L->R
      const startX = startRect.x + startRect.width;
      return [
        [
          startX,
          startRect.y + (startRect.height*0.5)
        ],
        [
          (startX + destRect.x)*0.5,
          startRect.y + (startRect.height*0.5)
        ],
        [
          (startX + destRect.x)*0.5,
          destRect.y + (destRect.height*0.5)
        ],
        [
          destRect.x - 14,
          destRect.y + (destRect.height*0.5)
        ]
      ];
    }
  }


  // Convert a list of [x, y] points from client coordinates — the space
  // getBoundingClientRect() measures every node in — into the <svg> element's
  // own user space, which is the space a path's `d` attribute is drawn in.
  //
  // Those are not the same space. index.css sets `html { zoom: 80% }`, and a
  // CSS zoom scales the visual coordinate system: a rect comes back in zoomed
  // (client) pixels, while one SVG user unit inside that same zoomed subtree is
  // still an unzoomed pixel. Writing measured client pixels straight into `d`
  // therefore drew every edge at 80% of its intended position — the further
  // right a node sat, the wider the gap between it and the arrow that was
  // supposed to touch it.
  //
  // The <svg>'s own screen CTM *is* the user -> client mapping, so its inverse
  // converts a measurement back into the space the path is drawn in. It also
  // folds in the scroll offset of #root, which is why this replaces the manual
  // scrollLeft/scrollTop correction that used to live here: that correction
  // added an unzoomed scroll distance to a zoomed measurement, which was wrong
  // in the same way and for the same reason.
  clientToSvg(line) {
    const round = (l) => l.map((p) => p.map((n) => Math.round(n)));
    const svg = this.svgRef.current;
    const ctm = svg && svg.getScreenCTM && svg.getScreenCTM();
    if (!ctm) return round(line);
    const { a, b, c, d, e, f } = ctm;
    const det = (a * d) - (b * c);
    if (!det) return round(line);
    return round(
      line.map(([x, y]) => {
        const dx = x - e;
        const dy = y - f;
        return [
          ((dx * d) - (dy * c)) / det,
          ((dy * a) - (dx * b)) / det
        ];
      })
    );
  }

  render() {
    let paths = [];
    let defs = [];
    const positions = this.props.positions;
    const activeDoc = this.props.activeDoc;
    const domRefs = this.props.domRefs;
    const traversalDirection = this.props.traversalDirection;

    for (const edge of this.props.activeEdges) {
      const startKey = edge.sourceKey;
      const destKey = edge.destKey;
      const edgeKey = md5(startKey+destKey);
      if (edge.stub) {
        defs.push(
          <marker key={edgeKey} id={'arrow-'+edgeKey} markerWidth="4" markerHeight="4" refX="0" refY="2" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,4 L4,2 z" fill={edge.startColor} />
          </marker>
        );
        if (domRefs[startKey] === undefined || domRefs[startKey].current === null) continue;
        const startRef = domRefs[startKey].current;
        const startRect = startRef.getBoundingClientRect();
        let line = [];
        const arrowSize = 0.2;
        if (edge.traversalDirection === "down") {
          line = [
            [startRect.x, (startRect.y + (startRect.height*0.5))],
            [startRect.x - (startRect.width * 0.2), (startRect.y + (startRect.height*0.5))]
          ];
        } else {
          line = [
            [startRect.x + startRect.width, (startRect.y + (startRect.height*0.5))],
            [startRect.x + startRect.width + (startRect.width * 0.2), (startRect.y + (startRect.height*0.5))]
          ];
        }
        const [s, e] = this.clientToSvg(line);
        paths.push(
          <path
            key={edgeKey}
            d={`
              M ${s}
              L ${e}
            `}
            stroke={edge.startColor}
            fill="none"
            strokeDasharray="2"
            strokeWidth={3}
            markerEnd={`url(#arrow-${edgeKey})`}
          />
        );
      } else {
        if (domRefs[startKey] === undefined || domRefs[startKey].current === null) continue;
        const startRef = domRefs[startKey].current;
        const startRect = startRef.getBoundingClientRect();

        if (domRefs[destKey] === undefined || domRefs[destKey].current === null) continue;
        const destRef = domRefs[destKey].current;
        if (destRef === null) continue;
        const destRect = destRef.getBoundingClientRect();
        const line = this.generateLine(startRect, destRect);
        const [s, cA, cB, e] = this.clientToSvg(line)

        // const edgeKey = md5(startKey+destKey+edge.startColor+edge.endColor);
        defs.push(
          <marker key={edgeKey} id={'arrow-'+edgeKey} markerWidth="4" markerHeight="4" refX="0" refY="2" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,4 L4,2 z" fill={edge.endColor} />
          </marker>
        );
        const x1 = s[0];
        const x2 = e[0];
        const y1 = s[1];
        const y2 = e[1];

        defs.push(
          <linearGradient
            key={'path-gradient'+edgeKey}
            id={'path-gradient-'+edgeKey}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%"   stopColor={edge.startColor}/>
            <stop offset="100%" stopColor={edge.endColor}/>
          </linearGradient>
        );
        paths.push(
          <path
            key={edgeKey}
            d={`
              M ${s}
              C ${cA} ${cB} ${e}
            `}
            stroke={`url(#path-gradient-${edgeKey})`}
            fill="none"
            strokeWidth={3}
            markerEnd={`url(#arrow-${edgeKey})`}
          />
        );
      }
    }

    return(
      <svg
        ref={this.svgRef}
        className="curveLayer"
        width="4000px"
        height="4000px"
      >
        <defs>
          {defs}
        </defs>
        { paths }
      </svg>
    );
  }
}
