import { Button, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import ExpoBackgroundStreamer from "expo-background-streamer";
import { useState } from "react";
import { CircularProgressBar } from "@/components/progress";
import { useFont } from "@shopify/react-native-skia";
import { useSharedValue } from "react-native-reanimated";

export default function HomeScreen() {
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
          ExpoBackgroundStreamer.addListener("upload-progress", (event) => {
            percentage.value = event.progress;

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
                fileName: asset.fileName,
                fileType: asset.mimeType,
              }),
            }
          );

          const signedUrl = (await signedUrlResp.json()).signedUrl;

          await ExpoBackgroundStreamer.startUpload({
            url: signedUrl,
            path: asset.uri,
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

          setUploadInProgress(true);
        } catch (e) {
          console.log("error", e);
        }
      });
    }
  };

  const font = useFont(require("../../assets/fonts/Roboto-Bold.ttf"), 60);

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
        <Button title="Upload" onPress={handleUpload} />
      )}
    </View>
  );
}
