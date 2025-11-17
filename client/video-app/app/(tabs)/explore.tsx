import Video from "react-native-video";

export default function TabTwoScreen() {
  return (
    <Video
      source={{
        uri: "https://d3iqjh3sijq7w3.cloudfront.net/processed/IMG_4699/IMG_4699.m3u8",
      }}
      style={{ width: "100%", height: "100%" }}
      controls
    />
  );
}
