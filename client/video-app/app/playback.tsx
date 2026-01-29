import { videoState } from "@/stores/video";
import Video from "react-native-video";
import { useSnapshot } from "valtio";

export default function PlaybackScreen() {
  const snap = useSnapshot(videoState);

  const url = `https://${process.env.EXPO_PUBLIC_DISTRIBUTION_DOMAIN}/processed/${snap.lastFileName}/${snap.lastFileName}.m3u8`;

  console.log("url", url);

  return (
    <Video
      source={{
        uri: url,
      }}
      style={{ flex: 1 }}
      controls
      key={url}
      onError={(e) => {
        console.log(e);
      }}
    />
  );
}
