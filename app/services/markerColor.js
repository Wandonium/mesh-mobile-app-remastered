export default (status, isGateway = false) =>
  ['Active', 'Online'].includes(status)
    ? isGateway
      ? '#4482FF'
      : '#00B860'
    : ['Rebooted', 'Partial Offline'].includes(status)
    ? '#FFBF00'
    : ['Inactive', 'Offline'].includes(status)
    ? '#EB4E4D'
    : 'grey'
