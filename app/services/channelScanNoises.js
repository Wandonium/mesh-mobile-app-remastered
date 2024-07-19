import channelsConfig from '../constants/channels.config'

/**
 * logic from py script (noises calc)
 * @param network - (2.4GHz || 5GHz)
 * @param bandwidth - (20 || 40 || 80)
 * @param unsignedNoise5G
 * @param unsignedNoise2G
 * @returns {Array}
 */
export const getGroupedNoises = (network, bandwidth, unsignedNoise5G, unsignedNoise2G) => {
  let noises = []
  if (network === '2.4GHz') {
    if (bandwidth === 20) {
      noises = unsignedNoise2G.map((noise, i) => {
        const key = channelsConfig[network][20][i]
        return {
          overlapChannel: key,
          noise,
          channels: [key],
        }
      })
    } else if (bandwidth === 40) {
      noises = [
        {
          overlapChannel: 3,
          noise: Math.min(...[unsignedNoise2G[0], unsignedNoise2G[4]]),
          channels: [
            channelsConfig[network][20][0], // 1
            channelsConfig[network][20][1],
            channelsConfig[network][20][2], // 3
            channelsConfig[network][20][3],
            channelsConfig[network][20][4],
            channelsConfig[network][20][5],
            channelsConfig[network][20][6], // 7
          ],
        },
        {
          overlapChannel: 11,
          noise: Math.min(...[unsignedNoise2G[8], unsignedNoise2G[12]]),
          channels: [
            channelsConfig[network][20][6], // 7
            channelsConfig[network][20][7],
            channelsConfig[network][20][8],
            channelsConfig[network][20][9],
            channelsConfig[network][20][10], // 11
            channelsConfig[network][20][11],
            channelsConfig[network][20][12],
            channelsConfig[network][20][13], // 14
          ],
        },
      ]
    }
  } else if (network === '5GHz') {
    if (bandwidth === 20) {
      noises = unsignedNoise5G.map((noise, i) => {
        const key = channelsConfig[network][20][i]
        return {
          overlapChannel: key,
          noise,
          channels: [key],
        }
      })
    } else if (bandwidth === 40) {
      noises = [
        {
          overlapChannel: 38,
          noise: Math.min(...unsignedNoise5G.slice(0, 2)),
          channels: channelsConfig[network][20].slice(0, 2),
        },
        {
          overlapChannel: 46,
          noise: Math.min(...unsignedNoise5G.slice(2, 4)),
          channels: channelsConfig[network][20].slice(2, 4),
        },
        {
          overlapChannel: 54,
          noise: Math.min(...unsignedNoise5G.slice(4, 6)),
          channels: channelsConfig[network][20].slice(4, 6),
        },
        {
          overlapChannel: 62,
          noise: Math.min(...unsignedNoise5G.slice(6, 8)),
          channels: channelsConfig[network][20].slice(6, 8),
        },
        {
          overlapChannel: 102,
          noise: Math.min(...unsignedNoise5G.slice(8, 10)),
          channels: channelsConfig[network][20].slice(8, 10),
        },
        {
          overlapChannel: 110,
          noise: Math.min(...unsignedNoise5G.slice(10, 12)),
          channels: channelsConfig[network][20].slice(10, 12),
        },
        {
          overlapChannel: 118,
          noise: Math.min(...unsignedNoise5G.slice(12, 14)),
          channels: channelsConfig[network][20].slice(12, 14),
        },
        {
          overlapChannel: 126,
          noise: Math.min(...unsignedNoise5G.slice(14, 16)),
          channels: channelsConfig[network][20].slice(14, 16),
        },
        {
          overlapChannel: 134,
          noise: Math.min(...unsignedNoise5G.slice(16, 18)),
          channels: channelsConfig[network][20].slice(16, 18),
        },
        {
          overlapChannel: 142,
          noise: Math.min(...unsignedNoise5G.slice(18, 19)),
          channels: channelsConfig[network][20].slice(18, 19),
        },
        {
          overlapChannel: 151,
          noise: Math.min(...unsignedNoise5G.slice(20, 22)),
          channels: channelsConfig[network][20].slice(20, 22),
        },
        {
          overlapChannel: 159,
          noise: Math.min(...unsignedNoise5G.slice(22, 24)),
          channels: channelsConfig[network][20].slice(22, 24),
        },
      ]
    } else if (bandwidth === 80) {
      noises = [
        {
          overlapChannel: 42,
          noise: Math.min(...unsignedNoise5G.slice(0, 4)),
          channels: channelsConfig[network][20].slice(0, 4),
        },
        {
          overlapChannel: 58,
          noise: Math.min(...unsignedNoise5G.slice(4, 8)),
          channels: channelsConfig[network][20].slice(4, 8),
        },
        {
          overlapChannel: 106,
          noise: Math.min(...unsignedNoise5G.slice(8, 12)),
          channels: channelsConfig[network][20].slice(8, 12),
        },
        {
          overlapChannel: 122,
          noise: Math.min(...unsignedNoise5G.slice(12, 16)),
          channels: channelsConfig[network][20].slice(12, 16),
        },
        {
          overlapChannel: 138,
          noise: Math.min(...unsignedNoise5G.slice(16, 20)),
          channels: channelsConfig[network][20].slice(16, 20),
        },
        {
          overlapChannel: 155,
          noise: Math.min(...unsignedNoise5G.slice(20, 24)),
          channels: channelsConfig[network][20].slice(20, 24),
        },
      ]
    }
  }
  return noises
}
