import React, { PureComponent } from 'react'
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete'
import Geocoder from 'react-native-geocoding'
import googlePlacesStyle from '../constants/googlePlacesStyle'
import { Map, HeaderGradient, Button } from '../components'
import { AlertHelper } from '../services'
import { ManageThemeContext } from '../theme/ThemeManager'
import CloseSVG from '../components/svg/Close.js'
import { GOOGLE_PLACE_FROM_LOCATION_API } from '../constants/constants'

Geocoder.init(GOOGLE_PLACE_FROM_LOCATION_API)
let googleRef
navigator.geolocation = require('react-native-geolocation-service')

const RenderFooter = ({ onDonePress, renderAutoComplete }) => (
  <ManageThemeContext.Consumer>
    {({ theme }) => (
      <View style={{ ...styles.footer, backgroundColor: theme.primaryBackground }}>
        {Platform.OS === 'android' && (
          <View style={styles.androidInputClearButtonWrapper}>
            <TouchableOpacity
              style={styles.androidInputClearButton}
              onPress={() => {
                console.log('[Location.js] - RenderFooter onPress')
                googleRef.current.setAddressText('')}
              }
            >
              <CloseSVG size={9} fill="#E7ECF4" />
            </TouchableOpacity>
          </View>
        )}

        {renderAutoComplete()}
        <View style={styles.buttonWrap}>
          <Button testID="LocationDone" active text="Done" onPress={onDonePress} />
        </View>
      </View>
    )}
  </ManageThemeContext.Consumer>
)

export default class Location extends PureComponent {
  constructor(props) {
    super()
    const defaultParams = {
      currentRegion: null,
      full_address: '',
      countryShortName: '',
      isShowMap: false,
      marker: null,
    }

    const { params } = props.route
    const currentRegion = params.currentRegion ? params.currentRegion : null

    this.state = currentRegion
      ? {
          currentRegion: {
            latitude: currentRegion.latitude,
            longitude: currentRegion.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          },
          full_address: currentRegion.full_address,
          countryShortName: '',
          isShowMap: false,
          marker: {
            latitude: currentRegion.latitude,
            longitude: currentRegion.longitude,
          },
        }
      : { ...defaultParams }

    this.google = React.createRef()
    googleRef = this.google
  }

  static navigationOptions = {
    gestureEnabled: false,
  }

  componentDidMount() {
    this.focusListener = this.props.navigation.addListener('focus', () => {
      this.setState({ isShowMap: true })
    })

  }

  componentWillUnmount() {
    this.focusListener()
  }

  setPosition = ({ latitude, longitude }) => {
    // console.log(`latitude: ${latitude}, long: ${longitude}`);
    Geocoder.from({ lat: latitude, lng: longitude })
      .then((res) => {
        // console.log("res: ", res.results[0].address_components);
        this.setAddress(res.results[0].formatted_address, res.results[0].address_components[3].long_name, latitude, longitude)
        this.google.current.setAddressText(res.results[0].formatted_address)
      })
      .catch((err) => {
        console.log('[Location.js] - setPosition error, ', err)
      })
  }

  setAddress = (formattedAddress, countryShortName, latitude, longitude) => {
    this.setState({
      full_address: formattedAddress,
      countryShortName,
      latitude,
      longitude,
      marker: {
        latitude,
        longitude,
      },
      currentRegion: {
        latitude,
        longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      },
    })
  }

  onDonePress = () => {
    console.log('[Location.js] - onDonePress')
    const { full_address, countryShortName, latitude, longitude } = this.state
    if (full_address && countryShortName && latitude && longitude) {
      this.goBack()
      const { params } = this.props.route
      if (params) params.onSetNetworkCoords(full_address, countryShortName, latitude, longitude)
    } else {
      const currentRegion = this.props.route.params?.currentRegion
      if (currentRegion && currentRegion.full_address.trim()) {
        this.goBack()
      } else {
        AlertHelper.alert('info', 'Alert', 'You need to choose location')
      }
    }
  }

  goBack = () => {
    this.props.navigation.goBack(null)
  }

  renderHeader = () => (
    <>
      <HeaderGradient onPress={this.goBack} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Location</Text>
        <Text style={styles.headerSubtitle}>Set location on map or type an address</Text>
      </View>
    </>
  )

  addMarker = (coordinates) => {
    this.setState({ marker: coordinates }, this.setPosition(coordinates))
  }

  renderAutoComplete = () => {
    const { params } = this.props.route
    const full_address = params.currentRegion ? params.currentRegion.full_address : ''

    return (
      <GooglePlacesAutocomplete
        ref={this.google}
        placeholder="Enter location address"
        minLength={2}
        autoFocus={false}
        returnKeyType="search"
        keyboardAppearance="light"
        listViewDisplayed={false}
        fetchDetails={true}
        renderDescription={(row) => row.description || row.formatted_address || row.name}
        getDefaultValue={() => full_address.trim()}
        currentLocation={true}
        debounce={200}
        enablePoweredByContainer={false}
        currentLocationLabel="Current location"
        nearbyPlacesAPI="GooglePlacesSearch"
        filterReverseGeocodingByTypes={['locality', 'administrative_area_level_3']}
        query={{
          key: 'AIzaSyCtVAof0vlD1CgoKvAoEdaWG99SG0fEXDA',
          language: 'en',
        }}
        onPress={(_, details = null) => {
          console.log('[Location.js] - GooglePlacesAutocomplete onPress')
          const short_code = details.address_components.find((item) => item.types.includes('country')).short_name
          this.props.setAddress(
            details.formatted_address,
            short_code,
            details.geometry.location.lat,
            details.geometry.location.lng,
          )
        }}
        styles={
          Platform.OS === 'android'
            ? {
                ...googlePlacesStyle,
                textInput: {
                  ...googlePlacesStyle.textInput,
                  paddingRight: 44,
                },
              }
            : googlePlacesStyle
        }
      />
    )
  }

  renderMap = () => (
    <Map
      offset={144}
      markers={[]}
      marker={this.state.marker}
      currentRegion={this.state.currentRegion}
      setCurrentRegion={this.setPosition}
      onPress={(e) => this.addMarker(e.nativeEvent.coordinate)}
    />
  )

  render() {
    const { isShowMap } = this.state
    // const { navigation } = this.props
    return (
      <>
        {isShowMap && this.renderMap()}
        {this.renderHeader()}
        <KeyboardAvoidingView style={styles.container} keyboardVerticalOffset={0} behavior="padding">
          <RenderFooter
            onDonePress={this.onDonePress}
            // navigation={navigation}
            // setAddress={this.setAddress}
            renderAutoComplete={this.renderAutoComplete}
          />
        </KeyboardAvoidingView>
      </>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    justifyContent: 'space-around',
    position: 'absolute',
    bottom: 0,
  },
  androidInputClearButtonWrapper: {
    zIndex: 1,
    position: 'absolute',
    top: 30,
    right: 30,
  },
  androidInputClearButton: {
    width: 20,
    height: 20,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#B9BDC3',
  },
  footer: {
    width: '100%',
    paddingTop: 16,
    justifyContent: 'space-between',
    alignSelf: 'flex-end',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: '#fff',
  },
  header: {
    position: 'absolute',
    width: '70%',
    height: '20%',
    alignSelf: 'center',
    alignItems: 'center',
    alignContent: 'center',
    justifyContent: 'center',
    top: 0,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
  },
  headerSubtitle: {
    color: '#fff',
    fontWeight: '500',
  },
  buttonWrap: {
    marginTop: 16,
  },
})
