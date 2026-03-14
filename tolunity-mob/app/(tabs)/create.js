import { Redirect } from 'expo-router';
// This tab is hidden in _layout.js (href: null)
// Redirect to create-post full screen
export default function CreateTab() {
  return <Redirect href="/create-post" />;
}