import React, { PureComponent } from 'react'
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert } from 'react-native'
import { Button, DefaultHeaderHOC, SegmentedControlTab } from '../components'
import { ManageThemeContext } from '../theme/ThemeManager'

export default class SharingSettings extends PureComponent {
  componentDidMount() {
    const { route, getSharedUsers } = this.props
    const networkId = route.params?.networkId
    getSharedUsers(networkId)
  }

  toShareNetwork = () => {
    const { navigation, route } = this.props
    const networkId = route.params?.networkId
    navigation.navigate('ShareNetwork', { networkId })
  }

  updateUserRole = (index, user_id) => {
    const { route, updateUserSharedRole } = this.props
    const networkId = route.params?.networkId ?? null

    updateUserSharedRole(networkId, { id: user_id, role: index === 0 ? 'USER' : 'OWNER' })
  }

  actionWithUser = id => {
    const { route, revokeUserAccess, revokeNetworks } = this.props
    const networkId = route.params?.networkId ?? null
    Alert.alert('Are you sure to revoke access to this user', '', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Revoke access',
        style: 'destructive',
        onPress: () => {
          revokeUserAccess(id, revokeNetworks, networkId)
        },
      },
    ])
  }

  render() {
    const { navigation, shared } = this.props
    console.log('[SharingSettings.js] - shared', shared)
    return (
      <ManageThemeContext.Consumer>
        {({ theme }) => (
          <DefaultHeaderHOC title="Sharing Settings" navigation={navigation}>
            <View style={{ ...styles.container, backgroundColor: theme.primaryBackground }}>
              {shared.length ? (
                <>
                  <Text style={styles.sectionTitle}>Users list</Text>
                  <View style={styles.flex}>
                    <FlatList
                      keyExtractor={item => item.user_id.toString()}
                      contentContainerStyle={{ ...styles.contentContainer, borderColor: theme.primaryBorder }}
                      data={shared}
                      renderItem={({ item: { user_id, username, email, role = 'USER' } }) => (
                        <TouchableOpacity
                          style={{
                            ...styles.item,
                            backgroundColor: theme.primaryCardBgr,
                            borderColor: theme.primaryBorder,
                          }}
                          onLongPress={() => this.actionWithUser(user_id)}>
                          <View style={styles.flex}>
                            <Text numberOfLines={1} style={{ ...styles.userName, color: theme.primaryText }}>
                              {username}
                            </Text>
                          </View>
                          <View style={styles.roleTab}>
                            <SegmentedControlTab
                              values={['Viewer', 'Manager']}
                              selectedIndex={role === 'USER' ? 0 : 1}
                              onTabPress={index => this.updateUserRole(index, user_id)}
                            />
                          </View>
                        </TouchableOpacity>
                      )}
                      ItemSeparatorComponent={() => (
                        <View style={{ ...styles.separator, backgroundColor: theme.primaryBorder }} />
                      )}
                    />
                  </View>
                </>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.userName}>Network is not shared</Text>
                </View>
              )}
              <View style={styles.buttonWrap}>
                <Button active text="Add new Shared User" onPress={this.toShareNetwork} />
              </View>
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
  },
  contentContainer: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E6ECF5',
  },
  flex: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignContent: 'center',
    alignItems: 'center',
  },
  roleTab: {
    width: 140,
  },
  item: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  userName: {
    fontSize: 16,
    color: '#101114',
  },
  userEmail: {
    color: '#8F97A3',
    fontSize: 12,
    marginTop: 3,
  },
  separator: {
    height: 1,
  },
  sectionTitle: {
    color: '#666F7A',
    fontSize: 12,
    marginTop: 30,
    marginBottom: 12,
    marginHorizontal: 16,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  buttonWrap: {
    marginTop: 16,
  },
})
