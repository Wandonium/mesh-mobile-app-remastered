// AlertHelper.alert('error', 'Title', 'error message')

export default class AlertHelper {
  static dropDown

  static onClose

  static setDropDown(dropDown) {
    this.dropDown = dropDown
  }

  static alert(type, title, message) {
    if (this.dropDown) {
      this.dropDown.alertWithType(type, title, message)
    }
  }

  static setOnClose(onClose) {
    this.onClose = onClose
  }

  static invokeOnClose() {
    if (typeof this.onClose === 'function') {
      this.onClose()
    }
  }
}
