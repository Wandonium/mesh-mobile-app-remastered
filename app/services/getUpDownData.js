const convertToGbps = val => (+val / 1000).toString()

const convertToKbps = val => (+val * 1000).toString()

const getUpDownData = (gateways_upload_rate = '0', gateways_download_rate = '0') => {
  let upload = gateways_upload_rate.toString()
  let points = 'Mbps'
  let uploadFix = 2
  let download = gateways_download_rate.toString()
  let downloadFix = 2

  if (+upload > +download) {
    if (upload.split('.')[0].length > 3) {
      // convert upload
      points = 'Gbps'
      upload = convertToGbps(upload)
      download = convertToGbps(download)
    } else if (upload < 1 && upload > 0) {
      points = 'Kbps'
      upload = convertToKbps(upload)
      download = convertToKbps(download)
    }
  } else if (download.split('.')[0].length > 3) {
    // convert download
    points = 'Gbps'
    download = convertToGbps(download)
    upload = convertToGbps(upload)
  } else if (download < 1 && download > 0) {
    points = 'Kbps'
    download = convertToKbps(download)
    upload = convertToKbps(upload)
  }

  if (upload.split('.')[0].length <= 1) {
    uploadFix = 2
  } else if (upload.split('.')[0].length === 2) {
    uploadFix = 1
  } else {
    uploadFix = 0
  }

  if (download.split('.')[0].length <= 1) {
    downloadFix = 2
  } else if (download.split('.')[0].length === 2) {
    downloadFix = 1
  } else {
    downloadFix = 0
  }
  upload = +upload
  download = +download

  return {
    upload: upload.toFixed(uploadFix),
    download: download.toFixed(downloadFix),
    points,
  }
}

export default getUpDownData
