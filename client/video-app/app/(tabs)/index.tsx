import { Button, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import ExpoBackgroundStreamer from "expo-background-streamer";

export default function HomeScreen() {
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
            console.log(`Upload: ${event.progress}% - ${event.speed} bytes/s`);
            console.log(`ETA: ${event.estimatedTimeRemaining}s`);
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
        } catch (e) {
          console.log("error", e);
        }
      });
    }
  };

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Button title="Upload" onPress={handleUpload} />
    </View>
  );
}
