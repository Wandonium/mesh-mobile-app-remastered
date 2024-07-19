import React, { PureComponent } from 'react'
import { NavigationContainer, createSwitchNavigator, getFocusedRouteNameFromRoute } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createStackNavigator } from '@react-navigation/stack'
import {
  AdoptedNodes,
  Alerts,
  AllNetworks,
  AssociatedNetwork,
  BLESearch,
  ChangeUserEmail,
  ChangeUserEmailDone,
  ChangeUserPassword,
  ChannelScan,
  Create,
  CreateNodeQR,
  CreateNodeDone,
  CreateNetwork,
  CreateNetworkAddNode,
  CreateNetworkDone,
  CreateSSID,
  Dashboard,
  EditNetworkChannels,
  InviteTeamMember,
  Location,
  Login,
  MyProfile,
  Network,
  NodeManual,
  Registration,
  RegistrationConfirm,
  RecoveryPassword,
  RecoveryPasswordConfirm,
  ShareNetwork,
  SharingSettings,
  Splash,
  SSIDList,
  TeamMembers,
  AboutPage,
  FirmwareUpdateOverlay,
  DiagnosticInfo,
} from '../containers'
import BottomTabBar from '../components/BottomTabBar'
import { DashboardIcon, CreateIcon, BluetoothIcon, MyProfileIcon } from '../components/svg'
import { ManageThemeContext } from '../theme/ThemeManager'

const rootStack = createStackNavigator()
const dashoardStack = createStackNavigator()
const myProfileStack = createStackNavigator()
const createStack = createStackNavigator()
const bleSearchStack = createStackNavigator()
const bleSearchStackOffline = createStackNavigator()
const loginStack = createStackNavigator()

const bottomTab = createBottomTabNavigator()

const defaultNavigationOptions = {
  headerShown: false,
  cardOverlayEnabled: true,
  cardShadowEnabled: true,
}

function DashoardStackScreens() {
  return (
    <dashoardStack.Navigator
      initialRouteName="DashboardScreen"
      screenOptions={defaultNavigationOptions}
    >
      <dashoardStack.Screen
        name="DashboardScreen"
        component={Dashboard}
      />
      <dashoardStack.Screen
        name="Network"
        component={Network}
      />
      <dashoardStack.Screen
        name="AllNetworks"
        component={AllNetworks}
      />
      <dashoardStack.Screen
        name="NodeManual"
        component={NodeManual}
      />
      <dashoardStack.Screen
        name="CreateNodeDone"
        component={CreateNodeDone}
      />
      <dashoardStack.Screen
        name="Location"
        component={Location}
      />
      <dashoardStack.Screen
        name="AssociatedNetwork"
        component={AssociatedNetwork}
      />
      <dashoardStack.Screen
        name="AdoptedNodes"
        component={AdoptedNodes}
      />
      <dashoardStack.Screen
        name="Alerts"
        component={Alerts}
      />
      <dashoardStack.Screen
        name="SSIDList"
        component={SSIDList}
      />
      <dashoardStack.Screen
        name="CreateSSID"
        component={CreateSSID}
      />
      <dashoardStack.Screen
        name="EditNetworkChannels"
        component={EditNetworkChannels}
      />
      <dashoardStack.Screen
        name="ChannelScan"
        component={ChannelScan}
      />
      <dashoardStack.Screen
        name="CreateNodeQR"
        component={CreateNodeQR}
      />
      <dashoardStack.Screen
        name="BLESearch"
        component={BLESearch}
        options={{ isNetworkAddNode: false }}
      />
      <dashoardStack.Screen
        name="SharingSettings"
        component={SharingSettings}
      />
      <dashoardStack.Screen
        name="ShareNetwork"
        component={ShareNetwork}
      />
      <dashoardStack.Screen
        name="AboutPage"
        component={AboutPage}
      />
      <dashoardStack.Screen
        name="DiagnosticInfo"
        component={DiagnosticInfo}
      />
    </dashoardStack.Navigator>
  )
}

