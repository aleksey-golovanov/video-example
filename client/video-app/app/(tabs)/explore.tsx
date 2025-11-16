import Video from "react-native-video";

export default function TabTwoScreen() {
  return (
    <Video
      source={{
        uri: "https://sample.vodobox.net/skate_phantom_flex_4k/skate_phantom_flex_4k.m3u8",
      }}
      style={{ width: "100%", height: "100%" }}
      controls
    />
  );
}
