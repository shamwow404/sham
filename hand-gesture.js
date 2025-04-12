import * as handPose from "@tensorflow-models/handpose";
import "@tensorflow/tfjs-backend-webgl";

let video, model, canvas, ctx, gestureLabel = "";

async function setupHandGestureApp(container) {
  // Add video + canvas
  container.innerHTML = `
    <video id="hand-video" autoplay playsinline style="display:none;"></video>
    <canvas id="hand-canvas"></canvas>
    <div id="gesture-label" style="position:absolute; top:10px; left:10px; color:white; font-size:1.5em;"></div>
  `;

  video = document.getElementById("hand-video");
  canvas = document.getElementById("hand-canvas");
  ctx = canvas.getContext("2d");

  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;

  await new Promise(resolve => video.onloadedmetadata = resolve);
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  model = await handPose.load();

  runDetection();
}

async function runDetection() {
  const predictions = await model.estimateHands(video);

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  if (predictions.length > 0) {
    const landmarks = predictions[0].landmarks;

    // Example: thumb tip and index tip distance
    const dx = landmarks[4][0] - landmarks[8][0];
    const dy = landmarks[4][1] - landmarks[8][1];
    const dist = Math.sqrt(dx*dx + dy*dy);

    // Simple rules
    if (dist < 40) {
      gestureLabel = "Pinch";
    } else if (landmarks[8][1] < landmarks[6][1]) {
      gestureLabel = "Pointing";
    } else {
      gestureLabel = "Open Hand";
    }

    document.getElementById("gesture-label").innerText = gestureLabel;
  }

  requestAnimationFrame(runDetection);
}

export { setupHandGestureApp };