function MyProfileStackScreens() {
  return (
    <myProfileStack.Navigator
      initialRouteName="MyProfile"
      screenOptions={defaultNavigationOptions}
    >
      <myProfileStack.Screen
        name="MyProfile"
        component={MyProfile}
      />
      <myProfileStack.Screen
        name="ChangeUserPassword"
        component={ChangeUserPassword}
      />
      <myProfileStack.Screen
        name="ChangeUserEmail"
        component={ChangeUserEmail}
      />
      <myProfileStack.Screen
        name="ChangeUserEmailDone"
        component={ChangeUserEmailDone}
      />
      <myProfileStack.Screen
        name="TeamMembers"
        component={TeamMembers}
      />
      <myProfileStack.Screen
        name="InviteTeamMember"
        component={InviteTeamMember}
      />
    </myProfileStack.Navigator>
  )
}

function CreateStackScreens() {
  return (
    <createStack.Navigator
      initialRouteName="Create"
      screenOptions={defaultNavigationOptions}
    >
      <createStack.Screen
        name="Create"
        component={Create}
      />
      <createStack.Screen
        name="NodeManual"
        component={NodeManual}
      />
      <createStack.Screen
        name="CreateNodeDone"
        component={CreateNodeDone}
      />
      <createStack.Screen
        name="CreateNetwork"
        component={CreateNetwork}
      />
      <createStack.Screen
        name="CreateNetworkDone"
        component={CreateNetworkDone}
      />
      <createStack.Screen
        name="Network"
        component={Network}
      />
      <createStack.Screen
        name="AssociatedNetwork"
        component={AssociatedNetwork}
      />
      <createStack.Screen
        name="AdoptedNodes"
        component={AdoptedNodes}
      />
      <createStack.Screen
        name="Location"
        component={Location}
      />
      <createStack.Screen
        name="CreateNetworkAddNode"
        component={CreateNetworkAddNode}
      />
      <createStack.Screen
        name="CreateNodeQR"
        component={CreateNodeQR}
      />
      <createStack.Screen
        name="SSIDList"
        component={SSIDList}
      />
      <createStack.Screen
        name="CreateSSID"
        component={CreateSSID}
      />
      <createStack.Screen
        name="EditNetworkChannels"
        component={EditNetworkChannels}
      />
      <createStack.Screen
        name="AboutPage"
        component={AboutPage}
      />
      <createStack.Screen
        name="DiagnosticInfo"
        component={DiagnosticInfo}
      />
      <createStack.Screen
        name="BLESearch"
        component={BLESearch}
        options={{ isNetworkAddNode: true }}
      />
    </createStack.Navigator>
  )
}

function BleSearchStackScreens() {
  return (
    <bleSearchStack.Navigator
      initialRouteName="BLESearch"
      screenOptions={defaultNavigationOptions}
    >
      <bleSearchStack.Screen
        name="BLESearch"
        component={BLESearch}
        options={{ isNetworkAddNode: false }}
      />
      <bleSearchStack.Screen
        name="NodeManual"
        component={NodeManual}
      />
      <bleSearchStack.Screen
        name="AssociatedNetwork"
        component={AssociatedNetwork}
      />
      <bleSearchStack.Screen
        name="Location"
        component={Location}
      />
      <bleSearchStack.Screen
        name="CreateNodeDone"
        component={CreateNodeDone}
      />
      <bleSearchStack.Screen
        name="AdoptedNodes"
        component={AdoptedNodes}
      />
      <bleSearchStack.Screen
        name="AboutPage"
        component={AboutPage}
      />
      <bleSearchStack.Screen
        name="FirmwareUpdateOverlay"
        component={FirmwareUpdateOverlay}
      />
      <bleSearchStack.Screen
        name="DiagnosticInfo"
        component={DiagnosticInfo}
      />
    </bleSearchStack.Navigator>
  )
}

