const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const fileInput = document.getElementById("fileInput");
const dropzone = document.getElementById("dropzone");

const pinterestStickers = [
  "https://i.pinimg.com/736x/7a/7c/e8/7a7ce8ec063d4eb092807ed37ef263f2.jpg",
  "https://i.pinimg.com/736x/e3/09/35/e30935609ccc365b82aaf24914708c2b.jpg",
  "https://i.pinimg.com/736x/21/4b/8c/214b8c17f8172604f6caf0740559340e.jpg",
  "https://i.pinimg.com/736x/8d/fe/68/8dfe6843f9a696716541a4e83d62e432.jpg",
  "https://i.pinimg.com/736x/2a/29/41/2a2941ac75c3bd40a39eaf2677ba8b64.jpg",
  "https://i.pinimg.com/736x/3d/f8/a4/3df8a4ce590bc0d62f0f987f6e21735c.jpg",
  "https://i.pinimg.com/736x/84/a4/e5/84a4e57b33f330e76a010417baf5851e.jpg",
  "https://i.pinimg.com/736x/53/4d/c4/534dc403da32b2cdcd59299601296909.jpg",
  "https://i.pinimg.com/736x/62/5f/d9/625fd964da0a989f795e65e8da1a7551.jpg",
  "https://i.pinimg.com/736x/71/ab/00/71ab00e217c70c746a25e6290b27e864.jpg"
];

let originalImage = null;
let stickers = [];
let textLayers = [];

let imageState = {
  rotation: 0,
  scale: 1,
  flipX: false,
  flipY: false
};

document.getElementById("pinterestStickers").innerHTML = pinterestStickers
  .map(url => {
    const thumbnail = url.replace("/736x/", "/236x/");
    return `<button class="sticker image-sticker" data-url="${url}">
      <img src="${thumbnail}" alt="Pinterest sticker">
    </button>`;
  })
  .join("");

document.querySelectorAll(".image-sticker").forEach(button => {
  button.addEventListener("click", () => addImageSticker(button.dataset.url));
});

document.querySelectorAll(".emoji").forEach(button => {
  button.addEventListener("click", () => addEmojiSticker(button.dataset.emoji));
});

document.querySelectorAll("[data-rotate]").forEach(button => {
  button.addEventListener("click", () => {
    imageState.rotation += Number(button.dataset.rotate);
    render();
  });
});

document.querySelectorAll("[data-flip]").forEach(button => {
  button.addEventListener("click", () => {
    const axis = button.dataset.flip;

    if (axis === "x") imageState.flipX = !imageState.flipX;
    if (axis === "y") imageState.flipY = !imageState.flipY;

    render();
  });
});

document.getElementById("scale").addEventListener("input", event => {
  imageState.scale = Number(event.target.value);
  render();
});

document.getElementById("addText").addEventListener("click", addText);
document.getElementById("reset").addEventListener("click", resetCanvas);
document.getElementById("export").addEventListener("click", exportImage);

dropzone.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", event => {
  loadFile(event.target.files[0]);
});

["dragover", "dragenter"].forEach(eventName => {
  dropzone.addEventListener(eventName, event => event.preventDefault());
});

dropzone.addEventListener("drop", event => {
  event.preventDefault();
  loadFile(event.dataTransfer.files[0]);
});

function loadFile(file) {
  if (!file || !file.type.startsWith("image/")) return;

  const reader = new FileReader();

  reader.onload = event => {
    originalImage = new Image();

    originalImage.onload = () => {
      stickers = [];
      textLayers = [];
      imageState = {
        rotation: 0,
        scale: 1,
        flipX: false,
        flipY: false
      };

      dropzone.hidden = true;
      render();
    };

    originalImage.src = event.target.result;
  };

  reader.readAsDataURL(file);
}

function render() {
  if (!originalImage) return;

  const radians = imageState.rotation * Math.PI / 180;
  const sine = Math.abs(Math.sin(radians));
  const cosine = Math.abs(Math.cos(radians));

  canvas.width = Math.round(
    (originalImage.width * cosine + originalImage.height * sine) *
    imageState.scale
  );

  canvas.height = Math.round(
    (originalImage.width * sine + originalImage.height * cosine) *
    imageState.scale
  );

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(radians);

  ctx.scale(
    (imageState.flipX ? -1 : 1) * imageState.scale,
    (imageState.flipY ? -1 : 1) * imageState.scale
  );

  ctx.drawImage(
    originalImage,
    -originalImage.width / 2,
    -originalImage.height / 2
  );

  ctx.restore();

  stickers.forEach(sticker => {
    const x = sticker.x * canvas.width;
    const y = sticker.y * canvas.height;

    if (sticker.image) {
      const size = Math.min(canvas.width, canvas.height) * 0.26;
      ctx.drawImage(sticker.image, x - size / 2, y - size / 2, size, size);
    } else {
      ctx.font = `${80 * imageState.scale}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(sticker.emoji, x, y);
    }
  });

  textLayers.forEach(layer => {
    ctx.font = `${74 * imageState.scale}px "${layer.font}", sans-serif`;
    ctx.fillStyle = layer.color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(
      layer.text,
      layer.x * canvas.width,
      layer.y * canvas.height
    );
  });
}

function addEmojiSticker(emoji) {
  if (!originalImage) return;

  stickers.push({
    emoji,
    x: 0.3 + Math.random() * 0.4,
    y: 0.3 + Math.random() * 0.4
  });

  render();
}

function addImageSticker(url) {
  if (!originalImage) return;

  const stickerImage = new Image();
  stickerImage.crossOrigin = "anonymous";

  stickerImage.onload = () => {
    stickers.push({
      image: stickerImage,
      x: 0.3 + Math.random() * 0.4,
      y: 0.3 + Math.random() * 0.4
    });

    render();
  };

  stickerImage.src = url;
}

function addText() {
  const text = document.getElementById("textInput").value.trim();

  if (!originalImage || !text) return;

  textLayers.push({
    text,
    font: document.getElementById("fontSelect").value,
    color: document.getElementById("textColor").value,
    x: 0.5,
    y: 0.5
  });

  document.getElementById("textInput").value = "";
  render();
}

function resetCanvas() {
  if (!originalImage) return;

  stickers = [];
  textLayers = [];

  imageState = {
    rotation: 0,
    scale: 1,
    flipX: false,
    flipY: false
  };

  document.getElementById("scale").value = 1;
  render();
}

function exportImage() {
  if (!originalImage) return;

  const link = document.createElement("a");
  link.download = "pixelcraft-edit.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}