import React, { PureComponent }from 'react'
import { 
  ActivityIndicator, 
  StyleSheet, 
  Text, 
  View,
  Dimensions
} from 'react-native';
import Dialog, { 
  DialogFooter, 
  DialogButton, 
  DialogContent 
} from '../library/react-native-popup-dialog/index'
import ProgressBar from 'react-native-progress/Bar'
import { ManageThemeContext } from '../theme/ThemeManager'

const screenWidth = Dimensions.get('window').width
const screenHeight = Dimensions.get('window').height
const barHeight = (screenHeight - 179) * 0.015

export default class FirmwareUpdateOverlay extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      isLoading: false,
      isInstalling: true,
      barProgress: 1.0,
      canUpdate: true
    }
  }

  closeOverlayInstalling() {
    if (this.state.percent === 100) {
      this.props.closeOverlay();
    } else {
      // do nothing
    }
  }

  // Checking if device object is empty (no device connected)
  _isEmpty(obj) {
    for (var key in obj) {
      if (obj.hasOwnProperty(key))
        return false
    }
    return true
  }


  // Displays screen components
  render() {
    //When check for updates is loading. 
    if (!this.props.updating && this.props.isLoading) {
      return (
        <ManageThemeContext.Consumer>
        {({ theme }) => (
          <Dialog
            visible={this.props.overlayIsVisible}
            onTouchOutside={this.props.closeOverlay}
            width={0.2}
            height={0.09}
          >
            <DialogContent style={{ ...styles.popupDialogStyle, backgroundColor: theme.primaryBackground }}>
              <ActivityIndicator 
                size="large" 
                color={'#ff3b47'} 
                style={styles.indicatorStyle}
              />
            </DialogContent>
          </Dialog>
        )}
        </ManageThemeContext.Consumer>
      )
    }
    //When check for updates finishes loading and there is an update 
    else if (!this.props.updating && this.props.canUpdate && !this.props.selectBattery0v4) {
      return (
        <ManageThemeContext.Consumer>
        {({ theme }) => (
          <Dialog
            visible={this.props.overlayIsVisible}
            onTouchOutside={this.props.closeOverlay}
            width={0.7} //Width is 70% of screen width
            height={0.15} //height is 15% of screen height
            footer={
              <DialogFooter style={{ ...styles.popupButtonStyle, backgroundColor: theme.primaryBackground }}>
                <DialogButton
                  text="CANCEL"
                  textStyle={{ ...styles.cancelButtonText, color: theme.primaryText}}
                  onPress={this.props.closeOverlay} />
                <DialogButton
                  text="OK"
                  textStyle={styles.okButtonText}
                  onPress={this.props.checkBattery} />
              </DialogFooter>
            }
          >
            <DialogContent style={{ ...styles.popupDialogStyle, backgroundColor: theme.primaryBackground }}>
              <Text style={{ ...styles.popupTextStyle, color: theme.primaryText}}>
                Update available. Install now?
              </Text>
            </DialogContent>
          </Dialog>
        )}
        </ManageThemeContext.Consumer>
      )
    }
    //If we are setting battery pack for 0v4
    else if (this.props.selectBattery0v4) {
      return (
        <ManageThemeContext.Consumer>
          {({ theme }) => (
            <Dialog
              visible={this.props.overlayIsVisible}
              onTouchOutside={this.props.closeOverlay}
              width={0.7} //Width is 70% of screen width
              height={0.15} //height is 15% of screen height
              footer={
                <DialogFooter style={{ ...styles.popupButtonStyle, backgroundColor: theme.primaryBackground }}>
                  <DialogButton
                    text="BATTERY"
                    textStyle={{ ...styles.cancelButtonText, color: theme.primaryText}}
                    onPress={this.props.selectBatteryNormal} />
                  <DialogButton
                    text="12V ADAPTER"
                    textStyle={styles.okButtonText}
                    onPress={this.props.selectBatteryAdapter} />
                </DialogFooter>
              }
            >
              <DialogContent style={{ ...styles.popupDialogStyle, backgroundColor: theme.primaryBackground }}>
                <Text style={{ ...styles.popupTextStyle, color: theme.primaryText}}>
                  Is the device running on battery power or 12V adapter?
                </Text>
              </DialogContent>
            </Dialog>
          )}
        </ManageThemeContext.Consumer>
      )
    }
    //If the update is downloading.  
    else if (this.props.downloading) {
      return (
        <ManageThemeContext.Consumer>
        {({ theme }) => (
          <Dialog
            visible={this.props.overlayIsVisible}
          >
            <DialogContent style={{ ...styles.popupDialogStyle, backgroundColor: theme.primaryBackground }}>
              <Text style={{ ...styles.popupTextStyle, color: theme.primaryText}}>
                Downloading... {this.props.download_percent}%
              </Text>
              <ProgressBar 
                color={'#ff3b47'} 
                progress={this.props.download_percent / 100.0} 
                width={screenWidth * 0.65} 
                height={barHeight} 
              />
            </DialogContent>
          </Dialog>
        )}
        </ManageThemeContext.Consumer>
      )
    }
    //If the update is progressing 
    else if (this.props.updating) {
      return (
        <ManageThemeContext.Consumer>
        {({ theme }) => (
          <Dialog
            visible={this.props.overlayIsVisible}
          >
            <DialogContent style={{ ...styles.popupDialogStyle, backgroundColor: theme.primaryBackground }}>
              <Text style={{ ...styles.popupTextStyle, color: theme.primaryText}}>
                Installing... {this.props.dfu_percent}%
              </Text>
              <ProgressBar 
                color={'#ff3b47'} 
                progress={this.props.dfu_percent / 100.0} 
                width={screenWidth * 0.65} 
                height={barHeight} 
              />
            </DialogContent>
          </Dialog>
        )}
        </ManageThemeContext.Consumer>
      )
    } 
    else if (this.props.applyingUpdate) {
      return (
        <ManageThemeContext.Consumer>
        {({ theme }) => (
          <Dialog
            visible={this.props.overlayIsVisible}
          >
            <DialogContent style={{ ...styles.popupDialogStyle, backgroundColor: theme.primaryBackground }}>
              <Text style={{ ...styles.popupTextStyle, color: theme.primaryText }}>
                Applying Update...
                {'\n'}
                Do not close the app
              </Text>
              <ActivityIndicator 
                size="small" 
                color={'#ff3b47'} 
              />
            </DialogContent>
          </Dialog>
        )}
        </ManageThemeContext.Consumer>
      )
    }
    // if there is DFU error.
    else if (this.props.dfu_error) {
      return (
        <ManageThemeContext.Consumer>
        {({ theme }) => (
          <Dialog
            visible={this.props.overlayIsVisible}
            onTouchOutside={this.props.closeOverlay}
          >
            <DialogContent style={{ backgroundColor: theme.primaryBackground }}>
              <View style={styles.popupDialogStyle}>
                <Text style={{ ...styles.popupTextStyle, color: theme.primaryText}}>
                  Over the Air Update Error!
                </Text>
              </View>
            </DialogContent>
          </Dialog>
        )}
        </ManageThemeContext.Consumer>
      )
    }
    // if there is no more update. 
    else {
      return (
        <ManageThemeContext.Consumer>
        {({ theme }) => (
          <Dialog
            visible={this.props.overlayIsVisible}
            onTouchOutside={this.props.closeOverlay}
          >
            <DialogContent style={{ backgroundColor: theme.primaryBackground }}>
              <View style={styles.popupDialogStyle}>
                <Text style={{ ...styles.popupTextStyle, color: theme.primaryText}}>
                  Your app is up to date!
                </Text>
              </View>
            </DialogContent>
          </Dialog>
        )}
        </ManageThemeContext.Consumer>
      )
    }
  }
}

const styles = StyleSheet.create({
  popupDialogStyle: {
    width: screenWidth * 0.7,
    height: screenHeight * 0.09,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center'
  },

  popupTextStyle: {
    textAlign: 'center',
    fontSize: 15,
    color: '#191919'
  },

  popupButtonStyle: {
    width: screenWidth * 0.7, 
    height: screenHeight * 0.06, 
    alignSelf: 'center'
  },

  cancelButtonText: {
    textAlign: 'center',
    fontSize: 15,
    color: '#191919',
  },

  okButtonText: {
    textAlign: 'center',
    fontSize: 15,
    color: '#ff3b47'
  },

  indicatorStyle: {
    alignSelf: "center", 
    alignItems: 'center',
    justifyContent: 'center'
  }
})
