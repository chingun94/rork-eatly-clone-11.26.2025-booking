export function MapPickerView(props: {
  latitude: number;
  longitude: number;
  onLocationSelect: (lat: number, lng: number) => void;
}): JSX.Element;

export function RestaurantMapView(props: {
  latitude: number;
  longitude: number;
  name: string;
  address: string;
}): JSX.Element;

export { default as MapView, Marker, Polyline } from 'react-native-maps';
