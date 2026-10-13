
export async function analyzeImageDemo(file) {
  if (!file) {
    throw new Error("Pehle image upload karo.");
  }

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error("JPG, PNG, WEBP ya GIF image upload karo.");
  }

  if (file.size > 4 * 1024 * 1024) {
    throw new Error("Image 4 MB se chhoti honi chahiye.");
  }

  const dimensions = await new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      const info = {
        width: image.naturalWidth,
        height: image.naturalHeight,
      };

      URL.revokeObjectURL(objectUrl);
      resolve(info);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Image open nahi ho saki."));
    };

    image.src = objectUrl;
  });

  return {
    demo: true,
    heading: "Demo analysis completed",
    summary:
      "This is a demo report. No AI model analyzed the image.",
    details: [
      `File name: ${file.name}`,
      `Dimensions: ${dimensions.width} × ${dimensions.height} pixels`,
      `Format: ${file.type}`,
      `File size: ${(file.size / 1024).toFixed(1)} KB`,
    ],
    observations: [
      "Main subject: Not identified in demo mode.",
      "Objects: Not detected in demo mode.",
      "Scene description: Real AI analysis is not enabled.",
    ],
  };
}
