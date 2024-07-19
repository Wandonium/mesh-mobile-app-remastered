const customTimeout = (func, time) =>
  new Promise(resolve => {
    setTimeout(async () => {
      await func()
      resolve()
    }, time)
  })

const typeText = async (id, text) => {
  await element(by.id(id)).tap()
  await element(by.id(id)).clearText()
  await element(by.id(id)).typeText(text)
}

describe('Login', () => {
  beforeEach(async () => {
    await device.reloadReactNative()
  })

  it('enter the system by entering proper credentials', async () => {
    await waitFor(element(by.id('Login')))
      .toBeVisible()
      .withTimeout(2000)

    await typeText('LoginEmail', 'vasya_kashapov@meta.ua')
    await typeText('LoginPassword', '123qwertY')
    await element(by.id('LoginButton')).tap()

    await waitFor(element(by.id('Dashboard')))
      .toBeVisible()
      .withTimeout(2000)
  })
})

describe('MyProfile', () => {
  it('change user name', async () => {
    await waitFor(element(by.id('Spinner')))
      .toNotExist()
      .withTimeout(2000)

    await element(by.id('MyProfileTab')).tap()
    await element(by.id('MyProfileName')).replaceText('Artist - ' + Math.round(Math.random() * 100))
    await element(by.id('MyProfileSave')).tap()
    await element(by.label('OK').and(by.type('_UIAlertControllerActionView'))).tap()
  })
})

describe('Create', () => {
  it('create network', async () => {
    const networkName = 'Network' + Math.round(Math.random() * 100)

    await device.setLocation(32.0853, 34.7818)
    await element(by.id('CreateTab')).tap()
    await element(by.id('CreateNetwork')).tap()
    await typeText('CreateNetworkName', networkName)
    await element(by.id('CreateNetworkName')).tapReturnKey()
    await element(by.id('CreateNetworkLocation')).tap()
    await customTimeout(async () => {
      await element(by.id('LocationDone')).tapAtPoint({ x: 80, y: -200 })
      await customTimeout(async () => {
        await element(by.id('LocationDone')).tap()
      }, 1500)
    }, 2000)
    await element(by.id('EditNetworkChannelsButton')).tap()
    await customTimeout(async () => {
      await element(by.id('CreateNetworkDone')).tap()
    }, 2000)
  })

  it('create node', async () => {
    const nodeName = 'Node' + Math.round(Math.random() * 100)
    const nodeMAC = String(Math.random())
      .split('.')[1]
      .slice(0, 12)

    await element(by.id('CreateNode')).tap()
    await element(by.id('NodeCreationMethodManually')).tap()
    await typeText('NodeManualName', nodeName)
    await typeText('NodeManualMAC', nodeMAC)
    await element(by.id('NodeManualMAC')).tapReturnKey()
    await element(by.id('NodeManualAssociatedNetwork')).tap()
    await element(by.id('AssociatedNetwork382')).tap()
    await element(by.id('AssociatedNetworkSave')).tap()
    await element(by.id('NodeManualLocation')).tap()
    await customTimeout(async () => {
      await element(by.id('LocationDone')).tapAtPoint({ x: 80, y: -200 })
      await customTimeout(async () => {
        await element(by.id('LocationDone')).tap()
      }, 1500)
    }, 2000)
    await element(by.id('NodeManualSetup')).tap()
    await customTimeout(async () => {
      await element(by.id('CreateNodeDone')).tap()
    }, 2000)
  })
})

describe('Edit', () => {
  it('edit network name', async () => {
    const networkName = 'Network' + Math.round(Math.random() * 100)

    await element(by.id('DashboardTab')).tap()
    await element(by.id('Dashboard187')).tap()
    await element(by.id('NetworkDetailsSettings')).tap()
    await typeText('NetworkDetailsName', networkName)
    await element(by.id('NetworkDetailsName')).tapReturnKey()
  })
})
