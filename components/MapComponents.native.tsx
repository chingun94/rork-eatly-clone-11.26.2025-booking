import React from 'react';
import { StyleSheet, Linking, Platform } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

export { MapView, Marker, Polyline };

export function MapPickerView({ latitude, longitude, onLocationSelect }: {
  latitude: number;
  longitude: number;
  onLocationSelect: (lat: number, lng: number) => void;
}) {
  return (
    <MapView
      style={styles.mapPicker}
      initialRegion={{
        latitude,
        longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
      onPress={(e: any) => {
        const { latitude: lat, longitude: lng } = e.nativeEvent.coordinate;
        onLocationSelect(lat, lng);
      }}
    >
      <Marker
        coordinate={{
          latitude,
          longitude,
        }}
        title="Restaurant Location"
      />
    </MapView>
  );
}

export function RestaurantMapView({ latitude, longitude, name, address }: {
  latitude: number;
  longitude: number;
  name: string;
  address: string;
}) {
  const openInMaps = () => {
    const scheme = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(name)}@${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}(${encodeURIComponent(name)})`,
      default: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
    });
    Linking.openURL(scheme);
  };

  return (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
      scrollEnabled={false}
      zoomEnabled={false}
      onPress={openInMaps}
    >
      <Marker
        coordinate={{
          latitude,
          longitude,
        }}
        title={name}
        description={address}
        onPress={openInMaps}
      />
    </MapView>
  );
}

const styles = StyleSheet.create({
  mapPicker: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 12,
  },
  map: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
  },
});
