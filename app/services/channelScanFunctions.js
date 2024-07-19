import { cloneDeep } from 'lodash'
import channelsConfig from '../constants/channels.config'
import channelsTables from '../constants/channelsTables.config'
import frequencyConfig from '../constants/frequency.config'
import overlapConfig from '../constants/overlap.config'
import overlap24addConfig from '../constants/overlap24add.config'

const sumOverlaps = (nodePowerData = []) => {
  const uniqueChannels = {}
  // sum powers by channel
  nodePowerData.forEach(item => {
    if (!uniqueChannels[item.channel]) {
      uniqueChannels[item.channel] = {}
      uniqueChannels[item.channel].frequency = item['Frequency(MHz)']
      uniqueChannels[item.channel].powerSum = 0
    }
    uniqueChannels[item.channel].powerSum += item.power
  })

  // sum owerlaps
  Object.keys(uniqueChannels).forEach(item => {
    if (overlapConfig[uniqueChannels[item].frequency]) {
      let sum = 0
      // example of overlapConfig item: overlapConfig[5180] = [36, 38, 42];
      overlapConfig[uniqueChannels[item].frequency].forEach(fConfig => {
        if (uniqueChannels[fConfig]) {
          sum += uniqueChannels[fConfig].powerSum
        }
      })
      uniqueChannels[item].overlapPoverSum = sum
    }
  })
  return uniqueChannels
}

const calcNodePowers = (SCresult = []) => {
  const nodePowers = []
  SCresult.forEach(item => {
    const tmp = item
    // eslint-disable-next-line
    tmp.power = (Math.pow(10, tmp['Signal(dBm)'] / 10) * 100) / tmp['LastSeen(ms)']
    if (tmp.power === Infinity) tmp.power = 0
    // add channel by frequency;
    tmp.channel = frequencyConfig[tmp['Frequency(MHz)']]
    nodePowers.push(tmp)
  })
  return nodePowers
}

const getOverlappedChannels = uniqueChannels => {
  const channelsOverlapedAddon = {}
  Object.keys(uniqueChannels).forEach(item => {
    if (channelsConfig['2.4GHz'][20].indexOf(+item) !== -1) {
      overlap24addConfig[+item].forEach(addArr => {
        if (!channelsOverlapedAddon[addArr]) {
          channelsOverlapedAddon[addArr] = cloneDeep(uniqueChannels[item])
        } else {
          channelsOverlapedAddon[addArr].overlapPoverSum =
            channelsOverlapedAddon[addArr].overlapPoverSum < uniqueChannels[item].overlapPoverSum
              ? uniqueChannels[item].overlapPoverSum
              : channelsOverlapedAddon[addArr].overlapPoverSum
        }
      })
    }
  })
  return channelsOverlapedAddon
}

const calcByNodes = sumOverlapsArr => {
  const unsignedNoise2G = {}
  const unsignedNoise5G = {}
  let noise2 = false
  let noise5 = false
  const newSumOverlapsArr = {}

  Object.keys(sumOverlapsArr).forEach(nodeId => {
    const uniqueChannels = cloneDeep(sumOverlapsArr[nodeId])
    const channelsOverlapedAddon = getOverlappedChannels(uniqueChannels)
    Object.assign(uniqueChannels, channelsOverlapedAddon)
    newSumOverlapsArr[nodeId] = uniqueChannels
  })
  Object.keys(newSumOverlapsArr).forEach(nodeId => {
    unsignedNoise2G[nodeId] = channelsConfig['2.4GHz'][20].map(item => {
      if (newSumOverlapsArr[nodeId][item]) {
        noise2 = true
        const rez = -10 * Math.log10(newSumOverlapsArr[nodeId][item].overlapPoverSum)
        return rez > 100 ? 100 : rez
      }
      return 100 // if there is no incoming data on the channel
    })
    unsignedNoise5G[nodeId] = channelsConfig['5GHz'][20].map(item => {
      if (newSumOverlapsArr[nodeId][item]) {
        noise5 = true
        const rez = -10 * Math.log10(newSumOverlapsArr[nodeId][item].overlapPoverSum)
        return rez > 100 ? 100 : rez
      }
      return 100 // if there is no incoming data on the channel
    })
  })
  return {
    noise5,
    noise2,
    unsignedNoise5G,
    unsignedNoise2G,
  }
}

export const getChannelsSuggestions = (countryCodeArr = ['US']) => {
  const suggestionsTmp = {}
  const a = ['2.4GHz', '5GHz'].forEach(GHz => {
    const tmp = []
    countryCodeArr.forEach(code => {
      if (channelsTables[GHz][code]) {
        tmp.push(channelsTables[GHz][code])
      } else {
        tmp.push(channelsTables[GHz].default)
      }
    })
    let rez = tmp[0]
    tmp.forEach((tmpItem, i) => {
      if (i > 0) {
        rez = rez.filter(value => tmpItem.includes(value))
      }
    })
    suggestionsTmp[GHz] = rez
  })
  return suggestionsTmp
}

export const makeDataByFrequency = (nodeList, byNodes = false) => {
  const nodesPowersAll = {}
  const nodesCount = nodeList.length
  nodeList.forEach(node => {
    if (
      node.channel_scan_result &&
      node.channel_scan_result !== '' &&
      JSON.parse(node.channel_scan_result).length !== 0
    ) {
      nodesPowersAll[node.id] = calcNodePowers(JSON.parse(node.channel_scan_result))
    }
  })

  const sumOverlapsArr = {}
  Object.keys(nodesPowersAll).forEach(nodePowerData => {
    sumOverlapsArr[nodePowerData] = sumOverlaps(nodesPowersAll[nodePowerData])
  })
  if (byNodes) return calcByNodes(sumOverlapsArr)
  const uniqueChannels = {}
  Object.keys(sumOverlapsArr).forEach(item => {
    Object.keys(sumOverlapsArr[item]).forEach(channel => {
      if (!uniqueChannels[channel]) {
        uniqueChannels[channel] = {}
        uniqueChannels[channel].overlapPoverSum = 0
      }
      uniqueChannels[channel].overlapPoverSum += sumOverlapsArr[item][channel].overlapPoverSum
    })
  })

  const channelsOverlapedAddon = getOverlappedChannels(uniqueChannels)
  Object.assign(uniqueChannels, channelsOverlapedAddon)

  // calc noises for 2.4 20
  let noise2 = false
  let noise5 = false
  const unsignedNoise2G = channelsConfig['2.4GHz'][20].map(item => {
    if (uniqueChannels[item]) {
      noise2 = true
      const rez = -10 * Math.log10(uniqueChannels[item].overlapPoverSum / nodesCount)
      return rez > 100 ? 100 : rez
    }
    return 100 // if there is no incoming data on the channel
  })
  const unsignedNoise5G = channelsConfig['5GHz'][20].map(item => {
    if (uniqueChannels[item]) {
      noise5 = true
      const rez = -10 * Math.log10(uniqueChannels[item].overlapPoverSum / nodesCount)
      return rez > 100 ? 100 : rez
    }
    return 100 // if there is no incoming data on the channel
  })
  return { noise2, noise5, unsignedNoise5G, unsignedNoise2G }
}
