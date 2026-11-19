# 內建的第三方檔案

| 檔案 | 來源 | 授權 |
|---|---|---|
| `mediapipe/` | `@mediapipe/tasks-vision` 1.1.1（npm） | Apache License 2.0 |
| `models/pose_landmarker_full.task` | MediaPipe Pose Landmarker（full, float16, 版本 1） | Apache License 2.0 |
| `models/deeplab_v3.tflite` | MediaPipe Image Segmenter DeepLab v3（float32, 版本 1） | Apache License 2.0 |
| `../fonts/NotoSans*.woff2` | Noto Sans TC／JP（只保留用到的字，`tools/build-fonts.py` 產生） | SIL Open Font License 1.1（`../fonts/OFL.txt`） |

Apache License 2.0 全文：https://www.apache.org/licenses/LICENSE-2.0

## 修改紀錄

- `mediapipe/vision_bundle_esm.js`（原檔名 vision_bundle.mjs，改成 .js 是為了每種伺服器都認得）：關閉使用統計上傳（原本每 60 秒把使用紀錄送到 `odml.pa.googleapis.com`）。
  `flush()` 一開始就清空、直接結束，網址也改成空字串。App 因此完全不連網。
