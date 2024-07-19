import React, { Component } from 'react'
import { StyleSheet, View, ScrollView } from 'react-native'
import { Field, SelectBox, DefaultHeaderHOC, EditNetworkChannels } from '../components'
import { ManageThemeContext } from '../theme/ThemeManager'

export default class CreateNetwork extends Component {
  state = {
    // eslint-disable-next-line react/no-unused-state
    networkName: '',
    full_address: '',
    latitude: 0,
    longitude: 0,
  }

  onSelectLocation = () => {
    const { full_address, latitude, longitude } = this.state
    const isEdit = full_address && latitude && longitude
    this.props.navigation.navigate('Location', {
      currentRegion: isEdit ? { full_address, latitude, longitude } : null,
      // eslint-disable-next-line no-shadow
      onSetNetworkCoords: (full_address, _, latitude, longitude) => {
        this.setState({ full_address, latitude, longitude })
      },
    })
  }

  render() {
    const { navigation, createNetwork } = this.props

    return (
      <ManageThemeContext.Consumer>
        {({ theme }) => (
          <DefaultHeaderHOC title="Create Network" navigation={this.props.navigation}>
            <View style={{ ...styles.container, backgroundColor: theme.primaryBackground }}>
              <ScrollView>
                <View
                  style={{
                    ...styles.section,
                    backgroundColor: theme.primaryCardBgr,
                    borderColor: theme.primaryBorder,
                  }}>
                  <View style={styles.fieldWrap}>
                    <Field
                      testID="CreateNetworkName"
                      label="Network name"
                      placeholder="Enter network name"
                      onChangeText={text => this.setState({ networkName: text })}
                    />
                  </View>

                  <SelectBox
                    testID="CreateNetworkLocation"
                    disableBorderBottom
                    title="Location"
                    subTitle={this.state.full_address || 'Street, City, Zip Code'}
                    onPress={this.onSelectLocation}
                  />
                </View>

                <EditNetworkChannels
                  navigation={navigation}
                  newNetworkData={this.state}
                  createNetwork={createNetwork}
                />
              </ScrollView>
            </View>
          </DefaultHeaderHOC>
        )}
      </ManageThemeContext.Consumer>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  section: {
    marginTop: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  fieldWrap: {
    paddingHorizontal: 16,
  },
})