function BleSearchStackOfflineScreens() {
  return (
    <bleSearchStackOffline.Navigator
      initialRouteName="BLESearchOffline"
      screenOptions={{
        headerShown: false,
        tabBarVisible: false,
        gestureEnabled: false,
      }}
    >
      <bleSearchStackOffline.Screen
        name="BLESearchOffline"
        component={BLESearch}
      />
    </bleSearchStackOffline.Navigator>
  )
}

function LoginStackScreens() {
  return (
    <loginStack.Navigator
      screenOptions={{
        headerShown: false,
        tabBarVisible: false,
        gestureEnabled: true,
      }}
    >
      <loginStack.Screen
        name="Login"
        component={Login}
      />
      <loginStack.Screen
        name="Registration"
        component={Registration}
      />
      <loginStack.Screen
        name="RegistrationConfirm"
        component={RegistrationConfirm}
      />
      <loginStack.Screen
        name="RecoveryPassword"
        component={RecoveryPassword}
      />
      <loginStack.Screen
        name="RecoveryPasswordConfirm"
        component={RecoveryPasswordConfirm}
      />
    </loginStack.Navigator>
  )
}

function TabScreens() {
  return (
    <ManageThemeContext.Consumer>
      {({ theme }) => (
        <bottomTab.Navigator
          screenOptions={({ route, navigation }) => ({
            headerShown: false,
            tabBarActiveTintColor: "#444444", 
            tabBarInactiveTintColor: "#555555", 
            tabBarStyle: { backgroundColor: theme.primaryBackground },
            tabBarIcon: ({ focused }) => {
              if (route.name === 'Dashboard') {
                return <DashboardIcon focused={focused} />
              } else if (route.name === 'Setup') {
                return <CreateIcon focused={focused} />
              } else if (route.name === 'Search') {
                return <BluetoothIcon focused={focused} />
              } else if (route.name === "Profile")   {
                return <MyProfileIcon focused={focused} />
              }
          }
          })}
        >
          <bottomTab.Screen
            name="Dashboard"
            component={DashoardStackScreens}
            options={({ route }) => ({
              tabBarStyle: ((route) => {
                const routeName = getFocusedRouteNameFromRoute(route)
                console.log('[router.js] - Dashboard routeName', routeName)
                if([
                'Network',
                'AllNetworks',
                'NodeManual',
                'CreateNodeDone',
                'CreateNetwork',
                'CreateNetworkAddNode',
                'CreateNetworkDone',
                'AssociatedNetwork',
                'AdoptedNodes',
                'Location',
                'Alerts',
                'TeamMembers',
                'InviteTeamMember',
                'SSIDList',
                'CreateSSID',
                'EditNetworkChannels',
                'ChannelScan',
                'SharingSettings',
                'ShareNetwork',
                'CreateNodeQR',
                'AboutPage',
                'FirmwareUpdateOverlay',
                'DiagnosticInfo'
              ].includes(routeName)) {
                return { backgroundColor: theme.primaryBackground, display: "none" }
            }
            return { backgroundColor: theme.primaryBackground }
          })(route),
        })}

          />
          <bottomTab.Screen
            name="Setup"
            component={CreateStackScreens}
            options={({ route }) => ({
              tabBarStyle: ((route) => {
                const routeName = getFocusedRouteNameFromRoute(route)
                console.log('[router.js] - Setup routeName', routeName)
                if([
                'Network',
                'AllNetworks',
                'NodeManual',
                'CreateNodeDone',
                'CreateNetwork',
                'CreateNetworkAddNode',
                'CreateNetworkDone',
                'AssociatedNetwork',
                'AdoptedNodes',
                'Location',
                'Alerts',
                'TeamMembers',
                'InviteTeamMember',
                'SSIDList',
                'CreateSSID',
                'EditNetworkChannels',
                'ChannelScan',
                'SharingSettings',
                'ShareNetwork',
                'CreateNodeQR',
                'AboutPage',
                'FirmwareUpdateOverlay',
                'DiagnosticInfo'
              ].includes(routeName)) {
                return { backgroundColor: theme.primaryBackground, display: "none" }
            }
            return { backgroundColor: theme.primaryBackground }
          })(route),
        })}
          />
          <bottomTab.Screen
            name="Search"
            component={BleSearchStackScreens}
            options={({ route }) => ({
              tabBarStyle: ((route) => {
                const routeName = getFocusedRouteNameFromRoute(route)
                console.log('[router.js] - Search routeName', routeName)
                if([
                'Network',
                'AllNetworks',
                'NodeManual',
                'CreateNodeDone',
                'CreateNetwork',
                'CreateNetworkAddNode',
                'CreateNetworkDone',
                'AssociatedNetwork',
                'AdoptedNodes',
                'Location',
                'Alerts',
                'TeamMembers',
                'InviteTeamMember',
                'SSIDList',
                'CreateSSID',
                'EditNetworkChannels',
                'ChannelScan',
                'SharingSettings',
                'ShareNetwork',
                'CreateNodeQR',
                'AboutPage',
                'FirmwareUpdateOverlay',
                'DiagnosticInfo'
              ].includes(routeName)) {
                return { backgroundColor: theme.primaryBackground, display: "none" }
            }
            return { backgroundColor: theme.primaryBackground }
          })(route),
        })}
          />
          <bottomTab.Screen
            name="Profile"
            component={MyProfileStackScreens}
            options={({ route }) => ({
              tabBarStyle: ((route) => {
                const routeName = getFocusedRouteNameFromRoute(route)
                console.log('[router.js] - Profile routeName', routeName)
                if([
                'Network',
                'AllNetworks',
                'NodeManual',
                'CreateNodeDone',
                'CreateNetwork',
                'CreateNetworkAddNode',
                'CreateNetworkDone',
                'AssociatedNetwork',
                'AdoptedNodes',
                'Location',
                'Alerts',
                'TeamMembers',
                'InviteTeamMember',
                'SSIDList',
                'CreateSSID',
                'EditNetworkChannels',
                'ChannelScan',
                'SharingSettings',
                'ShareNetwork',
                'CreateNodeQR',
                'AboutPage',
                'FirmwareUpdateOverlay',
                'DiagnosticInfo'
              ].includes(routeName)) {
                return { backgroundColor: theme.primaryBackground, display: "none" }
            }
            return { backgroundColor: theme.primaryBackground }
          })(route),
        })}
          />
        </bottomTab.Navigator>
      )}
    </ManageThemeContext.Consumer>
  )
}

export default class Navigation extends PureComponent {
  constructor(props) {
    super()
  }
  render() {
    return (
      <NavigationContainer>
        <rootStack.Navigator screenOptions={{ headerShown: false }}>
          {this.props.user.data ? (

            <>
              { console.log('[router.js] - User Logged in') }
              <rootStack.Screen 
                name='Splash' 
                component={Splash}
              />
              <rootStack.Screen 
                name='TabScreens' 
                component={TabScreens}
              />
              <rootStack.Screen 
                name='BleSearchStackOfflineScreens' 
                component={BleSearchStackOfflineScreens}
              />
            </>
          ) : (
            <>
              { console.log('[router.js] - User Not Logged in') }
              <rootStack.Screen 
                name='Splash' 
                component={Splash}
              />
              <rootStack.Screen 
                name='LoginStackScreens' 
                component={LoginStackScreens}
              />
              <rootStack.Screen 
                name='BleSearchStackOfflineScreens' 
                component={BleSearchStackOfflineScreens}
              />
            </>
          )}
          
        </rootStack.Navigator>
      </NavigationContainer>
    )
  }
  
}