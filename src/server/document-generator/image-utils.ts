import "server-only";

import {
  ACCEPTED_DOCUMENT_IMAGE_TYPES,
  DEFAULT_IMAGE_MAX_SIZE_MB,
} from "@/src/features/document-generator/types/document-schema";
import type {
  AcceptedDocumentImageType,
} from "@/src/features/document-generator/types/document-schema";

export type UploadedDocumentImage = {
  buffer: Buffer;
  fileName: string;
  mimeType: AcceptedDocumentImageType;
  naturalHeight?: number;
  naturalWidth?: number;
  size: number;
};

export type ImageValidationResult =
  | {
      image?: UploadedDocumentImage;
      success: true;
    }
  | {
      error: string;
      success: false;
    };

type ImageUploadValidationOptions = {
  acceptedTypes?: readonly AcceptedDocumentImageType[];
  label: string;
  maxSizeMb?: number;
  required: boolean;
};

function isAcceptedImageType(
  mimeType: string,
  acceptedTypes: readonly AcceptedDocumentImageType[],
): mimeType is AcceptedDocumentImageType {
  return acceptedTypes.includes(
    mimeType as AcceptedDocumentImageType,
  );
}

function hasPngSignature(buffer: Buffer) {
  return (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  );
}

function hasJpegSignature(buffer: Buffer) {
  return (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  );
}

function isValidImageDimension(value: number) {
  return Number.isFinite(value) && value > 0;
}

function readPngNaturalDimensions(buffer: Buffer) {
  if (!hasPngSignature(buffer) || buffer.length < 24) {
    return undefined;
  }

  const naturalWidth = buffer.readUInt32BE(16);
  const naturalHeight = buffer.readUInt32BE(20);

  return isValidImageDimension(naturalWidth) &&
    isValidImageDimension(naturalHeight)
    ? { naturalHeight, naturalWidth }
    : undefined;
}

function isJpegStartOfFrameMarker(marker: number) {
  return (
    (marker >= 0xc0 && marker <= 0xc3) ||
    (marker >= 0xc5 && marker <= 0xc7) ||
    (marker >= 0xc9 && marker <= 0xcb) ||
    (marker >= 0xcd && marker <= 0xcf)
  );
}

function isStandaloneJpegMarker(marker: number) {
  return marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9);
}

function readJpegNaturalDimensions(buffer: Buffer) {
  if (!hasJpegSignature(buffer)) {
    return undefined;
  }

  let offset = 2;

  while (offset < buffer.length) {
    while (offset < buffer.length && buffer[offset] === 0xff) {
      offset += 1;
    }

    if (offset >= buffer.length) {
      break;
    }

    const marker = buffer[offset];
    offset += 1;

    if (marker === 0xda) {
      break;
    }

    if (isStandaloneJpegMarker(marker)) {
      continue;
    }

    if (offset + 2 > buffer.length) {
      break;
    }

    const segmentLength = buffer.readUInt16BE(offset);

    if (segmentLength < 2 || offset + segmentLength > buffer.length) {
      break;
    }

    if (isJpegStartOfFrameMarker(marker) && offset + 7 <= buffer.length) {
      const naturalHeight = buffer.readUInt16BE(offset + 3);
      const naturalWidth = buffer.readUInt16BE(offset + 5);

      return isValidImageDimension(naturalWidth) &&
        isValidImageDimension(naturalHeight)
        ? { naturalHeight, naturalWidth }
        : undefined;
    }

    offset += segmentLength;
  }

  return undefined;
}

export function getImageNaturalDimensions(
  buffer: Buffer,
  mimeType?: AcceptedDocumentImageType,
) {
  if (mimeType === "image/png") {
    return readPngNaturalDimensions(buffer);
  }

  if (mimeType === "image/jpeg") {
    return readJpegNaturalDimensions(buffer);
  }

  return readPngNaturalDimensions(buffer) ?? readJpegNaturalDimensions(buffer);
}

export function getImageExtension(buffer: Buffer) {
  if (hasPngSignature(buffer)) {
    return "png";
  }

  if (hasJpegSignature(buffer)) {
    return "jpeg";
  }

  return "png";
}

function fileMatchesDeclaredType(
  buffer: Buffer,
  mimeType: AcceptedDocumentImageType,
) {
  if (mimeType === "image/png") {
    return hasPngSignature(buffer);
  }

  return hasJpegSignature(buffer);
}

function isProvidedFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && !(value.size === 0 && value.name === "");
}

function debugImageUpload(message: string, context: Record<string, unknown>) {
  if (process.env.DOCX_DEBUG !== "true") {
    return;
  }

  console.log(`[docx-generator] ${message}`, context);
}

export async function validateImageUpload(
  value: FormDataEntryValue | null,
  options: ImageUploadValidationOptions,
): Promise<ImageValidationResult> {
  const label = options.label;
  const acceptedTypes =
    options.acceptedTypes && options.acceptedTypes.length > 0
      ? options.acceptedTypes
      : ACCEPTED_DOCUMENT_IMAGE_TYPES;
  const maxSizeMb = options.maxSizeMb ?? DEFAULT_IMAGE_MAX_SIZE_MB;
  const maxSizeBytes = maxSizeMb * 1024 * 1024;

  if (!isProvidedFile(value)) {
    return options.required
      ? {
          error: `${label} is required.`,
          success: false,
        }
      : {
          success: true,
        };
  }

  if (!isAcceptedImageType(value.type, acceptedTypes)) {
    return {
      error: `${label} must be a PNG or JPEG image.`,
      success: false,
    };
  }

  if (value.size > maxSizeBytes) {
    return {
      error: `${label} must be smaller than ${maxSizeMb} MB.`,
      success: false,
    };
  }

  if (value.size === 0) {
    return {
      error: `${label} cannot be empty.`,
      success: false,
    };
  }

  const buffer = Buffer.from(await value.arrayBuffer());
  const naturalDimensions = getImageNaturalDimensions(buffer, value.type);

  debugImageUpload("upload buffer extracted", {
    bytes: buffer.length,
    fileName: value.name,
    mimeType: value.type,
  });

  if (!fileMatchesDeclaredType(buffer, value.type)) {
    return {
      error: `${label} content does not match its file type.`,
      success: false,
    };
  }

  return {
    image: {
      buffer,
      fileName: value.name,
      mimeType: value.type,
      naturalHeight: naturalDimensions?.naturalHeight,
      naturalWidth: naturalDimensions?.naturalWidth,
      size: value.size,
    },
    success: true,
  };
}
