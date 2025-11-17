import { Button, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import ExpoBackgroundStreamer from "expo-background-streamer";
import { useState } from "react";
import { CircularProgressBar } from "@/components/progress";
import { useFont } from "@shopify/react-native-skia";
import { useSharedValue } from "react-native-reanimated";
import { videoState } from "@/stores/video";
import { useSnapshot } from "valtio";
import { useRouter } from "expo-router";
import { Video } from "react-native-compressor";

export default function HomeScreen() {
  const snap = useSnapshot(videoState);
  const router = useRouter();

  const [uploadInProgress, setUploadInProgress] = useState(false);

  const percentage = useSharedValue(0);

  const handleUpload = async () => {
    const response = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      allowsMultipleSelection: true,
      selectionLimit: 0,
    });

    console.log(response.assets);

    if (response.assets) {
      response.assets.forEach(async (asset) => {
        try {
          setUploadInProgress(true);

          const result = await Video.compress(
            asset.uri,
            {
              progressDivider: 10,
              downloadProgress: (progress) => {
                console.log("downloadProgress: ", progress);
              },
            },
            (progress) => {
              percentage.value = (progress * 100) / 2;
              console.log("Compression Progress: ", progress);
            }
          );

          console.log("result", result);

          const compressedAsset = {
            fileName: result.split("/").pop(),
            mimeType: "video/mp4",
            uri: result,
          };

          videoState.lastFileName =
            compressedAsset.fileName?.split(".")[0] || "";

          ExpoBackgroundStreamer.addListener("upload-progress", (event) => {
            percentage.value = 50 + event.progress / 2;

            if (event.progress === 100) {
              setUploadInProgress(false);
              percentage.value = 0;
            }
          });

          const signedUrlResp = await fetch(
            "https://uye6vrtxqg.execute-api.us-east-1.amazonaws.com/prod/signed-url",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                fileName: compressedAsset.fileName,
                fileType: compressedAsset.mimeType,
              }),
            }
          );

          const signedUrl = (await signedUrlResp.json()).signedUrl;

          await ExpoBackgroundStreamer.startUpload({
            url: signedUrl,
            path: compressedAsset.uri,
            headers: {
              "Content-Type": "application/octet-stream",
            },
            method: "PUT",
            encryption: {
              enabled: false,
              key: "",
              nonce: "",
            },
          });
        } catch (e) {
          console.log("error", e);
        }
      });
    }
  };

  const font = useFont(require("../assets/fonts/Roboto-Bold.ttf"), 60);

  if (!font) {
    return <View />;
  }

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      {uploadInProgress ? (
        <CircularProgressBar
          radius={120}
          strokeWidth={20}
          font={font}
          percentage={percentage}
        />
      ) : (
        <>
          <Button title="Upload" onPress={handleUpload} />
          {snap.lastFileName && (
            <Button title="Play" onPress={() => router.push("/playback")} />
          )}
        </>
      )}
    </View>
  );
}
