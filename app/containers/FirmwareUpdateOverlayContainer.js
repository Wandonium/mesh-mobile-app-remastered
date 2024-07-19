import { connect } from 'react-redux'
import { FirmwareUpdateOverlay } from '../components'

const mstp = ({ bleDfu }) => {
  const download_percent = bleDfu.download_percent
  const dfu_percent = bleDfu.dfu_percent
  const downloaded = bleDfu.downloaded
  const downloading = bleDfu.downloading
  const updating = bleDfu.updating

  const canUpdate = bleDfu.canUpdate

  const isLoading = bleDfu.isLoading
  const isInstalling = bleDfu.updating

  const dfu_error = bleDfu.dfu_error

  const applyingUpdate = bleDfu.applyingUpdate

  const selectBattery0v4 = bleDfu.selectBattery0v4

  return {
    download_percent: download_percent,
    dfu_percent: dfu_percent,
    downloaded: downloaded,
    downloading: downloading,
    updating: updating,
    canUpdate: canUpdate,
    isLoading: isLoading,
    isInstalling: isInstalling,
    dfu_error: dfu_error,
    applyingUpdate: applyingUpdate,
    selectBattery0v4: selectBattery0v4,
  }
}


export default connect(mstp, null)(FirmwareUpdateOverlay)
