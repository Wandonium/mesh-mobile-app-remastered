const colors = [
  { down: '#ff0000', up: '#008000' },
  { down: '#ffa500', up: '#0000ff' },
  { down: '#ffff00', up: '#8b00ff' },
  { down: '#00FF00', up: '#282864' },
  { down: '#add8e6', up: '#c82828' },
]

const nodes = {}

export default function(nodeId) {
  if (!nodes[nodeId]) {
    nodes[nodeId] = colors[Object.keys(nodes).length % colors.length]
  }
  return nodes[nodeId]
}
