import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { MapPin, ExternalLink } from 'lucide-react-native';

export const MapView = View;
export const Marker = View;
export const Polyline = View;

export function MapPickerView({ latitude, longitude, onLocationSelect }: {
  latitude: number;
  longitude: number;
  onLocationSelect: (lat: number, lng: number) => void;
}) {
  return (
    <View style={styles.mapPickerPlaceholder}>
      <MapPin size={32} color="#F59E0B" />
      <Text style={styles.placeholderText}>
        Map picker not available on web
      </Text>
      <Text style={styles.placeholderSubtext}>
        Please enter latitude and longitude manually
      </Text>
    </View>
  );
}

export function RestaurantMapView({ latitude, longitude, name, address }: {
  latitude: number;
  longitude: number;
  name: string;
  address: string;
}) {
  const openInGoogleMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  return (
    <TouchableOpacity 
      style={styles.mapPlaceholder}
      onPress={openInGoogleMaps}
      activeOpacity={0.8}
    >
      <MapPin size={32} color="#2D6A4F" />
      <Text style={styles.placeholderText}>
        {name}
      </Text>
      <View style={styles.linkContainer}>
        <ExternalLink size={16} color="#2D6A4F" />
        <Text style={styles.linkText}>
          Open in Google Maps
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  mapPickerPlaceholder: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  mapPlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    backgroundColor: '#E8F5F0',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  placeholderText: {
    fontSize: 16,
    color: '#2D6A4F',
    fontWeight: '600',
  },
  placeholderSubtext: {
    fontSize: 12,
    color: '#666',
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  linkText: {
    fontSize: 14,
    color: '#2D6A4F',
    fontWeight: '600',
  },
});
