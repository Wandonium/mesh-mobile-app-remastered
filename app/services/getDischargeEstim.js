export default function getDischargeEstim(data) {
  const msec = data * 1000
  let mins = Math.floor(msec / 60000)
  let hrs = Math.floor(mins / 60, 0)
  const days = Math.floor(hrs / 24)
  const fullDischargeArr = []
  let fullDischarge = ''
  if (!days) {
    if (!hrs) {
      if (mins) fullDischargeArr.push(`${mins}m`)
    } else {
      mins %= 60
      if (mins) fullDischargeArr.push(`${mins}m`)
      fullDischargeArr.push(`${hrs}h`)
    }
  } else {
    mins %= 60
    hrs %= 24
    if (mins) fullDischargeArr.push(`${mins}m`)
    if (hrs) fullDischargeArr.push(`${hrs}h`)
    fullDischargeArr.push(`${days}d`)
  }
  if (fullDischargeArr.length > 0) {
    fullDischarge = fullDischargeArr.reverse().join(' ')
  } else {
    fullDischarge = 'N/A'
  }
  return fullDischarge
}
